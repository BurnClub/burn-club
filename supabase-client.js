// ---------------- Supabase client (2026-09-18) ----------------
// One place the three apps get a configured client from. Loaded before app.js;
// the UMD bundle it depends on is pinned in index.html.
//
// Both values below are public by design. The publishable key ships in every
// Supabase web app's JavaScript and is not a secret — row-level security is
// what protects the data, which is why every table has a policy and none is
// readable without a signed-in session. The service_role key is the opposite
// and must never appear in anything the browser loads.
const SUPABASE_URL = "https://nuszxjopsxwpywojbrdw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_hCeLK3T8z-vl_PYMYlPj7Q_EkzjMoLI";

// Guard rather than assume: if the CDN script is blocked — an ad blocker, a
// gym's captive wifi, an offline start — `supabase` is undefined and every
// call below would throw somewhere unhelpful. Failing here means the app can
// say so instead of half-rendering.
//
// Every request gets a time limit (2026-11-17, tester T-1/T-2). The browser's
// own fetch has none, so on a connection that accepts a request and never
// answers — gym wifi behind a sign-in page, one bar of signal — a call simply
// never returned, and everything written to cope with a FAILED request never
// ran. This turns "no answer" into the failure the rest of the app already
// handles. It throws a TypeError worded like a real network failure on
// purpose: that is what isOfflineError() and supabase-js both recognise.
// Uploads to Storage get longer, because a photo on a slow link is slow
// without being stuck.
const REQUEST_TIMEOUT_MS = 12000;
const UPLOAD_TIMEOUT_MS = 60000;

function timedFetch(input, init) {
  const url = typeof input === "string" ? input : ((input && input.url) || "");
  const ms = url.indexOf("/storage/v1/") !== -1 ? UPLOAD_TIMEOUT_MS : REQUEST_TIMEOUT_MS;
  const ctl = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; ctl.abort(); }, ms);
  const outer = init && init.signal;
  if (outer) {
    if (outer.aborted) ctl.abort();
    else outer.addEventListener("abort", () => ctl.abort(), { once: true });
  }
  return fetch(input, Object.assign({}, init, { signal: ctl.signal }))
    .catch((e) => {
      if (timedOut) throw new TypeError("Failed to fetch (no answer after " + (ms / 1000) + "s)");
      throw e;
    })
    .finally(() => clearTimeout(timer));
}

// Resolves with `fallback` if the promise has not settled in time. The promise
// itself is not cancelled, only no longer waited for.
function within(promise, ms, fallback) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => resolve(fallback), ms);
    Promise.resolve(promise).then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
    );
  });
}

const SB = (typeof supabase !== "undefined" && supabase.createClient)
  ? supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      global: { fetch: timedFetch },
      auth: {
        // Keeps the member signed in across reloads and app launches, which
        // for a gym app matters: nobody wants to type a password between sets.
        persistSession: true,
        autoRefreshToken: true,
        // The invite link comes back with tokens in the URL fragment; this is
        // what turns that into a session on first sign-in.
        detectSessionInUrl: true,
      },
    })
  : null;

function supabaseReady() {
  return !!SB;
}

// Why a call failed, in words a member can act on. Postgres and PostgREST
// error text is written for whoever wrote the query, not whoever is holding
// the phone.
function friendlyDbError(error) {
  if (!error) return null;
  const code = error.code || "";
  if (code === "PGRST301" || error.status === 401) return "Your session expired — sign in again.";
  if (code === "42501") return "You don't have access to that.";
  if (code === "23505") return "That's already saved.";
  if (code === "23503") return "That refers to something that no longer exists.";
  if (error.message && /fetch|network/i.test(error.message)) {
    return "Can't reach the server — you may be offline. Your work is saved on this device.";
  }
  return "Something went wrong saving that. It's saved on this device and will sync when it can.";
}

// Every read goes through here so a failure is logged once, in one shape,
// rather than each caller inventing its own handling.
async function dbSelect(table, build) {
  if (!SB) return { data: null, error: new Error("offline") };
  let q = SB.from(table).select("*");
  if (build) q = build(q);
  const { data, error } = await q;
  if (error) console.warn(`[db] select ${table}:`, error.message);
  return { data, error };
}

// ---------------- Auth (2026-09-18) ----------------
// Replaces a login handler that was `e.preventDefault()` and nothing else.
//
// Members never sign themselves up — Burn Club is invite-only, and accounts
// come from the member import. So there is no registration path here at all;
// the only ways in are a password you already set, or a link emailed to you.

// Set once a real session exists. Demo mode leaves it null, which is how the
// rest of the app can tell the two apart.

// ---------------- Offline entry (phase 4, 2026-10-01) ----------------
// A member in a gym with no signal must still get into their app. Everything
// they need is already on the phone; the only thing the network was doing at
// startup was confirming who they are, which this caches so a dead connection
// stops being a locked door.
const AUTH_CACHE_KEY = "burnclub-auth-cache";
let OFFLINE_ENTRY = false;          // true when we entered from the cache

function cacheAuthMember(member, program) {
  try {
    localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify({ member, program: program || null }));
  } catch (e) { /* a full or blocked store is not worth failing sign-in over */ }
}

function loadCachedAuthMember(userId) {
  try {
    const c = JSON.parse(localStorage.getItem(AUTH_CACHE_KEY) || "null");
    if (!c || !c.member) return null;
    // Never hand one member's cache to another account on a shared device.
    if (userId && c.member.id !== userId) return null;
    return c;
  } catch (e) { return null; }
}

// A cached profile is only worth having if it can actually OPEN the app
// (2026-11-20, tester T-37). This is the amplifier that made T-13's fix worse
// than the bug on a new phone:
//
//   first open, program lookup fails -> cacheAuthMember(member, null) writes a
//   profile with no program -> that entry is TRUTHY, so the next open thinks
//   this device has something saved -> it takes the 6-second path instead of
//   waiting properly -> it times out and enters from that same program-less
//   copy -> dead end on the "program unavailable" screen.
//
// So the retry was strictly worse than the first attempt, and stayed worse,
// on the one path every new invitee walks. Measured: 8.6s and in, then 6.0s
// and dead-ended three times running on the identical connection.
//
// Nothing is deleted — the entry stays, it just no longer counts as something
// to open on. An unusable copy is worse than none, because "none" still waits
// for the real answer.
function usableCachedProfile(cached) {
  if (!cached || !cached.member) return null;
  if (cached.member.program_id && !cached.program) return null;
  return cached;
}

function clearAuthCache() {
  try { localStorage.removeItem(AUTH_CACHE_KEY); } catch (e) {}
}

// Telling "the network is down" apart from "this account has a problem" is the
// whole point: the first must never sign anyone out, the second must.
// What to do when opening a returning member's account failed (2026-11-19,
// tester T-13). Lifted out of routeOnLoad() because it is the decision with
// the worst failure mode in the app: signing someone out on a bad connection
// strands them, since they cannot sign back in until the server is reachable
// again, and everything they have logged since is sitting on a phone that now
// shows a login form.
//
//   "enter"            nothing went wrong
//   "enter-from-cache" the server could not be asked, but this device holds a
//                      copy of the member — open it
//   "stay"             no copy to open, so say so, but keep the session
//   "sign-out"         the server says this account or session is no good; a
//                      cached copy must NOT be used, because work logged
//                      against a dead session could never sync
function entryDecision(res, hasSavedProfile) {
  if (!res || !res.error) return "enter";
  if (res.kind === "account") return "sign-out";
  return hasSavedProfile ? "enter-from-cache" : "stay";
}

// Which failures mean "your account is no good" rather than "I could not ask".
function isAccountProblem(error) {
  if (!error) return false;
  return error.code === "PGRST301" || error.status === 401 || error.status === 403;
}

// Why the current-password check needs more than one answer (2026-11-19,
// tester T-13): it is a real sign-in, so it counts against the auth rate
// limit. Two mistypes and a retry can trip it — and the member was then told
// the password they had just typed CORRECTLY did not match.
function passwordCheckError(error) {
  const msg = String((error && error.message) || "");
  const status = Number(error && error.status) || 0;
  if (/invalid login credentials/i.test(msg)) return "That current password doesn't match.";
  if (status === 429 || /rate limit|too many|for security purposes/i.test(msg)) {
    return "Too many attempts. Wait a minute, then try again.";
  }
  if (isOfflineError(error)) {
    return "Couldn't reach the server to check your password. Try again when you have a connection.";
  }
  return "Couldn't check your current password just now. Try again in a moment.";
}

function isOfflineError(error) {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  if (!error) return false;
  const text = `${error.message || ""} ${error.details || ""} ${error.name || ""}`;
  return /failed to fetch|networkerror|load failed|network request failed|timeout|typeerror/i.test(text);
}

let AUTH_MEMBER = null;
let AUTH_PROGRAM = null;

// within() stops WAITING for a slow answer; it does not cancel it. So a
// profile lookup abandoned at 6 seconds is still in flight, and when it lands
// it used to write the member straight back onto the phone — even if they had
// signed out in the meantime, which then let the next offline open walk into
// that member's app with no password (2026-11-20, tester T-38).
//
// sync.js already guards exactly this hazard for the data pull with
// abandonHydrate()/HYDRATE_GEN. The profile lookup was given the timeout and
// not the guard. This is that guard.
let AUTH_GEN = 0;
function abandonAuthLoad() { AUTH_GEN++; }

// Who this device is signed in as, read straight from where supabase-js keeps
// the session, without asking the network anything (2026-11-17, tester T-1).
//
// currentSession() cannot answer this on a bad connection: a token older than
// an hour has to be refreshed first, and when that cannot reach the server it
// reports "no session" — the same answer as for someone who never signed in.
// The stored copy tells the two apart. It is only removed when the server
// REFUSES the session or the member signs out; a refresh that merely could not
// get through leaves it in place.
// Why there is no stored user id, which is a different question from what it
// is (2026-11-20, tester T-14).
//
// storedSessionUserId() answers null for three situations that are nothing
// alike: a phone that was never signed in, a phone that was signed out, and a
// phone that IS signed in whose saved sign-in can no longer be read — cut off
// mid-write, half-overwritten, evicted in pieces under storage pressure. The
// first two want a quiet login form. The third is a member who is signed in,
// whose profile and program are very likely still sitting in the cache next
// to it, and who gets handed a blank login form with nothing written on it
// and no auth_events row to show it ever happened. That silence is why the
// first trial had failures nobody could account for afterwards.
//
// The key existing but yielding no id is the tell, and it costs one extra
// read to notice.
function storedSessionState() {
  let raw;
  try {
    const ref = new URL(SUPABASE_URL).hostname.split(".")[0];
    raw = localStorage.getItem("sb-" + ref + "-auth-token");
  } catch (e) {
    // localStorage itself is unavailable (Safari private mode, blocked
    // storage). Nothing is damaged; nothing can be read either, including the
    // cache, so there is no saved sign-in to speak of.
    return { state: "unreadable", uid: null, why: "storage unavailable" };
  }
  if (raw === null) return { state: "none", uid: null };
  let parsed = null;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return { state: "damaged", uid: null, why: "token is not valid JSON (" + raw.length + " bytes)" };
  }
  const uid = (parsed && parsed.user && parsed.user.id) || null;
  if (uid) return { state: "signed-in", uid };
  // Parsed, but not into a session. An empty string, a bare null, or a shape
  // with no user on it.
  return { state: "damaged", uid: null, why: parsed === null ? "token is empty" : "token has no user id" };
}

function storedSessionUserId() {
  return storedSessionState().uid;
}

function authedMemberId() {
  return AUTH_MEMBER ? AUTH_MEMBER.id : null;
}

async function currentSession() {
  if (!SB) return null;
  const { data } = await SB.auth.getSession();
  return data ? data.session : null;
}

// Supabase's auth errors are written for whoever wrote the integration. These
// are for someone standing in a gym who just wants to get in.
function friendlyAuthError(error) {
  if (!error) return null;
  const m = (error.message || "").toLowerCase();
  if (m.includes("invalid login credentials")) return "That email and password don't match. Check both and try again.";
  if (m.includes("email not confirmed")) return "Check your email and open the link we sent before signing in.";
  if (m.includes("signups not allowed")) return "Burn Club accounts are set up by your coach — ask them for an invite.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Wait a minute and try again.";
  if (m.includes("fetch") || m.includes("network")) return "Can't reach the server. Check your connection.";
  return "Couldn't sign you in. Try again, and tell your coach if it keeps happening.";
}

async function signIn(email, password) {
  if (!SB) return { error: "Can't reach the server. Check your connection." };
  const { data, error } = await SB.auth.signInWithPassword({ email: email.trim(), password });
  // Logged at every exit, because the interesting question after the first
  // trial is not "did sign-in work" but "how far did they get". A wrong
  // password and a password that was right but could not load a profile look
  // identical from the login form and are nothing alike.
  if (error) {
    logAuthEvent("signin_fail", error.message, email.trim());
    return { error: friendlyAuthError(error) };
  }
  const loaded = await loadAuthMember(data.user);
  if (loaded.error) {
    logAuthEvent("profile_fail", loaded.error, email.trim());
    return loaded;
  }
  logAuthEvent(loaded.offline ? "signin_ok_offline" : "signin_ok", null, email.trim());
  return { member: AUTH_MEMBER };
}

async function signOut() {
  SIGNING_OUT = true;
  // First, before anything is cleared: any profile lookup still in flight must
  // not be allowed to write the member back afterwards (tester T-38).
  abandonAuthLoad();
  logAuthEvent("signed_out", "member chose to sign out");
  clearAuthCache();
  AUTH_MEMBER = null;
  AUTH_PROGRAM = null;
  try {
    if (SB) await SB.auth.signOut();
  } finally {
    SIGNING_OUT = false;
  }
}

// The members row is the profile; the auth user is only an identity. RLS means
// this can only ever return the caller's own row, so there is no filter to
// forget here — the database will not serve anyone else's.
async function loadAuthMember(user) {
  if (!SB || !user) return { error: "Not signed in." };
  // Everything below commits only if this is still the current attempt.
  const gen = AUTH_GEN;
  const stale = () => gen !== AUTH_GEN;
  let data, error;
  try {
    ({ data, error } = await SB.from("members").select("*").eq("id", user.id).maybeSingle());
  } catch (e) {
    error = e;                      // supabase-js throws rather than returns on some network faults
  }
  if (error) {
    // Offline: enter from the cached profile. The member's history is already
    // on this device, and refusing to show it because a lookup failed is the
    // worst possible answer to bad signal.
    if (isOfflineError(error)) {
      if (stale()) return { abandoned: true, error: "Signed out before that could finish." };
      // usableCachedProfile, not loadCachedAuthMember: a copy with no program
      // cannot open the app, and entering on it only reaches a dead end
      // (tester T-37).
      const cached = usableCachedProfile(loadCachedAuthMember(user.id));
      if (cached) {
        AUTH_MEMBER = cached.member;
        AUTH_PROGRAM = cached.program || null;
        OFFLINE_ENTRY = true;
        return { member: cached.member, offline: true };
      }
      // kind, so the caller logs something readable and, more importantly,
      // does not mistake this for an account problem and sign them out.
      return { kind: "offline", error: "Can't reach the server, and this device has nothing saved to open yet." };
    }
    // An ACCOUNT problem and a SERVER problem need opposite answers, and the
    // caller cannot tell them apart from a string (2026-11-19, tester T-13).
    // It used to get friendlyDbError()'s wording, which is written for a
    // failed save — a member who could not be opened was told their work was
    // "saved on this device and will sync when it can", on the login screen,
    // after being signed out.
    const account = isAccountProblem(error);
    return {
      kind: account ? "account" : "server",
      error: account
        ? "Your session has expired — sign in again."
        : "Couldn't load your account just now. Check your connection, then close and reopen the app.",
    };
  }
  if (!data) {
    // An auth user with no profile row. The trigger should make this
    // impossible; saying so plainly beats rendering an app with no member.
    return { kind: "account", error: "Your account isn't finished setting up. Tell your coach." };
  }


  // The member's program comes with them. scheduleType decides whether the app
  // shows Workouts or Calendar, so taking it from the seeded demo profile
  // would put a real member in the wrong shape of app entirely.
  // The program lookup used to read `data` and ignore `error` entirely, so a
  // server that answered "no" was indistinguishable from a member with no
  // program: AUTH_PROGRAM stayed null, the demo profile's schedule filled the
  // gap, and — the part that actually lost something — the line below then
  // wrote that null over the saved copy, which is the only thing standing
  // between this member and a blank app the next time the signal is bad
  // (2026-11-19, tester T-13).
  let programFailed = false;
  let program = null;
  if (data.program_id) {
    let prog = null, progError = null;
    try {
      const r = await SB.from("programs").select("*").eq("id", data.program_id).maybeSingle();
      prog = r && r.data;
      progError = r && r.error;
    } catch (e) {
      progError = e;              // supabase-js throws rather than returns on some network faults
    }
    if (prog) {
      program = prog;
    } else if (progError) {
      // Failed, not absent. Keep whatever this device already had.
      const cached = loadCachedAuthMember(user.id);
      program = (cached && cached.program) || null;
      programFailed = !program;
      console.warn("[auth] program lookup failed:", progError.message || progError);
    } else {
      // Succeeded and the row is genuinely gone — a coach deleted it. Caching
      // null here is correct; it is the failure case above that must not.
      program = null;
    }
  }
  // The single commit point. Held to the end so an attempt that was abandoned
  // while it was in flight writes nothing at all — not the globals, and not
  // the cache on the member's phone (tester T-38).
  if (stale()) return { abandoned: true, error: "Signed out before that could finish." };
  AUTH_MEMBER = data;
  AUTH_PROGRAM = program;
  OFFLINE_ENTRY = false;
  cacheAuthMember(data, program);
  return { member: data, programUnavailable: programFailed };
}

// An invite or reset link returns with tokens in the URL fragment. The client
// is configured with detectSessionInUrl, so by the time this runs the session
// already exists — what is missing is a password the member chose themselves,
// which is the whole reason the spreadsheet never held one.
// NOTE (2026-10-16): a MAGIC LINK is caught by the `access_token=` test, not
// the type list — "magiclink" is deliberately not in it and does not need to
// be, but the two conditions are not interchangeable and the second one is
// load-bearing. Tester onboarding runs through here: Chris creates the account
// with a password in the dashboard, sends a magic link, and the member lands
// signed in on the set-a-password form. Narrowing this to the type list would
// break that path silently — they would arrive signed in with a password only
// Chris knows.
function arrivedFromEmailLink() {
  const hash = window.location.hash || "";
  return /type=(invite|recovery|signup|magiclink)/.test(hash) || /access_token=/.test(hash);
}

// A DEAD link comes back carrying an error instead of a token (2026-11-18,
// tester T-3). Nothing in the app read it, so a member whose invite had
// expired — or whose mail app or a corporate link scanner had already opened
// it once, which spends a single-use link without a human ever seeing it —
// landed on the ordinary login form with an empty error box. They have no
// password of their own yet, so there is nothing on that screen they can do,
// and admin saw nothing either: no request, no auth_events row. Half the
// invited testers never finished setup.
//
// Supabase returns it in the hash for the implicit flow and in the query
// string for PKCE, so both are read.
function emailLinkError() {
  const read = (raw) => new URLSearchParams(String(raw || "").replace(/^[#?]/, ""));
  for (const source of [window.location.hash, window.location.search]) {
    const p = read(source);
    const code = p.get("error_code") || p.get("error");
    if (!code) continue;
    return {
      code: String(code).slice(0, 60),
      description: String(p.get("error_description") || "").slice(0, 300),
    };
  }
  return null;
}

// ---------------- Auth visibility (2026-11-03) ----------------
// The first trial ran three days on a broken sign-in and produced no record of
// it at all. Everything below exists so the next one is watchable: who got in,
// who did not, and what the app said to them when it refused.

// Which build this browser is ACTUALLY running, asked of the service worker
// that is actually controlling the page.
//
// The first version of this inferred it from app.js's resource-timing entry,
// expecting to find the `?v=<CACHE>` stamp sw.js adds. That stamp is never
// visible to the page: a service worker's rewritten URL stays inside the
// worker, and the page's timing entry keeps the URL the page asked for. Every
// event logged "unversioned" (2026-11-04).
//
// Resolved once at load into a variable the logger can read synchronously,
// because logAuthEvent() must never await anything — it is called on paths
// where a delay would be worse than a missing field.
let APP_VERSION = "pending";

function askWorkerVersion() {
  return new Promise((resolve) => {
    try {
      const sw = navigator.serviceWorker;
      // Genuinely useful rather than a failure: an uncontrolled page is one
      // that has just taken a new worker, or has none, and either explains a
      // member seeing something nobody else can reproduce.
      if (!sw || !sw.controller) return resolve("no-sw");
      const ch = new MessageChannel();
      const done = setTimeout(() => resolve("sw-silent"), 1500);
      ch.port1.onmessage = (e) => {
        clearTimeout(done);
        resolve((e.data && e.data.version) || "unknown");
      };
      sw.controller.postMessage({ type: "version" }, [ch.port2]);
    } catch (e) {
      resolve("unknown");
    }
  });
}

function appVersion() {
  return APP_VERSION;
}

// Fire at load and again once a worker takes control, so a first visit stops
// saying "no-sw" the moment that stops being true.
(function trackAppVersion() {
  askWorkerVersion().then((v) => { APP_VERSION = v; });
  try {
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        askWorkerVersion().then((v) => { APP_VERSION = v; });
      });
    }
  } catch (e) {}
})();

// Fire and forget, always. A log line is never worth delaying a sign-in for,
// and it must never be the reason one fails — so nothing here is awaited by
// its callers and nothing here can throw.
function logAuthEvent(event, detail, email) {
  if (!SB) return;
  try {
    const row = {
      member_id: AUTH_MEMBER ? AUTH_MEMBER.id : null,
      email: email || (AUTH_MEMBER && AUTH_MEMBER.email) || null,
      event: String(event).slice(0, 40),
      detail: detail == null ? null : String(detail).slice(0, 500),
      user_agent: (navigator.userAgent || "").slice(0, 400),
      app_version: appVersion(),
    };
    Promise.resolve(SB.from("auth_events").insert(row))
      .then((r) => { if (r && r.error) console.warn("[auth-log]", r.error.message); })
      .catch(() => {});
  } catch (e) {
    /* a log that breaks the app is worse than no log */
  }
}

// Written every time a member actually reaches the app. A blank last_seen in
// admin is a member who never got in — the single fact that was missing all
// through the first trial.
function touchLastSeen() {
  if (!SB || !AUTH_MEMBER) return;
  try {
    Promise.resolve(
      SB.from("members").update({
        last_seen: new Date().toISOString(),
        last_seen_agent: (navigator.userAgent || "").slice(0, 400),
      }).eq("id", AUTH_MEMBER.id)
    ).then((r) => { if (r && r.error) console.warn("[last-seen]", r.error.message); })
     .catch(() => {});
  } catch (e) {}
}

// Set while signOut() is running, so the listener below can tell a member who
// chose to leave from a session that died under them. Without it, every
// deliberate sign-out would announce itself as a fault.
let SIGNING_OUT = false;

// Nothing in this app reacted to a session ending until now. A revoked or
// expired session was discovered only when some query failed, and those
// failures surface nowhere — so the app carried on looking normal while
// everything it tried to save was being refused.
if (SB) {
  SB.auth.onAuthStateChange((event, session) => {
    if (event === "TOKEN_REFRESHED") {
      // Worth knowing that refresh works on real devices over days, which is
      // precisely the thing the first trial could not tell us.
      logAuthEvent("token_refreshed");
      return;
    }
    if (event !== "SIGNED_OUT" || SIGNING_OUT) return;
    // Lost rather than left.
    logAuthEvent("session_lost", "signed out without asking");
    if (typeof onSessionLost === "function") {
      try { onSessionLost(); } catch (e) { console.warn("[auth] onSessionLost:", e); }
    }
  });
}

// What this browser can tell us about itself, in words a member can read out
// or screenshot. The first trial's diagnostics were "it doesn't work" and six
// days of email; this is the thing they can send instead.
// How long any ONE line of the panel may take. Short on purpose: the whole
// point is that the panel appears (tester T-11).
const DIAG_STEP_MS = 5000;
// And how long the whole panel may take, as a backstop for a step that fails
// in a way nobody predicted.
const DIAG_TOTAL_MS = 12000;

async function authDiagnostics() {
  const lines = [];
  const add = (k, v) => lines.push(k + ": " + v);
  add("App version", appVersion());

  let storage = "no";
  try {
    localStorage.setItem("__bc_probe", "1");
    storage = localStorage.getItem("__bc_probe") === "1" ? "yes" : "no";
    localStorage.removeItem("__bc_probe");
  } catch (e) {
    storage = "BLOCKED (" + (e.name || "error") + ")";
  }
  // The one that would explain "it worked yesterday": no storage means no
  // session can be kept, so every visit starts from the login form.
  add("Can save a session", storage);

  // Every step below is time-boxed (2026-11-20, tester T-11). This panel used
  // to freeze on "Checking…" forever in exactly the situation it exists for:
  // a connection that STALLS rather than fails. Nothing here resolved, so the
  // panel never appeared, the button stayed disabled, and the member sat
  // looking at a frozen screen — with no way to tell us that either.
  //
  // A diagnostic that can hang is worse than no diagnostic. Every line now
  // arrives, and "no answer" is itself one of the most useful answers it can
  // give: it is the signature of gym wifi behind a sign-in page.
  // Both network probes START HERE, together. They ask different questions of
  // different endpoints and neither needs the other's answer — and run in
  // sequence on a stalled connection they meant waiting out two budgets back
  // to back, which is ten seconds of "Checking…" for somebody already stuck.
  // Settled below, in reading order.
  const timedOut = Symbol("timed out");
  const probe = (p) => within(p, DIAG_STEP_MS, timedOut).catch((e) => ({ failed: e }));

  const sessionProbe = probe(currentSession().then((v) => ({ v })));
  // Asks ONE question: can this device reach the server at all. Deliberately
  // not a table read — the member tapping this button is signed out, so every
  // table says "permission denied", and a diagnostic that reports a healthy
  // server as broken is worse than none. Any HTTP answer, 401 included, is the
  // server talking. Only a thrown fetch is a real network failure.
  //
  // timedFetch, not bare fetch: bare fetch has no limit of its own, and this
  // one request was the likeliest thing to hang the whole panel.
  const t0 = Date.now();
  const serverProbe = probe(
    timedFetch(SUPABASE_URL + "/auth/v1/health", {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
      // Timed HERE, at the moment it answers. Measuring after the await would
      // report how long until we got round to READING it, which on a stalled
      // session probe is five seconds of someone else's wait.
    }).then((r) => ({ r, ms: Date.now() - t0 }))
  );

  const sessionRes = await sessionProbe;
  add("Signed in now",
    sessionRes === timedOut
      ? "NO ANSWER after " + (DIAG_STEP_MS / 1000) + "s — the server could not be asked"
      : sessionRes.failed
        ? "could not check (" + (sessionRes.failed.message || sessionRes.failed) + ")"
        : sessionRes.v ? "yes, as " + (sessionRes.v.user && sessionRes.v.user.email) : "no");

  const serverRes = await serverProbe;
  add("Server reachable",
    serverRes === timedOut
      ? "NO — no answer after " + (DIAG_STEP_MS / 1000) + "s (this is what a wifi "
        + "sign-in page looks like)"
      : serverRes.failed
        ? "NO — " + (serverRes.failed.message || serverRes.failed)
        : "yes (HTTP " + serverRes.r.status + ", " + serverRes.ms + "ms)");

  add("Online", navigator.onLine ? "yes" : "no");
  add("Browser", (navigator.userAgent || "").slice(0, 200));
  add("Checked at", new Date().toLocaleString());
  return lines.join("\n");
}

// Changing a password from inside the app, which is different from setting one
// from an emailed link (2026-10-15). Both end at updateUser(); this one proves
// the member first.
//
// Supabase does not require the current password to change it — a live session
// is enough. That is fine for a recovery link, which was itself proof. It is
// not fine for a phone left unlocked on a bench, so the old password is checked
// by signing in with it. Supabase's own "reauthentication" flow would be the
// textbook answer and it emails a code, which is precisely the channel this
// app is routing around until deliverability is fixed.
async function changePassword(currentPassword, newPassword) {
  if (!SB) return { error: "Can't reach the server. Check your connection." };
  const { data: { user } } = await SB.auth.getUser();
  if (!user) return { error: "You're signed out — sign in again to change your password." };

  // Signing in again rather than comparing anything locally: the server is the
  // only thing that knows the password, and a check this side would be theatre.
  let check;
  try {
    check = await SB.auth.signInWithPassword({ email: user.email, password: currentPassword });
  } catch (e) {
    return { error: "Couldn't reach the server to check your password. Try again when you have a connection." };
  }
  if (check.error) {
    // "Your password is wrong" and "I couldn't check your password" are
    // different things, and the second was wearing the first one's clothes
    // (2026-11-19, tester T-13). The rate limit is the one that bit: this is a
    // real sign-in, so two mistyped attempts and a retry can trip it, and the
    // member is then told the password they just typed correctly is wrong.
    return { error: passwordCheckError(check.error) };
  }

  const { error } = await SB.auth.updateUser({ password: newPassword });
  if (error) return { error: friendlyAuthError(error) };
  return {};
}

// Wording for the set-a-password form, which is every invitee's FIRST screen
// (2026-11-19, tester T-17). friendlyAuthError() was being used here and its
// fallback is "Couldn't sign you in" — which is not what this form does, and
// tells a new member the one thing guaranteed to make them give up.
function setPasswordError(error) {
  const msg = String((error && error.message) || "");
  const status = Number(error && error.status) || 0;
  if (/at least|too short|minimum|length/i.test(msg)) return "Use at least 8 characters.";
  if (/weak|pwned|compromised|common/i.test(msg)) {
    return "That password has turned up in a data breach — pick a different one.";
  }
  if (status === 429 || /rate limit|too many|for security purposes/i.test(msg)) {
    return "Too many attempts. Wait a minute, then try again.";
  }
  if (isOfflineError(error)) {
    return "Couldn't reach the server to save it. Check your connection and try again.";
  }
  // Deliberately NOT matching a bare "invalid": updateUser says that about
  // passwords too, and "this link has expired" would be a confusing answer to
  // "invalid password format".
  if (/expired|jwt|token|session/i.test(msg)) {
    return "This link has expired. Tap \u201cForgot your password?\u201d on the login screen to send yourself a fresh one.";
  }
  return "Couldn't save that password just now. Try again, or ask your coach for a new invite.";
}

async function setPassword(password) {
  if (!SB) return { error: "Can't reach the server. Check your connection." };
  const { data, error } = await SB.auth.updateUser({ password });
  if (error) {
    // "New password should be different from the old password" means the
    // password they just typed IS already their password. That is a reason to
    // let them in, not an error to show them — and it is exactly what a second
    // tap on a slow connection used to produce, so the member was told their
    // password had failed when it had in fact been saved (tester T-17).
    if (/different from the old password|should be different|same_password/i.test(String(error.message || ""))) {
      let who = null;
      try { who = (await SB.auth.getUser()).data.user; } catch (e) { who = null; }
      if (who) {
        history.replaceState(null, "", window.location.pathname + window.location.search);
        return await loadAuthMember(who);
      }
    }
    return { error: setPasswordError(error) };
  }
  // Clear the tokens out of the address bar so the link cannot be replayed
  // from history or shared by accident.
  history.replaceState(null, "", window.location.pathname + window.location.search);
  return await loadAuthMember(data.user);
}

// Why the reset error handling is this long (2026-11-18, tester T-12):
// the old version returned success for everything except a rate limit, so a
// member with no signal, or a mistyped address, was told "a reset link is on
// its way" and then waited for an email that was never sent. Two different
// things were being hidden and only one of them on purpose. Hiding WHETHER AN
// ADDRESS IS A MEMBER is deliberate — answering that turns the form into a
// membership check for anyone who finds it. Hiding "you are offline" was an
// accident, and the one a member actually needs told.
//
// Every case below is about the REQUEST, never about the account, so none of
// them leak membership. Supabase's resetPasswordForEmail answers success for
// an address that is not a member, which is what makes this separation
// possible. If that ever changes, an unknown-user error would land in the
// catch-all at the bottom and show "couldn't send", which differs from the
// success wording — so that is the line to revisit if Supabase changes.
function resetError(error) {
  const msg = String((error && error.message) || "");
  const status = Number(error && error.status) || 0;
  const name = String((error && error.name) || "");
  // Supabase sends "For security purposes, you can only request this after
  // N seconds" for a second tap, which is a rate limit wearing a long coat.
  if (status === 429 || /rate limit|too many|for security purposes/i.test(msg)) {
    return "Too many attempts. Wait a minute, then try again.";
  }
  if (name === "AuthRetryableFetchError" || /fetch|network|failed to fetch/i.test(msg)) {
    return "Couldn't reach the server. Check your connection and try again.";
  }
  if (status === 422 || status === 400 || /invalid|validation|unable to validate/i.test(msg)) {
    return "That address was refused. Check it for typos and try again.";
  }
  // SMTP failures are ours, not theirs, and a member retrying will not fix it.
  if (status >= 500 || /sending|smtp|mail|unexpected_failure/i.test(msg)) {
    return "The email couldn't be sent — that's our end, not yours. Try again in a few minutes, or ask your coach for a new invite.";
  }
  return "Couldn't send the reset email. Try again, or ask your coach for a new invite.";
}

async function sendPasswordReset(email) {
  if (!SB) return { error: "Can't reach the server. Check your connection." };
  const address = String(email || "").trim();
  // Caught here rather than at the server, because the server's rejection is
  // exactly what used to be reported as success.
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(address)) {
    logAuthEvent("reset_rejected", "address doesn't look like an email", address);
    return { error: "That doesn't look like an email address. Check it and try again." };
  }
  // No round trip needed to know this one, and it is the commonest cause.
  if (navigator.onLine === false) {
    logAuthEvent("reset_failed", "offline", address);
    return { error: "You're offline. Connect to the internet and try again." };
  }
  let error = null;
  try {
    const res = await SB.auth.resetPasswordForEmail(address, {
      redirectTo: window.location.origin + window.location.pathname,
    });
    error = res && res.error;
  } catch (e) {
    // A dropped request throws instead of returning, and the old code had no
    // catch, so it took the whole handler down and the member saw nothing.
    logAuthEvent("reset_failed", "threw: " + ((e && e.message) || e), address);
    return { error: "Couldn't reach the server. Check your connection and try again." };
  }
  if (error) {
    logAuthEvent("reset_failed", (error.status || "?") + " " + String(error.message || "").slice(0, 200), address);
    return { error: resetError(error) };
  }
  // Logged so the next trial can tell "never asked for a reset" from "asked,
  // and the email never arrived" — the distinction the first trial could not
  // make for the three testers who never finished setting up.
  logAuthEvent("reset_sent", null, address);
  return { error: null };
}

// ---------------- App settings, from the server (2026-10-17) ----------------
// Admin's Settings screens have always written to localStorage, and the member
// app has always read localStorage. Those are two different browsers on two
// different machines, so nothing a coach changed in Settings has ever reached
// a member — the panel said "members will see this the next time their app
// loads" and that was only ever true if the member was Chris, on Chris's
// laptop. Same shape of bug as the messages that lived in localStorage until
// 16-messages.sql, and as the staff policies that is_staff() never matched.
//
// No migration needed, which is the good news: `app_settings` (key text
// primary key, value jsonb) has existed since 01-schema.sql, 02-policies.sql
// already gives it "signed-in members read / staff write", and
// 03-seed-content.sql already seeded nine keys into it. Only the client code
// was missing.

// Every row, flattened to { key: value } the way both data.js files expect.
async function fetchAppSettings() {
  const { data, error } = await dbSelect("app_settings");
  if (error || !Array.isArray(data)) return null;
  const out = {};
  data.forEach((row) => { out[row.key] = row.value; });
  return out;
}

// Write back only what differs from the built-in defaults, one row per
// top-level key. Diffed rather than dumped whole so that a default someone
// never touched keeps tracking the code instead of being frozen at whatever
// it happened to say the first time a coach opened Settings.
async function saveAppSettingsToServer(settings, defaults) {
  if (!SB) return { ok: false, error: new Error("offline") };
  const rows = Object.keys(settings).map((key) => ({
    key,
    value: settings[key] === undefined ? defaults[key] : settings[key],
  }));
  const { error } = await SB.from("app_settings").upsert(rows, { onConflict: "key" });
  if (error) console.warn("[db] save app_settings:", error.message);
  return { ok: !error, error };
}

// ---------------- Nutrition (2026-10-19) ----------------
// Targets the coach set, and the member's own daily "did I track" marks. See
// supabase/20-nutrition.sql for why these are two tables with two different
// owners: the member may not write their targets, and staff may not write
// someone else's log.

async function fetchNutritionTargets() {
  const { data, error } = await dbSelect("member_nutrition", (q) => q.limit(1));
  if (error || !data || !data.length) return null;
  return data[0];
}

// A window, not everything: the card shows the last fortnight and nobody
// scrolls a nutrition log back to January.
async function fetchNutritionLog(sinceKey) {
  const { data, error } = await dbSelect("nutrition_log", (q) =>
    q.gte("log_date", sinceKey).order("log_date", { ascending: true }));
  if (error || !Array.isArray(data)) return [];
  return data;
}

// One row per member per day, so the mark is an upsert on that pair rather
// than an insert that fails the second time someone changes their mind.
async function saveNutritionMark(uid, dateKeyStr, tracked, hitTargets) {
  if (!SB) return { ok: false, error: new Error("offline") };
  const { error } = await SB.from("nutrition_log").upsert({
    member_id: uid,
    log_date: dateKeyStr,
    tracked: !!tracked,
    // null, never false, when the question was not asked — "didn't say" and
    // "said no" are different answers and the chart must not confuse them.
    hit_targets: tracked ? (hitTargets === null ? null : !!hitTargets) : null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "member_id,log_date" });
  if (error) console.warn("[db] nutrition mark:", error.message);
  return { ok: !error, error };
}

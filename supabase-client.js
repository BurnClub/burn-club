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
const SB = (typeof supabase !== "undefined" && supabase.createClient)
  ? supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
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
let AUTH_MEMBER = null;
let AUTH_PROGRAM = null;

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
  if (error) return { error: friendlyAuthError(error) };
  const loaded = await loadAuthMember(data.user);
  if (loaded.error) return loaded;
  return { member: AUTH_MEMBER };
}

async function signOut() {
  AUTH_MEMBER = null;
  AUTH_PROGRAM = null;
  if (SB) await SB.auth.signOut();
}

// The members row is the profile; the auth user is only an identity. RLS means
// this can only ever return the caller's own row, so there is no filter to
// forget here — the database will not serve anyone else's.
async function loadAuthMember(user) {
  if (!SB || !user) return { error: "Not signed in." };
  const { data, error } = await SB.from("members").select("*").eq("id", user.id).maybeSingle();
  if (error) return { error: friendlyDbError(error) };
  if (!data) {
    // An auth user with no profile row. The trigger should make this
    // impossible; saying so plainly beats rendering an app with no member.
    return { error: "Your account isn't finished setting up. Tell your coach." };
  }
  AUTH_MEMBER = data;

  // The member's program comes with them. scheduleType decides whether the app
  // shows Workouts or Calendar, so taking it from the seeded demo profile
  // would put a real member in the wrong shape of app entirely.
  if (data.program_id) {
    const { data: prog } = await SB.from("programs").select("*").eq("id", data.program_id).maybeSingle();
    if (prog) AUTH_PROGRAM = prog;
  }
  return { member: data };
}

// An invite or reset link returns with tokens in the URL fragment. The client
// is configured with detectSessionInUrl, so by the time this runs the session
// already exists — what is missing is a password the member chose themselves,
// which is the whole reason the spreadsheet never held one.
function arrivedFromEmailLink() {
  const hash = window.location.hash || "";
  return /type=(invite|recovery|signup)/.test(hash) || /access_token=/.test(hash);
}

async function setPassword(password) {
  if (!SB) return { error: "Can't reach the server. Check your connection." };
  const { data, error } = await SB.auth.updateUser({ password });
  if (error) return { error: friendlyAuthError(error) };
  // Clear the tokens out of the address bar so the link cannot be replayed
  // from history or shared by accident.
  history.replaceState(null, "", window.location.pathname + window.location.search);
  return await loadAuthMember(data.user);
}

async function sendPasswordReset(email) {
  if (!SB) return { error: "Can't reach the server. Check your connection." };
  const { error } = await SB.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: window.location.origin + window.location.pathname,
  });
  // Deliberately the same answer whether or not the address exists: telling a
  // stranger which emails are members turns the form into a membership check.
  return { error: error && /rate limit|too many/i.test(error.message)
    ? "Too many attempts. Wait a minute and try again." : null };
}

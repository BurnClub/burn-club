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

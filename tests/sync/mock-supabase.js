// A tiny in-memory Supabase: enough of .from().select/upsert/insert/delete
// to drive the real sync.js. The "server" is shared; each "device" gets its
// own localStorage, which is the thing that differed between phone and PC.
var SERVER = {};
function tbl(n) { return SERVER[n] = SERVER[n] || []; }
function Q(table) { this.t = table; this.f = null; }
Q.prototype.select = function () { this.op = "select"; return this; };
Q.prototype.order = function () { return this; };
Q.prototype.eq = function (col, val) { this.f = [col, val]; return this; };
Q.prototype.maybeSingle = function () { var r = tbl(this.t)[0] || null; return Promise.resolve({ data: r, error: null }); };
Q.prototype.upsert = function (rows, opt) {
  var keys = (opt && opt.onConflict || "").split(",");
  var arr = tbl(this.t);
  (Array.isArray(rows) ? rows : [rows]).forEach(function (row) {
    var i = arr.findIndex(function (x) { return keys.every(function (k) { return x[k] === row[k]; }); });
    if (i >= 0) arr[i] = Object.assign({}, arr[i], row); else arr.push(Object.assign({}, row));
  });
  return Promise.resolve({ error: null });
};
Q.prototype.insert = function (rows) { var a = tbl(this.t); rows.forEach(function (r) { a.push(Object.assign({}, r)); }); return Promise.resolve({ error: null }); };
Q.prototype.delete = function () { this.op = "delete"; return this; };
Q.prototype.then = function (res) {
  var self = this;
  if (this.op === "delete") {
    SERVER[this.t] = tbl(this.t).filter(function (r) { return !(self.f && r[self.f[0]] === self.f[1]); });
    return Promise.resolve({ error: null }).then(res);
  }
  return Promise.resolve({ data: tbl(this.t).slice(), error: null }).then(res);
};
var SB = { from: function (t) { return new Q(t); } };

// Per-device storage, swapped between "phone" and "pc".
function Store() {}
Store.prototype.getItem = function (k) { return Object.prototype.hasOwnProperty.call(this, k) ? this[k] : null; };
Store.prototype.setItem = function (k, v) { this[k] = String(v); };
Store.prototype.removeItem = function (k) { delete this[k]; };
var DEVICES = { phone: new Store(), pc: new Store() };
var localStorage = DEVICES.phone;
function onDevice(name) { localStorage = DEVICES[name]; }

var window = { addEventListener: function () {} };
function setTimeout() {}  function clearTimeout() {}
var console = { warn: function () {}, log: print };
var AUTH_MEMBER = { id: "chris" };
var CURRENT_MEMBER = { id: "chris" };
function memberKey(b) { return b + "-" + CURRENT_MEMBER.id; }
var COMPLETIONS_STORAGE_KEY="c", CHECKIN_STORAGE_KEY="ck", DAILY_STATS_STORAGE_KEY="ds",
    MY_HABITS_STORAGE_KEY="h", SHOWCASED_PRS_KEY="prs", BENCHMARK_RESULTS_STORAGE_KEY="b",
    HABIT_CHECKS_STORAGE_KEY="hc", NOTEBOOK_NOTES_KEY="nb", SESSION_NOTES_KEY="sn",
    THEME_KEY="theme", TOUR_SEEN_KEY="tour", CHECKIN_ENABLED_KEY="cke", CHECKIN_DISMISS_KEY="ckd",
    NOTIF_PREFS_KEY="np", WEARABLE_STORAGE_KEY="w", LIVE_HEALTH_PROFILES_KEY="hp",
    SCHEDULED_ITEMS_STORAGE_PREFIX="sched-";
var HABIT_CHECKS = {}, NOTEBOOK_NOTES = { coach: [], other: [] }, SESSION_NOTES = {};
function loadHealthProfiles() { return {}; }
function showToast() {}

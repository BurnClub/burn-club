// Messaging has to survive the thing that makes it different from every other
// store in sync.js: a thread is SHARED and append-only. Five other people
// write to the group chat, so nothing this device holds is the truth about
// what the list should be, and the usual "push my copy" would delete their
// messages.
//
// What this file guards:
//   - a sent message reaches the server with the fields RLS decides on
//   - reading it back does not mark it unread to its own author
//   - "read" follows when the member last opened that thread, and survives
//     a reload, which is the whole reason thread reads are stored at all
//   - a group message and a DM stay in their own threads
var AUTH_MEMBER = { id: "member-1", first_name: "Jordan", last_name: "P" };
function check(ok, msg) { print((ok ? "  PASS  " : "  FAIL  ") + msg); }

(async function () {
  onDevice("phone");

  // --- a member sends into their own DM -------------------------------
  var sent = await pushMessage({
    conversationId: "dm-member-1", kind: "dm", memberId: "member-1",
    programId: null, body: "Is it ok to do legs two days running?",
  });
  check(sent.ok, "a send reaches the server");

  var row = tbl("messages")[0];
  print("row        " + JSON.stringify({
    conv: row.conversation_id, kind: row.kind, member: row.member_id,
    program: row.program_id, sender: row.sender_id, staff: row.is_staff,
  }));
  // Every one of these is read by a policy in 16-messages.sql. Get any of them
  // wrong and the insert is refused, or worse, accepted into the wrong thread.
  check(row.kind === "dm" && row.member_id === "member-1" && row.program_id === null,
        "a DM row carries member_id and no program_id");
  check(row.sender_id === "member-1",
        "sender_id is the signed-in member, which the insert policy pins to auth.uid()");
  check(row.is_staff === false,
        "is_staff is false — a member must not be able to post as the coach");
  check(row.sender_name === "Jordan P", "the sender's name is stored on the row");

  // --- the group thread -------------------------------------------------
  await pushMessage({
    conversationId: "group-fit-functional", kind: "group", memberId: null,
    programId: "fit-functional", body: "Anyone else dying after week 2?",
  });
  var g = tbl("messages")[1];
  check(g.kind === "group" && g.program_id === "fit-functional" && g.member_id === null,
        "a group row carries program_id and no member_id");

  // --- reading back ------------------------------------------------------
  var got = await fetchMessages();
  check(got.ok && got.messages.length === 2, "both messages come back");
  check(got.messages.every(function (m) { return m.read; }),
        "your own messages are never unread to you");
  var threads = got.messages.map(function (m) { return m.conversationId; });
  check(threads.indexOf("dm-member-1") !== -1 && threads.indexOf("group-fit-functional") !== -1,
        "the DM and the group stay in their own threads");

  // --- someone else writes ----------------------------------------------
  tbl("messages").push({
    id: 99, conversation_id: "group-fit-functional", kind: "group",
    member_id: null, program_id: "fit-functional", sender_id: "member-2",
    sender_name: "Priya K.", is_staff: false, body: "Week 2 is the worst one",
    created_at: new Date().toISOString(), staff_read_at: null,
  });

  got = await fetchMessages();
  var theirs = got.messages.find(function (m) { return m.senderId === "member-2"; });
  check(!!theirs && !theirs.read, "a message from someone else arrives unread");

  // Opening the thread marks it read, and that has to outlive a reload —
  // without the stored timestamp every app open would re-announce old
  // messages as new, which is the bug the tour had.
  markThreadRead("group-fit-functional");
  got = await fetchMessages();
  theirs = got.messages.find(function (m) { return m.senderId === "member-2"; });
  check(!!theirs && theirs.read, "opening the thread marks it read");

  var dmStill = got.messages.find(function (m) { return m.conversationId === "dm-member-1"; });
  check(!!dmStill, "and reading one thread does not touch another");

  // --- the peer room: a custom group ------------------------------------
  // The thread six testers share. Its whole reason for existing server-side
  // is that RLS cannot decide who may read it unless the database holds the
  // roster — so the row must carry group_id and NOTHING else, or the policy
  // for the wrong shape is the one that gets consulted.
  onDevice("phone");
  tbl("group_members").push({ group_id: "custom-testers", member_id: "member-1" });
  tbl("member_groups").push({ id: "custom-testers", name: "Tester Room" });

  var mine = await fetchMyGroups();
  check(mine.length === 1 && mine[0].name === "Tester Room",
        "a member sees the custom group they are in");

  var sentGroup = await pushMessage({
    conversationId: "group-custom-testers", kind: "custom",
    memberId: null, programId: null, groupId: "custom-testers",
    body: "Anyone else find week one harder than expected?",
  });
  check(sentGroup.ok, "a member can post in their custom group");

  var crow = tbl("messages").filter(function (r) { return r.kind === "custom"; })[0];
  print("custom row " + JSON.stringify({
    conv: crow.conversation_id, kind: crow.kind, group: crow.group_id,
    member: crow.member_id, program: crow.program_id,
  }));
  check(crow.group_id === "custom-testers",
        "the row carries the group it belongs to");
  check(crow.member_id === null && crow.program_id === null,
        "and carries neither a member nor a programme — the check constraint allows exactly one");
  check(crow.is_staff === false && crow.sender_id === "member-1",
        "a peer message is not staff, and is from its sender");

  // NOT tested here, deliberately: that a member sees only the groups they are
  // in. fetchMyGroups() sends no `where` because the policy on group_members
  // ("read your own membership") is what filters it, and this mock has no RLS
  // — so a check here would be asserting the mock's fiction, not the app's
  // behaviour. It would pass whatever the policy said, including nothing.
  // The real check is the policy in 18-group-chats.sql, and the way to prove
  // it is two signed-in accounts against the live database.
  //
  // What IS worth pinning: no group rows at all yields no groups, rather than
  // throwing or returning undefined for a member in none — which is most of
  // them.
  SERVER.group_members = [];
  SERVER.member_groups = [];
  var none = await fetchMyGroups();
  check(Array.isArray(none) && none.length === 0,
        "a member with no group rows gets an empty list, not a crash");

  // --- a second device ---------------------------------------------------
  // Thread reads are per browser on purpose: unread is about a person at a
  // screen. A laptop that has never opened the thread should still show it.
  onDevice("pc");
  got = await fetchMessages();
  theirs = got.messages.find(function (m) { return m.senderId === "member-2"; });
  check(!!theirs && !theirs.read,
        "a second device has its own unread state rather than inheriting one");
})();

# Member import

Fill in `members-template.csv`, one row per member. The first three rows are
worked examples — delete them before importing.

## Columns

| Column | Required | Notes |
|---|---|---|
| `email` | **yes** | This is the member's login identity. Must be unique — it's the one field that can't be changed later without care. |
| `first_name` | **yes** | Shown on Home ("Welcome back, Jordan") and in the coach's list. |
| `last_name` | **yes** | Coach-side only. Members see first names. |
| `program` | **yes** | Exactly `Burn Club` or `Fit & Functional`. Whether the program is rolling or fixed-length is a property of the program, not the member — you don't set it per person. |
| `access` | structured only | `home`, `gym`, or `both` — what they bought. `both` shows each scheduled day twice so they pick where they are that day. Leave blank for Burn Club. |
| `start_date` | structured only | `YYYY-MM-DD`. Drives which week and day they're on, so getting it wrong puts them in the wrong week. Leave blank for Burn Club, which is date-based rather than per-member. |
| `member_since` | no | `YYYY-MM-DD`. Cosmetic, shown on their profile. |
| `badge` | no | e.g. `Founding Member`. Blank for most people. |
| `notes` | no | Coach-only free text. Not shown to the member. |

## What you deliberately don't need

- **No member IDs.** Generated from the email on import — don't invent them.
- **No passwords.** Members set their own on first sign-in; a spreadsheet is
  the wrong place for credentials and you should never be holding them.
- **No workout history, weights or PRs.** Those accumulate from use. Bringing
  history across from the old platform is a separate job (see NOTES.md) and
  needs that platform's export, not hand entry.
- **No coach assignment**, while you're the only coach.

## Before you fill this in

Two things are worth settling first, because they're painful to change after
people are in:

1. **Which email** — the one they bought with, or one they choose? If members
   purchase on the website first, the purchase email is the natural key, and
   it means their account already exists when they download the app.
2. **What happens when a structured member finishes their 8 weeks.** Do they
   restart with a new `start_date`, move to another program, or lapse? It
   affects whether `start_date` is a fixed field or a history of enrolments.

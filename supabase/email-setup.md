# Email sending

Supabase's built-in mailer is rate-limited to a few messages an hour and is
explicitly not for production. It's fine while there are a dozen tester
accounts; it will not deliver 200 invites on import day. So this gets set up
before launch, not during it.

## Provider

**Resend.** Easiest domain verification, good Supabase documentation, and the
pricing fits: free is 100/day and 3,000/month, which covers testing; **$20/mo
is 50,000/month with no daily cap**, which covers an import burst.

That daily cap matters more than the monthly one. Two hundred invites in an
afternoon exceeds 100/day, so either upgrade before import day or send the
invites across three days — the upgrade is simpler.

Postmark ($15/mo, 10k) is the other reasonable choice and has a stronger
deliverability reputation for transactional mail. Either works. Avoid the
free SendGrid tier; shared-IP reputation is a real problem for invites, which
are exactly the sort of mail spam filters distrust.

## The domain: kellyyager.com

Checked 2026-09-18, and what is already there decides how this is set up:

```
A       23.227.38.32                        -> Shopify
MX      aspmx.l.google.com, alt1, alt2 ...  -> Google Workspace
TXT     v=spf1 include:_spf.google.com ~all -> one SPF record, Google only
_dmarc  (nothing)                           -> no DMARC at all
```

**Send from a subdomain — `mail.kellyyager.com` — not the root.** Two reasons,
and the second is the one that matters:

1. **It never touches the existing SPF record.** A domain may have exactly one
   SPF record; a second makes both fail (permerror), and the failure mode is
   that Kelly's ordinary business email quietly stops being trusted. Merging
   Resend into the existing record works, but it means editing the record her
   live mail depends on. A subdomain carries its own SPF and leaves the root
   untouched.
2. **Sending reputation stays separate.** Invite mail is exactly what spam
   filters distrust: a burst of near-identical messages to people who have not
   corresponded with you before. If that gets flagged on the root domain it
   damages deliverability for the real business correspondence going through
   Google Workspace. On a subdomain the blast radius is the invites.

So Resend verifies `mail.kellyyager.com`, and invites come from something like
`coach@mail.kellyyager.com`.

## DMARC

There is no `_dmarc` record today. Worth adding, but **start at `p=none`**:

```
_dmarc.kellyyager.com  TXT  "v=DMARC1; p=none; rua=mailto:you@kellyyager.com"
```

`p=none` asks receivers to report rather than act. Go straight to `p=reject`
with live Google Workspace mail and any legitimate sender that is not in the
SPF record — a booking tool, a Shopify notification, a newsletter — starts
bouncing, and the bounces are invisible to the sender. Watch the reports for a
couple of weeks first.

## From-address and naming

Members bought through a Shopify store at kellyyager.com, so the name is
familiar — but the app is called Burn Club, and an invite from a different
name than the product is a reason to delete it. Make the from-name carry both:
`Burn Club — Kelly Yager`. Set a reply-to that reaches a person, so a confused
member can answer the email instead of hunting for support.

## Wiring it to Supabase

Authentication -> Emails -> SMTP Settings in the dashboard. Resend gives you a
host, port, username and password; they go in there.

**Enter those directly in the dashboard. Don't paste SMTP credentials into
chat, a commit, or a config file** — unlike the publishable key, an SMTP
password is a real secret: anyone holding it can send mail as your domain,
which is worth more to an attacker than read access to a workout library.

## Before you trust it

Send yourself an invite and check it lands in the inbox, not spam. Then send
one to a different provider than your own — Gmail and Outlook filter
differently, and members will be on both.

## Templates

Supabase's default invite email says "Accept the invite" over a bare link with
no mention of Burn Club. Worth rewriting before members see it: say who it's
from, what the app is, and that the link sets their password. An unexplained
link from an unfamiliar domain is what people have correctly been trained to
delete.

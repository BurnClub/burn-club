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

## What it needs from you

1. **A domain you control the DNS for.** Invites sent from `@gmail.com` or
   similar will be rejected outright — providers require a verified domain.
   `burnclub.github.io` will not do; it needs a real domain.
2. **Three DNS records**, which Resend generates for you:
   - `SPF` — says Resend may send as your domain
   - `DKIM` — signs each message so it can be verified
   - `DMARC` — tells receivers what to do when the first two fail
   Verification usually completes in minutes, occasionally hours. This is the
   step that can silently eat a day, which is why it is worth doing now.
3. **A from-address.** `noreply@` works; `hello@` or `coach@` gets opened more,
   and a reply-to that reaches you means a confused member can just answer the
   email instead of finding support.

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

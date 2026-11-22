# vendor

Third-party code served from this repo rather than from a CDN.

## supabase-js-2.116.0.umd.js

`@supabase/supabase-js` 2.116.0, the UMD build, exactly as npm publishes it.

It used to load from `cdn.jsdelivr.net`. The service worker deliberately does
not cache cross-origin scripts, so that one file was left to the browser's own
HTTP cache — which is empty on a first load and can be evicted. If it did not
arrive, `SB` was null, and a member got a silent login form with the demo
buttons under it and nothing recorded anywhere (tester T-55). Served from
here, it is in `SHELL` in `sw.js` like every other file the app needs.

Downloaded 2026-11-21, 218,318 bytes,
sha256 `84ee9bf45695c1dd3ba1595b6bcfb0f09672434631351ffc8ebe9140545d5ff6`.
Byte-identical from jsdelivr and unpkg, which serve the npm tarball
independently. MIT licensed.

To move to a newer version: download it, check the two CDNs agree, add it
beside this one under its own version number, change the `<script src>` in
`index.html` and the entry in `SHELL`, and bump the cache. Keeping the version
in the filename means an upgrade shows up in the diff rather than hiding
inside a file called `supabase.js`.

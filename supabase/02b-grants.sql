-- Grants only — for a database where 01 and 02 have already run.
-- Safe to run more than once.
--
-- RLS decides which rows a caller sees; a grant decides whether it may touch
-- the table at all. Missing grants surface as "permission denied for table"
-- before any policy is consulted. Folded into 02-policies.sql for a fresh
-- install; this file exists for a database already part-way through setup.
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- New subscriptions get their weekly email on Monday, as the subscribe form
-- says. The column defaulted to 0 (Sunday) from the old form, which had a day
-- picker; existing rows keep the day they have, so legacy weekly subscribers
-- keep getting it on the day the legacy digest used.
ALTER TABLE public.subscriptions ALTER COLUMN preferred_day SET DEFAULT 1;

COMMENT ON COLUMN public.subscriptions.preferred_day IS 'Weekly email day (0=Sunday, 6=Saturday). New subscriptions get 1 (Monday); the form does not set it.';

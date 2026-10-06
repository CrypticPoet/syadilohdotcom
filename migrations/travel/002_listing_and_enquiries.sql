CREATE INDEX IF NOT EXISTS pages_type_path_idx ON travel.pages(type,path);
ALTER TABLE travel.jobs ADD COLUMN IF NOT EXISTS rerun_requested boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS pages_country_type_path_idx ON travel.pages((content->'destination'->>'country'),type,path);
CREATE TABLE IF NOT EXISTS travel.enquiry_limits (
  key text PRIMARY KEY,
  window_start timestamptz NOT NULL,
  count integer NOT NULL
);

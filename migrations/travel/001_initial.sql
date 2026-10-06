CREATE SCHEMA IF NOT EXISTS travel;
CREATE TABLE IF NOT EXISTS travel.destinations (
  id text PRIMARY KEY,
  country text NOT NULL,
  editorial jsonb NOT NULL,
  geography jsonb,
  climate jsonb,
  checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS destinations_country_idx ON travel.destinations(country, id);
CREATE TABLE IF NOT EXISTS travel.source_snapshots (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  destination_id text NOT NULL REFERENCES travel.destinations(id),
  provider text NOT NULL,
  content_hash text NOT NULL,
  source_url text NOT NULL,
  payload jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(destination_id, provider, content_hash)
);
CREATE TABLE IF NOT EXISTS travel.pages (
  path text PRIMARY KEY,
  destination_id text NOT NULL REFERENCES travel.destinations(id),
  type text NOT NULL,
  content jsonb NOT NULL,
  content_hash text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pages_destination_idx ON travel.pages(destination_id, path);
CREATE TABLE IF NOT EXISTS travel.page_versions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  path text NOT NULL,
  content_hash text NOT NULL,
  content jsonb NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(path, content_hash)
);
CREATE TABLE IF NOT EXISTS travel.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id text NOT NULL REFERENCES travel.destinations(id),
  kind text NOT NULL CHECK(kind IN ('geography','climate','publish')),
  state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','running','succeeded','dead')),
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 5,
  next_run_at timestamptz NOT NULL DEFAULT now(),
  lease_token uuid,
  lease_until timestamptz,
  error text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(destination_id, kind)
);
CREATE INDEX IF NOT EXISTS jobs_due_idx ON travel.jobs(state, next_run_at, lease_until);
CREATE TABLE IF NOT EXISTS travel.runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  processed integer NOT NULL DEFAULT 0,
  failed integer NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS travel.invalidations (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

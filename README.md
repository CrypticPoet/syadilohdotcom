# Syadiloh

Next.js 16 travel planning app. The pSEO release contains 50 enquiry-led pages for UK travellers: five country guides, 15 destinations, ten family guides, ten couples guides and ten itineraries. `/holidays` is the directory. The homepage features a bounded selection of published destinations and links to this directory. Each guide and the directory show a concierge starter with relevant prompt pills; planning links scroll to the starter. Pills fill an editable message, and sending opens the same full-screen chat as the homepage. The guide remains in place and can be restored with Back to guide or Escape. Guide context and source path are passed to the server and retained on chat enquiries. Existing Quicksand/Fredoka typography and grape, periwinkle, ivory and coral colours are retained.

## Development

```sh
npm ci
npm run dev
```

Use a private `.env` based on `.env.example`. `DATABASE_URL` powers published content and itinerary requests. The existing chat planner uses `GOOGLE_GENERATIVE_AI_API_KEY`. Set `NEXT_PUBLIC_SITE_URL` to the canonical public origin. Keep `CRON_SECRET` private and configure the same value on the scheduler and app.

The hosted database has been seeded with 20 profiles and 50 pages. No website deployment or external scheduler was activated by this implementation.

## Data and publication

Editorial profiles → geography jobs → climate jobs → validated publication → cache invalidation outbox.

- **Identity:** Wikidata IDs, coordinates and GeoNames IDs, with CC0 provenance.
- **Climate:** NASA POWER regional climatology for **2001–2020**: mean temperature, estimated monthly precipitation and cloud cover. Mean daily precipitation is multiplied by average calendar-month length over the baseline, including leap years. These are modelled regional averages, not forecasts or standard 30-year station normals. Rain and snow are combined as precipitation water equivalent. Separate snowfall, sunny days and sunshine hours are unavailable and are not invented.
- **Photos:** Wikimedia Commons images with artist credits, source links and commercially compatible licences. NC/ND licences are rejected. Every profile requires a photo. Country photos illustrate a destination within that country.
- **Editorial:** Original planning suggestions in `content/travel/editorial.ts`, with official tourism references. Family and couples variants are selected deliberately rather than multiplying all keywords.

Normalized data and raw versioned upstream payloads are stored separately in `travel.destinations` and `travel.source_snapshots`. Zod rejects missing months, unexpected units/baselines, wrong identities and incomplete itineraries. Jobs retry with exponential backoff, stop after five attempts and retain the last good publication on source failure. Workers use `FOR UPDATE SKIP LOCKED`, expiring leases and ownership tokens. Changes queued during an active job request another pass.

Publication is transactional per destination. A canonical SHA-256 content hash determines whether a page changed. Identical data leaves publication dates, versions and cache invalidations untouched. Sitemap dates reflect content publication, not cron execution. Previous versions support rollback. Page visits never fetch weather upstream.

## Database workflow

Repeatable additive SQL lives in `migrations/travel`, in a separate `travel` schema. Requests use the existing `public.enquiries` table. For a fresh database, that existing enquiry table must also be initialized from `src/lib/db/schema.ts`.

```sh
npm run travel -- setup
npm run travel -- seed

# POC: replay retained, validated upstream records.
npm run travel -- import-sources
npm run travel -- drain 5
npm run travel -- status

# Fetch fresh sources for a destination.
npm run travel -- schedule rome --force
npm run travel -- drain 5

# Recover a failed job after fixing its reported cause.
npm run travel -- retry rome climate
npm run travel -- drain 5

# Republish or restore an earlier version.
npm run travel -- publish
npm run travel -- rollback /holidays/italy/rome PREVIOUS_CONTENT_HASH

# Export Postgres publication for an offline build.
npm run travel -- export
```

`seed` validates the catalogue and queues changes to existing editorial profiles. New profiles are scheduled for source ingestion. `drain [minutes]` runs bounded batches until its deadline or no eligible jobs remain. `work [1–100]` runs one batch. Delayed retries need a later worker invocation. Concurrent workers share the queue; start with a small worker count and respect upstream limits. `status` reports counts, states and failures without credentials.

After CLI publication or rollback, POST `/api/travel/revalidate` with `Authorization: Bearer <CRON_SECRET>`. Repeat until `invalidated` is zero for imports exceeding 100 changes. The outbox updates page, directory, robots and sitemap caches. A database outage does not silently serve an older filesystem snapshot.

## Scheduling

Configure an external scheduler to GET `/api/travel/cron` with the bearer secret. It schedules up to 100 due destinations, processes up to ten jobs within its time budget and flushes up to 100 invalidations. It requests a 180-second function limit; use CLI workers if your host cannot support that duration. Source records become due after **one year**, so frequent worker runs to ingest new cities do not refresh climate frequently. Requests without the secret return 401.

For large imports, run `schedule` plus multiple CLI `drain` workers on a worker host, then call the invalidation endpoint. Keep worker frequency separate from annual source refresh. Seed new destinations before scheduling; runtime cron does not import unreviewed local editorial files.

No hosted cron is active until a scheduler is configured. No WeatherAPI key or paid subscription is required. Future price providers should have separate data contracts, freshness rules and queues; guessed fares or availability should not be published.

## Offline/build-step mode

```sh
# Replay saved source files; fetch only missing records.
npm run travel:snapshot

# Deliberately recheck upstream data.
npm run travel:snapshot -- --refresh

TRAVEL_DATA_MODE=snapshot npm run build
TRAVEL_DATA_MODE=snapshot npm run dev
```

The generator shares the database pipeline's normalization and page contracts. Final publication is written atomically. Unchanged content retains its dates; a corrupt existing publication blocks replacement. Snapshot mode is explicit, or the default without a database connection. Requests still need Postgres. Snapshot changes require a restart/rebuild; runtime cron targets database mode.

## Adding a destination

1. Add an original profile in `content/travel/editorial.ts`: stable ID, existing country, correct Wikidata ID, practical comparisons, experiences, complete days and official sources.
2. Select useful family/couples variants only. The promised itinerary duration cannot exceed its authored days.
3. Run `npm run travel:images`, inspect imagery and credits, then `npm run travel:snapshot` to validate and fetch missing source records. Review the actual guide before release.
4. In database mode, run `seed`, `import-sources DESTINATION_ID` and `drain`, then invalidate caches. Alternatively, scheduled workers fetch sources after `seed`.
5. In snapshot mode, rebuild the app.

Schema validation is a technical gate, not proof of helpful content or search ranking. Keep editorial review and visitor outcomes as the release gate. Flight route/fare pages are deferred until reliable data can satisfy that search intent.

## Scaling and discovery

Cached per-path lookups render server HTML and invalidate only changed content. A bounded first set is prerendered; new database paths render on demand. Related guides are filtered by country/destination. The directory paginates 24 destinations. Country comparisons contain at most 24 profiles; the wider collection is available through the directory.

Runtime `/travel-sitemap/0.xml`, `/travel-sitemap/1.xml`, etc. contain up to 5,000 URLs each. New shards do not require route files or build-time registration. Robots advertises all shards. Pages include canonicals, descriptive metadata, breadcrumbs, WebPage structured data, internal links, attributed imagery and accessible tables. Unpublished paths use Next.js not-found handling and are not indexable. No fabricated prices, reviews or booking availability appear in structured data.

The 10,000-route test verifies the page contract and route uniqueness, not production traffic capacity. Benchmark worker throughput, database latency, cache hit rates and image delivery before expanding production to that scale. Bulk ingestion remains independent of rendering and does not require rebuilding every page.

## Verification

```sh
npm run test:travel
npm run test:travel:integration
npx tsc --noEmit
npm run lint
npm run build

# Requires the local app; does not create customer enquiries.
npm run travel:verify
```

Integration tests remove only their UUID-isolated fixtures. They check exclusive claims, lease recovery, rerun requests, unchanged timestamps, version creation, rollback and invalidation counts. HTTP verification checks all 50 starter routes, canonical tags, structured data, climate tables, sitemap coverage, unknown-page handling and scheduler authentication. With a secret configured, it also drains the invalidation outbox and runs a bounded cron pass. `TRAVEL_VERIFY_URL` defaults to localhost; set it deliberately to target another app instance.

Existing Google Fonts require network access at build time. Use `npm run build -- --webpack` and `npm run dev -- --webpack` if a local environment restricts Turbopack worker sockets.

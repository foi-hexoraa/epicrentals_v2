# Epic Rentals website

Source snapshot of deployed version 15 (25 October 2026), source commit `409bd7179d7e87082a1c776a798faa5bf87dfeb3`.

## Stack and structure

HTML, CSS and vanilla JavaScript, built with Node.js into a Cloudflare Worker. Runtime settings, uploaded photos and Admin sessions live in Cloudflare R2. A separate availability Worker reads the SuperSaaS schedule. WhatsApp handles customer enquiries; the website does not create bookings.

- `v2.html`, `v2.css`: website template and responsive styles.
- `booking-v3.js`: calendar, exact availability checks, alternatives and PS5 booking flow.
- `client-v2.js`, `enhancements-v3.js`: products, promotions and mobile interactions.
- `pricing.mjs`, `config.mjs`: pricing engine and default settings, including holiday configuration.
- `policies-v2.js`: policy text.
- `worker/server.mjs`, `worker/admin-v2.html`: website backend and protected Admin interface.
- `worker/calendar-worker.mjs`: separate availability Worker; preserve its deployed SuperSaaS API key as a secret.
- `assets/`: product images, logos and promotional images.
- `scripts/`: build and automated checks.

## Build and checks

Use Node.js 24 or later. No npm dependencies are required.

```sh
node scripts/build-v2.mjs
node scripts/test-v2.mjs
node scripts/test-admin.mjs
node scripts/test-calendar.mjs
node scripts/test-cutoff.mjs
node scripts/test-holidays.mjs
node scripts/test-images.mjs
node scripts/test-pricing.mjs
```

The build writes the website Worker to `dist/server/index.js` and a static layout preview to `preview/`. The static preview does not provide the authenticated Admin backend or persistent settings.

## Hosting

`.openai/hosting.json` identifies the existing Sites project and its `BUCKET` R2 binding. This repository is a source backup; uploading it does not switch the current hosting or deploy the site automatically.

Running on another Cloudflare account requires provisioning an R2 bucket, configuring the website Worker and its Admin owner identity, and deploying the availability Worker with `SUPERSAAS_API_KEY` as a secret. The website frontend references that separately deployed availability Worker.

## Included and excluded data

API keys, real passwords, Admin session records, customer documents and SuperSaaS booking records are not included. Credentials in automated tests are dummy values. Live Admin settings and uploaded originals remain in the existing R2 bucket; `config.mjs` contains defaults rather than a complete export of live runtime data. Bundled optimised homepage and promotion images are included.

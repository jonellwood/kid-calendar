# kid-calendar

Vue + Vite calendar app for summer camps/programs with:
- Month view
- Week view
- Agenda view
- Past dates/events shown dimmed
- Admin page for adding/editing/deleting events and exporting `events.json`

## Local development

Install dependencies and run Vite:

```bash
npm install
npm run dev
```

Then open:
- `http://localhost:5173/` (calendar)
- `http://localhost:5173/admin` (admin)

## Netlify

Build command: `npm run build`

Publish directory: `dist`

SPA redirects for `/admin` are configured in `netlify.toml`.

## Data workflow

Events are **bundled into the app at build time** from `data/events.json`. There is no runtime file fetch.

1. Use `/admin` to add, edit, or delete events. Changes are saved to browser localStorage instantly.
2. Click **Download JSON** in the admin toolbar.
3. Replace `data/events.json` in the repo root with the downloaded file.
4. `git add data/events.json && git commit -m "update events" && git push`
5. Netlify runs `npm run build`, which bundles the new `data/events.json` into the app.

**Important:** `data/events.json` is the single source of truth. Netlify always builds from whatever is committed there. Any events you add via `/admin` live only in that browser's localStorage until you download and commit the JSON.

## Troubleshooting

- Changes in `/admin` update localStorage immediately but are not visible to other devices/browsers until you follow the Data workflow above.
- If there are no current-month/current-week events, the app opens on the nearest month/week containing events.
- To reset a browser to the repo's canonical events, clear site data (Application → Storage → Clear site data in DevTools).

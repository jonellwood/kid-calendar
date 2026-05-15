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

1. Use `/admin` to edit events.
2. Click **Download JSON**.
3. Replace both `data/events.json` and `public/data/events.json` with the downloaded file.
4. Commit/push to trigger a Netlify deploy.

## Troubleshooting

- Saving in `/admin` updates browser local storage immediately, not repository files. Use **Download JSON** to persist changes into JSON files.
- If there are no current-month/current-week events, the app opens on the nearest month/week containing events.

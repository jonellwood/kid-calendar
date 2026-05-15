# kid-calendar

Simple static calendar app for summer camps/programs with:
- Month view
- Week view
- Agenda view
- Past dates/events shown dimmed
- Small admin page for adding/editing/deleting events and exporting `events.json`

## Local development

Because event data is loaded from `data/events.json`, use a local web server:

```bash
python3 -m http.server 8080
```

Then open:
- `http://localhost:8080/index.html`
- `http://localhost:8080/admin.html`

## Netlify

This repository is static and can be deployed directly on Netlify with no build command.

Recommended publishing directory: repository root.

## Data workflow

1. Use `admin.html` to edit events.
2. Click **Download JSON**.
3. Replace `data/events.json` with the downloaded file.
4. Commit/push to trigger a Netlify deploy.

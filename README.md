# WappFlow Admin — customer dashboard and super-admin panel (English / Arabic)

The **customer workspace app** (`/app`) and the **super-admin panel** (`/admin`) of the WappFlow platform, fully in English and Arabic with right-to-left layout.
The public website lives in **[wappflow-web](https://github.com/Eslamatef1992/wappflow-web)** and the API in **[wappflow-api](https://github.com/Eslamatef1992/wappflow-api)**.
The API lives in **[wappflow-api](https://github.com/Eslamatef1992/wappflow-api)** — full feature list, Meta setup and deployment guide are in its README.

React 19 · Vite · Tailwind CSS 4 · React Flow (chatbot builder) · Recharts · Socket.IO client

## Screens

| Customer workspace (`/app`) | Super admin (`/admin`) |
|---|---|
| Overview: conversations, first-reply time, delivery/read rates, plan usage | Overview: MRR, revenue by month, workspaces by status |
| Inbox: real-time team chat, assignment, notes, quick replies, 24-hour window meter, RTL Arabic | Workspaces: plan, trial extension, suspend, open as owner, invoices |
| Contacts: CSV import/export, tags, custom fields, opt-out | Plans: prices, limits, feature switches |
| Templates: builder with live WhatsApp preview, Meta sync | Invoices: confirm bank transfers |
| Campaigns: audience by tags, personalisation, schedule, delivery funnel | System: failed background jobs, audit log |
| Chatbots: drag-and-drop flow builder | |
| Commerce: orders, products, order-update automations, Shopify/WooCommerce | |
| Settings: WhatsApp numbers, team, quick replies, API keys & webhooks | |
| Plan & billing: usage, invoices, pay online or by transfer | |

## Languages

- Every screen works in **English and Arabic**. The language button is in the sidebar (next to your name) and on the sign-in pages; the choice is remembered per browser.
- Arabic switches the whole layout to right-to-left. The chatbot canvas and charts stay left-to-right on purpose.
- The website passes the visitor's language along (`?lang=ar`), so people who sign up from the Arabic site land in the Arabic dashboard.
- **Translations live in `src/lib/ar.js`**: the English text is the key, the Arabic is the value. To translate something new, wrap it in `tr('…')` (from `useT()`) and add the line to `ar.js`. In development, any English text still missing an Arabic version is listed in the browser console variable `window.__missingAr`.
- Text your customers type (contact names, templates, chatbot messages) is shown as written. Plans have separate English and Arabic descriptions (Admin → Plans).
- Dates use Arabic month names with Western digits, which is common in Gulf business software. Change this in `src/lib/format.js` if you prefer Arabic-Indic digits.

## Development

```bash
npm install
npm run dev        # http://localhost:5173 — proxies /api and /socket.io to http://localhost:4000
```

Run the backend first (`npm run dev` in wappflow-api, after `npm run seed -- --demo`), then sign in with
`owner@demo.local` / `demo12345` (workspace) or `admin@wappflow.local` / `admin12345` (super admin).

## Production

```bash
npm ci && npm run build   # → dist/
```

Easiest: clone this repo next to `wappflow-api` (e.g. `/var/www/wappflow-admin`); the backend serves `../wappflow-admin/dist`
on the same domain automatically (or set `WEB_DIST` in the backend `.env`).

Hosting the dashboard separately (CDN, another domain)? Build with `VITE_API_URL=https://api.example.com npm run build`
and set the backend's `APP_URL` to the dashboard's URL so CORS allows it.

## Structure

```
src/
├── main.jsx              routes (/login, /signup, /app/*, /admin/*)
├── lib/                  api client, session + realtime socket, formatting
├── components/           Shell (sidebar, banners), UI kit, icons
└── pages/
    ├── Auth.jsx
    ├── app/              Dashboard, Inbox, Contacts, Templates, Campaigns, CampaignEditor,
    │                     CampaignDetail, Flows, FlowBuilder, Commerce, Settings, Billing
    └── admin/            Overview, Tenants, Tenant, Plans, Invoices, System
```

# Wasla Admin — WhatsApp Business Platform dashboard

The web dashboard of the Wasla platform: the **customer workspace app** (`/app`) and the **super-admin panel** (`/admin`).
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

## Development

```bash
npm install
npm run dev        # http://localhost:5173 — proxies /api and /socket.io to http://localhost:4000
```

Run the backend first (`npm run dev` in wappflow-api, after `npm run seed -- --demo`), then sign in with
`owner@demo.local` / `demo12345` (workspace) or `admin@wasla.local` / `admin12345` (super admin).

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

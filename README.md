# WappFlow Admin — website, dashboard and super-admin panel

The web front end of the WappFlow platform: the **public website** (`/`, English and Arabic), the **customer workspace app** (`/app`) and the **super-admin panel** (`/admin`).
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

## Website (`/`)

Bilingual marketing site (English / Arabic with right-to-left layout) with an animated WhatsApp chatbot demo, solutions, product screenshots, industries, setup steps, integrations, live pricing from your plans, FAQ and footer.

- **All copy** is in `src/pages/site/content.js`, both languages side by side.
- **Before launch:** set your sales email and WhatsApp number in `CONTACT` at the top of that file, and publish `/terms` and `/privacy` pages (linked from the footer).
- **Pricing** is read live from the plans you manage in Admin → Plans.
- **Screenshots** live in `public/site/`; **logo files** in `public/brand/`.

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

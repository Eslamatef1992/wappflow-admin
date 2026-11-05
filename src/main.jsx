import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './index.css';
import { SessionProvider, useSession } from './lib/session.jsx';
import { ToastProvider, Loading } from './components/ui.jsx';
import { AppShell, AdminShell } from './components/Shell.jsx';
import { Login, Signup } from './pages/Auth.jsx';

const Dashboard = lazy(() => import('./pages/app/Dashboard.jsx'));
const Inbox = lazy(() => import('./pages/app/Inbox.jsx'));
const Contacts = lazy(() => import('./pages/app/Contacts.jsx'));
const Templates = lazy(() => import('./pages/app/Templates.jsx'));
const Campaigns = lazy(() => import('./pages/app/Campaigns.jsx'));
const CampaignEditor = lazy(() => import('./pages/app/CampaignEditor.jsx'));
const CampaignDetail = lazy(() => import('./pages/app/CampaignDetail.jsx'));
const Flows = lazy(() => import('./pages/app/Flows.jsx'));
const FlowBuilder = lazy(() => import('./pages/app/FlowBuilder.jsx'));
const Commerce = lazy(() => import('./pages/app/Commerce.jsx'));
const Settings = lazy(() => import('./pages/app/Settings.jsx'));
const Billing = lazy(() => import('./pages/app/Billing.jsx'));
const AdminOverview = lazy(() => import('./pages/admin/Overview.jsx'));
const AdminTenants = lazy(() => import('./pages/admin/Tenants.jsx'));
const AdminTenant = lazy(() => import('./pages/admin/Tenant.jsx'));
const AdminPlans = lazy(() => import('./pages/admin/Plans.jsx'));
const AdminInvoices = lazy(() => import('./pages/admin/Invoices.jsx'));
const AdminSystem = lazy(() => import('./pages/admin/System.jsx'));

function Guard({ admin, children }) {
  const { loading, me } = useSession();
  if (loading) return <Loading />;
  if (!me) return <Navigate to="/login" replace />;
  const isAdmin = me.user.role === 'superadmin';
  if (admin && !isAdmin) return <Navigate to="/app" replace />;
  if (!admin && isAdmin) return <Navigate to="/admin" replace />;
  return children;
}

function Home() {
  const { loading, me } = useSession();
  if (loading) return <Loading />;
  if (!me) return <Navigate to="/login" replace />;
  return <Navigate to={me.user.role === 'superadmin' ? '/admin' : '/app'} replace />;
}

const S = ({ children }) => <Suspense fallback={<Loading />}>{children}</Suspense>;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <SessionProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/app" element={<Guard><AppShell /></Guard>}>
              <Route index element={<S><Dashboard /></S>} />
              <Route path="inbox" element={<S><Inbox /></S>} />
              <Route path="inbox/:id" element={<S><Inbox /></S>} />
              <Route path="contacts" element={<S><Contacts /></S>} />
              <Route path="templates" element={<S><Templates /></S>} />
              <Route path="campaigns" element={<S><Campaigns /></S>} />
              <Route path="campaigns/new" element={<S><CampaignEditor /></S>} />
              <Route path="campaigns/:id/edit" element={<S><CampaignEditor /></S>} />
              <Route path="campaigns/:id" element={<S><CampaignDetail /></S>} />
              <Route path="flows" element={<S><Flows /></S>} />
              <Route path="flows/:id" element={<S><FlowBuilder /></S>} />
              <Route path="commerce" element={<S><Commerce /></S>} />
              <Route path="settings" element={<S><Settings /></S>} />
              <Route path="billing" element={<S><Billing /></S>} />
            </Route>
            <Route path="/admin" element={<Guard admin><AdminShell /></Guard>}>
              <Route index element={<S><AdminOverview /></S>} />
              <Route path="tenants" element={<S><AdminTenants /></S>} />
              <Route path="tenants/:id" element={<S><AdminTenant /></S>} />
              <Route path="plans" element={<S><AdminPlans /></S>} />
              <Route path="invoices" element={<S><AdminInvoices /></S>} />
              <Route path="system" element={<S><AdminSystem /></S>} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SessionProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);

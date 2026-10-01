import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppProvider, useApp, useStoreState } from './app/AppContext';
import { UiProvider } from './app/UiContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { WelcomePage } from './pages/WelcomePage';
import { HomePage } from './pages/HomePage';
import { SectionPage } from './pages/SectionPage';
import { LibraryItemPage, LibraryPage } from './pages/LibraryPages';
import { Day90Page, MyDataPage, PlanPage } from './pages/PlanDay90Data';
// Staff-only screens load on demand so attendees' phones download less.
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const AdminPage = lazy(() => import('./pages/admin/AdminPage').then((m) => ({ default: m.AdminPage })));

function Splash({ text = 'Opening your workbook' }: { text?: string }) {
  return (
    <div className="center-page" role="status">
      <p className="muted">{text}</p>
    </div>
  );
}

function Gate() {
  const { session, roles, signOut } = useApp();
  const { data, loadError } = useStoreState();
  const loc = useLocation();

  if (session === undefined) return <Splash />;
  if (!session) return <LoginPage />;
  if (loadError && !data) {
    return (
      <div className="center-page">
        <div className="card login-card">
          <h1>We could not open your workbook</h1>
          <p>Check your connection and try again. If this keeps happening, find a facilitator.</p>
          <p className="small muted">{loadError}</p>
          <div className="row">
            <button className="btn" type="button" onClick={() => window.location.reload()}>
              Try again
            </button>
            <button className="btn ghost" type="button" onClick={signOut}>
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (!data) return <Splash />;

  const isStaff = roles.includes('facilitator') || roles.includes('admin');
  const staffRoute = loc.pathname.startsWith('/dashboard') || loc.pathname.startsWith('/admin');
  if (!data.profile.onboarded_at && !(isStaff && staffRoute)) return <WelcomePage />;

  return (
    <Suspense fallback={<Splash text="Loading" />}>
    <Routes>
      <Route path="/dashboard" element={isStaff ? <DashboardPage /> : <Navigate to="/" replace />} />
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="/s/:key" element={<SectionPage />} />
        <Route path="/plan" element={<PlanPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/library/:key" element={<LibraryItemPage />} />
        <Route path="/day-90" element={<Day90Page />} />
        <Route path="/my-data" element={<MyDataPage />} />
        <Route path="/admin" element={roles.includes('admin') ? <AdminPage /> : <Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <AppProvider>
      <UiProvider>
        <BrowserRouter>
          <Gate />
        </BrowserRouter>
      </UiProvider>
    </AppProvider>
  );
}

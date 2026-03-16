import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { SetsPage } from './pages/SetsPage';
import { SetDetailPage } from './pages/SetDetailPage';
import { ElementsPage } from './pages/ElementsPage';
import { ElementDetailPage } from './pages/ElementDetailPage';
import { EditorPage } from './pages/EditorPage';
import { LoginPage } from './pages/LoginPage';
import { DraftsPage } from './pages/DraftsPage';
import { ReviewPage } from './pages/ReviewPage';
import { AboutPage } from './pages/AboutPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { useThemeStore } from './store/themeStore';
import { useAuthStore } from './store/authStore';
import { useDraftsStore } from './store/draftsStore';
import { useReviewStore } from './store/reviewStore';

function ThemeInit() {
  const { dark } = useThemeStore();
  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [dark]);
  return null;
}

/** Initialises auth on mount, then loads data whenever the logged-in user changes. */
function DataLoader() {
  const { initialize, user } = useAuthStore();
  const { loadDrafts } = useDraftsStore();
  const { loadAllComments } = useReviewStore();

  // Initialise Supabase auth session once
  useEffect(() => {
    initialize();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload data whenever user changes (login / logout)
  useEffect(() => {
    if (user) {
      loadDrafts(user.id, user.role);
      loadAllComments();
    }
  }, [user?.id, user?.role]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

export function App() {
  return (
    <BrowserRouter>
      <ThemeInit />
      <DataLoader />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/sets" element={<SetsPage />} />
          <Route path="/sets/:id" element={<SetDetailPage />} />
          <Route path="/elements" element={<ElementsPage />} />
          <Route path="/elements/:id" element={<ElementDetailPage />} />
          <Route path="/editor/:id" element={<EditorPage />} />
          <Route path="/drafts" element={<DraftsPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white">404</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Page not found</p>
            </div>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

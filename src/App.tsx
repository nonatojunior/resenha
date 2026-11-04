import { useEffect } from 'react';
import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { Layout } from './components/Layout';
import { CreateRoomPage } from './pages/CreateRoomPage';
import { HomePage } from './pages/HomePage';
import { JoinRoomPage } from './pages/JoinRoomPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { ResultsPage } from './pages/ResultsPage';
import { RoomPage } from './pages/RoomPage';
import { VotePage } from './pages/VotePage';

const routerBase = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined;

/** O 404.html do GitHub Pages devolve rotas profundas em ?redirect=... */
function RedirectRestore() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const redirect = params.get('redirect');
    if (!redirect) return;

    const clean = redirect.replace(/^\/+/, '');
    if (!clean || clean.startsWith('http://') || clean.startsWith('https://')) return;
    navigate(`/${clean}`, { replace: true });
  }, [location.search, navigate]);

  return null;
}

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView({ block: 'start' });
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, hash]);

  return null;
}

export function App() {
  return (
    <BrowserRouter basename={routerBase}>
      <RedirectRestore />
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="criar" element={<CreateRoomPage />} />
          <Route path="entrar" element={<JoinRoomPage />} />
          <Route path="resenha/:codigo" element={<RoomPage />} />
          <Route path="resenha/:codigo/votar" element={<VotePage />} />
          <Route path="resenha/:codigo/resultado" element={<ResultsPage />} />
          <Route path="privacidade" element={<PrivacyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

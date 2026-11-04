import { Link, Outlet, useLocation } from 'react-router-dom';
import { Info, ShieldCheck } from 'lucide-react';
import { Logo } from './Logo';
import { isSupabaseConfigured } from '../services';

export function Layout() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="app-shell">
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>

      <header className="site-header">
        <div className="container site-header__inner">
          <Logo />
          <nav className="site-nav" aria-label="Navegação principal">
            {isHome ? (
              <>
                <a href="#como-funciona" className="site-nav__link">
                  Como funciona
                </a>
                <a href="#categorias" className="site-nav__link site-nav__link--soft">
                  Categorias
                </a>
              </>
            ) : (
              <Link to="/" className="site-nav__link site-nav__link--soft">
                Início
              </Link>
            )}
            <Link to="/entrar" className="site-nav__link site-nav__link--soft">
              Entrar
            </Link>
          </nav>
          <div className="site-header__actions">
            <Link className="btn btn--yellow btn--sm" to="/criar">
              Criar resenha
            </Link>
          </div>
        </div>
      </header>

      {!isSupabaseConfigured ? (
        <div className="demo-banner" role="status">
          <div className="container demo-banner__inner">
            <Info size={17} aria-hidden="true" />
            <p>
              <strong>Modo demonstração local.</strong> Os dados ficam neste navegador e são
              compartilhados apenas entre abas dele. Configure o Supabase para jogar entre
              dispositivos.
            </p>
          </div>
        </div>
      ) : null}

      <main id="conteudo" className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container site-footer__inner">
          <div className="site-footer__brand">
            <Logo compact />
            <p>
              Humor de grupo, votação secreta e zero responsabilidade sobre as amizades
              abaladas.
            </p>
          </div>
          <div className="site-footer__links">
            <Link to="/criar">Criar resenha</Link>
            <Link to="/entrar">Entrar com código</Link>
            <Link to="/privacidade">Privacidade</Link>
            <span className="site-footer__safe">
              <ShieldCheck size={15} aria-hidden="true" /> Sem e-mail, sem senha, sem drama.
            </span>
          </div>
        </div>
        <div className="container site-footer__legal">
          <p>
            Jogo recreativo. As regras e as categorias são definidas pelo organizador. Use
            apelidos e não compartilhe dados pessoais.
          </p>
          <span>Feito para resenhas brasileiras.</span>
        </div>
      </footer>
    </div>
  );
}

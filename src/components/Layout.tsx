import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import NewsletterPopup from './NewsletterPopup';
import { User } from 'firebase/auth';

interface LayoutProps {
  user: User | null;
}

export default function Layout({ user }: LayoutProps) {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isAdminRoute = location.pathname === '/admin';

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-50 font-sans selection:bg-zinc-800 selection:text-white">
      {isHome && <NewsletterPopup />}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:font-medium focus:rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 focus:ring-white"
      >
        Ana İçeriğe Atla
      </a>
      {isHome && <Navbar user={user} />}
      <main id="main-content" className="flex-grow focus:outline-none" tabIndex={-1}>
        <Outlet />
      </main>
      {isHome && <Footer />}
    </div>
  );
}

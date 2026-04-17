import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
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
  const isCheckout = location.pathname === '/checkout';

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-50 font-sans selection:bg-brand-500/30 selection:text-brand-100">
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-brand-500 origin-left z-[100]"
        style={{ scaleX }}
      />

      {isHome && <NewsletterPopup />}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-500 focus:text-zinc-950 focus:font-medium focus:rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 focus:ring-brand-500"
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

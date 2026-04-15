import { Link, useLocation } from 'react-router-dom';
import { User } from 'firebase/auth';
import { Menu, X, Glasses, Globe } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

interface NavbarProps {
  user: User | null;
}

const LANGUAGES = [
  { code: 'TR', label: 'Türkçe' },
  { code: 'EN', label: 'English' },
  { code: 'KU', label: 'Kurdî' },
  { code: 'FR', label: 'Français' },
  { code: 'DE', label: 'Deutsch' },
  { code: 'ES', label: 'Español' },
  { code: 'AR', label: 'العربية' },
  { code: 'RU', label: 'Русский' },
  { code: 'ZH', label: '中文' },
  { code: 'IT', label: 'Italiano' }
];

export default function Navbar({ user }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const location = useLocation();

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  const links = [
    { name: t('nav.home'), path: '/' },
    { name: t('nav.book'), path: '/kitap' },
    { name: t('nav.consulting'), path: '/iletisim' },
    { name: t('nav.about'), path: '/hakkimda' },
    { name: t('nav.contact'), path: '/iletisim' },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full backdrop-blur-md bg-zinc-950/80 border-b border-white/10" aria-label="Ana Menü">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0 flex items-center">
            <Link
              to="/"
              className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-md p-1"
              aria-label="İshak Alper Ana Sayfa"
            >
              <div className="p-2 bg-brand-500/10 rounded-lg group-hover:bg-brand-500/20 transition-colors">
                <Glasses className="w-6 h-6 text-brand-400 group-hover:text-brand-300 transition-colors" aria-hidden="true" />
              </div>
              <span className="font-serif text-xl font-medium tracking-tight text-zinc-100 group-hover:text-white transition-colors">
                İshak Alper
              </span>
            </Link>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-baseline space-x-8">
              {links.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={clsx(
                      'px-3 py-2 rounded-md text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
                      isActive
                        ? 'text-brand-400 bg-brand-500/10'
                        : 'text-zinc-400 hover:text-brand-300 hover:bg-brand-500/5'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>
            
            {/* Language Switcher Desktop */}
            <div className="relative group border-l border-white/10 pl-6">
              <button className="flex items-center gap-1.5 text-zinc-400 hover:text-brand-300 transition-colors text-sm font-medium px-2 py-1 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                <Globe className="w-4 h-4" />
                <span>{i18n.language}</span>
              </button>
              <div className="absolute right-0 mt-2 w-40 bg-zinc-900 border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 max-h-64 overflow-y-auto">
                {LANGUAGES.map((l) => (
                  <button 
                    key={l.code}
                    onClick={() => handleLanguageChange(l.code)} 
                    className={clsx(
                      "block w-full text-left px-4 py-2 text-sm hover:bg-white/5 transition-colors", 
                      i18n.language === l.code ? "text-brand-400 bg-white/5" : "text-zinc-400"
                    )}
                  >
                    {t(`nav.lang_${l.code}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="-mr-2 flex md:hidden items-center gap-2">
            {/* Language Switcher Mobile (Dropdown) */}
            <div className="relative group">
              <button 
                className="flex items-center gap-1.5 text-zinc-400 hover:text-brand-400 p-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 transition-colors"
                aria-label={t('nav.changeLang')}
              >
                <Globe className="w-5 h-5" />
                <span className="text-sm font-medium">{i18n.language}</span>
              </button>
              <div className="absolute right-0 mt-2 w-40 bg-zinc-900 border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 max-h-64 overflow-y-auto">
                {LANGUAGES.map((l) => (
                  <button 
                    key={l.code}
                    onClick={() => handleLanguageChange(l.code)} 
                    className={clsx(
                      "block w-full text-left px-4 py-2 text-sm hover:bg-white/5 transition-colors", 
                      i18n.language === l.code ? "text-brand-400 bg-white/5" : "text-zinc-400"
                    )}
                  >
                    {t(`nav.lang_${l.code}`)}
                  </button>
                ))}
              </div>
            </div>
            
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-zinc-400 hover:text-brand-400 hover:bg-brand-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 transition-colors"
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
              aria-label={isOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            >
              <span className="sr-only">{isOpen ? t('nav.closeMenu') : t('nav.openMenu')}</span>
              {isOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden bg-zinc-900 border-b border-white/10"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {links.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={clsx(
                      'block px-3 py-2 rounded-md text-base font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900',
                      isActive
                        ? 'text-brand-400 bg-brand-500/10'
                        : 'text-zinc-400 hover:text-brand-300 hover:bg-brand-500/5'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

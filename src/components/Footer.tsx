import { Link } from 'react-router-dom';
import { Glasses, Instagram, Twitter, Mail, Youtube, Video } from 'lucide-react';
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<any>({
    instagramUrl: 'https://instagram.com/ishakalper',
    twitterUrl: 'https://twitter.com/ishakalper',
    youtubeUrl: 'https://youtube.com/@ishakalper',
    tiktokUrl: 'https://tiktok.com/@ishakalper',
    contactEmail: 'ishak595@gmail.com',
    footerAboutText: 'İshak Alper\'in resmi web sitesi. Kitaplar, yazılar, danışmanlık hizmetleri ve güncel projeler.'
  });

  useEffect(() => {
    const docRef = doc(db, 'settings', 'general');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings(prev => ({ ...prev, ...docSnap.data() }));
      }
    });
    
    return () => unsubscribe();
  }, []);

  return (
    <footer className="bg-zinc-950 border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8 mt-auto" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        {t('footer.title')}
      </h2>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-4">
          <Link to="/" className="flex items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-md w-max">
            <Glasses className="w-5 h-5 text-brand-400 group-hover:text-brand-300 transition-colors" aria-hidden="true" />
            <span className="font-serif text-lg font-medium text-zinc-200 group-hover:text-white transition-colors">İshak Alper</span>
          </Link>
          <p className="text-sm text-zinc-400 max-w-xs leading-relaxed">
            {settings.footerAboutText || t('footer.aboutText')}
          </p>
        </div>
        
        <div>
          <h3 className="text-sm font-semibold text-zinc-100 tracking-wider uppercase mb-4">{t('footer.quickLinks')}</h3>
          <ul className="space-y-3">
            <li>
              <Link to="/hakkimda" className="text-sm text-zinc-400 hover:text-brand-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-sm">
                {t('nav.about')}
              </Link>
            </li>
            <li>
              <Link to="/kitap" className="text-sm text-zinc-400 hover:text-brand-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-sm">
                {t('nav.book')}
              </Link>
            </li>
            <li>
              <Link to="/blog" className="text-sm text-zinc-400 hover:text-brand-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-sm">
                {t('nav.blog')}
              </Link>
            </li>
            <li>
              <Link to="/iletisim" className="text-sm text-zinc-400 hover:text-brand-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-sm">
                {t('nav.contact')}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-zinc-100 tracking-wider uppercase mb-4">{t('footer.socialMedia')}</h3>
          <div className="flex space-x-4">
            {settings.instagramUrl && (
              <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-brand-400 transition-colors p-2 -m-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-md" aria-label="Instagram">
                <span className="sr-only">Instagram</span>
                <Instagram className="h-5 w-5" aria-hidden="true" />
              </a>
            )}
            {settings.twitterUrl && (
              <a href={settings.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-brand-400 transition-colors p-2 -m-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-md" aria-label="Twitter / X">
                <span className="sr-only">Twitter / X</span>
                <Twitter className="h-5 w-5" aria-hidden="true" />
              </a>
            )}
            {settings.youtubeUrl && (
              <a href={settings.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-brand-400 transition-colors p-2 -m-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-md" aria-label="YouTube">
                <span className="sr-only">YouTube</span>
                <Youtube className="h-5 w-5" aria-hidden="true" />
              </a>
            )}
            {settings.tiktokUrl && (
              <a href={settings.tiktokUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-brand-400 transition-colors p-2 -m-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-md" aria-label="TikTok">
                <span className="sr-only">TikTok</span>
                <Video className="h-5 w-5" aria-hidden="true" />
              </a>
            )}
            {settings.contactEmail && (
              <a href={`mailto:${settings.contactEmail}`} className="text-zinc-400 hover:text-brand-400 transition-colors p-2 -m-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-md" aria-label={t('footer.emailLabel')}>
                <span className="sr-only">Email</span>
                <Mail className="h-5 w-5" aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-zinc-500 text-center md:text-left">
          &copy; {new Date().getFullYear()} İshak Alper. {t('footer.allRightsReserved')}
        </p>
        <div className="flex items-center gap-4">
          <Link to="/admin" className="text-xs text-zinc-600 hover:text-brand-500 transition-colors">
            {t('footer.adminLogin')}
          </Link>
        </div>
      </div>
    </footer>
  );
}

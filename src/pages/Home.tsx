import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BookOpen, ShoppingCart, Brain, Star, Users } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import ContentFeed from '../components/ContentFeed';
import { handleFirestoreError, OperationType } from '../lib/errorHandling';
import { useTranslation } from 'react-i18next';

import VideoPlayer from '../components/VideoPlayer';

export default function Home() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState({
    profilePictureUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=800&auto=format&fit=crop',
    heroTitle: 'Çıplak Gösteren Gözlükler',
    heroSubtitle: 'Rahatlatıcı yalanları mı tercih edersin, yoksa can yakan ama seni özgürleştirecek gerçeği mi? Bu kitap, yüzleşmekten kaçtığın her şeyi sana gösterecek.',
    instagramUrl: '#',
    twitterUrl: '#',
    linkedinUrl: '#',
    consultancyTitle: '',
    consultancySubtitle: '',
    contentFeedTitle: 'Yüzleşme Notları'
  });

  useEffect(() => {
    const docRef = doc(db, 'settings', 'general');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings(prev => ({ ...prev, ...data }));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/general');
    });
    
    return () => unsubscribe();
  }, []);

  const displayHeroTitle = settings.heroTitle || t('home.heroTitle');
  const displayHeroSubtitle = settings.heroSubtitle || t('home.heroSubtitle');
  const displayContentFeedTitle = settings.contentFeedTitle || t('home.thoughtsAndAnalysis');
  const displayContentFeedSubtitle = (settings as any).contentFeedSubtitle || t('home.thoughtsSubtitle');

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden border-b border-white/5 bg-zinc-950">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/50 via-zinc-950/80 to-zinc-950" />
          <img
            src="https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=1920&auto=format&fit=crop"
            alt=""
            role="presentation"
            className="w-full h-full object-cover opacity-10 mix-blend-luminosity"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border border-white/10 mb-10 shadow-[0_0_40px_rgba(212,175,55,0.15)] relative group">
              <div className="absolute inset-0 bg-brand-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 mix-blend-overlay"></div>
              <img
                src={settings.profilePictureUrl || "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1000&auto=format&fit=crop"}
                alt="İshak Alper"
                className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-700 scale-100 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <div className="flex flex-col items-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-400 text-sm font-medium tracking-wide mb-6">
                <Users className="w-4 h-4" />
                <span>{t('home.readers')}</span>
                <span className="mx-2 opacity-50">|</span>
                <ShoppingCart className="w-4 h-4" />
                <span>{t('home.orders')}</span>
              </div>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-medium text-white leading-[1.1] tracking-tight mb-8">
                {displayHeroTitle.split(' ').map((word: string, i: number, arr: string[]) => 
                  i === arr.length - 1 ? <span key={i} className="text-brand-400 italic font-light">{word}</span> : word + ' '
                )}
              </h1>
            </div>
            
            <p className="text-xl md:text-2xl text-zinc-400 font-light leading-relaxed max-w-3xl mx-auto mb-12">
              {displayHeroSubtitle}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
              <Link
                to="/kitap"
                className="inline-flex items-center justify-center px-8 py-4 text-sm tracking-widest uppercase font-semibold text-white border border-white/20 hover:border-brand-500/50 hover:bg-brand-500/5 transition-all duration-300 rounded-full"
              >
                <BookOpen className="mr-3 w-4 h-4 text-brand-400" />
                {(settings as any).heroCta1 || t('home.reviewBook')}
              </Link>
              <Link
                to="/checkout"
                className="inline-flex items-center justify-center px-8 py-4 text-sm tracking-widest uppercase font-semibold text-zinc-950 bg-brand-500 hover:bg-brand-400 transition-all duration-300 rounded-full shadow-[0_0_30px_rgba(234,179,8,0.3)] hover:shadow-[0_0_40px_rgba(234,179,8,0.5)] hover:-translate-y-1"
              >
                <ShoppingCart className="mr-3 w-4 h-4" />
                {(settings as any).heroCta2 || t('home.orderNow')}
              </Link>
              <Link
                to={(settings as any).calendlyUrl || "/iletisim"}
                target={(settings as any).calendlyUrl ? "_blank" : undefined}
                rel={(settings as any).calendlyUrl ? "noopener noreferrer" : undefined}
                className="inline-flex items-center justify-center px-8 py-4 text-sm tracking-widest uppercase font-semibold text-white bg-zinc-800/80 hover:bg-zinc-700 transition-all duration-300 rounded-full backdrop-blur-sm"
              >
                <Brain className="mr-3 w-4 h-4 text-brand-400" />
                {(settings as any).heroCta3 || t('home.getConsultancy')}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Video Section */}
      {((settings as any).philosophyVideoUrl || ((settings as any).promotionalVideos && (settings as any).promotionalVideos.length > 0)) && (
        <section className="py-24 bg-zinc-900 border-t border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-brand-500/5 mix-blend-overlay pointer-events-none"></div>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-serif text-white tracking-tight mb-4">
                {(settings as any).philosophyTitle || t('home.philosophyTitle')}
              </h2>
              <p className="text-lg text-zinc-400 font-light max-w-2xl mx-auto">
                {(settings as any).philosophySubtitle || t('home.philosophySubtitle')}
              </p>
            </div>
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="rounded-2xl overflow-hidden border border-white/10 bg-black shadow-[0_0_50px_rgba(0,0,0,0.5)] relative aspect-video"
            >
              <VideoPlayer 
                url={(settings as any).philosophyVideoUrl || (settings as any).promotionalVideos?.[0]?.url} 
                className="w-full h-full object-contain" 
                autoPlay 
                muted 
                loop 
              />
            </motion.div>
          </div>
        </section>
      )}

      {/* Content Feed Section */}
      <section className="py-24 bg-zinc-950 border-t border-white/5" aria-labelledby="content-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 id="content-heading" className="text-3xl md:text-5xl font-serif text-white tracking-tight mb-6">
              {displayContentFeedTitle}
            </h2>
            <p className="text-lg text-zinc-400 font-light">
              {displayContentFeedSubtitle}
            </p>
          </div>
          <ContentFeed settings={settings} />
        </div>
      </section>
    </div>
  );
}

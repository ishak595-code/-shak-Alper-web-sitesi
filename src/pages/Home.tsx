import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BookOpen, ShoppingCart, Brain, Star, Users } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import ContentFeed from '../components/ContentFeed';
import { handleFirestoreError, OperationType } from '../lib/errorHandling';
import { useTranslation } from 'react-i18next';
import SEO from '../components/SEO';

import VideoPlayer from '../components/VideoPlayer';

export default function Home() {
  const { t, i18n } = useTranslation();
  const [settings, setSettings] = useState({
    profilePictureUrl: 'https://ui-avatars.com/api/?name=Ishak+Alper&background=27272a&color=ECCC7B&size=512',
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

  const isTr = i18n.language === 'TR' || i18n.language === 'tr';

  const displayHeroTitle = (!isTr ? t('home.heroTitle') : settings.heroTitle) || t('home.heroTitle');
  const displayHeroSubtitle = (!isTr ? t('home.heroSubtitle') : settings.heroSubtitle) || t('home.heroSubtitle');
  const displayContentFeedTitle = (!isTr ? t('home.thoughtsAndAnalysis') : settings.contentFeedTitle) || t('home.thoughtsAndAnalysis');
  const displayContentFeedSubtitle = (!isTr ? t('home.thoughtsSubtitle') : (settings as any).contentFeedSubtitle) || t('home.thoughtsSubtitle');

  return (
    <div className="flex flex-col min-h-screen">
      <SEO 
        title="İshak Alper | Kitap, Yazılar ve Birebir Danışmanlık"
        description="İnsan davranışları, ilişkiler ve zihinsel kalıplar üzerine. Yazılar, kitap ve birebir danışmanlık ile düşünce netliği kazanmanıza yardımcı oluyorum."
      />
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden border-b border-brand-500/10 bg-black">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-900/40 via-black to-black" />
          <img
            src="https://images.unsplash.com/photo-1620121692029-d088224ddc74?q=80&w=1920&auto=format&fit=crop"
            alt=""
            role="presentation"
            className="w-full h-full object-cover opacity-20 mix-blend-luminosity"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/80 to-black pointer-events-none" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-8">
          <div className="flex flex-col items-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="w-32 h-32 sm:w-40 sm:h-40 md:w-52 md:h-52 rounded-full overflow-hidden border border-brand-500/20 mb-10 sm:mb-12 shadow-[0_0_60px_rgba(212,175,55,0.2)] relative group aspect-square flex-shrink-0 ring-4 ring-black"
            >
              <div className="absolute inset-0 bg-brand-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10 mix-blend-overlay"></div>
              <img
                src={settings.profilePictureUrl || "https://ui-avatars.com/api/?name=Ishak+Alper&background=000&color=ECCC7B&size=512"}
                alt="İshak Alper"
                className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-1000 scale-100 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
              className="flex flex-col items-center mb-8"
            >
              <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full border border-brand-500/30 bg-black/50 text-brand-400 text-xs sm:text-sm font-semibold tracking-widest uppercase mb-10 shadow-2xl backdrop-blur-md">
                <Star className="w-4 h-4 fill-brand-400" aria-hidden="true" />
                <span>{(settings as any).newReleaseBadge || t('home.newRelease', 'Yeni Çıkan Kitap')}</span>
                <div className="w-[1px] h-4 bg-brand-500/30 mx-1" aria-hidden="true" />
                <Users className="w-4 h-4" aria-hidden="true" />
                <span>{(settings as any).readersCount || t('home.readers', '9.950+ Okur')}</span>
                <div className="w-[1px] h-4 bg-brand-500/30 mx-1" aria-hidden="true" />
                <ShoppingCart className="w-4 h-4" aria-hidden="true" />
                <span>{(settings as any).ordersCount || t('home.orders', '1.273 Sipariş')}</span>
              </div>
              <h1 className="text-5xl sm:text-6xl md:text-8xl lg:text-[7rem] font-serif font-medium text-white leading-[1.05] tracking-tight mb-8 px-2 drop-shadow-2xl">
                {displayHeroTitle.split(' ').map((word: string, i: number, arr: string[]) => 
                  i === arr.length - 1 ? <span key={i} className="text-brand-400 italic font-light drop-shadow-lg">{word}</span> : word + ' '
                )}
              </h1>
            </motion.div>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
              className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-zinc-300 font-light leading-relaxed max-w-4xl mx-auto mb-14 px-4 drop-shadow-md"
            >
              {displayHeroSubtitle.includes('Rahatlatıcı yalanları') 
                ? 'Etrafındaki maskeleri düşürmeye ve sarsıcı gerçekliğinle yüzleşmeye hazır mısın? Yıllarca sana satılan süslü yalanları bir kenara bırak. Bu eser, ilişkilerini, zihinsel sınırlarını ve hayatı algılayış biçimini kökünden değiştirecek bir psikolojik uyanış manifestosu.' 
                : displayHeroSubtitle}
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-5 justify-center w-full px-4 sm:px-0 sm:w-auto"
            >
              <Link
                to="/checkout"
                className="inline-flex items-center justify-center px-10 py-5 text-sm sm:text-base tracking-widest uppercase font-bold text-black bg-brand-500 hover:bg-brand-400 transition-all duration-300 rounded-full shadow-[0_0_40px_rgba(212,175,55,0.4)] hover:shadow-[0_0_60px_rgba(212,175,55,0.7)] hover:-translate-y-1 active:scale-95 w-full sm:w-auto"
              >
                <ShoppingCart className="mr-3 w-5 h-5" />
                {(settings as any).heroCta2 || t('home.orderNow', 'Kopyanı Hemen Ayırt')}
              </Link>
              <Link
                to="/kitap"
                className="inline-flex items-center justify-center px-10 py-5 text-sm sm:text-base tracking-widest uppercase font-semibold text-white bg-zinc-900/80 hover:bg-zinc-800 transition-all duration-300 rounded-full backdrop-blur-md border border-white/10 hover:border-brand-500/50 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95 w-full sm:w-auto"
              >
                <BookOpen className="mr-3 w-5 h-5 text-brand-400" />
                {(settings as any).heroCta1 || t('home.reviewBook', 'Arka Kapak Yazısını Oku')}
              </Link>
            </motion.div>
          </div>
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

      {/* Psychological Persuasion / Quote Section */}
      <section className="py-32 bg-zinc-950 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-900/20 via-zinc-950 to-zinc-950 pointer-events-none"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <Star className="w-12 h-12 text-brand-500 mx-auto mb-8 opacity-50" />
          <blockquote className="text-2xl md:text-4xl font-serif text-white leading-relaxed mb-8">
            "İnsanların çoğu gerçeği aramaz, sadece inandıkları yalanları doğrulayacak birilerini arar. Bu kitap, o yalanları yüzünüze çarpmak için yazıldı."
          </blockquote>
          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-1px bg-brand-500/50"></div>
            <span className="text-brand-400 font-medium tracking-widest uppercase text-sm">İshak Alper</span>
            <div className="w-12 h-1px bg-brand-500/50"></div>
          </div>
        </div>
      </section>

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

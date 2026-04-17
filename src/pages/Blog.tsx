import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import ContentFeed from '../components/ContentFeed';
import BackButton from '../components/BackButton';
import { handleFirestoreError, OperationType } from '../lib/errorHandling';
import { useTranslation } from 'react-i18next';
import SEO from '../components/SEO';

export default function Blog() {
  const { t, i18n } = useTranslation();
  const [settings, setSettings] = useState({
    profilePictureUrl: 'https://ui-avatars.com/api/?name=Ishak+Alper&background=27272a&color=ECCC7B&size=512',
    contentFeedTitle: 'Blog',
    contentFeedSubtitle: 'Düşünceler, gözlemler ve çıplak gerçekler.'
  });

  const isTr = i18n.language?.toUpperCase().startsWith('TR');

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

  const displayTitle = (isTr ? settings.contentFeedTitle : null) || t('home.thoughtsAndAnalysis', 'Blog & Yüzleşme Notları');
  const displaySubtitle = (isTr ? settings.contentFeedSubtitle : null) || t('home.thoughtsSubtitle', 'Düşünceler, gözlemler ve çıplak gerçekler.');

  return (
    <div className="min-h-screen bg-zinc-950 py-24" aria-labelledby="blog-title">
      <SEO 
        title="Blog & Analizler | İshak Alper"
        description="İshak Alper'in düşünceleri, insan doğası gözlemleri ve hayata dair çıplak gerçekleri içeren blog yazıları."
        url="https://ishakalper.com/blog"
      />
      <BackButton />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-12 border-b border-white/10 pb-8 text-center max-w-3xl mx-auto">
          <h1 id="blog-title" className="text-4xl md:text-5xl font-serif font-medium tracking-tight text-white mb-4">
            {displayTitle}
          </h1>
          <p className="text-xl text-zinc-400 font-light">
            {displaySubtitle}
          </p>
        </header>

        <ContentFeed settings={settings} />
      </div>
    </div>
  );
}

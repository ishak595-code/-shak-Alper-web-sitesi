import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import ContentFeed from '../components/ContentFeed';
import BackButton from '../components/BackButton';
import { handleFirestoreError, OperationType } from '../lib/errorHandling';
import { useTranslation } from 'react-i18next';

export default function Blog() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState({
    profilePictureUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=800&auto=format&fit=crop',
    contentFeedTitle: 'Blog',
    contentFeedSubtitle: 'Düşünceler, gözlemler ve çıplak gerçekler.'
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

  return (
    <div className="min-h-screen bg-zinc-950 py-24" aria-labelledby="blog-title">
      <BackButton />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-12 border-b border-white/10 pb-8 text-center max-w-3xl mx-auto">
          <h1 id="blog-title" className="text-4xl md:text-5xl font-serif font-medium tracking-tight text-white mb-4">
            {settings.contentFeedTitle || t('blog.title')}
          </h1>
          <p className="text-xl text-zinc-400 font-light">
            {settings.contentFeedSubtitle || t('blog.subtitle')}
          </p>
        </header>

        <ContentFeed settings={settings} />
      </div>
    </div>
  );
}

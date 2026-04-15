import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ShoppingCart, BookOpen } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useTranslation } from 'react-i18next';

export default function ReadPreview() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [previewContent, setPreviewContent] = useState<string>('');
  const [bookTitle, setBookTitle] = useState<string>('Çıplak Gösteren Gözlükler');

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Fetch book data for preview content
    const fetchBookData = async () => {
      try {
        const docRef = doc(db, 'settings', 'general');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.bookPreviewContent) {
            setPreviewContent(data.bookPreviewContent);
          }
        }

        const booksQ = query(collection(db, 'books'), orderBy('createdAt', 'desc'), limit(1));
        const booksSnap = await getDocs(booksQ);
        if (!booksSnap.empty) {
          setBookTitle(booksSnap.docs[0].data().title);
        }
      } catch (error) {
        console.error("Error fetching preview content:", error);
      }
    };
    fetchBookData();
  }, []);

  const defaultContent = `
    <h3 class="text-3xl font-serif text-white mb-8 text-center">${t('readPreview.defaultContent.title1')}</h3>
    <p class="text-zinc-300 leading-relaxed mb-6 text-lg">
      ${t('readPreview.defaultContent.p1')}
    </p>
    <p class="text-zinc-300 leading-relaxed mb-6 text-lg">
      ${t('readPreview.defaultContent.p2')}
    </p>
    <p class="text-zinc-300 leading-relaxed mb-6 text-lg">
      ${t('readPreview.defaultContent.p3')}
    </p>
    <h4 class="text-2xl font-serif text-white mt-12 mb-6">${t('readPreview.defaultContent.title2')}</h4>
    <p class="text-zinc-300 leading-relaxed mb-6 text-lg">
      ${t('readPreview.defaultContent.p4')}
    </p>
    <p class="text-zinc-300 leading-relaxed mb-6 text-lg">
      ${t('readPreview.defaultContent.p5')}
    </p>
  `;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans text-zinc-300">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors focus:outline-none"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-medium">{t('readPreview.goBack')}</span>
        </button>
        <div className="font-serif text-xl text-white tracking-tight flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-brand-400" />
          <span className="hidden sm:inline">{bookTitle} - {t('readPreview.firstPages')}</span>
          <span className="sm:hidden">{t('readPreview.firstPages')}</span>
        </div>
        <Link 
          to="/checkout"
          className="hidden sm:flex items-center gap-2 text-sm font-medium text-zinc-950 bg-brand-500 hover:bg-brand-400 px-4 py-2 rounded-full transition-colors"
        >
          <ShoppingCart className="w-4 h-4" />
          {t('readPreview.orderNow')}
        </Link>
        <div className="w-8 sm:hidden" /> {/* Spacer */}
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div 
            className="prose prose-invert prose-brand max-w-none prose-p:text-lg prose-p:leading-relaxed prose-headings:font-serif"
            dangerouslySetInnerHTML={{ __html: previewContent || defaultContent }}
          />
          
          <div className="mt-20 p-8 bg-brand-500/5 border border-brand-500/20 rounded-2xl text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-brand-500/10 pointer-events-none" />
            <div className="relative z-10">
              <h3 className="text-2xl font-serif text-white mb-4">{t('readPreview.readyToFaceTruth')}</h3>
              <p className="text-zinc-400 font-medium mb-8 max-w-lg mx-auto">
                {t('readPreview.ctaDesc')}
              </p>
              <Link 
                to="/checkout"
                className="inline-flex items-center justify-center px-8 py-4 bg-brand-500 text-zinc-950 font-bold rounded-full hover:bg-brand-400 transition-all duration-300 shadow-[0_0_30px_rgba(234,179,8,0.3)] hover:shadow-[0_0_40px_rgba(234,179,8,0.5)] hover:-translate-y-1"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {t('readPreview.orderAndRead')}
              </Link>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

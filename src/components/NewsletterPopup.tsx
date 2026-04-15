import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, CheckCircle2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/errorHandling';
import { useTranslation } from 'react-i18next';

export default function NewsletterPopup() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Check if user has already seen the popup
    const hasSeenPopup = localStorage.getItem('hasSeenNewsletterPopup');
    
    if (!hasSeenPopup) {
      // Show popup after 5 seconds
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('hasSeenNewsletterPopup', 'true');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    setStatus('loading');
    setErrorMessage('');
    try {
      await addDoc(collection(db, 'subscribers'), {
        email: trimmedEmail,
        source: 'popup',
        createdAt: serverTimestamp()
      });
      setStatus('success');
      // Otomatik kapanma süresini biraz daha uzun tutalım ki mesajı okuyabilsinler
      setTimeout(() => {
        handleClose();
      }, 4000);
    } catch (error: any) {
      console.error("Error subscribing:", error);
      setStatus('error');
      setErrorMessage(error.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
      // handleFirestoreError throws an error which causes unhandled promise rejection here
      // handleFirestoreError(error, OperationType.CREATE, 'subscribers');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-zinc-900 border border-brand-500/20 rounded-2xl shadow-2xl overflow-hidden z-10"
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors z-20"
              aria-label="Kapat"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="p-8 md:p-10 text-center relative overflow-hidden">
              {/* Decorative background elements */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-brand-500/10 blur-[50px] rounded-full pointer-events-none" />
              
              {status === 'success' ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative z-10 flex flex-col items-center py-6"
                >
                  <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h2 className="text-3xl font-serif text-white mb-4">{t('newsletter.successTitle')}</h2>
                  <p className="text-zinc-300 mb-8 leading-relaxed">
                    {t('newsletter.successDesc')}
                  </p>
                  <button
                    onClick={handleClose}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl px-5 py-4 transition-colors"
                  >
                    {t('newsletter.backToPage')}
                  </button>
                </motion.div>
              ) : (
                <>
                  <div className="mx-auto w-16 h-16 bg-zinc-950 border border-brand-500/30 rounded-full flex items-center justify-center mb-6 relative z-10 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                    <Key className="w-8 h-8 text-brand-400" />
                  </div>
                  
                  <h2 className="text-3xl font-serif text-white mb-4 relative z-10">{t('newsletter.title')}</h2>
                  <p className="text-zinc-300 mb-8 leading-relaxed relative z-10">
                    {t('newsletter.desc')}
                  </p>

                  <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-4">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('newsletter.emailPlaceholder')}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={status === 'loading'}
                      className="w-full bg-brand-500 hover:bg-brand-400 text-zinc-950 font-bold rounded-xl px-5 py-4 transition-colors disabled:opacity-70 flex items-center justify-center"
                    >
                      {status === 'loading' ? t('newsletter.processing') : t('newsletter.submit')}
                    </button>
                    {status === 'error' && (
                      <p className="text-red-400 text-sm mt-2">
                        {errorMessage || t('newsletter.error')}
                      </p>
                    )}
                  </form>
                  
                  <p className="text-xs text-zinc-600 mt-6 relative z-10">
                    {t('newsletter.spamWarning')}
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

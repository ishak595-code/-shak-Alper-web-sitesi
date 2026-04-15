import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface ReadPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReadPreviewModal({ isOpen, onClose }: ReadPreviewModalProps) {
  const { t } = useTranslation();
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-brand-400" />
                <h2 className="text-xl font-serif text-white">{t('readPreview.readyToFaceTruth')}</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 md:p-10 overflow-y-auto prose prose-invert prose-brand max-w-none">
              <h3 className="text-2xl font-serif text-white mb-6 text-center">{t('readPreview.defaultContent.title1')}</h3>
              <p className="text-zinc-300 leading-relaxed mb-6 text-lg">
                {t('readPreview.defaultContent.p1')}
              </p>
              <p className="text-zinc-300 leading-relaxed mb-6 text-lg">
                {t('readPreview.defaultContent.p2')}
              </p>
              <p className="text-zinc-300 leading-relaxed mb-6 text-lg">
                {t('readPreview.defaultContent.p3')}
              </p>
              <h4 className="text-xl font-serif text-white mt-8 mb-4">{t('readPreview.defaultContent.title2')}</h4>
              <p className="text-zinc-300 leading-relaxed mb-6 text-lg">
                {t('readPreview.defaultContent.p4')}
              </p>
              <p className="text-zinc-300 leading-relaxed mb-6 text-lg">
                {t('readPreview.defaultContent.p5')}
              </p>
              
              <div className="mt-12 p-6 bg-brand-500/10 border border-brand-500/20 rounded-xl text-center">
                <p className="text-brand-300 font-medium mb-4">
                  {t('readPreview.ctaDesc')}
                </p>
                <Link 
                  to="/checkout"
                  onClick={onClose}
                  className="inline-flex items-center justify-center px-8 py-4 bg-brand-500 text-zinc-950 font-bold rounded-full hover:bg-brand-400 transition-all duration-300 shadow-[0_0_30px_rgba(234,179,8,0.3)] hover:shadow-[0_0_40px_rgba(234,179,8,0.5)] hover:-translate-y-1"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {t('readPreview.orderNow')}
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

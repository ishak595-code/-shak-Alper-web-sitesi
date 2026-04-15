import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Check, Headphones, Book as BookIcon, FileText, PenTool, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const FORMATS = {
  fiziki: {
    id: 'fiziki',
    title: 'book.formats.fiziki.title',
    icon: BookIcon,
    price: '₺180',
    desc: 'book.formats.fiziki.desc',
    features: ['book.formats.fiziki.features.0', 'book.formats.fiziki.features.1', 'book.formats.fiziki.features.2']
  },
  pdf: {
    id: 'pdf',
    title: 'book.formats.pdf.title',
    icon: FileText,
    price: '₺120',
    desc: 'book.formats.pdf.desc',
    features: ['book.formats.pdf.features.0', 'book.formats.pdf.features.1', 'book.formats.pdf.features.2']
  },
  sesli: {
    id: 'sesli',
    title: 'book.formats.sesli.title',
    icon: Headphones,
    price: '₺150',
    desc: 'book.formats.sesli.desc',
    features: ['book.formats.sesli.features.0', 'book.formats.sesli.features.1', 'book.formats.sesli.features.2']
  },
  imzali: {
    id: 'imzali',
    title: 'book.formats.imzali.title',
    icon: PenTool,
    price: '₺350',
    desc: 'book.formats.imzali.desc',
    features: ['book.formats.imzali.features.0', 'book.formats.imzali.features.1', 'book.formats.imzali.features.2', 'book.formats.imzali.features.3']
  }
};

type FormatKey = keyof typeof FORMATS;

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PurchaseModal({ isOpen, onClose }: PurchaseModalProps) {
  const { t } = useTranslation();
  const [selectedFormat, setSelectedFormat] = useState<FormatKey>('fiziki');
  const [addedToCart, setAddedToCart] = useState(false);

  const handleAddToCart = () => {
    setAddedToCart(true);
    setTimeout(() => {
      setAddedToCart(false);
      onClose();
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-4xl bg-zinc-900 border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl shadow-brand-900/20 pointer-events-auto relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start mt-4">
                {/* Left Side: Format Selection */}
                <div className="space-y-6">
                  <h3 className="text-2xl font-serif text-white mb-6">{t('checkout.selectFormat')}</h3>
                  <div className="space-y-3">
                    {(Object.keys(FORMATS) as FormatKey[]).map((key) => {
                      const format = FORMATS[key];
                      const isSelected = selectedFormat === key;
                      const Icon = format.icon;
                      return (
                        <button
                          key={key}
                          onClick={() => setSelectedFormat(key)}
                          className={`w-full flex items-center p-4 rounded-xl border transition-all duration-300 ${
                            isSelected 
                              ? 'bg-brand-500/10 border-brand-500 text-white' 
                              : 'bg-zinc-950 border-white/5 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 shrink-0 transition-colors ${
                            isSelected ? 'bg-brand-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="text-left flex-1">
                            <div className="font-medium text-lg">{t(format.title)}</div>
                            <div className={`text-sm ${isSelected ? 'text-brand-400/80' : 'text-zinc-500'}`}>
                              {t(format.desc)}
                            </div>
                          </div>
                          <div className={`text-xl font-bold ml-4 ${isSelected ? 'text-brand-400' : 'text-zinc-500'}`}>
                            {format.price}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right Side: Details & Action */}
                <div className="bg-zinc-950 rounded-2xl p-8 border border-white/5 h-full flex flex-col sticky top-0">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedFormat}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="flex-1 flex flex-col"
                    >
                      <div className="mb-8">
                        <div className="text-brand-400 text-sm font-bold uppercase tracking-wider mb-2">{t('checkout.selectedFormatDetail')}</div>
                        <h3 className="text-3xl font-serif text-white mb-2">{t(FORMATS[selectedFormat].title)}</h3>
                        <div className="text-5xl font-bold text-white mb-6">{FORMATS[selectedFormat].price}</div>
                      </div>

                      <div className="space-y-4 mb-8 flex-1">
                        {FORMATS[selectedFormat].features.map((feature, idx) => (
                          <div key={idx} className="flex items-start text-zinc-300">
                            <Check className="w-5 h-5 text-brand-400 mr-3 shrink-0 mt-0.5" />
                            <span>{t(feature)}</span>
                          </div>
                        ))}
                      </div>

                      <button 
                        onClick={handleAddToCart}
                        className="w-full py-4 px-6 bg-brand-500 hover:bg-brand-400 text-zinc-950 rounded-xl font-medium transition-colors shadow-lg shadow-brand-500/20 flex items-center justify-center overflow-hidden relative text-lg"
                      >
                        <AnimatePresence mode="wait">
                          {addedToCart ? (
                            <motion.span
                              key="added"
                              initial={{ y: 20, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              exit={{ y: -20, opacity: 0 }}
                              className="flex items-center"
                            >
                              <Check className="w-6 h-6 mr-2" /> {t('book.addedToCart')}
                            </motion.span>
                          ) : (
                            <motion.span
                              key="add"
                              initial={{ y: 20, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              exit={{ y: -20, opacity: 0 }}
                              className="flex items-center"
                            >
                              <ShoppingCart className="w-6 h-6 mr-2" />
                              {t('book.startTransformation')}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </button>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

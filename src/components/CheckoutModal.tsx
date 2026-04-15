import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/errorHandling';
import { useTranslation } from 'react-i18next';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  formatTitle: string;
  price: string;
  settings?: {
    instagramUrl: string;
    twitterUrl: string;
    linkedinUrl: string;
  };
}

export default function CheckoutModal({ isOpen, onClose, formatTitle, price, settings }: CheckoutModalProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<'form' | 'submitting' | 'success'>('form');
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  });

  // Prevent scrolling on body when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('submitting');
    setErrorMessage('');
    
    try {
      // Parse price string to number (e.g. "₺180" -> 180)
      const numericPrice = parseInt(price.replace(/[^0-9]/g, ''), 10) || 0;

      await addDoc(collection(db, 'orders'), {
        items: [{
          title: "Çıplak Gösteren Gözlükler",
          option: formatTitle,
          price: numericPrice,
          quantity: 1
        }],
        totalAmount: numericPrice,
        customerInfo: {
          fullName: formData.name,
          email: formData.email,
          fullAddress: formData.address,
          phone: '',
          city: '',
          district: ''
        },
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      setStep('success');
      setTimeout(() => {
        setStep('form');
        setFormData({ name: '', email: '', address: '', cardNumber: '', expiry: '', cvv: '' });
        onClose();
      }, 3000);
    } catch (error: any) {
      console.error("Sipariş oluşturulurken hata:", error);
      setErrorMessage(error.message || "Siparişiniz oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.");
      setStep('form');
      // handleFirestoreError throws an error which causes unhandled promise rejection here
      // handleFirestoreError(error, OperationType.CREATE, 'orders');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-zinc-950 overflow-y-auto"
        >
          <div className="min-h-screen flex flex-col">
            {/* Header with Back Button */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-white/10 bg-zinc-900/80 backdrop-blur-md">
              <button
                onClick={onClose}
                className="flex items-center text-zinc-400 hover:text-brand-400 transition-colors"
              >
                <X className="w-5 h-5 mr-2" />
                <span>{t('checkout.back')}</span>
              </button>
              <div className="text-brand-400 font-serif italic hidden sm:block">{t('checkout.securePayment')}</div>
              <div className="w-32 hidden sm:block" /> {/* Spacer */}
            </div>

            <div className="flex-1 flex items-center justify-center p-4 py-12">
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="w-full max-w-2xl bg-zinc-900 border border-brand-500/30 rounded-3xl p-6 md:p-10 shadow-[0_0_40px_rgba(212,175,55,0.15)]"
              >
                {step === 'form' || step === 'submitting' ? (
                  <div>
                    <h2 className="text-3xl font-serif text-white mb-2">{t('checkout.completeOrder')}</h2>
                    <p className="text-zinc-400 mb-8">
                      {t('checkout.selectedFormatDetail')}: <span className="text-brand-400 font-medium">{formatTitle}</span> — {t('checkout.total')}: <span className="text-white font-bold">{price}</span>
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      {errorMessage && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                          {errorMessage}
                        </div>
                      )}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-white border-b border-white/10 pb-2">{t('checkout.deliveryAddress')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-zinc-400 mb-1">{t('checkout.fullName')}</label>
                            <input required name="name" value={formData.name} onChange={handleInputChange} type="text" className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="Örn: Ahmet Yılmaz" />
                          </div>
                          <div>
                            <label className="block text-sm text-zinc-400 mb-1">{t('checkout.email')}</label>
                            <input required name="email" value={formData.email} onChange={handleInputChange} type="email" className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="ornek@email.com" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm text-zinc-400 mb-1">{t('checkout.fullAddress')}</label>
                          <textarea required name="address" value={formData.address} onChange={handleInputChange} rows={3} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none" placeholder="Açık adresinizi giriniz..." />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-white border-b border-white/10 pb-2 flex items-center">
                          <CreditCard className="w-5 h-5 mr-2 text-brand-400" />
                          {t('checkout.paymentInfo')}
                        </h3>
                        <div>
                          <label className="block text-sm text-zinc-400 mb-1">{t('checkout.cardNumber')}</label>
                          <input required name="cardNumber" value={formData.cardNumber} onChange={handleInputChange} type="text" maxLength={19} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 tracking-widest" placeholder="0000 0000 0000 0000" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-zinc-400 mb-1">{t('checkout.expiryDate')}</label>
                            <input required name="expiry" value={formData.expiry} onChange={handleInputChange} type="text" maxLength={5} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="12/25" />
                          </div>
                          <div>
                            <label className="block text-sm text-zinc-400 mb-1">{t('checkout.cvv')}</label>
                            <input required name="cvv" value={formData.cvv} onChange={handleInputChange} type="text" maxLength={3} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="123" />
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={step === 'submitting'}
                        className="w-full py-4 bg-brand-500 hover:bg-brand-400 text-zinc-950 font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(234,179,8,0.4)] flex items-center justify-center text-lg mt-8 disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.02]"
                      >
                        {step === 'submitting' ? (
                          <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                        ) : (
                          <ShieldCheck className="w-6 h-6 mr-2" />
                        )}
                        {step === 'submitting' ? t('contact.sending') : `${price} - ${t('checkout.securePayment')}`}
                      </button>
                    </form>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <CheckCircle2 className="w-24 h-24 text-brand-500 mx-auto mb-6" />
                    <h2 className="text-3xl font-serif text-white mb-4">{t('checkout.orderReceived')}</h2>
                    <p className="text-zinc-400 text-lg">
                      {t('checkout.orderReceivedDesc')}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

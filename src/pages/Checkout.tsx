import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, CreditCard, MapPin, Package, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useTranslation } from 'react-i18next';

const BOOK_DETAILS = {
  title: "Çıplak Gösteren Gözlükler",
  author: "İshak Alper",
  price: 180,
  pages: 320,
  dimensions: "13.5 x 21 cm",
  paper: "Enzo Kitap Kağıdı",
  coverFront: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop",
  coverBack: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=800&auto=format&fit=crop",
  options: [
    { id: 'standard', name: 'Fiziki Kitap (Standart Baskı)', price: 180, desc: 'Karton kapak, standart gönderim.' },
    { id: 'signed', name: 'İmzalı Özel Baskı', price: 350, desc: 'İsme özel imzalı, öncelikli gönderim, ayraç hediyeli.' },
    { id: 'pdf', name: 'E-Kitap (PDF)', price: 120, desc: 'Anında indirme, tüm cihazlarla uyumlu.' },
    { id: 'audio', name: 'Sesli Kitap', price: 150, desc: 'Yazarın kendi sesinden, yüksek kaliteli MP3.' }
  ]
};

export default function Checkout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [bookData, setBookData] = useState<any>(null);
  const options = [
    { id: 'standard', name: t('checkout.options.standard.name'), price: 180, desc: t('checkout.options.standard.desc') },
    { id: 'signed', name: t('checkout.options.signed.name'), price: 350, desc: t('checkout.options.signed.desc') },
    { id: 'pdf', name: t('checkout.options.pdf.name'), price: 120, desc: t('checkout.options.pdf.desc') },
    { id: 'audio', name: t('checkout.options.audio.name'), price: 150, desc: t('checkout.options.audio.desc') }
  ];

  const [selectedOption, setSelectedOption] = useState(options[0]);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    const booksQ = query(collection(db, 'books'), orderBy('createdAt', 'desc'), limit(1));
    const unsubscribe = onSnapshot(booksQ, (booksSnap) => {
      if (!booksSnap.empty) {
        setBookData({ id: booksSnap.docs[0].id, ...booksSnap.docs[0].data() });
      }
    });
    return () => unsubscribe();
  }, []);

  const displayTitle = bookData?.title || t('checkout.bookDetails.title');
  const displayPages = bookData?.pageCount || BOOK_DETAILS.pages;
  const displayCover = bookData?.coverImage || BOOK_DETAILS.coverFront;

  // Add custom styles for 3D flip
  React.useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .perspective-1000 { perspective: 1000px; }
      .preserve-3d { transform-style: preserve-3d; }
      .backface-hidden { backface-visibility: hidden; }
      .rotate-y-180 { transform: rotateY(180deg); }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Form States
  const [address, setAddress] = useState({
    fullName: '',
    email: '',
    phone: '',
    city: '',
    district: '',
    fullAddress: ''
  });

  const [payment, setPayment] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardHolder: ''
  });

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else navigate(-1);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Save order to Firestore
      await addDoc(collection(db, 'orders'), {
        items: [{
          title: displayTitle,
          option: selectedOption.name,
          price: selectedOption.price,
          quantity: 1
        }],
        totalAmount: selectedOption.price,
        customerInfo: address,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      setStep(4); // Success step
    } catch (error) {
      console.error("Sipariş oluşturulurken hata:", error);
      // Show error toast
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 right-4 bg-red-500/90 text-white px-6 py-3 rounded-xl shadow-2xl z-50 border border-red-400/50 flex items-center gap-3 font-medium';
      toast.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg> ${t('checkout.error')}`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans text-zinc-300">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <button 
          onClick={handleBack}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors focus:outline-none"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-medium">{step === 1 ? t('checkout.back') : t('checkout.back')}</span>
        </button>
        <div className="font-serif text-xl text-white tracking-tight">
          {t('checkout.securePayment')}
        </div>
        <div className="w-20" /> {/* Spacer for centering */}
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 md:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Left Column: Form Steps */}
        <div className="lg:col-span-7 space-y-8">
          {/* Progress Bar */}
          <div className="flex items-center justify-between relative mb-12">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-zinc-900 rounded-full -z-10" />
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-brand-500 rounded-full -z-10 transition-all duration-500"
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            />
            
            {[
              { num: 1, label: t('checkout.order'), icon: Package },
              { num: 2, label: t('checkout.address'), icon: MapPin },
              { num: 3, label: t('checkout.payment'), icon: CreditCard }
            ].map((s) => (
              <div key={s.num} className="flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                  step >= s.num 
                    ? 'bg-brand-500 border-brand-500 text-zinc-950' 
                    : 'bg-zinc-950 border-zinc-800 text-zinc-600'
                }`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <span className={`text-xs font-medium ${step >= s.num ? 'text-brand-400' : 'text-zinc-600'}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 md:p-8">
                  <div className="mb-8">
                    <h2 className="text-3xl font-serif text-white mb-4">{t('checkout.step1.title')}</h2>
                    <p className="text-zinc-400 leading-relaxed">
                      {t('checkout.step1.desc')}
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">{t('checkout.step1.selectFormat')}</h3>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">{t('checkout.selectFormat')}</label>
                      <div className="relative">
                        <select
                          value={selectedOption.id}
                          onChange={(e) => {
                            const option = options.find(o => o.id === e.target.value);
                            if (option) setSelectedOption(option);
                          }}
                          className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none cursor-pointer"
                        >
                          {options.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.name} - ₺{option.price}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-zinc-400">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                    </div>

                    <div className="bg-brand-500/5 border border-brand-500/20 rounded-xl p-4 flex items-start gap-4">
                      <div className="p-2 bg-brand-500/10 rounded-lg shrink-0">
                        <Package className="w-5 h-5 text-brand-400" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium mb-1">{t('checkout.selectedFormatDetail')}</h4>
                        <p className="text-sm text-zinc-400">{selectedOption.desc}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleNext}
                  className="w-full py-4 bg-brand-500 hover:bg-brand-400 text-zinc-950 font-medium rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20"
                >
                  {t('checkout.continue')} <ArrowRight className="w-5 h-5" />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 md:p-8">
                  <h2 className="text-2xl font-serif text-white mb-6">{t('checkout.deliveryAddress')}</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">{t('checkout.fullName')}</label>
                        <input 
                          type="text" 
                          value={address.fullName}
                          onChange={e => setAddress({...address, fullName: e.target.value})}
                          className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                          placeholder={t('checkout.fullNamePlaceholder')}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">{t('checkout.email')}</label>
                        <input 
                          type="email" 
                          value={address.email}
                          onChange={e => setAddress({...address, email: e.target.value})}
                          className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                          placeholder={t('checkout.emailPlaceholder')}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">{t('checkout.phone')}</label>
                        <input 
                          type="tel" 
                          value={address.phone}
                          onChange={e => setAddress({...address, phone: e.target.value})}
                          className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                          placeholder={t('checkout.phonePlaceholder')}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">{t('checkout.city')}</label>
                        <input 
                          type="text" 
                          value={address.city}
                          onChange={e => setAddress({...address, city: e.target.value})}
                          className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                          placeholder={t('checkout.cityPlaceholder')}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">{t('checkout.district')}</label>
                        <input 
                          type="text" 
                          value={address.district}
                          onChange={e => setAddress({...address, district: e.target.value})}
                          className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                          placeholder={t('checkout.districtPlaceholder')}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">{t('checkout.fullAddress')}</label>
                      <textarea 
                        rows={3}
                        value={address.fullAddress}
                        onChange={e => setAddress({...address, fullAddress: e.target.value})}
                        className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                        placeholder={t('checkout.fullAddressPlaceholder')}
                      />
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleNext}
                  disabled={!address.fullName || !address.phone || !address.city || !address.district || !address.fullAddress}
                  className="w-full py-4 bg-brand-500 hover:bg-brand-400 text-zinc-950 font-medium rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('checkout.proceedToPayment')} <ArrowRight className="w-5 h-5" />
                </button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-2xl font-serif text-white">{t('checkout.paymentInfo')}</h2>
                    <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">{t('checkout.cardHolder')}</label>
                      <input 
                        type="text" 
                        value={payment.cardHolder}
                        onChange={e => setPayment({...payment, cardHolder: e.target.value})}
                        className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 uppercase"
                        placeholder={t('checkout.cardHolderPlaceholder')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">{t('checkout.cardNumber')}</label>
                      <input 
                        type="text" 
                        maxLength={19}
                        value={payment.cardNumber}
                        onChange={e => {
                          let val = e.target.value.replace(/\D/g, '');
                          val = val.replace(/(.{4})/g, '$1 ').trim();
                          setPayment({...payment, cardNumber: val});
                        }}
                        className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                        placeholder="0000 0000 0000 0000"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">{t('checkout.expiryDate')}</label>
                        <input 
                          type="text" 
                          maxLength={5}
                          value={payment.expiryDate}
                          onChange={e => {
                            let val = e.target.value.replace(/\D/g, '');
                            if (val.length >= 2) val = val.substring(0, 2) + '/' + val.substring(2, 4);
                            setPayment({...payment, expiryDate: val});
                          }}
                          className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                          placeholder={t('checkout.expiryDatePlaceholder')}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">{t('checkout.cvv')}</label>
                        <input 
                          type="text" 
                          maxLength={3}
                          value={payment.cvv}
                          onChange={e => setPayment({...payment, cvv: e.target.value.replace(/\D/g, '')})}
                          className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                          placeholder="123"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center gap-2 text-sm text-zinc-500">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{t('checkout.securePaymentDesc')}</span>
                  </div>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={isSubmitting || !payment.cardNumber || !payment.cardHolder || !payment.expiryDate || !payment.cvv}
                  className="w-full py-4 bg-brand-500 hover:bg-brand-400 text-zinc-950 font-medium rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="w-6 h-6 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>{t('checkout.completeOrder')} (₺{selectedOption.price})</>
                  )}
                </button>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-zinc-900/50 border border-emerald-500/20 rounded-2xl p-8 md:p-12 text-center space-y-6"
              >
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
                <h2 className="text-3xl font-serif text-white">{t('checkout.orderReceived')}</h2>
                <p className="text-zinc-400 max-w-md mx-auto">
                  {t('checkout.orderReceivedDesc')}
                </p>
                <div className="pt-8">
                  <Link 
                    to="/"
                    className="inline-flex items-center justify-center px-8 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-colors border border-white/10"
                  >
                    {t('checkout.backToHome')}
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Order Summary & Book Card */}
        {step < 4 && (
          <div className="lg:col-span-5">
            <div className="sticky top-28 space-y-6">
              
              {/* Interactive Book Card */}
              <div 
                className="relative w-full aspect-[3/4] max-w-sm mx-auto perspective-1000 cursor-pointer group"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <motion.div
                  className="w-full h-full relative preserve-3d transition-transform duration-700"
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                >
                  {/* Front Cover */}
                  <div className="absolute inset-0 backface-hidden rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                    <img 
                      src={displayCover} 
                      alt="Ön Kapak" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                      <p className="text-brand-400 text-sm font-medium tracking-wider uppercase mb-1">{BOOK_DETAILS.author}</p>
                      <h3 className="text-white font-serif text-2xl leading-tight mb-4">{displayTitle}</h3>
                      
                      <div className="flex flex-wrap gap-2 mt-auto">
                        <span className="px-2 py-1 bg-white/10 backdrop-blur-md rounded text-xs text-white border border-white/10">
                          {displayPages} {t('checkout.pages')}
                        </span>
                        <span className="px-2 py-1 bg-white/10 backdrop-blur-md rounded text-xs text-white border border-white/10">
                          {BOOK_DETAILS.dimensions}
                        </span>
                        <span className="px-2 py-1 bg-white/10 backdrop-blur-md rounded text-xs text-white border border-white/10">
                          {BOOK_DETAILS.paper}
                        </span>
                      </div>
                    </div>
                    <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                      {t('checkout.backCover')}
                    </div>
                  </div>

                  {/* Back Cover */}
                  <div className="absolute inset-0 backface-hidden rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-zinc-900 rotate-y-180">
                    <img 
                      src={BOOK_DETAILS.coverBack} 
                      alt={t('checkout.backCover')} 
                      className="w-full h-full object-cover opacity-40"
                    />
                    <div className="absolute inset-0 p-8 flex flex-col justify-center text-center">
                      <p className="text-zinc-300 font-serif italic text-lg leading-relaxed">
                        {t('checkout.backCoverQuote')}
                      </p>
                    </div>
                    <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                      {t('checkout.frontCover')}
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Order Summary */}
              <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
                <h3 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-4">{t('checkout.orderSummary')}</h3>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-zinc-400">
                    <span>{displayTitle}</span>
                    <span>₺{selectedOption.price}</span>
                  </div>
                  <div className="flex justify-between text-sm text-zinc-500">
                    <span>{t('checkout.option')}: {selectedOption.name}</span>
                  </div>
                  <div className="flex justify-between text-sm text-zinc-500">
                    <span>{t('checkout.shipping')}</span>
                    <span className="text-emerald-400">{t('checkout.free')}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-lg font-medium text-white pt-4 border-t border-white/10">
                  <span>{t('checkout.total')}</span>
                  <span className="text-brand-400 text-2xl">₺{selectedOption.price}</span>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'framer-motion';
import { Send, CheckCircle2, AlertCircle, Brain, TrendingUp, HeartHandshake, Calendar, PhoneCall, ArrowRight } from 'lucide-react';
import BackButton from '../components/BackButton';
import { handleFirestoreError, OperationType } from '../lib/errorHandling';
import { useTranslation } from 'react-i18next';

export default function Contact() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', package: '', message: '' });
  const [errors, setErrors] = useState({ name: '', phone: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [settings, setSettings] = useState({
    consultancyTitle: 'Danışmanlık Hizmetleri',
    consultancySubtitle: 'Kendi potansiyelini keşfetmek, zihinsel engelleri aşmak ve hayatına yeni bir yön vermek isteyenler için profesyonel rehberlik.',
    consultancyButtonText: 'Dönüşüme Başla'
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

  const validateForm = () => {
    let isValid = true;
    const newErrors = { name: '', phone: '', email: '', message: '' };

    if (formData.name.trim().length < 2) {
      newErrors.name = t('contact.errors.name');
      isValid = false;
    }

    if (formData.phone.trim().length < 10) {
      newErrors.phone = t('contact.errors.phone');
      isValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = t('contact.errors.email');
      isValid = false;
    }

    if (formData.message.trim().length < 10) {
      newErrors.message = t('contact.errors.message');
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    try {
      await addDoc(collection(db, 'consulting_requests'), {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        package: formData.package || t('contact.generalConsultancy'),
        message: formData.message,
        status: 'new',
        createdAt: serverTimestamp()
      });
      setStatus('success');
      setFormData({ name: '', phone: '', email: '', package: '', message: '' });
    } catch (err: any) {
      console.error("Error sending request:", err);
      setStatus('error');
      setErrorMessage(t('contact.error'));
      handleFirestoreError(err, OperationType.CREATE, 'consulting_requests');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 py-24" aria-labelledby="contact-title">
      <BackButton />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-32">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 id="consultancy-heading" className="text-3xl md:text-5xl font-serif text-white tracking-tight mb-6">
            {settings.consultancyTitle || t('contact.consultancyTitle')}
          </h2>
          <p className="text-xl text-zinc-400 font-light leading-relaxed">
            {settings.consultancySubtitle || t('contact.consultancySubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Brain,
              title: t('contact.services.mental.title'),
              desc: t('contact.services.mental.desc')
            },
            {
              icon: TrendingUp,
              title: t('contact.services.financial.title'),
              desc: t('contact.services.financial.desc')
            },
            {
              icon: HeartHandshake,
              title: t('contact.services.relationships.title'),
              desc: t('contact.services.relationships.desc')
            },
            {
              icon: Brain,
              title: t('contact.services.darkPsychology.title'),
              desc: t('contact.services.darkPsychology.desc')
            },
            {
              icon: HeartHandshake,
              title: t('contact.services.energy.title'),
              desc: t('contact.services.energy.desc')
            },
            {
              icon: TrendingUp,
              title: t('contact.services.vip.title'),
              desc: t('contact.services.vip.desc')
            }
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 hover:bg-zinc-900 transition-colors group flex flex-col"
            >
              <div className="w-12 h-12 bg-brand-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <item.icon className="w-6 h-6 text-brand-400" />
              </div>
              <h3 className="text-lg font-serif text-white mb-2">{item.title}</h3>
              <p className="text-sm text-zinc-400 font-light leading-relaxed mb-6 flex-grow">
                {item.desc}
              </p>
              
              <div className="flex flex-col gap-3 mt-auto">
                <a 
                  href="#iletisim-formu"
                  onClick={() => setFormData(prev => ({ ...prev, package: item.title }))}
                  className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-zinc-950 bg-brand-500 hover:bg-brand-400 transition-colors rounded-xl shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                >
                  <Calendar className="mr-2 w-4 h-4" />
                  {t('contact.requestAppointment')}
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8" id="iletisim-formu">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-16"
        >
          <header className="text-center space-y-6 border-b border-white/10 pb-16">
            <h1 id="contact-title" className="text-5xl md:text-6xl font-serif font-medium tracking-tight text-white">
              {t('contact.title')}
            </h1>
            <p className="text-xl text-zinc-400 font-light max-w-2xl mx-auto">
              {t('contact.subtitle')}
            </p>
          </header>

          <div className="bg-zinc-900/50 border border-white/5 p-8 md:p-12 rounded-2xl shadow-2xl relative overflow-hidden">
            {status === 'success' ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16 space-y-8 relative z-10"
              >
                <div className="absolute inset-0 bg-brand-500/5 blur-3xl -z-10 rounded-full" />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                >
                  <CheckCircle2 className="w-24 h-24 text-brand-500 mx-auto drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]" />
                </motion.div>
                <div className="space-y-4">
                  <h2 className="text-3xl font-serif text-white">{t('contact.success')}</h2>
                  <p className="text-xl text-zinc-400 font-light">
                    {t('contact.successDesc')}
                  </p>
                </div>
                <button
                  onClick={() => setStatus('idle')}
                  className="mt-8 px-8 py-4 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 font-medium rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 border border-brand-500/30"
                >
                  {t('contact.newMessage')}
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                {status === 'error' && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 text-red-400">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p>{errorMessage}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium text-zinc-300 uppercase tracking-wider">
                    {t('contact.name')}
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: '' });
                    }}
                    className={`w-full bg-zinc-950 border ${errors.name ? 'border-red-500/50 focus:ring-red-500' : 'border-white/10 focus:ring-brand-500'} rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow`}
                    placeholder={t('contact.namePlaceholder')}
                  />
                  {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="block text-sm font-medium text-zinc-300 uppercase tracking-wider">
                    {t('contact.phone')}
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      if (errors.phone) setErrors({ ...errors, phone: '' });
                    }}
                    className={`w-full bg-zinc-950 border ${errors.phone ? 'border-red-500/50 focus:ring-red-500' : 'border-white/10 focus:ring-brand-500'} rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow`}
                    placeholder={t('contact.phonePlaceholder')}
                  />
                  {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-zinc-300 uppercase tracking-wider">
                    {t('contact.email')}
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    className={`w-full bg-zinc-950 border ${errors.email ? 'border-red-500/50 focus:ring-red-500' : 'border-white/10 focus:ring-brand-500'} rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow`}
                    placeholder={t('contact.emailPlaceholder')}
                  />
                  {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="package" className="block text-sm font-medium text-zinc-300 uppercase tracking-wider">
                    {t('contact.interestedConsultancy')}
                  </label>
                  <select
                    id="package"
                    value={formData.package}
                    onChange={(e) => setFormData({ ...formData, package: e.target.value })}
                    className="w-full bg-zinc-950 border border-white/10 focus:ring-brand-500 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow"
                  >
                    <option value="">{t('contact.generalConsultancy')} ({t('contact.makeSelection')})</option>
                    <option value="Zihinsel Yeniden İnşa">{t('contact.services.mental.title')}</option>
                    <option value="Finansal Uyanış & Özgürlük Psikolojisi">{t('contact.services.financial.title')}</option>
                    <option value="İlişki Dinamikleri & Sınır Çizme Sanatı">{t('contact.services.relationships.title')}</option>
                    <option value="Karanlık Psikoloji & İnsan Okuma Sanatı">{t('contact.services.darkPsychology.title')}</option>
                    <option value="Bütünsel Enerji & Biyohack">{t('contact.services.energy.title')}</option>
                    <option value="VIP Dönüşüm & Stratejik Yaşam Tasarımı">{t('contact.services.vip.title')}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="block text-sm font-medium text-zinc-300 uppercase tracking-wider">
                    {t('contact.message')}
                  </label>
                  <textarea
                    id="message"
                    rows={6}
                    value={formData.message}
                    onChange={(e) => {
                      setFormData({ ...formData, message: e.target.value });
                      if (errors.message) setErrors({ ...errors, message: '' });
                    }}
                    className={`w-full bg-zinc-950 border ${errors.message ? 'border-red-500/50 focus:ring-red-500' : 'border-white/10 focus:ring-brand-500'} rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow resize-none`}
                    placeholder={t('contact.messagePlaceholder')}
                  />
                  {errors.message && <p className="text-red-400 text-sm mt-1">{errors.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full flex items-center justify-center px-8 py-4 text-base font-medium text-zinc-950 bg-brand-500 hover:bg-brand-400 transition-colors rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-500/20"
                >
                  {status === 'submitting' ? (
                    <div className="w-6 h-6 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      {t('contact.send')}
                      <Send className="ml-2 w-5 h-5" aria-hidden="true" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          <div className="pt-12 border-t border-white/10 text-center">
            <h2 className="text-2xl font-serif text-white mb-6">{t('contact.followUs')}</h2>
            <div className="flex justify-center gap-6">
              {(settings as any).instagramUrl && (
                <a href={(settings as any).instagramUrl} target="_blank" rel="noopener noreferrer" className="p-4 bg-zinc-900/50 border border-white/5 rounded-full text-zinc-400 hover:text-brand-400 hover:border-brand-500/50 hover:bg-brand-500/10 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" aria-label="Instagram">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </a>
              )}
              {(settings as any).twitterUrl && (
                <a href={(settings as any).twitterUrl} target="_blank" rel="noopener noreferrer" className="p-4 bg-zinc-900/50 border border-white/5 rounded-full text-zinc-400 hover:text-brand-400 hover:border-brand-500/50 hover:bg-brand-500/10 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" aria-label="Twitter / X">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                </a>
              )}
              {(settings as any).youtubeUrl && (
                <a href={(settings as any).youtubeUrl} target="_blank" rel="noopener noreferrer" className="p-4 bg-zinc-900/50 border border-white/5 rounded-full text-zinc-400 hover:text-brand-400 hover:border-brand-500/50 hover:bg-brand-500/10 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" aria-label="YouTube">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 7.1C2.6 5.9 3.4 5.1 4.6 5c3.2-.3 7.4-.3 10.6 0 1.2.1 2 .9 2.1 2.1.3 2.4.3 4.8 0 7.2-.1 1.2-.9 2-2.1 2.1-3.2.3-7.4.3-10.6 0-1.2-.1-2-.9-2.1-2.1-.3-2.4-.3-4.8 0-7.2Z"/><path d="m10 15 5-3-5-3v6Z"/></svg>
                </a>
              )}
              {(settings as any).tiktokUrl && (
                <a href={(settings as any).tiktokUrl} target="_blank" rel="noopener noreferrer" className="p-4 bg-zinc-900/50 border border-white/5 rounded-full text-zinc-400 hover:text-brand-400 hover:border-brand-500/50 hover:bg-brand-500/10 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" aria-label="TikTok">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
                </a>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

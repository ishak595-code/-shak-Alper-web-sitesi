import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, BookOpen, Heart, Award, Globe, Users, Briefcase, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import BackButton from '../components/BackButton';
import { useTranslation } from 'react-i18next';

export default function About() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'general');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 py-24" aria-labelledby="about-title">
      <BackButton />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="relative aspect-square md:aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl shadow-brand-900/20 border border-white/10"
          >
            <img
              src={settings.profilePictureUrl || "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1000&auto=format&fit=crop"}
              alt="İshak Alper"
              className="w-full h-full object-cover mix-blend-luminosity opacity-90"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
            <div className="absolute bottom-8 left-8">
              <h1 id="about-title" className="text-4xl md:text-5xl font-serif font-medium text-white mb-2">
                İshak Alper
              </h1>
              <p className="text-brand-400 font-medium tracking-widest uppercase text-sm">{t('about.subtitle')}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-6 text-zinc-300 leading-relaxed font-light text-lg"
          >
            <p className="text-2xl text-white font-serif font-medium italic mb-8">
              "{settings.aboutQuote || 'Kendi köklerinden gelen değerlere sıkı sıkıya bağlı kalırken, modern dünyanın gerekliliklerine uyum sağlamak...'}"
            </p>
            <p>
              {settings.aboutParagraph1 || t('about.paragraph1')}
            </p>
            <p>
              {settings.aboutParagraph2 || t('about.paragraph2')}
            </p>
            <p>
              {settings.aboutParagraph3 || t('about.paragraph3')}
            </p>
          </motion.div>
        </div>

        {/* Görmeden Gören Gözler Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="bg-zinc-900/30 border border-white/5 rounded-3xl p-8 md:p-12 mb-24 relative overflow-hidden"
        >
          <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
            <Eye className="w-12 h-12 mx-auto text-brand-500" aria-hidden="true" />
            <h2 className="text-3xl md:text-4xl font-serif text-white tracking-tight">
              {t('about.section1Title')}
            </h2>
            <div className="space-y-6 text-lg text-zinc-400 leading-relaxed font-light">
              <p>
                {t('about.section1P1')}
              </p>
              <p>
                {t('about.section1P2')}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Çıplak Gösteren Gözlükler Intro Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <h2 className="text-3xl md:text-5xl font-serif text-white tracking-tight">
              {t('about.section2Title')}
            </h2>
            <div className="space-y-6 text-lg text-zinc-400 leading-relaxed font-light">
              <p>
                {t('about.section2P1')}
              </p>
              <p>
                {t('about.section2P2')}
              </p>
            </div>
            <Link
              to="/kitap"
              className="inline-flex items-center text-brand-400 font-medium hover:text-brand-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 rounded-sm p-1 -ml-1"
            >
              {(settings as any).readFirstPagesText || t('book.readFirstPages')}
              <BookOpen className="ml-2 w-5 h-5" aria-hidden="true" />
            </Link>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl shadow-brand-900/20 border border-white/10"
          >
            <img
              src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop"
              alt={t('about.bookCoverAlt')}
              className="w-full h-full object-cover mix-blend-luminosity"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-transparent" />
          </motion.div>
        </div>

        {/* Journey & Career Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 md:p-12 mb-24 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-50" />
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-3xl font-serif text-white text-center mb-12">{t('about.section3Title')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-4">
                <Globe className="w-8 h-8 text-brand-500 mb-4" />
                <h3 className="text-xl font-medium text-white">{t('about.socialMedia')}</h3>
                <p className="text-zinc-400 font-light leading-relaxed">
                  {t('about.socialMediaDesc')}
                </p>
              </div>
              
              <div className="space-y-4">
                <Briefcase className="w-8 h-8 text-brand-500 mb-4" />
                <h3 className="text-xl font-medium text-white">{t('about.versatile')}</h3>
                <p className="text-zinc-400 font-light leading-relaxed">
                  {t('about.versatileDesc')}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Education & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="p-6 border border-white/5 rounded-2xl bg-zinc-950 hover:border-brand-500/30 transition-colors"
          >
            <Users className="w-8 h-8 text-brand-400 mb-4" />
            <h3 className="text-xl font-medium text-white mb-3">{t('about.psychology')}</h3>
            <p className="text-zinc-400 font-light text-sm leading-relaxed">
              {t('about.psychologyDesc')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="p-6 border border-white/5 rounded-2xl bg-zinc-950 hover:border-brand-500/30 transition-colors"
          >
            <BookOpen className="w-8 h-8 text-brand-400 mb-4" />
            <h3 className="text-xl font-medium text-white mb-3">{t('about.finance')}</h3>
            <p className="text-zinc-400 font-light text-sm leading-relaxed">
              {t('about.financeDesc')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-6 border border-white/5 rounded-2xl bg-zinc-950 hover:border-brand-500/30 transition-colors"
          >
            <Globe className="w-8 h-8 text-brand-400 mb-4" />
            <h3 className="text-xl font-medium text-white mb-3">{t('about.globalVision')}</h3>
            <p className="text-zinc-400 font-light text-sm leading-relaxed">
              {t('about.globalVisionDesc')}
            </p>
          </motion.div>
        </div>

        {/* Consultation CTA */}
        <motion.div
          id="danismanlik"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-brand-500 rounded-3xl p-8 md:p-16 text-center relative overflow-hidden shadow-2xl shadow-brand-500/20"
        >
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1000&auto=format&fit=crop')] opacity-10 mix-blend-multiply" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <MessageCircle className="w-12 h-12 text-zinc-950 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-zinc-950 mb-6">
              {t('about.consultingTitle')}
            </h2>
            <p className="text-zinc-900 text-lg mb-8 font-medium">
              {t('about.consultingDesc')}
            </p>
            <Link
              to={settings.aboutButtonLink || "/iletisim"}
              className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-zinc-950 hover:bg-zinc-800 transition-colors rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-500"
            >
              {settings.aboutButtonText || t('contact.contactUs')}
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  );
}

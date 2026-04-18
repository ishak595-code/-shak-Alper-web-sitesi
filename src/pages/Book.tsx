import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Check, Star, ChevronLeft, ChevronRight, Headphones, MessageCircle, ChevronDown, ChevronUp, Book as BookIcon, FileText, PenTool, BookOpen, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { collection, query, orderBy, limit, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import PurchaseModal from '../components/PurchaseModal';
import ReadPreviewModal from '../components/ReadPreviewModal';
import BackButton from '../components/BackButton';
import { useTranslation } from 'react-i18next';
import SEO from '../components/SEO';

const REVIEWS = [
  {
    id: 1,
    name: "Ayşe Y.",
    role: "Okur",
    content: "Bu kitap beni paramparça etti. Yıllardır kendime söylediğim yalanları yüzüme vurdu. Okuması zordu ama hayatımda verdiğim en dürüst kararları bu kitaptan sonra aldım.",
    rating: 5
  },
  {
    id: 2,
    name: "Mehmet K.",
    role: "Psikolog",
    content: "Kişisel gelişim kitaplarından nefret ederim çünkü çoğu sahtedir. Bu kitap ise acımasızca gerçek. Kendi maskemi indirmemi sağlayan nadir eserlerden biri.",
    rating: 5
  },
  {
    id: 3,
    name: "Zeynep A.",
    role: "Öğrenci",
    content: "Rahatsız edici derecede dürüst. Okurken defalarca kitabı kapatıp derin bir nefes almak zorunda kaldım. Çünkü yazar, benden saklamaya çalıştığım beni bana anlatıyordu.",
    rating: 5
  },
  {
    id: 4,
    name: "Can B.",
    role: "Girişimci",
    content: "İş hayatımda ve ilişkilerimde neden sürekli aynı hataları yaptığımı bu kitabı okuyana kadar anlamamıştım. Bu bir kitap değil, bir uyanış çağrısı.",
    rating: 5
  }
];

const FORMATS = {
  fiziki: {
    id: 'fiziki',
    title: 'book.formats.fiziki.title',
    icon: BookIcon,
    price: '997 TL',
    desc: 'book.formats.fiziki.desc',
    features: ['book.formats.fiziki.features.0', 'book.formats.fiziki.features.1', 'book.formats.fiziki.features.2']
  },
  pdf: {
    id: 'pdf',
    title: 'book.formats.pdf.title',
    icon: FileText,
    price: '1.900 TL',
    desc: 'book.formats.pdf.desc',
    features: ['book.formats.pdf.features.0', 'book.formats.pdf.features.1', 'book.formats.pdf.features.2']
  },
  sesli: {
    id: 'sesli',
    title: 'book.formats.sesli.title',
    icon: Headphones,
    price: '597 TL',
    desc: 'book.formats.sesli.desc',
    features: ['book.formats.sesli.features.0', 'book.formats.sesli.features.1', 'book.formats.sesli.features.2']
  },
  imzali: {
    id: 'imzali',
    title: 'book.formats.imzali.title',
    icon: PenTool,
    price: '3.000 TL',
    desc: 'book.formats.imzali.desc',
    features: ['book.formats.imzali.features.0', 'book.formats.imzali.features.1', 'book.formats.imzali.features.2', 'book.formats.imzali.features.3']
  }
};

type FormatKey = keyof typeof FORMATS;

import { handleFirestoreError, OperationType } from '../lib/errorHandling';
import VideoPlayer from '../components/VideoPlayer';

export default function Book() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' }, [Autoplay()]);
  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false);
  const [expandedReview, setExpandedReview] = useState<number | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isReadPreviewModalOpen, setIsReadPreviewModalOpen] = useState(false);
  const [book, setBook] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setPrevBtnEnabled(emblaApi.canScrollPrev());
    setNextBtnEnabled(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  useEffect(() => {
    const booksQ = query(collection(db, 'books'), orderBy('createdAt', 'desc'), limit(1));
    const unsubscribeBooks = onSnapshot(booksQ, (booksSnap) => {
      if (!booksSnap.empty) {
        setBook({ id: booksSnap.docs[0].id, ...booksSnap.docs[0].data() });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'books');
    });

    const docRef = doc(db, 'settings', 'general');
    const unsubscribeSettings = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/general');
    });

    return () => {
      unsubscribeBooks();
      unsubscribeSettings();
    };
  }, []);

  const isTr = i18n.language?.toUpperCase().startsWith('TR');

  const displayBookTitle = (isTr ? book?.title : null) || `${t('book.titlePart1')} ${t('book.titlePart2')}`;
  const displayBookDesc = (isTr ? book?.description : null) || t('book.description');

  const promotionalVideos = settings?.promotionalVideos || [
    { title: "Çıplak Gösteren Gözlükler - Genel Bakış", desc: "Kitabın temel felsefesi ve vaatleri üzerine bir inceleme.", url: "https://www.youtube.com/watch?v=LXb3EKWsInQ", poster: "https://images.unsplash.com/photo-1476275466078-4007374efac4?q=80&w=1920&auto=format&fit=crop" },
    { title: "Psikolojik Vaat", desc: "Çıplak gözle görmek ne anlama geliyor?", url: "https://www.youtube.com/watch?v=LXb3EKWsInQ", poster: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800&auto=format&fit=crop" },
    { title: "Sizin Davetiniz", desc: "Dönüşümü başlatmaya hazır mısınız?", url: "https://www.youtube.com/watch?v=LXb3EKWsInQ", poster: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=800&auto=format&fit=crop" },
    { title: "Gerçeği Görmeye Hazır Mısınız?", desc: "Kitabın meydan okuması.", url: "https://www.youtube.com/watch?v=LXb3EKWsInQ", poster: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800&auto=format&fit=crop" },
    { title: "Maskesiz Yaşamak", desc: "Ruhsal ve finansal zenginlik.", url: "https://www.youtube.com/watch?v=LXb3EKWsInQ", poster: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?q=80&w=800&auto=format&fit=crop" }
  ];

  return (
    <div className="min-h-screen bg-zinc-950" aria-labelledby="book-title">
      <SEO 
        title="Çıplak Gösteren Gözlükler | İshak Alper"
        description="Rahatlatıcı yalanları bırakıp yüzleşmeye hazır mısınız? İshak Alper'in sarsıcı yeni kitabı 'Çıplak Gösteren Gözlükler'i inceleyin ve hemen satın alın."
        url="https://ishakalper.com/kitap"
      />
      <BackButton />
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/50 via-zinc-950/80 to-zinc-950" />
          <img
            src="https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=1920&auto=format&fit=crop"
            alt=""
            role="presentation"
            className="w-full h-full object-cover opacity-20 mix-blend-luminosity"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8 text-center lg:text-left"
            >
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
                <motion.div 
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-flex items-center px-4 py-1.5 rounded-full border border-red-500/50 bg-red-500/10 text-red-400 text-sm font-bold tracking-wide uppercase shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                >
                  <span className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></span>
                  {t('book.firstEditionSpecial')} - Sınırlı Stok
                </motion.div>
                <div className="inline-flex items-center gap-2 text-sm font-medium text-zinc-300">
                  <Users className="w-4 h-4 text-brand-400" />
                  <span>{t('home.readers')}</span>
                  <span className="opacity-50">|</span>
                  <ShoppingCart className="w-4 h-4 text-brand-400" />
                  <span>{t('home.orders')}</span>
                </div>
              </div>
              <h1 id="book-title" className="text-5xl md:text-7xl font-serif font-medium tracking-tight text-white leading-tight">
                {displayBookTitle}
              </h1>
              <p className="text-xl text-zinc-400 font-light leading-relaxed max-w-2xl mx-auto lg:mx-0">
                {displayBookDesc}
              </p>
              <div className="pt-4 pb-2">
                <p className="text-sm text-brand-400 font-medium italic text-center lg:text-left">
                  {t('book.warning')}
                </p>
              </div>
              <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start max-w-md mx-auto lg:mx-0 w-full">
                <Link
                  to="/checkout"
                  className="flex-1 inline-flex items-center justify-center px-8 py-4 text-sm tracking-widest uppercase font-semibold text-zinc-950 bg-brand-500 hover:bg-brand-400 transition-all duration-300 rounded-full shadow-[0_0_30px_rgba(234,179,8,0.3)] hover:shadow-[0_0_40px_rgba(234,179,8,0.5)] hover:-translate-y-1"
                  aria-label="Kitabı Satın Alma Seçeneklerini Gör"
                >
                  <ShoppingCart className="mr-3 w-4 h-4" aria-hidden="true" />
                  {(settings as any)?.heroCta2 || t('book.buy')}
                </Link>
                <button
                  onClick={() => {
                    if (book?.readFirstPagesLink) {
                      window.open(book.readFirstPagesLink, '_blank');
                    } else {
                      navigate('/kitap/oku');
                    }
                  }}
                  className="flex-1 inline-flex items-center justify-center px-8 py-4 text-sm tracking-widest uppercase font-semibold text-white border border-white/20 hover:border-brand-500/50 hover:bg-brand-500/5 transition-all duration-300 rounded-full hover:-translate-y-1"
                  aria-label="İlk Sayfaları Oku"
                >
                  <BookOpen className="mr-3 w-4 h-4 text-brand-400" aria-hidden="true" />
                  {t('book.readFirstPages')}
                </button>
              </div>

              {book?.purchaseLinks && book.purchaseLinks.length > 0 && (
                <div className="mt-10 pt-8 border-t border-white/10">
                  <p className="text-sm text-zinc-400 mb-4 text-center lg:text-left font-medium uppercase tracking-wider">{t('book.buyFromOtherPlatforms')}</p>
                  <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                    {book.purchaseLinks.map((link: any, idx: number) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-6 py-3 bg-zinc-900 hover:bg-brand-500 hover:text-zinc-950 border border-white/10 hover:border-brand-500 rounded-xl text-sm font-semibold text-zinc-300 transition-all duration-300 group"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2 opacity-70 group-hover:opacity-100" />
                        {t('book.buyFromPlatform', { platform: link.platform })}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative mx-auto w-full max-w-md perspective-1000"
            >
              <div className="relative aspect-[2/3] rounded-r-2xl rounded-l-sm overflow-hidden shadow-2xl shadow-brand-900/50 border-y border-r border-white/10 border-l-4 border-l-brand-900 transform rotate-y-[-15deg] hover:rotate-y-0 transition-transform duration-700">
                <img
                  src={book?.coverImage || "https://storage.googleapis.com/aistudio-janus-prod-us-central1-uploads/9z187121g2h.png"}
                  alt={book?.title || t('book.coverImageAlt')}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Promotional Videos Section */}
      <section className="py-24 bg-zinc-900 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-medium text-white mb-4">{t('book.promotionalVideosTitle')}</h2>
            <p className="text-zinc-400 text-lg">{t('book.promotionalVideosDesc')}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Main Featured Video */}
            {promotionalVideos.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="lg:col-span-2 lg:row-span-2 rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl flex flex-col"
              >
                <div className="p-6 bg-zinc-900 border-b border-white/5">
                  <h3 className="text-2xl font-serif text-white mb-2">{promotionalVideos[0].title}</h3>
                  <p className="text-zinc-400 text-sm">{promotionalVideos[0].desc}</p>
                </div>
                <div className="relative w-full flex-1">
                  <VideoPlayer 
                    url={promotionalVideos[0].url}
                    className="w-full h-full object-contain aspect-video"
                  />
                </div>
              </motion.div>
            )}

            {/* Secondary Videos */}
            {promotionalVideos.slice(1).map((video: any, idx: number) => (
              <motion.div 
                key={`${idx}-${video.url}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="rounded-2xl overflow-hidden border border-white/10 bg-black shadow-lg flex flex-col"
              >
                <div className="p-4 bg-zinc-900 border-b border-white/5">
                  <h3 className="text-lg font-serif text-white mb-1">{video.title}</h3>
                  <p className="text-zinc-400 text-xs line-clamp-1">{video.desc}</p>
                </div>
                <div className="relative w-full flex-1">
                  <VideoPlayer 
                    url={video.url}
                    className="w-full h-full object-contain aspect-video"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Books Section */}
      <section className="py-24 bg-zinc-950 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-medium text-white mb-4">{t('book.upcomingBooksTitle')}</h2>
            <p className="text-zinc-400 text-lg">{t('book.upcomingBooksDesc')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-8 flex flex-col items-center text-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="w-24 h-32 bg-zinc-800 rounded-md mb-6 flex items-center justify-center shadow-lg border border-white/10 relative overflow-hidden">
                  <BookIcon className="w-8 h-8 text-zinc-600" />
                  <div className="absolute inset-0 bg-brand-500/10 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-brand-400 text-xs font-bold uppercase tracking-wider">{t('book.soon')}</span>
                  </div>
                </div>
                <h3 className="text-xl font-serif font-medium text-white mb-2">{t('book.untitledWork', { number: item })}</h3>
                <p className="text-zinc-500 text-sm">{t('book.preparationPhase')}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-24 bg-zinc-900 overflow-hidden border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-medium text-white mb-4">{t('book.reviewsTitle')}</h2>
            <p className="text-zinc-400 text-lg">{t('book.reviewsDesc')}</p>
          </div>

          <div className="relative">
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex -ml-4">
                {REVIEWS.map((review) => (
                  <div key={review.id} className="flex-none w-full md:w-1/2 lg:w-1/3 pl-4">
                    <div 
                      className="bg-zinc-950 p-8 rounded-2xl border border-white/10 h-full flex flex-col cursor-pointer hover:border-brand-500/30 transition-colors"
                      onClick={() => setExpandedReview(expandedReview === review.id ? null : review.id)}
                    >
                      <div className="flex items-center gap-1 mb-6">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 text-brand-400 fill-brand-400" />
                        ))}
                      </div>
                      
                      <div className="mt-auto flex items-center justify-between mb-4">
                        <div>
                          <p className="text-white font-medium">{review.name}</p>
                          <p className="text-zinc-500 text-sm">{review.role}</p>
                        </div>
                        <button className="text-zinc-500 hover:text-brand-400 transition-colors">
                          {expandedReview === review.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>

                      <AnimatePresence>
                        {expandedReview === review.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <p className="text-zinc-300 italic pt-4 border-t border-white/10">"{review.content}"</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <button
              onClick={scrollPrev}
              disabled={!prevBtnEnabled}
              className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-12 w-10 h-10 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label={t('book.prevReview')}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={scrollNext}
              disabled={!nextBtnEnabled}
              className="absolute top-1/2 -translate-y-1/2 -right-4 md:-right-12 w-10 h-10 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label={t('book.nextReview')}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </section>

      <PurchaseModal 
        isOpen={isPurchaseModalOpen} 
        onClose={() => setIsPurchaseModalOpen(false)} 
      />
      <ReadPreviewModal
        isOpen={isReadPreviewModalOpen}
        onClose={() => setIsReadPreviewModalOpen(false)}
      />
    </div>
  );
}

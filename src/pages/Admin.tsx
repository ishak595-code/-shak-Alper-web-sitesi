import React, { useState, useEffect } from 'react';
import { User, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, query, orderBy, getDocs, deleteDoc, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../lib/firebase';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Plus, LogOut, Edit2, Trash2, Eye, EyeOff, FileText, Settings, Book, BarChart3, Database, ShoppingCart, Users, MessageSquare, Upload, X, Mail, Calendar, Heart, MessageCircle, Send, Bookmark, AlertCircle } from 'lucide-react';
import { seedBlogPosts } from '../lib/seed';
import { handleFirestoreError, OperationType } from '../lib/errorHandling';
import BackButton from '../components/BackButton';
import VideoPlayer from '../components/VideoPlayer';

interface AdminProps {
  user: User | null;
}

interface BlogPost {
  id: string;
  title: string;
  excerpt?: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  createdAt: any;
  authorId: string;
  published: boolean;
  tags?: string[];
  likes?: number;
  comments?: any[];
  shares?: number;
  saves?: number;
}

export default function Admin({ user }: AdminProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPost, setCurrentPost] = useState<Partial<BlogPost>>({ title: '', content: '', excerpt: '', imageUrl: '', videoUrl: '', published: true, tags: [] });
  const [activeTab, setActiveTab] = useState<'posts' | 'settings' | 'books' | 'analytics' | 'messages' | 'consulting' | 'subscribers' | 'orders' | null>(null);
  const [settingsTab, setSettingsTab] = useState<'general' | 'texts' | 'about' | 'social' | 'consulting' | 'videos' | 'seo' | 'account'>('general');
  const [seeding, setSeeding] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<{ [key: string]: boolean }>({});
  const [storageError, setStorageError] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, folder: string, callback: (url: string) => void, fieldKey: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(prev => ({ ...prev, [fieldKey]: true }));
    
    // IMAGE HANDLING: Bypass Firebase Storage using base64 + canvas downscaling to fit inside Firestore 1MB limits
    if (file.type.startsWith('image/')) {
      try {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800; // Resize to ensure it fits in Firestore
            const MAX_HEIGHT = 800;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8); // 80% quality JPEG
            
            callback(dataUrl);
            setUploadingFile(prev => ({ ...prev, [fieldKey]: false }));
            showToast('Görsel başarıyla eklendi!');
          };
          img.onerror = () => {
             setUploadingFile(prev => ({ ...prev, [fieldKey]: false }));
             showToast('Görsel işlenemedi.');
          };
          img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
        return; // Exit here, handled entirely in-browser
      } catch (err) {
        console.error("Base64 converion error:", err);
      }
    }

    // NON-IMAGE (Video, etc) HANDLING: Requires Firebase Storage
    try {
      const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
      
      const uploadPromise = uploadBytes(storageRef, file);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), 15000)
      );
      
      await Promise.race([uploadPromise, timeoutPromise]);
      const downloadURL = await getDownloadURL(storageRef);
      
      callback(downloadURL);
      setUploadingFile(prev => ({ ...prev, [fieldKey]: false }));
      showToast('Dosya başarıyla yüklendi!');
    } catch (error: any) {
      console.error("Upload error:", error);
      if (error.message === 'TIMEOUT' || error.code === 'storage/retry-limit-exceeded' || error.code === 'storage/unauthorized' || error.code === 'storage/unknown') {
        setStorageError(true);
      } else {
        showToast('Dosya yüklenirken hata oluştu: ' + error.message);
      }
      setUploadingFile(prev => ({ ...prev, [fieldKey]: false }));
    }
  };
  
  // Messages State
  const [messages, setMessages] = useState<any[]>([]);

  // Orders State
  const [orders, setOrders] = useState<any[]>([]);

  // Subscribers State
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  // Analytics State
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSubscribers: 0,
    totalMessages: 0,
    totalConsultingRequests: 0
  });

  // Books State
  const [books, setBooks] = useState<any[]>([]);
  const [currentBook, setCurrentBook] = useState<any>({
    title: '', description: '', price: '', coverImage: '', readFirstPagesLink: '', purchaseLinks: [], pageCount: ''
  });
  const [isEditingBook, setIsEditingBook] = useState(false);
  const [settings, setSettings] = useState({
    profilePictureUrl: 'https://ui-avatars.com/api/?name=Ishak+Alper&background=27272a&color=ECCC7B&size=512',
    heroTitle: 'Çıplak Gösteren Gözlükler',
    heroSubtitle: 'Etrafındaki maskeleri düşürmeye ve sarsıcı gerçekliğinle yüzleşmeye hazır mısın? Yıllarca sana satılan süslü yalanları bir kenara bırak. Bu eser, ilişkilerini, zihinsel sınırlarını ve hayatı algılayış biçimini kökünden değiştirecek bir psikolojik uyanış manifestosu.',
    instagramUrl: '#',
    twitterUrl: '#',
    linkedinUrl: '#',
    youtubeUrl: '#',
    tiktokUrl: '#',
    contactEmail: 'ishak595@gmail.com',
    consultancyTitle: 'Birebir VIP Danışmanlık',
    consultancySubtitle: 'Kendi potansiyelinizi keşfetmek ve ilişkilerinizdeki kör noktaları fark etmek için birebir görüşme ayarlayın.',
    consultancyButtonText: 'Dönüşüme Başla',
    heroCta1: 'Arka Kapak Yazısını Oku',
    heroCta2: 'Kopyanı Hemen Ayırt',
    heroCta3: 'VIP Danışmanlık',
    newReleaseBadge: 'Yeni Çıkan Kitap',
    readersCount: '9.950+ Okur',
    ordersCount: '1.273 Sipariş',
    bookPreviewContent: '',
    calendlyUrl: '',
    contentFeedTitle: 'Gözlüğün Düşünceleri',
    contentFeedSubtitle: 'İnsan davranışları, ilişkiler ve hayatın görünmeyen tarafları üzerine kısa notlar ve derinlemesine analizler.',
    footerAboutText: 'İshak Alper\'in resmi web sitesi. Kitaplar, yazılar, danışmanlık hizmetleri ve güncel projeler.',
    philosophyTitle: 'Gerçeği Görmeye Hazır Mısınız?',
    philosophySubtitle: 'Kitabın felsefesine kısa bir bakış.',
    philosophyVideoUrl: 'https://www.youtube.com/watch?v=LXb3EKWsInQ',
    aboutButtonText: 'İletişime Geçin',
    aboutButtonLink: '/iletisim',
    readFirstPagesText: 'Önsözü Oku ve Kitabı İncele',
    promotionalVideos: [
      { title: "Çıplak Gösteren Gözlükler - Genel Bakış", desc: "Kitabın temel felsefesi ve vaatleri üzerine bir inceleme.", url: "https://www.youtube.com/watch?v=LXb3EKWsInQ", poster: "https://images.unsplash.com/photo-1476275466078-4007374efac4?q=80&w=1920&auto=format&fit=crop" },
      { title: "Psikolojik Vaat", desc: "Çıplak gözle görmek ne anlama geliyor?", url: "https://www.youtube.com/watch?v=LXb3EKWsInQ", poster: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800&auto=format&fit=crop" },
      { title: "Sizin Davetiniz", desc: "Dönüşümü başlatmaya hazır mısınız?", url: "https://www.youtube.com/watch?v=LXb3EKWsInQ", poster: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=800&auto=format&fit=crop" },
      { title: "Gerçeği Görmeye Hazır Mısınız?", desc: "Kitabın meydan okuması.", url: "https://www.youtube.com/watch?v=LXb3EKWsInQ", poster: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800&auto=format&fit=crop" },
      { title: "Maskesiz Yaşamak", desc: "Ruhsal ve finansal zenginlik.", url: "https://www.youtube.com/watch?v=LXb3EKWsInQ", poster: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?q=80&w=800&auto=format&fit=crop" }
    ],
    seoKeywords: "İshak Alper, Çıplak Gösteren Gözlükler, kişisel gelişim kitabı, psikoloji danışmanlık, karanlık psikoloji",
    seoDescription: "İshak Alper - Çıplak Gösteren Gözlükler kitabının yazarı. Karanlık psikoloji ve davranış bilimleri danışmanlık hizmetleri."
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Consulting Requests State
  const [consultingRequests, setConsultingRequests] = useState<any[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string, onConfirm: () => void } | null>(null);

  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const confirmAction = (message: string, onConfirm: () => void) => {
    setConfirmDialog({ message, onConfirm });
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'general');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(prev => ({ ...prev, ...docSnap.data() }));
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const docRef = doc(db, 'settings', 'general');
      
      // Filter out empty promotional videos before saving
      const cleanedSettings = { ...settings };
      if (cleanedSettings.promotionalVideos) {
        cleanedSettings.promotionalVideos = cleanedSettings.promotionalVideos.filter(
          (v: any) => v.url && v.url.trim() !== ''
        );
      }
      
      await setDoc(docRef, cleanedSettings, { merge: true });
      showToast('Ayarlar başarıyla kaydedildi!');
      setActiveTab(null); // Close the settings tab after successful save
    } catch (error) {
      console.error("Error saving settings:", error);
      showToast('Ayarlar kaydedilirken bir hata oluştu.');
      handleFirestoreError(error, OperationType.WRITE, 'settings/general');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    handleFileUpload(e, 'promotional_videos', (url) => {
      const newVideos = [...settings.promotionalVideos];
      newVideos[index].url = url;
      setSettings({ ...settings, promotionalVideos: newVideos });
    }, `promoVideo_${index}`);
  };

  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    handleFileUpload(e, 'promotional_posters', (url) => {
      const newVideos = [...settings.promotionalVideos];
      newVideos[index].poster = url;
      setSettings({ ...settings, promotionalVideos: newVideos });
    }, `promoPoster_${index}`);
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const fetchedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BlogPost[];
      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      handleFirestoreError(error, OperationType.LIST, 'posts');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatsAndBooks = async () => {
    try {
      // Fetch stats
      const ordersSnap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
      const subsSnap = await getDocs(collection(db, 'subscribers'));
      const msgsSnap = await getDocs(collection(db, 'messages'));
      const consultingSnap = await getDocs(collection(db, 'consulting_requests'));
      
      setStats({
        totalOrders: ordersSnap.size,
        totalSubscribers: subsSnap.size,
        totalMessages: msgsSnap.size,
        totalConsultingRequests: consultingSnap.size
      });

      setOrders(ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch books
      const booksQ = query(collection(db, 'books'), orderBy('createdAt', 'desc'));
      const booksSnap = await getDocs(booksQ);
      setBooks(booksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching stats or books:", error);
    }
  };

  const fetchMessages = async () => {
    try {
      const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching messages:", error);
      handleFirestoreError(error, OperationType.LIST, 'messages');
    }
  };

  const fetchConsultingRequests = async () => {
    try {
      const q = query(collection(db, 'consulting_requests'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setConsultingRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching consulting requests:", error);
      handleFirestoreError(error, OperationType.LIST, 'consulting_requests');
    }
  };

  const fetchSubscribers = async () => {
    try {
      const q = query(collection(db, 'subscribers'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setSubscribers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching subscribers:", error);
      handleFirestoreError(error, OperationType.LIST, 'subscribers');
    }
  };

  const handleDeleteSubscriber = (id: string) => {
    confirmAction('Bu aboneyi silmek istediğinize emin misiniz?', async () => {
      try {
        await deleteDoc(doc(db, 'subscribers', id));
        fetchSubscribers();
        showToast('Abone silindi.');
      } catch (error) {
        console.error("Error deleting subscriber:", error);
        showToast('Abone silinirken hata oluştu.');
        handleFirestoreError(error, OperationType.DELETE, 'subscribers');
      }
    });
  };

  useEffect(() => {
    if (user && user.email === 'ishak595@gmail.com') {
      fetchPosts();
      fetchStatsAndBooks();
      fetchMessages();
      fetchConsultingRequests();
      fetchSubscribers();
      
      // Auto-fix bad video links in settings
      const fixVideoLinks = async () => {
        try {
          const ref = doc(db, 'settings', 'general');
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data();
            if (data.promotionalVideos) {
              let changed = false;
              const updated = data.promotionalVideos.map((v: any) => {
                if (v.url && v.url.includes("storage.googleapis.com/gtv-videos-bucket")) {
                  changed = true;
                  return { ...v, url: "https://www.youtube.com/watch?v=LXb3EKWsInQ" };
                }
                return v;
              });
              if (changed) {
                await updateDoc(ref, { promotionalVideos: updated });
                console.log("Fixed promotional video links in Firestore");
              }
            }
          }
        } catch (error) {
          console.error("Error fixing video links:", error);
        }
      };
      fixVideoLinks();
    }
  }, [user]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user.email !== 'ishak595@gmail.com') {
        await signOut(auth);
        showToast('Yetkisiz erişim. Sadece yönetici hesabı ile giriş yapabilirsiniz.');
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (currentPost.id) {
        // Update
        const postRef = doc(db, 'posts', currentPost.id);
        await updateDoc(postRef, {
          title: currentPost.title,
          content: currentPost.content,
          excerpt: currentPost.excerpt,
          imageUrl: currentPost.imageUrl || '',
          videoUrl: currentPost.videoUrl || '',
          published: currentPost.published,
          tags: currentPost.tags || []
        });
      } else {
        // Create
        await addDoc(collection(db, 'posts'), {
          title: currentPost.title,
          content: currentPost.content,
          excerpt: currentPost.excerpt,
          imageUrl: currentPost.imageUrl || '',
          videoUrl: currentPost.videoUrl || '',
          published: currentPost.published,
          tags: currentPost.tags || [],
          authorId: user.uid,
          createdAt: serverTimestamp()
        });
      }
      setIsEditing(false);
      setCurrentPost({ title: '', content: '', excerpt: '', imageUrl: '', videoUrl: '', published: true, tags: [] });
      fetchPosts();
      showToast('Yazı başarıyla kaydedildi!');
    } catch (error) {
      console.error("Error saving post:", error);
      showToast("Yazı kaydedilirken bir hata oluştu.");
      handleFirestoreError(error, currentPost.id ? OperationType.UPDATE : OperationType.CREATE, 'posts');
    }
  };

  const handleDelete = (id: string) => {
    confirmAction('Bu yazıyı silmek istediğinize emin misiniz?', async () => {
      try {
        await deleteDoc(doc(db, 'posts', id));
        fetchPosts();
        showToast('Yazı silindi.');
      } catch (error) {
        console.error("Error deleting post:", error);
        showToast('Yazı silinirken hata oluştu.');
        handleFirestoreError(error, OperationType.DELETE, 'posts');
      }
    });
  };

  const handleEdit = (post: BlogPost) => {
    setCurrentPost(post);
    setIsEditing(true);
  };

  const handleSeedPosts = () => {
    if (!user) return;
    confirmAction('15 adet örnek blog yazısı yüklenecek. Onaylıyor musunuz?', async () => {
      setSeeding(true);
      try {
        const count = await seedBlogPosts(user.uid);
        showToast(`${count} adet yazı başarıyla yüklendi!`);
        fetchPosts();
      } catch (error) {
        console.error("Error seeding posts:", error);
        showToast("Yazılar yüklenirken bir hata oluştu.");
      } finally {
        setSeeding(false);
      }
    });
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentBook.id) {
        await updateDoc(doc(db, 'books', currentBook.id), {
          ...currentBook,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'books'), {
          ...currentBook,
          createdAt: serverTimestamp()
        });
      }
      setIsEditingBook(false);
      setCurrentBook({ title: '', description: '', price: '', coverImage: '', readFirstPagesLink: '', purchaseLinks: [], pageCount: '' });
      fetchStatsAndBooks();
      showToast('Kitap başarıyla kaydedildi!');
    } catch (error) {
      console.error("Error saving book:", error);
      showToast("Kitap kaydedilirken hata oluştu.");
      handleFirestoreError(error, currentBook.id ? OperationType.UPDATE : OperationType.CREATE, 'books');
    }
  };

  const handleDeleteBook = (id: string) => {
    confirmAction('Bu kitabı silmek istediğinize emin misiniz?', async () => {
      try {
        await deleteDoc(doc(db, 'books', id));
        fetchStatsAndBooks();
        showToast('Kitap silindi.');
      } catch (error) {
        console.error("Error deleting book:", error);
        showToast('Kitap silinirken hata oluştu.');
        handleFirestoreError(error, OperationType.DELETE, 'books');
      }
    });
  };

  if (!user || user.email !== 'ishak595@gmail.com') {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md w-full">
          <h1 className="text-3xl font-serif text-white">Yönetim Paneli</h1>
          <p className="text-zinc-400">Bu alana sadece yetkili kullanıcılar erişebilir.</p>
          {user && user.email !== 'ishak595@gmail.com' && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              Mevcut hesabınız ({user.email}) ile bu sayfaya erişim yetkiniz bulunmuyor. Lütfen yönetici hesabınızla giriş yapın.
            </div>
          )}
          <button
            onClick={handleLogin}
            className="w-full flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-zinc-950 bg-brand-500 hover:bg-brand-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 focus:ring-brand-500 transition-colors shadow-lg shadow-brand-500/20"
          >
            Google ile Giriş Yap
          </button>
          {user && (
            <button
              onClick={handleLogout}
              className="w-full flex justify-center items-center px-6 py-3 border border-white/10 text-base font-medium rounded-md text-zinc-300 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 focus:ring-brand-500 transition-colors mt-4"
            >
              Çıkış Yap
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 py-24 relative">
      <BackButton />
      
      {storageError && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-xl font-serif">Dosya Yükleme Kullanılamıyor</h3>
            </div>
            <div className="text-zinc-300 space-y-4 text-sm">
              <p>Depolama sunucusunda videolar için yer yok veya aktif değil.</p>
              <p className="text-brand-400 font-medium">Çözüm:</p>
              <p>Lütfen <strong>Video yüklemek</strong> yerine YouTube, Vimeo vb. platformlardan aldığınız linki (URL) ilgili kutuya yapıştırın. Resim yüklemeleri otomatik sistemle çözülmüştür, sadece videolarda dış link kullanınız.</p>
            </div>
            <button
              onClick={() => setStorageError(false)}
              className="mt-6 w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors"
            >
              Anladım, Kapat
            </button>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-zinc-800 text-white px-6 py-3 rounded-lg shadow-lg border border-white/10">
          {toastMessage}
        </div>
      )}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-white/10 p-6 rounded-xl max-w-sm w-full mx-4">
            <p className="text-white mb-6 text-lg">{confirmDialog.message}</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
              >
                İptal
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="px-4 py-2 bg-brand-500 text-zinc-950 rounded-lg font-medium hover:bg-brand-400 transition-colors"
              >
                Onayla
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {activeTab === null ? (
          <>
            <div className="flex justify-between items-center mb-12 border-b border-white/10 pb-6">
              <h1 className="text-3xl font-serif text-white">Yönetim Paneli</h1>
              <div className="flex items-center gap-4">
                <span className="text-sm text-zinc-400">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-4 py-2 border border-white/10 rounded-md text-sm font-medium text-zinc-300 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 focus:ring-brand-500 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Çıkış
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button 
                onClick={() => { setActiveTab('analytics'); setIsEditing(false); setIsEditingBook(false); }}
                className="flex flex-col items-center justify-center gap-4 p-8 bg-zinc-900/50 border border-white/5 rounded-2xl hover:bg-zinc-800 hover:border-brand-500/50 transition-all group"
              >
                <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-8 h-8 text-brand-400" />
                </div>
                <span className="text-lg font-medium text-white">Analitik</span>
              </button>
              <button 
                onClick={() => { setActiveTab('orders'); setIsEditing(false); setIsEditingBook(false); }}
                className="flex flex-col items-center justify-center gap-4 p-8 bg-zinc-900/50 border border-white/5 rounded-2xl hover:bg-zinc-800 hover:border-brand-500/50 transition-all group"
              >
                <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShoppingCart className="w-8 h-8 text-brand-400" />
                </div>
                <span className="text-lg font-medium text-white">Siparişler</span>
              </button>
              <button 
                onClick={() => { setActiveTab('books'); setIsEditing(false); setIsEditingBook(false); }}
                className="flex flex-col items-center justify-center gap-4 p-8 bg-zinc-900/50 border border-white/5 rounded-2xl hover:bg-zinc-800 hover:border-brand-500/50 transition-all group"
              >
                <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Book className="w-8 h-8 text-brand-400" />
                </div>
                <span className="text-lg font-medium text-white">Kitap Yönetimi</span>
              </button>
              <button 
                onClick={() => { setActiveTab('posts'); setIsEditing(false); setIsEditingBook(false); }}
                className="flex flex-col items-center justify-center gap-4 p-8 bg-zinc-900/50 border border-white/5 rounded-2xl hover:bg-zinc-800 hover:border-brand-500/50 transition-all group"
              >
                <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="w-8 h-8 text-brand-400" />
                </div>
                <span className="text-lg font-medium text-white">Blog Yazıları</span>
              </button>
              <button 
                onClick={() => { setActiveTab('messages'); setIsEditing(false); setIsEditingBook(false); }}
                className="flex flex-col items-center justify-center gap-4 p-8 bg-zinc-900/50 border border-white/5 rounded-2xl hover:bg-zinc-800 hover:border-brand-500/50 transition-all group"
              >
                <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-8 h-8 text-brand-400" />
                </div>
                <span className="text-lg font-medium text-white">Gelen Mesajlar</span>
              </button>
              <button 
                onClick={() => { setActiveTab('consulting'); setIsEditing(false); setIsEditingBook(false); }}
                className="flex flex-col items-center justify-center gap-4 p-8 bg-zinc-900/50 border border-white/5 rounded-2xl hover:bg-zinc-800 hover:border-brand-500/50 transition-all group"
              >
                <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Calendar className="w-8 h-8 text-brand-400" />
                </div>
                <span className="text-lg font-medium text-white">Danışmanlık</span>
              </button>
              <button 
                onClick={() => { setActiveTab('subscribers'); setIsEditing(false); setIsEditingBook(false); }}
                className="flex flex-col items-center justify-center gap-4 p-8 bg-zinc-900/50 border border-white/5 rounded-2xl hover:bg-zinc-800 hover:border-brand-500/50 transition-all group"
              >
                <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 text-brand-400" />
                </div>
                <span className="text-lg font-medium text-white">Bülten Aboneleri</span>
              </button>
              <button 
                onClick={() => { setActiveTab('settings'); setIsEditing(false); setIsEditingBook(false); }}
                className="flex flex-col items-center justify-center gap-4 p-8 bg-zinc-900/50 border border-white/5 rounded-2xl hover:bg-zinc-800 hover:border-brand-500/50 transition-all group"
              >
                <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Settings className="w-8 h-8 text-brand-400" />
                </div>
                <span className="text-lg font-medium text-white">Site Ayarları</span>
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col h-full">
            <div className="mb-8">
              <button
                onClick={() => setActiveTab(null)}
                className="inline-flex items-center px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg transition-colors border border-white/10"
              >
                <X className="w-5 h-5 mr-2" />
                Menüye Dön
              </button>
            </div>
            
            <div className="flex-1 bg-zinc-950">
              {activeTab === 'analytics' ? (
              <div className="space-y-6">
                <h2 className="text-2xl font-serif text-white mb-6">Analitik ve İstatistikler</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-zinc-400 font-medium">Toplam Sipariş</h3>
                      <ShoppingCart className="w-5 h-5 text-brand-400" />
                    </div>
                    <p className="text-4xl font-serif text-white">{stats.totalOrders}</p>
                  </div>
                  <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-zinc-400 font-medium">Toplam Abone</h3>
                      <Users className="w-5 h-5 text-brand-400" />
                    </div>
                    <p className="text-4xl font-serif text-white">{stats.totalSubscribers}</p>
                  </div>
                  <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-zinc-400 font-medium">Gelen Mesajlar</h3>
                      <MessageSquare className="w-5 h-5 text-brand-400" />
                    </div>
                    <p className="text-4xl font-serif text-white">{stats.totalMessages}</p>
                  </div>
                </div>
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 mt-8">
                  <h3 className="text-lg font-medium text-white mb-4">Google Analytics Entegrasyonu</h3>
                  <p className="text-zinc-400 mb-6">
                    Sitenizin detaylı ziyaretçi trafiğini, sayfa görüntülemelerini ve dönüşüm oranlarını takip etmek için Google Analytics kullanabilirsiniz.
                  </p>
                  <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Google Analytics Paneline Git
                  </a>
                </div>
              </div>
            ) : activeTab === 'orders' ? (
              <div className="space-y-6">
                <h2 className="text-2xl font-serif text-white mb-6">Siparişler</h2>
                {orders.length === 0 ? (
                  <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-12 text-center">
                    <ShoppingCart className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                    <p className="text-zinc-400">Henüz hiç siparişiniz yok.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
                        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                          <div>
                            <h3 className="text-lg font-medium text-white">{order.customerInfo?.fullName || 'İsimsiz Müşteri'}</h3>
                            <p className="text-sm text-zinc-400">{order.customerInfo?.email || 'E-posta yok'} • {order.customerInfo?.phone || 'Telefon yok'}</p>
                          </div>
                          <div className="text-left md:text-right">
                            <p className="text-brand-400 font-medium">₺{order.totalAmount}</p>
                            <p className="text-xs text-zinc-500">
                              {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('tr-TR') : 'Tarih yok'}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="bg-black/20 rounded-lg p-4">
                            <h4 className="text-zinc-300 font-medium mb-2">Sipariş Detayı</h4>
                            <p className="text-zinc-400">{order.items?.[0]?.title}</p>
                            <p className="text-zinc-500">{order.items?.[0]?.option}</p>
                          </div>
                          <div className="bg-black/20 rounded-lg p-4">
                            <h4 className="text-zinc-300 font-medium mb-2">Teslimat Adresi</h4>
                            <p className="text-zinc-400">{order.customerInfo?.fullAddress}</p>
                            <p className="text-zinc-400">{order.customerInfo?.district}, {order.customerInfo?.city}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === 'messages' ? (
              <div className="space-y-6">
                <h2 className="text-2xl font-serif text-white mb-6">Gelen Mesajlar</h2>
                {messages.length === 0 ? (
                  <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-12 text-center">
                    <MessageSquare className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                    <p className="text-zinc-400">Henüz hiç mesajınız yok.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div key={msg.id} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-medium text-white">{msg.name}</h3>
                            <a href={`mailto:${msg.email}`} className="text-brand-400 text-sm hover:underline">{msg.email}</a>
                          </div>
                          <span className="text-xs text-zinc-500">
                            {msg.createdAt?.toDate ? format(msg.createdAt.toDate(), 'dd MMM yyyy HH:mm', { locale: tr }) : ''}
                          </span>
                        </div>
                        <p className="text-zinc-300 whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === 'subscribers' ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-serif text-white">Bülten Aboneleri</h2>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        const emails = subscribers.map(s => s.email).join(', ');
                        navigator.clipboard.writeText(emails);
                        showToast('Tüm e-posta adresleri kopyalandı!');
                      }}
                      className="flex items-center px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors border border-white/10"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      E-postaları Kopyala
                    </button>
                    <button
                      onClick={() => setIsCampaignModalOpen(true)}
                      className="flex items-center px-4 py-2 bg-brand-500 hover:bg-brand-400 text-zinc-950 rounded-lg font-medium transition-colors"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Kampanya Oluştur
                    </button>
                  </div>
                </div>
                
                {isCampaignModalOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
                      <div className="flex justify-between items-center p-6 border-b border-white/10">
                        <h3 className="text-xl font-serif text-white">Yeni Kampanya Oluştur</h3>
                        <button onClick={() => setIsCampaignModalOpen(false)} className="text-zinc-400 hover:text-white">
                          <X className="w-6 h-6" />
                        </button>
                      </div>
                      <div className="p-6">
                        <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                          Aşağıdaki formu doldurup "Gönder" butonuna tıkladığınızda, bilgisayarınızdaki veya telefonunuzdaki varsayılan e-posta uygulaması (Gmail, Outlook, Apple Mail vb.) açılacaktır. Tüm aboneleriniz otomatik olarak "BCC" (Gizli) kısmına eklenecek, böylece kimse birbirinin e-posta adresini göremeyecektir.
                        </p>
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          if (subscribers.length === 0) {
                            showToast('Gönderilecek abone bulunmuyor.');
                            return;
                          }
                          const emails = subscribers.map(s => s.email).join(',');
                          const mailtoLink = `mailto:?bcc=${emails}&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
                          window.location.href = mailtoLink;
                          setIsCampaignModalOpen(false);
                        }} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">E-posta Konusu</label>
                            <input
                              type="text"
                              required
                              value={emailSubject}
                              onChange={(e) => setEmailSubject(e.target.value)}
                              placeholder="Örn: Yeni Kitabım Çıktı!"
                              className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">Mesajınız</label>
                            <textarea
                              required
                              rows={8}
                              value={emailBody}
                              onChange={(e) => setEmailBody(e.target.value)}
                              placeholder="Abonelerinize iletmek istediğiniz mesaj..."
                              className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                            />
                          </div>
                          <div className="flex justify-end pt-4">
                            <button
                              type="button"
                              onClick={() => setIsCampaignModalOpen(false)}
                              className="px-6 py-3 text-zinc-400 hover:text-white mr-4"
                            >
                              İptal
                            </button>
                            <button
                              type="submit"
                              className="px-8 py-3 bg-brand-500 hover:bg-brand-400 text-zinc-950 font-medium rounded-xl transition-colors flex items-center"
                            >
                              <Send className="w-5 h-5 mr-2" />
                              E-posta Uygulamasını Aç ve Gönder
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                )}

                {subscribers.length === 0 ? (
                  <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-12 text-center">
                    <Users className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                    <p className="text-zinc-400">Henüz hiç aboneniz yok.</p>
                  </div>
                ) : (
                  <div className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-zinc-400">
                        <thead className="text-xs text-zinc-500 uppercase bg-zinc-900/80 border-b border-white/5">
                          <tr>
                            <th scope="col" className="px-6 py-4">E-posta Adresi</th>
                            <th scope="col" className="px-6 py-4">Kayıt Tarihi</th>
                            <th scope="col" className="px-6 py-4">Kaynak</th>
                            <th scope="col" className="px-6 py-4 text-right">İşlemler</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {subscribers.map((sub) => (
                            <tr key={sub.id} className="hover:bg-white/5 transition-colors group">
                              <td className="px-6 py-4 font-medium text-white">{sub.email}</td>
                              <td className="px-6 py-4">
                                {sub.createdAt?.toDate ? format(sub.createdAt.toDate(), 'dd MMM yyyy HH:mm', { locale: tr }) : 'Bilinmiyor'}
                              </td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-500/10 text-brand-400 border border-brand-500/20">
                                  {sub.source === 'popup' ? 'Açılır Pencere' : sub.source || 'Bilinmiyor'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => handleDeleteSubscriber(sub.id)}
                                  className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                                  title="Aboneyi Sil"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : activeTab === 'consulting' ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-serif text-white">Danışmanlık Talepleri</h2>
                </div>
                {consultingRequests.length === 0 ? (
                  <div className="text-center py-12 bg-zinc-900/50 rounded-xl border border-white/5">
                    <p className="text-zinc-400">Henüz danışmanlık talebi bulunmuyor.</p>
                  </div>
                ) : (
                  <div className="bg-zinc-900/50 border border-white/5 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-zinc-400">
                        <thead className="bg-zinc-900 text-zinc-300 uppercase font-medium border-b border-white/10">
                          <tr>
                            <th className="px-6 py-4">Tarih</th>
                            <th className="px-6 py-4">İsim</th>
                            <th className="px-6 py-4">İletişim</th>
                            <th className="px-6 py-4">Paket</th>
                            <th className="px-6 py-4">Mesaj</th>
                            <th className="px-6 py-4">Durum</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {consultingRequests.map((req) => (
                            <tr key={req.id} className="hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                {req.createdAt?.toDate ? format(req.createdAt.toDate(), 'dd MMM yyyy HH:mm', { locale: tr }) : 'Bilinmiyor'}
                              </td>
                              <td className="px-6 py-4 font-medium text-white">
                                {req.name}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col gap-1">
                                  <a href={`mailto:${req.email}`} className="hover:text-brand-400 transition-colors">{req.email}</a>
                                  {req.phone && <a href={`tel:${req.phone}`} className="hover:text-brand-400 transition-colors">{req.phone}</a>}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-500/10 text-brand-400 border border-brand-500/20">
                                  {req.package}
                                </span>
                              </td>
                              <td className="px-6 py-4 max-w-xs truncate" title={req.message}>
                                {req.message}
                              </td>
                              <td className="px-6 py-4">
                                <select 
                                  value={req.status || 'new'} 
                                  onChange={async (e) => {
                                    try {
                                      await updateDoc(doc(db, 'consulting_requests', req.id), { status: e.target.value });
                                      fetchConsultingRequests();
                                      showToast('Durum güncellendi');
                                    } catch (err) {
                                      console.error(err);
                                      showToast('Hata oluştu');
                                    }
                                  }}
                                  className="bg-zinc-950 border border-white/10 rounded px-2 py-1 text-xs focus:ring-brand-500 focus:border-brand-500"
                                >
                                  <option value="new">Yeni</option>
                                  <option value="contacted">İletişime Geçildi</option>
                                  <option value="scheduled">Randevu Ayarlandı</option>
                                  <option value="completed">Tamamlandı</option>
                                  <option value="cancelled">İptal Edildi</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : activeTab === 'books' ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-serif text-white">Kitap Yönetimi</h2>
                  {!isEditingBook && (
                    <button
                      onClick={() => setIsEditingBook(true)}
                      className="flex items-center px-4 py-2 bg-brand-500 hover:bg-brand-400 text-zinc-950 rounded-lg font-medium transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Yeni Kitap Ekle
                    </button>
                  )}
                </div>

                {isEditingBook ? (
                  <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 md:p-8">
                    <div className="flex justify-between items-center mb-8">
                      <h2 className="text-2xl font-serif text-white">
                        {currentBook.id ? 'Kitabı Düzenle' : 'Yeni Kitap'}
                      </h2>
                      <button
                        onClick={() => {
                          setIsEditingBook(false);
                          setCurrentBook({ title: '', description: '', price: '', coverImage: '', readFirstPagesLink: '', purchaseLinks: [], pageCount: '' });
                        }}
                        className="text-zinc-400 hover:text-white transition-colors"
                      >
                        İptal
                      </button>
                    </div>
                    <form onSubmit={handleSaveBook} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Kitap Adı</label>
                        <input type="text" required value={currentBook.title} onChange={e => setCurrentBook({ ...currentBook, title: e.target.value })} className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Açıklama</label>
                        <textarea required value={currentBook.description} onChange={e => setCurrentBook({ ...currentBook, description: e.target.value })} className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 h-32" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Fiyat (Örn: ₺180)</label>
                        <input type="text" required value={currentBook.price} onChange={e => setCurrentBook({ ...currentBook, price: e.target.value })} className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Sayfa Sayısı (Örn: 400)</label>
                        <input type="text" value={currentBook.pageCount || ''} onChange={e => setCurrentBook({ ...currentBook, pageCount: e.target.value })} className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Örn: 400" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Kapak Görseli</label>
                        <div className="flex gap-4 items-start">
                          <div className="flex-1 space-y-3">
                            {currentBook.coverImage && (
                              <div className="relative inline-block mb-2">
                                <img src={currentBook.coverImage} alt="Kapak" className="h-32 object-cover rounded-lg border border-white/10" />
                                <button type="button" onClick={() => setCurrentBook({ ...currentBook, coverImage: '' })} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X className="w-4 h-4" /></button>
                              </div>
                            )}
                            <input
                              type="text"
                              placeholder="Kapak görseli URL'si yapıştırın"
                              value={currentBook.coverImage || ''}
                              onChange={(e) => setCurrentBook({ ...currentBook, coverImage: e.target.value })}
                              className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                            />
                            <div className="text-xs text-zinc-500">Veya bilgisayardan yükleyin:</div>
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, 'books', (url) => setCurrentBook({ ...currentBook, coverImage: url }), 'bookCover')}
                              className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-500/10 file:text-brand-400 hover:file:bg-brand-500/20 transition-colors"
                            />
                            {uploadingFile['bookCover'] && <p className="text-brand-400 text-sm">Yükleniyor...</p>}
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">İlk Sayfaları Oku Linki (Opsiyonel)</label>
                        <input type="url" value={currentBook.readFirstPagesLink || ''} onChange={e => setCurrentBook({ ...currentBook, readFirstPagesLink: e.target.value })} className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="https://example.com/preview.pdf" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Satın Alma Linkleri</label>
                        <div className="space-y-3 mb-3">
                          {(currentBook.purchaseLinks || []).map((link: any, index: number) => (
                            <div key={index} className="flex gap-2 items-center">
                              <input 
                                type="text" 
                                placeholder="Platform (Örn: Amazon)" 
                                value={link.platform}
                                onChange={(e) => {
                                  const newLinks = [...(currentBook.purchaseLinks || [])];
                                  newLinks[index].platform = e.target.value;
                                  setCurrentBook({ ...currentBook, purchaseLinks: newLinks });
                                }}
                                className="flex-1 bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                              />
                              <input 
                                type="url" 
                                placeholder="URL (https://...)" 
                                value={link.url}
                                onChange={(e) => {
                                  const newLinks = [...(currentBook.purchaseLinks || [])];
                                  newLinks[index].url = e.target.value;
                                  setCurrentBook({ ...currentBook, purchaseLinks: newLinks });
                                }}
                                className="flex-[2] bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                              />
                              <button 
                                type="button"
                                onClick={() => {
                                  const newLinks = [...(currentBook.purchaseLinks || [])];
                                  newLinks.splice(index, 1);
                                  setCurrentBook({ ...currentBook, purchaseLinks: newLinks });
                                }}
                                className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentBook({
                              ...currentBook,
                              purchaseLinks: [...(currentBook.purchaseLinks || []), { platform: '', url: '' }]
                            });
                          }}
                          className="text-sm text-brand-400 hover:text-brand-300 font-medium flex items-center"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Yeni Link Ekle
                        </button>
                      </div>
                      <button type="submit" className="w-full px-8 py-3 bg-brand-500 hover:bg-brand-400 text-zinc-950 font-medium rounded-xl transition-colors">
                        Kaydet
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {books.map(book => (
                      <div key={book.id} className="bg-zinc-900 border border-white/10 rounded-xl p-6">
                        <h3 className="text-xl font-serif text-white mb-2">{book.title}</h3>
                        <p className="text-zinc-400 text-sm mb-4 line-clamp-2">{book.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-brand-400 font-medium">{book.price}</span>
                          <div className="flex gap-2">
                            <button onClick={() => { setCurrentBook(book); setIsEditingBook(true); }} className="p-2 text-zinc-400 hover:text-white bg-zinc-800 rounded-lg transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteBook(book.id)} className="p-2 text-red-400 hover:text-red-300 bg-red-400/10 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {books.length === 0 && (
                      <div className="col-span-full text-center py-12 bg-zinc-900/50 rounded-xl border border-white/5">
                        <p className="text-zinc-400">Henüz kitap eklenmemiş.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : activeTab === 'settings' ? (
              <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 md:p-8">
                <h2 className="text-2xl font-serif text-white mb-6">Site Ayarları</h2>
                
                <div className="flex flex-wrap gap-2 mb-8 border-b border-white/10 pb-4">
                  <button
                    onClick={() => setSettingsTab('general')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${settingsTab === 'general' ? 'bg-brand-500/20 text-brand-400' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                  >
                    Genel Ayarlar
                  </button>
                  <button
                    onClick={() => setSettingsTab('texts')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${settingsTab === 'texts' ? 'bg-brand-500/20 text-brand-400' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                  >
                    Site Metinleri & Butonlar
                  </button>
                  <button
                    onClick={() => setSettingsTab('about')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${settingsTab === 'about' ? 'bg-brand-500/20 text-brand-400' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                  >
                    Hakkımda
                  </button>
                  <button
                    onClick={() => setSettingsTab('social')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${settingsTab === 'social' ? 'bg-brand-500/20 text-brand-400' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                  >
                    Sosyal Medya & İletişim
                  </button>
                  <button
                    onClick={() => setSettingsTab('consulting')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${settingsTab === 'consulting' ? 'bg-brand-500/20 text-brand-400' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                  >
                    Danışmanlık
                  </button>
                  <button
                    onClick={() => setSettingsTab('videos')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${settingsTab === 'videos' ? 'bg-brand-500/20 text-brand-400' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                  >
                    Videolar
                  </button>
                  <button
                    onClick={() => setSettingsTab('seo')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${settingsTab === 'seo' ? 'bg-brand-500/20 text-brand-400' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                  >
                    SEO & Meta Metinleri
                  </button>
                  <button
                    onClick={() => setSettingsTab('account')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${settingsTab === 'account' ? 'bg-brand-500/20 text-brand-400' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                  >
                    Hesap
                  </button>
                </div>

                <form onSubmit={handleSaveSettings} className="space-y-6">
                  {settingsTab === 'general' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-brand-400 border-b border-white/10 pb-2">Genel Görünüm</h3>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Profil Fotoğrafı</label>
                        <div className="flex gap-4 items-start">
                          <img src={settings.profilePictureUrl || "https://ui-avatars.com/api/?name=Ishak+Alper&background=27272a&color=ECCC7B&size=512"} alt="Profil" className="w-24 h-24 object-cover rounded-full border border-white/10 shrink-0" />
                          <div className="flex-1 space-y-3">
                            <input
                              type="text"
                              placeholder="Profil fotoğrafı URL'si yapıştırın"
                              value={settings.profilePictureUrl || ''}
                              onChange={(e) => setSettings({ ...settings, profilePictureUrl: e.target.value })}
                              className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                            />
                            <div className="text-xs text-zinc-500">Veya bilgisayardan yükleyin:</div>
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, 'settings', (url) => setSettings({ ...settings, profilePictureUrl: url }), 'profilePic')}
                              className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-500/10 file:text-brand-400 hover:file:bg-brand-500/20 transition-colors"
                            />
                            {uploadingFile['profilePic'] && <p className="text-brand-400 text-sm">Yükleniyor...</p>}
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Ana Başlık (Hero Title)</label>
                        <input
                          type="text"
                          value={settings.heroTitle}
                          onChange={e => setSettings({ ...settings, heroTitle: e.target.value })}
                          className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Alt Başlık (Hero Subtitle)</label>
                        <textarea
                          value={settings.heroSubtitle}
                          onChange={e => setSettings({ ...settings, heroSubtitle: e.target.value })}
                          className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 h-24 resize-none"
                        />
                      </div>
                      <div className="pt-4">
                        <h3 className="text-lg font-medium text-brand-400 border-b border-white/10 pb-2">İçerik Akışı Bölümü</h3>
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-zinc-300 mb-2">İçerik Akışı Başlığı</label>
                          <input
                            type="text"
                            value={settings.contentFeedTitle}
                            onChange={e => setSettings({ ...settings, contentFeedTitle: e.target.value })}
                            className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                          />
                        </div>
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-zinc-300 mb-2">İçerik Akışı Alt Başlığı</label>
                          <textarea
                            value={settings.contentFeedSubtitle}
                            onChange={e => setSettings({ ...settings, contentFeedSubtitle: e.target.value })}
                            className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 h-24 resize-none"
                          />
                        </div>
                      </div>
                      <div className="pt-4">
                        <h3 className="text-lg font-medium text-brand-400 border-b border-white/10 pb-2">Alt Bilgi (Footer)</h3>
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-zinc-300 mb-2">Footer Kısa Hakkında Metni</label>
                          <textarea
                            value={(settings as any).footerAboutText || ''}
                            onChange={e => setSettings({ ...settings, footerAboutText: e.target.value } as any)}
                            className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 h-24 resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {settingsTab === 'texts' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-brand-400 border-b border-white/10 pb-2">Site Metinleri & Butonlar</h3>
                      
                      <div className="pt-2">
                        <h4 className="text-md font-medium text-zinc-300 mb-4">Üst Rozet Yönetimi (Kahraman Bölümü)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                          <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">Rozet Metni</label>
                            <input
                              type="text"
                              value={(settings as any).newReleaseBadge || 'Yeni Çıkan Kitap'}
                              onChange={e => setSettings({ ...settings, newReleaseBadge: e.target.value } as any)}
                              className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">Okur Sayısı</label>
                            <input
                              type="text"
                              value={(settings as any).readersCount || '9.950+ Okur'}
                              onChange={e => setSettings({ ...settings, readersCount: e.target.value } as any)}
                              className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">Sipariş Sayısı</label>
                            <input
                              type="text"
                              value={(settings as any).ordersCount || '1.273 Sipariş'}
                              onChange={e => setSettings({ ...settings, ordersCount: e.target.value } as any)}
                              className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                          </div>
                        </div>

                        <h4 className="text-md font-medium text-zinc-300 mb-4">Ana Sayfa Butonları</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">Buton 1 (Kitap)</label>
                            <input
                              type="text"
                              value={(settings as any).heroCta1 || 'Kitabı İncele'}
                              onChange={e => setSettings({ ...settings, heroCta1: e.target.value } as any)}
                              className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">Buton 2 (Sipariş)</label>
                            <input
                              type="text"
                              value={(settings as any).heroCta2 || 'Hemen Sipariş Ver'}
                              onChange={e => setSettings({ ...settings, heroCta2: e.target.value } as any)}
                              className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">Buton 3 (Danışmanlık)</label>
                            <input
                              type="text"
                              value={(settings as any).heroCta3 || 'Danışmanlık Al'}
                              onChange={e => setSettings({ ...settings, heroCta3: e.target.value } as any)}
                              className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-4">
                        <h4 className="text-md font-medium text-zinc-300 mb-4">Hakkımda Sayfası Butonları</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">Kitap İnceleme Linki Metni</label>
                            <input
                              type="text"
                              value={(settings as any).readFirstPagesText || 'Önsözü Oku ve Kitabı İncele'}
                              onChange={e => setSettings({ ...settings, readFirstPagesText: e.target.value } as any)}
                              className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">İletişim Butonu Metni</label>
                            <input
                              type="text"
                              value={(settings as any).aboutButtonText || 'İletişime Geçin'}
                              onChange={e => setSettings({ ...settings, aboutButtonText: e.target.value } as any)}
                              className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {settingsTab === 'about' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-brand-400 border-b border-white/10 pb-2">Hakkımda Sayfası</h3>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Alıntı (Quote)</label>
                        <textarea
                          value={(settings as any).aboutQuote || ''}
                          onChange={e => setSettings({ ...settings, aboutQuote: e.target.value } as any)}
                          className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 h-24 resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Paragraf 1</label>
                        <textarea
                          value={(settings as any).aboutParagraph1 || ''}
                          onChange={e => setSettings({ ...settings, aboutParagraph1: e.target.value } as any)}
                          className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 h-32 resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Paragraf 2</label>
                        <textarea
                          value={(settings as any).aboutParagraph2 || ''}
                          onChange={e => setSettings({ ...settings, aboutParagraph2: e.target.value } as any)}
                          className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 h-32 resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Paragraf 3</label>
                        <textarea
                          value={(settings as any).aboutParagraph3 || ''}
                          onChange={e => setSettings({ ...settings, aboutParagraph3: e.target.value } as any)}
                          className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 h-32 resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {settingsTab === 'social' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-brand-400 border-b border-white/10 pb-2">Sosyal Medya Bağlantıları</h3>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">WhatsApp URL (Örn: https://wa.me/905555555555)</label>
                        <input
                          type="url"
                          value={(settings as any).whatsappUrl || ''}
                          onChange={e => setSettings({ ...settings, whatsappUrl: e.target.value } as any)}
                          className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Instagram URL</label>
                        <input
                          type="url"
                          value={settings.instagramUrl}
                          onChange={e => setSettings({ ...settings, instagramUrl: e.target.value })}
                          className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">X (Twitter) URL</label>
                        <input
                          type="url"
                          value={settings.twitterUrl}
                          onChange={e => setSettings({ ...settings, twitterUrl: e.target.value })}
                          className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">LinkedIn URL</label>
                        <input
                          type="url"
                          value={settings.linkedinUrl}
                          onChange={e => setSettings({ ...settings, linkedinUrl: e.target.value })}
                          className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">YouTube URL</label>
                        <input
                          type="url"
                          value={settings.youtubeUrl}
                          onChange={e => setSettings({ ...settings, youtubeUrl: e.target.value })}
                          className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">TikTok URL</label>
                        <input
                          type="url"
                          value={settings.tiktokUrl}
                          onChange={e => setSettings({ ...settings, tiktokUrl: e.target.value })}
                          className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">İletişim E-posta Adresi</label>
                        <input
                          type="email"
                          value={settings.contactEmail}
                          onChange={e => setSettings({ ...settings, contactEmail: e.target.value })}
                          className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                    </div>
                  )}

                  {settingsTab === 'consulting' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-brand-400 border-b border-white/10 pb-2">Danışmanlık Bölümü</h3>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Danışmanlık Başlığı</label>
                        <input
                          type="text"
                          value={settings.consultancyTitle}
                          onChange={e => setSettings({ ...settings, consultancyTitle: e.target.value })}
                          className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Danışmanlık Alt Başlığı</label>
                        <textarea
                          value={settings.consultancySubtitle}
                          onChange={e => setSettings({ ...settings, consultancySubtitle: e.target.value })}
                          className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 h-24 resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Danışmanlık Buton Metni</label>
                        <input
                          type="text"
                          value={settings.consultancyButtonText}
                          onChange={e => setSettings({ ...settings, consultancyButtonText: e.target.value })}
                          className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Calendly Linki (Opsiyonel)</label>
                        <input
                          type="url"
                          value={settings.calendlyUrl || ''}
                          onChange={e => setSettings({ ...settings, calendlyUrl: e.target.value })}
                          className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                          placeholder="https://calendly.com/..."
                        />
                        <p className="text-xs text-zinc-500 mt-1">Eğer burayı doldurursanız, danışmanlık butonları iletişim formu yerine doğrudan takviminize yönlendirir.</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Kitap İlk Sayfalar İçeriği (HTML destekler)</label>
                        <textarea
                          value={(settings as any).bookPreviewContent || ''}
                          onChange={e => setSettings({ ...settings, bookPreviewContent: e.target.value } as any)}
                          className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 h-64 font-mono text-sm"
                          placeholder="<p>Kitabın ilk sayfaları buraya...</p>"
                        />
                      </div>
                    </div>
                  )}

                  {settingsTab === 'videos' && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-brand-400 border-b border-white/10 pb-2">Ana Sayfa Felsefe Videosu</h3>
                        <p className="text-sm text-zinc-400 mb-4">Ana sayfada "Danışmanlık" bölümünün altında yer alan "Kitabın felsefesine kısa bir bakış" videosunu buradan değiştirebilirsiniz.</p>
                        <div className="bg-zinc-950 p-4 rounded-xl border border-white/10 space-y-4">
                          <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1">Başlık</label>
                            <input
                              type="text"
                              value={(settings as any).philosophyTitle || 'Gerçeği Görmeye Hazır Mısınız?'}
                              onChange={e => setSettings({ ...settings, philosophyTitle: e.target.value } as any)}
                              className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1">Alt Başlık</label>
                            <input
                              type="text"
                              value={(settings as any).philosophySubtitle || 'Kitabın felsefesine kısa bir bakış.'}
                              onChange={e => setSettings({ ...settings, philosophySubtitle: e.target.value } as any)}
                              className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1">Video URL (YouTube, Vimeo vb.)</label>
                            <input
                              type="text"
                              value={(settings as any).philosophyVideoUrl || ''}
                              onChange={e => setSettings({ ...settings, philosophyVideoUrl: e.target.value } as any)}
                              className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 pt-6">
                        <h3 className="text-lg font-medium text-brand-400 border-b border-white/10 pb-2">Tanıtım Videoları (Kitap Sayfası)</h3>
                        <p className="text-sm text-zinc-400 mb-4">Buradan kitap sayfasında görünecek videoları yönetebilirsiniz. Videoların URL'lerini ve kapak fotoğraflarını (poster) güncelleyebilirsiniz.</p>
                        {settings.promotionalVideos?.map((video, index) => (
                        <div key={index} className="bg-zinc-950 p-4 rounded-xl border border-white/10 space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="text-white font-medium">Video {index + 1} {index === 0 ? '(Ana Video)' : ''}</h4>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1">Başlık</label>
                            <input
                              type="text"
                              value={video.title}
                              onChange={e => {
                                const newVideos = [...settings.promotionalVideos];
                                newVideos[index].title = e.target.value;
                                setSettings({ ...settings, promotionalVideos: newVideos });
                              }}
                              className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1">Açıklama</label>
                            <input
                              type="text"
                              value={video.desc}
                              onChange={e => {
                                const newVideos = [...settings.promotionalVideos];
                                newVideos[index].desc = e.target.value;
                                setSettings({ ...settings, promotionalVideos: newVideos });
                              }}
                              className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1">Video Dosyası veya URL'si</label>
                            <div className="flex flex-col gap-2">
                              {video.url && (
                                <a href={video.url} target="_blank" rel="noreferrer" className="text-xs text-brand-400 hover:underline truncate max-w-full block">
                                  Mevcut Videoyu Görüntüle
                                </a>
                              )}
                              <input
                                type="text"
                                placeholder="Video URL'si yapıştırın (YouTube, Vimeo vb.)"
                                value={video.url || ''}
                                onChange={e => {
                                  const newVideos = [...settings.promotionalVideos];
                                  newVideos[index].url = e.target.value;
                                  setSettings({ ...settings, promotionalVideos: newVideos });
                                }}
                                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm"
                              />
                              <div className="text-xs text-zinc-500">Veya bilgisayardan yükleyin:</div>
                              <label className="flex items-center justify-center px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg cursor-pointer transition-colors border border-white/10 w-full sm:w-auto">
                                {uploadingFile[`promoVideo_${index}`] ? (
                                  <span className="text-xs">Yükleniyor...</span>
                                ) : (
                                  <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    <span className="text-xs">Yeni Video Yükle</span>
                                  </>
                                )}
                                <input 
                                  type="file" 
                                  accept="video/*" 
                                  className="hidden" 
                                  onChange={(e) => handleVideoUpload(e, index)}
                                  disabled={uploadingFile[`promoVideo_${index}`]}
                                />
                              </label>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1">Kapak Fotoğrafı (Poster)</label>
                            <div className="flex flex-col gap-2">
                              {video.poster && (
                                <div className="relative inline-block">
                                  <img src={video.poster} alt="Poster" className="h-16 rounded border border-white/10 object-cover" />
                                </div>
                              )}
                              <input
                                type="text"
                                placeholder="Poster görseli URL'si yapıştırın"
                                value={video.poster || ''}
                                onChange={e => {
                                  const newVideos = [...settings.promotionalVideos];
                                  newVideos[index].poster = e.target.value;
                                  setSettings({ ...settings, promotionalVideos: newVideos });
                                }}
                                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm"
                              />
                              <div className="text-xs text-zinc-500">Veya bilgisayardan yükleyin:</div>
                              <label className="flex items-center justify-center px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg cursor-pointer transition-colors border border-white/10 w-full sm:w-auto">
                                {uploadingFile[`promoPoster_${index}`] ? (
                                  <span className="text-xs">Yükleniyor...</span>
                                ) : (
                                  <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    <span className="text-xs">Yeni Kapak Yükle</span>
                                  </>
                                )}
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden" 
                                  onChange={(e) => handlePosterUpload(e, index)}
                                  disabled={uploadingFile[`promoPoster_${index}`]}
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}
                      </div>
                    </div>
                  )}

                  {settingsTab === 'seo' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-brand-400 border-b border-white/10 pb-2">Arama Motoru (SEO) ve Yapay Zeka Ayarları</h3>
                      <p className="text-sm text-zinc-400 mb-4">Google, Apple Siri, ChatGPT gibi platformlarda sitenizin ve kimliğinizin nasıl görüneceğini yönetin.</p>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Anahtar Kelimeler (Virgülle Ayırın)</label>
                        <textarea
                          rows={3}
                          value={settings.seoKeywords || "İshak Alper, Çıplak Gösteren Gözlükler, kişisel gelişim kitabı, psikoloji danışmanlık, karanlık psikoloji"}
                          onChange={e => setSettings({ ...settings, seoKeywords: e.target.value })}
                          className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm resize-none"
                          placeholder="Örn: İshak Alper, Yazar, Danışmanlık..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Genel Site Açıklaması (Tüm sayfalarda varsayılan ana özet)</label>
                        <textarea
                          rows={3}
                          value={settings.seoDescription || "İshak Alper - Çıplak Gösteren Gözlükler kitabının yazarı. Karanlık psikoloji ve davranış bilimleri danışmanlık hizmetleri."}
                          onChange={e => setSettings({ ...settings, seoDescription: e.target.value })}
                          className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm resize-none"
                        />
                      </div>
                      <div className="bg-zinc-900/50 p-4 rounded-xl border border-brand-500/20 mt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-brand-400">💡 Önizleme Bilgisi</span>
                        </div>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                          Sitenizin (veya yazılarınızın) linkini WhatsApp, Instagram veya Twitter'da paylaştığınızda otomatik olarak <strong className="text-white">Genel Ayarlar &gt; Profil Fotoğrafı</strong> bölümüne yüklediğiniz görsel kapak olarak gösterilecektir.
                        </p>
                      </div>
                    </div>
                  )}

                  {settingsTab === 'account' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-brand-400 border-b border-white/10 pb-2">Yönetici Hesabı</h3>
                      <div className="bg-zinc-950 border border-white/10 rounded-xl p-6">
                        <p className="text-zinc-300 mb-4">
                          Giriş yönteminiz Google ile yetkilendirme olduğu için e-posta ve şifre değişikliği işlemlerinizi doğrudan Google Hesabınız üzerinden yapmanız gerekmektedir.
                        </p>
                        <a 
                          href="https://myaccount.google.com/security" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors border border-white/10"
                        >
                          Google Hesap Güvenliği
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="pt-6 border-t border-white/10">
                    <button
                      type="submit"
                      disabled={savingSettings}
                      className="w-full sm:w-auto px-8 py-3 bg-brand-500 hover:bg-brand-400 text-zinc-950 font-medium rounded-xl transition-colors disabled:opacity-50"
                    >
                      {savingSettings ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
                    </button>
                  </div>
                </form>
              </div>
            ) : isEditing ? (
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 md:p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-serif text-white">
                {currentPost.id ? 'Yazıyı Düzenle' : 'Yeni Yazı Ekle'}
              </h2>
              <div className="flex gap-4">
                <button
                  onClick={handleSeedPosts}
                  disabled={seeding}
                  className="inline-flex items-center px-4 py-2 bg-zinc-800 text-white font-medium rounded-md hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 focus:ring-zinc-500 transition-colors disabled:opacity-50"
                  title="Test amaçlı örnek yazılar ekler"
                >
                  <Database className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setCurrentPost({ title: '', content: '', excerpt: '', imageUrl: '', videoUrl: '', published: true, tags: [] });
                  }}
                  className="inline-flex items-center px-4 py-2 bg-zinc-800 text-white font-medium rounded-md hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 focus:ring-zinc-500 transition-colors"
                >
                  <X className="w-5 h-5 mr-2" />
                  İptal Et / Geri Dön
                </button>
              </div>
            </div>
            <form onSubmit={handleSavePost} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Başlık</label>
                <input
                  type="text"
                  required
                  value={currentPost.title}
                  onChange={e => setCurrentPost({ ...currentPost, title: e.target.value })}
                  className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Açıklama (Ana sayfada görünecek metin)</label>
                <textarea
                  rows={3}
                  value={currentPost.excerpt || ''}
                  onChange={e => setCurrentPost({ ...currentPost, excerpt: e.target.value })}
                  placeholder="Gönderinizin altına eklenecek açıklama..."
                  className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Medya (Görsel veya Video)</label>
                <div className="space-y-4">
                  {/* Preview Area */}
                  <div className="flex gap-4 items-start">
                    {currentPost.imageUrl && (
                      <div className="relative group">
                        <img src={currentPost.imageUrl} alt="Görsel" className="w-24 h-24 object-cover rounded-lg border border-white/10" />
                        <button type="button" onClick={() => setCurrentPost({ ...currentPost, imageUrl: '' })} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
                      </div>
                    )}
                    {currentPost.videoUrl && (
                      <div className="relative group w-24 h-24">
                        <VideoPlayer url={currentPost.videoUrl} className="w-24 h-24 object-cover rounded-lg border border-white/10" />
                        <button type="button" onClick={() => setCurrentPost({ ...currentPost, videoUrl: '' })} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"><X className="w-4 h-4" /></button>
                      </div>
                    )}
                  </div>

                  {/* Input Area */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-500">Dosya Yükle</label>
                      <input 
                        type="file" 
                        accept="image/*,video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.type.startsWith('image/')) {
                            handleFileUpload(e, 'posts', (url) => setCurrentPost({ ...currentPost, imageUrl: url, videoUrl: '' }), 'postMedia');
                          } else if (file.type.startsWith('video/')) {
                            handleFileUpload(e, 'posts', (url) => setCurrentPost({ ...currentPost, videoUrl: url, imageUrl: '' }), 'postMedia');
                          }
                        }}
                        className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-500/10 file:text-brand-400 hover:file:bg-brand-500/20 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-500">Veya URL Yapıştır (YouTube/Direct)</label>
                      <input 
                        type="text"
                        placeholder="https://youtube.com/..."
                        value={currentPost.videoUrl || currentPost.imageUrl || ''}
                        className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                        onChange={(e) => {
                          const url = e.target.value;
                          if (url.includes('youtube.com') || url.includes('youtu.be')) {
                            setCurrentPost({ ...currentPost, videoUrl: url, imageUrl: '' });
                          } else if (url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
                            setCurrentPost({ ...currentPost, imageUrl: url, videoUrl: '' });
                          } else {
                            // Default to video if unsure, or handle as needed
                            setCurrentPost({ ...currentPost, videoUrl: url, imageUrl: '' });
                          }
                        }}
                      />
                    </div>
                  </div>
                  {uploadingFile['postMedia'] && <p className="text-brand-400 text-sm">Medya yükleniyor...</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">İçerik (Markdown/HTML)</label>
                <textarea
                  required
                  rows={15}
                  value={currentPost.content}
                  onChange={e => setCurrentPost({ ...currentPost, content: e.target.value })}
                  className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono text-sm"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="published"
                  checked={currentPost.published}
                  onChange={e => setCurrentPost({ ...currentPost, published: e.target.checked })}
                  className="w-5 h-5 rounded border-white/10 bg-zinc-950 text-brand-500 focus:ring-brand-500 focus:ring-offset-zinc-950"
                />
                <label htmlFor="published" className="text-sm font-medium text-zinc-300">
                  Yayında (Herkese Açık)
                </label>
              </div>
              <div className="pt-6">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3 bg-brand-500 text-zinc-950 font-medium rounded-lg hover:bg-brand-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 focus:ring-brand-500 transition-colors shadow-lg shadow-brand-500/20"
                >
                  {currentPost.published ? 'Yayınla' : 'Taslak Olarak Kaydet'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-serif text-white">Mevcut Blog Yazıları</h2>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setCurrentPost({ title: '', content: '', excerpt: '', imageUrl: '', videoUrl: '', published: true, tags: [] });
                  }}
                  className="inline-flex items-center px-4 py-2 bg-brand-500 text-zinc-950 font-medium rounded-md hover:bg-brand-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 focus:ring-brand-500 transition-colors shadow-lg shadow-brand-500/20"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Yeni Yazı Ekle
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-zinc-800 border-t-zinc-200 rounded-full animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 bg-zinc-900/50 rounded-xl border border-white/5">
                Henüz yazı bulunmuyor.
              </div>
            ) : (
              <div className="bg-zinc-900/50 border border-white/5 rounded-xl overflow-hidden">
                <ul className="divide-y divide-white/5">
                  {posts.map(post => (
                    <li key={post.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-medium text-white truncate">{post.title}</h3>
                          {post.published ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <Eye className="w-3 h-3 mr-1" /> Yayında
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                              <EyeOff className="w-3 h-3 mr-1" /> Taslak
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-500 mb-2">
                          {post.createdAt?.toDate ? format(post.createdAt.toDate(), 'd MMMM yyyy HH:mm', { locale: tr }) : 'Tarih yok'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-zinc-400">
                          <span className="flex items-center gap-1" title="Beğeni">
                            <Heart className="w-3 h-3" /> {post.likes || 0}
                          </span>
                          <span className="flex items-center gap-1" title="Yorum">
                            <MessageCircle className="w-3 h-3" /> {post.comments?.length || 0}
                          </span>
                          <span className="flex items-center gap-1" title="Paylaşım">
                            <Send className="w-3 h-3" /> {post.shares || 0}
                          </span>
                          <span className="flex items-center gap-1" title="Kaydedilme">
                            <Bookmark className="w-3 h-3" /> {post.saves || 0}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(post)}
                          className="p-2 text-zinc-400 hover:text-brand-400 hover:bg-brand-500/10 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
                          title="Düzenle"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                          title="Sil"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            </div>
          )}
        </div>
      </div>
    )}
    </div>
  </div>
  );
}

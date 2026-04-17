import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Send, X, ExternalLink, Bookmark } from 'lucide-react';
import { collection, query, orderBy, getDocs, onSnapshot, where, limit, doc, updateDoc, setDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { staticBlogPosts } from '../data/blogPosts';
import { Link } from 'react-router-dom';
import VideoPlayer from './VideoPlayer';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { handleFirestoreError, OperationType } from '../lib/errorHandling';

interface Comment {
  id: string;
  author: string;
  text: string;
  date: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  imageUrl?: string;
  videoUrl?: string;
  author: {
    name: string;
    avatar: string;
  };
  date: string;
  likes: number;
  comments: Comment[];
  createdAt?: any;
}

interface ContentFeedProps {
  settings?: {
    profilePictureUrl: string;
  };
}

export default function ContentFeed({ settings }: ContentFeedProps) {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [allFetchedPosts, setAllFetchedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(7);
  const [hasMore, setHasMore] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());
  const [shareModalOpen, setShareModalOpen] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const savedLikes = localStorage.getItem('likedPosts');
    if (savedLikes) {
      setLikedPosts(new Set(JSON.parse(savedLikes)));
    }
    const savedBookmarks = localStorage.getItem('savedPosts');
    if (savedBookmarks) {
      setSavedPosts(new Set(JSON.parse(savedBookmarks)));
    }
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, 'posts'), 
      where('published', '==', true)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPostsMap = new Map();
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        fetchedPostsMap.set(doc.id, {
          ...data,
          id: doc.id
        });
      });

      // Dinamik ve Statik yazıları birleştir
      const allPosts: Post[] = [];

      // 1. Statik gönderileri hazırla (Firestore verileriyle birleştirerek)
      staticBlogPosts.forEach((staticPost) => {
        const firestoreData = fetchedPostsMap.get(staticPost.id) || {};
        
        let dateStr = t('blog.new');
        if (staticPost.createdAt) {
          const dateObj = typeof staticPost.createdAt === 'string' ? new Date(staticPost.createdAt) : staticPost.createdAt.toDate?.() || new Date();
          dateStr = format(dateObj, 'd MMMM yyyy', { locale: tr });
        }

        allPosts.push({
          id: staticPost.id,
          title: staticPost.title,
          content: staticPost.content,
          excerpt: staticPost.excerpt,
          imageUrl: staticPost.imageUrl,
          videoUrl: staticPost.videoUrl,
          author: {
            name: staticPost.author?.name || 'İshak Alper',
            avatar: staticPost.author?.avatar || settings?.profilePictureUrl || 'https://ui-avatars.com/api/?name=Ishak+Alper&background=27272a&color=ECCC7B&size=512'
          },
          date: dateStr,
          likes: firestoreData.likes !== undefined ? firestoreData.likes : (staticPost.likes || 124),
          comments: firestoreData.comments || staticPost.comments || [],
          createdAt: staticPost.createdAt
        });
        
        // Firestore map'ten sil ki tekrar eklenmesin
        fetchedPostsMap.delete(staticPost.id);
      });

      // 2. Kalan (sadece admin panelinden eklenen) dinamik gönderileri ekle
      fetchedPostsMap.forEach((data, id) => {
        allPosts.push({
          id,
          title: data.title,
          content: data.content,
          excerpt: data.excerpt,
          imageUrl: data.imageUrl,
          videoUrl: data.videoUrl,
          author: {
            name: 'İshak Alper',
            avatar: settings?.profilePictureUrl || 'https://ui-avatars.com/api/?name=Ishak+Alper&background=27272a&color=ECCC7B&size=512'
          },
          date: data.createdAt?.toDate ? format(data.createdAt.toDate(), 'd MMMM yyyy', { locale: tr }) : t('blog.new'),
          likes: data.likes || 0,
          comments: data.comments || [],
          createdAt: data.createdAt
        });
      });

      // 3. Tüm posta havuzunu createdAt tarihine göre yeniden eskiye sıralama
      allPosts.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : 0);
        return dateB - dateA;
      });

      setAllFetchedPosts(allPosts);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'posts');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [settings?.profilePictureUrl, t]);

  useEffect(() => {
    if (allFetchedPosts.length > displayCount) {
      setHasMore(true);
      setPosts(allFetchedPosts.slice(0, displayCount));
    } else {
      setHasMore(false);
      setPosts(allFetchedPosts);
    }
  }, [allFetchedPosts, displayCount]);

  const handleLike = (postId: string) => {
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      const isLiking = !newSet.has(postId);
      
      if (isLiking) {
        newSet.add(postId);
        setPosts(posts.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
      } else {
        newSet.delete(postId);
        setPosts(posts.map(p => p.id === postId ? { ...p, likes: Math.max(0, p.likes - 1) } : p));
      }
      localStorage.setItem('likedPosts', JSON.stringify(Array.from(newSet)));
      
      try {
        const postRef = doc(db, 'posts', postId);
        setDoc(postRef, {
          published: true, // Statikse firestore'da yayınlı kalmasını garantilemek için
          likes: increment(isLiking ? 1 : -1)
        }, { merge: true }).catch(err => console.error("Error updating likes:", err));
      } catch (error) {
        console.error("Error updating likes:", error);
      }
      
      return newSet;
    });
  };

  const handleSave = (postId: string) => {
    setSavedPosts(prev => {
      const newSet = new Set(prev);
      const isSaving = !newSet.has(postId);
      
      if (isSaving) {
        newSet.add(postId);
      } else {
        newSet.delete(postId);
      }
      localStorage.setItem('savedPosts', JSON.stringify(Array.from(newSet)));
      
      try {
        const postRef = doc(db, 'posts', postId);
        setDoc(postRef, {
          published: true,
          saves: increment(isSaving ? 1 : -1)
        }, { merge: true }).catch(err => console.error("Error updating saves:", err));
      } catch (error) {
        console.error("Error updating saves:", error);
      }
      
      return newSet;
    });
  };

  const toggleComments = (postId: string) => {
    setOpenComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleAddComment = (postId: string) => {
    if (!newComment.trim()) return;
    
    const newCommentObj = {
      id: Date.now().toString(),
      author: t('blog.guestUser'),
      text: newComment,
      date: t('blog.now')
    };
    
    setPosts(posts.map(p => {
      if (p.id === postId) {
        const updatedComments = [...p.comments, newCommentObj];
        
        try {
          const postRef = doc(db, 'posts', postId);
          setDoc(postRef, {
            published: true,
            comments: updatedComments
          }, { merge: true }).catch(err => console.error("Error updating comments:", err));
        } catch (error) {
          console.error("Error updating comments:", error);
        }
        
        return {
          ...p,
          comments: updatedComments
        };
      }
      return p;
    }));
    setNewComment('');
  };

  const handleShare = (platform: string, post: Post) => {
    const url = window.location.href;
    const text = `${post.title} - ${(post.content || '').substring(0, 50)}...`;
    
    let shareUrl = '';
    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case 'x':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'instagram':
        navigator.clipboard.writeText(url).then(() => {
          const toast = document.createElement('div');
          toast.className = 'fixed bottom-4 right-4 bg-zinc-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 border border-white/10';
          toast.textContent = t('blog.linkCopied');
          document.body.appendChild(toast);
          setTimeout(() => toast.remove(), 3000);
        });
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
    setShareModalOpen(null);
    
    try {
      const postRef = doc(db, 'posts', post.id);
      setDoc(postRef, {
        published: true,
        shares: increment(1)
      }, { merge: true }).catch(err => console.error("Error updating shares:", err));
    } catch (error) {
      console.error("Error updating shares:", error);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-12">
      {posts.map((post) => (
        <motion.article
          key={post.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-zinc-950 border border-white/10 rounded-xl overflow-hidden shadow-2xl hover:border-brand-500/30 transition-all duration-500 group"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/5 bg-zinc-900/30">
            <Link 
              to={`/blog/${post.id}`} 
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden border border-zinc-800 p-[2px] bg-gradient-to-tr from-brand-400 to-brand-600 shadow-[0_0_10px_rgba(234,179,8,0.3)]">
                <img
                  src={post.author?.avatar || "https://ui-avatars.com/api/?name=Ishak+Alper&background=27272a&color=ECCC7B&size=512"}
                  alt={post.author?.name || "İshak Alper"}
                  className="w-full h-full rounded-full object-cover border border-black"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-white text-sm font-bold tracking-wide">{post.author?.name || "İshak Alper"}</span>
                <span className="text-xs text-zinc-400 font-medium">{post.date}</span>
              </div>
            </Link>
          </div>

          {/* Post Content (Text) */}
          {(post.content || post.title) && (
            <div className="p-4 text-sm text-white leading-relaxed">
              {post.title && !post.content && (
                <span className="font-bold">{post.title}</span>
              )}
              {post.content && (
                <div className={`text-zinc-300 prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-a:text-brand-400 prose-img:rounded-lg prose-img:w-full line-clamp-4`}>
                  {post.title && post.excerpt ? (
                     <p className="mb-4 last:mb-0">{post.excerpt}</p>
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw, rehypeSanitize]}
                      components={{
                        a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
                        img: ({ node, ...props }) => <img {...props} className="rounded-lg w-full h-auto" referrerPolicy="no-referrer" />,
                        p: ({ node, ...props }) => <p {...props} className="mb-4 last:mb-0" />
                      }}
                    >
                      {post.content.replace(/^\s+/gm, '')}
                    </ReactMarkdown>
                  )}
                </div>
              )}
              {(post.content || '').length > 200 && (
                <Link 
                  to={`/blog/${post.id}`}
                  className="inline-block text-zinc-500 hover:text-zinc-300 font-medium text-sm mt-1 focus:outline-none"
                >
                  {t('blog.readMore')}
                </Link>
              )}
            </div>
          )}

          {/* Media (Image/Video) */}
          {post.imageUrl && (
            <Link 
              to={`/blog/${post.id}`}
              className="block w-full bg-black aspect-square flex items-center justify-center overflow-hidden cursor-pointer relative group/media"
            >
              <div className="absolute inset-0 bg-brand-500/0 group-hover/media:bg-brand-500/5 transition-colors z-10 pointer-events-none"></div>
              <img src={post.imageUrl} alt={t('blog.postImage')} className="w-full h-full object-cover group-hover/media:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
            </Link>
          )}

          {post.videoUrl && (
            <div className="w-full bg-black aspect-square flex items-center justify-center overflow-hidden relative">
              <div className="absolute inset-0 bg-brand-500/0 group-hover:bg-brand-500/5 transition-colors z-10 pointer-events-none"></div>
              <VideoPlayer url={post.videoUrl} className="w-full h-full object-cover relative z-20" />
            </div>
          )}

          {/* Actions & Content */}
          <div className="p-4 bg-zinc-900/30">
            {/* Action Buttons */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`transition-all hover:scale-110 ${
                    likedPosts.has(post.id) ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'text-white hover:text-zinc-300'
                  }`}
                  aria-label={likedPosts.has(post.id) ? t('blog.unlike') : t('blog.like')}
                >
                  <Heart className={`w-7 h-7 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                </button>
                <button 
                  onClick={() => toggleComments(post.id)}
                  className="text-white hover:text-zinc-300 transition-all hover:scale-110" 
                  aria-label={t('blog.comment')}
                >
                  <MessageCircle className="w-7 h-7" />
                </button>
                <div className="relative">
                  <button 
                    onClick={() => setShareModalOpen(shareModalOpen === post.id ? null : post.id)}
                    className="text-white hover:text-zinc-300 transition-all hover:scale-110"
                    aria-label={t('blog.share')}
                  >
                    <Send className="w-7 h-7" />
                  </button>

                  {/* Share Dropdown */}
                  <AnimatePresence>
                    {shareModalOpen === post.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute left-0 bottom-full mb-3 w-56 bg-zinc-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-30"
                      >
                        <div className="flex justify-between items-center p-4 border-b border-white/5 bg-zinc-900/50">
                          <span className="text-sm font-bold text-white">{t('blog.share')}</span>
                          <button onClick={() => setShareModalOpen(null)} className="text-zinc-400 hover:text-white transition-colors" aria-label={t('blog.close')}>
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="p-2 flex flex-col gap-1">
                          <button onClick={() => handleShare('whatsapp', post)} className="w-full text-left px-4 py-3 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-700/50 rounded-lg transition-colors">WhatsApp</button>
                          <button onClick={() => handleShare('telegram', post)} className="w-full text-left px-4 py-3 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-700/50 rounded-lg transition-colors">Telegram</button>
                          <button onClick={() => handleShare('x', post)} className="w-full text-left px-4 py-3 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-700/50 rounded-lg transition-colors">X (Twitter)</button>
                          <button onClick={() => handleShare('instagram', post)} className="w-full text-left px-4 py-3 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-700/50 rounded-lg transition-colors">{t('blog.copyLink')}</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              <button 
                onClick={() => handleSave(post.id)}
                className={`transition-all hover:scale-110 ${
                  savedPosts.has(post.id) ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-white hover:text-zinc-300'
                }`}
                aria-label={savedPosts.has(post.id) ? t('blog.unsave') : t('blog.save')}
              >
                <Bookmark className={`w-7 h-7 ${savedPosts.has(post.id) ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Likes Count */}
            <div className="text-white text-sm font-bold mb-2">
              {t('blog.likesCount', { count: post.likes })}
            </div>

            {/* Comments Section */}
            <AnimatePresence>
              {openComments.has(post.id) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-white/10"
                >
                  <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {post.comments && post.comments.length > 0 ? (
                      post.comments.map(comment => (
                        <div key={comment.id} className="text-sm">
                          <span className="font-bold text-white mr-2">{comment.author}</span>
                          <span className="text-zinc-300">{comment.text}</span>
                          <div className="text-xs text-zinc-500 mt-1">{comment.date}</div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-zinc-500 italic">{t('blog.noComments')}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 border border-white/10 rounded-full px-4 py-2 bg-zinc-900/50 focus-within:border-brand-500/50 focus-within:bg-zinc-900 transition-colors">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                      placeholder={t('blog.addComment')}
                      className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-white placeholder-zinc-500 py-2"
                    />
                    <button
                      onClick={() => handleAddComment(post.id)}
                      disabled={!newComment.trim()}
                      className="text-brand-400 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:text-brand-300 transition-colors"
                    >
                      {t('blog.postComment')}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.article>
      ))}

      {hasMore && (
        <div className="flex justify-center mt-12 mb-8">
          <button
            onClick={() => setDisplayCount(prev => prev + 7)}
            className="px-8 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded-full border border-white/10 transition-all hover:scale-105 shadow-lg"
          >
            {t('blog.loadMore', 'Daha Fazlasını Gör')}
          </button>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ArrowLeft, Calendar, Tag as TagIcon, Heart, MessageCircle, Send, X, Bookmark } from 'lucide-react';
import { staticBlogPosts, BlogPost as BlogPostType } from '../data/blogPosts';
import { samplePosts } from '../lib/seed'; // Add this import
import { handleFirestoreError, OperationType } from '../lib/errorHandling';
import BackButton from '../components/BackButton';
import VideoPlayer from '../components/VideoPlayer';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

interface Comment {
  id: string;
  author: string;
  text: string;
  date: string;
}

export default function BlogPost() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    if (id) {
      const savedLikes = localStorage.getItem('likedPosts');
      if (savedLikes) {
        const parsed = new Set(JSON.parse(savedLikes));
        setIsLiked(parsed.has(id));
      }
      const savedBookmarks = localStorage.getItem('savedPosts');
      if (savedBookmarks) {
        const parsed = new Set(JSON.parse(savedBookmarks));
        setIsSaved(parsed.has(id));
      }
    }
  }, [id]);

  useEffect(() => {
    async function fetchPost() {
      const decodedId = decodeURIComponent(id || '');
      if (!decodedId) return;
      
      try {
        // First check static posts
        const staticPost = staticBlogPosts.find(p => p.id === decodedId);
        if (staticPost) {
          setPost(staticPost);
          setLikesCount(staticPost.likes || Math.floor(Math.random() * 500) + 100);
          setLoading(false);
          return;
        }

        // Check sample posts
        if (decodedId.startsWith('sample-')) {
          const index = parseInt(decodedId.split('-')[1]);
          const samplePost = samplePosts[index];
          if (samplePost) {
            setPost({
              id: decodedId,
              ...samplePost,
              createdAt: new Date().toISOString(),
              authorId: 'ishak-alper',
              author: {
                name: 'İshak Alper',
                avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop'
              }
            } as BlogPostType);
            setLikesCount(Math.floor(Math.random() * 500) + 100);
            setLoading(false);
            return;
          }
        }

        // Then check Firestore
        const docRef = doc(db, 'posts', decodedId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.published) {
            setPost({ id: docSnap.id, ...data } as BlogPostType);
            setLikesCount(data.likes || Math.floor(Math.random() * 500) + 100);
            setComments(data.comments || []);
          } else {
            setError(t('blog.postNotPublished'));
          }
        } else {
          setError(t('blog.postNotFound'));
        }
      } catch (err: any) {
        console.error("Error fetching post:", err);
        setError(t('blog.postLoadError'));
        handleFirestoreError(err, OperationType.GET, `posts/${decodedId}`);
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [id, t]);

  const handleLike = () => {
    if (!id) return;
    setIsLiked(prev => {
      const newState = !prev;
      setLikesCount(count => newState ? count + 1 : count - 1);
      
      const savedLikes = localStorage.getItem('likedPosts');
      const likesSet = savedLikes ? new Set<string>(JSON.parse(savedLikes)) : new Set<string>();
      if (newState) likesSet.add(id);
      else likesSet.delete(id);
      localStorage.setItem('likedPosts', JSON.stringify(Array.from(likesSet)));
      
      try {
        const postRef = doc(db, 'posts', id);
        updateDoc(postRef, {
          likes: increment(newState ? 1 : -1)
        }).catch(err => console.error("Error updating likes:", err));
      } catch (error) {
        console.error("Error updating likes:", error);
      }
      
      return newState;
    });
  };

  const handleSave = () => {
    if (!id) return;
    setIsSaved(prev => {
      const newState = !prev;
      
      const savedBookmarks = localStorage.getItem('savedPosts');
      const savesSet = savedBookmarks ? new Set<string>(JSON.parse(savedBookmarks)) : new Set<string>();
      if (newState) savesSet.add(id);
      else savesSet.delete(id);
      localStorage.setItem('savedPosts', JSON.stringify(Array.from(savesSet)));
      
      try {
        const postRef = doc(db, 'posts', id);
        updateDoc(postRef, {
          saves: increment(newState ? 1 : -1)
        }).catch(err => console.error("Error updating saves:", err));
      } catch (error) {
        console.error("Error updating saves:", error);
      }
      
      return newState;
    });
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = post ? `"${post.title}" yazısını okumalısın:` : '';
    
    let shareUrl = '';
    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case 'x':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(url).then(() => {
          const toast = document.createElement('div');
          toast.className = 'fixed bottom-4 right-4 bg-zinc-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 border border-white/10';
          toast.textContent = t('blog.linkCopied');
          document.body.appendChild(toast);
          setTimeout(() => toast.remove(), 3000);
        });
        setShareModalOpen(false);
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
    setShareModalOpen(false);
    
    if (id) {
      try {
        const postRef = doc(db, 'posts', id);
        updateDoc(postRef, {
          shares: increment(1)
        }).catch(err => console.error("Error updating shares:", err));
      } catch (error) {
        console.error("Error updating shares:", error);
      }
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !id) return;
    
    const comment: Comment = {
      id: Date.now().toString(),
      author: t('blog.guestUser'),
      text: newComment,
      date: t('blog.now')
    };
    
    const updatedComments = [...comments, comment];
    setComments(updatedComments);
    setNewComment('');
    
    try {
      const postRef = doc(db, 'posts', id);
      updateDoc(postRef, {
        comments: updatedComments
      }).catch(err => console.error("Error updating comments:", err));
    } catch (error) {
      console.error("Error updating comments:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex justify-center py-32">
        <div className="w-8 h-8 border-2 border-zinc-800 border-t-zinc-200 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-zinc-950 py-32 px-4 text-center">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-serif text-white mb-4">{t('blog.errorTitle')}</h1>
          <p className="text-zinc-400 mb-8">{error || t('blog.postNotFound')}</p>
          <button 
            onClick={() => navigate('/blog')}
            className="inline-flex items-center text-brand-400 hover:text-brand-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('blog.backToBlog')}
          </button>
        </div>
      </div>
    );
  }

  const formattedDate = post.createdAt?.toDate 
    ? format(post.createdAt.toDate(), 'd MMMM yyyy', { locale: tr }) 
    : (typeof post.createdAt === 'string' 
      ? format(new Date(post.createdAt), 'd MMMM yyyy', { locale: tr })
      : t('blog.new'));

  return (
    <article className="min-h-screen bg-zinc-950 py-24">
      <BackButton />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-zinc-950 border border-white/10 rounded-xl overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/5 bg-zinc-900/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-zinc-800 p-[2px] bg-gradient-to-tr from-brand-400 to-brand-600 shadow-[0_0_10px_rgba(234,179,8,0.3)]">
                <img
                  src={(post as any).author?.avatar || "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop"}
                  alt={(post as any).author?.name || "İshak Alper"}
                  className="w-full h-full rounded-full object-cover border border-black"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-white text-sm font-bold tracking-wide">{(post as any).author?.name || "İshak Alper"}</span>
                <span className="text-xs text-zinc-400 font-medium">{formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Post Content (Text) */}
          {(post.content || post.title) && (
            <div className="p-4 text-sm text-white leading-relaxed">
              {post.title && !post.content && (
                <span className="font-bold">{post.title}</span>
              )}
              {post.content && (
                <div className="text-zinc-300 prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-a:text-brand-400 prose-img:rounded-lg prose-img:w-full">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeSanitize]}
                    components={{
                      a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
                      img: ({ node, ...props }) => <img {...props} className="rounded-lg w-full h-auto" referrerPolicy="no-referrer" />
                    }}
                  >
                    {post.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          )}

          {/* Media (Image/Video) */}
          {(post as any).imageUrl && (
            <div className="w-full bg-black flex items-center justify-center overflow-hidden relative">
              <img src={(post as any).imageUrl} alt="Gönderi görseli" className="w-full h-auto max-h-[70vh] object-contain" referrerPolicy="no-referrer" />
            </div>
          )}
          
          {(post as any).videoUrl && (
            <div className="w-full bg-black flex items-center justify-center overflow-hidden relative aspect-video">
              <VideoPlayer 
                url={(post as any).videoUrl} 
                className="w-full h-full absolute inset-0"
              />
            </div>
          )}

          {/* Actions & Content */}
          <div className="p-4 bg-zinc-900/30">
            {/* Action Buttons */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleLike}
                  className={`transition-all hover:scale-110 ${
                    isLiked ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'text-white hover:text-zinc-300'
                  }`}
                  aria-label={isLiked ? t('blog.unlike') : t('blog.like')}
                >
                  <Heart className={`w-7 h-7 ${isLiked ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={() => setCommentsOpen(!commentsOpen)}
                  className="text-white hover:text-zinc-300 transition-all hover:scale-110"
                  aria-label={t('blog.comment')}
                >
                  <MessageCircle className="w-7 h-7" />
                </button>
                <div className="relative">
                  <button 
                    onClick={() => setShareModalOpen(!shareModalOpen)}
                    className="text-white hover:text-zinc-300 transition-all hover:scale-110"
                    aria-label={t('blog.share')}
                  >
                    <Send className="w-7 h-7" />
                  </button>

                  {/* Share Dropdown */}
                  <AnimatePresence>
                    {shareModalOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute left-0 bottom-full mb-3 w-56 bg-zinc-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-30"
                      >
                        <div className="flex justify-between items-center p-4 border-b border-white/5 bg-zinc-900/50">
                          <span className="text-sm font-bold text-white">{t('blog.share')}</span>
                          <button onClick={() => setShareModalOpen(false)} className="text-zinc-400 hover:text-white transition-colors" aria-label={t('blog.close')}>
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="p-2 flex flex-col gap-1">
                          <button onClick={() => handleShare('whatsapp')} className="w-full text-left px-4 py-3 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-700/50 rounded-lg transition-colors">WhatsApp</button>
                          <button onClick={() => handleShare('telegram')} className="w-full text-left px-4 py-3 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-700/50 rounded-lg transition-colors">Telegram</button>
                          <button onClick={() => handleShare('x')} className="w-full text-left px-4 py-3 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-700/50 rounded-lg transition-colors">X (Twitter)</button>
                          <button onClick={() => handleShare('copy')} className="w-full text-left px-4 py-3 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-700/50 rounded-lg transition-colors">{t('blog.copyLink')}</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              <button 
                onClick={handleSave}
                className={`transition-all hover:scale-110 ${
                  isSaved ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-white hover:text-zinc-300'
                }`}
                aria-label={isSaved ? t('blog.unsave') : t('blog.save')}
              >
                <Bookmark className={`w-7 h-7 ${isSaved ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Likes Count */}
            <div className="text-white text-sm font-bold mb-2">
              {likesCount} {t('blog.likes')}
            </div>

            {/* Comments Section */}
            <AnimatePresence>
              {commentsOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-white/10"
                >
                  <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {comments.length > 0 ? (
                      comments.map(comment => (
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
                      onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                      placeholder={t('blog.addComment')}
                      className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-white placeholder-zinc-500 py-2"
                    />
                    <button
                      onClick={handleAddComment}
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
        </motion.div>
      </div>
    </article>
  );
}

import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    // If there's no history state (e.g. opened in new tab), go to home
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <button
      onClick={handleBack}
      className="fixed top-6 left-4 md:left-8 z-50 flex items-center gap-2 px-4 py-2 bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-full text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 shadow-lg"
      aria-label="Ana Sayfaya Dön"
    >
      <ArrowLeft className="w-4 h-4" />
      <span className="text-sm font-medium">Geri</span>
    </button>
  );
}

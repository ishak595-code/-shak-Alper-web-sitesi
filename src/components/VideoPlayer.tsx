import React from 'react';

interface VideoPlayerProps {
  url: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
}

export default function VideoPlayer({ url, className = '', autoPlay, muted, loop }: VideoPlayerProps) {
  if (!url) return null;

  // Auto-replace bad sample URLs
  if (url.includes('storage.googleapis.com/gtv-videos-bucket')) {
    url = 'https://www.youtube.com/watch?v=LXb3EKWsInQ';
  }

  // Check if it's a YouTube URL
  const getYoutubeId = (url: string) => {
    if (typeof url !== 'string') return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const youtubeId = getYoutubeId(url);

  if (youtubeId) {
    return (
      <iframe
        className={className}
        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=${autoPlay ? 1 : 0}&mute=${muted ? 1 : 0}&loop=${loop ? 1 : 0}&playlist=${loop ? youtubeId : ''}`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    );
  }

  // Default HTML5 Video Player
  return (
    <video 
      src={url} 
      className={className}
      controls={!autoPlay}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      playsInline
      preload="metadata"
      onError={(e) => {
        console.error("Video yüklenemedi:", url);
      }}
    >
      Tarayıcınız video etiketini desteklemiyor.
    </video>
  );
}

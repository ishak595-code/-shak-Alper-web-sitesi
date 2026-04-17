import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  structuredData?: Record<string, any>;
}

export default function SEO({ 
  title, 
  description, 
  keywords = "İshak Alper, Çıplak Gösteren Gözlükler, kişisel gelişim kitabı, psikoloji danışmanlık, karanlık psikoloji", 
  image, 
  url = "https://ishakalper.com/",
  type = "website",
  structuredData
}: SEOProps) {
  const [globalImage, setGlobalImage] = useState<string>("https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=1920&auto=format&fit=crop");
  const [globalKeywords, setGlobalKeywords] = useState<string>(keywords);
  const [globalDesc, setGlobalDesc] = useState<string>("");

  useEffect(() => {
    const fetchGlobalImage = async () => {
      try {
        const docRef = doc(db, 'settings', 'general');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.profilePictureUrl) setGlobalImage(data.profilePictureUrl);
          if (data.seoKeywords) setGlobalKeywords(data.seoKeywords);
          if (data.seoDescription) setGlobalDesc(data.seoDescription);
        }
      } catch (err) {
        console.error("Error fetching SEO global settings:", err);
      }
    };
    fetchGlobalImage();
  }, []);

  const finalImage = image || globalImage;
  const finalKeywords = globalKeywords || keywords;
  const finalDescription = description || globalDesc;
  
  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "İshak Alper",
    "url": "https://ishakalper.com/",
    "image": finalImage
  };

  const ldJson = structuredData || defaultStructuredData;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalImage} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={finalDescription} />
      <meta property="twitter:image" content={finalImage} />

      {/* AI Bot Hint Tags */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(ldJson)}
      </script>
    </Helmet>
  );
}

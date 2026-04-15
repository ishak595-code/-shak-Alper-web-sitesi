export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  createdAt: any;
  authorId: string;
  published: boolean;
  tags: string[];
  likes?: number;
  shares?: number;
  saves?: number;
  comments?: any[];
  imageUrl?: string;
  videoUrl?: string;
  author?: {
    name: string;
    avatar: string;
  };
}

export const staticBlogPosts: BlogPost[] = [
  {
    id: 'ciplak-gosteren-gozlukler',
    title: 'Çıplak Gösteren Gözlükler: Gerçekliği Filtresiz Görmek',
    excerpt: 'Toplumsal maskelerin ardındaki gerçek niyetleri görmek ne anlama geliyor? İnsanların saklamaya çalıştığı çıplak gerçeklerle yüzleşmeye hazır mısınız?',
    content: `
      <p>Çocukken hepimizin hayalini kurduğu o efsanevi "çıplak gösteren gözlükleri" hatırlarsınız. Çizgi romanların arka sayfalarında satılan, taktığınızda insanların kıyafetlerinin altını görebileceğinizi vaat eden o sihirli nesne. Elbette o gözlükler birer kandırmacaydı. Ancak büyüdükçe, çok daha gerçek ve çok daha sarsıcı bir "çıplak gösteren gözlüğe" sahip olduğumu fark ettim.</p>
      
      <p>Benim gözlüklerim insanların fiziksel bedenlerini değil, ruhlarını, niyetlerini ve taktıkları toplumsal maskelerin ardındaki o savunmasız, bazen de karanlık gerçekliği gösteriyor.</p>
      
      <p>Her gün sokakta, iş yerinde, sosyal medyada kusursuz hayatlar, sarsılmaz özgüvenler ve bitmek bilmeyen bir mutluluk tablosu sergileyen insanlarla karşılaşıyoruz. Ancak bu gözlükleri taktığınızda, o şatafatlı vitrinlerin arkasındaki korkuları, güvensizlikleri, onaylanma ihtiyacını ve bencil dürtüleri görüyorsunuz. İnsanların "Nasılsın?" sorusuna verdikleri "İyiyim" cevabının altındaki o sessiz çığlığı duyuyorsunuz.</p>
      
      <p>Bu yetenek, bir lütuf olduğu kadar ağır bir yük. Çünkü gerçeği bir kez gördüğünüzde, bir daha o tatlı yalanlara inanamazsınız. Sahte gülümsemeler size batar, yapmacık nezaketler midenizi bulandırır. İnsanların kendilerine bile itiraf edemedikleri gerçekleri yüzlerine vurmamak için dilinizi ısırmak zorunda kalırsınız.</p>
      
      <p>Ancak bu çıplak gerçeklik, aynı zamanda muazzam bir özgürlük sunar. Sizi manipüle etmeye çalışanların iplerini görürsünüz. Kimin gerçekten yanınızda olduğunu, kimin sadece kendi çıkarları için orada bulunduğunu anlarsınız. Hayatı, başkalarının yazdığı bir senaryoya göre değil, kendi kurallarınıza göre yaşamaya başlarsınız.</p>
      
      <p>Peki siz, bu gözlükleri takmaya cesaret edebilir misiniz? İnsanların, hatta en sevdiklerinizin bile o kusurlu, bencil ve zayıf halleriyle yüzleşmeye hazır mısınız? Unutmayın, gerçeklik her zaman güzel değildir, ama her zaman özgürleştiricidir.</p>
    `,
    createdAt: new Date('2023-10-15T10:00:00Z').toISOString(),
    authorId: 'ishak-alper',
    published: true,
    tags: ['Psikoloji', 'Farkındalık', 'Gerçeklik']
  },
  {
    id: 'farkindaligin-agirligi',
    title: 'Farkındalığın Ağırlığı: Gerçeği Görmenin Bedeli',
    excerpt: 'Her şeyi olduğu gibi görmek, insanı özgürleştirir mi yoksa yalnızlaştırır mı? Yüksek farkındalığın getirdiği o ağır yükle nasıl başa çıkılır?',
    content: `
      <p>Cehalet mutluluktur derler. Bu sözün ne kadar doğru olduğunu, ancak o cehalet perdesi kalktığında anlarsınız. Etrafınızdaki dünyayı, insanların davranışlarının altındaki gerçek motivasyonları ve toplumun işleyişindeki o görünmez çarkları görmeye başladığınızda, geri dönüşü olmayan bir yola girmişsiniz demektir.</p>
      
      <p>Farkındalık, yavaş yavaş yayılan bir zehir gibidir. Önce küçük detayları fark edersiniz. Bir arkadaşınızın size iltifat ederken gözlerindeki o anlık kıskançlık parıltısını, yöneticinizin "biz bir aileyiz" derken aslında sadece daha fazla kar elde etmeyi düşündüğünü, sosyal medyadaki o kusursuz çiftin aslında ne kadar mutsuz olduğunu... Sonra bu detaylar birleşir ve büyük resmi oluşturur.</p>
      
      <p>Bu büyük resim, çoğu zaman rahatsız edicidir. İnsanların büyük bir çoğunluğunun, kendi yarattıkları yalan dünyalarında, sorgulamadan, sadece hayatta kalmaya çalışarak yaşadığını görürsünüz. Ve siz, bu gerçeği onlara anlatamazsınız. Çünkü insanlar uyanmak istemezler. Rüyaları ne kadar kabus gibi olursa olsun, uyanmanın getireceği o soğuk ve sert gerçeklikten korkarlar.</p>
      
      <p>İşte farkındalığın ağırlığı tam da buradadır: Yalnızlık. Gerçeği gören gözler, yalanlara inanan kalabalıklar arasında her zaman yalnızdır. Söyledikleriniz anlaşılamaz, uyarılarınız dikkate alınmaz, hatta çoğu zaman "fazla düşünmekle" veya "karamsar olmakla" suçlanırsınız.</p>
      
      <p>Ancak bu yalnızlık, aynı zamanda bir güç kaynağıdır. Sürüden ayrılmak, kendi yolunuzu çizmek demektir. Başkalarının beklentilerine göre değil, kendi doğrularınıza göre yaşamak demektir. Farkındalığın ağırlığını taşımayı öğrendiğinizde, o yük sizi ezmez, aksine sizi daha güçlü, daha dayanıklı ve daha bilge bir insan yapar.</p>
      
      <p>Eğer siz de bu ağırlığı hissediyorsanız, bilin ki yalnız değilsiniz. Ve bu ağırlık, aslında taşımanız gereken en değerli hazinenizdir.</p>
    `,
    createdAt: new Date('2023-11-02T14:30:00Z').toISOString(),
    authorId: 'ishak-alper',
    published: true,
    tags: ['Kişisel Gelişim', 'Felsefe', 'Yalnızlık']
  },
  {
    id: 'modern-iliskilerin-illuzyonu',
    title: 'Modern İlişkilerin İllüzyonu: Maskeli Baloda Aşk',
    excerpt: 'Günümüz ilişkileri neden bu kadar kırılgan? Sevgi sandığımız şey, aslında kendi eksikliklerimizi kapatma çabamız olabilir mi?',
    content: `
      <p>Modern çağda ilişkiler, devasa bir maskeli baloya dönüştü. Herkes en güzel, en başarılı, en anlayışlı maskesini takıp sahneye çıkıyor. Ancak müzik sustuğunda ve maskeler düştüğünde, geriye kalan o çıplak gerçeklikle kimse yüzleşmek istemiyor.</p>
      
      <p>İnsanları izlediğimde, çoğu ilişkinin sevgi üzerine değil, ihtiyaçlar ve korkular üzerine kurulduğunu görüyorum. Yalnız kalma korkusu, onaylanma ihtiyacı, toplumsal baskılar... İki insan bir araya geldiğinde, aslında birbirlerini değil, birbirlerinin yansıttığı o idealize edilmiş imgeleri seviyorlar.</p>
      
      <p>"Seni seviyorum" cümlesinin altında yatan gerçek anlam çoğu zaman şudur: "Bana kendimi iyi hissettiriyorsun", "Benim eksikliklerimi tamamlıyorsun", "Bana yalnız olmadığımı hissettiriyorsun". Bu, sevgi değil, bir tür duygusal ticarettir. Ve her ticaret gibi, taraflardan biri zarar ettiğini hissettiğinde anlaşma bozulur.</p>
      
      <p>Gerçek bir ilişki kurabilmek için, önce kendi maskelerimizden kurtulmamız gerekir. Kendi karanlığımızla, korkularımızla ve zaaflarımızla yüzleşmeden, bir başkasını gerçekten sevemeyiz. Karşımızdaki insanı, bizim beklentilerimizi karşılayan bir obje olarak değil, kendi doğruları, yanlışları ve yaraları olan bağımsız bir birey olarak kabul etmeliyiz.</p>
      
      <p>Bu, cesaret ister. Çünkü maskesiz olmak, savunmasız olmaktır. Yaralanmaya, reddedilmeye ve hayal kırıklığına açık olmaktır. Ancak sadece bu savunmasızlık durumunda gerçek bir bağ kurulabilir.</p>
      
      <p>İlişkilerinizi gözden geçirin. Karşınızdaki insanı mı seviyorsunuz, yoksa onun size sunduğu o konforlu illüzyonu mu? Maskeleri çıkarma vakti gelmedi mi?</p>
    `,
    createdAt: new Date('2023-11-20T09:15:00Z').toISOString(),
    authorId: 'ishak-alper',
    published: true,
    tags: ['İlişkiler', 'Psikoloji', 'Toplum']
  },
  {
    id: 'gercekle-yuzlesme-cesareti',
    title: 'Gerçekle Yüzleşme Cesareti: Konforlu Yalanlardan Kurtulmak',
    excerpt: 'Neden acı veren gerçekler yerine, bizi uyuşturan tatlı yalanları tercih ediyoruz? Gerçekle yüzleşmek neden bu kadar zor?',
    content: `
      <p>İnsan zihni, acıdan kaçmak ve hazza yönelmek üzere programlanmıştır. Bu evrimsel mekanizma, fiziksel hayatta kalmamızı sağlasa da, psikolojik ve ruhsal gelişimimizin önündeki en büyük engeldir. Çünkü büyüme, her zaman bir miktar acı ve rahatsızlık gerektirir.</p>
      
      <p>Günlük hayatımızda, sürekli olarak kendimize ve başkalarına yalanlar söyleriz. "Yarın diyete başlayacağım", "Bu işi sevmiyorum ama yakında ayrılacağım", "Aslında o kadar da kötü biri değil, sadece zor bir dönemden geçiyor"... Bu yalanlar, bizi harekete geçmenin ve değişim yaratmanın getireceği o zorlu süreçten korur. Bize sahte bir güvenlik hissi verir.</p>
      
      <p>Ancak konforlu yalanlar, yavaş etkili bir zehir gibidir. Sizi anında öldürmez, ama yavaş yavaş çürütür. Potansiyelinizi gerçekleştirmenizi engeller, sizi mutsuz ve tatminsiz bir hayata mahkum eder.</p>
      
      <p>Gerçekle yüzleşmek, bir aynanın karşısına geçip tüm kusurlarınıza, hatalarınıza ve başarısızlıklarınıza dürüstçe bakabilmektir. "Evet, burada hata yaptım", "Evet, bu konuda yetersizim", "Evet, bu ilişki bana zarar veriyor" diyebilmektir.</p>
      
      <p>Bu yüzleşme anı, son derece acı vericidir. Egonuz zedelenir, savunma mekanizmalarınız çöker. Ancak o acının hemen ardında, muazzam bir özgürlük yatar. Çünkü gerçeği kabul ettiğiniz an, onu değiştirme gücünü de elinize alırsınız.</p>
      
      <p>Hayatınızı değiştirmek istiyorsanız, önce kendinize söylediğiniz o tatlı yalanları bulup çıkarmalısınız. Acıtsa bile, kanatsa bile gerçeğin neşterini elinize almalı ve o konfor alanını kesip atmalısınız. Unutmayın, iyileşme ancak yaranın temizlenmesiyle başlar.</p>
    `,
    createdAt: new Date('2023-12-05T16:45:00Z').toISOString(),
    authorId: 'ishak-alper',
    published: true,
    tags: ['Cesaret', 'Kişisel Gelişim', 'Motivasyon']
  },
  {
    id: 'aldatmanin-psikolojisi',
    title: 'Aldatmanın Psikolojisi: Neden Kendimizi ve Başkalarını Kandırıyoruz?',
    excerpt: 'Yalan söylemek sadece ahlaki bir zayıflık mı, yoksa derin psikolojik ihtiyaçların bir yansıması mı? İnsan doğasının karanlık yüzüne bir bakış.',
    content: `
      <p>İnsanları gözlemlediğimde en çok dikkatimi çeken şeylerden biri, kendilerini kandırma konusundaki inanılmaz yetenekleridir. Başkalarına yalan söylemek nispeten kolaydır, ancak insanın kendi kendine yalan söylemesi ve buna inanması, zihnin en karmaşık oyunlarından biridir.</p>
      
      <p>Neden aldatırız? Neden gerçeği çarpıtırız? Bunun temelinde genellikle iki güçlü duygu yatar: Korku ve arzu.</p>
      
      <p>Korku, bizi yetersizliklerimizle, hatalarımızla veya toplumun beklentilerini karşılayamamamızla yüzleşmekten alıkoyar. Kendi gözümüzde veya başkalarının gözünde değerimizi kaybetmemek için, gerçekliği yeniden inşa ederiz. "Ben başarısız olmadım, sadece şartlar uygun değildi" deriz. Bu, egomuzu korumak için kurduğumuz bir savunma kalkanıdır.</p>
      
      <p>Arzu ise, sahip olmadığımız şeylere ulaşmak veya sahip olduklarımızı kaybetmemek için bizi yalana iter. Daha iyi bir iş, daha prestijli bir statü, daha çekici bir partner... Bu arzular o kadar güçlüdür ki, onlara ulaşmak için gerçeği esnetmekte bir sakınca görmeyiz.</p>
      
      <p>Ancak aldatma, sürdürülmesi çok zor bir illüzyondur. Söylenen her yalan, inşa edilen o sahte gerçekliği ayakta tutmak için yeni yalanlar doğurur. Bir süre sonra, kişi kendi yarattığı o yalan labirentinde kaybolur. Kim olduğunu, ne hissettiğini ve ne istediğini unutur.</p>
      
      <p>Kendini kandırmanın en tehlikeli yanı, gelişimi durdurmasıdır. Hatasını kabul etmeyen biri, o hatadan ders çıkaramaz. Eksikliğini görmeyen biri, kendini geliştiremez. Gerçek bir dönüşüm, ancak acımasız bir dürüstlükle mümkündür.</p>
      
      <p>Bugün kendinize bir iyilik yapın. Aynaya bakın ve kendinize söylediğiniz en büyük yalanı itiraf edin. Bu, özgürlüğe giden yoldaki ilk ve en önemli adımdır.</p>
    `,
    createdAt: new Date('2023-12-18T11:20:00Z').toISOString(),
    authorId: 'ishak-alper',
    published: true,
    tags: ['Psikoloji', 'İnsan Doğası', 'Dürüstlük']
  },
  {
    id: 'ciplak-gerceklikte-anlam-bulmak',
    title: 'Çıplak Gerçeklikte Anlam Bulmak: Özgürlüğe Giden Yol',
    excerpt: 'Hayatın tüm illüzyonları yıkıldığında geriye ne kalır? Çıplak ve süssüz bir gerçeklikte nasıl anlam ve huzur bulabiliriz?',
    content: `
      <p>Birçok insan, gerçeğin soğuk, acımasız ve anlamsız olduğunu düşünür. Bu yüzden hayatlarını, o gerçeği örtecek renkli battaniyeler aramakla geçirirler. Eğlence, tüketim, statü, yüzeysel ilişkiler... Tüm bunlar, o çıplak gerçekliğin üşüten rüzgarından korunmak için inşa edilmiş barınaklardır.</p>
      
      <p>Ancak o barınaklar er ya da geç yıkılır. Bir hastalık, bir kayıp, bir kriz anında, hayatın o süssüz ve çıplak yüzüyle karşı karşıya kalırız. İşte o an, insanın en büyük sınavıdır.</p>
      
      <p>Benim deneyimim bana şunu öğretti: Anlam, o renkli battaniyelerin altında değil, tam da o çıplak gerçekliğin merkezinde yatıyor. Hayatın geçiciliğini, adaletsizliğini ve acımasızlığını kabul ettiğinizde, paradoksal bir şekilde derin bir huzur buluyorsunuz.</p>
      
      <p>Çünkü illüzyonlar yıkıldığında, geriye sadece "olan" kalır. Beklentiler, hayal kırıklıkları, "keşke"ler ve "acaba"lar ortadan kalkar. Sadece şu an, şu nefes ve şu deneyim vardır. Bu, muazzam bir hafiflik hissidir.</p>
      
      <p>Çıplak gerçeklikte anlam bulmak, hayatı olduğu gibi sevebilmektir. İnsanları, tüm kusurları ve zayıflıklarıyla kabul etmektir. Kendi karanlığınızla barışmak ve onu dönüştürme gücünü elinize almaktır.</p>
      
      <p>Bu kolay bir yol değildir. Cesaret, dayanıklılık ve acımasız bir dürüstlük gerektirir. Ancak bu yolu yürümeyi seçenler, hayatın o sahte vitrinlerinin ardındaki gerçek güzelliği, o derin ve sarsılmaz anlamı bulurlar.</p>
      
      <p>Maskelerinizi indirin. Gözlüklerinizi takın. Ve hayatın o muhteşem, korkutucu ve büyüleyici çıplaklığıyla yüzleşin. Gerçek özgürlük, tam da orada sizi bekliyor.</p>
    `,
    createdAt: new Date('2024-01-10T13:00:00Z').toISOString(),
    authorId: 'ishak-alper',
    published: true,
    tags: ['Felsefe', 'Anlam Arayışı', 'Özgürlük']
  }
];

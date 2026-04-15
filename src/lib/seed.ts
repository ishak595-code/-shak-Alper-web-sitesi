import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export const samplePosts = [
  {
    title: "Maskelerin Arkasındaki Gerçek",
    excerpt: "Neden her gün farklı bir maske takıyoruz? Toplumun bizden beklediği rolleri oynarken kendi özümüzü nasıl kaybediyoruz?",
    content: "Her sabah evden çıkarken yüzümüze görünmez bir maske takarız. İş yerindeki profesyonel maskemiz, ailemizin yanındaki itaatkar maskemiz, arkadaşlarımızın yanındaki eğlenceli maskemiz... Peki bu maskeleri çıkardığımızda geriye ne kalır? Çıplak Gösteren Gözlükler metaforu tam da burada devreye giriyor. İnsanların taktığı maskeleri değil, o maskelerin arkasındaki korkuları, onaylanma ihtiyacını ve sevilme arzusunu görmek... Bu yazıda, kendi maskelerimizle nasıl yüzleşebileceğimizi ve otantik benliğimizi nasıl bulabileceğimizi tartışıyoruz.",
    published: true,
    tags: ["Psikoloji", "Farkındalık", "Maskeler"]
  },
  {
    title: "İkili İlişkilerde Kör Noktalarımız",
    excerpt: "Neden sürekli aynı tip insanlara çekiliyoruz? İlişkilerimizdeki tekrarlayan hataların altında yatan psikolojik dinamikler neler?",
    content: "Aşk ve ilişkiler, en savunmasız olduğumuz alanlardır. Çoğu zaman, bizi en çok yaralayacak insanları adeta bir mıknatıs gibi hayatımıza çekeriz. Neden mi? Çünkü bilinçaltımız, tanıdık olan acıyı, bilinmeyen huzura tercih eder. Çocuklukta çözülmemiş travmalarımız, yetişkinlikteki partner seçimlerimizi doğrudan etkiler. Bu kör noktaları fark etmeden, sağlıklı bir ilişki kurmak neredeyse imkansızdır. Kendinize şu soruyu sorun: Karşımdaki kişiyi gerçekten görüyor muyum, yoksa ona kendi geçmişimden bir rol mü biçiyorum?",
    published: true,
    tags: ["İlişkiler", "Travma", "Bilinçaltı"]
  },
  {
    title: "Dijital Çağda Yalnızlık İllüzyonu",
    excerpt: "Binlerce takipçimiz var ama neden kendimizi hiç bu kadar yalnız hissetmemiştik? Sosyal medyanın psikolojimiz üzerindeki yıkıcı etkisi.",
    content: "Ekranda kaydırdığımız her kusursuz hayat, kendi hayatımızdaki eksiklikleri yüzümüze vuruyor. Sosyal medya, bizi birbirimize bağlamak vaadiyle ortaya çıktı ama sonuç tam bir izolasyon oldu. Beğenilerle beslenen egomuz, gerçek ve derin bağlar kurmayı unuttu. 'Çıplak Gösteren Gözlükler'i dijital dünyaya çevirdiğimizde, o kusursuz fotoğrafların arkasındaki derin yalnızlığı ve yetersizlik hissini görebiliriz. Gerçek bağlantı, filtrelerin olmadığı yerde başlar.",
    published: true,
    tags: ["Sosyal Medya", "Yalnızlık", "Dijital Dönüşüm"]
  },
  {
    title: "Başarı Takıntısı ve Tükenmişlik",
    excerpt: "Sürekli daha fazlasını istemek bizi gerçekten mutlu ediyor mu? Modern dünyanın başarı tanımını yeniden sorguluyoruz.",
    content: "Daha iyi bir iş, daha büyük bir ev, daha lüks bir araba... Hedeflerimize ulaştığımızda hissettiğimiz o kısa süreli tatmin duygusu, yerini hızla yeni bir hedefe bırakıyor. Bu sonu gelmez koşu bandında, aslında neyden kaçıyoruz? Başarı, çoğu zaman içimizdeki değersizlik hissini örtbas etmek için kullandığımız bir kılıftır. Gerçek başarı, ne kadar şeye sahip olduğunuz değil, sahip olmadıklarınızla ne kadar barışık olduğunuzdur.",
    published: true,
    tags: ["Kariyer", "Tükenmişlik", "Başarı"]
  },
  {
    title: "Korkularımızla Yüzleşme Cesareti",
    excerpt: "Korkularımızdan kaçmak yerine onlara doğru yürümek neden özgürleşmenin tek yoludur?",
    content: "Korku, bizi hayatta tutan ilkel bir duygudur. Ancak modern dünyada fiziksel tehditlerden çok, psikolojik tehditlerden korkuyoruz. Reddedilmekten, başarısız olmaktan, yalnız kalmaktan... Korkularımızdan kaçtıkça, onların esiri oluruz. Çıplak Gösteren Gözlükler, korkularımızın aslında ne kadar temelsiz olduğunu gösterir. Korkunun üstüne gitmek, karanlık bir odaya ışık tutmak gibidir; canavarların sadece gölgelerden ibaret olduğunu anlarsınız.",
    published: true,
    tags: ["Korku", "Cesaret", "Kişisel Gelişim"]
  },
  {
    title: "Affetmenin İyileştirici Gücü",
    excerpt: "Başkalarını affetmek aslında kendimize verdiğimiz en büyük hediyedir. Peki ama nasıl?",
    content: "Affetmek, yapılan yanlışı onaylamak veya unutmak demek değildir. Affetmek, o yanlışın sizin üzerinizdeki duygusal hakimiyetine son vermektir. İçinizde taşıdığınız öfke ve kin, size zarar veren kişiye değil, sadece size ağırlık yapar. Zehri kendiniz içip, başkasının ölmesini beklemek gibidir. Kendi içsel huzurunuz için, geçmişin yüklerini bırakmayı öğrenmelisiniz.",
    published: true,
    tags: ["Affetmek", "Huzur", "Geçmiş"]
  },
  {
    title: "Mükemmeliyetçilik Tuzağı",
    excerpt: "Her şeyi kusursuz yapma çabası, aslında hata yapma korkumuzun bir yansımasıdır.",
    content: "Mükemmeliyetçilik, genellikle yüksek standartlara sahip olmakla karıştırılır. Oysa mükemmeliyetçilik, 'Eğer kusursuz olursam, kimse beni eleştiremez ve reddedemez' inancına dayanan bir savunma mekanizmasıdır. Bu tuzak, bizi harekete geçmekten alıkoyar ve sürekli bir yetersizlik hissi yaratır. Kusurlarımızla barışmak, gerçek özgürlüğün ilk adımıdır.",
    published: true,
    tags: ["Mükemmeliyetçilik", "Korku", "Kabul"]
  },
  {
    title: "İçsel Çocuğumuzla Bağ Kurmak",
    excerpt: "Yetişkin tepkilerimizin altında yatan yaralı çocuğu nasıl iyileştirebiliriz?",
    content: "Bir şeye aşırı tepki verdiğinizde, aslında tepki veren yetişkin kimliğiniz değil, geçmişte incinmiş olan içsel çocuğunuzdur. O çocuk, görülmek, duyulmak ve sevilmek ister. Kendi içsel çocuğumuzla şefkatli bir bağ kurmadan, yetişkin ilişkilerimizde sağlıklı sınırlar çizemeyiz. Kendinize, bir zamanlar ihtiyacınız olan o ebeveyn olun.",
    published: true,
    tags: ["İçsel Çocuk", "Şefkat", "İyileşme"]
  },
  {
    title: "Sınır Çizmenin Önemi",
    excerpt: "Hayır diyememek, kendimize olan saygımızı nasıl zedeliyor?",
    content: "Sınırlar, nerede bittiğimizi ve başkalarının nerede başladığını belirler. 'Hayır' diyememek, başkalarının ihtiyaçlarını kendi ihtiyaçlarımızın önüne koymaktır. Bu durum zamanla öfke ve tükenmişlik yaratır. Sağlıklı sınırlar çizmek, bencillik değil, öz saygının bir göstergesidir. Sınırlarınızı koruduğunuzda, ilişkileriniz de daha dürüst ve saygılı hale gelir.",
    published: true,
    tags: ["Sınırlar", "Öz Saygı", "İlişkiler"]
  },
  {
    title: "Anlam Arayışı ve Varoluşsal Boşluk",
    excerpt: "Hayatın anlamı nedir? Bu soruyu sormaktan neden kaçıyoruz?",
    content: "Modern yaşamın hızı, bizi varoluşsal sorulardan uzaklaştırıyor. Ancak bir gün, tüm meşguliyetlerimiz durduğunda, o derin boşluk hissiyle yüzleşiriz: 'Ben neden buradayım?' Hayatın anlamı, keşfedilecek bir şey değil, yaratılacak bir şeydir. Kendi değerlerinizle uyumlu, tutkuyla bağlandığınız bir amaç bulmak, o boşluğu doldurmanın tek yoludur.",
    published: true,
    tags: ["Varoluş", "Anlam", "Felsefe"]
  },
  {
    title: "Duygusal Zeka ve Empati",
    excerpt: "IQ'dan daha önemli olan EQ, ilişkilerimizi ve başarımızı nasıl etkiliyor?",
    content: "Duygusal zeka, kendi duygularımızı tanıma, yönetme ve başkalarının duygularını anlama kapasitemizdir. Empati ise, Çıplak Gösteren Gözlükler'in ta kendisidir. Karşımızdakinin dünyasına onun gözlerinden bakabilmek, çatışmaları çözer ve derin bağlar kurmamızı sağlar. Duygusal zeka, geliştirilebilir bir beceridir ve hayat kalitemizi doğrudan artırır.",
    published: true,
    tags: ["Duygusal Zeka", "Empati", "İletişim"]
  },
  {
    title: "Değişime Direnmek",
    excerpt: "Neden değişmek istiyoruz ama bir türlü harekete geçemiyoruz?",
    content: "Değişim, bilinmeyene adım atmaktır ve zihnimiz bilinmeyenden nefret eder. Mevcut durumumuz ne kadar acı verici olursa olsun, zihin için 'tanıdık' olduğu için güvenlidir. Değişime direncimizi kırmak için, konfor alanımızın aslında bizi nasıl yavaş yavaş çürüttüğünü fark etmeliyiz. Küçük adımlarla, belirsizliğe toleransımızı artırabiliriz.",
    published: true,
    tags: ["Değişim", "Konfor Alanı", "Gelişim"]
  },
  {
    title: "Öz Şefkat: Kendimize Dost Olmak",
    excerpt: "Başkalarına gösterdiğimiz anlayışı neden kendimizden esirgiyoruz?",
    content: "Hata yaptığımızda iç sesimiz genellikle acımasız bir yargıca dönüşür. Oysa aynı hatayı bir dostumuz yapsa, ona şefkatle yaklaşırdık. Öz şefkat, acı çekerken veya başarısız olduğumuzda kendimize nazik ve anlayışlı davranabilmektir. Kendimizi sürekli kırbaçlayarak değil, ancak şefkatle iyileşebilir ve gelişebiliriz.",
    published: true,
    tags: ["Öz Şefkat", "İç Ses", "Kabul"]
  },
  {
    title: "Zamanın İllüzyonu: Anda Kalmak",
    excerpt: "Geçmişin pişmanlıkları ve geleceğin kaygıları arasında bugünü nasıl kaçırıyoruz?",
    content: "Zihnimiz bir zaman makinesi gibidir; sürekli geçmişe veya geleceğe seyahat eder. Ancak hayat, sadece 'şu an'da gerçekleşir. Anda kalmak (mindfulness), yargılamadan dikkatimizi mevcut deneyimimize vermektir. Çıplak Gösteren Gözlükler'i takmak, zihnin illüzyonlarından sıyrılıp, gerçeği olduğu gibi, tam şu anda görebilmektir.",
    published: true,
    tags: ["Mindfulness", "An", "Farkındalık"]
  },
  {
    title: "Kendi Hikayemizin Yazarı Olmak",
    excerpt: "Kurban rolünden çıkıp, hayatımızın sorumluluğunu nasıl alabiliriz?",
    content: "Başımıza gelen olayları her zaman kontrol edemeyiz, ancak onlara vereceğimiz tepkiyi seçebiliriz. Kurban rolünü oynamak, sorumluluktan kaçmanın kolay bir yoludur. 'Benim suçum değil' demek, aynı zamanda 'Benim gücüm yok' demektir. Kendi hikayenizin yazarı olmak, acılarınızı birer öğretmene dönüştürmek ve hayatınızın direksiyonuna geçmektir.",
    published: true,
    tags: ["Sorumluluk", "Güç", "Kişisel Liderlik"]
  }
];

export async function seedBlogPosts(authorId: string) {
  let count = 0;
  for (const post of samplePosts) {
    try {
      await addDoc(collection(db, 'posts'), {
        ...post,
        authorId,
        createdAt: serverTimestamp()
      });
      count++;
    } catch (error) {
      console.error("Error seeding post:", error);
    }
  }
  return count;
}

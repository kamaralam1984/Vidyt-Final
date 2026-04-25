'use client';

import { useState, useEffect } from 'react';
import { useLocale } from '@/context/LocaleContext';

const APK_URL = '/vidyt-app.apk';
const APK_VERSION = '1.0.0';
const APK_SIZE = '3.6 MB';

// ─── Translations per language ────────────────────────────────────────────────
type Lang = {
  badge: string;
  headingApp: string;
  headingSub: string;
  subtext: string;
  downloadBtn: string;
  downloadingBtn: string;
  nonAndroid: string;
  qrTitle: string;
  qrDesc: string;
  stepsHeading: string;
  stepsSpan: string;
  steps: { title: string; desc: string }[];
  featuresHeading: string;
  features: { title: string; desc: string }[];
  ctaTitle: string;
  ctaDesc: string;
};

const TRANSLATIONS: Record<string, Lang> = {
  en: {
    badge: 'Android App Available',
    headingApp: 'Vid YT App',
    headingSub: 'Download Now',
    subtext: 'AI-powered YouTube growth tools on your phone. Use anytime, anywhere.',
    downloadBtn: 'Download APK — Free',
    downloadingBtn: 'Downloading...',
    nonAndroid: 'This APK is for Android phones only. Open this link on your Android browser.',
    qrTitle: 'Want to open directly on your phone?',
    qrDesc: 'Type this URL in your Android phone browser:',
    stepsHeading: 'How to Install?',
    stepsSpan: '3 Steps',
    steps: [
      { title: 'Download APK', desc: 'Tap the "Download APK" button below. The file will download automatically.' },
      { title: 'Allow Unknown Sources', desc: 'Go to Settings → Security → Enable "Install unknown apps" or "Unknown sources".' },
      { title: 'Install', desc: 'Tap the downloaded APK file → Install → Done! App is ready.' },
    ],
    featuresHeading: "What's Inside the App?",
    features: [
      { title: 'AI Title Generator', desc: 'Viral YouTube titles in seconds' },
      { title: 'Hashtag Generator', desc: 'Best trending hashtags instantly' },
      { title: 'Script Writer', desc: 'Complete video scripts with AI' },
      { title: 'Thumbnail Ideas', desc: 'Click-worthy thumbnail concepts' },
      { title: 'Analytics', desc: 'Track your channel growth' },
      { title: 'Content Calendar', desc: 'Schedule posts easily' },
    ],
    ctaTitle: 'Ready? Download Now!',
    ctaDesc: 'Free. No registration. Install directly.',
  },

  hi: {
    badge: 'Android App Available',
    headingApp: 'Vid YT App',
    headingSub: 'Download Karo',
    subtext: 'AI-powered YouTube growth tools ab aapke phone me. Kabhi bhi, kahin bhi use karo.',
    downloadBtn: 'Download APK — Free',
    downloadingBtn: 'Downloading...',
    nonAndroid: 'Ye APK sirf Android phones ke liye hai. Apne Android phone ke browser me yahi link kholo.',
    qrTitle: 'Phone pe seedha kholna chahte ho?',
    qrDesc: 'Apne Android phone ke browser me ye URL type karo:',
    stepsHeading: 'Install Kaise Kare?',
    stepsSpan: '3 Steps',
    steps: [
      { title: 'APK Download Karo', desc: 'Neeche "Download APK" button dabao. File automatically download ho jayegi.' },
      { title: 'Unknown Sources Allow Karo', desc: 'Settings → Security → "Install unknown apps" ya "Unknown sources" ON karo.' },
      { title: 'Install Karo', desc: 'Downloaded APK file tap karo → Install → Done! App ready hai.' },
    ],
    featuresHeading: 'App Me Kya Milega?',
    features: [
      { title: 'AI Title Generator', desc: 'Viral YouTube titles seconds me' },
      { title: 'Hashtag Generator', desc: 'Best trending hashtags instantly' },
      { title: 'Script Writer', desc: 'AI se complete video scripts' },
      { title: 'Thumbnail Ideas', desc: 'Click-worthy thumbnail concepts' },
      { title: 'Analytics', desc: 'Channel growth track karo' },
      { title: 'Content Calendar', desc: 'Posts schedule karo easily' },
    ],
    ctaTitle: 'Ready ho? Download Karo!',
    ctaDesc: 'Free hai. Koi registration nahi. Seedha install karo.',
  },

  es: {
    badge: 'App Android Disponible',
    headingApp: 'App Vid YT',
    headingSub: 'Descargar Ahora',
    subtext: 'Herramientas de crecimiento de YouTube con IA en tu teléfono. Úsalas en cualquier momento y lugar.',
    downloadBtn: 'Descargar APK — Gratis',
    downloadingBtn: 'Descargando...',
    nonAndroid: 'Este APK es solo para teléfonos Android. Abre este enlace en el navegador de tu Android.',
    qrTitle: '¿Quieres abrirlo directamente en tu teléfono?',
    qrDesc: 'Escribe esta URL en el navegador de tu Android:',
    stepsHeading: '¿Cómo Instalar?',
    stepsSpan: '3 Pasos',
    steps: [
      { title: 'Descargar APK', desc: 'Toca el botón "Descargar APK". El archivo se descargará automáticamente.' },
      { title: 'Permitir Fuentes Desconocidas', desc: 'Ve a Ajustes → Seguridad → Activa "Instalar apps desconocidas".' },
      { title: 'Instalar', desc: 'Toca el APK descargado → Instalar → ¡Listo! La app está lista.' },
    ],
    featuresHeading: '¿Qué Hay en la App?',
    features: [
      { title: 'Generador de Títulos IA', desc: 'Títulos virales de YouTube en segundos' },
      { title: 'Generador de Hashtags', desc: 'Los mejores hashtags al instante' },
      { title: 'Escritor de Guiones', desc: 'Guiones completos con IA' },
      { title: 'Ideas de Miniaturas', desc: 'Conceptos de miniaturas llamativos' },
      { title: 'Analíticas', desc: 'Rastrea el crecimiento de tu canal' },
      { title: 'Calendario de Contenido', desc: 'Programa publicaciones fácilmente' },
    ],
    ctaTitle: '¿Listo? ¡Descarga Ahora!',
    ctaDesc: 'Gratis. Sin registro. Instala directamente.',
  },

  pt: {
    badge: 'App Android Disponível',
    headingApp: 'App Vid YT',
    headingSub: 'Baixar Agora',
    subtext: 'Ferramentas de crescimento no YouTube com IA no seu celular. Use a qualquer hora, em qualquer lugar.',
    downloadBtn: 'Baixar APK — Grátis',
    downloadingBtn: 'Baixando...',
    nonAndroid: 'Este APK é apenas para celulares Android. Abra este link no navegador do seu Android.',
    qrTitle: 'Quer abrir diretamente no celular?',
    qrDesc: 'Digite esta URL no navegador do seu Android:',
    stepsHeading: 'Como Instalar?',
    stepsSpan: '3 Passos',
    steps: [
      { title: 'Baixar APK', desc: 'Toque no botão "Baixar APK". O arquivo será baixado automaticamente.' },
      { title: 'Permitir Fontes Desconhecidas', desc: 'Vá em Configurações → Segurança → Ative "Instalar apps desconhecidos".' },
      { title: 'Instalar', desc: 'Toque no APK baixado → Instalar → Pronto! O app está pronto.' },
    ],
    featuresHeading: 'O Que Tem no App?',
    features: [
      { title: 'Gerador de Títulos IA', desc: 'Títulos virais do YouTube em segundos' },
      { title: 'Gerador de Hashtags', desc: 'Melhores hashtags na hora' },
      { title: 'Escritor de Roteiros', desc: 'Roteiros completos com IA' },
      { title: 'Ideias de Miniaturas', desc: 'Conceitos de miniaturas atraentes' },
      { title: 'Análises', desc: 'Acompanhe o crescimento do canal' },
      { title: 'Calendário de Conteúdo', desc: 'Agende publicações facilmente' },
    ],
    ctaTitle: 'Pronto? Baixe Agora!',
    ctaDesc: 'Grátis. Sem cadastro. Instale diretamente.',
  },

  id: {
    badge: 'Aplikasi Android Tersedia',
    headingApp: 'App Vid YT',
    headingSub: 'Unduh Sekarang',
    subtext: 'Alat pertumbuhan YouTube bertenaga AI di ponselmu. Gunakan kapan saja, di mana saja.',
    downloadBtn: 'Unduh APK — Gratis',
    downloadingBtn: 'Mengunduh...',
    nonAndroid: 'APK ini hanya untuk ponsel Android. Buka tautan ini di browser Android kamu.',
    qrTitle: 'Ingin membuka langsung di ponsel?',
    qrDesc: 'Ketik URL ini di browser Android kamu:',
    stepsHeading: 'Cara Install?',
    stepsSpan: '3 Langkah',
    steps: [
      { title: 'Unduh APK', desc: 'Ketuk tombol "Unduh APK". File akan diunduh otomatis.' },
      { title: 'Izinkan Sumber Tidak Dikenal', desc: 'Buka Pengaturan → Keamanan → Aktifkan "Instal aplikasi tidak dikenal".' },
      { title: 'Install', desc: 'Ketuk APK yang diunduh → Instal → Selesai! Aplikasi siap digunakan.' },
    ],
    featuresHeading: 'Apa yang Ada di App?',
    features: [
      { title: 'Generator Judul AI', desc: 'Judul YouTube viral dalam detik' },
      { title: 'Generator Hashtag', desc: 'Hashtag trending terbaik seketika' },
      { title: 'Penulis Skrip', desc: 'Skrip video lengkap dengan AI' },
      { title: 'Ide Thumbnail', desc: 'Konsep thumbnail yang menarik' },
      { title: 'Analitik', desc: 'Lacak pertumbuhan saluranmu' },
      { title: 'Kalender Konten', desc: 'Jadwalkan postingan dengan mudah' },
    ],
    ctaTitle: 'Siap? Unduh Sekarang!',
    ctaDesc: 'Gratis. Tanpa pendaftaran. Install langsung.',
  },

  ar: {
    badge: 'تطبيق أندرويد متاح',
    headingApp: 'تطبيق Vid YT',
    headingSub: 'حمّل الآن',
    subtext: 'أدوات نمو يوتيوب بالذكاء الاصطناعي على هاتفك. استخدمها في أي وقت وأي مكان.',
    downloadBtn: 'تحميل APK — مجاناً',
    downloadingBtn: 'جاري التحميل...',
    nonAndroid: 'هذا الـ APK مخصص لهواتف أندرويد فقط. افتح هذا الرابط في متصفح أندرويد.',
    qrTitle: 'تريد الفتح مباشرة على هاتفك؟',
    qrDesc: 'اكتب هذا الرابط في متصفح أندرويد:',
    stepsHeading: 'كيفية التثبيت؟',
    stepsSpan: '٣ خطوات',
    steps: [
      { title: 'تحميل APK', desc: 'اضغط زر "تحميل APK". سيتم التحميل تلقائياً.' },
      { title: 'السماح بمصادر غير معروفة', desc: 'الإعدادات ← الأمان ← فعّل "تثبيت تطبيقات غير معروفة".' },
      { title: 'التثبيت', desc: 'اضغط على ملف APK ← تثبيت ← تم! التطبيق جاهز.' },
    ],
    featuresHeading: 'ماذا يوجد في التطبيق؟',
    features: [
      { title: 'مولّد عناوين AI', desc: 'عناوين يوتيوب فيروسية في ثوانٍ' },
      { title: 'مولّد هاشتاق', desc: 'أفضل الهاشتاقات الرائجة فوراً' },
      { title: 'كاتب سكريبت', desc: 'سكريبتات فيديو كاملة بالذكاء الاصطناعي' },
      { title: 'أفكار مصغّرات', desc: 'مفاهيم مصغّرات جذابة للنقر' },
      { title: 'تحليلات', desc: 'تتبع نمو قناتك' },
      { title: 'تقويم المحتوى', desc: 'جدوِل منشوراتك بسهولة' },
    ],
    ctaTitle: 'جاهز؟ حمّل الآن!',
    ctaDesc: 'مجاني. بدون تسجيل. ثبّت مباشرة.',
  },

  de: {
    badge: 'Android-App verfügbar',
    headingApp: 'Vid YT App',
    headingSub: 'Jetzt herunterladen',
    subtext: 'KI-gestützte YouTube-Wachstumstools auf deinem Handy. Jederzeit und überall nutzbar.',
    downloadBtn: 'APK herunterladen — Kostenlos',
    downloadingBtn: 'Wird heruntergeladen...',
    nonAndroid: 'Diese APK ist nur für Android-Handys. Öffne diesen Link in deinem Android-Browser.',
    qrTitle: 'Direkt auf dem Handy öffnen?',
    qrDesc: 'Gib diese URL in deinen Android-Browser ein:',
    stepsHeading: 'Wie installieren?',
    stepsSpan: '3 Schritte',
    steps: [
      { title: 'APK herunterladen', desc: 'Tippe auf „APK herunterladen". Die Datei wird automatisch heruntergeladen.' },
      { title: 'Unbekannte Quellen erlauben', desc: 'Einstellungen → Sicherheit → „Apps aus unbekannten Quellen" aktivieren.' },
      { title: 'Installieren', desc: 'Auf die APK tippen → Installieren → Fertig! App ist bereit.' },
    ],
    featuresHeading: 'Was ist in der App?',
    features: [
      { title: 'KI-Titelgenerator', desc: 'Virale YouTube-Titel in Sekunden' },
      { title: 'Hashtag-Generator', desc: 'Beste Trend-Hashtags sofort' },
      { title: 'Skript-Schreiber', desc: 'Vollständige Videoskripte mit KI' },
      { title: 'Thumbnail-Ideen', desc: 'Ansprechende Thumbnail-Konzepte' },
      { title: 'Analysen', desc: 'Kanalwachstum verfolgen' },
      { title: 'Inhaltskalender', desc: 'Beiträge einfach planen' },
    ],
    ctaTitle: 'Bereit? Jetzt herunterladen!',
    ctaDesc: 'Kostenlos. Keine Anmeldung. Direkt installieren.',
  },

  ur: {
    badge: 'اینڈرائیڈ ایپ دستیاب',
    headingApp: 'Vid YT ایپ',
    headingSub: 'ابھی ڈاؤنلوڈ کریں',
    subtext: 'AI سے چلنے والے YouTube گروتھ ٹولز آپ کے فون پر۔ کہیں بھی، کبھی بھی استعمال کریں۔',
    downloadBtn: 'APK ڈاؤنلوڈ کریں — مفت',
    downloadingBtn: 'ڈاؤنلوڈ ہو رہا ہے...',
    nonAndroid: 'یہ APK صرف اینڈرائیڈ فونز کے لیے ہے۔ اپنے اینڈرائیڈ براؤزر میں یہ لنک کھولیں۔',
    qrTitle: 'فون پر براہ راست کھولنا چاہتے ہیں؟',
    qrDesc: 'اپنے اینڈرائیڈ براؤزر میں یہ URL ٹائپ کریں:',
    stepsHeading: 'انسٹال کیسے کریں؟',
    stepsSpan: '3 مراحل',
    steps: [
      { title: 'APK ڈاؤنلوڈ کریں', desc: '"APK ڈاؤنلوڈ" بٹن دبائیں۔ فائل خودبخود ڈاؤنلوڈ ہو جائے گی۔' },
      { title: 'نامعلوم ذرائع کی اجازت دیں', desc: 'ترتیبات ← سیکیورٹی ← "نامعلوم ایپس انسٹال کریں" آن کریں۔' },
      { title: 'انسٹال کریں', desc: 'ڈاؤنلوڈ شدہ APK پر ٹیپ کریں ← انسٹال ← ہو گیا! ایپ تیار ہے۔' },
    ],
    featuresHeading: 'ایپ میں کیا ملے گا؟',
    features: [
      { title: 'AI ٹائٹل جنریٹر', desc: 'سیکنڈوں میں وائرل YouTube ٹائٹلز' },
      { title: 'ہیش ٹیگ جنریٹر', desc: 'بہترین ٹرینڈنگ ہیش ٹیگز فوری' },
      { title: 'اسکرپٹ رائٹر', desc: 'AI سے مکمل ویڈیو اسکرپٹ' },
      { title: 'تھمب نیل آئیڈیاز', desc: 'کلک کرنے والے تھمب نیل' },
      { title: 'اینالیٹکس', desc: 'چینل گروتھ ٹریک کریں' },
      { title: 'کنٹینٹ کیلنڈر', desc: 'پوسٹس آسانی سے شیڈول کریں' },
    ],
    ctaTitle: 'تیار ہیں؟ ابھی ڈاؤنلوڈ کریں!',
    ctaDesc: 'مفت۔ کوئی رجسٹریشن نہیں۔ براہ راست انسٹال کریں۔',
  },

  fr: {
    badge: 'Application Android Disponible',
    headingApp: 'App Vid YT',
    headingSub: 'Télécharger Maintenant',
    subtext: "Outils de croissance YouTube propulsés par l'IA sur votre téléphone. Utilisez-les n'importe où.",
    downloadBtn: 'Télécharger APK — Gratuit',
    downloadingBtn: 'Téléchargement...',
    nonAndroid: "Cet APK est uniquement pour les téléphones Android. Ouvrez ce lien dans votre navigateur Android.",
    qrTitle: 'Voulez-vous ouvrir directement sur votre téléphone ?',
    qrDesc: 'Tapez cette URL dans votre navigateur Android :',
    stepsHeading: 'Comment Installer ?',
    stepsSpan: '3 Étapes',
    steps: [
      { title: 'Télécharger APK', desc: 'Appuyez sur le bouton "Télécharger APK". Le fichier se téléchargera automatiquement.' },
      { title: 'Autoriser Sources Inconnues', desc: 'Paramètres → Sécurité → Activez "Installer des applications inconnues".' },
      { title: 'Installer', desc: "Appuyez sur l'APK téléchargé → Installer → C'est fait ! L'app est prête." },
    ],
    featuresHeading: "Qu'y a-t-il dans l'App ?",
    features: [
      { title: 'Générateur de Titres IA', desc: 'Titres viraux YouTube en secondes' },
      { title: 'Générateur de Hashtags', desc: 'Meilleurs hashtags tendance instantanément' },
      { title: 'Rédacteur de Scripts', desc: 'Scripts vidéo complets avec IA' },
      { title: 'Idées de Miniatures', desc: 'Concepts de miniatures accrocheurs' },
      { title: 'Analytiques', desc: 'Suivez la croissance de votre chaîne' },
      { title: 'Calendrier de Contenu', desc: 'Planifiez vos publications facilement' },
    ],
    ctaTitle: 'Prêt ? Téléchargez Maintenant !',
    ctaDesc: 'Gratuit. Sans inscription. Installez directement.',
  },
};

// ─── Country → language mapping ───────────────────────────────────────────────
const COUNTRY_LANG: Record<string, string> = {
  // Hindi
  IN: 'hi',
  // Spanish
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es', PE: 'es',
  VE: 'es', EC: 'es', GT: 'es', CU: 'es', BO: 'es', DO: 'es',
  HN: 'es', PY: 'es', SV: 'es', NI: 'es', CR: 'es', PA: 'es', UY: 'es',
  // Portuguese
  BR: 'pt', PT: 'pt',
  // Indonesian / Malay
  ID: 'id', MY: 'id',
  // Arabic
  SA: 'ar', AE: 'ar', EG: 'ar', KW: 'ar', QA: 'ar', BH: 'ar',
  OM: 'ar', JO: 'ar', LB: 'ar', IQ: 'ar', DZ: 'ar', MA: 'ar', TN: 'ar',
  // French
  FR: 'fr', BE: 'fr', CH: 'fr', CA: 'fr', SN: 'fr', CI: 'fr', CM: 'fr',
  // English (default for everything else)
};

const ICONS = ['🎯', '🏷️', '📝', '🖼️', '📊', '📅'];

function getCookie(name: string): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : '';
}

export default function DownloadClient() {
  const [downloading, setDownloading] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  const { locale } = useLocale();

  useEffect(() => {
    setIsAndroid(/android/i.test(navigator.userAgent));
  }, []);

  // LocaleProvider auto-detects country from cookie on mount.
  // If user changes locale from navbar, that takes priority.
  const lang = TRANSLATIONS[locale?.lang ?? ''] || TRANSLATIONS.en;

  const handleDownload = () => {
    setDownloading(true);
    const a = document.createElement('a');
    a.href = APK_URL;
    a.download = 'VidYT.apk';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => setDownloading(false), 3000);
  };

  const isRTL = lang === TRANSLATIONS.ar;

  return (
    <main className="pt-24 pb-16 px-4" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* Hero */}
      <section className="max-w-4xl mx-auto text-center mt-10 mb-16">
        <div className="inline-flex items-center gap-2 bg-[#FF0000]/10 border border-[#FF0000]/30 rounded-full px-4 py-1.5 text-sm text-[#FF0000] mb-6">
          <span className="w-2 h-2 rounded-full bg-[#FF0000] animate-pulse" />
          {lang.badge}
        </div>

        <h1 className="text-4xl md:text-6xl font-bold mb-5 leading-tight">
          <span className="text-[#FF0000]">{lang.headingApp}</span><br />
          <span className="text-[#888]">{lang.headingSub}</span>
        </h1>

        <p className="text-[#888] text-lg mb-10 max-w-xl mx-auto">
          {lang.subtext}
        </p>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center gap-3 bg-[#FF0000] hover:bg-[#cc0000] disabled:bg-[#cc0000] text-white font-bold text-lg px-10 py-4 rounded-2xl transition-all duration-200 shadow-lg shadow-[#FF0000]/20 hover:scale-105 active:scale-95 disabled:scale-100"
        >
          {downloading ? (
            <>
              <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              {lang.downloadingBtn}
            </>
          ) : (
            <>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
              </svg>
              {lang.downloadBtn}
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-6 mt-5 text-sm text-[#555]">
          <span>v{APK_VERSION}</span>
          <span>•</span>
          <span>{APK_SIZE}</span>
          <span>•</span>
          <span>Android 6.0+</span>
          <span>•</span>
          <span>Free</span>
        </div>

        {/* Non-Android Warning */}
        {!isAndroid && (
          <p className="mt-4 text-xs text-[#666] bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2 inline-block">
            {lang.nonAndroid}
          </p>
        )}
      </section>

      {/* URL hint */}
      <section className="max-w-4xl mx-auto mb-16">
        <div className="bg-[#141414] border border-[#222] rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div className="flex-shrink-0 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
            <svg className="w-12 h-12 text-[#FF0000]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg mb-1">{lang.qrTitle}</h3>
            <p className="text-[#666] text-sm mb-3">{lang.qrDesc}</p>
            <code className="bg-[#0F0F0F] border border-[#333] text-[#FF0000] px-4 py-2 rounded-lg text-sm font-mono">
              vidyt.com/download
            </code>
          </div>
        </div>
      </section>

      {/* Install Steps */}
      <section className="max-w-4xl mx-auto mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">
          {lang.stepsHeading} <span className="text-[#FF0000]">{lang.stepsSpan}</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {lang.steps.map((step, i) => (
            <div key={i} className="bg-[#141414] border border-[#222] hover:border-[#FF0000]/30 rounded-2xl p-6 transition-colors">
              <div className="text-4xl font-black text-[#FF0000]/20 mb-3">0{i + 1}</div>
              <h3 className="font-semibold text-white mb-2">{step.title}</h3>
              <p className="text-[#666] text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">
          {lang.featuresHeading}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {lang.features.map((f, i) => (
            <div key={i} className="bg-[#141414] border border-[#222] rounded-xl p-4 flex items-start gap-3">
              <span className="text-2xl">{ICONS[i]}</span>
              <div>
                <p className="text-white font-medium text-sm">{f.title}</p>
                <p className="text-[#666] text-xs mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-2xl mx-auto text-center">
        <div className="bg-gradient-to-br from-[#FF0000]/10 to-transparent border border-[#FF0000]/20 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-3">{lang.ctaTitle}</h2>
          <p className="text-[#666] mb-6 text-sm">{lang.ctaDesc}</p>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 bg-[#FF0000] hover:bg-[#cc0000] text-white font-bold px-8 py-3 rounded-xl transition-all hover:scale-105 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
            {downloading ? lang.downloadingBtn : lang.downloadBtn}
          </button>
        </div>
      </section>
    </main>
  );
}

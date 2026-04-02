import { useLocale, type LanguageCode } from './LocaleContext';

type TranslationKey =
  | 'navbar.features'
  | 'navbar.freeAiTools'
  | 'navbar.coaching'
  | 'navbar.resources'
  | 'navbar.extension'
  | 'navbar.pricing'
  | 'navbar.signIn'
  | 'navbar.getStarted'
  | 'hero.title.main'
  | 'hero.title.highlight'
  | 'hero.subtitle'
  | 'hero.cta.primary'
  | 'hero.cta.secondary'
  | 'features.heading'
  | 'features.headingHighlight'
  | 'features.subheading'
  | 'pricing.heading'
  | 'pricing.headingHighlight'
  | 'pricing.subheading'
  | 'cta.heading'
  | 'cta.subheading'
  | 'cta.button'
  | 'home.feature.ai.title'
  | 'home.feature.ai.desc'
  | 'home.feature.trends.title'
  | 'home.feature.trends.desc'
  | 'home.feature.analytics.title'
  | 'home.feature.analytics.desc'
  | 'home.feature.scheduling.title'
  | 'home.feature.scheduling.desc'
  | 'home.feature.competitors.title'
  | 'home.feature.competitors.desc'
  | 'home.feature.security.title'
  | 'home.feature.security.desc'
  | 'pricing.toggle.monthly'
  | 'pricing.toggle.yearly'
  | 'pricing.plan.free.name'
  | 'pricing.plan.pro.name'
  | 'pricing.plan.enterprise.name'
  | 'pricing.plan.free.f1'
  | 'pricing.plan.free.f2'
  | 'pricing.plan.free.f3'
  | 'pricing.plan.free.f4'
  | 'pricing.plan.free.f5'
  | 'pricing.plan.free.f6'
  | 'pricing.plan.pro.f1'
  | 'pricing.plan.pro.f2'
  | 'pricing.plan.pro.f3'
  | 'pricing.plan.pro.f4'
  | 'pricing.plan.pro.f5'
  | 'pricing.plan.pro.f6'
  | 'pricing.plan.pro.f7'
  | 'pricing.plan.pro.f8'
  | 'pricing.plan.pro.f9'
  | 'pricing.plan.enterprise.f1'
  | 'pricing.plan.enterprise.f2'
  | 'pricing.plan.enterprise.f3'
  | 'pricing.plan.enterprise.f4'
  | 'pricing.plan.enterprise.f5'
  | 'pricing.plan.enterprise.f6'
  | 'pricing.plan.enterprise.f7'
  | 'pricing.plan.enterprise.f8'
  | 'pricing.plan.enterprise.f9'
  | 'pricing.plan.enterprise.f10'
  | 'pricing.mostPopular'
  | 'pricing.limitedOffer'
  | 'pricing.validTill'
  | 'pricing.getStarted'
  | 'pricing.viewAllPlans'
  | 'home.coaching.title'
  | 'home.coaching.subtitle'
  | 'home.resources.title'
  | 'home.resources.subtitle'
  | 'home.extension.title'
  | 'home.extension.subtitle'
  | 'home.extension.cta';

type TranslationTable = Record<LanguageCode, Partial<Record<TranslationKey, string>>>;

const TRANSLATIONS: TranslationTable = {
  en: {
    'navbar.features': 'Features',
    'navbar.freeAiTools': 'Free AI Tools',
    'navbar.coaching': 'Coaching',
    'navbar.resources': 'Resources',
    'navbar.extension': 'Browser Extension',
    'navbar.pricing': 'Pricing',
    'navbar.signIn': 'Sign In',
    'navbar.getStarted': 'Get Started Free',
    'hero.title.main': 'Make Your Videos',
    'hero.title.highlight': 'Go Viral',
    'hero.subtitle':
      'AI-powered platform to analyze, optimize, and predict viral potential of your social media videos',
    'hero.cta.primary': 'Start Free Trial',
    'hero.cta.secondary': 'Watch Demo',
    'features.heading': 'Powerful Features for',
    'features.headingHighlight': 'Content Creators',
    'features.subheading':
      'Everything you need to create viral content and grow your audience',
    'pricing.heading': 'Simple, Transparent',
    'pricing.headingHighlight': 'Pricing',
    'pricing.subheading': 'Choose the plan that fits your needs',
    'cta.heading': 'Ready to Go Viral?',
    'cta.subheading':
      'Join thousands of creators using AI to maximize their reach',
    'cta.button': 'Start Free Trial',
    'home.feature.ai.title': 'AI-Powered Predictions',
    'home.feature.ai.desc': 'Advanced ML models for accurate viral potential',
    'home.feature.trends.title': 'Real-Time Trends',
    'home.feature.trends.desc': 'Stay ahead with trending topics and hashtags',
    'home.feature.analytics.title': 'Advanced Analytics',
    'home.feature.analytics.desc': 'Deep insights into your content performance',
    'home.feature.scheduling.title': 'Smart Scheduling',
    'home.feature.scheduling.desc': 'Optimal posting times for maximum engagement',
    'home.feature.competitors.title': 'Competitor Analysis',
    'home.feature.competitors.desc': 'Learn from top-performing creators',
    'home.feature.security.title': 'Secure & Private',
    'home.feature.security.desc': 'Your data is always protected',
    'pricing.toggle.monthly': 'Monthly',
    'pricing.toggle.yearly': 'Yearly',
    'pricing.plan.free.name': 'Free',
    'pricing.plan.pro.name': 'Pro',
    'pricing.plan.enterprise.name': 'Enterprise',
    'pricing.plan.free.f1': '5 video analyses per month',
    'pricing.plan.free.f2': 'Basic viral score prediction',
    'pricing.plan.free.f3': 'Thumbnail analysis',
    'pricing.plan.free.f4': 'Title optimization (3 suggestions)',
    'pricing.plan.free.f5': 'Hashtag generator (10 hashtags)',
    'pricing.plan.free.f6': 'Community support',
    'pricing.plan.pro.f1': 'Unlimited video analyses',
    'pricing.plan.pro.f2': 'Advanced AI viral prediction',
    'pricing.plan.pro.f3': 'Real-time trend analysis',
    'pricing.plan.pro.f4': 'Title optimization (10 suggestions)',
    'pricing.plan.pro.f5': 'Hashtag generator (20 hashtags)',
    'pricing.plan.pro.f6': 'Best posting time predictions',
    'pricing.plan.pro.f7': 'Competitor analysis',
    'pricing.plan.pro.f8': 'Email support',
    'pricing.plan.pro.f9': 'Priority processing',
    'pricing.plan.enterprise.f1': 'Everything in Pro',
    'pricing.plan.enterprise.f2': 'Team collaboration (up to 10 users)',
    'pricing.plan.enterprise.f3': 'White-label reports',
    'pricing.plan.enterprise.f4': 'API access',
    'pricing.plan.enterprise.f5': 'Custom AI model training',
    'pricing.plan.enterprise.f6': 'Dedicated account manager',
    'pricing.plan.enterprise.f7': '24/7 priority support',
    'pricing.plan.enterprise.f8': 'Advanced analytics dashboard',
    'pricing.plan.enterprise.f9': 'Bulk video processing',
    'pricing.plan.enterprise.f10': 'Custom integrations',
    'pricing.mostPopular': 'Most Popular',
    'pricing.limitedOffer': 'Limited time offer',
    'pricing.validTill': 'Valid till',
    'pricing.getStarted': 'Get Started',
    'pricing.viewAllPlans': 'View All Plans',
    'home.coaching.title': 'AI Growth Coaching',
    'home.coaching.subtitle': 'Personalized advice to scale your channel with AI-powered insights.',
    'home.resources.title': 'Creator Resources',
    'home.resources.subtitle': 'Master YouTube SEO with our exclusive playbooks and guides.',
    'home.extension.title': 'Vid YT Browser Extension',
    'home.extension.subtitle': 'Optimise your videos directly on YouTube. Coming soon to Chrome Web Store.',
    'home.extension.cta': 'Join the Waitlist',
  },
  hi: {
    'navbar.features': 'फ़ीचर्स',
    'navbar.freeAiTools': 'फ्री AI टूल्स',
    'navbar.coaching': 'कोचिंग',
    'navbar.resources': 'रिसोर्सेज़',
    'navbar.extension': 'ब्राउज़र एक्सटेंशन',
    'navbar.pricing': 'प्राइसिंग',
    'navbar.signIn': 'साइन इन',
    'navbar.getStarted': 'फ्री शुरू करें',
    'hero.title.main': 'अपने वीडियो को',
    'hero.title.highlight': 'वायरल बनाएं',
    'hero.subtitle':
      'AI की मदद से अपने सोशल मीडिया वीडियो का विश्लेषण, ऑप्टिमाइज़ और वायरल पोटेंशियल प्रेडिक्ट करें',
    'hero.cta.primary': 'फ्री ट्रायल शुरू करें',
    'hero.cta.secondary': 'डेमो देखें',
    'features.heading': 'क्रिएटर्स के लिए',
    'features.headingHighlight': 'पावरफुल फीचर्स',
    'features.subheading':
      'ऐसे सारे टूल्स जो आपको वायरल कंटेंट बनाने और ऑडियंस बढ़ाने में मदद करें',
    'pricing.heading': 'सिंपल और ट्रांसपेरेंट',
    'pricing.headingHighlight': 'प्राइसिंग',
    'pricing.subheading': 'अपनी ज़रूरत के हिसाब से प्लान चुनें',
    'cta.heading': 'वायरल जाने के लिए तैयार हैं?',
    'cta.subheading':
      'हज़ारों क्रिएटर्स की तरह आप भी AI से अपनी रीच मैक्सिमाइज़ करें',
    'cta.button': 'फ्री ट्रायल शुरू करें',
    'home.feature.ai.title': 'AI-पावर्ड प्रेडिक्शन्स',
    'home.feature.ai.desc': 'सटीक वायरल पोटेंशियल के लिए एडवांस ML मॉडल्स',
    'home.feature.trends.title': 'रीयल-टाइम ट्रेंड्स',
    'home.feature.trends.desc': 'ट्रेंडिंग टॉपिक्स और हैशटैग्स से हमेशा आगे रहें',
    'home.feature.analytics.title': 'एडवांस्ड एनालिटिक्स',
    'home.feature.analytics.desc': 'आपके कंटेंट पर डीप इनसाइट्स और डेटा',
    'home.feature.scheduling.title': 'स्मार्ट शेड्यूलिंग',
    'home.feature.scheduling.desc': 'मैक्सिमम एंगेजमेंट के लिए बेस्ट पोस्टिंग टाइम्स',
    'home.feature.competitors.title': 'कम्पेटिटर एनालिसिस',
    'home.feature.competitors.desc': 'टॉप परफॉर्मिंग क्रिएटर्स से सीखें',
    'home.feature.security.title': 'सिक्योर और प्राइवेट',
    'home.feature.security.desc': 'आपका डेटा हमेशा सुरक्षित रहता है',
    'pricing.toggle.monthly': 'मंथली',
    'pricing.toggle.yearly': 'इयरली',
    'pricing.plan.free.name': 'फ्री',
    'pricing.plan.pro.name': 'प्रो',
    'pricing.plan.enterprise.name': 'एंटरप्राइज़',
    'pricing.plan.free.f1': 'हर महीने 5 वीडियो एनालिसिस',
    'pricing.plan.free.f2': 'बेसिक वायरल स्कोर प्रेडिक्शन',
    'pricing.plan.free.f3': 'थम्बनेल एनालिसिस',
    'pricing.plan.free.f4': 'टाइटल ऑप्टिमाइज़ेशन (3 सुझाव)',
    'pricing.plan.free.f5': 'हैशटैग जेनरेटर (10 हैशटैग)',
    'pricing.plan.free.f6': 'कम्युनिटी सपोर्ट',
    'pricing.plan.pro.f1': 'अनलिमिटेड वीडियो एनालिसिस',
    'pricing.plan.pro.f2': 'एडवांस्ड AI वायरल प्रेडिक्शन',
    'pricing.plan.pro.f3': 'रीयल-टाइम ट्रेंड एनालिसिस',
    'pricing.plan.pro.f4': 'टाइटल ऑप्टिमाइज़ेशन (10 सुझाव)',
    'pricing.plan.pro.f5': 'हैशटैग जेनरेटर (20 हैशटैग)',
    'pricing.plan.pro.f6': 'बेस्ट पोस्टिंग टाइम प्रेडिक्शंस',
    'pricing.plan.pro.f7': 'कम्पेटिटर एनालिसिस',
    'pricing.plan.pro.f8': 'ईमेल सपोर्ट',
    'pricing.plan.pro.f9': 'प्रायोरिटी प्रोसेसिंग',
    'pricing.plan.enterprise.f1': 'प्रो में मिलने वाले सभी फीचर्स',
    'pricing.plan.enterprise.f2': 'टीम कोलैबोरेशन (10 यूज़र्स तक)',
    'pricing.plan.enterprise.f3': 'व्हाइट-लेबल रिपोर्ट्स',
    'pricing.plan.enterprise.f4': 'API एक्सेस',
    'pricing.plan.enterprise.f5': 'कस्टम AI मॉडल ट्रेनिंग',
    'pricing.plan.enterprise.f6': 'डेडिकेटेड अकाउंट मैनेजर',
    'pricing.plan.enterprise.f7': '24/7 प्रायोरिटी सपोर्ट',
    'pricing.plan.enterprise.f8': 'एडवांस्ड एनालिटिक्स डैशबोर्ड',
    'pricing.plan.enterprise.f9': 'बल्क वीडियो प्रोसेसिंग',
    'pricing.plan.enterprise.f10': 'कस्टम इंटीग्रेशंस',
    'pricing.mostPopular': 'सबसे पॉपुलर',
    'pricing.limitedOffer': 'लिमिटेड टाइम ऑफर',
    'pricing.validTill': 'तक वैध',
    'pricing.getStarted': 'शुरू करें',
    'pricing.viewAllPlans': 'सभी प्लान देखें',
    'home.coaching.title': 'AI ग्रोथ कोचिंग',
    'home.coaching.subtitle': 'AI-पावर्ड इनसाइट्स के साथ अपने चैनल को स्केल करने के लिए पर्सनल सलाह।',
    'home.resources.title': 'क्रिएटर रिसोर्सेज़',
    'home.resources.subtitle': 'हमारे एक्सक्लूसिव प्लेबुक्स और गाइड्स के साथ YouTube SEO में महारत हासिल करें।',
    'home.extension.title': 'Vid YT ब्राउज़र एक्सटेंशन',
    'home.extension.subtitle': 'सीधे YouTube पर अपने वीडियो ऑप्टिमाइज़ करें। जल्द ही Chrome वेब स्टोर पर आ रहा है।',
    'home.extension.cta': 'वेटलिस्ट जॉइन करें',
  },
  hinglish: {
    'navbar.features': 'Features',
    'navbar.freeAiTools': 'Free AI Tools',
    'navbar.coaching': 'Coaching',
    'navbar.resources': 'Resources',
    'navbar.extension': 'Browser Extension',
    'navbar.pricing': 'Pricing',
    'navbar.signIn': 'Sign In',
    'navbar.getStarted': 'Free mein shuru karein',
    'hero.title.main': 'Apne videos ko',
    'hero.title.highlight': 'viral banao',
    'hero.subtitle':
      'AI ke through apne social media videos ko analyse, optimize aur unka viral potential predict karo',
    'hero.cta.primary': 'Free trial shuru karo',
    'hero.cta.secondary': 'Demo dekho',
    'features.heading': 'Creators ke liye',
    'features.headingHighlight': 'powerful features',
    'features.subheading':
      'Saare tools jo aapko viral content banane aur audience grow karne me help karein',
    'pricing.heading': 'Simple aur transparent',
    'pricing.headingHighlight': 'pricing',
    'pricing.subheading': 'Jo plan aapke kaam ka ho woh choose karo',
    'cta.heading': 'Viral jaane ke liye ready ho?',
    'cta.subheading':
      'Hazaaron creators ki tarah aap bhi AI se apni reach maximize karo',
    'cta.button': 'Free trial shuru karo',
    'home.feature.ai.title': 'AI-powered predictions',
    'home.feature.ai.desc': 'Advanced ML models jo viral potential ko sahi tarah predict karein',
    'home.feature.trends.title': 'Real-time trends',
    'home.feature.trends.desc': 'Trending topics aur hashtags ke saath hamesha aage raho',
    'home.feature.analytics.title': 'Advanced analytics',
    'home.feature.analytics.desc': 'Content performance par deep insights milein',
    'home.feature.scheduling.title': 'Smart scheduling',
    'home.feature.scheduling.desc': 'Maximum engagement ke liye best posting times',
    'home.feature.competitors.title': 'Competitor analysis',
    'home.feature.competitors.desc': 'Top performing creators se seekho',
    'home.feature.security.title': 'Secure & private',
    'home.feature.security.desc': 'Aapka data hamesha protected rehta hai',
    'pricing.toggle.monthly': 'Monthly',
    'pricing.toggle.yearly': 'Yearly',
    'pricing.plan.free.name': 'Free',
    'pricing.plan.pro.name': 'Pro',
    'pricing.plan.enterprise.name': 'Enterprise',
    'pricing.plan.free.f1': 'Mahine me 5 video analysis',
    'pricing.plan.free.f2': 'Basic viral score prediction',
    'pricing.plan.free.f3': 'Thumbnail analysis',
    'pricing.plan.free.f4': 'Title optimization (3 suggestions)',
    'pricing.plan.free.f5': 'Hashtag generator (10 hashtags)',
    'pricing.plan.free.f6': 'Community support',
    'pricing.plan.pro.f1': 'Unlimited video analyses',
    'pricing.plan.pro.f2': 'Advanced AI viral prediction',
    'pricing.plan.pro.f3': 'Real-time trend analysis',
    'pricing.plan.pro.f4': 'Title optimization (10 suggestions)',
    'pricing.plan.pro.f5': 'Hashtag generator (20 hashtags)',
    'pricing.plan.pro.f6': 'Best posting time predictions',
    'pricing.plan.pro.f7': 'Competitor analysis',
    'pricing.plan.pro.f8': 'Email support',
    'pricing.plan.pro.f9': 'Priority processing',
    'pricing.plan.enterprise.f1': 'Pro ke saare features',
    'pricing.plan.enterprise.f2': 'Team collaboration (10 users tak)',
    'pricing.plan.enterprise.f3': 'White-label reports',
    'pricing.plan.enterprise.f4': 'API access',
    'pricing.plan.enterprise.f5': 'Custom AI model training',
    'pricing.plan.enterprise.f6': 'Dedicated account manager',
    'pricing.plan.enterprise.f7': '24/7 priority support',
    'pricing.plan.enterprise.f8': 'Advanced analytics dashboard',
    'pricing.plan.enterprise.f9': 'Bulk video processing',
    'pricing.plan.enterprise.f10': 'Custom integrations',
    'pricing.mostPopular': 'Most popular',
    'pricing.limitedOffer': 'Limited time offer',
    'pricing.validTill': 'Valid till',
    'pricing.getStarted': 'Get started',
    'pricing.viewAllPlans': 'View all plans',
    'home.coaching.title': 'AI Growth Coaching',
    'home.coaching.subtitle': 'Personalized advice to scale your channel with AI-powered insights.',
    'home.resources.title': 'Creator Resources',
    'home.resources.subtitle': 'Master YouTube SEO with our exclusive playbooks and guides.',
    'home.extension.title': 'Vid YT Browser Extension',
    'home.extension.subtitle': 'Optimise your videos directly on YouTube. Coming soon to Chrome Web Store.',
    'home.extension.cta': 'Waitlist join karein',
  },
  es: {
    'navbar.features': 'Funciones',
    'navbar.freeAiTools': 'Herramientas IA Gratis',
    'navbar.coaching': 'Coaching',
    'navbar.resources': 'Recursos',
    'navbar.extension': 'Extensión de navegador',
    'navbar.pricing': 'Precios',
    'navbar.signIn': 'Iniciar sesión',
    'navbar.getStarted': 'Comenzar gratis',
    'hero.title.main': 'Haz que tus vídeos',
    'hero.title.highlight': 'se vuelvan virales',
    'hero.subtitle':
      'Plataforma con IA para analizar, optimizar y predecir el potencial viral de tus vídeos en redes sociales',
    'hero.cta.primary': 'Empieza prueba gratis',
    'hero.cta.secondary': 'Ver demo',
    'features.heading': 'Potentes funciones para',
    'features.headingHighlight': 'creadores de contenido',
    'features.subheading':
      'Todo lo que necesitas para crear contenido viral y hacer crecer tu audiencia',
    'pricing.heading': 'Precios',
    'pricing.headingHighlight': 'claros y simples',
    'pricing.subheading': 'Elige el plan que mejor se adapte a ti',
    'cta.heading': '¿Listo para hacerte viral?',
    'cta.subheading':
      'Únete a miles de creadores que usan IA para maximizar su alcance',
    'cta.button': 'Empieza prueba gratis',
    'home.feature.ai.title': 'Predicciones con IA',
    'home.feature.ai.desc':
      'Modelos avanzados de ML para predecir con precisión el potencial viral',
    'home.feature.trends.title': 'Tendencias en tiempo real',
    'home.feature.trends.desc':
      'Mantente al día con los temas y hashtags que están en tendencia',
    'home.feature.analytics.title': 'Analíticas avanzadas',
    'home.feature.analytics.desc':
      'Información profunda sobre el rendimiento de tu contenido',
    'home.feature.scheduling.title': 'Programación inteligente',
    'home.feature.scheduling.desc':
      'Mejores horarios de publicación para maximizar el engagement',
    'home.feature.competitors.title': 'Análisis de competidores',
    'home.feature.competitors.desc':
      'Aprende de los creadores con mejor rendimiento',
    'home.feature.security.title': 'Seguro y privado',
    'home.feature.security.desc': 'Tus datos siempre están protegidos',
    'pricing.toggle.monthly': 'Mensual',
    'pricing.toggle.yearly': 'Anual',
    'pricing.plan.free.name': 'Gratis',
    'pricing.plan.pro.name': 'Pro',
    'pricing.plan.enterprise.name': 'Empresarial',
    'pricing.plan.free.f1': '5 análisis de vídeo al mes',
    'pricing.plan.free.f2': 'Predicción básica de viralidad',
    'pricing.plan.free.f3': 'Análisis de miniaturas',
    'pricing.plan.free.f4': 'Optimización de títulos (3 sugerencias)',
    'pricing.plan.free.f5': 'Generador de hashtags (10 hashtags)',
    'pricing.plan.free.f6': 'Soporte de la comunidad',
    'pricing.plan.pro.f1': 'Análisis de vídeo ilimitados',
    'pricing.plan.pro.f2': 'Predicción avanzada de viralidad con IA',
    'pricing.plan.pro.f3': 'Análisis de tendencias en tiempo real',
    'pricing.plan.pro.f4': 'Optimización de títulos (10 sugerencias)',
    'pricing.plan.pro.f5': 'Generador de hashtags (20 hashtags)',
    'pricing.plan.pro.f6': 'Predicciones de mejores horas de publicación',
    'pricing.plan.pro.f7': 'Análisis de competidores',
    'pricing.plan.pro.f8': 'Soporte por correo electrónico',
    'pricing.plan.pro.f9': 'Procesamiento prioritario',
    'pricing.plan.enterprise.f1': 'Todo lo incluido en Pro',
    'pricing.plan.enterprise.f2': 'Colaboración en equipo (hasta 10 usuarios)',
    'pricing.plan.enterprise.f3': 'Informes con marca blanca',
    'pricing.plan.enterprise.f4': 'Acceso a la API',
    'pricing.plan.enterprise.f5': 'Entrenamiento de modelos de IA personalizados',
    'pricing.plan.enterprise.f6': 'Gestor de cuentas dedicado',
    'pricing.plan.enterprise.f7': 'Soporte prioritario 24/7',
    'pricing.plan.enterprise.f8': 'Panel de analíticas avanzadas',
    'pricing.plan.enterprise.f9': 'Procesamiento de vídeos en lote',
    'pricing.plan.enterprise.f10': 'Integraciones personalizadas',
    'pricing.mostPopular': 'Más popular',
    'pricing.limitedOffer': 'Oferta por tiempo limitado',
    'pricing.validTill': 'Válido hasta',
    'pricing.getStarted': 'Comenzar',
    'pricing.viewAllPlans': 'Ver todos los planes',
  },
  ar: {
    'navbar.features': 'المميزات',
    'navbar.freeAiTools': 'أدوات ذكاء اصطناعي مجانية',
    'navbar.coaching': 'التدريب',
    'navbar.resources': 'الموارد',
    'navbar.extension': 'إضافة المتصفح',
    'navbar.pricing': 'الأسعار',
    'navbar.signIn': 'تسجيل الدخول',
    'navbar.getStarted': 'ابدأ مجانًا',
    'hero.title.main': 'اجعل فيديوهاتك',
    'hero.title.highlight': 'تنتشر بسرعة',
    'hero.subtitle':
      'منصة مدعومة بالذكاء الاصطناعي لتحليل وتحسين وتوقع قابلية الانتشار لفيديوهاتك على وسائل التواصل الاجتماعي',
    'hero.cta.primary': 'ابدأ النسخة التجريبية المجانية',
    'hero.cta.secondary': 'شاهد العرض',
    'features.heading': 'مميزات قوية لـ',
    'features.headingHighlight': 'صنّاع المحتوى',
    'features.subheading':
      'كل ما تحتاجه لصناعة محتوى ينتشر بسرعة ونمو جمهورك',
    'pricing.heading': 'أسعار',
    'pricing.headingHighlight': 'واضحة وبسيطة',
    'pricing.subheading': 'اختر الخطة المناسبة لاحتياجاتك',
    'cta.heading': 'جاهز لتصبح فيديوهاتك virals؟',
    'cta.subheading':
      'انضم إلى الآلاف من صناع المحتوى الذين يستخدمون الذكاء الاصطناعي لزيادة الوصول',
    'cta.button': 'ابدأ النسخة التجريبية المجانية',
    'home.feature.ai.title': 'توقعات مدعومة بالذكاء الاصطناعي',
    'home.feature.ai.desc':
      'نماذج تعلم آلي متقدمة لتوقع دقيق لإمكانية الانتشار',
    'home.feature.trends.title': 'الترندات في الوقت الفعلي',
    'home.feature.trends.desc':
      'ابقَ متقدمًا مع المواضيع والهاشتاجات الرائجة',
    'home.feature.analytics.title': 'تحليلات متقدمة',
    'home.feature.analytics.desc': 'تحليل عميق لأداء المحتوى الخاص بك',
    'home.feature.scheduling.title': 'جدولة ذكية',
    'home.feature.scheduling.desc':
      'أوقات نشر مثالية لأقصى تفاعل مع الجمهور',
    'home.feature.competitors.title': 'تحليل المنافسين',
    'home.feature.competitors.desc':
      'تعلّم من أفضل صناع المحتوى أداءً',
    'home.feature.security.title': 'آمن وخصوصي',
    'home.feature.security.desc': 'بياناتك محفوظة ومحمية دائمًا',
  },
  id: {
    'navbar.features': 'Fitur',
    'navbar.freeAiTools': 'Alat AI Gratis',
    'navbar.coaching': 'Coaching',
    'navbar.resources': 'Sumber daya',
    'navbar.extension': 'Ekstensi browser',
    'navbar.pricing': 'Harga',
    'navbar.signIn': 'Masuk',
    'navbar.getStarted': 'Mulai gratis',
    'hero.title.main': 'Buat video kamu',
    'hero.title.highlight': 'jadi viral',
    'hero.subtitle':
      'Platform bertenaga AI untuk menganalisis, mengoptimalkan, dan memprediksi potensi viral video media sosial kamu',
    'hero.cta.primary': 'Mulai uji coba gratis',
    'hero.cta.secondary': 'Lihat demo',
    'features.heading': 'Fitur kuat untuk',
    'features.headingHighlight': 'pembuat konten',
    'features.subheading':
      'Semua yang kamu butuhkan untuk membuat konten viral dan menumbuhkan audiens',
    'pricing.heading': 'Harga',
    'pricing.headingHighlight': 'sederhana & jujur',
    'pricing.subheading': 'Pilih paket yang paling cocok untukmu',
    'cta.heading': 'Siap untuk jadi viral?',
    'cta.subheading':
      'Bergabung dengan ribuan kreator yang memakai AI untuk memaksimalkan jangkauan',
    'cta.button': 'Mulai uji coba gratis',
    'home.feature.ai.title': 'Prediksi berbasis AI',
    'home.feature.ai.desc':
      'Model ML tingkat lanjut untuk memprediksi potensi viral dengan akurat',
    'home.feature.trends.title': 'Tren real-time',
    'home.feature.trends.desc':
      'Selalu update dengan topik dan hashtag yang sedang tren',
    'home.feature.analytics.title': 'Analitik lanjutan',
    'home.feature.analytics.desc':
      'Insight mendalam tentang performa konten kamu',
    'home.feature.scheduling.title': 'Penjadwalan pintar',
    'home.feature.scheduling.desc':
      'Waktu posting terbaik untuk engagement maksimum',
    'home.feature.competitors.title': 'Analisis kompetitor',
    'home.feature.competitors.desc':
      'Belajar dari kreator dengan performa terbaik',
    'home.feature.security.title': 'Aman & pribadi',
    'home.feature.security.desc': 'Data kamu selalu terlindungi',
  },
  ur: {
    'navbar.features': 'فیچرز',
    'navbar.freeAiTools': 'مفت اے آئی ٹولز',
    'navbar.coaching': 'کوچنگ',
    'navbar.resources': 'ریسورسز',
    'navbar.extension': 'براؤزر ایکسٹینشن',
    'navbar.pricing': 'پرائسنگ',
    'navbar.signIn': 'سائن اِن',
    'navbar.getStarted': 'مفت میں شروع کریں',
    'hero.title.main': 'اپنی ویڈیوز کو',
    'hero.title.highlight': 'وائرل بنائیں',
    'hero.subtitle':
      'اے آئی کی مدد سے اپنے سوشل میڈیا ویڈیوز کا اینالیسس، آپٹمائزیشن اور وائرل پوٹینشل کا اندازہ لگائیں',
    'hero.cta.primary': 'مفت ٹرائل شروع کریں',
    'hero.cta.secondary': 'ڈیمو دیکھیں',
    'features.heading': 'کریئیٹرز کے لیے',
    'features.headingHighlight': 'طاقتور فیچرز',
    'features.subheading':
      'وہ سب ٹولز جو آپ کو وائرل کانٹینٹ بنانے اور آڈیئنس بڑھانے میں مدد دیں',
    'pricing.heading': 'سادہ اور واضح',
    'pricing.headingHighlight': 'پرائسنگ',
    'pricing.subheading': 'اپنی ضرورت کے مطابق پلان منتخب کریں',
    'cta.heading': 'وائرل جانے کے لیے تیار ہیں؟',
    'cta.subheading':
      'ہزاروں کریئیٹرز کی طرح آپ بھی اے آئی سے اپنی ریچ میکسیمائز کریں',
    'cta.button': 'مفت ٹرائل شروع کریں',
    'home.feature.ai.title': 'AI پاورڈ پریڈکشنز',
    'home.feature.ai.desc':
      'ایڈوانسڈ مشین لرننگ ماڈلز جو وائرل پوٹینشل کو درست انداز میں جانچیں',
    'home.feature.trends.title': 'ریئل ٹائم ٹرینڈز',
    'home.feature.trends.desc':
      'ٹرینڈنگ ٹاپکس اور ہیش ٹیگز کے ساتھ ہمیشہ ایک قدم آگے رہیں',
    'home.feature.analytics.title': 'ایڈوانسڈ اینالٹکس',
    'home.feature.analytics.desc':
      'آپ کے کانٹینٹ کی کارکردگی پر گہری جھلک اور ڈیٹا',
    'home.feature.scheduling.title': 'سمارٹ شیڈولنگ',
    'home.feature.scheduling.desc':
      'زیادہ سے زیادہ انگیجمنٹ کے لیے بہترین پوسٹنگ ٹائمز',
    'home.feature.competitors.title': 'کمپیٹیٹر اینالیسس',
    'home.feature.competitors.desc':
      'ٹاپ پرفارمنگ کریئیٹرز سے سیکھیں اور آگے بڑھیں',
    'home.feature.security.title': 'سکیور اور پرائیویٹ',
    'home.feature.security.desc': 'آپ کا ڈیٹا ہمیشہ محفوظ اور محفوظ رہتا ہے',
    'pricing.toggle.monthly': 'ماہانہ',
    'pricing.toggle.yearly': 'سالانہ',
    'pricing.plan.free.name': 'فری',
    'pricing.plan.pro.name': 'پرو',
    'pricing.plan.enterprise.name': 'انٹرپرائز',
    'pricing.plan.free.f1': 'ہر ماہ 5 ویڈیو اینالیسز',
    'pricing.plan.free.f2': 'بیسک وائرل اسکور پریڈکشن',
    'pricing.plan.free.f3': 'تھمب نیل اینالیسز',
    'pricing.plan.free.f4': 'ٹائٹل آپٹیمائزیشن (3 سجیشنز)',
    'pricing.plan.free.f5': 'ہیش ٹیگ جنریٹر (10 ہیش ٹیگز)',
    'pricing.plan.free.f6': 'کمیونٹی سپورٹ',
    'pricing.plan.pro.f1': 'ان لمیٹڈ ویڈیو اینالیسز',
    'pricing.plan.pro.f2': 'ایڈوانسڈ اے آئی وائرل پریڈکشن',
    'pricing.plan.pro.f3': 'ریئل ٹائم ٹرینڈ اینالیسز',
    'pricing.plan.pro.f4': 'ٹائٹل آپٹیمائزیشن (10 سجیشنز)',
    'pricing.plan.pro.f5': 'ہیش ٹیگ جنریٹر (20 ہیش ٹیگز)',
    'pricing.plan.pro.f6': 'بہترین پوسٹنگ ٹائم پریڈکشنز',
    'pricing.plan.pro.f7': 'کمپیٹیٹر اینالیسس',
    'pricing.plan.pro.f8': 'ای میل سپورٹ',
    'pricing.plan.pro.f9': 'پریارٹی پروسیسنگ',
    'pricing.plan.enterprise.f1': 'پرو پلان کی ساری فیچرز',
    'pricing.plan.enterprise.f2': 'ٹیم کولیبوریشن (10 یوزرز تک)',
    'pricing.plan.enterprise.f3': 'وائٹ لیبل رپورٹس',
    'pricing.plan.enterprise.f4': 'API ایکسیس',
    'pricing.plan.enterprise.f5': 'کسٹم اے آئی ماڈل ٹریننگ',
    'pricing.plan.enterprise.f6': 'ڈیڈیکیٹڈ اکاؤنٹ مینیجر',
    'pricing.plan.enterprise.f7': '24/7 پریارٹی سپورٹ',
    'pricing.plan.enterprise.f8': 'ایڈوانسڈ اینالٹکس ڈیش بورڈ',
    'pricing.plan.enterprise.f9': 'بلک ویڈیو پروسیسنگ',
    'pricing.plan.enterprise.f10': 'کسٹم انٹیگریشنز',
    'pricing.mostPopular': 'سب سے زیادہ مقبول',
    'pricing.limitedOffer': 'محدود مدت کی آفر',
    'pricing.validTill': 'تاریخ تک معتبر',
    'pricing.getStarted': 'شروع کریں',
    'pricing.viewAllPlans': 'تمام پلانز دیکھیں',
  },
};

export function useTranslations() {
  const { locale } = useLocale();
  const lang: LanguageCode = locale.language ?? 'en';

  const t = (key: TranslationKey): string => {
    const table = TRANSLATIONS[lang] || TRANSLATIONS.en;
    return (table[key] ?? TRANSLATIONS.en[key]) as string;
  };

  return { t };
}


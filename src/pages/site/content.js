// All website copy in one place. Edit freely; keep the same keys in both languages.
// Contact details marked TODO need your real values before launch.

export const CONTACT = {
  email: 'hello@wappflow.com',     // TODO: your sales email
  whatsapp: '96500000000',         // TODO: your WhatsApp number, digits only (used by "Talk to sales")
};

const en = {
  dir: 'ltr',
  switchTo: 'العربية',
  nav: { product: 'Product', solutions: 'Solutions', pricing: 'Pricing', faq: 'FAQ', login: 'Log in', trial: 'Start free trial', dashboard: 'Open dashboard' },
  hero: {
    title: 'Every customer conversation, answered on WhatsApp.',
    body: 'WappFlow gives your team one shared WhatsApp inbox, broadcast campaigns, a no-code chatbot and automatic order updates. In Arabic and English.',
    primary: 'Start free trial',
    secondary: 'Talk to sales',
    note: (days) => `${days}-day free trial · No credit card · Cancel anytime`,
  },
  phone: {
    business: 'Qahwa House',
    status: 'Business account',
    script: [
      { from: 'in', text: 'Hi 👋' },
      { from: 'out', text: 'Welcome to Qahwa House ☕ How can we help you today?', buttons: ['Order status', "Today's offers", 'Talk to a person'] },
      { from: 'in', text: 'Order status', tap: 0 },
      { from: 'out', text: 'Sure! Please send your order number.' },
      { from: 'in', text: '1042' },
      { from: 'out', text: 'Order #1042 is out for delivery 🚚 It should reach you in about 20 minutes.' },
      { from: 'in', text: 'Thank you!' },
    ],
    chips: ['Chatbot replied instantly', 'No agent needed'],
  },
  facts: [
    { title: 'Official WhatsApp Business Platform', body: 'Built on the Cloud API from Meta. No risky unofficial bridges.' },
    { title: 'Arabic and English', body: 'Right-to-left messages, Arabic keywords and templates.' },
    { title: 'Pay with KNET or card', body: 'Local pricing in KWD with monthly or yearly plans.' },
    { title: 'Connects to your store', body: 'Shopify, WooCommerce and a REST API for anything else.' },
  ],
  solutions: {
    title: 'One platform for every team that talks to customers',
    tabs: [
      {
        key: 'marketing', label: 'Marketing',
        heading: 'Campaigns people actually open',
        body: 'Send approved WhatsApp templates to the right group of customers and see who received, read and replied.',
        points: ['Target by tags like VIP, city or last purchase', 'Personalise with names and custom fields', 'Schedule for the best time, pause any time', 'Opt-outs handled automatically'],
        chat: [{ from: 'out', text: 'Hi Fatima, enjoy 20% off all perfumes this weekend 🌸', buttons: ['Shop now', 'Not interested'] }, { from: 'in', text: 'Shop now' }],
      },
      {
        key: 'sales', label: 'Sales',
        heading: 'Qualify leads while you sleep',
        body: 'A chatbot asks the right questions, saves the answers to the contact and hands hot leads to a salesperson.',
        points: ['Collect name, budget and area automatically', 'Route leads to the least busy salesperson', 'Send catalogues, price lists and locations', 'Follow up with templates after 24 hours'],
        chat: [{ from: 'out', text: 'Which area are you looking in?', buttons: ['Salmiya', 'Hawalli', 'Other'] }, { from: 'in', text: 'Salmiya' }, { from: 'out', text: 'Great, connecting you with Ahmad from our sales team.' }],
      },
      {
        key: 'support', label: 'Support',
        heading: 'Your whole team on one number',
        body: 'Every agent works from the same WhatsApp number with assignment, internal notes and quick replies.',
        points: ['Assign chats manually or automatically', 'Private notes your customer never sees', 'Quick replies by typing "/"', 'See the 24-hour reply window at a glance'],
        chat: [{ from: 'in', text: 'My order arrived damaged 😞' }, { from: 'out', text: "So sorry about that! I've arranged a replacement for today." }, { from: 'in', text: 'Thank you, great service 🙏' }],
      },
      {
        key: 'commerce', label: 'E-commerce',
        heading: 'Order updates customers wait for',
        body: 'Connect your store once. Confirmations, payment receipts and shipping updates go out on WhatsApp by themselves.',
        points: ['Shopify and WooCommerce in minutes', 'Order placed, paid, shipped and delivered messages', 'Carts from your WhatsApp catalogue become orders', 'Every order linked to the customer chat'],
        chat: [{ from: 'out', text: 'Thank you Reem! Your order A-1042 for 24.500 KWD is confirmed.' }, { from: 'out', text: 'Good news, order A-1042 is on its way 🚚' }],
      },
    ],
  },
  features: {
    title: 'Everything you need to run WhatsApp as a business channel',
    items: [
      { img: 'inbox', title: 'Shared team inbox', body: 'All WhatsApp chats in one place. Assign conversations, leave notes for colleagues, reply with saved answers and never miss the 24-hour window.', points: ['Live updates for the whole team', 'Agent and chatbot hand-over', 'Customer profile, tags and orders beside the chat'] },
      { img: 'campaign', title: 'Broadcast campaigns with real results', body: 'Pick an approved template, choose who should get it, and watch sent, delivered, read and replied numbers update live.', points: ['Audience by tags with exclusions', 'Personalised variables per customer', 'Per-recipient delivery report'] },
      { img: 'flow', title: 'Chatbot builder, no code', body: 'Drag steps onto a canvas: buttons, lists, questions, conditions, tags and a hand-over to your team. Start it with keywords in Arabic or English.', points: ['Answers routine questions 24/7', 'Saves answers to the customer profile', 'Calls your own system when needed'] },
      { img: 'commerce', title: 'Orders and automatic updates', body: 'Orders from your store, your API or WhatsApp carts land in one list, and every status change can send the right template.', points: ['Shopify, WooCommerce and REST API', 'Product catalogue', 'Signed webhooks to your systems'] },
    ],
  },
  industries: {
    title: 'Made for businesses that live on WhatsApp',
    items: [
      { icon: 'cart', title: 'Retail and online shops', body: 'Order confirmations, back-in-stock alerts and weekend offers.' },
      { icon: 'receipt', title: 'Restaurants and cafés', body: 'Menus, delivery status and reservation reminders.' },
      { icon: 'sparkle', title: 'Salons and clinics', body: 'Booking requests, reminders and follow-ups.' },
      { icon: 'building', title: 'Real estate', body: 'Lead questions, property lists and viewing appointments.' },
      { icon: 'file', title: 'Education and training', body: 'Registrations, schedules and parent updates.' },
      { icon: 'zap', title: 'Delivery and services', body: 'Driver updates, ETAs and customer feedback.' },
    ],
  },
  steps: {
    title: 'Live on WhatsApp in an afternoon',
    items: [
      { title: 'Create your workspace', body: 'Sign up and invite your team. Your trial starts right away.' },
      { title: 'Connect your number', body: 'Link your WhatsApp Business number. We guide you through the Meta setup.' },
      { title: 'Turn on what you need', body: 'Import contacts, switch on the welcome chatbot and send your first campaign.' },
    ],
  },
  integrations: {
    title: 'Works with the tools you already use',
    body: 'Connect your store in minutes or plug WappFlow into your own system with the REST API and signed webhooks.',
    items: ['Shopify', 'WooCommerce', 'REST API', 'Webhooks', 'KNET', 'Visa / Mastercard', 'Apple Pay', 'CSV import'],
    code: 'Send a template from your system',
  },
  pricing: {
    title: 'Simple plans in Kuwaiti dinar',
    body: 'Start with a free trial. Upgrade, downgrade or cancel whenever you like.',
    monthly: 'Monthly', yearly: 'Yearly', yearlyNote: '2 months free',
    perMonth: '/ month', perYear: '/ year',
    recommended: 'Recommended',
    cta: 'Start free trial',
    unlimited: 'Unlimited',
    limits: { contacts: 'contacts', monthly_messages: 'messages / month', agents: 'team members', numbers: 'WhatsApp numbers', flows: 'live chatbots' },
    features: { campaigns: 'Broadcast campaigns', inbox: 'Shared team inbox', flows: 'Chatbot builder', commerce: 'Store orders and automations', api: 'API and webhooks' },
    metaNote: 'WhatsApp conversation fees are charged by Meta directly to your WhatsApp Business account and are not included in plan prices.',
  },
  faq: {
    title: 'Questions businesses ask us',
    items: [
      { q: 'Is WappFlow an official WhatsApp solution?', a: 'Yes. WappFlow uses the WhatsApp Business Platform (Cloud API) provided by Meta, the same official API large brands use. Your number is not at risk the way it is with unofficial tools that copy WhatsApp Web.' },
      { q: 'Can I keep my current WhatsApp number?', a: "Yes, you can move your existing business number to the WhatsApp Business Platform. Note that a number used on the platform can't be used in the WhatsApp Business app at the same time. We help you through the switch." },
      { q: 'Do I pay Meta separately?', a: 'Yes. Meta charges a small fee for template conversations (marketing, utility and authentication messages) directly to your WhatsApp Business account. Replies inside 24 hours of a customer message are free. Your WappFlow plan covers the software.' },
      { q: 'Does it work in Arabic?', a: 'Fully. Customers can write in Arabic, chatbots can trigger on Arabic keywords, templates can be in Arabic and messages display right-to-left.' },
      { q: 'How many people on my team can use it?', a: 'It depends on your plan. Each team member gets their own login, and conversations can be assigned to specific people.' },
      { q: 'What happens after the free trial?', a: 'Choose a plan and pay by KNET, card or bank transfer. If you do nothing, your workspace pauses and your data stays safe until you decide.' },
    ],
  },
  cta: { title: 'Ready to answer every customer on WhatsApp?', body: 'Set up WappFlow today and send your first campaign this week.', primary: 'Start free trial', secondary: 'Talk to sales' },
  footer: {
    tagline: 'The WhatsApp Business platform for growing teams in the Gulf.',
    product: 'Product', company: 'Company', legal: 'Legal',
    links: { inbox: 'Team inbox', campaigns: 'Campaigns', chatbots: 'Chatbots', commerce: 'Commerce', pricing: 'Pricing', contact: 'Contact us', login: 'Log in', terms: 'Terms of service', privacy: 'Privacy policy' },
    rights: 'All rights reserved.',
    meta: 'WhatsApp is a trademark of Meta Platforms, Inc. WappFlow is an independent product.',
  },
};

const ar = {
  dir: 'rtl',
  switchTo: 'English',
  nav: { product: 'المنتج', solutions: 'الحلول', pricing: 'الأسعار', faq: 'الأسئلة الشائعة', login: 'تسجيل الدخول', trial: 'ابدأ تجربتك المجانية', dashboard: 'لوحة التحكم' },
  hero: {
    title: 'كل محادثة مع عملائك، يتم الرد عليها في واتساب.',
    body: 'يمنح WappFlow فريقك صندوق وارد مشترك لواتساب، وحملات جماعية، وروبوت محادثة بدون برمجة، وتحديثات تلقائية للطلبات. بالعربية والإنجليزية.',
    primary: 'ابدأ تجربتك المجانية',
    secondary: 'تواصل مع المبيعات',
    note: (days) => `تجربة مجانية ${days} يوماً · بدون بطاقة · إلغاء في أي وقت`,
  },
  phone: {
    business: 'بيت القهوة',
    status: 'حساب أعمال',
    script: [
      { from: 'in', text: 'مرحبا 👋' },
      { from: 'out', text: 'أهلاً بك في بيت القهوة ☕ كيف نقدر نساعدك اليوم؟', buttons: ['حالة الطلب', 'عروض اليوم', 'التحدث مع موظف'] },
      { from: 'in', text: 'حالة الطلب', tap: 0 },
      { from: 'out', text: 'أكيد! أرسل لنا رقم الطلب من فضلك.' },
      { from: 'in', text: '1042' },
      { from: 'out', text: 'طلبك رقم 1042 في الطريق إليك 🚚 يوصلك خلال ٢٠ دقيقة تقريباً.' },
      { from: 'in', text: 'شكراً لكم!' },
    ],
    chips: ['رد الروبوت فوراً', 'بدون تدخل موظف'],
  },
  facts: [
    { title: 'منصة واتساب للأعمال الرسمية', body: 'مبني على Cloud API من Meta، بدون حلول غير رسمية تعرّض رقمك للحظر.' },
    { title: 'عربي وإنجليزي', body: 'رسائل من اليمين لليسار، وكلمات مفتاحية وقوالب بالعربية.' },
    { title: 'ادفع بالكي نت أو البطاقة', body: 'أسعار محلية بالدينار الكويتي، شهرية أو سنوية.' },
    { title: 'يرتبط بمتجرك', body: 'Shopify وWooCommerce وواجهة برمجية لأي نظام آخر.' },
  ],
  solutions: {
    title: 'منصة واحدة لكل فريق يتواصل مع العملاء',
    tabs: [
      {
        key: 'marketing', label: 'التسويق',
        heading: 'حملات يفتحها عملاؤك فعلاً',
        body: 'أرسل قوالب واتساب المعتمدة للفئة المناسبة من عملائك، وتابع من استلم وقرأ ورد.',
        points: ['استهداف حسب الوسوم مثل VIP أو المنطقة أو آخر شراء', 'تخصيص الرسالة بالاسم والحقول الخاصة', 'جدولة في أفضل وقت وإيقاف في أي لحظة', 'إلغاء الاشتراك يُدار تلقائياً'],
        chat: [{ from: 'out', text: 'مرحباً فاطمة، خصم ٢٠٪ على جميع العطور هذا الأسبوع 🌸', buttons: ['تسوّق الآن', 'غير مهتم'] }, { from: 'in', text: 'تسوّق الآن' }],
      },
      {
        key: 'sales', label: 'المبيعات',
        heading: 'تأهيل العملاء المحتملين حتى وأنت نائم',
        body: 'روبوت المحادثة يسأل الأسئلة الصحيحة، ويحفظ الإجابات في ملف العميل، ويحوّل العملاء الجادين لفريق المبيعات.',
        points: ['جمع الاسم والميزانية والمنطقة تلقائياً', 'توزيع العملاء على الموظف الأقل انشغالاً', 'إرسال الكتالوجات والأسعار والمواقع', 'المتابعة بالقوالب بعد ٢٤ ساعة'],
        chat: [{ from: 'out', text: 'في أي منطقة تبحث؟', buttons: ['السالمية', 'حولي', 'أخرى'] }, { from: 'in', text: 'السالمية' }, { from: 'out', text: 'ممتاز، نحوّلك الآن إلى أحمد من فريق المبيعات.' }],
      },
      {
        key: 'support', label: 'خدمة العملاء',
        heading: 'فريقك كامل على رقم واحد',
        body: 'كل الموظفين يعملون من نفس رقم واتساب مع توزيع المحادثات والملاحظات الداخلية والردود السريعة.',
        points: ['توزيع المحادثات يدوياً أو تلقائياً', 'ملاحظات داخلية لا يراها العميل', 'ردود سريعة بكتابة "/"', 'نافذة الـ ٢٤ ساعة واضحة أمامك'],
        chat: [{ from: 'in', text: 'وصلني الطلب متضرر 😞' }, { from: 'out', text: 'نعتذر جداً! رتبنا لك طلب بديل يوصلك اليوم.' }, { from: 'in', text: 'شكراً، خدمة ممتازة 🙏' }],
      },
      {
        key: 'commerce', label: 'التجارة الإلكترونية',
        heading: 'تحديثات الطلبات التي ينتظرها عملاؤك',
        body: 'اربط متجرك مرة واحدة، وتُرسل رسائل تأكيد الطلب والدفع والشحن على واتساب تلقائياً.',
        points: ['ربط Shopify وWooCommerce خلال دقائق', 'رسائل الطلب والدفع والشحن والتسليم', 'سلال كتالوج واتساب تتحول إلى طلبات', 'كل طلب مرتبط بمحادثة العميل'],
        chat: [{ from: 'out', text: 'شكراً ريم! تم تأكيد طلبك A-1042 بقيمة 24.500 د.ك.' }, { from: 'out', text: 'خبر سعيد، طلبك A-1042 في الطريق إليك 🚚' }],
      },
    ],
  },
  features: {
    title: 'كل ما تحتاجه لإدارة واتساب كقناة أعمال',
    items: [
      { img: 'inbox', title: 'صندوق وارد مشترك للفريق', body: 'كل محادثات واتساب في مكان واحد. وزّع المحادثات، واترك ملاحظات لزملائك، ورد بإجابات محفوظة، ولا تفوّت نافذة الـ ٢٤ ساعة.', points: ['تحديثات مباشرة لكل الفريق', 'تسليم المحادثة بين الروبوت والموظف', 'ملف العميل والوسوم والطلبات بجانب المحادثة'] },
      { img: 'campaign', title: 'حملات جماعية بنتائج حقيقية', body: 'اختر قالباً معتمداً، وحدد من يستلمه، وتابع أعداد الإرسال والتسليم والقراءة والرد مباشرة.', points: ['استهداف بالوسوم مع الاستثناءات', 'متغيرات مخصصة لكل عميل', 'تقرير تسليم لكل مستلم'] },
      { img: 'flow', title: 'منشئ روبوت المحادثة بدون برمجة', body: 'اسحب الخطوات إلى اللوحة: أزرار، قوائم، أسئلة، شروط، وسوم، وتحويل لفريقك. شغّله بكلمات مفتاحية بالعربية أو الإنجليزية.', points: ['يرد على الأسئلة المتكررة على مدار الساعة', 'يحفظ الإجابات في ملف العميل', 'يتصل بنظامك الخاص عند الحاجة'] },
      { img: 'commerce', title: 'الطلبات والتحديثات التلقائية', body: 'الطلبات من متجرك أو نظامك أو سلال واتساب في قائمة واحدة، وكل تغيير في الحالة يرسل القالب المناسب.', points: ['Shopify وWooCommerce وواجهة REST', 'كتالوج المنتجات', 'Webhooks موقّعة إلى أنظمتك'] },
    ],
  },
  industries: {
    title: 'مصمم للأعمال التي تعتمد على واتساب',
    items: [
      { icon: 'cart', title: 'المتاجر والبيع أونلاين', body: 'تأكيد الطلبات، وتنبيهات توفر المنتجات، وعروض نهاية الأسبوع.' },
      { icon: 'receipt', title: 'المطاعم والمقاهي', body: 'القوائم، وحالة التوصيل، وتذكير الحجوزات.' },
      { icon: 'sparkle', title: 'الصالونات والعيادات', body: 'طلبات الحجز، والتذكير بالمواعيد، والمتابعة.' },
      { icon: 'building', title: 'العقارات', body: 'أسئلة العملاء، وقوائم العقارات، ومواعيد المعاينة.' },
      { icon: 'file', title: 'التعليم والتدريب', body: 'التسجيل، والجداول، وتحديثات أولياء الأمور.' },
      { icon: 'zap', title: 'التوصيل والخدمات', body: 'تحديثات السائقين، ووقت الوصول، وتقييم العملاء.' },
    ],
  },
  steps: {
    title: 'جاهز على واتساب خلال ساعات',
    items: [
      { title: 'أنشئ مساحة العمل', body: 'سجّل وادعُ فريقك، وتبدأ تجربتك فوراً.' },
      { title: 'اربط رقمك', body: 'اربط رقم واتساب للأعمال، ونرشدك خطوة بخطوة في إعداد Meta.' },
      { title: 'فعّل ما تحتاجه', body: 'استورد جهات الاتصال، وشغّل روبوت الترحيب، وأرسل أول حملة.' },
    ],
  },
  integrations: {
    title: 'يعمل مع الأدوات التي تستخدمها',
    body: 'اربط متجرك خلال دقائق، أو اربط WappFlow بنظامك عبر الواجهة البرمجية وWebhooks الموقّعة.',
    items: ['Shopify', 'WooCommerce', 'REST API', 'Webhooks', 'KNET', 'Visa / Mastercard', 'Apple Pay', 'استيراد CSV'],
    code: 'أرسل قالباً من نظامك',
  },
  pricing: {
    title: 'باقات واضحة بالدينار الكويتي',
    body: 'ابدأ بتجربة مجانية، ورقِّ أو خفّض أو ألغِ باقتك متى شئت.',
    monthly: 'شهري', yearly: 'سنوي', yearlyNote: 'شهران مجاناً',
    perMonth: '/ شهرياً', perYear: '/ سنوياً',
    recommended: 'الأنسب',
    cta: 'ابدأ تجربتك المجانية',
    unlimited: 'غير محدود',
    limits: { contacts: 'جهة اتصال', monthly_messages: 'رسالة شهرياً', agents: 'أعضاء الفريق', numbers: 'أرقام واتساب', flows: 'روبوتات نشطة' },
    features: { campaigns: 'الحملات الجماعية', inbox: 'صندوق الوارد المشترك', flows: 'منشئ روبوت المحادثة', commerce: 'طلبات المتجر والأتمتة', api: 'الواجهة البرمجية وWebhooks' },
    metaNote: 'رسوم محادثات واتساب تفرضها Meta مباشرة على حساب واتساب للأعمال الخاص بك، ولا تشملها أسعار الباقات.',
  },
  faq: {
    title: 'أسئلة يطرحها علينا أصحاب الأعمال',
    items: [
      { q: 'هل WappFlow حل رسمي لواتساب؟', a: 'نعم. يعتمد WappFlow على منصة واتساب للأعمال (Cloud API) من Meta، وهي نفس الواجهة الرسمية التي تستخدمها العلامات التجارية الكبرى. رقمك ليس معرضاً للحظر كما في الأدوات غير الرسمية التي تقلّد واتساب ويب.' },
      { q: 'هل أستطيع الاحتفاظ برقمي الحالي؟', a: 'نعم، يمكن نقل رقم أعمالك الحالي إلى منصة واتساب للأعمال. لاحظ أن الرقم المستخدم على المنصة لا يمكن استخدامه في تطبيق واتساب للأعمال في نفس الوقت، ونساعدك في عملية النقل.' },
      { q: 'هل أدفع لـ Meta بشكل منفصل؟', a: 'نعم. تفرض Meta رسوماً بسيطة على محادثات القوالب (التسويق والخدمات والتحقق) مباشرة على حساب واتساب للأعمال الخاص بك. الردود خلال ٢٤ ساعة من رسالة العميل مجانية. باقة WappFlow تغطي البرنامج.' },
      { q: 'هل يدعم اللغة العربية؟', a: 'بالكامل. يمكن لعملائك الكتابة بالعربية، ويمكن تشغيل الروبوت بكلمات عربية، وإنشاء قوالب عربية، وتظهر الرسائل من اليمين لليسار.' },
      { q: 'كم شخصاً من فريقي يمكنه الاستخدام؟', a: 'حسب باقتك. لكل عضو حساب دخول خاص، ويمكن توزيع المحادثات على أشخاص محددين.' },
      { q: 'ماذا يحدث بعد انتهاء التجربة المجانية؟', a: 'اختر باقة وادفع بالكي نت أو البطاقة أو التحويل البنكي. إذا لم تفعل شيئاً، تتوقف مساحة العمل مؤقتاً وتبقى بياناتك محفوظة حتى تقرر.' },
    ],
  },
  cta: { title: 'جاهز للرد على كل عملائك في واتساب؟', body: 'جهّز WappFlow اليوم وأرسل أول حملة هذا الأسبوع.', primary: 'ابدأ تجربتك المجانية', secondary: 'تواصل مع المبيعات' },
  footer: {
    tagline: 'منصة واتساب للأعمال للفرق المتنامية في الخليج.',
    product: 'المنتج', company: 'الشركة', legal: 'قانوني',
    links: { inbox: 'صندوق الوارد', campaigns: 'الحملات', chatbots: 'روبوت المحادثة', commerce: 'التجارة', pricing: 'الأسعار', contact: 'تواصل معنا', login: 'تسجيل الدخول', terms: 'شروط الخدمة', privacy: 'سياسة الخصوصية' },
    rights: 'جميع الحقوق محفوظة.',
    meta: 'واتساب علامة تجارية مملوكة لشركة Meta Platforms, Inc. و WappFlow منتج مستقل.',
  },
};

export const CONTENT = { en, ar };

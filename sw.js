// ملف خدمة بسيط لتفعيل متطلبات تثبيت الـ PWA
self.addEventListener('install', (e) => {
    console.log('[Service Worker] Install');
});

self.addEventListener('fetch', (e) => {
    // يمكن هنا إضافة تخزين كاش مستقبلاً
});
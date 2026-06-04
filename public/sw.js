// This is a minimal service worker required for PWA installation.
self.addEventListener('install', (e) => {
    console.log('[Service Worker] Installed');
});

self.addEventListener('fetch', (e) => {
    // Allow the browser to handle all fetches normally
});

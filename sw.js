// 立即注销旧版本 Service Worker，清除所有缓存
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key))))
  )
  self.clients.claim()
})

// 不缓存任何内容，全部走网络
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request))
})
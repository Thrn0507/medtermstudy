import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// 注册 Service Worker (PWA) - 先用强制更新清除旧缓存
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    // 先注销所有旧 SW
    const registrations = await navigator.serviceWorker.getRegistrations()
    for (const reg of registrations) {
      await reg.unregister()
    }
    // 重新注册
    navigator.serviceWorker.register('/sw.js?v=3').then(
      (registration) => {
        console.log('SW registered:', registration.scope);
      },
      (err) => {
        console.log('SW registration failed:', err);
      }
    );
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

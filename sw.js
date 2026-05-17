const CACHE = 'waterlog-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      if (list.length > 0) return list[0].focus();
      return clients.openWindow('/');
    })
  );
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SCHEDULE_REMINDER') scheduleReminder(e.data.time);
  if (e.data && e.data.type === 'CANCEL_REMINDER') clearReminder();
});

let reminderTimer = null;

function clearReminder() {
  if (reminderTimer) { clearTimeout(reminderTimer); reminderTimer = null; }
}

function scheduleReminder(timeStr) {
  clearReminder();
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  const delay = target.getTime() - now.getTime();
  reminderTimer = setTimeout(() => {
    self.registration.showNotification('💧 WaterLog', {
      body: "Time to drink some water! Stay on your streak.",
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'waterlog-reminder',
      renotify: true
    });
    scheduleReminder(timeStr);
  }, delay);
}

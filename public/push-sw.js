// Push notification service worker
const PUSH_ICON = '/pwa-icon-192-v4.png';

const DEFAULT_PUSH_NOTIFICATION = {
  title: 'PAFC',
  body: 'Open the app to view your latest notification.',
  url: '/hub?tab=notifications',
  tag: 'pafc-notification',
};

function readPushPayload(event) {
  if (!event.data) {
    return DEFAULT_PUSH_NOTIFICATION;
  }

  try {
    const data = event.data.json();
    return {
      title: (data.title || DEFAULT_PUSH_NOTIFICATION.title).trim(),
      body: (data.message || data.body || DEFAULT_PUSH_NOTIFICATION.body).trim(),
      url: (data.link || data.url || DEFAULT_PUSH_NOTIFICATION.url).trim(),
      tag: (data.tag || DEFAULT_PUSH_NOTIFICATION.tag).trim(),
    };
  } catch (error) {
    try {
      const text = event.data.text();
      return {
        ...DEFAULT_PUSH_NOTIFICATION,
        body: text?.trim() || DEFAULT_PUSH_NOTIFICATION.body,
      };
    } catch {
      return DEFAULT_PUSH_NOTIFICATION;
    }
  }
}

self.addEventListener('push', (event) => {
  const notification = readPushPayload(event);

  event.waitUntil((async () => {
    try {
      await self.registration.showNotification(notification.title, {
        body: notification.body,
        icon: PUSH_ICON,
        badge: PUSH_ICON,
        tag: notification.tag,
        data: {
          url: notification.url,
        },
        vibrate: [100, 50, 100],
        renotify: true,
      });
    } catch (error) {
      console.error('Push event error:', error);

      await self.registration.showNotification(notification.title, {
        body: notification.body,
        tag: notification.tag,
        data: {
          url: notification.url,
        },
      });
    }
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

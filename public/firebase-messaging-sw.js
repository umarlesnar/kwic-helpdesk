//public/firebase-messaging-sw.js
// Firebase Messaging Service Worker
importScripts(
  "https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js"
);

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyDVV4QI7g3ypKgVROnARqzhHqPD87r_vvc",
  authDomain: "kooo-a6be6.firebaseapp.com",
  projectId: "kooo-a6be6",
  storageBucket: "kooo-a6be6.firebasestorage.app",
  messagingSenderId: "926943760034",
  appId: "1:926943760034:web:274198b3d9aacbae4c51fb",
});

// Retrieve Firebase Messaging object
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("Background message received:", payload);

  const notificationTitle =
    payload.notification?.title || "Helpdesk Notification";
  const notificationOptions = {
    body: payload.notification?.body || "You have a new notification",
    icon: payload.notification?.icon || "/icons/notification-icon.png",
    badge: "/icons/badge-icon.png",
    image: payload.notification?.image,
    tag: payload.data?.tag || "firebase-notification",
    data: {
      ...payload.data,
      clickAction: payload.data?.clickAction || "/",
    },
    actions: [
      {
        action: "view",
        title: "View",
        icon: "/icons/view-icon.png",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
    requireInteraction: payload.data?.priority === "high",
    silent: false,
    timestamp: Date.now(),
    vibrate: [200, 100, 200],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("Firebase notification clicked:", event);

  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};

  if (action === "dismiss") {
    return;
  }

  // Default action or 'view' action
  const urlToOpen = data.clickAction || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && "focus" in client) {
            return client.focus();
          }
        }

        // If no existing window/tab, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle notification close
self.addEventListener("notificationclose", (event) => {
  console.log("Firebase notification closed:", event);

  // Track notification dismissal if needed
  const data = event.notification.data || {};
  if (data.trackDismissal) {
    fetch("/api/firebase/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "dismissed",
        notificationId: data.id,
        timestamp: Date.now(),
      }),
    }).catch((error) => {
      console.error("Error tracking Firebase notification dismissal:", error);
    });
  }
});

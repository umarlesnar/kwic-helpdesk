//lib/firebase/admin.ts
// Firebase Admin SDK for server-side
let adminApp: any = null;
let adminMessaging: any = null;

// Only initialize on server side
if (typeof window === "undefined") {
  try {
    const { initializeApp, getApps, cert } = require("firebase-admin/app");
    const { getMessaging } = require("firebase-admin/messaging");

    const firebaseAdminConfig = {
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
      projectId: process.env.FIREBASE_PROJECT_ID,
    };

    // Initialize Firebase Admin
    adminApp =
      getApps().length === 0
        ? initializeApp(firebaseAdminConfig, "admin")
        : getApps()[0];

    // Get Firebase Cloud Messaging instance
    adminMessaging = getMessaging(adminApp);
  } catch (error) {
    console.warn("Firebase Admin SDK not available:", error);
  }
}

export { adminMessaging };
export default adminApp;

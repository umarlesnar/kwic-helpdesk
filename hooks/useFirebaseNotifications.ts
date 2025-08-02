//hooks/useFirebaseNotifications.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/shared/AuthProvider";
import { messaging } from "@/lib/firebase/config";
import { getToken, onMessage } from "firebase/messaging";

export interface FirebaseNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  permission: NotificationPermission;
  token: string | null;
  error: string | null;
}

export function useFirebaseNotifications() {
  const { token: authToken, user } = useAuth();
  const [state, setState] = useState<FirebaseNotificationState>({
    isSupported: false,
    isSubscribed: false,
    isLoading: true,
    permission: "default",
    token: null,
    error: null,
  });

  // Check if Firebase messaging is supported
  useEffect(() => {
    const checkSupport = async () => {
      try {
        const isSupported =
          typeof window !== "undefined" &&
          "serviceWorker" in navigator &&
          "PushManager" in window &&
          "Notification" in window &&
          messaging !== null;

        setState((prev) => ({
          ...prev,
          isSupported,
          permission: isSupported ? Notification.permission : "denied",
          isLoading: false,
        }));
      } catch (error) {
        console.error("Error checking Firebase support:", error);
        setState((prev) => ({
          ...prev,
          isSupported: false,
          isLoading: false,
          error: "Firebase messaging not supported",
        }));
      }
    };

    checkSupport();
  }, []);

  // Check existing token
  useEffect(() => {
    const checkToken = async () => {
      if (!state.isSupported || !messaging || !authToken) return;

      try {
        const currentToken = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        });
        if (currentToken) {
          console.log("FCM Token: ", currentToken);
        }
        setState((prev) => ({
          ...prev,
          isSubscribed: !!currentToken,
          token: currentToken,
          isLoading: false,
        }));
      } catch (error) {
        console.error("Error getting FCM token:", error);
        setState((prev) => ({
          ...prev,
          error: "Failed to get notification token",
          isLoading: false,
        }));
      }
    };

    checkToken();
  }, [state.isSupported, authToken]);

  // Listen for foreground messages
  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("Foreground message received:", payload);

      // Show notification if the page is visible
      if (document.visibilityState === "visible" && payload.notification) {
        // You can customize how foreground notifications are displayed
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(payload.notification.title || "New Notification", {
            body: payload.notification.body,
            icon: payload.notification.image || "/icons/notification-icon.png",
            tag: payload.data?.tag || "firebase-notification",
            data: payload.data,
          });
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Request permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      setState((prev) => ({ ...prev, error: "Notifications not supported" }));
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setState((prev) => ({ ...prev, permission }));
      return permission === "granted";
    } catch (error) {
      console.error("Error requesting permission:", error);
      setState((prev) => ({ ...prev, error: "Failed to request permission" }));
      return false;
    }
  }, [state.isSupported]);

  // Subscribe to notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported || !messaging || !authToken) {
      setState((prev) => ({
        ...prev,
        error: "Cannot subscribe: requirements not met",
      }));
      return false;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Request permission if not granted
      if (state.permission !== "granted") {
        const granted = await requestPermission();
        if (!granted) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: "Permission denied",
          }));
          return false;
        }
      }

      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });

      if (!token) {
        throw new Error("Failed to get FCM token");
      }

      // Register token with server
      const response = await fetch("/api/firebase/register-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          token,
          deviceInfo: {
            platform: navigator.platform,
            browser: getBrowserInfo().name,
            version: getBrowserInfo().version,
            userAgent: navigator.userAgent,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to register FCM token");
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: true,
        token,
        isLoading: false,
      }));

      console.log("Successfully subscribed to Firebase notifications");
      return true;
    } catch (error) {
      console.error("Error subscribing to Firebase notifications:", error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to subscribe",
        isLoading: false,
      }));
      return false;
    }
  }, [state.isSupported, state.permission, authToken, requestPermission]);

  // Unsubscribe from notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!state.token || !authToken) {
      setState((prev) => ({ ...prev, error: "No active subscription" }));
      return false;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Unregister token with server
      await fetch("/api/firebase/unregister-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          token: state.token,
        }),
      });

      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        token: null,
        isLoading: false,
      }));

      console.log("Successfully unsubscribed from Firebase notifications");
      return true;
    } catch (error) {
      console.error("Error unsubscribing from Firebase notifications:", error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to unsubscribe",
        isLoading: false,
      }));
      return false;
    }
  }, [state.token, authToken]);

  // Send test notification
  const sendTestNotification = useCallback(async (): Promise<boolean> => {
    if (!authToken || user?.role !== "admin") {
      setState((prev) => ({
        ...prev,
        error: "Unauthorized to send notifications",
      }));
      return false;
    }

    try {
      const response = await fetch("/api/firebase/send-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: "Test Notification",
          body: "This is a test Firebase notification from the helpdesk system.",
          icon: "/icons/notification-icon.png",
          clickAction: "/",
          data: {
            type: "test",
          },
          targets: {
            userId: user.id,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send test notification");
      }

      console.log("Test Firebase notification sent successfully");
      return true;
    } catch (error) {
      console.error("Error sending test Firebase notification:", error);
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : "Failed to send test notification",
      }));
      return false;
    }
  }, [authToken, user]);

  return {
    ...state,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
}

// Helper function
function getBrowserInfo(): { name: string; version: string } {
  const userAgent = navigator.userAgent;
  let name = "Unknown";
  let version = "Unknown";

  if (userAgent.includes("Chrome")) {
    name = "Chrome";
    const match = userAgent.match(/Chrome\/(\d+)/);
    version = match ? match[1] : "Unknown";
  } else if (userAgent.includes("Firefox")) {
    name = "Firefox";
    const match = userAgent.match(/Firefox\/(\d+)/);
    version = match ? match[1] : "Unknown";
  } else if (userAgent.includes("Safari")) {
    name = "Safari";
    const match = userAgent.match(/Version\/(\d+)/);
    version = match ? match[1] : "Unknown";
  } else if (userAgent.includes("Edge")) {
    name = "Edge";
    const match = userAgent.match(/Edge\/(\d+)/);
    version = match ? match[1] : "Unknown";
  }

  return { name, version };
}

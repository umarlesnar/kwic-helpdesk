//app/customer/page.tsx
"use client";

import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { Layout } from "@/components/shared/Layout";
import { CustomerDashboard } from "@/components/customer/CustomerDashboard";
import { useFirebaseNotifications } from "@/hooks/useFirebaseNotifications";
import { useEffect } from "react";

export default function CustomerPage() {
  const { subscribe, isSubscribed, error, isSupported, token } = useFirebaseNotifications();
  if (error) {
    console.error("Firebase Notifications Error:", error, isSubscribed);
  }
  useEffect(() => {
    // Only subscribe if requirements are met and not already subscribed
    if (
      isSupported &&
      token == null &&
      typeof subscribe === "function" &&
      !isSubscribed &&
      !error
    ) {
      subscribe()
        .then(() => {
          console.log("Successfully subscribed to Firebase notifications");
        })
        .catch((error) => {
          console.error(
            "Failed to subscribe to Firebase notifications:",
            error
          );
        });
    }
  }, [isSupported, token, isSubscribed, error, subscribe]);

  return (
    <ProtectedRoute allowedRoles={["customer"]}>
      <Layout title="Help Center">
        <CustomerDashboard />
      </Layout>
    </ProtectedRoute>
  );
}

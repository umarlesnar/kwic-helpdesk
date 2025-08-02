//app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/shared/AuthProvider";
import { Toaster } from "@/components/ui/sonner";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Helpdesk Support System",
  description: "Professional helpdesk and support ticket management system",
  manifest: "/manifest.json",
  themeColor: "#3B82F6",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  icons: {
    icon: "/icons/notification-icon.png",
    apple: "/icons/notification-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3B82F6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Helpdesk" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>

        {/* Service Worker Registration */}
        <Script id="firebase-registration" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/firebase-messaging-sw.js')
                  .then(function(registration) {
                    console.log('Firebase registered: ', registration);
                  })
                  .catch(function(registrationError) {
                    console.log('Firebase registration failed: ', registrationError);
                  });
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider, SignedIn } from "@clerk/nextjs";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import AppOnboarding from "@/components/AppOnboarding";

export const metadata: Metadata = {
  title: "Afora",
  description: "Your next all-in-one project management app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Switch to Google Auth if users become >10,000
    <ClerkProvider>
      <html lang="en">
        <head>
          <link
            rel="icon"
            href="/icon.svg"
            type="image/svg"
            sizes="any"
          />
        </head>
        <body>
          <Header /> {/* Always show the header */}
          <div className="flex min-h-screen pt-[74px]">
            <SignedIn> {/* Only show side bar of organizations if user is signed in */}
              <Sidebar />
              {/* put the onboarding survey here to make sure no bypassing by going to another url page */}
              <AppOnboarding />
            </SignedIn>
            <div className="flex-1 bg-gray-100 overflow-y-auto scrollbar-hide py-2">
              {children} {/* Home Page */}
            </div>
          </div>
          <Toaster position="top-center" />
        </body>
      </html>
    </ClerkProvider>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import AppOnboarding from "@/components/AppOnboarding";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

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
          <div className="flex flex-col h-screen">
            <Header /> {/* Always show the header */}
            <div className="flex overflow-auto h-screen">
              <SignedIn> {/* Only show side bar of organizations if user is signed in */}
                <ResizablePanelGroup direction="horizontal">
                  <ResizablePanel defaultSize={15} minSize={10} maxSize={20}>
                    <Sidebar />
                  </ResizablePanel>
                  <ResizableHandle withHandle>

                  </ResizableHandle>
                  {/* put the onboarding survey here to make sure no bypassing by going to another url page */}
                  <AppOnboarding />
                  <ResizablePanel defaultSize={85} minSize={80}>
                    <div className="flex-1 overflow-auto bg-gray-100">
                      {children} {/* Home Page */}
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </SignedIn>

              {/* Sign in page */}
              <SignedOut>
                <div className="w-full h-full bg-gradient-to-r from-[#6F61EF] via-[#6F61EF] to-purple-500/0 flex items-center justify-center">
                  <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
                    <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
                      Welcome to Afora
                    </h2>
                    <p className="text-xl text-gray-600 mb-8 text-center">
                      Create an account to start using Afora!
                    </p>
                    <div className="flex justify-center">
                      <SignInButton mode="modal">
                        <button className="bg-[#6F61EF] hover:bg-[#5948ee] text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105">
                          Sign Up / Sign In
                        </button>
                      </SignInButton>
                    </div>
                  </div>
                </div>
              </SignedOut>
            </div>
          </div>
          <Toaster position="top-center" />
        </body>
      </html>
    </ClerkProvider>
  );
}

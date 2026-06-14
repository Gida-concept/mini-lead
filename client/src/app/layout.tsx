import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import { NavSidebar } from "@/components/NavSidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lead Generation Engine",
  description: "Scrape and manage business leads from Facebook, Instagram, Google Web, and Google Maps.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                if (theme === 'dark') document.documentElement.classList.add('dark');
              } catch(e) {}
            `,
          }}
        />
        <div className="flex h-full">
          <NavSidebar />
          <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 pt-14 sm:pt-14 lg:pt-0">
            {children}
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}

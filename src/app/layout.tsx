import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import "./globals.css";

export const metadata: Metadata = {
  title: "Welcome to Acme",
  description: "Acme Co. content site",
};

interface RootLayoutProps {
  children: React.ReactNode;
}
export default function RootLayout({ children }: RootLayoutProps): React.ReactNode {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link href="/" className="brand" aria-label="Acme Co. home">
            <Image
              src="/acme_logo.webp"
              alt="Acme Co."
              width={530}
              height={400}
              priority
              className="brand-logo"
            />
          </Link>
        </header>
        <main className="content">
          <div className="content-inner">{children}</div>
        </main>
        <footer className="site-footer">
          <span className="footer-brand">Acme Co.</span> &copy;{" "}
          {new Date().getFullYear()} &middot; Makers of fine widgets
        </footer>
      </body>
    </html>
  );
}

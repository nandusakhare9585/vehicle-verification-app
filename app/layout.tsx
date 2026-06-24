import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Car History Viewer",
  description:
    "Look up a VIN to see vehicle specs, ownership, odometer (KM) history, health/issues, and photos.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="text-2xl">🚗</span>
              <span className="text-lg">Car History Viewer</span>
            </Link>
            <a
              href="https://vpic.nhtsa.dot.gov/api/"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-slate-500 hover:text-brand-600"
            >
              Powered by NHTSA
            </a>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-10 text-center text-xs text-slate-400">
          Specs, recalls & complaints from public NHTSA APIs. Ownership & KM
          history require a paid provider key.
        </footer>
      </body>
    </html>
  );
}

import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Landing Page",
  description: "Generated landing page code",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

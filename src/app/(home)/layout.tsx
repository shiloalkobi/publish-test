import type { ReactNode } from "react";

export default function HomeLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <main className="min-h-screen">{children}</main>;
}

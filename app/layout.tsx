import type { Metadata } from "next";
import "./globals.css";
import { ReactQueryProvider } from "@/components/providers/ReactQueryProvider";
import { Header } from "@/components/layout/Header";
import { UserStateBootstrap } from "@/components/auth/UserStateBootstrap";

export const metadata: Metadata = {
  title: "별이 상점",
  description: "별이 상점",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`antialiased`}>
        <ReactQueryProvider>
          <UserStateBootstrap />
          <Header />
          {children}
        </ReactQueryProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SmartHR | 인사관리 ERP",
  description: "직원 정보, 조직, 근태, 휴가, 급여 정산까지 하나로 연결하는 인사관리 ERP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className={`${inter.className} min-h-full`}>{children}</body>
    </html>
  );
}

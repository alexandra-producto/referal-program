import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Referal - Recomendaciones",
  description: "Plataforma de recomendaciones de candidatos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}


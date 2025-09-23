import "./globals.css";

export const metadata = {
  title: "NeuraGallery",
  description: "Electron + Next.js desktop app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

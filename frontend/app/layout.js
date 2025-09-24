import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";

export const metadata = {
  title: "NeuraGallery",
  description: "AI-powered image gallery with processing capabilities",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 font-sans min-h-screen">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

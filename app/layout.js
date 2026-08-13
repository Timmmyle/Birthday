import { Roboto_Mono, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["vietnamese", "latin"],
  weight: ["400", "700"],
});

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "700"],
});

export const metadata = {
  title: "Nhiệm Vụ Sinh Nhật",
  description: "Chúc mừng sinh nhật! Cày coin và đổi quà thôi!",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="vi"
      className={`${robotoMono.variable} ${beVietnam.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-text-main antialiased selection:bg-primary selection:text-black">
        {children}
      </body>
    </html>
  );
}

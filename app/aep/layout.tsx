import type { Metadata, Viewport } from "next";
import PwaRegister from "./_components/PwaRegister";

export const metadata: Metadata = {
  title: "B4 AEP · Avaliação Ergonômica",
  manifest: "/aep.webmanifest",
  appleWebApp: { capable: true, title: "B4 AEP", statusBarStyle: "black-translucent" },
  icons: { icon: "/icons/aep-192.png", apple: "/icons/aep-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#0A1F3D",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function AepLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PwaRegister />
      {children}
    </>
  );
}

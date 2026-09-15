import type { Metadata, Viewport } from "next";
import { DM_Sans, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Manrope({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });
export const metadata: Metadata = { title: "ColorLab + Gradient Forge — Build colors worth shipping", description: "Your browser-based color studio. Craft harmonious palettes, forge beautiful CSS gradients, check contrast, and export colors ready for your next great idea.", applicationName: "ColorLab + Gradient Forge", keywords: ["color palette", "CSS gradient generator", "color studio", "contrast checker"] };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#111114" };
const themeScript = `(function(){try{var s=JSON.parse(localStorage.getItem('colorlab.studio.v1')||'{}').settings||{};var t=s.theme||'dark';document.documentElement.dataset.theme=t==='system'?(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'):t;document.documentElement.dataset.motion=s.motion||'full'}catch(e){}})()`;
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-theme="dark" suppressHydrationWarning className={`${sans.variable} ${display.variable} ${mono.variable}`}><body><script dangerouslySetInnerHTML={{ __html: themeScript }} />{children}</body></html>;
}

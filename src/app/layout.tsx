import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "ColorLab + Gradient Forge — Build colors worth shipping", description: "Your browser-based color studio. Craft harmonious palettes, forge beautiful CSS gradients, check contrast, and export colors ready for your next great idea.", applicationName: "ColorLab + Gradient Forge", keywords: ["color palette", "CSS gradient generator", "color studio", "contrast checker"] };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#111114" };
const themeScript = `(function(){try{var s=JSON.parse(localStorage.getItem('colorlab.studio.v1')||'{}').settings||{};var t=s.theme||'dark';document.documentElement.dataset.theme=t==='system'?(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'):t;document.documentElement.dataset.motion=s.motion||'full'}catch(e){}})()`;
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-theme="dark" suppressHydrationWarning><body><script dangerouslySetInnerHTML={{ __html: themeScript }} />{children}</body></html>;
}

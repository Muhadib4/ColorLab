"use client";

import { useCallback, useEffect, useEffectEvent, useRef, useState, type CSSProperties } from "react";
import { ArrowDownToLine, ArrowRight, ArrowUpRight, Blend, Bookmark, Check, ChevronRight, CircleHelp, Command, Copy, FlaskConical, History, Keyboard, Layers3, LayoutGrid, Link2, Moon, Music2, Palette as PaletteIcon, Pause, Play, Redo2, Search, Settings2, Shuffle, SlidersHorizontal, Sparkles, Sun, Undo2, Volume2, VolumeX, WandSparkles, X } from "lucide-react";
import ColorLab from "./colorlab";
import GradientForge from "./gradient-forge";
import Explore from "./explore";
import Collection from "./collection";
import Settings from "./settings";
import ExportDialog from "./export-dialog";
import CommandMenu, { type StudioCommand } from "./command-menu";
import { Dialog } from "./dialog";
import { useWorkspace, INITIAL_DESIGN } from "@/hooks/use-workspace";
import { colorName, formatColor, generatePalette, uid } from "@/lib/color";
import { createGradient, generateGradient } from "@/lib/gradient";
import { exportGradient, exportPalette, parseSharedCreation, serializeCreation } from "@/lib/serialization";
import { PALETTE_PRESETS } from "@/lib/presets";
import { DEFAULT_SETTINGS, readStudio, writeStudio } from "@/lib/storage";
import { studioAudio } from "@/lib/audio";
import type { AppSettings, Creation, GradientMode, Notify, Palette, SavedCreation, StudioTab } from "@/types";
import { paletteFromLibraryItem, type DesignLibraryItem } from "@/lib/design-library";

interface Toast { id: string; message: string; tone: "success" | "error"; action?: { label: string; run: () => void } }
type Modal = "settings" | "export" | "commands" | "save" | "shortcuts" | null;
const shortcutRows = [["Space", "Generate a new palette"], ["G", "Forge a new gradient"], ["L", "Lock or unlock selected color"], ["C", "Copy selected color"], ["Ctrl / ⌘ + S", "Save current creation"], ["Ctrl / ⌘ + K", "Open command menu"], ["Ctrl / ⌘ + Z", "Undo last edit"], ["Ctrl / ⌘ + Shift + Z", "Redo last edit"], ["Esc", "Close dialog or inspector"]];

function Brand({ compact = false }: { compact?: boolean }) {
  return <span className={`brand ${compact ? "brand-compact" : ""}`}><span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span><span className="brand-type">ColorLab<span>+ GRADIENT FORGE</span></span></span>;
}

export default function Studio() {
  const { current, past, future, dispatch } = useWorkspace();
  const { palette, gradient } = current;
  const [tab, setTab] = useState<StudioTab>("studio");
  const [tool, setTool] = useState<"palette" | "gradient">("palette");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState<SavedCreation[]>([]);
  const [recent, setRecent] = useState<SavedCreation[]>([]);
  const [ready, setReady] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [modal, setModal] = useState<Modal>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [name, setName] = useState("");
  const [renameItem, setRenameItem] = useState<SavedCreation | null>(null);
  const [manualCopy, setManualCopy] = useState<{ value: string; label: string } | null>(null);
  const [ambientPlaying, setAmbientPlaying] = useState(false);
  const [presetPage, setPresetPage] = useState(0);
  const [librarySource, setLibrarySource] = useState<DesignLibraryItem | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const cursorFrame = useRef<number | null>(null);
  const toastTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const activeCreation: Creation = tool === "palette" ? { kind: "palette", palette } : { kind: "gradient", gradient };
  const notify: Notify = useCallback((message, tone = "success") => {
    const id = uid();
    setToasts(items => [...items.slice(-2), { id, message, tone }]);
    const timer = setTimeout(() => setToasts(items => items.filter(item => item.id !== id)), 3600);
    toastTimers.current.push(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const { data, available } = readStudio();
      const restored = { ...INITIAL_DESIGN };
      if (data?.palette?.kind === "palette") restored.palette = data.palette.palette;
      if (data?.gradient?.kind === "gradient") restored.gradient = data.gradient.gradient;
      if (data?.saved) setSaved(data.saved);
      if (data?.recent) setRecent(data.recent);
      if (data?.settings) setSettings(data.settings);
      const shared = parseSharedCreation(window.location.search);
      if (shared?.kind === "palette") { restored.palette = shared.palette; setTool("palette"); setTab("colorlab"); }
      if (shared?.kind === "gradient") { restored.gradient = shared.gradient; setTool("gradient"); setTab("gradient"); }
      if (shared) notify("Shared creation opened. Make it yours.");
      else if (new URLSearchParams(window.location.search).has("colors") || new URLSearchParams(window.location.search).has("gradient") || new URLSearchParams(window.location.search).has("design")) notify("This shared link is invalid. Your studio is ready to use.", "error");
      dispatch({ type: "restore", value: restored });
      setStorageAvailable(available); setReady(true);
      if (!available) notify("Browser storage is unavailable. Export your work to keep it.", "error");
    });
    return () => { cancelled = true; };
  }, [dispatch, notify]);

  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      const available = writeStudio({ palette: { kind: "palette", palette }, gradient: { kind: "gradient", gradient }, settings, saved, recent });
      setStorageAvailable(available);
    }, 180);
    return () => clearTimeout(timer);
  }, [palette, gradient, settings, saved, recent, ready]);

  useEffect(() => {
    if (!ready) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => { document.documentElement.dataset.theme = settings.theme === "system" ? media.matches ? "dark" : "light" : settings.theme; document.documentElement.dataset.motion = settings.motion; };
    apply(); media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [settings.theme, settings.motion, ready]);

  useEffect(() => {
    if (ambientPlaying) studioAudio.setAmbient(true, settings.ambientVolume, settings.muted);
  }, [ambientPlaying, settings.ambientVolume, settings.muted]);
  useEffect(() => () => { studioAudio.stopAmbient(); toastTimers.current.forEach(clearTimeout); if (cursorFrame.current) cancelAnimationFrame(cursorFrame.current); }, []);

  const sound = (kind: Parameters<typeof studioAudio.play>[0]) => studioAudio.play(kind, settings);
  const navigate = (next: StudioTab) => { setTab(next); if (next === "colorlab") setTool("palette"); if (next === "gradient") setTool("gradient"); setSelectedId(null); sound("switch"); };
  const switchTool = (next: "palette" | "gradient") => { setTool(next); if (tab !== "studio") setTab(next === "palette" ? "colorlab" : "gradient"); setSelectedId(null); sound("switch"); };
  const toggleTheme = () => { const isDark = document.documentElement.dataset.theme === "dark"; setSettings(previous => ({ ...previous, theme: isDark ? "light" : "dark" })); };
  const addRecent = (creation: Creation, title: string) => setRecent(previous => [{ ...creation, id: uid(), name: title, createdAt: new Date().toISOString() }, ...previous].slice(0, 30));
  const changePalette = (value: Palette) => dispatch({ type: "palette", value });
  const generateColors = () => {
    if (palette.colors.every(color => color.locked)) { notify("All colors are locked. Unlock one to explore."); return; }
    const next = librarySource
      ? paletteFromLibraryItem(librarySource, palette.colors.length, palette.colors)
      : { ...palette, colors: generatePalette(palette.colors.length, palette.mode, palette.colors) };
    changePalette(next); addRecent({ kind: "palette", palette: next }, `${next.mode} exploration`); sound("generate"); notify("A fresh perspective. Palette generated.");
  };
  const forgeGradient = (mode: GradientMode = "Smooth") => { const next = generateGradient(mode); dispatch({ type: "gradient", value: next }); addRecent({ kind: "gradient", gradient: next }, `${mode} gradient`); sound("generate"); notify("Gradient forged"); };
  const sendToGradient = (colors: string[]) => { if (colors.length < 2) { notify("Select at least two colors for a gradient.", "error"); return; } const next = createGradient(colors); dispatch({ type: "gradient", value: next }); addRecent({ kind: "gradient", gradient: next }, "From your palette"); switchTool("gradient"); notify("Your palette, in a new light."); };
  const extractPalette = () => {
    const colors = [...gradient.stops].sort((a, b) => a.position - b.position).map(stop => ({ id: uid(), hex: stop.color, locked: false }));
    if (colors.length === 2) { const a = colors[0].hex; const b = colors[1].hex; const midpoint = "#" + [1, 3, 5].map(offset => Math.round((parseInt(a.slice(offset, offset + 2), 16) + parseInt(b.slice(offset, offset + 2), 16)) / 2).toString(16).padStart(2, "0")).join("").toUpperCase(); colors.splice(1, 0, { id: uid(), hex: midpoint, locked: false }); }
    const next: Palette = { colors, mode: "Random" }; changePalette(next); addRecent({ kind: "palette", palette: next }, "Extracted from gradient"); switchTool("palette"); notify("Gradient colors extracted");
  };
  const copy = async (value: string, label = "Value") => {
    let success = false;
    try { if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(value); success = true; } } catch {}
    if (!success) {
      const textarea = document.createElement("textarea"); textarea.value = value; textarea.style.position = "fixed"; textarea.style.opacity = "0";
      const parent = document.querySelector("dialog[open]") ?? document.body; parent.appendChild(textarea); textarea.select();
      try { success = document.execCommand("copy"); } catch {} textarea.remove();
    }
    if (success) { notify(`${label} copied`); sound("copy"); }
    else { setManualCopy({ value, label }); notify("Select and copy your value below.", "error"); }
  };
  const copyCss = () => void copy(activeCreation.kind === "palette" ? exportPalette(palette, "css") : exportGradient(gradient, "css"), "CSS");
  const share = () => { const url = new URL(window.location.href); url.search = serializeCreation(activeCreation); url.hash = ""; void copy(url.toString(), "Share link"); };
  const startSave = () => { setName(tool === "palette" ? `${colorName(palette.colors[0].hex)} study` : "A gradient worth keeping"); setRenameItem(null); setModal("save"); };
  const saveCreation = () => {
    const title = name.trim(); if (!title) return;
    if (renameItem) { setSaved(previous => previous.map(item => item.id === renameItem.id ? { ...item, name: title } : item)); notify("Creation renamed"); }
    else { setSaved(previous => [{ ...activeCreation, id: uid(), name: title, createdAt: new Date().toISOString() }, ...previous]); notify(`${tool === "palette" ? "Palette" : "Gradient"} saved to your collection`); }
    sound("save"); setModal(null); setRenameItem(null);
  };
  const loadCreation = (item: SavedCreation) => { if (item.kind === "palette") { changePalette(item.palette); setTool("palette"); setTab("colorlab"); } else { dispatch({ type: "gradient", value: item.gradient }); setTool("gradient"); setTab("gradient"); } setSelectedId(null); notify(`${item.name} loaded`); };
  const duplicateCreation = (item: SavedCreation, fromHistory = false) => { setSaved(previous => [{ ...item, id: uid(), name: fromHistory ? item.name : `${item.name} (copy)`, createdAt: new Date().toISOString() }, ...previous]); sound("save"); notify(fromHistory ? "Added to your collection" : "Creation duplicated"); };
  const deleteCreation = (item: SavedCreation) => {
    setSaved(previous => previous.filter(creation => creation.id !== item.id)); sound("delete");
    const id = uid(); setToasts(previous => [...previous.slice(-2), { id, message: "Creation deleted", tone: "success", action: { label: "Undo", run: () => { setSaved(previous => [item, ...previous]); setToasts(previous => previous.filter(toast => toast.id !== id)); } } }]);
    toastTimers.current.push(setTimeout(() => setToasts(previous => previous.filter(toast => toast.id !== id)), 8000));
  };
  const toggleAmbient = () => {
    const next = !ambientPlaying;
    if (!studioAudio.setAmbient(next, settings.ambientVolume, settings.muted)) { notify("Ambient audio is unavailable in this browser.", "error"); return; }
    setAmbientPlaying(next); setSettings(previous => ({ ...previous, ambient: next }));
  };
  const undo = () => { if (past.length) { dispatch({ type: "undo" }); sound("switch"); notify("Last edit undone"); } };
  const redo = () => { if (future.length) { dispatch({ type: "redo" }); sound("switch"); notify("Edit restored"); } };

  const handleKey = useEffectEvent((event: KeyboardEvent) => {
    const target = event.target;
    const typing = target instanceof HTMLElement && Boolean(target.closest("input,textarea,select,[contenteditable=true]"));
    if (event.key === "Escape") { if (manualCopy) setManualCopy(null); else if (modal) setModal(null); else setSelectedId(null); return; }
    if (typing || document.querySelector("dialog[open]") || event.altKey || event.repeat) return;
    const modifier = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();
    if (modifier) {
      if (key === "k") { event.preventDefault(); setModal("commands"); }
      if (key === "s") { event.preventDefault(); startSave(); }
      if (key === "z") { event.preventDefault(); if (event.shiftKey) redo(); else undo(); }
      return;
    }
    if (event.code === "Space") { if (target instanceof HTMLElement && target.closest("button,a,[role=button],[role=slider]")) return; event.preventDefault(); navigate("colorlab"); generateColors(); }
    if (key === "g") { navigate("gradient"); forgeGradient(); }
    if (key === "l") { const selected = palette.colors.find(color => color.id === selectedId) ?? palette.colors[0]; changePalette({ ...palette, colors: palette.colors.map(color => color.id === selected.id ? { ...color, locked: !color.locked } : color) }); sound("lock"); notify(selected.locked ? "Color unlocked" : "Color locked"); }
    if (key === "c") { const selected = palette.colors.find(color => color.id === selectedId) ?? palette.colors[0]; void copy(formatColor(selected.hex, settings.format), settings.format); }
    if (key === "?") setModal("shortcuts");
  });
  useEffect(() => { const listener = (event: KeyboardEvent) => handleKey(event); document.addEventListener("keydown", listener); return () => document.removeEventListener("keydown", listener); }, []);

  const commands: StudioCommand[] = [
    { label: "Generate palette", subtitle: "Find your next perfect combination", shortcut: "Space", icon: Shuffle, action: () => { navigate("colorlab"); generateColors(); } },
    { label: "Forge gradient", subtitle: "Let your colors flow", shortcut: "G", icon: WandSparkles, action: () => { navigate("gradient"); forgeGradient(); } },
    { label: "Explore palettes", subtitle: "Browse the local color library", icon: Sparkles, action: () => navigate("explore") },
    { label: "Open ColorLab", subtitle: "Craft colors with character", icon: PaletteIcon, action: () => navigate("colorlab") },
    { label: "Open Gradient Forge", subtitle: "Your gradient workbench", icon: Blend, action: () => navigate("gradient") },
    { label: "Save creation", subtitle: "Add this one to the keepers", shortcut: "⌘ S", icon: Bookmark, action: startSave },
    { label: "Copy CSS", subtitle: "Ready for your next project", icon: Copy, action: copyCss },
    { label: "Export creation", subtitle: "CSS, JSON, Tailwind, and more", icon: ArrowDownToLine, action: () => setModal("export") },
    { label: "Toggle theme", subtitle: "See things in a different light", icon: Sun, action: toggleTheme },
    { label: "Open settings", subtitle: "Make this space your own", icon: SlidersHorizontal, action: () => setModal("settings") },
  ];
  const navItems = [{ id: "studio" as const, label: "Studio", icon: LayoutGrid }, { id: "explore" as const, label: "Explore", icon: Sparkles }, { id: "colorlab" as const, label: "ColorLab", icon: PaletteIcon }, { id: "gradient" as const, label: "Gradient Forge", icon: Blend }];
  const libraryView = tab === "saved" || tab === "history";
  const accentColor = tool === "palette" ? palette.colors[1]?.hex : gradient.stops[0]?.color;

  return <div className="studio-app" ref={mainRef} style={{ "--active-color": accentColor ?? "#7C3AED" } as CSSProperties} onPointerMove={e => { if (e.pointerType !== "mouse" || settings.motion === "reduced" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; const { clientX, clientY } = e; if (cursorFrame.current) cancelAnimationFrame(cursorFrame.current); cursorFrame.current = requestAnimationFrame(() => { mainRef.current?.style.setProperty("--cursor-x", `${clientX}px`); mainRef.current?.style.setProperty("--cursor-y", `${clientY}px`); }); }}>
    <a href="#workspace" className="skip-link">Skip to workspace</a>
    <div className="ambient-background" aria-hidden="true" />
    <aside className="sidebar"><button className="brand-button" onClick={() => navigate("studio")} aria-label="ColorLab home"><Brand /></button><div className="workspace-badge"><span className="workspace-avatar"><FlaskConical size={16} /></span><span>Personal workspace<small>A space for your good ideas</small></span><span className="workspace-status" /></div>
      <div className="nav-label">WORKSPACE</div><nav className="primary-nav" aria-label="Main navigation">{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-item ${tab === id ? "active" : ""}`} aria-current={tab === id ? "page" : undefined} onClick={() => navigate(id)}><Icon size={18} /><span>{label}</span>{id === "gradient" && <span className="nav-mini">G</span>}{id === "studio" && tab === id && <span className="active-nav-dot" />}</button>)}</nav>
      <div className="nav-label library-label">YOUR LIBRARY</div><nav className="primary-nav" aria-label="Library navigation"><button className={`nav-item ${tab === "saved" ? "active" : ""}`} aria-current={tab === "saved" ? "page" : undefined} onClick={() => navigate("saved")}><Bookmark size={18} /><span>Saved creations</span><span className="nav-count">{saved.length}</span></button><button className={`nav-item ${tab === "history" ? "active" : ""}`} aria-current={tab === "history" ? "page" : undefined} onClick={() => navigate("history")}><History size={18} /><span>Recent history</span></button></nav>
      <div className="sidebar-bottom"><div className="sidebar-note"><span className="note-star">✳</span><p>A small tool.<br /><strong>An infinite spectrum.</strong></p><span className="note-line" /></div><button className="sidebar-command" onClick={() => setModal("commands")}><Search size={15} /><span>Jump to anything</span><kbd>⌘ K</kbd></button><button className="nav-item" onClick={() => setModal("settings")}><Settings2 size={17} /><span>Settings</span></button><button className="nav-item" onClick={() => setModal("shortcuts")}><Keyboard size={17} /><span>Keyboard shortcuts</span><span className="nav-mini">?</span></button><div className="sidebar-audio"><button aria-label={ambientPlaying ? "Pause ambience" : "Play ambience"} onClick={toggleAmbient} className={`audio-toggle ${ambientPlaying ? "playing" : ""}`}>{ambientPlaying ? <Pause size={13} /> : <Play size={13} />}</button><span><strong>{ambientPlaying ? "In the flow" : "Find your flow"}</strong><small>{ambientPlaying ? "Ambient atmosphere playing" : settings.ambient ? "Resume your studio ambience" : "A little ambience, if you like"}</small></span><button className="icon-button" onClick={() => setSettings(previous => ({ ...previous, muted: !previous.muted }))} aria-label={settings.muted ? "Unmute studio audio" : "Mute studio audio"}>{settings.muted ? <VolumeX size={15} /> : <Volume2 size={15} />}</button></div><div className="sidebar-version"><span>CRAFTED FOR CREATIVITY</span><span>v1.0</span></div></div>
    </aside>
      <div className="main-shell"><header className="topbar"><div className="mobile-brand"><Brand compact /></div><div className="breadcrumbs"><Layers3 size={16} /><span>Workspace</span><ChevronRight size={13} /><strong>{tab === "saved" ? "Saved creations" : tab === "history" ? "Recent history" : tab === "gradient" ? "Gradient Forge" : tab === "colorlab" ? "ColorLab" : tab === "explore" ? "Explore" : "Studio"}</strong></div><div className="topbar-actions"><span className="local-label"><span className="status-dot" /> LOCAL & YOURS</span><button className="icon-button header-search" title="Command menu (Ctrl/⌘ K)" aria-label="Open command menu" onClick={() => setModal("commands")}><Command size={17} /></button><button className="icon-button theme-toggle" aria-label="Toggle light and dark theme" title="Toggle theme" onClick={toggleTheme}><Sun size={18} className="sun-icon" /><Moon size={18} className="moon-icon" /></button><button className="button top-export" onClick={() => setModal("export")}><ArrowDownToLine size={15} /><span>Export</span><ArrowUpRight size={13} /></button></div></header>
      <main id="workspace" className="workspace-main" tabIndex={-1}>
        {tab === "explore" ? <Explore copy={copy} notify={notify} colorCount={palette.colors.length} onLoad={(next, target, title, source) => { setLibrarySource(source ?? null); if (target === "palette") { changePalette(next); setTool("palette"); setTab("colorlab"); addRecent({ kind: "palette", palette: next }, title); } else { sendToGradient(next.colors.map(color => color.hex)); } }} /> : libraryView ? <Collection items={tab === "saved" ? saved : recent} history={tab === "history"} onLoad={loadCreation} onRename={item => { setRenameItem(item); setName(item.name); setModal("save"); }} onDuplicate={item => duplicateCreation(item, tab === "history")} onDelete={deleteCreation} onCreate={() => navigate("colorlab")} /> : <>
          <section className={`hero ${tab !== "studio" ? "hero-compact" : ""}`}><div className="hero-copy"><span className="hero-kicker"><span /> YOUR NEXT GREAT IDEA STARTS HERE</span><h1>{tab === "gradient" ? <>Let your colors<br /><span>find their flow.</span></> : tab === "colorlab" ? <>A palette of<br /><span>possibilities.</span></> : <>Good things start<br />with a little <span>color.</span></>}</h1><p>{tab === "gradient" ? "Beautiful transitions. A few stops. Endless directions." : "Craft palettes. Forge gradients. Build colors worth shipping."}</p></div><div className="hero-art" aria-hidden="true"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-glow" /><div className="color-fan">{[...palette.colors].slice(0, 5).map((color, i) => <div key={color.id} className="fan-card" style={{ "--card-color": color.hex, "--card-index": i } as CSSProperties}><span /><i /></div>)}</div><span className="art-spark spark-one">✦</span><span className="art-spark spark-two">✧</span><span className="art-caption">a spectrum of possibilities</span></div></section>
          <section className="editor-section" aria-label="Creative workspace"><div className="workspace-heading"><div className="tool-tabs" role="tablist" aria-label="Creative tool"><button role="tab" aria-selected={tool === "palette"} className={tool === "palette" ? "active" : ""} onClick={() => switchTool("palette")}><PaletteIcon size={17} /> ColorLab <span>01</span></button><button role="tab" aria-selected={tool === "gradient"} className={tool === "gradient" ? "active" : ""} onClick={() => switchTool("gradient")}><Blend size={17} /> Gradient Forge <span>02</span></button></div><div className="workspace-tools"><button className="icon-button" disabled={!past.length} onClick={undo} aria-label="Undo" title="Undo (Ctrl/⌘ Z)"><Undo2 size={16} /></button><button className="icon-button" disabled={!future.length} onClick={redo} aria-label="Redo" title="Redo (Ctrl/⌘ Shift Z)"><Redo2 size={16} /></button><span className="vertical-rule" /><button className="icon-button" onClick={share} title="Copy share link" aria-label="Share current creation"><Link2 size={16} /></button></div></div>
            <div className="editor-content" role="tabpanel" aria-label={tool === "palette" ? "ColorLab" : "Gradient Forge"}>{tool === "palette" ? <ColorLab palette={palette} onChange={changePalette} onGenerate={generateColors} onSave={startSave} onExport={() => setModal("export")} onSendToGradient={sendToGradient} copy={copy} notify={notify} format={settings.format} selectedId={selectedId} onSelect={setSelectedId} /> : <GradientForge gradient={gradient} onChange={value => dispatch({ type: "gradient", value })} onGenerate={forgeGradient} onSave={startSave} onExport={() => setModal("export")} onExtract={extractPalette} copy={copy} notify={notify} />}</div>
          </section>
          {tool === "palette" && <section className="inspiration-section"><div className="section-heading"><div><span className="eyebrow">A LITTLE INSPIRATION</span><h2>Some colors just belong together.</h2></div><button className="text-button" onClick={() => setPresetPage(previous => previous + 1)}>Explore palettes <ArrowRight size={15} /></button></div><div className="inspiration-grid">{Array.from({ length: Math.min(4, PALETTE_PRESETS.length) }, (_, i) => PALETTE_PRESETS[(i + presetPage * 4) % PALETTE_PRESETS.length]).map(preset => <button className="inspiration-card" key={preset.name} onClick={() => { setLibrarySource(null); const next: Palette = { mode: "Random", colors: preset.colors.map(hex => ({ id: uid(), hex, locked: false })) }; changePalette(next); addRecent({ kind: "palette", palette: next }, preset.name); setSelectedId(null); notify(`${preset.name} loaded`); sound("generate"); }}><span className="inspiration-colors">{preset.colors.map((hex, i) => <i key={`${hex}-${i}`} style={{ background: hex }} />)}</span><span className="inspiration-meta"><strong>{preset.name}</strong><small>{preset.tag}</small><ArrowUpRight size={14} /></span></button>)}</div></section>}
          {tool === "palette" && <button className="forge-banner" onClick={() => switchTool("gradient")}><span className="banner-icon"><Blend size={24} /></span><span><strong>Great colors. Even better together.</strong><small>Give your palette a new dimension in Gradient Forge.</small></span><span className="banner-cta">Let it flow <ArrowUpRight size={17} /></span><i aria-hidden="true" /></button>}
        </>}
        <footer className="workspace-footer"><span><span className={`status-dot ${!storageAvailable ? "warning" : ""}`} />{!ready ? "Opening your workspace…" : storageAvailable ? "Your workspace stays on this device" : "Storage unavailable · export to keep your work"}</span><button onClick={() => setModal("shortcuts")}><CircleHelp size={13} /><span>Made for the way you create</span><kbd>?</kbd></button></footer>
      </main>
    </div>
    <nav className="mobile-nav" aria-label="Mobile navigation">{[...navItems, { id: "saved" as const, label: "Saved", icon: Bookmark }].map(({ id, label, icon: Icon }) => <button key={id} aria-current={tab === id ? "page" : undefined} className={tab === id ? "active" : ""} onClick={() => navigate(id)}><Icon size={20} /><span>{label === "Gradient Forge" ? "Gradients" : label}</span></button>)}<button aria-label="Open settings" onClick={() => setModal("settings")}><Settings2 size={20} /><span>Settings</span></button></nav>
    <div className="toast-region" aria-live="polite" aria-atomic="false">{toasts.map(toast => <div role="status" className={`toast ${toast.tone}`} key={toast.id}><span className="toast-symbol">{toast.tone === "success" ? <Check size={13} /> : <CircleHelp size={14} />}</span><span>{toast.message}</span>{toast.action && <button className="toast-action" onClick={toast.action.run}>{toast.action.label}</button>}<button className="toast-dismiss" aria-label="Dismiss notification" onClick={() => setToasts(previous => previous.filter(item => item.id !== toast.id))}><X size={13} /></button></div>)}</div>
    {modal === "settings" && <Settings settings={settings} onChange={setSettings} onClose={() => setModal(null)} ambientPlaying={ambientPlaying} onAmbient={toggleAmbient} />}
    {modal === "export" && <ExportDialog creation={activeCreation} onClose={() => setModal(null)} copy={copy} notify={notify} />}
    {modal === "commands" && <CommandMenu commands={commands} onClose={() => setModal(null)} />}
    {modal === "save" && <Dialog title={renameItem ? "A new name for a good thing." : "This one’s a keeper."} subtitle={renameItem ? "Give your creation a name that feels right." : "Give your creation a name. Find it in your collection anytime."} onClose={() => setModal(null)}><form onSubmit={e => { e.preventDefault(); saveCreation(); }} className="name-form"><label htmlFor="creation-name">Creation name</label><input autoFocus id="creation-name" className="field" maxLength={80} required value={name} onFocus={e => e.target.select()} onChange={e => setName(e.target.value)} placeholder="Something worth keeping" /><div className="dialog-actions"><button type="button" className="button" onClick={() => setModal(null)}>Cancel</button><button type="submit" className="button button-primary" disabled={!name.trim()}><Bookmark size={15} />{renameItem ? "Save name" : "Save creation"}</button></div></form></Dialog>}
    {modal === "shortcuts" && <Dialog title="Less clicking. More creating." subtitle="A few shortcuts to keep you in your flow." onClose={() => setModal(null)}><div className="shortcut-list">{shortcutRows.map(([key, label]) => <div key={key}><span>{label}</span><kbd>{key}</kbd></div>)}</div><div className="dialog-note"><Keyboard size={15} /> Shortcuts stay quiet while you’re typing or editing.</div><button className="button history-shortcut" onClick={() => { setModal(null); navigate("history"); }}><History size={16} /> Open recent history <ArrowRight size={15} /></button></Dialog>}
    {manualCopy && <Dialog title={`Copy ${manualCopy.label}`} subtitle="Automatic clipboard access is unavailable. Select the text and copy it manually." onClose={() => setManualCopy(null)}><textarea className="manual-copy field mono" autoFocus readOnly value={manualCopy.value} onFocus={e => e.target.select()} /><div className="dialog-actions"><button className="button button-primary" onClick={() => setManualCopy(null)}>Done</button></div></Dialog>}
  </div>;
}

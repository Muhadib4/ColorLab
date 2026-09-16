"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Check, Copy, Heart, Search, Shuffle, Sparkles } from "lucide-react";
import { DISCOVERY_CATEGORIES, DISCOVERY_PALETTES, paletteFromSeed, type DiscoveryPalette } from "@/lib/discovery";
import type { Notify, Palette } from "@/types";

type ExploreProps = { onLoad: (palette: Palette, target: "palette" | "gradient", name: string) => void; copy: (value: string, label?: string) => Promise<void>; notify: Notify };

export default function Explore({ onLoad, copy, notify }: ExploreProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [visible, setVisible] = useState(24);
  const [sort, setSort] = useState<"featured" | "name">("featured");
  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = DISCOVERY_PALETTES.filter(item => {
      const haystack = `${item.name} ${item.tag} ${item.mood} ${item.theme} ${item.colors.join(" ")}`.toLowerCase();
      return (!needle || haystack.includes(needle)) && (category === "All" || item.tag === category || item.theme === category || item.mood === category);
    });
    return (sort === "name" ? [...filtered].sort((a, b) => a.name.localeCompare(b.name)) : filtered).slice(0, visible);
  }, [category, query, sort, visible]);
  const randomize = () => { const item = DISCOVERY_PALETTES[Math.floor(Math.random() * DISCOVERY_PALETTES.length)]; onLoad(paletteFromSeed(item), "palette", item.name); notify(`${item.name} is ready in ColorLab`); };
  const toggleFavorite = (name: string) => setFavorites(items => items.includes(name) ? items.filter(item => item !== name) : [...items, name]);
  return <section className="explore-page" aria-labelledby="explore-title">
    <div className="explore-intro"><div><span className="eyebrow">THE CHROMAFORGE LIBRARY</span><h1 id="explore-title">Find your next <em>good color.</em></h1><p>160 curated palettes for interfaces, identities, posters, and everything in between.</p></div><button className="button button-primary" onClick={randomize}><Shuffle size={16} /> Surprise me</button></div>
    <div className="explore-controls"><label className="explore-search"><Search size={17} /><input value={query} onChange={e => { setQuery(e.target.value); setVisible(24); }} placeholder="Search palettes, moods, themes, or HEX…" aria-label="Search palettes" /><kbd>⌘ K</kbd></label><select className="select" value={sort} onChange={e => setSort(e.target.value as typeof sort)} aria-label="Sort palettes"><option value="featured">Featured</option><option value="name">A–Z</option></select></div>
    <div className="category-scroll" role="list" aria-label="Palette categories">{DISCOVERY_CATEGORIES.map(item => <button key={item} className={category === item ? "active" : ""} onClick={() => { setCategory(item); setVisible(24); }}>{item}</button>)}</div>
    <div className="explore-summary"><span><strong>{results.length}</strong> palettes in view</span><span>{favorites.length ? `${favorites.length} saved locally` : "Save favorites as you browse"}</span></div>
    <div className="discovery-grid">{results.map(item => <PaletteCard key={item.name} item={item} favorite={favorites.includes(item.name)} onFavorite={() => toggleFavorite(item.name)} onLoad={onLoad} onCopy={copy} notify={notify} />)}</div>
    {results.length === 0 && <div className="empty-discovery"><Sparkles size={22} /><h2>No exact match yet.</h2><p>Try a mood like calm, a theme like ocean, or a color such as blue.</p><button className="button" onClick={() => { setQuery(""); setCategory("All"); }}>Clear filters</button></div>}
    {visible < DISCOVERY_PALETTES.length && results.length > 0 && <button className="load-more button" onClick={() => setVisible(value => value + 24)}>Load more palettes <ArrowRight size={15} /></button>}
  </section>;
}

function PaletteCard({ item, favorite, onFavorite, onLoad, onCopy, notify }: { item: DiscoveryPalette; favorite: boolean; onFavorite: () => void; onLoad: ExploreProps["onLoad"]; onCopy: ExploreProps["copy"]; notify: Notify }) {
  const [copied, setCopied] = useState<string | null>(null);
  const copyColor = async (hex: string) => { await onCopy(hex, `${hex} copied`); setCopied(hex); setTimeout(() => setCopied(null), 1300); };
  return <article className="discovery-card"><div className="discovery-swatches">{item.colors.map(hex => <button key={hex} style={{ background: hex }} title={`Copy ${hex}`} aria-label={`Copy ${hex}`} onClick={() => void copyColor(hex)}><span className="swatch-label">{copied === hex ? <Check size={14} /> : hex}</span></button>)}</div><div className="discovery-card-meta"><div><strong>{item.name}</strong><span>{item.tag} · {item.mood}</span></div><button className={`icon-button favorite-button ${favorite ? "active" : ""}`} onClick={onFavorite} aria-label={`${favorite ? "Remove" : "Add"} ${item.name} favorite`} aria-pressed={favorite}><Heart size={17} fill={favorite ? "currentColor" : "none"} /></button></div><div className="discovery-actions"><button className="button button-ghost" onClick={() => void onCopy(item.colors.join(", "), "Palette copied")}><Copy size={14} /> Copy palette</button><button className="button button-ghost" onClick={() => { onLoad(paletteFromSeed(item), "gradient", item.name); notify(`${item.name} sent to Gradient Forge`); }}>Flow <ArrowRight size={14} /></button><button className="button button-primary" onClick={() => { onLoad(paletteFromSeed(item), "palette", item.name); notify(`${item.name} opened in ColorLab`); }}>Open</button></div></article>;
}

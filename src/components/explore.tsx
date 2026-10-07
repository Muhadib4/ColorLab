"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Check, Copy, Heart, Search, Shuffle, Sparkles } from "lucide-react";
import { DESIGN_LIBRARY, DESIGN_LIBRARY_TYPES, paletteFromLibraryItem, type DesignLibraryItem, type LibraryType } from "@/lib/design-library";
import type { Notify, Palette } from "@/types";

type ExploreProps = {
  onLoad: (palette: Palette, target: "palette" | "gradient", name: string, source?: DesignLibraryItem) => void;
  copy: (value: string, label?: string) => Promise<void>;
  notify: Notify;
  colorCount: number;
};

export default function Explore({ onLoad, copy, notify, colorCount }: ExploreProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [type, setType] = useState<"All" | LibraryType>("Palette");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [visible, setVisible] = useState(24);
  const [sort, setSort] = useState<"featured" | "name">("featured");

  const categories = useMemo(() => [
    "All",
    ...Array.from(new Set(DESIGN_LIBRARY.filter(item => type === "All" || item.type === type).map(item => item.category))),
  ], [type]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = DESIGN_LIBRARY.filter(item => {
      const haystack = `${item.name} ${item.type} ${item.group} ${item.category} ${item.description} ${item.tags.join(" ")} ${item.colors.join(" ")}`.toLowerCase();
      return (!needle || haystack.includes(needle))
        && (type === "All" || item.type === type)
        && (category === "All" || item.category === category);
    });
    return (sort === "name" ? [...filtered].sort((a, b) => a.name.localeCompare(b.name)) : filtered).slice(0, visible);
  }, [category, query, sort, type, visible]);

  const randomize = () => {
    const pool = DESIGN_LIBRARY.filter(item => type === "All" || item.type === type);
    const item = pool[Math.floor(Math.random() * pool.length)] ?? DESIGN_LIBRARY[0];
    onLoad(paletteFromLibraryItem(item, colorCount), "palette", item.name, item);
    notify(`${item.name} is ready in ColorLab`);
  };

  const toggleFavorite = (id: string) => setFavorites(items => items.includes(id) ? items.filter(item => item !== id) : [...items, id]);

  const changeType = (next: "All" | LibraryType) => {
    setType(next);
    setCategory("All");
    setVisible(24);
  };

  return <section className="explore-page" aria-labelledby="explore-title">
    <div className="explore-intro">
      <div>
        <span className="eyebrow">THE COLORLAB DESIGN LIBRARY</span>
        <h1 id="explore-title">Find your next <em>visual direction.</em></h1>
        <p>Palettes, aesthetics, and visual effects — all with color previews you can use immediately.</p>
      </div>
      <button className="button button-primary" onClick={randomize}><Shuffle size={16} /> Surprise me</button>
    </div>

    <div className="explore-controls">
      <label className="explore-search">
        <Search size={17} />
        <input value={query} onChange={e => { setQuery(e.target.value); setVisible(24); }} placeholder="Search palettes, aesthetics, effects, or HEX…" aria-label="Search design library" />
        <kbd>⌘ K</kbd>
      </label>
      <select className="select" value={sort} onChange={e => setSort(e.target.value as typeof sort)} aria-label="Sort library">
        <option value="featured">Featured</option>
        <option value="name">A–Z</option>
      </select>
    </div>

    <div className="category-scroll" role="tablist" aria-label="Library types">
      {DESIGN_LIBRARY_TYPES.map(item => <button key={item} className={type === item ? "active" : ""} onClick={() => changeType(item)} role="tab" aria-selected={type === item}>{item === "Effect" ? "Visual Effects" : item}</button>)}
    </div>

    <div className="category-scroll" role="list" aria-label="Library categories">
      {categories.map(item => <button key={item} className={category === item ? "active" : ""} onClick={() => { setCategory(item); setVisible(24); }}>{item}</button>)}
    </div>

    <div className="explore-summary">
      <span><strong>{results.length}</strong> items in view</span>
      <span>{favorites.length ? `${favorites.length} saved locally` : "Save favorites as you browse"}</span>
    </div>

    <div className="discovery-grid">
      {results.map(item => <LibraryCard key={item.id} item={item} favorite={favorites.includes(item.id)} onFavorite={() => toggleFavorite(item.id)} onLoad={onLoad} onCopy={copy} notify={notify} colorCount={colorCount} />)}
    </div>

    {results.length === 0 && <div className="empty-discovery">
      <Sparkles size={22} />
      <h2>No exact match yet.</h2>
      <p>Try a style like cyberpunk, a category like Nature, or a color such as blue.</p>
      <button className="button" onClick={() => { setQuery(""); setCategory("All"); }}>Clear filters</button>
    </div>}

    {visible < DESIGN_LIBRARY.length && results.length > 0 && <button className="load-more button" onClick={() => setVisible(value => value + 24)}>Load more <ArrowRight size={15} /></button>}
  </section>;
}

function LibraryCard({ item, favorite, onFavorite, onLoad, onCopy, notify, colorCount }: {
  item: DesignLibraryItem;
  favorite: boolean;
  onFavorite: () => void;
  onLoad: ExploreProps["onLoad"];
  onCopy: ExploreProps["copy"];
  notify: Notify;
  colorCount: number;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const palette = useMemo(() => paletteFromLibraryItem(item, colorCount), [colorCount, item]);
  const colors = palette.colors.map(color => color.hex);

  const copyColor = async (hex: string) => {
    await onCopy(hex, `${hex} copied`);
    setCopied(hex);
    setTimeout(() => setCopied(null), 1300);
  };

  const openPalette = () => {
    onLoad(palette, "palette", item.name, item);
    notify(`${item.name} opened in ColorLab`);
  };

  const sendFlow = () => {
    onLoad(palette, "gradient", item.name, item);
    notify(`${item.name} sent to Gradient Forge`);
  };

  return <article className="discovery-card">
    <div className="discovery-swatches">
      {colors.map(hex => <button key={hex} style={{ background: hex }} title={`Copy ${hex}`} aria-label={`Copy ${hex}`} onClick={() => void copyColor(hex)}>
        <span className="swatch-label">{copied === hex ? <Check size={14} /> : hex}</span>
      </button>)}
    </div>
    <div className="discovery-card-meta">
      <div>
        <strong>{item.name}</strong>
        <span>{item.type} · {item.category}</span>
      </div>
      <button className={`icon-button favorite-button ${favorite ? "active" : ""}`} onClick={onFavorite} aria-label={`${favorite ? "Remove" : "Add"} ${item.name} favorite`} aria-pressed={favorite}>
        <Heart size={17} fill={favorite ? "currentColor" : "none"} />
      </button>
    </div>
    <div className="discovery-actions">
      <button className="button button-ghost" onClick={() => void onCopy(colors.join(", "), "Palette copied")}><Copy size={14} /> Copy palette</button>
      <button className="button button-ghost" onClick={sendFlow}>Flow <ArrowRight size={14} /></button>
      <button className="button button-primary" onClick={openPalette}>Use</button>
    </div>
  </article>;
}

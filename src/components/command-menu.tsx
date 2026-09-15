"use client";
import { useState, type ComponentType } from "react";
import { ArrowUpRight, Command, Search } from "lucide-react";
import { Dialog } from "./dialog";
export interface StudioCommand { label: string; subtitle: string; shortcut?: string; icon: ComponentType<{ size?: number }>; action: () => void }
export default function CommandMenu({ commands, onClose }: { commands: StudioCommand[]; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const filtered = commands.filter(command => `${command.label} ${command.subtitle}`.toLowerCase().includes(query.toLowerCase()));
  const run = (command: StudioCommand) => { onClose(); command.action(); };
  return <Dialog title="A shortcut to your next idea." onClose={onClose} className="command-dialog"><div className="command-input"><Search size={20} /><input autoFocus placeholder="What would you like to do?" aria-label="Search commands" role="combobox" aria-expanded="true" aria-controls="studio-command-list" aria-activedescendant={filtered[index] ? `command-${index}` : undefined} value={query} onChange={e => { setQuery(e.target.value); setIndex(0); }} onKeyDown={e => { if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); setIndex(i => filtered.length ? (i + (e.key === "ArrowDown" ? 1 : -1) + filtered.length) % filtered.length : 0); } if (e.key === "Enter" && filtered[index]) { e.preventDefault(); run(filtered[index]); } }} /><kbd>esc</kbd></div><div className="command-list" id="studio-command-list" role="listbox" aria-label="Studio commands">{filtered.map((command, i) => <button role="option" aria-selected={index === i} id={`command-${i}`} className={`command-item ${index === i ? "selected" : ""}`} key={command.label} onMouseEnter={() => setIndex(i)} onClick={() => run(command)}><span className="command-icon"><command.icon size={18} /></span><span><strong>{command.label}</strong><small>{command.subtitle}</small></span>{command.shortcut ? <kbd>{command.shortcut}</kbd> : <ArrowUpRight size={15} />}</button>)}{!filtered.length && <p className="command-empty">No commands found. Try “palette”, “save”, or “theme”.</p>}</div><footer className="command-footer"><span><Command size={13} /> Make something good.</span><span><kbd>↑</kbd><kbd>↓</kbd> navigate <kbd>↵</kbd> select</span></footer></Dialog>;
}

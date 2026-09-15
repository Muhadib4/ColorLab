"use client";
import { useState } from "react";
import { Check, Copy, Download, Link2, Code2, FileJson, ArrowUpRight } from "lucide-react";
import type { CopyValue, Creation, Notify } from "@/types";
import { exportGradient, exportPalette, serializeCreation } from "@/lib/serialization";
import { gradientCss } from "@/lib/gradient";
import { Dialog } from "./dialog";

type ExportFormat = "css" | "json" | "tailwind" | "hex" | "svg" | "value";
export default function ExportDialog({ creation, onClose, copy, notify }: { creation: Creation; onClose: () => void; copy: CopyValue; notify: Notify }) {
  const [format, setFormat] = useState<ExportFormat>("css");
  const [copied, setCopied] = useState(false);
  const palette = creation.kind === "palette";
  const formats: { id: ExportFormat; label: string }[] = palette ? [{ id: "css", label: "CSS variables" }, { id: "json", label: "JSON" }, { id: "tailwind", label: "Tailwind" }, { id: "hex", label: "HEX list" }, { id: "svg", label: "SVG image" }] : [{ id: "css", label: "CSS" }, { id: "json", label: "JSON" }, { id: "tailwind", label: "Tailwind" }, { id: "value", label: "Style value" }];
  const content = palette ? exportPalette(creation.palette, format === "value" ? "css" : format) : exportGradient(creation.gradient, format === "hex" || format === "svg" ? "css" : format);
  const download = () => {
    const extension = format === "json" ? "json" : format === "svg" ? "svg" : format === "css" ? "css" : format === "tailwind" && palette ? "js" : "txt";
    const mime = format === "svg" ? "image/svg+xml" : format === "json" ? "application/json" : "text/plain";
    const url = URL.createObjectURL(new Blob([content], { type: `${mime};charset=utf-8` }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `colorlab-${palette ? "palette" : "gradient"}.${extension}`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("Your export is ready");
  };
  const share = () => { const url = new URL(window.location.href); url.search = serializeCreation(creation); url.hash = ""; void copy(url.toString(), "Share link"); };
  return <Dialog title="Made here. Ready for anywhere." subtitle={`Take your ${palette ? "palette" : "gradient"} from the studio to your next project.`} onClose={onClose} className="export-dialog">
    <div className="export-preview" aria-label={`${palette ? "Palette" : "Gradient"} export preview`} style={!palette ? { background: gradientCss(creation.gradient) } : undefined}>{palette && creation.palette.colors.map(color => <span key={color.id} style={{ background: color.hex }} />)}</div>
    <div className="export-tabs" role="tablist" aria-label="Export format">{formats.map(f => <button key={f.id} role="tab" aria-selected={format === f.id} className={format === f.id ? "active" : ""} onClick={() => { setFormat(f.id); setCopied(false); }}>{f.label}</button>)}</div>
    <div className="export-code-header"><span>{format === "json" ? <FileJson size={14} /> : <Code2 size={14} />} {formats.find(f => f.id === format)?.label}</span><span className="mono">{format === "svg" ? "image.svg" : format === "css" ? "styles.css" : format === "json" ? "colors.json" : "ready to paste"}</span></div>
    <pre className="export-code" tabIndex={0}><code>{content}</code></pre>
    <div className="dialog-actions"><button className="button" onClick={download}><Download size={15} /> Download</button><button className="button button-primary" onClick={async () => { await copy(content, "Export"); setCopied(true); setTimeout(() => setCopied(false), 1600); }}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Copied" : "Copy all"}</button></div>
    <button className="share-row" onClick={share}><span><Link2 size={16} /><span><strong>Good color is worth sharing.</strong><small>Copy a link with this entire design inside.</small></span></span><ArrowUpRight size={18} /></button>
  </Dialog>;
}

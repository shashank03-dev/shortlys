"use client";

import { QR_LEVELS, QR_PRESETS, QR_SIZES } from "@/lib/qr/constants";
import { getContrastRatio } from "@/lib/qr/contrast";

export function QrStylePanel({ style, onChange }) {
  const set = (patch) => onChange({ ...style, ...patch });
  const contrast = getContrastRatio(style.fgColor, style.bgColor);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {QR_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => set({ fgColor: preset.fgColor, bgColor: preset.bgColor })}
            className="rounded-lg border border-border px-3 py-2 text-xs font-medium hover:border-primary"
          >
            <span className="mr-2 inline-block h-3 w-3 rounded-full border" style={{ background: preset.fgColor }} />
            {preset.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs font-medium">
          Foreground
          <input type="color" value={style.fgColor} onChange={(event) => set({ fgColor: event.target.value })} className="mt-1 block h-10 w-full rounded-lg border border-border bg-background" />
        </label>
        <label className="text-xs font-medium">
          Background
          <input type="color" value={style.bgColor} onChange={(event) => set({ bgColor: event.target.value })} className="mt-1 block h-10 w-full rounded-lg border border-border bg-background" />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs font-medium">
          Size
          <select value={style.size} onChange={(event) => set({ size: Number(event.target.value) })} className="mt-1 block h-10 w-full rounded-lg border border-border bg-background px-2 text-sm">
            {QR_SIZES.map((value) => <option key={value} value={value}>{value}px</option>)}
          </select>
        </label>
        <label className="text-xs font-medium">
          Error correction
          <select value={style.level} onChange={(event) => set({ level: event.target.value })} className="mt-1 block h-10 w-full rounded-lg border border-border bg-background px-2 text-sm">
            {QR_LEVELS.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </div>

      {contrast < 4.5 ? <p className="text-xs text-destructive">Increase foreground/background contrast.</p> : null}
    </div>
  );
}

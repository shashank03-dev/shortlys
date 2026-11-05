"use client";

import { QRCodeSVG } from "qrcode.react";

export function QrPreview({ value, style, size = 224, caption, containerRef }) {
  return (
    <div ref={containerRef} className="qr-paper mx-auto h-fit w-fit self-start rounded-2xl p-4">
      <QRCodeSVG
        value={value}
        size={size}
        level={style.level}
        fgColor={style.fgColor}
        bgColor={style.bgColor}
        marginSize={4}
        boostLevel={false}
        title="QR code"
      />
      {caption ? <p className="mt-3 max-w-[224px] truncate text-center text-xs font-medium text-neutral-600">{caption}</p> : null}
    </div>
  );
}

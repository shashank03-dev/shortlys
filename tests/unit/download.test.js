import { afterEach, describe, expect, it, vi } from "vitest";
import { copyText, downloadPng, filenameFor, serializeSvg } from "@/lib/qr/download";

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("download helpers", () => {
  it("builds a safe filename", () => {
    expect(filenameFor("abc/123", "png")).toBe("shortlys-abc123.png");
  });

  it("serializes an SVG with the requested size", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 10 10");
    const output = serializeSvg(svg, 512);
    expect(output).toContain('width="512"');
    expect(output).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it("rejects failed clipboard fallbacks", async () => {
    vi.stubGlobal("navigator", {});
    document.execCommand = vi.fn(() => false);
    await expect(copyText("https://example.com")).rejects.toThrow("Copy failed");
    expect(document.querySelector("textarea")).toBeNull();
  });

  it("rejects PNG canvas allocation failures without hanging", async () => {
    let instance;
    vi.stubGlobal("Image", class { constructor() { instance = this; } });
    vi.stubGlobal("URL", { createObjectURL: () => "blob:test", revokeObjectURL: vi.fn() });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const result = downloadPng(svg, "menu", 4096);
    const rejected = expect(result).rejects.toThrow("PNG export failed");
    expect(() => instance.onload()).not.toThrow();
    await rejected;
  });
});

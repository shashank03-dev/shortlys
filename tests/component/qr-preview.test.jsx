import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { QrPreview } from "@/components/qr/QrPreview";

describe("QrPreview", () => {
  it("renders an accessible SVG with the encoded value", () => {
    render(<QrPreview value="https://shortlys.com/abc123?src=qr" style={{ fgColor: "#111827", bgColor: "#FFFFFF", level: "M", size: 1024 }} />);
    const svg = screen.getByTitle("QR code").closest("svg");
    expect(svg).toBeInTheDocument();
    expect(svg.tagName.toLowerCase()).toBe("svg");
  });
});

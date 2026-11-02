import { describe, expect, it } from "vitest";
import { normalizeUrl } from "@/lib/qr/url";
import { MAX_URL_LENGTH } from "@/lib/qr/constants";

describe("normalizeUrl", () => {
  it("adds https to a bare domain", () => {
    expect(normalizeUrl("example.com/path")).toBe("https://example.com/path");
  });

  it("keeps query and fragment", () => {
    expect(normalizeUrl("https://example.com/a?b=1#c")).toBe("https://example.com/a?b=1#c");
  });

  it("rejects non-http schemes", () => {
    expect(() => normalizeUrl("javascript:alert(1)")).toThrow("Only http and https");
    expect(() => normalizeUrl("data:text/plain,hi")).toThrow("Only http and https");
    expect(() => normalizeUrl("file:///etc/passwd")).toThrow("Only http and https");
  });

  it("rejects private and local hosts", () => {
    expect(() => normalizeUrl("http://localhost:3000")).toThrow("Private and local");
    expect(() => normalizeUrl("http://192.168.1.2")).toThrow("Private and local");
  });

  it("rejects credentials", () => {
    expect(() => normalizeUrl("https://user:pass@example.com")).toThrow("credentials");
  });

  it("blocks link-local and IPv6 private destinations without blocking public lookalikes", () => {
    for (const host of ["169.254.169.254", "[fc00::1]", "[fe80::1]", "[::ffff:127.0.0.1]", "app.localhost"]) {
      expect(() => normalizeUrl(`http://${host}/`)).toThrow("Private and local");
    }
    expect(normalizeUrl("https://localhost.example/path")).toBe("https://localhost.example/path");
    expect(normalizeUrl("example.com:8080/path")).toBe("https://example.com:8080/path");
  });

  it("rejects control characters and oversized input", () => {
    expect(() => normalizeUrl("https://example.com/\u0000")).toThrow("control");
    expect(() => normalizeUrl(`https://example.com/${"a".repeat(MAX_URL_LENGTH)}`)).toThrow("Maximum");
  });
});

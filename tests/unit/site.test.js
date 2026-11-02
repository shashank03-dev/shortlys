import { afterEach, describe, expect, it, vi } from "vitest";
import { getBaseUrl } from "@/lib/site";

afterEach(() => vi.unstubAllEnvs());

describe("canonical URLs", () => {
  it("uses the request URL rather than a caller-supplied Origin", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    expect(getBaseUrl(new Request("https://shortlys.example/api/qr", {
      headers: { origin: "https://attacker.example" },
    }))).toBe("https://shortlys.example");
  });

  it("uses the canonical deployment before request headers", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://shortlys.example/");
    expect(getBaseUrl(new Request("http://localhost/api/qr"))).toBe("https://shortlys.example");
  });
});

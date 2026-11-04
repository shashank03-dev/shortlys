import { describe, expect, it } from "vitest";
import { parseVisitor } from "@/lib/analytics/visitor";

function request(headers) {
  return new Request("http://localhost/test", { headers });
}

describe("parseVisitor", () => {
  it("detects Edge before Chrome", () => {
    const visitor = parseVisitor(request({ "user-agent": "Mozilla/5.0 Chrome/120 Edg/120", "x-vercel-ip-country": "us" }));
    expect(visitor.browser).toBe("Edge");
    expect(visitor.location).toBe("US");
  });

  it("detects Opera before Chrome", () => {
    expect(parseVisitor(request({ "user-agent": "Mozilla/5.0 Chrome/120 OPR/100" })).browser).toBe("Opera");
  });

  it("detects iPhone Safari", () => {
    const visitor = parseVisitor(request({ "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Version/17.0 Mobile Safari/604.1" }));
    expect(visitor).toMatchObject({ device: "Mobile", os: "iOS", browser: "Safari" });
  });

  it("marks bots and falls back to Unknown country", () => {
    const visitor = parseVisitor(request({ "user-agent": "Googlebot/2.1" }));
    expect(visitor.device).toBe("Bot");
    expect(visitor.isBot).toBe(true);
    expect(visitor.location).toBe("Unknown");
  });
});

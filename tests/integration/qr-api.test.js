import { beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/prisma";

const { getAuth } = vi.hoisted(() => ({ getAuth: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({ getAuth }));

const { POST, GET } = await import("@/app/api/qr/route");
const { GET: getQr, PATCH, DELETE } = await import("@/app/api/qr/[id]/route");

function jsonRequest(url, method, body) {
  return new Request(`http://localhost${url}`, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function createQr(body = { mode: "new", url: "https://example.com/page" }) {
  const response = await POST(jsonRequest("/api/qr", "POST", body));
  return { response, body: await response.json() };
}

beforeEach(() => {
  getAuth.mockReset();
  getAuth.mockReturnValue({ userId: "user_a" });
});

describe("QR API", () => {
  it("creates a short link and a QR that encodes the short URL", async () => {
    const { response, body } = await createQr({ mode: "new", url: "https://example.com/a/very/long/path", label: "Menu" });
    expect(response.status).toBe(201);
    expect(body.data.destination).toBe("https://example.com/a/very/long/path");
    expect(body.data.qrUrl).toMatch(/^http:\/\/localhost:3000\/[a-z0-9]{7}\?src=qr$/);
    expect(body.data.createdShortLink).toBe(true);

    const stored = await prisma.qrCode.findUnique({ where: { id: body.data.id }, include: { url: true } });
    expect(stored.url.shorturl).toBe(body.data.shorturl);
  });

  it("returns 401 without auth and 400 for an invalid URL", async () => {
    getAuth.mockReturnValue({ userId: null });
    expect((await createQr()).response.status).toBe(401);

    getAuth.mockReturnValue({ userId: "user_a" });
    expect((await createQr({ mode: "new", url: "javascript:alert(1)" })).response.status).toBe(400);
  });

  it("stores a 10,000-character destination while keeping the QR payload short", async () => {
    const destination = "https://example.com/" + "a".repeat(9980);
    expect(destination).toHaveLength(10000);
    const { response, body } = await createQr({ mode: "new", url: destination });
    expect(response.status).toBe(201);
    expect(body.data.destination).toBe(destination);
    expect(body.data.qrUrl.length).toBeLessThan(100);
    expect(body.data.qrUrl).not.toContain("example.com");
  });

  it("returns 409 for a taken alias", async () => {
    await prisma.url.create({ data: { url: "https://example.com", shorturl: "taken", userId: "user_a" } });
    const { response, body } = await createQr({ mode: "new", url: "https://example.com/other", alias: "taken" });
    expect(response.status).toBe(409);
    expect(body.error.code).toBe("ALIAS_TAKEN");
  });

  it("attaches to an owned link without creating a new one", async () => {
    const url = await prisma.url.create({ data: { url: "https://example.com", shorturl: "owned123", userId: "user_a" } });
    const { response, body } = await createQr({ mode: "existing", shorturl: "owned123" });
    expect(response.status).toBe(201);
    expect(body.data.createdShortLink).toBe(false);
    expect(await prisma.url.count()).toBe(1);

    const duplicate = await createQr({ mode: "existing", shorturl: "owned123" });
    expect(duplicate.response.status).toBe(409);
    expect(duplicate.body.error.details.qrId).toBe(body.data.id);
    expect(url.id).toBeTruthy();
  });

  it("does not expose another user's link", async () => {
    await prisma.url.create({ data: { url: "https://example.com", shorturl: "other123", userId: "user_b" } });
    const { response } = await createQr({ mode: "existing", shorturl: "other123" });
    expect(response.status).toBe(404);
  });

  it("updates destination and rejects low-contrast styles", async () => {
    const created = await createQr();
    const id = created.body.data.id;

    const updated = await PATCH(
      jsonRequest(`/api/qr/${id}`, "PATCH", { url: "https://example.com/new", style: { fgColor: "#000000", bgColor: "#FFFFFF" } }),
      { params: Promise.resolve({ id }) },
    );
    expect(updated.status).toBe(200);
    expect((await updated.json()).data.destination).toBe("https://example.com/new");

    const bad = await PATCH(
      jsonRequest(`/api/qr/${id}`, "PATCH", { style: { fgColor: "#777777", bgColor: "#888888" } }),
      { params: Promise.resolve({ id }) },
    );
    expect(bad.status).toBe(400);
  });

  it("deletes a QR-owned link and its visits", async () => {
    const created = await createQr();
    const id = created.body.data.id;
    const stored = await prisma.qrCode.findUnique({ where: { id } });
    await prisma.visit.create({ data: { urlId: stored.urlId, device: "Desktop", os: "MacOS", browser: "Safari", location: "US" } });

    const response = await DELETE(new Request(`http://localhost/api/qr/${id}`, { method: "DELETE" }), { params: Promise.resolve({ id }) });
    expect(response.status).toBe(200);
    expect(await prisma.qrCode.count()).toBe(0);
    expect(await prisma.url.count()).toBe(0);
    expect(await prisma.visit.count()).toBe(0);
  });

  it("does not change the destination when style validation fails", async () => {
    const created = await createQr();
    const id = created.body.data.id;
    const response = await PATCH(jsonRequest(`/api/qr/${id}`, "PATCH", {
      url: "https://example.com/unwanted", style: { fgColor: "#777777", bgColor: "#888888" },
    }), { params: Promise.resolve({ id }) });
    expect(response.status).toBe(400);
    const stored = await prisma.qrCode.findUnique({ where: { id }, include: { url: true } });
    expect(stored.url.url).toBe("https://example.com/page");
  });

  it("keeps an attached link when its QR is deleted", async () => {
    const url = await prisma.url.create({ data: { url: "https://example.com", shorturl: "keep123", userId: "user_a" } });
    const created = await createQr({ mode: "existing", shorturl: "keep123" });
    const id = created.body.data.id;

    const response = await DELETE(new Request(`http://localhost/api/qr/${id}`, { method: "DELETE" }), { params: Promise.resolve({ id }) });
    expect(response.status).toBe(200);
    expect(await prisma.url.findUnique({ where: { id: url.id } })).toBeTruthy();
  });

  it("rolls back the whole QR deletion when the database transaction fails", async () => {
    const created = await createQr();
    const id = created.body.data.id;
    const original = prisma.$transaction.bind(prisma);
    const transaction = vi.spyOn(prisma, "$transaction").mockImplementationOnce((work) => original(async (tx) => {
      await work(tx);
      throw new Error("Injected transaction failure");
    }));
    const logging = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const response = await DELETE(new Request(`http://localhost/api/qr/${id}`, { method: "DELETE" }), { params: Promise.resolve({ id }) });
      expect(response.status).toBe(500);
      expect(await prisma.qrCode.count()).toBe(1);
      expect(await prisma.url.count()).toBe(1);
    } finally { transaction.mockRestore(); logging.mockRestore(); }
  });

  it("lists only the signed-in user's QRs", async () => {
    await createQr({ mode: "new", url: "https://example.com/one" });
    await createQr({ mode: "new", url: "https://example.com/two" });
    await prisma.qrCode.create({
      data: {
        userId: "user_b",
        url: { create: { url: "https://example.com/other", shorturl: "other999", userId: "user_b" } },
        fgColor: "#111827",
        bgColor: "#FFFFFF",
      },
    });

    const response = await GET(new Request("http://localhost/api/qr?limit=10"));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data.items).toHaveLength(2);
  });

  it("rate limits the 11th create in a minute", async () => {
    for (let index = 0; index < 10; index += 1) {
      const { response } = await createQr({ mode: "new", url: `https://example.com/${index}` });
      expect(response.status).toBe(201);
    }
    const { response } = await createQr({ mode: "new", url: "https://example.com/11" });
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBeTruthy();
  });

  it("limits QR edits to 60 per hour", async () => {
    const { body } = await createQr();
    const id = body.data.id;
    for (let index = 0; index < 60; index += 1) {
      const response = await PATCH(jsonRequest(`/api/qr/${id}`, "PATCH", { label: `Edit ${index}` }), { params: Promise.resolve({ id }) });
      expect(response.status).toBe(200);
    }
    const response = await PATCH(jsonRequest(`/api/qr/${id}`, "PATCH", { label: "Too many" }), { params: Promise.resolve({ id }) });
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBeTruthy();
  });

  it("keeps individual reads and mutations private", async () => {
    const { body } = await createQr();
    const id = body.data.id;
    const context = { params: Promise.resolve({ id }) };
    expect((await getQr(new Request(`http://localhost/api/qr/${id}`), context)).status).toBe(200);
    getAuth.mockReturnValue({ userId: "user_b" });
    expect((await getQr(new Request(`http://localhost/api/qr/${id}`), context)).status).toBe(404);
    expect((await PATCH(jsonRequest(`/api/qr/${id}`, "PATCH", { label: "Stolen" }), context)).status).toBe(404);
    expect((await DELETE(new Request(`http://localhost/api/qr/${id}`, { method: "DELETE" }), context)).status).toBe(404);
    expect((await getQr(new Request("http://localhost/api/qr/bad"), { params: Promise.resolve({ id: "bad" }) })).status).toBe(404);
    expect((await prisma.qrCode.findUnique({ where: { id } })).userId).toBe("user_a");
  });

  it("paginates without losing the next page when the cursor QR is deleted", async () => {
    for (let index = 0; index < 3; index += 1) await createQr({ mode: "new", url: `https://example.com/${index}` });
    const first = await (await GET(new Request("http://localhost/api/qr?limit=1.5"))).json();
    expect(first.data.items).toHaveLength(1);
    await prisma.qrCode.delete({ where: { id: first.data.nextCursor } });
    const second = await (await GET(new Request(`http://localhost/api/qr?limit=2&cursor=${first.data.nextCursor}`))).json();
    expect(second.data.items).toHaveLength(2);
    expect(second.data.nextCursor).toBeNull();
  });
});

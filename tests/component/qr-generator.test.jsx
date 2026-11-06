import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QrGenerator } from "@/components/qr/QrGenerator";
import { QrWorkspace } from "@/components/qr/QrWorkspace";
import { createQrSchema } from "@/lib/qr/schemas";

const auth = vi.hoisted(() => ({ signedIn: true, openSignIn: vi.fn() }));
vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ isSignedIn: auth.signedIn, isLoaded: true, user: auth.signedIn ? { id: "user_a" } : null }),
  useClerk: () => ({ openSignIn: auth.openSignIn }),
}));

const qr = {
  id: "012345678901234567890123", destination: "https://example.com/old", label: "Old label",
  shorturl: "old-link", shortUrl: "https://shortlys.example/old-link", qrUrl: "https://shortlys.example/old-link?src=qr",
  style: { fgColor: "#111827", bgColor: "#FFFFFF", size: 1024, level: "M" },
};

beforeEach(() => {
  auth.signedIn = true;
  auth.openSignIn.mockReset();
  vi.stubGlobal("fetch", vi.fn());
});

describe("QR generator", () => {
  it("sends a new QR request accepted by the API schema", async () => {
    fetch.mockImplementationOnce(async (_url, options) => {
      const parsed = createQrSchema.safeParse(JSON.parse(options.body));
      return parsed.success
        ? Response.json({ data: qr }, { status: 201 })
        : Response.json({ error: { message: "Invalid creation request." } }, { status: 400 });
    });
    render(<QrGenerator initialUrl="https://example.com/menu" />);
    fireEvent.submit(screen.getByRole("button", { name: "Create QR code" }).closest("form"));
    await screen.findByText("QR code ready");
  });

  it("shows a labeled preview before creation without enabling downloads", () => {
    render(<QrGenerator initialUrl="https://example.com/menu" />);
    expect(screen.getByText("Preview")).toBeVisible();
    expect(screen.getByTitle("QR code")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "PNG" })).not.toBeInTheDocument();
  });

  it("preserves entered input while opening sign in", () => {
    auth.signedIn = false;
    render(<QrGenerator />);
    fireEvent.change(screen.getByLabelText("Destination URL"), { target: { value: "https://example.com/menu" } });
    fireEvent.submit(screen.getByRole("button", { name: "Create QR code" }).closest("form"));
    expect(auth.openSignIn).toHaveBeenCalledOnce();
    expect(screen.getByLabelText("Destination URL")).toHaveValue("https://example.com/menu");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("preserves the draft when the account becomes signed in", () => {
    auth.signedIn = false;
    fetch.mockResolvedValue(Response.json({ data: { items: [], nextCursor: null } }));
    const view = render(<QrWorkspace />);
    fireEvent.change(screen.getByLabelText("Destination URL"), { target: { value: "https://example.com/keep-this" } });
    auth.signedIn = true;
    view.rerender(<QrWorkspace />);
    expect(screen.getByLabelText("Destination URL")).toHaveValue("https://example.com/keep-this");
  });

  it("sends an empty label to clear the saved name", async () => {
    fetch.mockResolvedValueOnce(Response.json({ data: qr }));
    fetch.mockResolvedValueOnce(Response.json({ data: { ...qr, label: null } }));
    render(<QrGenerator editId={qr.id} />);
    await screen.findByDisplayValue("Old label");
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "" } });
    fireEvent.submit(screen.getByRole("button", { name: "Save changes" }).closest("form"));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(JSON.parse(fetch.mock.calls[1][1].body).label).toBe("");
    await screen.findByText("QR code ready");
  });

  it("keeps failed edits from becoming blank save forms", async () => {
    fetch.mockResolvedValueOnce(Response.json({ error: { message: "QR code not found." } }, { status: 404 }));
    render(<QrGenerator editId={qr.id} />);
    await screen.findByText("QR code not found.");
    expect(screen.queryByRole("button", { name: "Save changes" })).not.toBeInTheDocument();
  });

  it("shows API failures while retaining the destination", async () => {
    fetch.mockResolvedValueOnce(Response.json({ error: { message: "That alias is taken." } }, { status: 409 }));
    render(<QrGenerator initialUrl="https://example.com/menu" />);
    fireEvent.submit(screen.getByRole("button", { name: "Create QR code" }).closest("form"));
    await screen.findByText("That alias is taken.");
    expect(screen.getByLabelText("Destination URL")).toHaveValue("https://example.com/menu");
  });
});

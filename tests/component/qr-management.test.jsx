import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QrManageSection } from "@/components/qr/QrManageSection";

vi.mock("@clerk/nextjs", () => ({ useUser: () => ({ isSignedIn: true, isLoaded: true }) }));
const qr = { id: "012345678901234567890123", label: "Menu", destination: "https://example.com/menu", shorturl: "menu-link", shortUrl: "http://localhost/menu-link", qrUrl: "http://localhost/menu-link?src=qr", style: { fgColor: "#111827", bgColor: "#FFFFFF", level: "M", size: 1024 }, scanCount: 4, createdShortLink: true };

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; };
  vi.stubGlobal("fetch", vi.fn());
});

describe("QR management", () => {
  it("refreshes saved records and filters loaded cards", async () => {
    fetch.mockResolvedValueOnce(Response.json({ data: { items: [], nextCursor: null } }));
    const view = render(<QrManageSection revision={0} />);
    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    fetch.mockResolvedValueOnce(Response.json({ data: { items: [qr], nextCursor: null } }));
    view.rerender(<QrManageSection revision={1} />);
    await screen.findByText("Menu");
    fireEvent.change(screen.getByLabelText("Search QR codes"), { target: { value: "missing" } });
    expect(screen.queryByText("Menu")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Search QR codes"), { target: { value: "menu-link" } });
    expect(screen.getByText("Menu")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "New QR" }).querySelector("button")).toBeNull();
  });

  it("warns before deleting a printed link and removes its card on success", async () => {
    fetch.mockResolvedValueOnce(Response.json({ data: { items: [qr], nextCursor: null } }));
    fetch.mockResolvedValueOnce(Response.json({ data: { id: qr.id } }));
    render(<QrManageSection />);
    await screen.findByText("Menu");
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = screen.getByRole("dialog", { name: "Delete QR code?" });
    expect(within(dialog).getByText(/Printed codes stop working/)).toBeVisible();
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(screen.queryByText("Menu")).not.toBeInTheDocument());
    expect(fetch.mock.calls[1][1].method).toBe("DELETE");
  });
});

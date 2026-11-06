import { expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ShortenPage from "@/app/shorten/page";

vi.mock("@clerk/nextjs", () => ({ useUser: () => ({ isSignedIn: true }), useClerk: () => ({ openSignIn: vi.fn() }) }));

it("lets the server generate the alias when none is specified", async () => {
  vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ success: true, shorturl: "server123", url: "https://example.com/menu" })));
  render(<ShortenPage />);
  fireEvent.change(screen.getByLabelText("Long URL"), { target: { value: "example.com/menu" } });
  fireEvent.submit(screen.getByLabelText("Long URL").closest("form"));
  await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ url: "https://example.com/menu" });
});

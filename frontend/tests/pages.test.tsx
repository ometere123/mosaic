import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import HomePage from "@/app/page";
import DocsPage from "@/app/docs/page";
import ProfilePage from "@/app/profile/page";
import { AppShell } from "@/components/app-shell";
import { Providers } from "@/components/providers";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

afterEach(() => cleanup());

describe("release information architecture", () => {
  it("renders the product homepage with both primary calls to action", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { name: /Fund the outcome/i })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Launch a mission" })[0]).toHaveAttribute("href", "/launch");
    expect(screen.getByRole("link", { name: /Explore missions/i })).toHaveAttribute("href", "/missions");
    expect(screen.getByText("TERMINAL OBJECTIVE STATUS")).toBeInTheDocument();
    expect(screen.getByText("CLAIMANT OUTCOME")).toBeInTheDocument();
  });

  it("renders structured docs navigation and core protocol sections", () => {
    render(<DocsPage />);
    expect(screen.getByRole("heading", { name: /Fund software outcomes/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Lifecycle" })).toHaveAttribute("href", "#lifecycle");
    expect(screen.getByRole("heading", { name: "Settlement truth" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Consensus design" })).toBeInTheDocument();
    expect(screen.getByText(/settlement-state semantics with an atomic terminal freeze/i)).toBeInTheDocument();
    expect(screen.getByText(/one public contribution can receive value from multiple independently funded missions/i)).toBeInTheDocument();
    expect(screen.getByText(/protocol policy, not claims of mathematical optimality/i)).toBeInTheDocument();
    expect(screen.getByText(/0xeeb7eD7e0684514e71973f221Fce271D190FA637/i)).toBeInTheDocument();
    expect(screen.getByText(/hardened release candidate is deployed on GenLayer Studionet/i)).toBeInTheDocument();
  });

  it("keeps primary navigation on product routes", () => {
    render(<Providers><AppShell><div>content</div></AppShell></Providers>);
    expect(document.querySelector('img.brand-mark[src="/mosaic-mark.svg"]')).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mosaic home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Missions" })).toHaveAttribute("href", "/missions");
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute("href", "/docs");
    expect(screen.getByRole("link", { name: "Launch" })).toHaveAttribute("href", "/launch");
    expect(screen.getByRole("link", { name: "Profile" })).toHaveAttribute("href", "/profile");
  });

  it("renders the wallet-centred profile distinction", () => {
    render(<Providers><ProfilePage /></Providers>);
    expect(screen.getByText("On-chain participation", { exact: true })).toBeInTheDocument();
    expect(screen.getByText(/Stored locally in this browser/i)).toBeInTheDocument();
  });
});

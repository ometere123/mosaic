import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import HomePage from "@/app/page";
import DocsPage from "@/app/docs/page";
import { AppShell } from "@/components/app-shell";
import { Providers } from "@/components/providers";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

afterEach(() => cleanup());

describe("release information architecture", () => {
  it("renders the product homepage with both primary calls to action", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { name: /Fund the outcome/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Launch a mission/i })).toHaveAttribute("href", "/launch");
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
  });

  it("keeps primary navigation on product routes", () => {
    render(<Providers><AppShell><div>content</div></AppShell></Providers>);
    expect(screen.getByRole("link", { name: "Missions" })).toHaveAttribute("href", "/missions");
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute("href", "/docs");
    expect(screen.getByRole("link", { name: "Launch" })).toHaveAttribute("href", "/launch");
    expect(screen.getByRole("link", { name: "Earnings" })).toHaveAttribute("href", "/earnings");
  });
});

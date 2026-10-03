"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { WalletControl } from "./wallet-control";
import { TransactionDrawer } from "./transaction-drawer";
import { NETWORK } from "@/lib/constants";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const nav = [{ href: "/missions", label: "Missions" }, { href: "/launch", label: "Launch" }, { href: "/docs", label: "Docs" }, { href: "/profile", label: "Profile" }];
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Mosaic home"><Image className="brand-mark" src="/mosaic-mark.svg" width={30} height={30} alt="" aria-hidden="true" priority /><span>MOSAIC</span></Link>
        <nav className="nav" aria-label="Primary navigation">
          {nav.map((item) => <Link key={item.href} href={item.href} className={pathname === item.href ? "nav-link active" : "nav-link"}>{item.label}</Link>)}
        </nav>
        <div className="top-actions"><span className="network-chip">{NETWORK.shortName} · {NETWORK.chainId}</span><WalletControl /></div>
      </header>
      {children}
      <TransactionDrawer />
    </div>
  );
}

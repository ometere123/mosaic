"use client";
import { WalletProvider } from "@/hooks/use-wallet";
import { TransactionProvider } from "@/hooks/use-transactions";

export function Providers({ children }: { children: React.ReactNode }) {
  return <WalletProvider><TransactionProvider>{children}</TransactionProvider></WalletProvider>;
}

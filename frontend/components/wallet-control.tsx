"use client";

import { useWallet } from "@/hooks/use-wallet";
import { shortHex } from "@/lib/format";
import { NETWORK } from "@/lib/constants";

export function WalletControl() {
  const wallet = useWallet();
  if (!wallet.available) return <span className="wallet-missing">No wallet</span>;
  if (!wallet.connected) return <button className="button compact" onClick={() => void wallet.connect()} disabled={wallet.connecting}>{wallet.connecting ? "Connecting…" : "Connect wallet"}</button>;
  return (
    <div className="wallet-cluster">
      {!wallet.correctNetwork && <button className="network-warning" onClick={() => void wallet.switchNetwork()}>Switch to {NETWORK.shortName}</button>}
      <span className="address-chip">{shortHex(wallet.address ?? "")}</span>
      <button className="text-button" onClick={() => void wallet.disconnect()}>Disconnect</button>
    </div>
  );
}

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page narrow-page">
      <div className="empty-state">
        <span className="eyebrow">Not found</span>
        <h1>This route is not part of the mission ledger.</h1>
        <Link className="button" href="/">Return to missions</Link>
      </div>
    </main>
  );
}

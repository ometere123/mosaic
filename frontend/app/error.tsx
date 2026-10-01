"use client";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="page narrow-page">
      <div className="empty-state">
        <span className="eyebrow">Interface error</span>
        <h1>This view could not be completed.</h1>
        <p>{error.message || "An unexpected frontend error occurred."}</p>
        <button className="button" onClick={reset}>Retry view</button>
      </div>
    </main>
  );
}

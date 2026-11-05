"use client";

export default function GlobalError({ reset }) {
  return (
    <html lang="en">
      <body>
        <div style={{ display: "grid", minHeight: "100vh", placeItems: "center", fontFamily: "sans-serif" }}>
          <div style={{ textAlign: "center" }}>
            <h1>Something went wrong.</h1>
            <button onClick={reset} style={{ marginTop: 16 }}>Retry</button>
          </div>
        </div>
      </body>
    </html>
  );
}

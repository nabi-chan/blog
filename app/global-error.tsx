"use client";

export default function GlobalError() {
  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          background: "#fff8ec",
          color: "#4b3f39",
          fontFamily: "sans-serif",
        }}
      >
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: 24,
          }}
        >
          <section
            style={{
              maxWidth: 640,
              border: "1px solid rgba(75,63,57,0.16)",
              borderRadius: 32,
              background: "#fffdf7",
              padding: 36,
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 20 }}>나비 블로그를 잠시 펼칠 수 없어요.</p>
            <p style={{ color: "#8c7a70" }}>잠시 후 다시 시도해주세요.</p>
          </section>
        </main>
      </body>
    </html>
  );
}

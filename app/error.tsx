"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="site-shell py-24">
      <section className="memo-card mx-auto max-w-2xl text-center">
        <span className="sticker sticker-peach mx-auto">ERROR</span>
        <h1 className="mt-6 text-4xl text-(--ink)">작은 문제가 생겼어요</h1>
        <p className="mt-5 text-2xl leading-10 text-(--muted)">
          잉크가 잠깐 번진 것 같아요. 다시 펼쳐보면 괜찮아질 수 있지 않을까요?
        </p>
        <button className="nav-pill focus-ring mt-8" onClick={reset}>
          다시 펼쳐보기
        </button>
      </section>
    </main>
  );
}

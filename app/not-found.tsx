import Link from "next/link";
import { routes } from "@/src/site";

export default function NotFound() {
  return (
    <main className="site-shell py-24">
      <section className="memo-card mx-auto max-w-2xl text-center">
        <span className="sticker sticker-lavender mx-auto">404</span>
        <h1 className="mt-6 text-4xl text-(--ink)">
          잃어버린 메모를 찾고 있어요
        </h1>
        <p className="mt-5 text-2xl leading-10 text-(--muted)">
          이 페이지는 책상 아래로 떨어졌거나, 아직 쓰이지 않은 기록일지도
          몰라요.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link className="nav-pill focus-ring" href={routes.home}>
            홈으로
          </Link>
          <Link className="nav-pill focus-ring" href={routes.posts}>
            블로그
          </Link>
          <Link className="nav-pill focus-ring" href={routes.notes}>
            토막글
          </Link>
        </div>
      </section>
    </main>
  );
}

import Link from "next/link";
import { getSortedPostsData } from "@/lib/posts";

export const metadata = {
  title: "블로그 - 성남시 생활 정보",
  description: "성남시의 유용한 생활 꿀팁과 소식을 전해드리는 블로그입니다.",
};

export default function BlogListPage() {
  const posts = getSortedPostsData();

  // 오늘 날짜 표시용
  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-amber-50/40 text-neutral-800 font-sans selection:bg-amber-200">
      {/* 상단 헤더 영역 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-amber-100/60 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏡</span>
            <Link href="/" className="text-xl font-bold tracking-tight text-amber-900 sm:text-2xl hover:text-amber-700 transition-colors">
              성남시 생활 정보
            </Link>
          </div>
          <nav className="flex gap-4 text-sm font-medium text-neutral-600">
            <Link href="/" className="hover:text-amber-600 transition-colors">홈</Link>
            <Link href="/blog" className="hover:text-amber-600 transition-colors">블로그</Link>
            <Link href="/about" className="hover:text-amber-600 transition-colors">소개</Link>
          </nav>
        </div>
      </header>

      {/* 히어로 영역 */}
      <section className="bg-gradient-to-b from-amber-100/50 to-transparent py-12 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1.5 rounded-full mb-3">
            생활 밀착형 꿀팁 📝
          </span>
          <h2 className="text-3xl font-extrabold text-neutral-900 sm:text-4xl mb-4 leading-tight">
            성남 생활 백서 블로그
          </h2>
          <p className="text-base text-neutral-600 leading-relaxed max-w-xl mx-auto">
            성남시의 소소하고 유용한 팁부터 맛집, 여행 정보까지 유익한 이야기를 만나보세요.
          </p>
        </div>
      </section>

      {/* 메인 콘텐츠 영역 */}
      <main className="max-w-4xl mx-auto px-4 pb-20">
        <div className="flex items-center gap-2.5 mb-8 border-b border-amber-200/60 pb-3">
          <span className="text-2xl">✍️</span>
          <h3 className="text-2xl font-bold text-neutral-900">전체 글 목록</h3>
          <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-medium ml-1">
            {posts.length}개
          </span>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-amber-100/80 p-8 shadow-sm">
            <p className="text-neutral-500 text-lg">아직 작성된 블로그 글이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="group bg-white rounded-2xl border border-amber-100/80 p-6 shadow-sm hover:shadow-md hover:border-amber-200 hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="bg-amber-100/70 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-md">
                    {post.category}
                  </span>
                  <span className="text-xs text-neutral-400">|</span>
                  <span className="text-xs text-neutral-500 font-medium">{post.date}</span>
                </div>

                <Link href={`/blog/${post.slug}`} className="block">
                  <h4 className="text-xl font-bold text-neutral-900 group-hover:text-amber-700 transition-colors mb-2 leading-tight">
                    {post.title}
                  </h4>
                </Link>

                <p className="text-neutral-600 text-sm leading-relaxed mb-4 line-clamp-2">
                  {post.summary}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-neutral-50 border border-neutral-100 text-neutral-500 text-xs px-2 py-0.5 rounded-md"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors gap-1"
                >
                  더 읽어보기 <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </Link>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* 푸터 영역 */}
      <footer className="bg-neutral-950 text-neutral-400 py-12 px-4 border-t border-neutral-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-white font-bold">
              <span>🏡</span>
              <span>우리 동네 생활 정보</span>
            </div>
            <p className="text-xs text-neutral-500">
              데이터 출처: 공공데이터포털(data.go.kr) | 본 서비스는 공공데이터를 기반으로 생성된 정보를 제공합니다.
            </p>
          </div>
          <div className="text-center md:text-right space-y-1">
            <p>최종 업데이트 날짜: <span className="text-white font-medium">{today}</span></p>
            <p className="text-xs text-neutral-600">© 2026 my-city-info. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

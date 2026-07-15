import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getAllPostSlugs, getPostData } from "@/lib/posts";
import fs from "fs";
import path from "path";
import AdBanner from "@/components/AdBanner";

export async function generateStaticParams() {
  const posts = getAllPostSlugs();
  return posts.map((post) => ({
    slug: post.params.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostData(slug);
  if (!post) {
    return {
      title: "글을 찾을 수 없습니다",
      description: "글을 찾을 수 없습니다",
    };
  }
  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      type: "article",
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostData(slug);

  if (!post) {
    notFound();
  }

  // city-info.json 파일에서 원문 출처 매칭
  const cityInfoPath = path.join(process.cwd(), "public", "data", "city-info.json");
  let sourceLink = "";
  try {
    if (fs.existsSync(cityInfoPath)) {
      const fileContent = fs.readFileSync(cityInfoPath, "utf8");
      const cityInfo = JSON.parse(fileContent);
      const matchedItem = cityInfo.find((item: any) => 
        post.title.includes(item.name) || 
        item.name.split(' ').some((word: string) => word.length > 1 && post.title.includes(word))
      );
      if (matchedItem && matchedItem.link && matchedItem.link !== "#") {
        sourceLink = matchedItem.link;
      }
    }
  } catch (e) {
    console.error("출처 링크 매칭 에러:", e);
  }

  // 오늘 날짜 표시용
  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const blogPostingSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "datePublished": post.date,
    "description": post.summary,
    "author": {
      "@type": "Organization",
      "name": "성남시 생활 정보"
    },
    "publisher": {
      "@type": "Organization",
      "name": "성남시 생활 정보",
      "logo": {
        "@type": "ImageObject",
        "url": "https://my-city-info.pages.dev/favicon.ico"
      }
    }
  };

  const detailBreadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "홈",
        "item": "https://my-city-info.pages.dev"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "블로그",
        "item": "https://my-city-info.pages.dev/blog"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": post.title,
        "item": `https://my-city-info.pages.dev/blog/${post.slug}`
      }
    ]
  };

  return (
    <div className="min-h-screen bg-amber-50/40 text-neutral-800 font-sans selection:bg-amber-200 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(detailBreadcrumbSchema) }}
      />
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-amber-100/60 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏡</span>
            <Link href="/" className="text-lg font-bold text-amber-900 hover:text-amber-700 transition-colors">
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

      {/* 본문 콘텐츠 */}
      <main className="max-w-3xl mx-auto px-4 mt-8">
        {/* 뒤로가기 버튼 */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-amber-700 font-medium transition-colors mb-6"
        >
          <span>←</span>
          <span>목록으로 돌아가기</span>
        </Link>

        {/* 블로그 포스트 카드 */}
        <article className="bg-white rounded-3xl border border-amber-100/80 p-6 md:p-10 shadow-sm">
          {/* 카테고리 및 날짜 */}
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-amber-100/70 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full">
              {post.category}
            </span>
            <span className="text-xs text-neutral-400">|</span>
            <span className="text-xs text-neutral-500 font-medium">{post.date}</span>
          </div>

          {/* 제목 */}
          <h2 className="text-2xl md:text-3xl font-extrabold text-neutral-900 leading-tight mb-6">
            {post.title}
          </h2>

          {/* 태그 리스트 */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-8 border-b border-neutral-100 pb-6">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-neutral-50 border border-neutral-100 text-neutral-500 text-xs px-2 py-0.5 rounded-md"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 마크다운 본문 렌더링 */}
          <div className="prose prose-amber max-w-none prose-headings:font-bold prose-headings:text-neutral-900 prose-p:leading-relaxed prose-a:text-amber-600 prose-img:rounded-2xl mb-8">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {post.content}
            </ReactMarkdown>
          </div>

          <AdBanner />

          {/* E-E-A-T 최적화 영역 */}
          <div className="mt-12 pt-6 border-t border-amber-100 space-y-4 text-sm text-neutral-600">
            <p className="flex items-center gap-2">
              <span className="font-semibold text-neutral-700">🕒 최종 업데이트:</span>
              <span>{post.date}</span>
            </p>

            {sourceLink && (
              <p className="flex items-center gap-2">
                <span className="font-semibold text-neutral-700">🔗 원문 출처:</span>
                <a href={sourceLink} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-800 underline transition-colors">
                  공식 홈페이지 바로가기
                </a>
              </p>
            )}

            <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100/60 text-xs text-neutral-500 leading-relaxed">
              💡 이 글은 공공데이터포털(data.go.kr)의 정보를 바탕으로 AI가 작성하였습니다. 정확한 내용은 원문 링크를 통해 확인해주세요.
            </div>
          </div>
        </article>
      </main>

      {/* 푸터 영역 */}
      <footer className="bg-neutral-950 text-neutral-400 py-12 px-4 border-t border-neutral-800 mt-20">
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

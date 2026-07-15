import fs from "fs/promises";
import path from "path";
import Link from "next/link";
import AdBanner from "@/components/AdBanner";

interface LocalInfoItem {
  id: string;
  name: string;
  category: "행사" | "혜택";
  startDate: string;
  endDate: string;
  location: string;
  target: string;
  summary: string;
  link: string;
}

export default async function Home() {
  // 샘플 데이터 파일 읽어오기 (서버 사이드에서 직접 읽음)
  const filePath = path.join(process.cwd(), "public", "data", "city-info.json");
  let items: LocalInfoItem[] = [];
  
  try {
    const fileContent = await fs.readFile(filePath, "utf8");
    items = JSON.parse(fileContent);
  } catch (error) {
    console.error("데이터 파일을 읽는 도중 오류가 발생했습니다:", error);
  }

  // 카테고리별 데이터 분류
  const events = items.filter((item) => item.category === "행사");
  const benefits = items.filter((item) => item.category === "혜택");

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
            <h1 className="text-xl font-bold tracking-tight text-amber-900 sm:text-2xl">
              성남시 생활 정보
            </h1>
          </div>
          <nav className="flex gap-4 text-sm font-medium text-neutral-600">
            <a href="#events" className="hover:text-amber-600 transition-colors">행사/축제</a>
            <a href="#benefits" className="hover:text-amber-600 transition-colors">지원금/혜택</a>
            <Link href="/blog" className="hover:text-amber-600 transition-colors">블로그</Link>
            <Link href="/about" className="hover:text-amber-600 transition-colors">소개</Link>
          </nav>
        </div>
      </header>

      {/* 히어로 영역 */}
      <section className="bg-gradient-to-b from-amber-100/50 to-transparent py-12 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1.5 rounded-full mb-3">
            우리 동네 소식통 📢
          </span>
          <h2 className="text-3xl font-extrabold text-neutral-900 sm:text-4xl mb-4 leading-tight">
            성남시의 최신 행사 정보와<br />
            나에게 꼭 맞는 혜택을 한눈에!
          </h2>
          <p className="text-base text-neutral-600 leading-relaxed max-w-xl mx-auto">
            공공데이터포털에서 엄선한 우리 동네 소식과 정부 혜택을 매일 확인해 보세요.
            이웃들과 공유하고 혜택도 놓치지 마세요!
          </p>
        </div>
      </section>

      {/* 메인 콘텐츠 영역 */}
      <main className="max-w-6xl mx-auto px-4 pb-20 space-y-16">
        
        {/* 1. 이번 달 행사/축제 섹션 */}
        <section id="events" className="scroll-mt-20">
          <div className="flex items-center gap-2.5 mb-6 border-b border-amber-200/60 pb-3">
            <span className="text-2xl">🌸</span>
            <h3 className="text-2xl font-bold text-neutral-900">이번 달 행사 / 축제</h3>
            <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-medium ml-1">
              {events.length}건
            </span>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => {
              const eventSchema = {
                "@context": "https://schema.org",
                "@type": "Event",
                "name": event.name,
                "startDate": event.startDate,
                "endDate": event.endDate,
                "location": {
                  "@type": "Place",
                  "name": event.location,
                  "address": {
                    "@type": "PostalAddress",
                    "addressLocality": "성남시",
                    "addressRegion": "경기도",
                    "addressCountry": "KR"
                  }
                },
                "description": event.summary
              };
              return (
                <div 
                  key={event.id}
                  className="group flex flex-col bg-white rounded-2xl border border-amber-100/80 p-6 shadow-sm hover:shadow-md hover:border-amber-200 hover:-translate-y-0.5 transition-all duration-200"
                >
                  <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }}
                  />
                <div className="flex justify-between items-start gap-2 mb-3">
                  <span className="bg-orange-50 text-orange-700 text-xs font-semibold px-2.5 py-1 rounded-md">
                    {event.category}
                  </span>
                  <span className="text-xs text-neutral-500 font-medium">
                    📍 {event.location}
                  </span>
                </div>
                
                <h4 className="text-lg font-bold text-neutral-900 group-hover:text-amber-700 transition-colors mb-2">
                  {event.name}
                </h4>
                
                <p className="text-sm text-neutral-600 line-clamp-3 mb-4 flex-grow">
                  {event.summary}
                </p>

                <div className="border-t border-neutral-100 pt-4 mt-auto space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">일정</span>
                    <span className="font-semibold text-neutral-700">
                      {event.startDate === event.endDate 
                        ? event.startDate 
                        : `${event.startDate} ~ ${event.endDate}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">대상</span>
                    <span className="font-semibold text-neutral-700 text-right truncate max-w-[180px]">
                      {event.target}
                    </span>
                  </div>
                </div>

                <Link 
                  href="/blog"
                  className="mt-4 block w-full text-center bg-amber-500 text-white font-semibold py-2.5 rounded-xl hover:bg-amber-600 transition-colors text-sm shadow-sm"
                >
                  자세히 보기
                </Link>
              </div>
            );
          })}
          </div>
        </section>

        <AdBanner />

        {/* 2. 지원금/혜택 섹션 */}
        <section id="benefits" className="scroll-mt-20">
          <div className="flex items-center gap-2.5 mb-6 border-b border-amber-200/60 pb-3">
            <span className="text-2xl">💰</span>
            <h3 className="text-2xl font-bold text-neutral-900">지역 지원금 / 혜택</h3>
            <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-medium ml-1">
              {benefits.length}건
            </span>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit) => {
              const serviceSchema = {
                "@context": "https://schema.org",
                "@type": "GovernmentService",
                "name": benefit.name,
                "description": benefit.summary,
                "provider": {
                  "@type": "GovernmentOrganization",
                  "name": benefit.location || "성남시"
                }
              };
              return (
                <div 
                  key={benefit.id}
                  className="group flex flex-col bg-white rounded-2xl border border-amber-100/80 p-6 shadow-sm hover:shadow-md hover:border-amber-200 hover:-translate-y-0.5 transition-all duration-200"
                >
                  <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
                  />
                <div className="flex justify-between items-start gap-2 mb-3">
                  <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-md">
                    {benefit.category}
                  </span>
                  <span className="text-xs text-neutral-500 font-medium">
                    📍 {benefit.location}
                  </span>
                </div>
                
                <h4 className="text-lg font-bold text-neutral-900 group-hover:text-amber-700 transition-colors mb-2">
                  {benefit.name}
                </h4>
                
                <p className="text-sm text-neutral-600 line-clamp-3 mb-4 flex-grow">
                  {benefit.summary}
                </p>

                <div className="border-t border-neutral-100 pt-4 mt-auto space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">기한</span>
                    <span className="font-semibold text-neutral-700">
                      {benefit.startDate === "2026-01-01" && benefit.endDate === "2026-12-31" 
                        ? "상시 접수" 
                        : `${benefit.startDate} ~ ${benefit.endDate}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">지원 대상</span>
                    <span className="font-semibold text-neutral-700 text-right truncate max-w-[180px]" title={benefit.target}>
                      {benefit.target}
                    </span>
                  </div>
                </div>

                <Link 
                  href="/blog"
                  className="mt-4 block w-full text-center bg-emerald-600 text-white font-semibold py-2.5 rounded-xl hover:bg-emerald-700 transition-colors text-sm shadow-sm"
                >
                  혜택 신청하기
                </Link>
              </div>
            );
          })}
          </div>
        </section>

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
            <p>최지막 업데이트 날짜: <span className="text-white font-medium">{today}</span></p>
            <p className="text-xs text-neutral-600">© 2026 my-city-info. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

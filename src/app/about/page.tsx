import Link from "next/link";

export const metadata = {
  title: "소개 - 성남시 생활 정보",
  description: "성남시 생활 정보 서비스의 기획 목적, 데이터 출처 및 운영 방식에 대해 소개합니다.",
};

export default function AboutPage() {
  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-amber-50/40 text-neutral-800 font-sans selection:bg-amber-200 pb-20">
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
            <Link href="/about" className="text-amber-600 font-semibold transition-colors">소개</Link>
          </nav>
        </div>
      </header>

      {/* 히어로 영역 */}
      <section className="bg-gradient-to-b from-amber-100/50 to-transparent py-12 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1.5 rounded-full mb-3">
            서비스 소개 📢
          </span>
          <h2 className="text-3xl font-extrabold text-neutral-900 sm:text-4xl mb-4 leading-tight">
            성남시 생활 정보는 무엇인가요?
          </h2>
          <p className="text-base text-neutral-600 leading-relaxed max-w-xl mx-auto">
            성남시민분들과 지역 방문객분들을 위해 꼭 필요한 행사, 축제 정보와 유용한 정부 지원금/혜택 정보를 보기 쉽게 정리해 드리는 공간입니다.
          </p>
        </div>
      </section>

      {/* 메인 콘텐츠 영역 */}
      <main className="max-w-3xl mx-auto px-4 mt-8">
        <div className="bg-white rounded-3xl border border-amber-100/80 p-8 md:p-12 shadow-sm space-y-10">
          
          {/* 1. 운영 목적 */}
          <section className="space-y-4">
            <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
              🎯 서비스 운영 목적
            </h3>
            <p className="text-neutral-600 leading-relaxed text-sm md:text-base">
              공공기관에서 제공하는 다양한 지원금과 동네 행사 소식들은 알면 큰 힘이 되지만, 복잡한 포털 사이트 구석구석을 찾아보지 않으면 놓치기 쉽습니다. 
              성남시 생활 정보는 이러한 불편을 해소하고, <strong>지역 주민들이 필요한 정보를 한눈에 발견하고 간편하게 혜택을 누릴 수 있도록</strong> 돕기 위해 시작되었습니다.
            </p>
          </section>

          <hr className="border-amber-100/60" />

          {/* 2. 데이터 출처 */}
          <section className="space-y-4">
            <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
              📊 공공데이터 기반 정보 제공
            </h3>
            <p className="text-neutral-600 leading-relaxed text-sm md:text-base">
              본 서비스는 행정안전부 및 지방자치단체가 공개한 대한민국 <strong>공공데이터포털(data.go.kr)</strong>의 신뢰성 높은 데이터를 공식 API를 통해 수집하고 있습니다. 
              수집된 정보를 가공 및 정리하여 이해하기 쉬운 가이드 형태로 시민 여러분들께 전달합니다.
            </p>
          </section>

          <hr className="border-amber-100/60" />

          {/* 3. 콘텐츠 생성 방식 */}
          <section className="space-y-4">
            <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
              🤖 AI 협업을 통한 효율적인 정보 전달
            </h3>
            <p className="text-neutral-600 leading-relaxed text-sm md:text-base">
              보다 빠르고 직관적인 안내를 위해 수집된 원자료(Raw Data)를 기반으로 <strong>인공지능(AI) 기술을 활용해 블로그 콘텐츠를 초안 작성 및 구조화</strong>하고 있습니다. 
              시민 여러분께서 복잡한 행정 용어에 가로막히지 않고 혜택을 바로 이해하실 수 있도록 다듬어서 제공하고 있으나, 신청 전 최종 정책 조건 등은 반드시 각 글에 표기된 <strong>원문 출처(공식 홈페이지)</strong>를 통해 다시 한 번 확인하시길 권장합니다.
            </p>
          </section>

        </div>
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

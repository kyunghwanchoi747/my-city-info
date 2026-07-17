import Link from "next/link";

export const metadata = {
  title: "개인정보처리방침 - 성남시 생활 정보",
  description: "성남시 생활 정보 서비스의 개인정보처리방침을 안내합니다.",
};

export default function PrivacyPage() {
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
            <Link href="/about" className="hover:text-amber-600 transition-colors">소개</Link>
          </nav>
        </div>
      </header>

      {/* 히어로 영역 */}
      <section className="bg-gradient-to-b from-amber-100/50 to-transparent py-12 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1.5 rounded-full mb-3">
            법적 고지 🔒
          </span>
          <h1 className="text-3xl font-extrabold text-neutral-900 sm:text-4xl mb-4 leading-tight">
            개인정보처리방침
          </h1>
          <p className="text-base text-neutral-600 leading-relaxed max-w-xl mx-auto">
            본 사이트가 수집하는 정보의 종류와 그 사용 목적을 투명하게 안내합니다.
          </p>
        </div>
      </section>

      {/* 메인 콘텐츠 영역 */}
      <main className="max-w-3xl mx-auto px-4 mt-8">
        <div className="bg-white rounded-3xl border border-amber-100/80 p-8 md:p-12 shadow-sm space-y-10">

          {/* 시행일 */}
          <p className="text-sm text-neutral-500">
            <strong>시행일:</strong> 2026년 7월 17일
          </p>

          <hr className="border-amber-100/60" />

          {/* 1. 수집하는 정보 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
              📋 1. 수집하는 정보
            </h2>
            <p className="text-neutral-600 leading-relaxed text-sm md:text-base">
              본 사이트(<strong>성남시 생활 정보</strong>)는 회원가입, 로그인, 이름, 이메일 등{" "}
              <strong>이용자의 개인정보를 직접 수집하지 않습니다.</strong>
            </p>
            <p className="text-neutral-600 leading-relaxed text-sm md:text-base">
              다만, 아래와 같이 제3자 서비스(Google)를 통해{" "}
              <strong>쿠키(Cookie) 및 유사 기술을 통한 자동 수집 정보</strong>가 발생할 수 있습니다.
              쿠키란 웹사이트 방문 시 브라우저에 저장되는 작은 텍스트 파일로, 방문자를 기억하거나
              통계를 내는 데 사용됩니다.
            </p>
          </section>

          <hr className="border-amber-100/60" />

          {/* 2. Google Analytics */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
              📊 2. Google Analytics 사용
            </h2>
            <p className="text-neutral-600 leading-relaxed text-sm md:text-base">
              본 사이트는 방문자 통계 분석을 위해 <strong>Google Analytics</strong>를 사용합니다.
              Google Analytics는 아래와 같은 정보를 <strong>익명으로</strong> 수집합니다.
            </p>
            <ul className="list-disc list-inside space-y-1 text-neutral-600 text-sm md:text-base pl-2">
              <li>방문한 페이지 및 체류 시간</li>
              <li>접속 일시 및 이용 빈도</li>
              <li>브라우저 종류 및 운영체제 정보</li>
              <li>대략적인 접속 지역 (도시 수준)</li>
            </ul>
            <p className="text-neutral-600 leading-relaxed text-sm md:text-base">
              수집된 정보는 특정 개인을 식별하는 데 사용되지 않으며, 서비스 개선 목적으로만
              활용됩니다.
            </p>
          </section>

          <hr className="border-amber-100/60" />

          {/* 3. Google AdSense */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
              📢 3. Google AdSense (맞춤 광고)
            </h2>
            <p className="text-neutral-600 leading-relaxed text-sm md:text-base">
              본 사이트는 운영 비용 충당을 위해 <strong>Google AdSense</strong>를 통한 광고를
              게재합니다. Google(제3자)은 쿠키를 사용하여{" "}
              <strong>사용자의 이전 웹사이트 방문 기록에 따라 맞춤형 광고</strong>를 제공할 수
              있습니다.
            </p>
            <p className="text-neutral-600 leading-relaxed text-sm md:text-base">
              Google이 광고 쿠키를 사용하는 방식에 대한 자세한 내용은 아래 링크에서 확인하실 수
              있습니다.
            </p>
            <a
              href="https://policies.google.com/technologies/partner-sites"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-amber-700 underline underline-offset-2 hover:text-amber-900 transition-colors text-sm md:text-base font-medium"
            >
              → Google 파트너 사이트에서 데이터를 사용하는 방식 보기
            </a>
          </section>

          <hr className="border-amber-100/60" />

          {/* 4. 맞춤 광고 해제 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
              🚫 4. 맞춤 광고 해제 방법
            </h2>
            <p className="text-neutral-600 leading-relaxed text-sm md:text-base">
              이용자는 언제든지 Google의 광고 설정 페이지에서{" "}
              <strong>맞춤 광고 수신을 거부</strong>할 수 있습니다.
            </p>
            <a
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-amber-700 underline underline-offset-2 hover:text-amber-900 transition-colors text-sm md:text-base font-medium"
            >
              → Google 광고 설정 페이지 바로가기
            </a>
          </section>

          <hr className="border-amber-100/60" />

          {/* 5. 쿠키 차단 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
              🍪 5. 쿠키 차단 방법
            </h2>
            <p className="text-neutral-600 leading-relaxed text-sm md:text-base">
              이용자는 사용 중인 <strong>웹 브라우저의 설정</strong>을 통해 쿠키 저장을 거부하거나
              이미 저장된 쿠키를 삭제할 수 있습니다. 단, 쿠키를 차단할 경우 일부 기능이 정상적으로
              동작하지 않을 수 있습니다.
            </p>
            <ul className="list-disc list-inside space-y-1 text-neutral-600 text-sm md:text-base pl-2">
              <li>Chrome: 설정 → 개인정보 및 보안 → 쿠키 및 기타 사이트 데이터</li>
              <li>Edge: 설정 → 쿠키 및 사이트 권한 → 쿠키 및 사이트 데이터 관리 및 삭제</li>
              <li>Safari: 설정 → 개인 정보 보호 → 쿠키 차단</li>
            </ul>
          </section>

          <hr className="border-amber-100/60" />

          {/* 6. 문의처 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
              ✉️ 6. 개인정보 관련 문의
            </h2>
            <p className="text-neutral-600 leading-relaxed text-sm md:text-base">
              개인정보처리방침에 관한 문의사항이 있으시면 아래 이메일로 연락해 주시기 바랍니다.
            </p>
            <p className="text-neutral-700 font-medium text-sm md:text-base">
              📧 이메일:{" "}
              <span className="text-amber-800">(내 이메일 주소)</span>
            </p>
            <p className="text-xs text-neutral-400">
              * 이메일 주소를 직접 입력하신 후 사용해 주세요.
            </p>
          </section>

        </div>
      </main>
    </div>
  );
}

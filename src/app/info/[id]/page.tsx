import fs from "fs/promises";
import path from "path";
import Link from "next/link";
import { notFound } from "next/navigation";

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

// 빌드 시 모든 상세 페이지 주소를 자동으로 생성하기 위한 함수
export async function generateStaticParams() {
  const filePath = path.join(process.cwd(), "public", "data", "city-info.json");
  try {
    const fileContent = await fs.readFile(filePath, "utf8");
    const items: LocalInfoItem[] = JSON.parse(fileContent);
    return items.map((item) => ({
      id: item.id,
    }));
  } catch (error) {
    console.error("정적 파라미터 생성 중 오류 발생:", error);
    return [];
  }
}

// 동적 라우팅 페이지 컴포넌트
export default async function InfoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const filePath = path.join(process.cwd(), "public", "data", "city-info.json");
  let item: LocalInfoItem | undefined;

  try {
    const fileContent = await fs.readFile(filePath, "utf8");
    const items: LocalInfoItem[] = JSON.parse(fileContent);
    item = items.find((x) => x.id === id);
  } catch (error) {
    console.error("상세 데이터를 읽는 도중 오류 발생:", error);
  }

  // 데이터가 없으면 404 페이지 표시
  if (!item) {
    notFound();
  }

  const isEvent = item.category === "행사";

  return (
    <div className="min-h-screen bg-amber-50/40 text-neutral-800 font-sans selection:bg-amber-200 pb-20">
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-amber-100/60 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
          <Link href="/" className="flex items-center gap-2 text-amber-900 font-bold hover:text-amber-700 transition-colors">
            <span>🏡</span>
            <span className="text-lg">성남시 생활 정보</span>
          </Link>
        </div>
      </header>

      {/* 본문 콘텐츠 */}
      <main className="max-w-3xl mx-auto px-4 mt-8">
        {/* 뒤로가기 버튼 */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-amber-700 font-medium transition-colors mb-6"
        >
          <span>←</span>
          <span>목록으로 돌아가기</span>
        </Link>

        {/* 상세 내용 카드 */}
        <article className="bg-white rounded-3xl border border-amber-100/80 p-6 md:p-10 shadow-sm">
          {/* 카테고리 태그 */}
          <div className="mb-4">
            <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${
              isEvent 
                ? "bg-orange-50 text-orange-700 border border-orange-100" 
                : "bg-emerald-50 text-emerald-700 border border-emerald-100"
            }`}>
              {item.category}
            </span>
          </div>

          {/* 제목 */}
          <h2 className="text-2xl md:text-3xl font-extrabold text-neutral-900 leading-tight mb-6">
            {item.name}
          </h2>

          {/* 요약 정보 블록 */}
          <div className="bg-neutral-50/80 rounded-2xl p-5 border border-neutral-100/80 space-y-3.5 mb-8">
            <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
              <span className="text-neutral-500 font-medium">📍 장소/위치</span>
              <span className="text-neutral-900 font-semibold">{item.location}</span>
            </div>
            
            <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
              <span className="text-neutral-500 font-medium">📅 운영 기간</span>
              <span className="text-neutral-900 font-semibold">
                {item.startDate === item.endDate 
                  ? item.startDate 
                  : `${item.startDate} ~ ${item.endDate}`}
              </span>
            </div>

            <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
              <span className="text-neutral-500 font-medium">👥 지원 대상</span>
              <span className="text-neutral-900 font-semibold leading-relaxed">{item.target}</span>
            </div>
          </div>

          {/* 상세 내용 */}
          <div className="space-y-4 mb-10 text-neutral-700 leading-relaxed">
            <h3 className="text-lg font-bold text-neutral-900 mb-2 border-l-4 border-amber-500 pl-2.5">
              상세 설명
            </h3>
            <p className="whitespace-pre-line text-base">
              {item.summary}
            </p>
          </div>

          {/* 하단 동작 버튼 */}
          <div className="flex flex-col sm:flex-row gap-4 border-t border-neutral-100 pt-8">
            <a 
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex-1 text-center font-bold py-3.5 px-6 rounded-2xl shadow-sm transition-all text-white ${
                isEvent 
                  ? "bg-amber-500 hover:bg-amber-600 shadow-amber-100" 
                  : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100"
              }`}
            >
              원문 사이트 바로가기 →
            </a>
          </div>
        </article>
      </main>
    </div>
  );
}

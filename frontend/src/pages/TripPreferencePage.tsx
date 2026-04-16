import { useParams } from 'react-router-dom';
import TripRoomHeader from '../components/layout/TripRoomHeader';
import PreferenceSection from '../features/preference/components/PreferenceSection';

/**
 * 여행 선호도 페이지
 * 사용자가 자신의 취향을 입력하거나 팀원들의 종합된 선호도 결과를 확인하는 페이지입니다.
 */
export default function TripPreferencePage() {
  // 1. URL 파라미터에서 현재 여행방의 ID를 가져옵니다.
  const { tripRoomId } = useParams<{ tripRoomId: string }>();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      {/* 2. 상단 공통 헤더: 현재 탭을 'preference'로 활성화 */}
      <TripRoomHeader activeItem="preference" tripRoomId={tripRoomId || ''} />

      {/* 3. 본문 영역: 우리가 만든 PreferenceSection을 배치합니다.
               Section 내부에서 Sidebar와 각 View(Form, Overall, Member)를 
               상태에 따라 동적으로 스위칭하며 보여줍니다.
            */}
      <main className="flex-1 overflow-hidden relative">
        <PreferenceSection />
      </main>
    </div>
  );
}
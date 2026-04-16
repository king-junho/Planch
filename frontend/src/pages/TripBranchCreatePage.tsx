import { useParams, useNavigate } from 'react-router-dom';
import TripRoomHeader from '../components/layout/TripRoomHeader';
import BranchCreateCanvas from '../features/branch/components/BranchCreateCanvas';

/**
 * 브랜치 직접 생성 페이지
 * 사용자가 장소를 선택하고 시간을 설정하여 새로운 여행 경로를 설계하는 독립 페이지입니다.
 */
export default function TripBranchCreatePage() {
  // 1. URL 파라미터에서 여행방 식별자 추출
  const { tripRoomId } = useParams<{ tripRoomId: string }>();
  const navigate = useNavigate();

  // 2. 생성 취소 또는 뒤로 가기 핸들러
  const handleBack = () => {
    // 브랜치 목록 페이지로 복귀 (팀원 정의 경로 준수)
    navigate(`/trip-rooms/${tripRoomId}/branch`);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      {/* 상단 헤더: 현재 위치를 'branch'로 표시 */}
      <TripRoomHeader activeItem="branch" tripRoomId={tripRoomId || ''} />

      <main className="flex-1 overflow-hidden relative">
        {/* 핵심 로직이 담긴 캔버스 컴포넌트 호출 
                  Canvas 내부에서 Zustand 스토어를 통해 데이터를 관리하므로 
                  페이지 단의 코드는 매우 깔끔하게 유지됩니다.
                */}
        <BranchCreateCanvas onBack={handleBack} />
      </main>
    </div>
  );
}
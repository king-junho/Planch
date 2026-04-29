import { useParams } from 'react-router-dom';
import TripRoomHeader from '../components/layout/TripRoomHeader';
import { ProposalSection } from '../features/proposal/components/ProposalSection';

export default function TripProposalPage() {
  // 1. 주소창에서 ID를 가져오는 팀원의 로직은 유지
  const { tripRoomId } = useParams<{ tripRoomId: string }>();

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* 2. 상단 헤더 (팀원 레이아웃) */}
      <TripRoomHeader activeItem="proposal" tripRoomId={tripRoomId || ''} />

      {/* 3. 본문 전체를 우리가 만든 Section으로 대체 */}
      <main className="flex-1 overflow-hidden">
        <ProposalSection tripRoomId={tripRoomId || ''} />
      </main>
    </div>
  );
}
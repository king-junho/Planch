import { useParams } from 'react-router-dom';
import TripRoomHeader from '../components/layout/TripRoomHeader';
import BranchSection from '../features/branch/components/BranchSection';

export default function TripBranchPage() {
  const { tripRoomId } = useParams<{ tripRoomId: string }>();

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TripRoomHeader activeItem="branch" tripRoomId={tripRoomId || ''} />

      <main className="flex-1 overflow-hidden">
        {/* 기존의 복잡한 로직은 Section 내부로 캡슐화하여 
                  페이지는 전체 레이아웃만 담당하도록 유지합니다.
                */}
        <BranchSection />
      </main>
    </div>
  );
}
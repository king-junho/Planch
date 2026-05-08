import { useParams } from 'react-router-dom';
import TripRoomHeader from '../components/layout/TripRoomHeader';
import BranchSection from '../features/branch/components/BranchSection';

export default function TripBranchPage() {
  const { tripRoomId } = useParams<{ tripRoomId: string }>();

  return (
    <div className="flex flex-col h-screen overflow-x-auto overflow-y-hidden min-w-[1024px]">
      <TripRoomHeader activeItem="branch" tripRoomId={tripRoomId || ''} />

      <main className="flex-1 overflow-hidden">
        <BranchSection />
      </main>
    </div>
  );
}
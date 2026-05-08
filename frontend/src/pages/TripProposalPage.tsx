import { useParams } from 'react-router-dom';
import TripRoomHeader from '../components/layout/TripRoomHeader';
import { ProposalSection } from '../features/proposal/components/ProposalSection';

export default function TripProposalPage() {
  const { tripRoomId } = useParams<{ tripRoomId: string }>();

  return (
    <div className="flex flex-col h-screen overflow-x-auto overflow-y-hidden min-w-[1024px]">
      <TripRoomHeader activeItem="proposal" tripRoomId={tripRoomId || ''} />

      <main className="flex-1 overflow-hidden">
        <ProposalSection tripRoomId={tripRoomId || ''} />
      </main>
    </div>
  );
}
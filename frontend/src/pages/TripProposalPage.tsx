import { useParams } from "react-router-dom";
import TripRoomHeader from "../components/layout/TripRoomHeader";
import ProposalSection from "../features/proposal/components/ProposalSection";

export default function TripProposalPage() {
  const { tripRoomId = "3" } = useParams();

  return (
    <div className="flex min-h-screen flex-col bg-white text-stone-900">
      <TripRoomHeader activeItem="proposal" tripRoomId={tripRoomId} />
      <main className="h-[calc(100vh-76px)]">
        <ProposalSection tripRoomId={tripRoomId} />
      </main>
    </div>
  );
}

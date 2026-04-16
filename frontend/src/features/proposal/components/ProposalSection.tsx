import { useEffect } from 'react';
import { useProposalStore } from '../store/useProposalStore';
import ProposalSearchArea from './ProposalSearchArea';
import ProposalListArea from './ProposalListArea';
// KakaoMapArea 대신 ProposalMap을 임포트합니다.
import ProposalMap from './ProposalMap';

interface ProposalSectionProps {
    tripRoomId: string;
}

export default function ProposalSection({ tripRoomId }: ProposalSectionProps) {
    const { fetchProposals } = useProposalStore();

    useEffect(() => {
        if (tripRoomId) {
            fetchProposals(tripRoomId);
        }
    }, [tripRoomId, fetchProposals]);

    return (
        <div className="flex w-full h-full overflow-hidden bg-white">
            <div className="w-[400px] flex flex-col h-full bg-stone-50/50 border-r border-gray-100 shrink-0 relative z-10 p-8">
                <h2 className="text-gray-900 text-xl font-bold mb-6">장소 제안</h2>
                <ProposalSearchArea tripRoomId={tripRoomId} />
                <ProposalListArea />
            </div>

            <div className="flex-1 h-full relative z-0">
                {/* 분리된 장소 제안 전용 지도를 배치합니다. */}
                <ProposalMap />
            </div>
        </div>
    );
}
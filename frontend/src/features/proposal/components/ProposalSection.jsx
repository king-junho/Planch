import { useEffect } from 'react';
import { useProposalStore } from '../store/useProposalStore';
import ProposalSearchArea from './ProposalSearchArea';
import ProposalListArea from './ProposalListArea';
import KakaoMapArea from '../../map/components/KakaoMapArea';

export default function ProposalSection({ tripRoomId }) {
    const { fetchProposals } = useProposalStore();

    // 방 진입 시 제안 목록 데이터 패칭
    useEffect(() => {
        if (tripRoomId && fetchProposals) {
            fetchProposals(tripRoomId);
        }
    }, [tripRoomId, fetchProposals]);

    return (
        <div className="flex w-full h-full overflow-hidden">
            {/* 좌측: 장소 제안 및 목록 영역 */}
            <div className="w-[400px] xl:w-1/3 flex flex-col h-full bg-stone-50 border-r border-gray-200 shrink-0 relative z-10 p-8">
                <h2 className="text-gray-900 text-lg font-bold mb-4">장소 제안하기</h2>

                <ProposalSearchArea tripRoomId={tripRoomId} />

                <ProposalListArea />
            </div>

            {/* 우측: 카카오맵 영역 */}
            <div className="flex-1 h-full relative z-0">
                <KakaoMapArea activeTab="PROPOSAL" />
            </div>
        </div>
    );
}
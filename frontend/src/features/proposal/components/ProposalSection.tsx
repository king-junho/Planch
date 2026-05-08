import { useEffect, useState } from 'react';
import { useProposalStore } from '../store/useProposalStore';
import ProposalSearchArea from './ProposalSearchArea';
import ProposalListArea from './ProposalListArea';
import ProposalMap from './ProposalMap';
import api from '../../../api/axiosInstance';

interface ProposalSectionProps {
    tripRoomId: string;
}

export const ProposalSection = ({ tripRoomId }: ProposalSectionProps) => {
    const { fetchProposals } = useProposalStore();

    const [isLocked, setIsLocked] = useState(false);
    const [hostUserId, setHostUserId] = useState<number | undefined>(undefined);

    useEffect(() => {
        if (tripRoomId) {
            const numericId = Number(tripRoomId);
            fetchProposals(numericId);

            api.get(`/trip-rooms/${numericId}`)
                .then(response => {
                    const roomStatus = response.data.status;
                    if (roomStatus === 'locked' || roomStatus === 'confirmed') {
                        setIsLocked(true);
                    }

                    const hostId = response.data.hostUserId || response.data.summary?.hostUserId;
                    if (hostId) {
                        setHostUserId(Number(hostId));
                    }
                })
                .catch(error => console.error("방 정보 조회 실패:", error));
        }
    }, [tripRoomId, fetchProposals]);

    return (
        <div className="flex w-full h-full overflow-x-auto overflow-y-hidden min-w-[900px] bg-white custom-scrollbar">

            {/* 왼쪽 사이드바 (너비 400px 고정) */}
            <div className="w-[400px] flex flex-col h-full bg-stone-50/50 border-r border-gray-100 shrink-0 relative z-10 p-8">
                <h2 className="text-gray-900 text-xl font-bold mb-6">장소 제안</h2>

                <ProposalSearchArea tripRoomId={tripRoomId} isLocked={isLocked} />
                <ProposalListArea hostUserId={hostUserId} />
            </div>

            {/* 오른쪽 지도 영역 */}
            <div className="flex-1 min-w-[500px] h-full relative z-0">
                <ProposalMap />
            </div>
        </div>
    );
}
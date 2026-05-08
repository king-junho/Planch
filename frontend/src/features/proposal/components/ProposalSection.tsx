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
    // 방장 ID를 저장할 상태(State) 추가
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

                    // 백엔드 응답 데이터에서 방장의 ID를 추출하여 상태에 저장
                    const hostId = response.data.hostUserId || response.data.summary?.hostUserId;
                    if (hostId) {
                        setHostUserId(Number(hostId));
                    }
                })
                .catch(error => console.error("방 정보 조회 실패:", error));
        }
    }, [tripRoomId, fetchProposals]);

    return (
        <div className="flex w-full h-full overflow-hidden bg-white">
            <div className="w-[400px] flex flex-col h-full bg-stone-50/50 border-r border-gray-100 shrink-0 relative z-10 p-8">
                <h2 className="text-gray-900 text-xl font-bold mb-6">장소 제안</h2>

                <ProposalSearchArea tripRoomId={tripRoomId} isLocked={isLocked} />

                {/* ProposalListArea 컴포넌트로 방장 ID(hostUserId) 전달 */}
                <ProposalListArea hostUserId={hostUserId} />
            </div>

            <div className="flex-1 h-full relative z-0">
                <ProposalMap />
            </div>
        </div>
    );
}
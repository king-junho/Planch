import { useEffect, useState } from 'react';
import { useProposalStore } from '../store/useProposalStore';
import ProposalSearchArea from './ProposalSearchArea';
import ProposalListArea from './ProposalListArea';
import ProposalMap from './ProposalMap';
import api from '../../../api/axiosInstance';

interface ProposalSectionProps {
    tripRoomId: string;
}

// 1. 위에 만들어둔 ProposalSectionProps 타입을 그대로 가져다 씁니다.
export const ProposalSection = ({ tripRoomId }: ProposalSectionProps) => {
    const { fetchProposals } = useProposalStore();

    // 방 잠금 상태를 관리하는 state
    const [isLocked, setIsLocked] = useState(false);

    useEffect(() => {
        if (tripRoomId) {
            const numericId = Number(tripRoomId);
            // 2. 스토어(백엔드)에서 숫자를 원한다면 여기서 Number()로 변환해서 넘겨줍니다.
            fetchProposals(numericId);

            // api 객체를 사용하여 현재 방의 상태 확인
            api.get(`/trip-rooms/${numericId}`)
                .then(response => {
                    const roomStatus = response.data.status;
                    if (roomStatus === 'locked' || roomStatus === 'confirmed') {
                        setIsLocked(true);
                    }
                })
                .catch(error => console.error("방 정보 조회 실패:", error));
        }
    }, [tripRoomId, fetchProposals]);

    return (
        <div className="flex w-full h-full overflow-hidden bg-white">
            <div className="w-[400px] flex flex-col h-full bg-stone-50/50 border-r border-gray-100 shrink-0 relative z-10 p-8">
                <h2 className="text-gray-900 text-xl font-bold mb-6">장소 제안</h2>

                {/* 3. 이제 tripRoomId가 string이므로 더 이상 빨간 줄이 뜨지 않습니다. */}
                {/* 검색 영역에 확정 여부 전달 */}
                <ProposalSearchArea tripRoomId={tripRoomId} isLocked={isLocked} />
                <ProposalListArea />
            </div>

            <div className="flex-1 h-full relative z-0">
                <ProposalMap />
            </div>
        </div>
    );
}
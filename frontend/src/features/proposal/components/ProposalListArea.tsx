import { useEffect, useState } from 'react';
import { useProposalStore } from '../store/useProposalStore';
import ProposalCard from './ProposalCard';

interface ProposalListAreaProps {
    hostUserId?: number; // 상위 컴포넌트에서 방장의 유저 ID를 전달받습니다.
}

export default function ProposalListArea({ hostUserId }: ProposalListAreaProps) {
    const { proposals, isLoading } = useProposalStore();
    const [currentUserId, setCurrentUserId] = useState<number | undefined>(undefined);

    // 컴포넌트가 화면에 뜰 때 로컬 스토리지의 토큰에서 내 유저 ID를 추출합니다.
    useEffect(() => {
        const token = localStorage.getItem('planch.accessToken');
        if (token) {
            try {
                // JWT 토큰의 payload 부분을 디코딩하여 유저 정보를 꺼냅니다.
                const payload = JSON.parse(atob(token.split('.')[1]));
                // 백엔드 토큰 구조에 맞춰 유연하게 ID 추출
                const myId = Number(payload.sub || payload.userId || payload.id);
                if (myId) {
                    setCurrentUserId(myId);
                }
            } catch (error) {
                console.error("토큰 디코딩 실패:", error);
            }
        }
    }, []);

    // 현재 로그인한 내 ID와 상위에서 넘겨받은 방장 ID가 일치할 때만 true가 됩니다.
    const isHost = currentUserId !== undefined && hostUserId !== undefined && currentUserId === hostUserId;

    if (isLoading) {
        return <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">데이터를 불러오는 중...</div>;
    }

    return (
        <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-4">
                <h3 className="text-gray-900 text-base font-bold">제안된 장소</h3>
                <div className="px-2 py-0.5 bg-gray-900 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{proposals.length}</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 pb-4 flex flex-col gap-4 custom-scrollbar">
                {proposals.length === 0 ? (
                    <div className="py-20 text-center text-gray-300 text-sm">아직 제안된 장소가 없습니다.</div>
                ) : (
                    proposals.map((prop, index) => (
                        <ProposalCard
                            key={prop.id || prop.proposalId || index}
                            proposal={prop}
                            currentUserId={currentUserId}
                            isHost={isHost}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
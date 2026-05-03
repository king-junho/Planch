import { MapPin, User, ChevronRight, Trash2 } from 'lucide-react';
import { useProposalStore } from '../store/useProposalStore';
import { ProposalResponse } from '../../../types/proposal';

interface ProposalCardProps {
    proposal: ProposalResponse;
    currentUserId?: number;
    isHost?: boolean;
}

export default function ProposalCard({ proposal, currentUserId, isHost = false }: ProposalCardProps) {
    const { setFocusedProposal, deleteProposal } = useProposalStore();

    // 백엔드 실제 데이터와 프론트엔드 임시 데이터 구조 차이 방어 코드
    const placeName = proposal?.placeName || proposal?.place?.name || '알 수 없는 장소';
    const category = proposal?.category || proposal?.place?.category || '카테고리 없음';
    const memo = proposal?.memo || proposal?.comment || '메모가 없습니다.';
    const address = proposal?.address || proposal?.place?.address || '주소 정보 없음';
    const proposerName = proposal?.proposerUser?.name || proposal?.proposer?.nickname || '알 수 없는 사용자';

    const proposalId = proposal?.id || proposal?.proposalId;
    const tripRoomId = proposal?.tripRoomId;

    // TypeScript 에러 방지 및 안전한 ID 추출 로직
    const proposerId = proposal?.proposerUserId || proposal?.proposerUser?.id || proposal?.proposer?.userId;

    // 본인이 작성한 제안인지 확인
    const isMyProposal = currentUserId && proposerId ? proposerId === currentUserId : false;

    // 본인이 작성했거나, 현재 유저가 방장일 경우에만 삭제 가능하도록 설정
    const canDelete = isMyProposal || isHost;

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation(); // 상위 요소 클릭 이벤트 버블링 방지

        if (!proposalId || !tripRoomId) return;

        if (window.confirm('이 장소 제안을 정말 삭제하시겠습니까?')) {
            await deleteProposal(Number(tripRoomId), Number(proposalId));
        }
    };

    return (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-3">
                <div className="flex flex-col gap-1">
                    <span className="text-gray-900 font-bold text-base leading-tight">
                        {placeName}
                    </span>
                    <span className="text-gray-400 text-[11px] font-medium uppercase tracking-wider">
                        {category}
                    </span>
                </div>

                <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                        <User size={12} className="text-gray-400" />
                        <span className="text-gray-600 text-[11px] font-bold">{proposerName}</span>
                    </div>

                    {/* 권한이 검증된 경우에만 휴지통 아이콘 렌더링 */}
                    {canDelete && (
                        <button
                            onClick={handleDelete}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="제안 삭제"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>

            <p className="text-gray-600 text-xs leading-relaxed bg-stone-50/50 p-3 rounded-xl mb-4 border border-stone-100 non-italic">
                {memo}
            </p>

            <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                <div className="flex items-center gap-1 text-gray-400">
                    <MapPin size={12} />
                    <span className="text-[10px] truncate max-w-[150px]">{address}</span>
                </div>

                <button
                    onClick={() => setFocusedProposal(proposal)}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-bold transition-colors"
                >
                    자세히보기 <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
}
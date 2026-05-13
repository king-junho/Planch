import { MapPin, User, ChevronRight, Trash2, Sparkles } from 'lucide-react';
import { useProposalStore } from '../store/useProposalStore';
import { ProposalResponse } from '../../../types/proposal';
import { useConfirmStore } from '../../store/useConfirmStore';
import { useToastStore } from '../../store/useToastStore';

interface ProposalCardProps {
    proposal: ProposalResponse;
    currentUserId?: number;
    isHost?: boolean;
}

export default function ProposalCard({ proposal, currentUserId, isHost = false }: ProposalCardProps) {
    const { setFocusedProposal, deleteProposal } = useProposalStore();
    const { confirm } = useConfirmStore();
    const { showToast } = useToastStore();

    const isAI = proposal?.source === 'ai';

    const placeName = proposal?.placeName || proposal?.place?.name || '알 수 없는 장소';
    const category = proposal?.category || proposal?.place?.category || '카테고리 없음';

    const memo = (isAI && proposal?.aiReason) ? proposal.aiReason : (proposal?.memo || proposal?.comment || '메모가 없습니다.');
    const address = proposal?.address || proposal?.place?.address || '주소 정보 없음';

    const proposerName = isAI ? 'AI 추천' : (proposal?.proposerUser?.name || proposal?.proposer?.nickname || '알 수 없는 사용자');

    const proposalId = proposal?.id || proposal?.proposalId;
    const tripRoomId = proposal?.tripRoomId;

    const proposerId = proposal?.proposerUserId || proposal?.proposerUser?.id || proposal?.proposer?.userId;

    const isMyProposal = currentUserId && proposerId ? proposerId === currentUserId : false;
    const canDelete = isMyProposal || isHost;

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();

        if (!proposalId || !tripRoomId) return;

        const isConfirmed = await confirm('이 장소 제안을 정말 삭제하시겠습니까?');
        if (isConfirmed) {
            const success = await deleteProposal(Number(tripRoomId), Number(proposalId));

            if (success) {
                showToast('success', '제안이 성공적으로 삭제되었습니다.');
            }
        }
    };

    return (
        <div className={`bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all group ${isAI ? 'border-blue-100' : 'border-gray-100'}`}>
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
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${isAI ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
                        {isAI ? (
                            <Sparkles size={12} className="text-blue-500" />
                        ) : (
                            <User size={12} className="text-gray-400" />
                        )}
                        <span className={`text-[11px] font-bold ${isAI ? 'text-blue-600' : 'text-gray-600'}`}>
                            {proposerName}
                        </span>
                    </div>

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
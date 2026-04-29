import { ThumbsUp, Minus, ThumbsDown } from 'lucide-react';
import { useBranchStore } from '../store/useBranchStore';
import { useParams } from 'react-router-dom';

interface BranchVoteSectionProps {
    branchId: number;
}

export default function BranchVoteSection({ branchId }: BranchVoteSectionProps) {
    const { tripRoomId } = useParams<{ tripRoomId: string }>();
    const { voteBranch, isLoading } = useBranchStore();

    const handleVote = async (type: 'agree' | 'hold' | 'disagree') => {
        if (!tripRoomId) return;
        const success = await voteBranch(Number(tripRoomId), branchId, type);
        if (success) {
            alert('투표가 반영되었습니다.');
        }
    };

    return (
        <div className="p-6 border-t border-gray-100 bg-white shrink-0">
            <h4 className="text-sm font-bold text-gray-900 mb-4 text-center">이 일정표에 대한 내 의견은?</h4>
            <div className="flex gap-3">
                <button
                    onClick={() => handleVote('agree')}
                    disabled={isLoading}
                    className="flex-1 flex flex-col items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-colors group"
                >
                    <div className="p-2 bg-gray-50 text-gray-400 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <ThumbsUp size={18} />
                    </div>
                    <span className="text-xs font-bold text-gray-600 group-hover:text-blue-700">찬성</span>
                </button>

                <button
                    onClick={() => handleVote('hold')}
                    disabled={isLoading}
                    className="flex-1 flex flex-col items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                    <div className="p-2 bg-gray-50 text-gray-400 rounded-full group-hover:bg-gray-300 group-hover:text-gray-700 transition-colors">
                        <Minus size={18} />
                    </div>
                    <span className="text-xs font-bold text-gray-600">보류</span>
                </button>

                <button
                    onClick={() => handleVote('disagree')}
                    disabled={isLoading}
                    className="flex-1 flex flex-col items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-xl hover:bg-red-50 hover:border-red-200 transition-colors group"
                >
                    <div className="p-2 bg-gray-50 text-gray-400 rounded-full group-hover:bg-red-500 group-hover:text-white transition-colors">
                        <ThumbsDown size={18} />
                    </div>
                    <span className="text-xs font-bold text-gray-600 group-hover:text-red-700">반대</span>
                </button>
            </div>
        </div>
    );
}
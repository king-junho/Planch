import { Sparkles, CheckCircle, Clock, ChevronRight, User, Wallet, Timer, TrendingUp, ThumbsUp, Minus, ThumbsDown } from 'lucide-react';
import { Branch } from '../../../types/branch';

interface BranchCardProps {
    branch: Branch;
    onViewDetail: () => void;
}

export default function BranchCard({ branch, onViewDetail }: BranchCardProps) {
    const isConfirmed = branch.status === 'confirmed';

    const agree = branch.agreeCount || 0;
    const hold = branch.holdCount || 0;
    const disagree = branch.disagreeCount || 0;
    const totalVotes = agree + hold + disagree;

    const formatCost = (cost: string | number | undefined) => {
        if (!cost || cost === '0') return '비용 미정';
        return `${Number(cost).toLocaleString()}원`;
    };

    const formatTime = (time: string | number | undefined) => {
        if (!time || time === '0') return '시간 미정';

        const totalMinutes = Number(time);
        if (isNaN(totalMinutes)) return `${time}분`;

        if (totalMinutes < 60) {
            return `${totalMinutes}분`;
        }

        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        if (minutes === 0) {
            return `${hours}시간`;
        }
        return `${hours}시간 ${minutes}분`;
    };

    return (
        <div
            onClick={onViewDetail}
            className={`flex flex-col bg-white rounded-lg shadow-sm border ${isConfirmed ? 'border-green-500 shadow-[0_0_0_1px_rgba(34,197,94,1)]' : 'border-gray-200'} overflow-hidden transition-all hover:shadow-md cursor-pointer shrink-0 group`}
        >
            <div className="p-5 border-b border-gray-100 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {branch.isAI && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded text-blue-600">
                                <Sparkles size={12} />
                                <span className="text-[10px] font-bold">AI 추천</span>
                            </div>
                        )}
                        {branch.proposer && !branch.isAI && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded text-gray-600 border border-gray-200">
                                <User size={12} />
                                <span className="text-[10px] font-bold">{branch.proposer} 제안</span>
                            </div>
                        )}
                        {isConfirmed && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-green-500 rounded text-white shadow-sm">
                                <CheckCircle size={12} />
                                <span className="text-[10px] font-bold">확정됨</span>
                            </div>
                        )}
                    </div>
                    <span className="text-gray-400 text-xs font-medium flex items-center gap-1">
                        <Clock size={12} />
                        {formatTime(branch.time)}
                    </span>
                </div>

                <div className="flex flex-col gap-1">
                    <h3 className="text-gray-900 font-bold text-lg group-hover:text-blue-600 transition-colors">{branch.title}</h3>
                    <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{branch.description}</p>
                </div>

                <div className="flex flex-wrap gap-2 mt-1">
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-md border border-gray-100">
                        <Wallet size={12} className="text-gray-400" />
                        <span className="text-gray-600 text-[11px] font-medium">{formatCost(branch.cost)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-md border border-gray-100">
                        <Timer size={12} className="text-gray-400" />
                        <span className="text-gray-600 text-[11px] font-medium">{formatTime(branch.time)}</span>
                    </div>
                </div>

                <div className="flex flex-col gap-2 mt-2 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1 text-blue-600">
                            <TrendingUp size={12} />
                            <span className="text-[11px] font-bold">팀원 선호도 일치율</span>
                        </div>
                        <span className="text-blue-600 text-xs font-bold">{branch.matchRate}%</span>
                    </div>
                    <div className="w-full h-1 bg-blue-100/50 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${branch.matchRate}%` }}></div>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-gray-50/50">
                {isConfirmed ? (
                    <div className="flex justify-center items-center gap-1.5 text-green-600 text-xs font-bold py-1">
                        <CheckCircle size={14} /> 최종 확정된 일정입니다
                    </div>
                ) : (
                    <div className="flex flex-col gap-2.5">
                        <div className="flex justify-between items-center">
                            <span className="text-[11px] font-bold text-gray-700">현재 투표 현황</span>
                            <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                {totalVotes}명 참여 <ChevronRight size={12} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                            </span>
                        </div>

                        <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-gray-200">
                            {totalVotes > 0 ? (
                                <>
                                    <div style={{ width: `${(agree / totalVotes) * 100}%` }} className="bg-blue-500 transition-all" />
                                    <div style={{ width: `${(hold / totalVotes) * 100}%` }} className="bg-gray-400 transition-all" />
                                    <div style={{ width: `${(disagree / totalVotes) * 100}%` }} className="bg-red-500 transition-all" />
                                </>
                            ) : (
                                <div className="w-full bg-gray-200" />
                            )}
                        </div>

                        <div className="flex justify-between text-[10px] font-bold mt-0.5">
                            <span className="text-blue-600 flex items-center gap-1"><ThumbsUp size={10} /> 찬성 {agree}</span>
                            <span className="text-gray-500 flex items-center gap-1"><Minus size={10} /> 보류 {hold}</span>
                            <span className="text-red-500 flex items-center gap-1"><ThumbsDown size={10} /> 반대 {disagree}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
import { Sparkles, CheckCircle, Clock, ChevronRight, User, Wallet, Timer, TrendingUp } from 'lucide-react';
import { Branch } from '../../../types/branch';

interface BranchCardProps {
    branch: Branch;
    onViewDetail: () => void;
}

export default function BranchCard({ branch, onViewDetail }: BranchCardProps) {
    const isConfirmed = branch.status === 'confirmed';

    return (
        <div className={`flex flex-col bg-white rounded-lg shadow-sm border ${isConfirmed ? 'border-blue-500 shadow-[0_0_0_1px_rgba(59,130,246,1)]' : 'border-gray-200'} overflow-hidden transition-all hover:shadow-md cursor-pointer shrink-0`}>
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
                            <div className="flex items-center gap-1 px-2 py-1 bg-blue-500 rounded text-white shadow-sm">
                                <CheckCircle size={12} />
                                <span className="text-[10px] font-bold">확정됨</span>
                            </div>
                        )}
                    </div>
                    <span className="text-gray-400 text-xs font-medium flex items-center gap-1">
                        <Clock size={12} />
                        {branch.time}
                    </span>
                </div>

                <div className="flex flex-col gap-1">
                    <h3 className="text-gray-900 font-bold text-lg">{branch.title}</h3>
                    <p className="text-gray-500 text-xs leading-relaxed">{branch.description}</p>
                </div>

                <div className="flex flex-wrap gap-2 mt-1">
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-md border border-gray-100">
                        <Wallet size={12} className="text-gray-400" />
                        <span className="text-gray-600 text-[11px] font-medium">{branch.cost}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-md border border-gray-100">
                        <Timer size={12} className="text-gray-400" />
                        <span className="text-gray-600 text-[11px] font-medium">{branch.time}</span>
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
                    <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${branch.matchRate}%` }}></div>
                    </div>
                </div>
            </div>

            <div className="flex h-12 bg-white">
                <button
                    onClick={onViewDetail}
                    className="flex-1 border-r border-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors"
                >
                    상세 보기
                </button>
                {isConfirmed ? (
                    <button className="flex-1 flex justify-center items-center text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors gap-1">
                        확정된 일정 <ChevronRight size={14} className="text-gray-400" />
                    </button>
                ) : (
                    <button className="flex-1 bg-gray-900 text-white text-xs font-medium hover:bg-gray-800 transition-colors gap-1 flex items-center justify-center">
                        투표하기 <ChevronRight size={14} className="text-white/70" />
                    </button>
                )}
            </div>
        </div>
    );
}
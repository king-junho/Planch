import { Sparkles, CheckCircle, Clock, ChevronRight, User, Wallet, Timer, TrendingUp } from 'lucide-react';

export default function BranchCard({ branch, onViewDetail }) {
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
                                <span className="text-[10px] font-bold">{branch.proposer}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {isConfirmed && (
                            <div className="flex items-center gap-1 px-2.5 py-1 bg-white rounded-full border border-green-500 text-green-600">
                                <CheckCircle size={12} />
                                <span className="text-[10px] font-bold">최종 확정</span>
                            </div>
                        )}
                        {branch.status === 'voting' && (
                            <div className="flex items-center gap-1 px-2.5 py-1 bg-white rounded-full border border-orange-400 text-orange-500">
                                <Clock size={12} />
                                <span className="text-[10px] font-bold">투표 중</span>
                            </div>
                        )}
                        {branch.status === 'pending' && (
                            <div className="flex items-center gap-1 px-2.5 py-1 bg-white rounded-full border border-gray-300 text-gray-600">
                                <span className="text-[10px] font-bold">선택 중</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <h3 className="text-gray-900 text-lg font-bold">{branch.title}</h3>
                    <p className="text-gray-500 text-xs">{branch.description}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 flex flex-col gap-4 border border-gray-100">
                    <div className="flex justify-between gap-4">
                        <div className="flex flex-col gap-1 flex-1">
                            <div className="flex items-center gap-1 text-gray-400">
                                <Wallet size={12} />
                                <span className="text-[10px] font-medium">예상 총비용</span>
                            </div>
                            <span className="text-gray-900 text-sm font-bold">{branch.cost}</span>
                        </div>
                        <div className="flex flex-col gap-1 flex-1">
                            <div className="flex items-center gap-1 text-gray-400">
                                <Timer size={12} />
                                <span className="text-[10px] font-medium">이동시간</span>
                            </div>
                            <span className="text-gray-900 text-sm font-bold">{branch.time}</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-gray-400">
                            <div className="flex items-center gap-1">
                                <TrendingUp size={12} />
                                <span className="text-[10px] font-medium">선호 반영도</span>
                            </div>
                            <span className="text-blue-600 text-xs font-bold">{branch.matchRate}%</span>
                        </div>
                        <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${branch.matchRate}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex h-12 bg-white">
                {/* 버튼에 onClick 이벤트 추가 */}
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
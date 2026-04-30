import { ArrowLeft, MapPin, Wallet, ChevronLeft, ChevronRight, Edit2, CalendarX2, ThumbsUp, Minus, ThumbsDown, CheckCircle2, Users } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBranchStore } from '../store/useBranchStore';
import { Branch } from '../../../types/branch';

interface BranchDetailSectionProps {
    branch: Branch;
    onBack: () => void;
}

export default function BranchDetailSection({ branch, onBack }: BranchDetailSectionProps) {
    const { selectedDay, setSelectedDay, voteBranch, finalizeBranch, isLoading } = useBranchStore();
    const navigate = useNavigate();
    const { tripRoomId } = useParams();

    const availableDays = branch.routes ? Object.keys(branch.routes).map(Number) : [1];
    const maxDay = Math.max(...availableDays);
    const minDay = Math.min(...availableDays);
    const currentRoute = branch.routes?.[selectedDay] || [];

    const isOwner = true; // 현재는 UI 테스트를 위해 true (추후 실제 권한 연동 필요)

    // 백엔드에서 내려줄 실제 투표 데이터 필드를 연결합니다. (없을 경우 0 처리)
    const voteCounts = {
        agree: branch.agreeCount || 0,
        hold: branch.holdCount || 0,
        disagree: branch.disagreeCount || 0
    };
    const totalVotes = voteCounts.agree + voteCounts.hold + voteCounts.disagree;

    const handleEdit = () => {
        navigate(`/trip-rooms/${tripRoomId}/branch/edit`, {
            state: { editBranch: branch }
        });
    };

    const handleVote = async (type: 'agree' | 'hold' | 'disagree') => {
        if (!tripRoomId) return;
        const success = await voteBranch(Number(tripRoomId), branch.id, type);
        if (success) alert('투표가 반영되었습니다.');
    };

    const handleFinalize = async () => {
        if (!tripRoomId) return;
        if (window.confirm('이 브랜치를 최종 여행 일정으로 확정하시겠습니까?')) {
            const success = await finalizeBranch(Number(tripRoomId), branch.id);
            if (success) {
                alert('최종 일정으로 확정되었습니다.');
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-white relative z-10">
            {/* 상단 헤더: 제목 및 목록/수정 버튼 */}
            <div className="px-8 py-6 border-b border-gray-100 shrink-0">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors mb-4">
                    <ArrowLeft size={18} />
                    <span className="text-sm font-bold uppercase tracking-wider">목록으로</span>
                </button>

                <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex items-center gap-2">
                        {branch.status === 'confirmed' && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-md shrink-0">최종 확정</span>
                        )}
                        <h2 className="text-2xl font-bold text-gray-900 truncate">{branch.title}</h2>
                    </div>
                    {branch.status !== 'confirmed' && (
                        <button
                            onClick={handleEdit}
                            className="shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-100 shadow-sm"
                        >
                            <Edit2 size={14} />
                            <span>수정</span>
                        </button>
                    )}
                </div>
                <p className="text-sm text-gray-500 mt-2 truncate">{branch.description}</p>
            </div>

            {/* 일차 이동 네비게이션 */}
            <div className="flex items-center justify-between px-8 py-4 bg-gray-50 border-b border-gray-100 shrink-0">
                <button
                    disabled={selectedDay <= minDay}
                    onClick={() => setSelectedDay(selectedDay - 1)}
                    className="p-1 disabled:opacity-30 hover:bg-gray-200 rounded-full transition-colors"
                >
                    <ChevronLeft size={20} />
                </button>
                <span className="text-sm font-bold text-gray-900">{selectedDay}일차 일정</span>
                <button
                    disabled={selectedDay >= maxDay}
                    onClick={() => setSelectedDay(selectedDay + 1)}
                    className="p-1 disabled:opacity-30 hover:bg-gray-200 rounded-full transition-colors"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* 타임라인 영역 */}
            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 custom-scrollbar">
                {currentRoute.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3">
                        <CalendarX2 size={48} strokeWidth={1.5} className="text-gray-300" />
                        <span className="text-sm font-medium">이날은 등록된 일정이 없습니다.</span>
                        {branch.status !== 'confirmed' && (
                            <span className="text-xs text-gray-400 text-center">우측 상단의 수정 버튼을 눌러<br />장소를 추가해 보세요.</span>
                        )}
                    </div>
                ) : (
                    currentRoute.map((item, index) => (
                        // 수정됨: 중복 키 에러를 방지하기 위해 id와 index를 결합하여 고유한 키값 생성
                        <div key={`route-item-${item.id}-${index}`} className="relative flex gap-5">
                            <div className="flex flex-col items-center">
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5 z-10" />
                                {index !== currentRoute.length - 1 && (
                                    <div className="w-0.5 h-full bg-blue-100 -mt-1" />
                                )}
                            </div>
                            <div className="flex-1 pb-4">
                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                    {item.time}
                                </span>
                                <h4 className="text-sm font-bold text-gray-900 mt-2">{item.title}</h4>
                                <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* 의사결정 대시보드 패널 */}
            <div className="p-6 border-t border-gray-200 bg-white shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
                {branch.status === 'confirmed' ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-4 bg-green-50 border border-green-200 rounded-xl">
                        <CheckCircle2 size={24} className="text-green-600" />
                        <span className="text-sm font-bold text-green-800">이 일정이 최종 여행 코스로 확정되었습니다.</span>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-end mb-4">
                            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                                <Users size={16} className="text-blue-500" /> 투표 현황 <span className="text-gray-400 font-normal">({totalVotes}명 참여)</span>
                            </h4>
                        </div>

                        {/* 1. 집계 현황 */}
                        <div className="w-full h-2 flex rounded-full overflow-hidden mb-3 bg-gray-100">
                            {totalVotes > 0 && (
                                <>
                                    <div style={{ width: `${(voteCounts.agree / totalVotes) * 100}%` }} className="bg-blue-500 transition-all" />
                                    <div style={{ width: `${(voteCounts.hold / totalVotes) * 100}%` }} className="bg-gray-400 transition-all" />
                                    <div style={{ width: `${(voteCounts.disagree / totalVotes) * 100}%` }} className="bg-red-500 transition-all" />
                                </>
                            )}
                        </div>

                        <div className="flex justify-between text-[11px] font-bold mb-6">
                            <span className="text-blue-600">찬성 {voteCounts.agree}명</span>
                            <span className="text-gray-500">보류 {voteCounts.hold}명</span>
                            <span className="text-red-500">반대 {voteCounts.disagree}명</span>
                        </div>

                        {/* 2. 내 투표 액션 */}
                        <div className="flex gap-2 mb-4">
                            <button onClick={() => handleVote('agree')} disabled={isLoading} className="flex-1 flex justify-center items-center gap-1.5 py-2.5 border border-gray-200 rounded-lg hover:bg-blue-50 text-xs font-bold text-gray-600 transition-colors">
                                <ThumbsUp size={14} /> 찬성
                            </button>
                            <button onClick={() => handleVote('hold')} disabled={isLoading} className="flex-1 flex justify-center items-center gap-1.5 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-xs font-bold text-gray-600 transition-colors">
                                <Minus size={14} /> 보류
                            </button>
                            <button onClick={() => handleVote('disagree')} disabled={isLoading} className="flex-1 flex justify-center items-center gap-1.5 py-2.5 border border-gray-200 rounded-lg hover:bg-red-50 text-xs font-bold text-gray-600 transition-colors">
                                <ThumbsDown size={14} /> 반대
                            </button>
                        </div>

                        {/* 3. 최종 일정 확정 버튼 (방장 전용) */}
                        {isOwner && (
                            <button
                                onClick={handleFinalize}
                                disabled={isLoading}
                                className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors shadow-md flex justify-center items-center gap-2"
                            >
                                <CheckCircle2 size={16} /> 이 일정으로 최종 확정하기
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
import { useState, useEffect } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Edit2, CalendarX2, ThumbsUp, Minus, ThumbsDown, CheckCircle2, Users, Loader2, Trash2, Unlock } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBranchStore } from '../store/useBranchStore';
import { Branch } from '../../../types/branch';
import { getTripRoomDetail, unlockTripRoom } from '../../../services/tripRoomApi';

interface BranchDetailSectionProps {
    branch: Branch;
    isLocked?: boolean;
    onBack: () => void;
}

export default function BranchDetailSection({ branch, isLocked = false, onBack }: BranchDetailSectionProps) {
    const { selectedDay, setSelectedDay, voteBranch, finalizeBranch, deleteBranch, isLoading, fetchBranches } = useBranchStore();
    const navigate = useNavigate();
    const { tripRoomId } = useParams();

    const [myUserId, setMyUserId] = useState<number | null>(null);
    const [hostUserId, setHostUserId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUnlocking, setIsUnlocking] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('planch.accessToken');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setMyUserId(Number(payload.sub || payload.userId || payload.id));
            } catch (error) {
                console.error("토큰 파싱 에러:", error);
            }
        }
    }, []);

    useEffect(() => {
        if (!tripRoomId) return;

        const numericTripRoomId = Number(tripRoomId);
        if (!Number.isInteger(numericTripRoomId) || numericTripRoomId <= 0) return;

        let isMounted = true;

        async function loadTripRoomHost() {
            try {
                const detail = await getTripRoomDetail(numericTripRoomId);
                if (isMounted) {
                    setHostUserId(detail.hostUser.id);
                }
            } catch (error) {
                console.error("여행방 호스트 조회 실패:", error);
            }
        }

        loadTripRoomHost();

        return () => {
            isMounted = false;
        };
    }, [tripRoomId]);

    const availableDays = branch.routes ? Object.keys(branch.routes).map(Number) : [1];
    const maxDay = Math.max(...availableDays);
    const minDay = Math.min(...availableDays);
    const currentRoute = branch.routes?.[selectedDay] || [];

    const isOwner = Boolean(myUserId && hostUserId && myUserId === hostUserId);

    const isCreator = myUserId && (branch as any).userId === myUserId;
    const canDelete = isCreator || isOwner;
    const canUnlock = isOwner && (isLocked || branch.status === 'confirmed');

    const voteCounts = {
        agree: branch.agreeCount || 0,
        hold: branch.holdCount || 0,
        disagree: branch.disagreeCount || 0
    };
    const totalVotes = voteCounts.agree + voteCounts.hold + voteCounts.disagree;

    const isEditDisabled = branch.status === 'confirmed' || isLocked;
    const isVoteDisabled = isLoading || isDeleting || isEditDisabled;

    const handleEdit = () => {
        navigate(`/trip-rooms/${tripRoomId}/branch/edit`, {
            state: { editBranch: branch }
        });
    };

    // 스토어의 deleteBranch를 호출하도록 수정
    const handleDelete = async () => {
        if (!tripRoomId || isEditDisabled) return;

        if (window.confirm('이 브랜치를 정말 삭제하시겠습니까? (삭제 후 복구할 수 없습니다)')) {
            setIsDeleting(true);
            const success = await deleteBranch(Number(tripRoomId), branch.id);
            setIsDeleting(false);

            if (success) {
                alert('브랜치가 삭제되었습니다.');
                onBack();
            }
        }
    };

    const handleUnlock = async () => {
        if (!tripRoomId) return;

        if (window.confirm('이 여행방의 최종 일정을 확정 해제하시겠습니까?\n투표와 브랜치 추가가 다시 활성화됩니다.')) {
            try {
                setIsUnlocking(true);
                await unlockTripRoom(Number(tripRoomId));
                alert('일정 확정이 해제되었습니다.');
                await fetchBranches(Number(tripRoomId));
                window.dispatchEvent(new CustomEvent("trip-room-unlocked"));
                onBack();
            } catch (error) {
                console.error('확정 해제 실패:', error);
                alert(error instanceof Error && error.message ? error.message : '확정 해제 권한이 없거나 오류가 발생했습니다.');
            } finally {
                setIsUnlocking(false);
            }
        }
    };

    const handleVote = async (type: 'agree' | 'hold' | 'disagree') => {
        if (!tripRoomId || isVoteDisabled) return;
        const success = await voteBranch(Number(tripRoomId), branch.id, type);
        if (success) alert('투표가 반영되었습니다.');
    };

    const handleFinalize = async () => {
        if (!tripRoomId || isLocked) return;
        if (window.confirm('이 브랜치를 최종 여행 일정으로 확정하시겠습니까?')) {
            const success = await finalizeBranch(Number(tripRoomId), branch.id);
            if (success) {
                alert('최종 일정으로 확정되었습니다.');
                window.location.reload();
            }
        }
    };

    const showOverlay = isLoading || isDeleting || isUnlocking;

    return (
        <div className="flex flex-col h-full bg-white relative z-10">
            {showOverlay && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[2px]">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                    <span className="text-sm font-bold text-gray-700">
                        {isDeleting ? '삭제 중입니다...' : isUnlocking ? '확정 해제 중입니다...' : '요청을 처리하고 있습니다...'}
                    </span>
                </div>
            )}

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

                    <div className="flex items-center gap-2">
                        {canDelete && !isLocked && (
                            <button
                                onClick={handleDelete}
                                className="shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border shadow-sm text-red-600 bg-white hover:bg-red-50 border-red-100 hover:border-red-200"
                            >
                                <Trash2 size={14} />
                                <span>삭제</span>
                            </button>
                        )}

                        <button
                            onClick={handleEdit}
                            disabled={isEditDisabled}
                            className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border shadow-sm ${isEditDisabled
                                ? 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed opacity-60'
                                : 'text-gray-600 bg-gray-50 hover:bg-gray-100 border-gray-100'
                                }`}
                        >
                            <Edit2 size={14} />
                            <span>수정</span>
                        </button>
                    </div>
                </div>
                <p className="text-sm text-gray-500 mt-2 truncate">{branch.description}</p>
            </div>

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

            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 custom-scrollbar">
                {currentRoute.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3">
                        <CalendarX2 size={48} strokeWidth={1.5} className="text-gray-300" />
                        <span className="text-sm font-medium">이날은 등록된 일정이 없습니다.</span>
                        {!isEditDisabled && (
                            <span className="text-xs text-gray-400 text-center">우측 상단의 수정 버튼을 눌러<br />장소를 추가해 보세요.</span>
                        )}
                    </div>
                ) : (
                    currentRoute.map((item, index) => (
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

            <div className="p-6 border-t border-gray-200 bg-white shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
                {branch.status === 'confirmed' ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-4 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 size={24} className="text-green-600" />
                            <span className="text-sm font-bold text-green-800">이 일정이 최종 여행 코스로 확정되었습니다.</span>
                        </div>
                        {canUnlock && (
                            <button
                                onClick={handleUnlock}
                                disabled={isUnlocking}
                                className="flex items-center gap-1.5 px-4 py-2 mt-1 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                            >
                                <Unlock size={14} /> 확정 해제하기
                            </button>
                        )}
                    </div>
                ) : isLocked ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-4 bg-gray-50 border border-gray-200 rounded-xl">
                        <span className="text-sm font-bold text-gray-600">여행 일정이 확정되어 투표가 종료되었습니다.</span>
                        {canUnlock && (
                            <button
                                onClick={handleUnlock}
                                disabled={isUnlocking}
                                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                            >
                                <Unlock size={14} /> 방 확정 해제하기
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-end mb-4">
                            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                                <Users size={16} className="text-blue-500" /> 투표 현황 <span className="text-gray-400 font-normal">({totalVotes}명 참여)</span>
                            </h4>
                        </div>

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

                        <div className="flex gap-2 mb-4">
                            <button onClick={() => handleVote('agree')} disabled={isVoteDisabled} className="flex-1 flex justify-center items-center gap-1.5 py-2.5 border border-gray-200 rounded-lg hover:bg-blue-50 text-xs font-bold text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                <ThumbsUp size={14} /> 찬성
                            </button>
                            <button onClick={() => handleVote('hold')} disabled={isVoteDisabled} className="flex-1 flex justify-center items-center gap-1.5 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-xs font-bold text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                <Minus size={14} /> 보류
                            </button>
                            <button onClick={() => handleVote('disagree')} disabled={isVoteDisabled} className="flex-1 flex justify-center items-center gap-1.5 py-2.5 border border-gray-200 rounded-lg hover:bg-red-50 text-xs font-bold text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                <ThumbsDown size={14} /> 반대
                            </button>
                        </div>

                        {isOwner && (
                            <button
                                onClick={handleFinalize}
                                disabled={isVoteDisabled}
                                className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors shadow-md flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

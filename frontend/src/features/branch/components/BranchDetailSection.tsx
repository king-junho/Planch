import { useState, useEffect } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Edit2, CalendarX2, ThumbsUp, Minus, ThumbsDown, CheckCircle2, Users, Loader2, Trash2, Unlock, Wallet, AlignLeft, Timer } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBranchStore } from '../store/useBranchStore';
import { Branch } from '../../../types/branch';
import { getTripRoomDetail, unlockTripRoom } from '../../../services/tripRoomApi';
import LoadingOverlay from '../../../components/common/LoadingOverlay';
import { useToastStore } from '../../store/useToastStore';
import { useConfirmStore } from '../../store/useConfirmStore';
import { getDeadlineStatus } from '../../../utils/deadline';
import { io, Socket } from 'socket.io-client';

interface BranchDetailSectionProps {
    branch: Branch | null | undefined;
    isLocked?: boolean;
    onBack: () => void;
    hoveredPlaceId?: number | null;
    onPlaceHover?: (placeId: number | null) => void;
}

export default function BranchDetailSection({
    branch,
    isLocked = false,
    onBack,
    hoveredPlaceId,
    onPlaceHover
}: BranchDetailSectionProps) {
    const { selectedDay, setSelectedDay, voteBranch, finalizeBranch, deleteBranch, isLoading, fetchBranches, tripDuration, tripStartDate } = useBranchStore();
    const navigate = useNavigate();
    const { tripRoomId } = useParams();
    const { showToast } = useToastStore();
    const { confirm } = useConfirmStore();

    const [myUserId, setMyUserId] = useState<number | null>(null);
    const [hostUserId, setHostUserId] = useState<number | null>(null);
    const [decisionDeadline, setDecisionDeadline] = useState<string | null>(null);
    const [deadlineNow, setDeadlineNow] = useState(Date.now());
    const [socket, setSocket] = useState<Socket | null>(null);

    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUnlocking, setIsUnlocking] = useState(false);

    const [votingType, setVotingType] = useState<'agree' | 'hold' | 'disagree' | null>(null);

    useEffect(() => {
        const timer = window.setInterval(() => {
            setDeadlineNow(Date.now());
        }, 1000);

        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('planch.accessToken');
        if (!tripRoomId || !token) return;

        const socketUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:4000';
        const newSocket = io(socketUrl, {
            auth: { token },
            transports: ['websocket']
        });

        newSocket.on('connect', () => {
            newSocket.emit('collab:join', { tripRoomId: Number(tripRoomId) });
        });

        setSocket(newSocket);

        return () => {
            newSocket.emit('collab:leave', { tripRoomId: Number(tripRoomId) });
            newSocket.disconnect();
        };
    }, [tripRoomId]);

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
            setIsAuthLoading(true);
            try {
                const detail = await getTripRoomDetail(numericTripRoomId);
                if (isMounted) {
                    if (detail.hostUser) {
                        setHostUserId(detail.hostUser.id);
                    }

                    if (detail.decisionDeadline) {
                        setDecisionDeadline(detail.decisionDeadline);
                    }
                }
            } catch (error) {
                console.error("여행방 호스트 조회 실패:", error);
            } finally {
                if (isMounted) {
                    setIsAuthLoading(false);
                }
            }
        }

        loadTripRoomHost();

        return () => {
            isMounted = false;
        };
    }, [tripRoomId]);

    if (!branch) {
        return null;
    }

    const currentMyVote = (branch as any).myVote || null;
    const deadlineStatus = getDeadlineStatus(decisionDeadline, deadlineNow);

    const maxDay = Math.max(tripDuration, 1);
    const minDay = 1;

    const currentRoute = (branch.routes && branch.routes[selectedDay]) ? branch.routes[selectedDay] : [];

    const isOwner = Boolean(myUserId && hostUserId && String(myUserId) === String(hostUserId));

    const branchCreatorId = branch.createdUserId || (branch as any).userId;
    const isCreator = Boolean(myUserId && branchCreatorId && String(myUserId) === String(branchCreatorId));

    const isAiBranch =
        branch.isAI === true ||
        String(branch.proposer).toLowerCase() === 'ai' ||
        String((branch as any).createdBy).toLowerCase() === 'ai';

    const canDelete = isAiBranch || isCreator || isOwner;

    const canUnlock = isOwner && (isLocked || branch.status === 'confirmed');

    const voteCounts = {
        agree: branch.agreeCount || 0,
        hold: branch.holdCount || 0,
        disagree: branch.disagreeCount || 0
    };
    const totalVotes = voteCounts.agree + voteCounts.hold + voteCounts.disagree;

    const isEditDisabled = branch.status === 'confirmed' || isLocked;

    const isVoteDisabled = isLoading || isDeleting || isEditDisabled || deadlineStatus.passed || isAuthLoading;

    const handleEdit = () => {
        navigate(`/trip-rooms/${tripRoomId}/branch/edit`, {
            state: { editBranch: branch }
        });
    };

    const handleDelete = async () => {
        if (!tripRoomId || isEditDisabled) return;

        const isConfirmed = await confirm('이 브랜치를 정말 삭제하시겠습니까?\n(삭제 후 복구할 수 없습니다)');
        if (isConfirmed) {
            setIsDeleting(true);
            const success = await deleteBranch(Number(tripRoomId), branch.id);
            setIsDeleting(false);

            if (success) {
                socket?.emit('collab:sync_action', { type: 'REFRESH_BRANCH_LIST' });
                showToast('success', '브랜치가 삭제되었습니다.');
                setTimeout(() => onBack(), 1000);
            }
        }
    };

    const handleUnlock = async () => {
        if (!tripRoomId) return;

        const isConfirmed = await confirm('이 여행방의 최종 일정을 확정 해제하시겠습니까?\n투표와 브랜치 추가가 다시 활성화됩니다.');
        if (isConfirmed) {
            try {
                setIsUnlocking(true);
                await unlockTripRoom(Number(tripRoomId));
                showToast('success', '일정 확정이 해제되었습니다.');
                await fetchBranches(Number(tripRoomId));
                socket?.emit('collab:sync_action', { type: 'REFRESH_BRANCH_LIST' });
                window.dispatchEvent(new CustomEvent("trip-room-unlocked"));
                onBack();
            } catch (error) {
                console.error('확정 해제 실패:', error);
                showToast('error', error instanceof Error && error.message ? error.message : '확정 해제 권한이 없거나 오류가 발생했습니다.');
            } finally {
                setIsUnlocking(false);
            }
        }
    };

    const handleVote = async (type: 'agree' | 'hold' | 'disagree') => {
        if (!tripRoomId || isVoteDisabled || votingType !== null) return;

        if (currentMyVote === type) {
            return;
        }

        setVotingType(type);
        const success = await voteBranch(Number(tripRoomId), branch.id, type);
        if (success) {
            socket?.emit('collab:sync_action', { type: 'REFRESH_BRANCH_LIST' });
            showToast('success', '투표가 반영되었습니다.');
        }
        setVotingType(null);
    };

    const handleFinalize = async () => {
        if (!tripRoomId || isLocked) return;

        const isConfirmed = await confirm('이 브랜치를 최종 여행 일정으로 확정하시겠습니까?');
        if (isConfirmed) {
            const success = await finalizeBranch(Number(tripRoomId), branch.id);
            if (success) {
                socket?.emit('collab:sync_action', { type: 'REFRESH_BRANCH_LIST' });
                showToast('success', '최종 일정으로 확정되었습니다.');
                setTimeout(() => window.location.reload(), 1500);
            }
        }
    };

    const getDateLabel = (dayIndex: number) => {
        if (!tripStartDate) return `${dayIndex}일차 일정`;
        const date = new Date(tripStartDate);
        date.setDate(date.getDate() + (dayIndex - 1));
        return `${date.getMonth() + 1}월 ${date.getDate()}일 (${dayIndex}일차) 일정`;
    };

    const showOverlay = (isLoading && votingType === null) || isDeleting || isUnlocking;

    return (
        <div className="flex flex-col h-full bg-white relative z-10">
            {showOverlay && (
                <LoadingOverlay
                    text={isDeleting ? '삭제 중입니다...' : isUnlocking ? '확정 해제 중입니다...' : '요청을 처리하고 있습니다...'}
                />
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
                        {isAuthLoading ? (
                            <div className="flex gap-2">
                                <div className="flex items-center justify-center w-[64px] h-[30px] bg-gray-50 rounded-lg border border-gray-100">
                                    <Loader2 size={14} className="animate-spin text-gray-400" />
                                </div>
                                <div className="flex items-center justify-center w-[64px] h-[30px] bg-gray-50 rounded-lg border border-gray-100">
                                    <Loader2 size={14} className="animate-spin text-gray-400" />
                                </div>
                            </div>
                        ) : (
                            <>
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
                            </>
                        )}
                    </div>
                </div>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed whitespace-normal break-keep">
                    {branch.description}
                </p>
            </div>

            <div className="flex items-center justify-between px-8 py-4 bg-gray-50 border-b border-gray-100 shrink-0">
                <button
                    disabled={selectedDay <= minDay}
                    onClick={() => setSelectedDay(selectedDay - 1)}
                    className="p-1 disabled:opacity-30 hover:bg-gray-200 rounded-full transition-colors"
                >
                    <ChevronLeft size={20} />
                </button>
                <span className="text-sm font-bold text-gray-900">{getDateLabel(selectedDay)}</span>
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
                    currentRoute.map((item, index) => {
                        const costValue = item.cost || (item as any).estimatedCost;
                        const isHovered = hoveredPlaceId === item.id;

                        return (
                            <div
                                key={`route-item-${item.id}-${index}`}
                                className={`relative flex gap-5 group cursor-pointer transition-all duration-300 ${hoveredPlaceId && !isHovered ? 'opacity-30' : 'opacity-100'}`}
                                onMouseEnter={() => onPlaceHover?.(item.id)}
                                onMouseLeave={() => onPlaceHover?.(null)}
                                onClick={() => {
                                    onPlaceHover?.(item.id);
                                    setTimeout(() => onPlaceHover?.(null), 3000);
                                }}
                            >
                                <div className="flex flex-col items-center">
                                    <div className={`w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5 z-10 transition-all duration-300 ${isHovered ? 'scale-150 ring-4 ring-blue-100' : ''}`} />
                                    {index !== currentRoute.length - 1 && (
                                        <div className="w-0.5 h-full bg-blue-100 -mt-1" />
                                    )}
                                </div>
                                <div className={`flex-1 pb-4 transition-transform duration-300 origin-left ${isHovered ? 'scale-[1.02] translate-x-1' : ''}`}>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                            {item.time}
                                        </span>
                                        {costValue && costValue !== '0' && costValue !== 0 && (
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                                <Wallet size={10} />
                                                {typeof costValue === 'number'
                                                    ? `${costValue.toLocaleString()}원`
                                                    : costValue}
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="text-sm font-bold text-gray-900 mt-2">{item.title}</h4>

                                    {item.desc && (
                                        <p className="text-xs text-gray-500 mt-1 leading-relaxed break-keep">{item.desc}</p>
                                    )}

                                    {item.memo && (
                                        <div className="mt-2.5 p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-2 shadow-sm">
                                            <AlignLeft size={14} className="text-gray-400 mt-0.5 shrink-0" />
                                            <span className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap break-keep">{item.memo}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-white shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
                {branch.status === 'confirmed' ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-4 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 size={24} className="text-green-600" />
                            <span className="text-sm font-bold text-green-800">이 일정이 최종 여행 코스로 확정되었습니다.</span>
                        </div>
                        {isAuthLoading ? (
                            <div className="flex items-center justify-center w-[120px] h-[34px] bg-white border border-gray-200 rounded-lg mt-1 text-gray-400">
                                <Loader2 size={14} className="animate-spin" />
                            </div>
                        ) : canUnlock && (
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
                        {isAuthLoading ? (
                            <div className="flex items-center justify-center w-[130px] h-[34px] bg-white border border-gray-200 rounded-lg text-gray-400">
                                <Loader2 size={14} className="animate-spin" />
                            </div>
                        ) : canUnlock && (
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

                            {decisionDeadline && deadlineStatus.hasDeadline && !isLocked && (
                                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border shadow-sm ${deadlineStatus.passed ? 'bg-red-50 text-red-600 border-red-100' : 'bg-orange-50 text-orange-600 border-orange-100 animate-pulse'}`}>
                                    <Timer size={14} />
                                    <span className="text-[11px] font-bold tracking-wide">
                                        {deadlineStatus.passed ? '마감됨' : `마감까지 ${deadlineStatus.countdownText}`}
                                    </span>
                                </div>
                            )}
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
                            <button
                                onClick={() => handleVote('agree')}
                                disabled={isVoteDisabled || votingType !== null || currentMyVote === 'agree'}
                                className={`flex-1 flex justify-center items-center gap-1.5 py-2.5 border rounded-lg text-xs font-bold transition-colors disabled:cursor-not-allowed ${currentMyVote === 'agree'
                                    ? 'bg-blue-50 border-blue-200 text-blue-700 disabled:opacity-100'
                                    : 'border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-50'
                                    }`}
                            >
                                {votingType === 'agree' ? <Loader2 size={14} className="animate-spin" /> : <ThumbsUp size={14} />} 찬성
                            </button>
                            <button
                                onClick={() => handleVote('hold')}
                                disabled={isVoteDisabled || votingType !== null || currentMyVote === 'hold'}
                                className={`flex-1 flex justify-center items-center gap-1.5 py-2.5 border rounded-lg text-xs font-bold transition-colors disabled:cursor-not-allowed ${currentMyVote === 'hold'
                                    ? 'bg-gray-100 border-gray-300 text-gray-800 disabled:opacity-100'
                                    : 'border-gray-50 hover:bg-gray-100 text-gray-600 disabled:opacity-50'
                                    }`}
                            >
                                {votingType === 'hold' ? <Loader2 size={14} className="animate-spin" /> : <Minus size={14} />} 보류
                            </button>
                            <button
                                onClick={() => handleVote('disagree')}
                                disabled={isVoteDisabled || votingType !== null || currentMyVote === 'disagree'}
                                className={`flex-1 flex justify-center items-center gap-1.5 py-2.5 border rounded-lg text-xs font-bold transition-colors disabled:cursor-not-allowed ${currentMyVote === 'disagree'
                                    ? 'bg-red-50 border-red-200 text-red-700 disabled:opacity-100'
                                    : 'border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-50'
                                    }`}
                            >
                                {votingType === 'disagree' ? <Loader2 size={14} className="animate-spin" /> : <ThumbsDown size={14} />} 반대
                            </button>
                        </div>

                        {isAuthLoading ? (
                            <div className="w-full py-3 bg-gray-50 border border-gray-100 text-gray-400 rounded-xl flex justify-center items-center gap-2">
                                <Loader2 size={16} className="animate-spin" />
                                <span className="text-sm font-bold">권한 확인 중...</span>
                            </div>
                        ) : (
                            isOwner && (
                                <button
                                    onClick={handleFinalize}
                                    disabled={isVoteDisabled}
                                    className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors shadow-md flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <CheckCircle2 size={16} /> 이 일정으로 최종 확정하기
                                </button>
                            )
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
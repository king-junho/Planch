import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBranchStore } from '../store/useBranchStore';
import BranchCard from './BranchCard';
import { CheckSquare, Loader2, Users } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface BranchListViewProps {
    onSelectBranch: (branch: any) => void;
    onOpenCreateModal: () => void;
    isLocked?: boolean;
    confirmedBranchId?: number | null;
    selectedForCompare: number[];
    toggleCompareSelection: (id: number) => void;
    onOpenCompare: () => void;
}

interface ActiveSession {
    sessionKey: string;
    branchId: number | null;
    isCreating: boolean;
    users: { userId: number; name: string; color: string }[];
}

export default function BranchListView({
    onSelectBranch,
    onOpenCreateModal,
    isLocked = false,
    confirmedBranchId = null,
    selectedForCompare,
    toggleCompareSelection,
    onOpenCompare
}: BranchListViewProps) {
    const { tripRoomId } = useParams<{ tripRoomId: string }>();
    const navigate = useNavigate();
    const { branches, isLoading } = useBranchStore();

    const [socket, setSocket] = useState<Socket | null>(null);
    const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);

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

        newSocket.on('collab:active_sessions', (sessions: ActiveSession[]) => {
            setActiveSessions(sessions);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [tripRoomId]);

    const handleJoinSession = (session: ActiveSession) => {
        if (session.isCreating) {
            navigate(`/trip-rooms/${tripRoomId}/branch/create`);
        } else if (session.branchId) {
            const targetBranch = branches.find(b => b.id === session.branchId);
            if (targetBranch) {
                navigate(`/trip-rooms/${tripRoomId}/branch/edit`, { state: { editBranch: targetBranch } });
            }
        }
    };

    const branchesWithOverride = branches.map(branch => {
        let currentStatus = branch.status;

        if (isLocked && branch.id === confirmedBranchId) {
            currentStatus = 'confirmed';
        } else if (!isLocked && currentStatus === 'confirmed') {
            currentStatus = 'voting';
        }

        return {
            ...branch,
            status: (currentStatus || 'voting') as "confirmed" | "voting" | "pending"
        };
    });

    const sortedBranches = [...branchesWithOverride].sort((a, b) => {
        if (a.status === 'confirmed' && b.status !== 'confirmed') return -1;
        if (a.status !== 'confirmed' && b.status === 'confirmed') return 1;
        return 0;
    });

    return (
        <div className="w-full flex flex-col h-full bg-stone-50/50 relative">
            <div className="p-7 border-b border-gray-100 bg-white shrink-0 flex flex-col gap-5">
                <div className="min-w-0">
                    <h2 className="text-2xl font-bold text-gray-900">브랜치 목록</h2>
                    <p className="text-sm text-gray-500 mt-1.5">
                        비교할 브랜치를 선택하고 지도에서 동선을 확인해 보세요.
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full">
                    <button
                        disabled={selectedForCompare.length < 2 || isLoading}
                        onClick={onOpenCompare}
                        className="flex-1 justify-center py-3 bg-blue-50 text-blue-600 border border-blue-100 text-sm font-bold rounded-xl hover:bg-blue-100 hover:border-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <CheckSquare size={18} />
                        {selectedForCompare.length > 0 ? `${selectedForCompare.length}개 비교` : '비교하기'}
                    </button>

                    <button
                        onClick={onOpenCreateModal}
                        disabled={isLoading || isLocked}
                        className="flex-1 justify-center py-3 bg-gray-900 text-white text-sm font-bold rounded-xl shadow-md hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        + 새 브랜치
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-7 flex flex-col gap-5 custom-scrollbar">
                {activeSessions.length > 0 && (
                    <div className="flex flex-col gap-3 mb-2">
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 px-1">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            진행 중인 실시간 공동 작업
                        </h3>
                        {activeSessions.map(session => {
                            const branchName = session.isCreating
                                ? "새 브랜치 만들기"
                                : (branches.find(b => b.id === session.branchId)?.title || "알 수 없는 브랜치");

                            return (
                                <div key={session.sessionKey} className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl shadow-sm hover:border-blue-300 transition-colors">
                                    <div className="flex flex-col gap-1.5 min-w-0">
                                        <span className="text-sm font-bold text-blue-900 truncate pr-2">{branchName}</span>
                                        <div className="flex items-center gap-1.5">
                                            <Users size={12} className="text-blue-500" />
                                            <span className="text-xs font-bold text-blue-700">{session.users.length}명 참여 중</span>
                                            <div className="flex ml-2">
                                                {session.users.slice(0, 3).map((u) => (
                                                    <div
                                                        key={u.userId}
                                                        className="w-5 h-5 rounded-full border border-white flex items-center justify-center text-[8px] font-bold text-white -ml-1.5 first:ml-0"
                                                        style={{ backgroundColor: u.color }}
                                                        title={u.name}
                                                    >
                                                        {u.name.charAt(0)}
                                                    </div>
                                                ))}
                                                {session.users.length > 3 && (
                                                    <div className="w-5 h-5 rounded-full border border-white flex items-center justify-center text-[8px] font-bold text-blue-600 bg-blue-100 -ml-1.5">
                                                        +{session.users.length - 3}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleJoinSession(session)}
                                        className="shrink-0 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                    >
                                        참여하기
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        <span className="text-sm font-bold">브랜치 목록을 불러오는 중입니다...</span>
                    </div>
                ) : sortedBranches.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 text-center text-gray-400">
                        <span>등록된 브랜치가 없습니다.</span>
                        <span>새 브랜치를 만들어보세요.</span>
                    </div>
                ) : (
                    sortedBranches.map(branch => {
                        const isSelected = selectedForCompare.includes(branch.id);

                        return (
                            <div key={branch.id} className="relative group">
                                <div
                                    onClick={() => toggleCompareSelection(branch.id)}
                                    className={`absolute top-5 left-4 z-10 w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${isSelected ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300 group-hover:border-blue-400'}`}
                                >
                                    {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                                </div>

                                <div className="pl-8">
                                    <BranchCard
                                        branch={branch}
                                        onViewDetail={() => onSelectBranch(branch)}
                                    />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
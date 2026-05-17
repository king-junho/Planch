import { useState, useEffect, useRef, MouseEvent } from 'react';
import { useParams } from 'react-router-dom';
import { useProposalStore } from '../../proposal/store/useProposalStore';
import { useBranchStore } from '../store/useBranchStore';
import { useToastStore } from '../../store/useToastStore';
import BranchMap from './BranchMap';
import BranchCreateHeader from './BranchCreateHeader';
import BranchCreateSidebar from './BranchCreateSidebar';
import BranchCreateTimeline from './BranchCreateTimeline';
import { RouteItem, Branch } from '../../../types/branch';
import { ChevronLeft, ChevronRight, MousePointer2 } from 'lucide-react';
import LoadingOverlay from '../../../components/common/LoadingOverlay';
import { io, Socket } from 'socket.io-client';

interface BranchCreateCanvasProps {
    onBack: () => void;
    editBranch?: Branch | null;
}

interface OmitCursorData {
    userId: number;
    userName: string;
    x: number;
    y: number;
    color: string;
}

export default function BranchCreateCanvas({ onBack, editBranch }: BranchCreateCanvasProps) {
    const { tripRoomId } = useParams<{ tripRoomId: string }>();
    const [title, setTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    const [isPartnerSaving, setIsPartnerSaving] = useState(false);

    const { toast, showToast } = useToastStore();

    const { proposals, fetchProposals } = useProposalStore();
    const {
        draftRoutes,
        currentDraftDay,
        setCurrentDraftDay,
        addPlaceToDraft,
        removePlaceFromDraft,
        updateDraftPlace,
        setDraftRoutes,
        resetDraft,
        reorderDraftPlace,
        sortDraftByTime,
        setSelectedBranch,
        createBranch,
        updateBranch,
        tripDuration,
        tripStartDate,
        fetchTripDuration
    } = useBranchStore();

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const canvasContainerRef = useRef<HTMLDivElement>(null);

    const [socket, setSocket] = useState<Socket | null>(null);
    const [othersCursors, setOthersCursors] = useState<Record<string, OmitCursorData>>({});
    const lastMoveTime = useRef<number>(0);

    const onBackRef = useRef(onBack);
    useEffect(() => {
        onBackRef.current = onBack;
    }, [onBack]);

    const scrollByAmount = (amount: number) => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('planch.accessToken');
        if (!tripRoomId || !token) return;

        const socketUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:4000';

        const newSocket = io(socketUrl, {
            auth: { token },
            transports: ['websocket']
        });

        const currentSessionKey = editBranch?.id ? `edit_${editBranch.id}` : 'create';

        newSocket.on('connect', () => {
            newSocket.emit('collab:join', { tripRoomId: Number(tripRoomId) }, (res: any) => {
                if (res?.ok) {
                    newSocket.emit('collab:start_edit', { branchId: editBranch?.id || null });
                }
            });
        });

        newSocket.on('collab:cursor_moved', (data: OmitCursorData) => {
            setOthersCursors(prev => ({
                ...prev,
                [data.userId]: data
            }));
        });

        newSocket.on('collab:user_left', (userId: number) => {
            setOthersCursors(prev => {
                const updated = { ...prev };
                delete updated[userId];
                return updated;
            });
        });

        newSocket.on('collab:receive_action', (action: any) => {
            if (action.sessionKey !== currentSessionKey) return;

            switch (action.type) {
                case 'ADD_PLACE':
                    addPlaceToDraft(action.day, action.place);
                    break;
                case 'REMOVE_PLACE':
                    removePlaceFromDraft(action.day, action.id);
                    break;
                case 'UPDATE_PLACE':
                    updateDraftPlace(action.day, action.id, action.updates);
                    break;
                case 'REORDER_PLACE':
                    reorderDraftPlace(action.day, action.startIndex, action.endIndex);
                    break;
                case 'SORT_TIME':
                    sortDraftByTime(action.day);
                    break;
                case 'UPDATE_TITLE':
                    setTitle(action.title);
                    break;
                case 'SAVE_STARTED':
                    setIsPartnerSaving(true);
                    break;
                case 'SAVE_COMPLETED':
                    setIsPartnerSaving(false);
                    showToast('success', '다른 참여자가 브랜치를 저장했습니다.');
                    onBackRef.current();
                    break;
                case 'SAVE_FAILED':
                    setIsPartnerSaving(false);
                    break;
            }
        });

        setSocket(newSocket);

        return () => {
            newSocket.emit('collab:stop_edit');
            newSocket.emit('collab:leave', { tripRoomId: Number(tripRoomId) });
            newSocket.disconnect();
        };
    }, [tripRoomId, editBranch?.id, addPlaceToDraft, removePlaceFromDraft, updateDraftPlace, reorderDraftPlace, sortDraftByTime, showToast]);

    const handleMouseMove = (e: MouseEvent) => {
        if (!socket || !canvasContainerRef.current || !tripRoomId) return;

        const now = Date.now();
        if (now - lastMoveTime.current > 50) {
            const rect = canvasContainerRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            socket.emit('collab:cursor_move', {
                tripRoomId: Number(tripRoomId),
                x,
                y
            });
            lastMoveTime.current = now;
        }
    };

    useEffect(() => {
        if (tripRoomId) {
            const loadInitialData = async () => {
                setIsFetching(true);
                try {
                    await Promise.all([
                        fetchProposals(Number(tripRoomId)),
                        fetchTripDuration(Number(tripRoomId))
                    ]);
                } finally {
                    setIsFetching(false);
                }
            };
            loadInitialData();
        } else {
            setIsFetching(false);
        }
    }, [tripRoomId, fetchProposals, fetchTripDuration]);

    useEffect(() => {
        if (editBranch) {
            setTitle(editBranch.title || editBranch.name || '');
            setCurrentDraftDay(1);
            if (editBranch?.routes) {
                setDraftRoutes(editBranch.routes);
            }
        } else {
            setTitle('');
            resetDraft();
            setSelectedBranch(null);
        }

        return () => {
            resetDraft();
        };
    }, [editBranch, setDraftRoutes, resetDraft, setCurrentDraftDay, setSelectedBranch]);

    const handleAddPlace = (name: string, x: string, y: string, address: string, placeId?: number, proposalId?: number) => {
        const newPlace: RouteItem = {
            id: Date.now(),
            placeId: placeId,
            proposalId: proposalId,
            time: '12:00',
            title: name,
            desc: address || '',
            memo: '',
            place: name,
            latitude: parseFloat(y),
            longitude: parseFloat(x),
            cost: '',
        };
        addPlaceToDraft(currentDraftDay, newPlace);
        socket?.emit('collab:sync_action', { type: 'ADD_PLACE', day: currentDraftDay, place: newPlace });
    };

    const handleSave = async () => {
        if (isSaving || isFetching || isPartnerSaving) return;

        if (!title.trim()) {
            showToast('error', '브랜치 이름을 입력해주세요.');
            return;
        }
        if (!tripRoomId) {
            showToast('error', '여행방 정보를 찾을 수 없습니다.');
            return;
        }

        setIsSaving(true);
        socket?.emit('collab:sync_action', { type: 'SAVE_STARTED' });

        let success = false;

        if (editBranch) {
            success = await updateBranch(editBranch.id, Number(tripRoomId), title);
        } else {
            success = await createBranch(Number(tripRoomId), title);
        }

        if (success) {
            showToast('success', editBranch ? '브랜치가 수정되었습니다.' : '새 브랜치가 생성되었습니다.');
            socket?.emit('collab:sync_action', { type: 'SAVE_COMPLETED' });
            onBack();
        } else {
            setIsSaving(false);
            socket?.emit('collab:sync_action', { type: 'SAVE_FAILED' });
        }
    };

    const getDateTabLabel = (dayIndex: number) => {
        if (!tripStartDate) return `${dayIndex}일차`;
        const date = new Date(tripStartDate);
        date.setDate(date.getDate() + (dayIndex - 1));
        return `${date.getMonth() + 1}/${date.getDate()} (${dayIndex}일차)`;
    };

    const showOverlay = isSaving || isFetching || isPartnerSaving;

    let overlayText = '데이터를 불러오는 중입니다...';
    if (isSaving) overlayText = '일정을 저장하고 있습니다...';
    if (isPartnerSaving) overlayText = '다른 참여자가 일정을 저장하고 있습니다...';

    return (
        <div
            ref={canvasContainerRef}
            className="flex w-full h-full overflow-hidden bg-white relative"
            onMouseMove={handleMouseMove}
        >
            {Object.values(othersCursors).map(cursor => (
                <div
                    key={cursor.userId}
                    className="absolute pointer-events-none z-[99999] transition-all duration-75 ease-linear"
                    style={{
                        transform: `translate(${cursor.x}px, ${cursor.y}px)`,
                        left: 0, top: 0
                    }}
                >
                    <MousePointer2 size={20} fill={cursor.color} color="white" />
                    <span
                        className="ml-4 mt-1 px-2 py-0.5 rounded text-[10px] text-white font-bold whitespace-nowrap shadow-sm"
                        style={{ backgroundColor: cursor.color }}
                    >
                        {cursor.userName}
                    </span>
                </div>
            ))}

            {showOverlay && (
                <LoadingOverlay text={overlayText} />
            )}

            <div className="w-3/5 min-w-[800px] flex flex-col h-full border-r border-gray-200 shrink-0 relative z-10">
                <BranchCreateHeader
                    title={title}
                    setTitle={(newTitle) => {
                        if (typeof newTitle === 'string') {
                            setTitle(newTitle);
                            socket?.emit('collab:sync_action', { type: 'UPDATE_TITLE', title: newTitle });
                        }
                    }}
                    onSave={handleSave}
                    onBack={onBack}
                    isSaving={isSaving || isFetching}
                    isPartnerSaving={isPartnerSaving}
                />

                <div className="flex items-center justify-between gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100 shrink-0">
                    <button
                        disabled={showOverlay}
                        onClick={() => scrollByAmount(-150)}
                        className="p-1 disabled:opacity-20 hover:bg-white hover:shadow-sm rounded-full transition-all shrink-0 text-gray-500"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <div
                        ref={scrollContainerRef}
                        className="flex gap-2 overflow-x-auto flex-nowrap scrollbar-hide scroll-smooth px-1"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {Array.from({ length: tripDuration }).map((_, i) => (
                            <button
                                key={i + 1}
                                disabled={showOverlay}
                                onClick={() => setCurrentDraftDay(i + 1)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${currentDraftDay === i + 1
                                    ? 'bg-gray-900 text-white shadow-md'
                                    : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
                                    } disabled:opacity-50`}
                            >
                                {getDateTabLabel(i + 1)}
                            </button>
                        ))}
                    </div>

                    <button
                        disabled={showOverlay}
                        onClick={() => scrollByAmount(150)}
                        className="p-1 disabled:opacity-20 hover:bg-white hover:shadow-sm rounded-full transition-all shrink-0 text-gray-500"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    <BranchCreateSidebar proposals={proposals} onAddPlace={handleAddPlace} />
                    <BranchCreateTimeline
                        draftRoute={draftRoutes[currentDraftDay] || []}
                        currentDay={currentDraftDay}
                        onRemovePlace={(id) => {
                            removePlaceFromDraft(currentDraftDay, id);
                            socket?.emit('collab:sync_action', { type: 'REMOVE_PLACE', day: currentDraftDay, id });
                        }}
                        onUpdatePlace={(id, updates) => {
                            updateDraftPlace(currentDraftDay, id, updates);
                            socket?.emit('collab:sync_action', { type: 'UPDATE_PLACE', day: currentDraftDay, id, updates });
                        }}
                        onReorderPlace={(startIndex, endIndex) => {
                            reorderDraftPlace(currentDraftDay, startIndex, endIndex);
                            socket?.emit('collab:sync_action', { type: 'REORDER_PLACE', day: currentDraftDay, startIndex, endIndex });
                        }}
                        onSortByTime={() => {
                            sortDraftByTime(currentDraftDay);
                            socket?.emit('collab:sync_action', { type: 'SORT_TIME', day: currentDraftDay });
                        }}
                    />
                </div>
            </div>

            <div className="flex-1 h-full relative z-0">
                <BranchMap />
            </div>

            {toast && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[9999] animate-in fade-in slide-in-from-top-10">
                    <div className={`rounded-full px-6 py-3 text-sm font-bold shadow-lg transition-colors ${toast.type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-50 text-red-600 border border-red-100'
                        }`}>
                        {toast.message}
                    </div>
                </div>
            )}
        </div>
    );
}
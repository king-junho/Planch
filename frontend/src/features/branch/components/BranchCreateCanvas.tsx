import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useProposalStore } from '../../proposal/store/useProposalStore';
import { useBranchStore } from '../store/useBranchStore';
import BranchMap from './BranchMap';
import BranchCreateHeader from './BranchCreateHeader';
import BranchCreateSidebar from './BranchCreateSidebar';
import BranchCreateTimeline from './BranchCreateTimeline';
import { RouteItem, Branch } from '../../../types/branch';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import LoadingOverlay from '../../../components/common/LoadingOverlay';

interface BranchCreateCanvasProps {
    onBack: () => void;
    editBranch?: Branch | null;
}

export default function BranchCreateCanvas({ onBack, editBranch }: BranchCreateCanvasProps) {
    const { tripRoomId } = useParams<{ tripRoomId: string }>();
    const [title, setTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const [isFetching, setIsFetching] = useState(true);

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
            // 수정: editBranch가 존재할 때 안전하게 접근
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
            place: name,
            latitude: parseFloat(y),
            longitude: parseFloat(x),
            cost: '',
        };
        addPlaceToDraft(currentDraftDay, newPlace);
    };

    const handleSave = async () => {
        if (isSaving || isFetching) return;

        if (!title.trim()) return alert('브랜치 이름을 입력해주세요.');
        if (!tripRoomId) return alert('여행방 정보를 찾을 수 없습니다.');

        setIsSaving(true);

        let success = false;

        if (editBranch) {
            success = await updateBranch(editBranch.id, Number(tripRoomId), title);
        } else {
            success = await createBranch(Number(tripRoomId), title);
        }

        if (success) {
            onBack();
        } else {
            setIsSaving(false);
        }
    };

    const getDateTabLabel = (dayIndex: number) => {
        if (!tripStartDate) return `${dayIndex}일차`;
        const date = new Date(tripStartDate);
        date.setDate(date.getDate() + (dayIndex - 1));
        return `${date.getMonth() + 1}/${date.getDate()} (${dayIndex}일차)`;
    };

    const showOverlay = isSaving || isFetching;

    return (
        <div className="flex w-full h-full overflow-hidden bg-white relative">
            {showOverlay && (
                <LoadingOverlay
                    text={isFetching ? '데이터를 불러오는 중입니다...' : '일정을 저장하고 있습니다...'}
                />
            )}

            <div className="w-3/5 min-w-[800px] flex flex-col h-full border-r border-gray-200 shrink-0 relative z-10">
                <BranchCreateHeader
                    title={title}
                    setTitle={setTitle}
                    onSave={handleSave}
                    onBack={onBack}
                    isSaving={showOverlay}
                />

                <div className="flex items-center justify-center gap-6 py-3 bg-gray-50 border-b border-gray-100">
                    <button
                        disabled={currentDraftDay <= 1 || showOverlay}
                        onClick={() => setCurrentDraftDay(currentDraftDay - 1)}
                        className="p-1 disabled:opacity-20 hover:bg-white rounded-full transition-all"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex gap-2">
                        {Array.from({ length: tripDuration }).map((_, i) => (
                            <button
                                key={i + 1}
                                disabled={showOverlay}
                                onClick={() => setCurrentDraftDay(i + 1)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${currentDraftDay === i + 1 ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-400 border border-gray-100'} disabled:opacity-50`}
                            >
                                {getDateTabLabel(i + 1)}
                            </button>
                        ))}
                    </div>
                    <button
                        disabled={currentDraftDay >= tripDuration || showOverlay}
                        onClick={() => setCurrentDraftDay(currentDraftDay + 1)}
                        className="p-1 disabled:opacity-20 hover:bg-white rounded-full transition-all"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    <BranchCreateSidebar proposals={proposals} onAddPlace={handleAddPlace} />
                    <BranchCreateTimeline
                        draftRoute={draftRoutes[currentDraftDay] || []}
                        currentDay={currentDraftDay}
                        onRemovePlace={(id) => removePlaceFromDraft(currentDraftDay, id)}
                        onUpdatePlace={(id, updates) => updateDraftPlace(currentDraftDay, id, updates)}
                        onReorderPlace={(startIndex, endIndex) => reorderDraftPlace(currentDraftDay, startIndex, endIndex)}
                        onSortByTime={() => sortDraftByTime(currentDraftDay)}
                    />
                </div>
            </div>
            <div className="flex-1 h-full relative z-0">
                <BranchMap />
            </div>
        </div>
    );
}
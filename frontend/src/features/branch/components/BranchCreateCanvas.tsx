import { useState, useEffect } from 'react';
import { useProposalStore } from '../../proposal/store/useProposalStore';
import { useBranchStore } from '../store/useBranchStore';
import BranchMap from './BranchMap';
import BranchCreateHeader from './BranchCreateHeader';
import BranchCreateSidebar from './BranchCreateSidebar';
import BranchCreateTimeline from './BranchCreateTimeline';
import { RouteItem, Branch } from '../../../types/branch';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BranchCreateCanvasProps {
    onBack: () => void;
    editBranch?: Branch | null;
}

export default function BranchCreateCanvas({ onBack, editBranch }: BranchCreateCanvasProps) {
    const [title, setTitle] = useState('');
    const tripDuration = 3;

    const { proposals } = useProposalStore();
    const {
        draftRoutes,
        currentDraftDay,
        setCurrentDraftDay,
        addPlaceToDraft,
        removePlaceFromDraft,
        updateDraftPlace,
        addBranch,
        updateBranch,
        setDraftRoutes,
        resetDraft,
        reorderDraftPlace,
        sortDraftByTime,
        setSelectedBranch
    } = useBranchStore();

    useEffect(() => {
        if (editBranch) {
            setTitle(editBranch.title);
            const copiedRoutes = JSON.parse(JSON.stringify(editBranch.routes));
            setDraftRoutes(copiedRoutes);
            setCurrentDraftDay(1);
        } else {
            setTitle('');
            resetDraft();
            setSelectedBranch(null);
        }

        return () => {
            resetDraft();
        };
    }, [editBranch, setDraftRoutes, resetDraft, setCurrentDraftDay, setSelectedBranch]);

    const handleAddPlace = (name: string, x: string, y: string, address: string) => {
        const newPlace: RouteItem = {
            id: Date.now(),
            time: '12:00',
            title: name,
            desc: '',
            place: name,
            latitude: parseFloat(y),
            longitude: parseFloat(x),
            cost: '',
        };
        addPlaceToDraft(currentDraftDay, newPlace);
    };

    const handleSave = () => {
        if (!title.trim()) return alert('브랜치 이름을 입력해주세요.');

        const completeRoutes: Record<number, RouteItem[]> = {};
        for (let i = 1; i <= tripDuration; i++) {
            completeRoutes[i] = draftRoutes[i] || [];
        }

        if (editBranch) {
            updateBranch({
                ...editBranch,
                title,
                routes: completeRoutes
            });
        } else {
            addBranch({
                id: Date.now(),
                title,
                description: "팀원이 구성한 일정입니다.",
                proposer: "나",
                isAI: false,
                status: "voting",
                cost: "미정",
                time: "계산 중",
                matchRate: 100,
                routes: completeRoutes
            });
        }

        resetDraft();
        onBack();
    };

    return (
        <div className="flex w-full h-full overflow-hidden bg-white">
            <div className="w-3/5 min-w-[800px] flex flex-col h-full border-r border-gray-200 shrink-0 relative z-10">
                <BranchCreateHeader title={title} setTitle={setTitle} onSave={handleSave} onBack={onBack} />

                <div className="flex items-center justify-center gap-6 py-3 bg-gray-50 border-b border-gray-100">
                    <button
                        disabled={currentDraftDay <= 1}
                        onClick={() => setCurrentDraftDay(currentDraftDay - 1)}
                        className="p-1 disabled:opacity-20 hover:bg-white rounded-full transition-all"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex gap-2">
                        {Array.from({ length: tripDuration }).map((_, i) => (
                            <button
                                key={i + 1}
                                onClick={() => setCurrentDraftDay(i + 1)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${currentDraftDay === i + 1 ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-400 border border-gray-100'}`}
                            >
                                {i + 1}일차
                            </button>
                        ))}
                    </div>
                    <button
                        disabled={currentDraftDay >= tripDuration}
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
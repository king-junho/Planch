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

interface BranchCreateCanvasProps {
    onBack: () => void;
    editBranch?: Branch | null;
}

export default function BranchCreateCanvas({ onBack, editBranch }: BranchCreateCanvasProps) {
    const { tripRoomId } = useParams<{ tripRoomId: string }>();
    const [title, setTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false); // 중복 저장 방지 상태
    const tripDuration = 3;

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
        createBranch
    } = useBranchStore();

    useEffect(() => {
        if (tripRoomId) {
            fetchProposals(Number(tripRoomId));
        }
    }, [tripRoomId, fetchProposals]);

    useEffect(() => {
        if (editBranch) {
            setTitle(editBranch.title || editBranch.name || '');
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
            desc: address || '',
            place: name,
            latitude: parseFloat(y),
            longitude: parseFloat(x),
            cost: '',
        };
        addPlaceToDraft(currentDraftDay, newPlace);
    };

    const handleSave = async () => {
        if (isSaving) return; // 이미 저장 중이면 함수 종료

        if (!title.trim()) return alert('브랜치 이름을 입력해주세요.');
        if (!tripRoomId) return alert('여행방 정보를 찾을 수 없습니다.');

        if (editBranch) {
            alert('브랜치 수정 기능은 추후 백엔드 API 연결이 필요합니다.');
            return;
        }

        setIsSaving(true); // 저장 시작 시 잠금 설정

        const success = await createBranch(Number(tripRoomId), title);

        if (success) {
            onBack();
        } else {
            setIsSaving(false); // 실패 시에만 잠금 해제
        }
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
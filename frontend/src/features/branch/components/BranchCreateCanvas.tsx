import { useState } from 'react';
import { useProposalStore } from '../../proposal/store/useProposalStore';
import { useBranchStore } from '../store/useBranchStore';
// KakaoMapArea 대신 BranchMap을 임포트합니다.
import BranchMap from './BranchMap';
import BranchCreateHeader from './BranchCreateHeader';
import BranchCreateSidebar from './BranchCreateSidebar';
import BranchCreateTimeline from './BranchCreateTimeline';
import { RouteItem, Branch } from '../../../types/branch';

interface BranchCreateCanvasProps {
    onBack: () => void;
}

export default function BranchCreateCanvas({ onBack }: BranchCreateCanvasProps) {
    const [title, setTitle] = useState('');
    const { proposals } = useProposalStore();
    const { draftRoute, setDraftRoute, addBranch } = useBranchStore();

    const handleAddPlace = (name: string, x: string, y: string, address: string) => {
        const newPlace: RouteItem = {
            id: Date.now(),
            time: '12:00',
            title: name,
            desc: address,
            place: name,
            x: x,
            y: y,
            latitude: parseFloat(y),
            longitude: parseFloat(x),
            cost: '미정'
        };
        setDraftRoute([...draftRoute, newPlace]);
    };

    const handleUpdateTime = (id: number, newTime: string) => {
        setDraftRoute(draftRoute.map(item =>
            item.id === id ? { ...item, time: newTime } : item
        ));
    };

    const handleRemovePlace = (id: number) => {
        setDraftRoute(draftRoute.filter(item => item.id !== id));
    };

    const handleSave = () => {
        if (!title.trim()) return alert('브랜치 이름을 입력해주세요.');
        if (draftRoute.length === 0) return alert('최소 한 개 이상의 장소를 추가해주세요.');

        const newBranch: Branch = {
            id: Date.now(),
            title: title,
            description: "팀원이 직접 구성한 맞춤 일정입니다.",
            proposer: "나",
            isAI: false,
            status: "voting",
            cost: "미정",
            time: "계산 중",
            matchRate: 100,
            routes: { 1: draftRoute }
        };

        addBranch(newBranch);
        setDraftRoute([]);
        onBack();
    };

    return (
        <div className="flex w-full h-full overflow-hidden">
            <div className="w-3/5 min-w-[800px] flex flex-col h-full bg-white border-r border-gray-200 shrink-0 relative z-10">
                <BranchCreateHeader
                    title={title}
                    setTitle={setTitle}
                    onSave={handleSave}
                    onBack={onBack}
                />
                <div className="flex-1 flex overflow-hidden">
                    <BranchCreateSidebar
                        proposals={proposals}
                        onAddPlace={handleAddPlace}
                    />
                    <BranchCreateTimeline
                        draftRoute={draftRoute}
                        onRemovePlace={handleRemovePlace}
                        onUpdateTime={handleUpdateTime}
                    />
                </div>
            </div>
            <div className="flex-1 h-full relative z-0">
                {/* 생성 중인 경로(draftRoute)를 시각화하기 위해 BranchMap을 사용합니다. */}
                <BranchMap />
            </div>
        </div>
    );
}
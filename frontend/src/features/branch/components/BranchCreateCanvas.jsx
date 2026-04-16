import { useState } from 'react';
import { useProposalStore } from '../../proposal/store/useProposalStore';
import { usePreferenceStore } from '../../preference/store/usePreferenceStore';
import { useBranchStore } from '../store/useBranchStore';
import KakaoMapArea from '../../map/components/KakaoMapArea';

import BranchCreateHeader from './BranchCreateHeader';
import BranchCreateSidebar from './BranchCreateSidebar';
import BranchCreateTimeline from './BranchCreateTimeline';

export default function BranchCreateCanvas({ onBack }) {
    const [title, setTitle] = useState('');

    const { proposals } = useProposalStore();
    const { preferences } = usePreferenceStore();
    const { draftRoute, setDraftRoute, addBranch } = useBranchStore();

    const handleAddPlace = (name, x, y, address) => {
        const newPlace = {
            id: Date.now(),
            time: '12:00',
            title: name,
            desc: address,
            place: name,
            x: x,
            y: y,
            cost: '미정'
        };
        setDraftRoute([...draftRoute, newPlace]);
    };

    const handleUpdateTime = (id, newTime) => {
        setDraftRoute(draftRoute.map(item =>
            item.id === id ? { ...item, time: newTime } : item
        ));
    };

    const handleRemovePlace = (id) => {
        setDraftRoute(draftRoute.filter(p => p.id !== id));
    };

    const handleSave = () => {
        if (!title) return alert('브랜치 이름을 입력해 주세요.');
        if (draftRoute.length === 0) return alert('최소 하나 이상의 장소를 추가해 주세요.');

        const newBranch = {
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
                        preferences={preferences}
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
                <KakaoMapArea activeTab="BRANCH_CREATE" />
            </div>
        </div>
    );
}
import { useState } from 'react';
import CreateBranchModal from '../../branch/components/CreateBranchModal';
import PreferenceSidebar from './PreferenceSidebar';
import PreferenceOverallView from './PreferenceOverallView';
import PreferenceMemberView from './PreferenceMemberView';

export default function PreferenceSection({ tripRoomId, setActiveTab }) {
    const [viewMode, setViewMode] = useState('overall');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const mockTeamData = [
        { id: 1, name: '나', budget: 300000, styles: ['맛집', '사진스팟'], mustGo: ['아르떼뮤지엄'], mustAvoid: ['웨이팅 긴 곳'], activeTimes: ['오후'], freeText: '뚜벅이 여행이라 이동 동선이 짧았으면 좋겠어요.' },
        { id: 2, name: '팀원 A', budget: 250000, styles: ['휴식', '카페'], mustGo: ['오션뷰 카페'], mustAvoid: ['등산'], activeTimes: ['오전', '오후'], freeText: '사진 찍기 좋은 카페.' },
        { id: 3, name: '팀원 B', budget: 400000, styles: ['맛집', '액티비티'], mustGo: ['흑돼지 전문점', '카트 체험'], mustAvoid: ['비싼 식당'], activeTimes: ['오후', '저녁'], freeText: '활동적인 체험 하나.' }
    ];

    const currentData = viewMode === 'overall' ? null : mockTeamData.find(m => m.id === viewMode);

    return (
        <div className="flex w-full h-full bg-white overflow-hidden relative">
            <PreferenceSidebar mockTeamData={mockTeamData} viewMode={viewMode} setViewMode={setViewMode} />

            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-white">
                {viewMode === 'overall' ? (
                    <PreferenceOverallView
                        onOpenAiModal={() => setIsCreateModalOpen(true)}
                        onCreateManual={() => setActiveTab('BRANCH_CREATE')}
                    />
                ) : (
                    <PreferenceMemberView currentData={currentData} />
                )}
            </div>

            <CreateBranchModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </div>
    );
}
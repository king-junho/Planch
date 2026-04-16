import { useState } from 'react';
import BranchDetailSection from './BranchDetailSection';
import BranchListView from './BranchListView';
import CreateBranchModal from './CreateBranchModal';
import KakaoMapArea from '../../map/components/KakaoMapArea';
import { useBranchStore } from '../store/useBranchStore';

export default function BranchSection({ tripRoomId, setActiveTab }) {
    const { branches, selectedBranch, setSelectedBranch } = useBranchStore();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    return (
        <div className="flex w-full h-full overflow-hidden">
            {selectedBranch ? (
                <BranchDetailSection
                    branch={selectedBranch}
                    onBack={() => setSelectedBranch(null)}
                />
            ) : (
                <BranchListView
                    branches={branches}
                    onSelectBranch={setSelectedBranch}
                    onOpenCreateModal={() => setIsCreateModalOpen(true)}
                />
            )}

            <div className="flex-1 h-full relative z-0">
                <KakaoMapArea activeTab="BRANCH" />
            </div>

            <CreateBranchModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                // 모달 안에서 '직접 만들기'를 눌렀을 때 실행될 함수를 전달합니다.
                onCreateManual={() => {
                    setIsCreateModalOpen(false); // 모달 닫기
                    setActiveTab('BRANCH_CREATE'); // 캔버스로 이동
                }}
            />
        </div>
    );
}
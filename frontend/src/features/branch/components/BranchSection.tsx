import { useState } from 'react';
import { useBranchStore } from '../store/useBranchStore';
import BranchListView from './BranchListView';
import BranchDetailSection from './BranchDetailSection';
import CreateBranchModal from './CreateBranchModal';
// KakaoMapArea 대신 BranchMap을 임포트합니다.
import BranchMap from './BranchMap';
import { useNavigate, useParams } from 'react-router-dom';

export default function BranchSection() {
    const { tripRoomId } = useParams();
    const navigate = useNavigate();
    const { selectedBranch, setSelectedBranch } = useBranchStore();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    return (
        <div className="flex w-full h-full overflow-hidden">
            <div className="w-[400px] border-r border-gray-100 bg-white z-10 overflow-hidden">
                {selectedBranch ? (
                    <BranchDetailSection
                        branch={selectedBranch}
                        onBack={() => setSelectedBranch(null)}
                    />
                ) : (
                    <BranchListView
                        onSelectBranch={setSelectedBranch}
                        onOpenCreateModal={() => setIsCreateModalOpen(true)}
                    />
                )}
            </div>

            <div className="flex-1 relative z-0">
                {/* 분리된 브랜치 전용 지도를 배치합니다. */}
                <BranchMap />
            </div>

            <CreateBranchModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreateManual={() => {
                    setIsCreateModalOpen(false);
                    navigate(`/trip-rooms/${tripRoomId}/branch/create`);
                }}
            />
        </div>
    );
}
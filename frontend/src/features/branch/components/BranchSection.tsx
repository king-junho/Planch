import { useState, useEffect } from 'react';
import { useBranchStore } from '../store/useBranchStore';
import BranchListView from './BranchListView';
import BranchDetailSection from './BranchDetailSection';
import CreateBranchModal from './CreateBranchModal';
import BranchMap from './BranchMap';
import { useNavigate, useParams } from 'react-router-dom';

export default function BranchSection() {
    const { tripRoomId } = useParams();
    const navigate = useNavigate();

    // 스토어에서 fetchBranches 함수를 추가로 가져옵니다.
    const { selectedBranch, setSelectedBranch, fetchBranches } = useBranchStore();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // 컴포넌트가 렌더링되거나 tripRoomId가 변경될 때 서버에서 최신 브랜치 목록을 불러옵니다.
    useEffect(() => {
        if (tripRoomId) {
            fetchBranches(Number(tripRoomId));
        }
    }, [tripRoomId, fetchBranches]);

    return (
        <div className="flex w-full h-full overflow-hidden">
            {/* 넓이를 500px로 늘리고, 화면 축소 시 찌그러짐을 방지하는 속성을 추가했습니다. */}
            <div className="w-[500px] min-w-[500px] shrink-0 border-r border-gray-100 bg-white z-10 flex flex-col overflow-hidden">
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
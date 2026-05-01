import { useState, useEffect } from 'react';
import { useBranchStore } from '../store/useBranchStore';
import BranchListView from './BranchListView';
import BranchDetailSection from './BranchDetailSection';
import CreateBranchModal from './CreateBranchModal';
import BranchMap from './BranchMap';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../api/axiosInstance';

export default function BranchSection() {
    const { tripRoomId } = useParams();
    const navigate = useNavigate();

    const { selectedBranch, setSelectedBranch, fetchBranches } = useBranchStore();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const [isLocked, setIsLocked] = useState(false);
    // 확정된 브랜치의 ID를 저장할 state를 추가합니다.
    const [confirmedBranchId, setConfirmedBranchId] = useState<number | null>(null);

    useEffect(() => {
        if (tripRoomId) {
            const numericId = Number(tripRoomId);
            fetchBranches(numericId);

            api.get(`/trip-rooms/${numericId}`)
                .then(response => {
                    const roomStatus = response.data.status;
                    if (roomStatus === 'locked' || roomStatus === 'confirmed') {
                        setIsLocked(true);
                    }

                    // 백엔드에서 넘겨주는 summary 데이터에서 확정된 브랜치 ID를 추출하여 저장합니다.
                    const selectedId = response.data.summary?.selectedBranchId;
                    if (selectedId) {
                        setConfirmedBranchId(selectedId);
                    }
                })
                .catch(error => console.error("방 정보 조회 실패:", error));
        }
    }, [tripRoomId, fetchBranches]);

    // 상세 화면에 넘겨줄 브랜치 객체의 status를 강제로 'confirmed'로 덮어씌웁니다.
    const activeBranch = selectedBranch
        ? {
            ...selectedBranch,
            status: selectedBranch.id === confirmedBranchId ? 'confirmed' : selectedBranch.status
        }
        : null;

    return (
        <div className="flex w-full h-full overflow-hidden">
            <div className="w-[500px] min-w-[500px] shrink-0 border-r border-gray-100 bg-white z-10 flex flex-col overflow-hidden">
                {activeBranch ? (
                    <BranchDetailSection
                        branch={activeBranch} // 덮어씌운 브랜치 데이터를 전달합니다.
                        isLocked={isLocked}
                        onBack={() => setSelectedBranch(null)}
                    />
                ) : (
                    <BranchListView
                        onSelectBranch={setSelectedBranch}
                        onOpenCreateModal={() => setIsCreateModalOpen(true)}
                        isLocked={isLocked}
                        confirmedBranchId={confirmedBranchId} // 목록 화면에도 확정 ID를 전달합니다.
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
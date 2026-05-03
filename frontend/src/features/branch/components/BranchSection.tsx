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
    const [confirmedBranchId, setConfirmedBranchId] = useState<number | null>(null);

    useEffect(() => {
        if (tripRoomId) {
            const numericId = Number(tripRoomId);
            fetchBranches(numericId);

            api.get(`/trip-rooms/${numericId}`)
                .then(response => {
                    const roomStatus = response.data.status;
                    const currentRoomLocked = roomStatus === 'locked' || roomStatus === 'confirmed';
                    setIsLocked(currentRoomLocked);

                    const selectedId = response.data.summary?.selectedBranchId;
                    if (currentRoomLocked && selectedId) {
                        setConfirmedBranchId(selectedId);
                    } else {
                        setConfirmedBranchId(null);
                    }
                })
                .catch(error => console.error("방 정보 조회 실패:", error));
        }
    }, [tripRoomId, fetchBranches]);

    // TS 에러 해결: locked 비교 제거 및 undefined 처리
    let overrideStatus = selectedBranch?.status;
    if (selectedBranch) {
        if (isLocked && selectedBranch.id === confirmedBranchId) {
            overrideStatus = 'confirmed';
        } else if (!isLocked && overrideStatus === 'confirmed') {
            overrideStatus = 'voting';
        }
    }

    // TS 에러 해결: 상태값을 확실한 타입으로 단언해줍니다.
    const activeBranch = selectedBranch
        ? {
            ...selectedBranch,
            status: (overrideStatus || 'voting') as "confirmed" | "voting" | "pending"
        }
        : null;

    return (
        <div className="flex w-full h-full overflow-hidden">
            <div className="w-[500px] min-w-[500px] shrink-0 border-r border-gray-100 bg-white z-10 flex flex-col overflow-hidden">
                {activeBranch ? (
                    <BranchDetailSection
                        branch={activeBranch}
                        isLocked={isLocked}
                        onBack={() => setSelectedBranch(null)}
                    />
                ) : (
                    <BranchListView
                        onSelectBranch={setSelectedBranch}
                        onOpenCreateModal={() => setIsCreateModalOpen(true)}
                        isLocked={isLocked}
                        confirmedBranchId={confirmedBranchId}
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
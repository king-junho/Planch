import { useState, useEffect } from 'react';
import { useBranchStore } from '../store/useBranchStore';
import BranchListView from './BranchListView';
import BranchDetailSection from './BranchDetailSection';
import CreateBranchModal from './CreateBranchModal';
import BranchMap from './BranchMap';
import BranchCompareCanvas from './BranchCompareCanvas';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../api/axiosInstance';

export default function BranchSection() {
    const { tripRoomId } = useParams();
    const navigate = useNavigate();

    const { branches, selectedBranch, setSelectedBranch, fetchBranches, fetchTripDuration } = useBranchStore();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const [isLocked, setIsLocked] = useState(false);
    const [confirmedBranchId, setConfirmedBranchId] = useState<number | null>(null);

    const [isCompareMode, setIsCompareMode] = useState(false);
    const [selectedForCompare, setSelectedForCompare] = useState<number[]>([]);

    const toggleCompareSelection = (branchId: number) => {
        setSelectedForCompare(prev => {
            if (prev.includes(branchId)) return prev.filter(id => id !== branchId);
            if (prev.length >= 3) {
                alert("비교는 최대 3개까지만 가능합니다.");
                return prev;
            }
            return [...prev, branchId];
        });
    };

    useEffect(() => {
        if (!tripRoomId) return;

        const numericId = Number(tripRoomId);
        if (!Number.isInteger(numericId) || numericId <= 0) return;

        const loadRoomState = () => {
            fetchBranches(numericId);
            fetchTripDuration(numericId);

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
        };

        loadRoomState();
        window.addEventListener("trip-room-unlocked", loadRoomState);

        return () => {
            window.removeEventListener("trip-room-unlocked", loadRoomState);
        };
    }, [tripRoomId, fetchBranches, fetchTripDuration]);

    let overrideStatus = selectedBranch?.status;
    if (selectedBranch) {
        if (isLocked && selectedBranch.id === confirmedBranchId) {
            overrideStatus = 'confirmed';
        } else if (!isLocked && overrideStatus === 'confirmed') {
            overrideStatus = 'voting';
        }
    }

    const activeBranch = selectedBranch
        ? {
            ...selectedBranch,
            status: (overrideStatus || 'voting') as "confirmed" | "voting" | "pending"
        }
        : null;

    if (isCompareMode) {
        const compareBranches = branches.filter(b => selectedForCompare.includes(b.id));
        return (
            <div className="flex w-full h-full min-w-[1000px] bg-white">
                <BranchCompareCanvas
                    compareBranches={compareBranches}
                    onBack={() => setIsCompareMode(false)}
                />
            </div>
        );
    }

    return (
        <div className="flex w-full h-full overflow-x-auto overflow-y-hidden min-w-[900px] custom-scrollbar">
            <div className="w-[400px] min-w-[400px] shrink-0 border-r border-gray-100 bg-white z-10 flex flex-col overflow-hidden">
                {activeBranch != null ? (
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
                        selectedForCompare={selectedForCompare}
                        toggleCompareSelection={toggleCompareSelection}
                        onOpenCompare={() => setIsCompareMode(true)}
                    />
                )}
            </div>

            <div className="flex-1 min-w-[500px] relative z-0">
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
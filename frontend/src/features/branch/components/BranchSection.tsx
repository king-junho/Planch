import { useState, useEffect } from 'react';
import { useBranchStore } from '../store/useBranchStore';
import BranchListView from './BranchListView';
import BranchDetailSection from './BranchDetailSection';
import CreateBranchModal from './CreateBranchModal';
import BranchMap from './BranchMap';
import BranchCompareCanvas from './BranchCompareCanvas';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../api/axiosInstance';
import { useToastStore } from '../../store/useToastStore';
import GlobalConfirmModal from '../../../components/common/GlobalConfirmModal';
import { io, Socket } from 'socket.io-client';
import { RefreshCw } from 'lucide-react';

export default function BranchSection() {
    const { tripRoomId } = useParams();
    const navigate = useNavigate();

    const { branches, selectedBranch, setSelectedBranch, fetchBranches, fetchTripDuration, isLoading } = useBranchStore();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const [isLocked, setIsLocked] = useState(false);
    const [confirmedBranchId, setConfirmedBranchId] = useState<number | null>(null);

    const [isCompareMode, setIsCompareMode] = useState(false);
    const [selectedForCompare, setSelectedForCompare] = useState<number[]>([]);

    const [hasNewUpdates, setHasNewUpdates] = useState(false);

    const { toast, showToast } = useToastStore();

    const toggleCompareSelection = (branchId: number) => {
        setSelectedForCompare(prev => {
            if (prev.includes(branchId)) return prev.filter(id => id !== branchId);
            if (prev.length >= 3) {
                showToast('error', '비교는 최대 3개까지만 가능합니다.');
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

        const token = localStorage.getItem('planch.accessToken');
        let socket: Socket | null = null;

        if (token) {
            const socketUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:4000';
            socket = io(socketUrl, {
                auth: { token },
                transports: ['websocket']
            });

            socket.on('connect', () => {
                socket?.emit('collab:join', { tripRoomId: numericId });
            });

            socket.on('collab:receive_action', (action: any) => {
                if (action.type === 'REFRESH_BRANCH_LIST' || action.type === 'SAVE_COMPLETED') {
                    setHasNewUpdates(true);
                }
            });
        }

        return () => {
            window.removeEventListener("trip-room-unlocked", loadRoomState);
            if (socket) {
                socket.emit('collab:leave', { tripRoomId: numericId });
                socket.disconnect();
            }
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
        <div className="flex w-full h-full overflow-x-auto overflow-y-hidden min-w-[900px] custom-scrollbar relative">
            <div className="w-[400px] min-w-[400px] shrink-0 border-r border-gray-100 bg-white z-10 flex flex-col overflow-hidden relative">

                {hasNewUpdates && (
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-2 fade-in duration-300 w-max">
                        <button
                            onClick={() => {
                                fetchBranches(Number(tripRoomId));
                                setHasNewUpdates(false);
                            }}
                            className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-full shadow-[0_4px_16px_rgba(37,99,235,0.4)] font-bold text-xs hover:bg-blue-700 transition-transform hover:scale-105"
                        >
                            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                            브랜치가 수정되었습니다. 갱신하시겠습니까?
                        </button>
                    </div>
                )}

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

            {toast && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-5">
                    <div className={`rounded-full px-6 py-3 text-sm font-bold shadow-lg transition-colors ${toast.type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-50 text-red-600 border border-red-100'
                        }`}>
                        {toast.message}
                    </div>
                </div>
            )}

            <GlobalConfirmModal />
        </div>
    );
}
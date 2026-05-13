import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PreferenceSidebar from './PreferenceSidebar';
import PreferenceOverallView from './PreferenceOverallView';
import PreferenceMemberView from './PreferenceMemberView';
import PreferenceForm from './PreferenceForm';
import { MemberPreference } from '../../../types/preference';
import { usePreferenceStore } from '../store/usePreferenceStore';
import api from '../../../api/axiosInstance';
import { useToastStore } from '../../store/useToastStore';

export default function PreferenceSection() {
    const { tripRoomId } = useParams<{ tripRoomId: string }>();
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<string | number>('form');

    const [isLocked, setIsLocked] = useState(false);
    const [roomMembers, setRoomMembers] = useState<any[]>([]);

    const {
        teamPreferences,
        fetchPreferences,
        saveMyPreference,
        isLoading,
        initializeFormWithExisting
    } = usePreferenceStore();

    const { toast, showToast } = useToastStore();

    useEffect(() => {
        if (!tripRoomId) return;

        const numericId = Number(tripRoomId);
        if (!Number.isInteger(numericId) || numericId <= 0) return;

        const loadRoomState = () => {
            fetchPreferences(numericId);

            api.get(`/trip-rooms/${numericId}`)
                .then(response => {
                    const roomStatus = response.data.status;
                    const currentRoomLocked = roomStatus === 'locked' || roomStatus === 'confirmed';
                    setIsLocked(currentRoomLocked);

                    const members = response.data.members || response.data.participants || response.data.users || [];
                    setRoomMembers(members);
                })
                .catch(error => console.error("방 정보 조회 실패:", error));
        };

        loadRoomState();
        window.addEventListener("trip-room-unlocked", loadRoomState);

        return () => {
            window.removeEventListener("trip-room-unlocked", loadRoomState);
        };
    }, [tripRoomId, fetchPreferences]);

    useEffect(() => {
        if (viewMode === 'form') {
            const token = localStorage.getItem('planch.accessToken');
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    const myUserId = Number(payload.sub || payload.userId || payload.id);

                    initializeFormWithExisting(myUserId);
                } catch (error) {
                    console.error("토큰 디코딩 실패:", error);
                }
            }
        }
    }, [viewMode, teamPreferences, initializeFormWithExisting]);

    const handleOpenAiModal = () => {
        showToast('success', 'AI 추천 기능은 준비 중입니다.');
    };

    const handleCreateManual = () => {
        if (tripRoomId) {
            navigate(`/trip-rooms/${tripRoomId}/proposal`);
        } else {
            navigate('/trip-rooms');
        }
    };

    const handleSave = async () => {
        if (!tripRoomId) return;
        const success = await saveMyPreference(Number(tripRoomId));
        if (success) {
            showToast('success', '선호도가 저장되었습니다.');
            setViewMode('overall');
        }
    };

    const safePreferences = Array.isArray(teamPreferences) ? teamPreferences : [];

    const baseList = roomMembers.length > 0
        ? roomMembers
        : safePreferences.map(p => p.user || { id: p.userId, name: '알 수 없는 사용자' });

    const uniqueMembers = Array.from(new Map(baseList.map(item => [item.id || item.userId, item])).values());

    const membersData = uniqueMembers.map((member: any) => {
        const memberId = member.id || member.userId;
        const pref = safePreferences.find((p: any) => (p.user?.id || p.userId) === memberId);

        return {
            id: memberId,
            name: member.name || member.nickname || '알 수 없는 사용자',
            hasData: !!pref,
            budget: pref?.budgetMax || 0,
            styles: pref?.styles || [],
            mustGo: pref?.mustVisit || [],
            mustAvoid: pref?.avoid || [],
            activeTimes: pref?.availableTime || [],
            freeText: pref?.memo || ''
        };
    });

    const currentMemberData = typeof viewMode === 'number' ? membersData.find(m => m.id === viewMode) : null;

    return (
        <div className="flex w-full h-full bg-white relative">
            <PreferenceSidebar
                mockTeamData={membersData as MemberPreference[]}
                viewMode={viewMode}
                setViewMode={setViewMode}
            />

            <div className="flex-1 h-full overflow-y-auto overflow-x-hidden bg-white custom-scrollbar relative z-0">
                <div className="w-full max-w-4xl mx-auto p-8 md:p-12">
                    {viewMode === 'form' && (
                        <>
                            <header className="mb-12 flex justify-between items-end">
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900">내 여행 취향 입력</h2>
                                    <p className="text-gray-500 mt-2 text-lg">팀원들과 공유할 나의 여행 스타일을 알려주세요.</p>
                                </div>
                                <button
                                    onClick={handleSave}
                                    disabled={isLoading || isLocked}
                                    className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed shrink-0"
                                >
                                    {isLoading ? '저장 중...' : '저장하기'}
                                </button>
                            </header>
                            <PreferenceForm isLocked={isLocked} />
                        </>
                    )}

                    {viewMode === 'overall' && (
                        <PreferenceOverallView
                            onOpenAiModal={handleOpenAiModal}
                            onCreateManual={handleCreateManual}
                            isLocked={isLocked}
                        />
                    )}

                    {typeof viewMode === 'number' && currentMemberData && (
                        <PreferenceMemberView currentData={currentMemberData as any} />
                    )}
                </div>
            </div>

            {toast && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[9999] animate-in fade-in slide-in-from-top-10">
                    <div className={`rounded-full px-6 py-3 text-sm font-bold shadow-lg transition-colors ${toast.type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-50 text-red-600 border border-red-100'
                        }`}>
                        {toast.message}
                    </div>
                </div>
            )}
        </div>
    );
}
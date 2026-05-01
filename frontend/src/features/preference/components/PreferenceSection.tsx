import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PreferenceSidebar from './PreferenceSidebar';
import PreferenceOverallView from './PreferenceOverallView';
import PreferenceMemberView from './PreferenceMemberView';
import PreferenceForm from './PreferenceForm';
import { MemberPreference } from '../../../types/preference';
import { usePreferenceStore } from '../store/usePreferenceStore';
import api from '../../../api/axiosInstance';

export default function PreferenceSection() {
    const { tripRoomId } = useParams<{ tripRoomId: string }>();
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<string | number>('form');

    // 방 잠금 상태를 관리하는 state 추가
    const [isLocked, setIsLocked] = useState(false);

    const {
        teamPreferences,
        fetchPreferences,
        saveMyPreference,
        isLoading,
        initializeFormWithExisting
    } = usePreferenceStore();

    // 1. 마운트 시 서버에서 선호도 데이터와 방 상태를 가져옵니다.
    useEffect(() => {
        if (tripRoomId) {
            const numericId = Number(tripRoomId);
            fetchPreferences(numericId);

            // api 객체를 사용하여 현재 방의 상태 확인
            api.get(`/trip-rooms/${numericId}`)
                .then(response => {
                    const roomStatus = response.data.status;
                    if (roomStatus === 'locked' || roomStatus === 'confirmed') {
                        setIsLocked(true);
                    }
                })
                .catch(error => console.error("방 정보 조회 실패:", error));
        }
    }, [tripRoomId, fetchPreferences]);

    // 2. '내 취향 입력(form)' 탭을 열거나, 팀 데이터가 업데이트될 때마다 폼을 내 정보로 동기화합니다.
    useEffect(() => {
        if (viewMode === 'form') {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    const myUserId = Number(payload.sub);

                    initializeFormWithExisting(myUserId);
                } catch (error) {
                    console.error("토큰 디코딩 실패:", error);
                }
            }
        }
    }, [viewMode, teamPreferences, initializeFormWithExisting]);

    const handleOpenAiModal = () => {
        alert('AI 추천 기능은 준비 중입니다.');
    };

    const handleCreateManual = () => {
        if (tripRoomId) {
            navigate(`/trip-rooms/${tripRoomId}/branch/create`);
        } else {
            navigate('/trip-rooms');
        }
    };

    // 내 선호도 저장 핸들러
    const handleSave = async () => {
        if (!tripRoomId) return;
        const success = await saveMyPreference(Number(tripRoomId));
        if (success) {
            alert("선호도가 저장되었습니다.");
            setViewMode('overall');
        }
    };

    // 서버 데이터를 UI용 MemberPreference 구조로 매핑
    const safePreferences = Array.isArray(teamPreferences) ? teamPreferences : [];

    const membersData: MemberPreference[] = safePreferences.map((p: any) => ({
        id: p.user?.id || p.userId,
        name: p.user?.name || '알 수 없는 사용자',
        budget: p.budgetMax || 0,
        styles: p.styles || [],
        mustGo: p.mustVisit || [],
        mustAvoid: p.avoid || [],
        activeTimes: p.availableTime || [],
        freeText: p.memo || ''
    }));

    const currentMemberData = typeof viewMode === 'number' ? membersData.find(m => m.id === viewMode) : null;

    return (
        <div className="flex w-full h-full bg-white overflow-hidden">
            <PreferenceSidebar
                mockTeamData={membersData}
                viewMode={viewMode}
                setViewMode={setViewMode}
            />

            <div className="flex-1 overflow-y-auto p-12 bg-white custom-scrollbar">
                <div className="max-w-3xl mx-auto">
                    {viewMode === 'form' && (
                        <>
                            <header className="mb-12 flex justify-between items-end">
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900">내 여행 취향 입력</h2>
                                    <p className="text-gray-500 mt-2 text-lg">팀원들과 공유할 나의 여행 스타일을 알려주세요.</p>
                                </div>
                                <button
                                    onClick={handleSave}
                                    disabled={isLoading || isLocked} // 확정 시 버튼 비활성화
                                    className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
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
                            isLocked={isLocked} // 여기에 확정 상태를 전달합니다.
                        />
                    )}

                    {typeof viewMode === 'number' && currentMemberData && (
                        <PreferenceMemberView currentData={currentMemberData} />
                    )}
                </div>
            </div>
        </div>
    );
}
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PreferenceSidebar from './PreferenceSidebar';
import PreferenceOverallView from './PreferenceOverallView';
import PreferenceMemberView from './PreferenceMemberView';
import PreferenceForm from './PreferenceForm';
import { MemberPreference } from '../../../types/preference';
import { usePreferenceStore } from '../store/usePreferenceStore';

export default function PreferenceSection() {
    const { tripRoomId } = useParams<{ tripRoomId: string }>();
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<string | number>('form');

    // 스토어에서 함수들 가져오기 (initializeFormWithExisting 추가)
    const {
        teamPreferences,
        fetchPreferences,
        saveMyPreference,
        isLoading,
        initializeFormWithExisting
    } = usePreferenceStore();

    // 마운트 시 데이터 로드 및 폼 초기화
    useEffect(() => {
        const loadDataAndInitializeForm = async () => {
            if (tripRoomId) {
                // 1. 서버에서 데이터 가져오기
                await fetchPreferences(Number(tripRoomId));

                // 2. 토큰에서 내 ID 추출하기
                const token = localStorage.getItem('token');
                if (token) {
                    try {
                        const payload = JSON.parse(atob(token.split('.')[1]));
                        const myUserId = Number(payload.sub);

                        // 3. 폼에 내 데이터 채우기
                        initializeFormWithExisting(myUserId);
                    } catch (error) {
                        console.error("토큰 디코딩 실패:", error);
                    }
                }
            }
        };

        loadDataAndInitializeForm();
    }, [tripRoomId]);

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
                            {/* 헤더에 저장 버튼 추가 */}
                            <header className="mb-12 flex justify-between items-end">
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900">내 여행 취향 입력</h2>
                                    <p className="text-gray-500 mt-2 text-lg">팀원들과 공유할 나의 여행 스타일을 알려주세요.</p>
                                </div>
                                <button
                                    onClick={handleSave}
                                    disabled={isLoading}
                                    className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all disabled:bg-gray-300"
                                >
                                    {isLoading ? '저장 중...' : '저장하기'}
                                </button>
                            </header>
                            <PreferenceForm />
                        </>
                    )}

                    {viewMode === 'overall' && (
                        <PreferenceOverallView
                            onOpenAiModal={handleOpenAiModal}
                            onCreateManual={handleCreateManual}
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
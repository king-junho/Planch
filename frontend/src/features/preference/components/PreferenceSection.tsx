import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PreferenceSidebar from './PreferenceSidebar';
import PreferenceOverallView from './PreferenceOverallView';
import PreferenceMemberView from './PreferenceMemberView';
import PreferenceForm from './PreferenceForm';
import { MemberPreference } from '../../../types/preference';

export default function PreferenceSection() {
    const { tripRoomId } = useParams<{ tripRoomId: string }>();
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<string | number>('form');

    // 1. AI 추천 버튼 클릭 시 실행될 함수 정의
    const handleOpenAiModal = () => {
        alert('AI 추천 기능은 준비 중입니다.');
    };

    // 2. 직접 만들기 버튼 클릭 시 실행될 함수 정의
    const handleCreateManual = () => {
        if (tripRoomId) {
            navigate(`/trip-rooms/${tripRoomId}/branch/create`);
        } else {
            // tripRoomId가 없는 경우에 대한 예외 처리
            navigate('/trip-rooms');
        }
    };

    const mockTeamData: MemberPreference[] = [
        { id: 1, name: '나', budget: 300000, styles: ['맛집', '사진스팟'], mustGo: ['아르떼뮤지엄'], mustAvoid: ['웨이팅 긴 곳'], activeTimes: ['오후'], freeText: '동선이 짧았으면 좋겠어요.' },
        { id: 2, name: '복성준', budget: 250000, styles: ['휴식', '카페'], mustGo: ['오션뷰 카페'], mustAvoid: ['등산'], activeTimes: ['오전', '오후'], freeText: '사진 찍기 좋은 곳.' },
        { id: 3, name: '최병욱', budget: 400000, styles: ['맛집', '액티비티'], mustGo: ['흑돼지', '카트'], mustAvoid: ['비싼 식당'], activeTimes: ['저녁'], freeText: '활동적인 체험!' }
    ];

    const currentMemberData = typeof viewMode === 'number' ? mockTeamData.find(m => m.id === viewMode) : null;

    return (
        <div className="flex w-full h-full bg-white overflow-hidden">
            <PreferenceSidebar
                mockTeamData={mockTeamData}
                viewMode={viewMode}
                setViewMode={setViewMode}
            />

            <div className="flex-1 overflow-y-auto p-12 bg-white custom-scrollbar">
                <div className="max-w-3xl mx-auto">
                    {viewMode === 'form' && (
                        <>
                            <header className="mb-12">
                                <h2 className="text-3xl font-bold text-gray-900">내 여행 취향 입력</h2>
                                <p className="text-gray-500 mt-2 text-lg">팀원들과 공유할 나의 여행 스타일을 알려주세요.</p>
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
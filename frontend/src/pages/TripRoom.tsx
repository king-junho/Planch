import { useState } from 'react';
import { useParams } from 'react-router-dom';
import RoomHeader from '../shared/components/ui/RoomHeader';
import ProposalSection from '../features/proposal/components/ProposalSection';
import BranchSection from '../features/branch/components/BranchSection';
import PreferenceSection from '../features/preference/components/PreferenceSection';
import BranchCreateCanvas from '../features/branch/components/BranchCreateCanvas';

export default function TripRoom() {
    const { tripRoomId } = useParams();
    const [activeTab, setActiveTab] = useState('PROPOSAL');

    const renderSidebarContent = () => {
        switch (activeTab) {
            case 'MAIN':
                return (
                    <div className="p-8 max-w-4xl mx-auto overflow-y-auto w-full">
                        <h2 className="text-gray-900 text-2xl font-bold mb-4">여행방 메인 대시보드</h2>
                        <p className="text-gray-500 text-sm">참여자 현황, 확정된 일정 등 요약 정보 자리입니다.</p>
                    </div>
                );
            case 'PROPOSAL':
                return <ProposalSection tripRoomId={tripRoomId} />;
            case 'PREFERENCE':
                return <PreferenceSection tripRoomId={tripRoomId} setActiveTab={setActiveTab} />;
            case 'BRANCH':
                return <BranchSection tripRoomId={tripRoomId} setActiveTab={setActiveTab} />;
            case 'BRANCH_CREATE':
                return <BranchCreateCanvas onBack={() => setActiveTab('BRANCH')} />;
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <RoomHeader activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className="flex flex-1 overflow-hidden bg-stone-50">
                {renderSidebarContent()}
            </div>
        </div>
    );
}
import { Users, User } from 'lucide-react';

export default function PreferenceSidebar({ mockTeamData, viewMode, setViewMode }) {
    return (
        <div className="w-[240px] bg-white border-r border-gray-200 flex flex-col py-6 shrink-0 z-10 shadow-[2px_0_8px_-4px_rgba(0,0,0,0.05)]">
            <div className="px-6 mb-6">
                <h2 className="text-gray-900 text-lg font-bold">선호도 결과</h2>
                <p className="text-gray-500 text-xs mt-1">팀원들의 취향 모아보기</p>
            </div>

            <div className="flex flex-col gap-1">
                <button
                    onClick={() => setViewMode('overall')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-colors ${viewMode === 'overall' ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    <Users size={16} /> 팀 종합 결과
                </button>

                <div className="mt-4 mb-2 px-6 border-t border-gray-100 pt-4">
                    <span className="text-xs font-bold text-gray-400">멤버별 상세 보기</span>
                </div>

                {mockTeamData.map(member => (
                    <button
                        key={member.id}
                        onClick={() => setViewMode(member.id)}
                        className={`flex items-center gap-2 px-6 py-2.5 text-sm font-medium transition-colors ${viewMode === member.id ? 'bg-gray-50 text-gray-900 border-r-2 border-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <User size={14} /> {member.name}
                    </button>
                ))}
            </div>
        </div>
    );
}
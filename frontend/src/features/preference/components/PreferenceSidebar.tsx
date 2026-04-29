import { Users, User } from 'lucide-react';
import { MemberPreference } from '../../../types/preference';

interface PreferenceSidebarProps {
    mockTeamData: MemberPreference[];
    viewMode: string | number;
    setViewMode: (mode: string | number) => void;
}

export default function PreferenceSidebar({ mockTeamData, viewMode, setViewMode }: PreferenceSidebarProps) {
    return (
        <div className="w-[280px] bg-white border-r border-gray-100 flex flex-col py-8 shrink-0 z-10 shadow-sm">
            <div className="px-8 mb-8">
                <h2 className="text-gray-900 text-xl font-bold">선호도 결과</h2>
                <p className="text-gray-400 text-xs mt-1.5 font-medium uppercase tracking-wider">Team Preferences</p>
            </div>

            <div className="flex flex-col gap-1 px-4">
                <button
                    onClick={() => setViewMode('overall')}
                    className={`flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-bold transition-all ${viewMode === 'overall'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-500 hover:bg-gray-50'
                        }`}
                >
                    <Users size={18} /> 팀 종합 결과
                </button>

                <button
                    onClick={() => setViewMode('form')}
                    className={`flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-bold transition-all ${viewMode === 'form'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-500 hover:bg-gray-50'
                        }`}
                >
                    <User size={18} /> 내 취향 입력하기
                </button>

                <div className="mt-8 mb-3 px-5">
                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.1em]">멤버별 상세 보기</span>
                </div>

                {mockTeamData.map(member => (
                    <button
                        key={member.id}
                        onClick={() => setViewMode(member.id)}
                        className={`flex items-center justify-between px-5 py-3 rounded-xl text-sm font-medium transition-all ${viewMode === member.id
                            ? 'bg-gray-900 text-white shadow-md'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-1.5 h-1.5 rounded-full ${viewMode === member.id ? 'bg-blue-400' : 'bg-gray-200'}`} />
                            {member.name}
                        </div>
                        {member.name === '나' && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${viewMode === member.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                ME
                            </span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
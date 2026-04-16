import { Link } from 'react-router-dom';
import { Menu, Link as LinkIcon } from 'lucide-react';

export default function RoomHeader({ activeTab, setActiveTab }) {
    const tabs = [
        { id: 'MAIN', label: '메인' },
        { id: 'PROPOSAL', label: '장소 제안' },
        { id: 'PREFERENCE', label: '선호 입력' },
        { id: 'BRANCH', label: '브랜치' }
    ];

    return (
        <header className="h-[64px] bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 relative z-10">
            <div className="flex items-center gap-3">
                <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                    <Menu size={20} />
                </button>
                <Link to="/" className="text-xl font-bold text-gray-900 tracking-tight">
                    Planch
                </Link>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex gap-1 mr-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-1.5 rounded-md font-medium text-sm transition-colors ${activeTab === tab.id
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-transparent text-gray-500 hover:bg-gray-100'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-md text-sm font-medium transition-colors shadow-sm">
                    <LinkIcon size={14} />
                    초대링크
                </button>

                <div className="w-px h-4 bg-gray-200 mx-1"></div>

                <button className="text-sm font-medium text-gray-600 hover:text-gray-900 px-2 transition-colors">
                    로그인
                </button>
                <button className="px-3 py-1.5 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors">
                    Register
                </button>
            </div>
        </header>
    );
}
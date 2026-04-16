import { ArrowLeft, MapPin, Wallet, ChevronLeft, ChevronRight } from 'lucide-react';
import { useBranchStore } from '../store/useBranchStore';
import { Branch } from '../../../types/branch';

interface BranchDetailSectionProps {
    branch: Branch;
    onBack: () => void;
}

export default function BranchDetailSection({ branch, onBack }: BranchDetailSectionProps) {
    const { selectedDay, setSelectedDay } = useBranchStore();

    const availableDays = branch.routes ? Object.keys(branch.routes).map(Number) : [1];
    const maxDay = Math.max(...availableDays);
    const minDay = Math.min(...availableDays);
    const currentRoute = branch.routes?.[selectedDay] || [];

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="px-8 py-6 border-b border-gray-100 shrink-0">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors mb-4">
                    <ArrowLeft size={18} />
                    <span className="text-sm font-bold uppercase tracking-wider">목록으로</span>
                </button>
                <h2 className="text-2xl font-bold text-gray-900">{branch.title}</h2>
                <p className="text-sm text-gray-500 mt-1">{branch.description}</p>
            </div>

            <div className="flex items-center justify-between px-8 py-4 bg-gray-50 border-b border-gray-100 shrink-0">
                <button
                    disabled={selectedDay <= minDay}
                    onClick={() => setSelectedDay(selectedDay - 1)}
                    className="p-1 disabled:opacity-30"
                >
                    <ChevronLeft size={20} />
                </button>
                <span className="text-sm font-bold text-gray-900">{selectedDay}일차 일정</span>
                <button
                    disabled={selectedDay >= maxDay}
                    onClick={() => setSelectedDay(selectedDay + 1)}
                    className="p-1 disabled:opacity-30"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 custom-scrollbar">
                {currentRoute.map((item, index) => (
                    <div key={item.id} className="relative flex gap-5">
                        <div className="flex flex-col items-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5 z-10" />
                            {index !== currentRoute.length - 1 && (
                                <div className="w-0.5 h-full bg-blue-100 -mt-1" />
                            )}
                        </div>
                        <div className="flex-1 pb-4">
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                {item.time}
                            </span>
                            <h4 className="text-sm font-bold text-gray-900 mt-2">{item.title}</h4>
                            <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {item.place && (
                                    <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded border border-gray-100 text-[10px] text-gray-600">
                                        <MapPin size={10} /> {item.place}
                                    </div>
                                )}
                                {item.cost && (
                                    <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded border border-gray-100 text-[10px] text-gray-600">
                                        <Wallet size={10} /> {item.cost}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
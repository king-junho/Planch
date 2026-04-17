import { ArrowLeft, MapPin, Wallet, ChevronLeft, ChevronRight, Edit2, CalendarX2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBranchStore } from '../store/useBranchStore';
import { Branch } from '../../../types/branch';

interface BranchDetailSectionProps {
    branch: Branch;
    onBack: () => void;
}

export default function BranchDetailSection({ branch, onBack }: BranchDetailSectionProps) {
    const { selectedDay, setSelectedDay } = useBranchStore();
    const navigate = useNavigate();
    const { tripRoomId } = useParams();

    const availableDays = branch.routes ? Object.keys(branch.routes).map(Number) : [1];
    const maxDay = Math.max(...availableDays);
    const minDay = Math.min(...availableDays);
    const currentRoute = branch.routes?.[selectedDay] || [];

    // 수정 페이지로 이동하며 현재 branch 데이터를 state로 전달합니다.
    const handleEdit = () => {
        navigate(`/trip-rooms/${tripRoomId}/branch/edit`, {
            state: { editBranch: branch }
        });
    };

    return (
        <div className="flex flex-col h-full bg-white relative z-10">
            {/* 상단 헤더: 제목 및 목록/수정 버튼 */}
            <div className="px-8 py-6 border-b border-gray-100 shrink-0">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors mb-4">
                    <ArrowLeft size={18} />
                    <span className="text-sm font-bold uppercase tracking-wider">목록으로</span>
                </button>

                <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0"> {/* 말줄임표 적용을 위한 min-w-0 */}
                        <h2 className="text-2xl font-bold text-gray-900 truncate">{branch.title}</h2>
                        <p className="text-sm text-gray-500 mt-1 truncate">{branch.description}</p>
                    </div>
                    {/* 수정하기 버튼: whitespace-nowrap과 shrink-0 추가 */}
                    <button
                        onClick={handleEdit}
                        className="shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-100 shadow-sm"
                    >
                        <Edit2 size={14} />
                        <span>수정</span>
                    </button>
                </div>
            </div>

            {/* 일차 이동 네비게이션 */}
            <div className="flex items-center justify-between px-8 py-4 bg-gray-50 border-b border-gray-100 shrink-0">
                <button
                    disabled={selectedDay <= minDay}
                    onClick={() => setSelectedDay(selectedDay - 1)}
                    className="p-1 disabled:opacity-30 hover:bg-gray-200 rounded-full transition-colors"
                >
                    <ChevronLeft size={20} />
                </button>
                <span className="text-sm font-bold text-gray-900">{selectedDay}일차 일정</span>
                <button
                    disabled={selectedDay >= maxDay}
                    onClick={() => setSelectedDay(selectedDay + 1)}
                    className="p-1 disabled:opacity-30 hover:bg-gray-200 rounded-full transition-colors"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* 타임라인 영역 */}
            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 custom-scrollbar">
                {currentRoute.length === 0 ? (
                    // 비어있는 일차일 때 보여줄 빈 화면 컴포넌트
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3">
                        <CalendarX2 size={48} strokeWidth={1.5} className="text-gray-300" />
                        <span className="text-sm font-medium">이날은 등록된 일정이 없습니다.</span>
                        <span className="text-xs text-gray-400 text-center">우측 상단의 수정 버튼을 눌러<br />장소를 추가해 보세요.</span>
                    </div>
                ) : (
                    currentRoute.map((item, index) => (
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
                    ))
                )}
            </div>
        </div>
    );
}
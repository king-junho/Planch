import { useState } from 'react';
import { useBranchStore } from '../store/useBranchStore';
import BranchCard from './BranchCard';
import BranchCompareCanvas from './BranchCompareCanvas';
import { CheckSquare, Loader2 } from 'lucide-react';

interface BranchListViewProps {
    onSelectBranch: (branch: any) => void;
    onOpenCreateModal: () => void;
}

export default function BranchListView({ onSelectBranch, onOpenCreateModal }: BranchListViewProps) {
    const { branches, isLoading } = useBranchStore();

    const [isCompareMode, setIsCompareMode] = useState(false);
    const [selectedForCompare, setSelectedForCompare] = useState<number[]>([]);

    const toggleCompareSelection = (branchId: number) => {
        setSelectedForCompare(prev => {
            if (prev.includes(branchId)) {
                return prev.filter(id => id !== branchId);
            }
            if (prev.length >= 3) {
                alert("비교는 최대 3개까지만 가능합니다.");
                return prev;
            }
            return [...prev, branchId];
        });
    };

    if (isCompareMode) {
        const compareBranches = branches.filter(b => selectedForCompare.includes(b.id));
        return (
            <BranchCompareCanvas
                compareBranches={compareBranches}
                onBack={() => setIsCompareMode(false)}
            />
        );
    }

    return (
        /* 부모에서 500px을 잡아주었으므로 w-full로 꽉 차게 설정합니다. */
        <div className="w-full flex flex-col h-full bg-stone-50/50 relative">

            <div className="p-7 border-b border-gray-100 bg-white shrink-0 flex flex-col gap-5">
                <div className="min-w-0">
                    <h2 className="text-2xl font-bold text-gray-900">브랜치 목록</h2>
                    <p className="text-sm text-gray-500 mt-1.5">
                        비교할 브랜치를 선택하고 지도에서 동선을 확인해 보세요.
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full">
                    <button
                        disabled={selectedForCompare.length < 2 || isLoading}
                        onClick={() => setIsCompareMode(true)}
                        className="flex-1 justify-center py-3 bg-blue-50 text-blue-600 border border-blue-100 text-sm font-bold rounded-xl hover:bg-blue-100 hover:border-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <CheckSquare size={18} />
                        {selectedForCompare.length > 0 ? `${selectedForCompare.length}개 비교` : '비교하기'}
                    </button>

                    <button
                        onClick={onOpenCreateModal}
                        disabled={isLoading}
                        className="flex-1 justify-center py-3 bg-gray-900 text-white text-sm font-bold rounded-xl shadow-md hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        + 새 브랜치
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-7 flex flex-col gap-5 custom-scrollbar">
                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        <span className="text-sm font-bold">브랜치 목록을 불러오는 중입니다...</span>
                    </div>
                ) : branches.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-400">
                        등록된 브랜치가 없습니다. 새 브랜치를 만들어보세요.
                    </div>
                ) : (
                    branches.map(branch => {
                        const isSelected = selectedForCompare.includes(branch.id);
                        return (
                            <div key={branch.id} className="relative group">
                                <div
                                    onClick={() => toggleCompareSelection(branch.id)}
                                    className={`absolute top-5 left-4 z-10 w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${isSelected ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300 group-hover:border-blue-400'}`}
                                >
                                    {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                                </div>

                                <div className="pl-8">
                                    <BranchCard
                                        branch={branch}
                                        onViewDetail={() => onSelectBranch(branch)}
                                    />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
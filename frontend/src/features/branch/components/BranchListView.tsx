import { useBranchStore } from '../store/useBranchStore';
import BranchCard from './BranchCard';

interface BranchListViewProps {
    onSelectBranch: (branch: any) => void;
    onOpenCreateModal: () => void;
}

export default function BranchListView({ onSelectBranch, onOpenCreateModal }: BranchListViewProps) {
    const { branches } = useBranchStore();

    return (
        <div className="flex flex-col h-full bg-stone-50/50">
            {/* 헤더 영역: gap-4와 min-w-0을 추가해 레이아웃을 보호합니다 */}
            <div className="p-8 border-b border-gray-100 bg-white shrink-0 flex justify-between items-end gap-4">
                <div className="min-w-0">
                    <h2 className="text-2xl font-bold text-gray-900">브랜치 목록</h2>
                    <p className="text-sm text-gray-500 mt-1 truncate">
                        우리 팀을 위한 최적의 경로를 확인하세요.
                    </p>
                </div>

                {/* 버튼 수정: whitespace-nowrap과 shrink-0 추가 */}
                <button
                    onClick={onOpenCreateModal}
                    className="whitespace-nowrap shrink-0 px-5 py-2.5 bg-gray-900 text-white text-xs font-bold rounded-xl shadow-lg hover:bg-gray-800 transition-all"
                >
                    + 새 브랜치
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 custom-scrollbar">
                {branches.map(branch => (
                    <BranchCard
                        key={branch.id}
                        branch={branch}
                        onViewDetail={() => onSelectBranch(branch)}
                    />
                ))}
            </div>
        </div>
    );
}
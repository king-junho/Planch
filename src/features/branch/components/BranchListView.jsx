import BranchCard from './BranchCard';

export default function BranchListView({ branches, onSelectBranch, onOpenCreateModal }) {
    return (
        <div className="w-[400px] xl:w-1/3 flex flex-col h-full bg-stone-50 border-r border-gray-200 shrink-0 relative z-10">
            <div className="p-8 pb-4 flex justify-between items-end border-b border-gray-200 shrink-0">
                <div className="flex flex-col gap-1">
                    <h2 className="text-gray-900 text-xl font-bold">브랜치 목록</h2>
                    <p className="text-gray-500 text-xs">일정 브랜치들을 비교하고 투표해보세요.</p>
                </div>
                <button
                    onClick={onOpenCreateModal}
                    className="px-5 py-2.5 bg-gray-900 text-white text-xs font-bold rounded-md shadow-sm hover:bg-gray-800 transition-colors"
                >
                    + 새 브랜치
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 pt-6 flex flex-col gap-5 custom-scrollbar min-h-0">
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
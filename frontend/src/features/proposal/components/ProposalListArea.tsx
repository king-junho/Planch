import { useProposalStore } from '../store/useProposalStore';
import ProposalCard from './ProposalCard';

export default function ProposalListArea() {
    const { proposals, isLoading } = useProposalStore();

    if (isLoading) {
        return <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">데이터를 불러오는 중...</div>;
    }

    return (
        <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-4">
                <h3 className="text-gray-900 text-base font-bold">제안된 장소</h3>
                <div className="px-2 py-0.5 bg-gray-900 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{proposals.length}</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 pb-4 flex flex-col gap-4 custom-scrollbar">
                {proposals.length === 0 ? (
                    <div className="py-20 text-center text-gray-300 text-sm">아직 제안된 장소가 없습니다.</div>
                ) : (
                    proposals.map((prop) => (
                        <ProposalCard key={prop.proposalId} proposal={prop} />
                    ))
                )}
            </div>
        </div>
    );
}
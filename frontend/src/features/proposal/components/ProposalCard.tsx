import { MapPin, User, ChevronRight } from 'lucide-react';
import { useProposalStore } from '../store/useProposalStore';
import { ProposalResponse } from '../../../types/proposal';

interface ProposalCardProps {
    proposal: ProposalResponse;
}

export default function ProposalCard({ proposal }: ProposalCardProps) {
    const { setFocusedProposal } = useProposalStore();

    return (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-3">
                <div className="flex flex-col gap-1">
                    <span className="text-gray-900 font-bold text-base leading-tight">
                        {proposal.placeName}
                    </span>
                    <span className="text-gray-400 text-[11px] font-medium uppercase tracking-wider">
                        {proposal.category}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                    <User size={12} className="text-gray-400" />
                    <span className="text-gray-600 text-[11px] font-bold">{proposal.proposer.nickname}</span>
                </div>
            </div>

            <p className="text-gray-600 text-xs leading-relaxed bg-stone-50/50 p-3 rounded-xl mb-4 border border-stone-100 italic">
                {proposal.memo}
            </p>

            <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                <div className="flex items-center gap-1 text-gray-400">
                    <MapPin size={12} />
                    <span className="text-[10px] truncate max-w-[150px]">{proposal.address}</span>
                </div>

                <button
                    onClick={() => setFocusedProposal(proposal)}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-bold transition-colors"
                >
                    자세히보기 <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
}
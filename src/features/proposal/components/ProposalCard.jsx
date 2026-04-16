import { MapPin, User } from 'lucide-react';
import { useProposalStore } from '../store/useProposalStore';

export default function ProposalCard({ proposal }) {
    const { setSelectedPlace } = useProposalStore();

    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-gray-300 transition-all group">
            <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col">
                    <span className="text-gray-900 font-bold text-sm">
                        {proposal.place.place_name}
                    </span>
                    <span className="text-gray-400 text-[10px] mt-0.5">
                        {proposal.place.category_group_name || '분류 없음'}
                    </span>
                </div>
                <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
                    <User size={12} className="text-gray-400" />
                    <span className="text-gray-600 text-xs">{proposal.proposerUser.name}</span>
                </div>
            </div>

            <p className="text-gray-600 text-xs leading-relaxed bg-gray-50 p-2.5 rounded-lg mb-2">
                {proposal.comment}
            </p>

            <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1 text-gray-400">
                    <MapPin size={12} />
                    <span className="text-[10px] truncate max-w-[140px]">{proposal.place.address_name || '주소 정보 없음'}</span>
                </div>

                <button
                    onClick={() => setSelectedPlace({ ...proposal.place, isViewing: true })}
                    className="text-blue-600 hover:text-blue-800 text-xs font-bold px-2 py-1 rounded-md hover:bg-blue-50 transition-colors"
                >
                    자세히보기
                </button>
            </div>
        </div>
    );
}
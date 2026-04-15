import { useProposalStore } from '../store/useProposalStore';
import ProposalCard from './ProposalCard';

export default function ProposalListArea() {
    const { proposals } = useProposalStore();

    const defaultMock = [
        { id: 1, tripRoomId: "1", place: { place_name: '몽상드애월', category_group_name: '카페/디저트' }, proposerUser: { name: '김준호' }, comment: '애월 해안도로 예쁜 카페 가요!' },
    ];

    const displayData = proposals.length > 0 ? proposals : defaultMock;

    return (
        <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-4">
                <h3 className="text-gray-900 text-base font-bold">제안된 장소</h3>
                <div className="px-2 py-0.5 bg-gray-900 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{displayData.length}</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 pb-4 flex flex-col gap-4 custom-scrollbar">
                {displayData.map((prop) => (
                    <ProposalCard key={prop.id} proposal={prop} />
                ))}
            </div>
        </div>
    );
}
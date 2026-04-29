import { useNavigate, useLocation } from 'react-router-dom';
import BranchCreateCanvas from '../features/branch/components/BranchCreateCanvas';

export default function TripBranchCreatePage() {
  const navigate = useNavigate();
  const location = useLocation();

  // 상세 화면에서 넘겨준 state가 있다면 꺼내오고, 없다면 null로 처리합니다.
  const editBranch = location.state?.editBranch || null;

  return (
    <div className="w-full h-screen overflow-hidden bg-white">
      <BranchCreateCanvas
        onBack={() => navigate(-1)}
        editBranch={editBranch} // 받아온 데이터를 캔버스로 전달
      />
    </div>
  );
}
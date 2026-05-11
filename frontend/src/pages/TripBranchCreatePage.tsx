import { useNavigate, useLocation } from 'react-router-dom';
import BranchCreateCanvas from '../features/branch/components/BranchCreateCanvas';

export default function TripBranchCreatePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const editBranch = location.state?.editBranch || null;

  return (
    <div className="w-full h-screen overflow-x-auto overflow-y-hidden min-w-[1024px] bg-white">
      <BranchCreateCanvas
        onBack={() => navigate(-1)}
        editBranch={editBranch}
      />
    </div>
  );
}
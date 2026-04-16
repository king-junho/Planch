import { useState } from "react";
import { useParams } from "react-router-dom";
import TripRoomHeader from "../components/layout/TripRoomHeader";
import BranchCreateCanvas from "../features/branch/components/BranchCreateCanvas";
import BranchSection from "../features/branch/components/BranchSection";

type BranchTab = "BRANCH" | "BRANCH_CREATE";

export default function TripBranchPage() {
  const { tripRoomId = "3" } = useParams();
  const [activeTab, setActiveTab] = useState<BranchTab>("BRANCH");

  return (
    <div className="flex min-h-screen flex-col bg-white text-stone-900">
      <TripRoomHeader activeItem="branch" tripRoomId={tripRoomId} />
      <main className="h-[calc(100vh-76px)]">
        {activeTab === "BRANCH_CREATE" ? (
          <BranchCreateCanvas onBack={() => setActiveTab("BRANCH")} />
        ) : (
          <BranchSection
            setActiveTab={(nextTab) =>
              setActiveTab(nextTab === "BRANCH_CREATE" ? "BRANCH_CREATE" : "BRANCH")
            }
            tripRoomId={tripRoomId}
          />
        )}
      </main>
    </div>
  );
}

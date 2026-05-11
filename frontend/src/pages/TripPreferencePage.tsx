import { useParams } from 'react-router-dom';
import TripRoomHeader from '../components/layout/TripRoomHeader';
import PreferenceSection from '../features/preference/components/PreferenceSection';

export default function TripPreferencePage() {
  const { tripRoomId } = useParams<{ tripRoomId: string }>();

  return (
    <div className="flex flex-col h-screen min-w-[1100px] overflow-x-auto overflow-y-hidden bg-white custom-scrollbar">

      <TripRoomHeader activeItem="preference" tripRoomId={tripRoomId || ''} />

      <main className="flex-1 flex flex-col min-h-0 relative">
        <PreferenceSection />
      </main>

    </div>
  );
}
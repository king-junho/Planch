import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TripRoom from './pages/TripRoom';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Routes>
          {/* 메인 페이지 */}
          <Route path="/" element={<div className="p-8 text-2xl font-bold">Planch 메인 페이지입니다</div>} />

          {/* 여행방 (워크스페이스) 페이지 연결 */}
          <Route path="/trip-rooms/:tripRoomId" element={<TripRoom />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
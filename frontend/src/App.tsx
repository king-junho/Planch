import { Navigate, Route, Routes } from "react-router-dom";
import InvitePage from "./pages/InvitePage";
import TripBranchCreatePage from "./pages/TripBranchCreatePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import TripBranchPage from "./pages/TripBranchPage";
import TripPreferencePage from "./pages/TripPreferencePage";
import TripProposalPage from "./pages/TripProposalPage";
import TripSchedulePage from "./pages/TripSchedulePage";
import TripRoomPage from "./pages/TripRoomPage";
import TripRoomListPage from "./pages/TripRoomListPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Navigate replace to="/login" />} path="/" />
      <Route element={<LoginPage />} path="/login" />
      <Route element={<RegisterPage />} path="/register" />
      <Route element={<TripRoomListPage />} path="/trip-rooms" />
      <Route element={<TripRoomPage />} path="/trip-rooms/:tripRoomId" />
      <Route
        element={<TripProposalPage />}
        path="/trip-rooms/:tripRoomId/proposal"
      />
      <Route
        element={<TripBranchPage />}
        path="/trip-rooms/:tripRoomId/branch"
      />
      <Route
        element={<TripBranchCreatePage />}
        path="/trip-rooms/:tripRoomId/branch/create"
      />
      <Route
        element={<TripPreferencePage />}
        path="/trip-rooms/:tripRoomId/preference"
      />
      <Route
        element={<TripSchedulePage />}
        path="/trip-rooms/:tripRoomId/schedule"
      />
      <Route element={<Navigate replace to="/trip-rooms/3" />} path="/trip-room" />
      <Route element={<InvitePage />} path="/invite" />
    </Routes>
  );
}


import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import ProtectedRoute from "./ProtectedRoute";

import Landing from "./Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Discover from "./pages/Discover";
import MyProfile from "./pages/MyProfile";
import Matches from "./pages/Matches";

import "./style.css";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/discover" element={<Discover />} />
            <Route path="/profile" element={<MyProfile />} />
            <Route path="/matches" element={<Matches />} />
          </Route>

          <Route path="*" element={<Landing />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

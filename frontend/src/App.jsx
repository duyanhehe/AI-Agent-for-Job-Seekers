import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/auth/Home";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import CvAnalyzer from "./pages/resume/CvAnalyzer";
import JobsMatched from "./pages/jobs/JobsMatched";
import Resume from "./pages/resume/Resume";
import Profile from "./pages/profile/Profile";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import PrivacyPolicy from "./pages/legal/Privacy";
import Interview from "./pages/jobs/Interview";

import { AuthProvider } from "./hooks/auth/AuthContextProvider";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route
            path="/analyze"
            element={
              <ProtectedRoute>
                <CvAnalyzer />
              </ProtectedRoute>
            }
          />

          <Route
            path="/jobs"
            element={
              <ProtectedRoute>
                <JobsMatched />
              </ProtectedRoute>
            }
          />

          <Route
            path="/resume"
            element={
              <ProtectedRoute>
                <Resume />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route
            path="/jobs/interview"
            element={
              <ProtectedRoute>
                <Interview />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

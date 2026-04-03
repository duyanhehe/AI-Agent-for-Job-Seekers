import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CvAnalyzer from "./pages/CvAnalyzer";
import JobsMatched from "./pages/JobsMatched";
import Resume from "./pages/Resume";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import PrivacyPolicy from "./pages/Privacy";
import Interview from "./pages/Interview";

import { AuthProvider } from "./hooks/AuthContextProvider";

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

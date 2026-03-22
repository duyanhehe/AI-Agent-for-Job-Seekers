import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CvAnalyzer from "./pages/CvAnalyzer";
import JobsMatched from "./pages/JobsMatched";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/analyze" element={<CvAnalyzer />} />
        <Route path="/jobs" element={<JobsMatched />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

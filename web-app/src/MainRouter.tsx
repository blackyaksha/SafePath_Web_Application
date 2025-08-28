import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandingPage from './LandingPage';
import SimulationTool from './Simulation Tool/SimulationTool';
import ReportHazard from './Report a Hazard/ReportHazards';
import HomePage from './Home Page/HomePage';


const MainRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/simulation-tool" element={<SimulationTool />} />
        <Route path="/report-a-hazard" element={<ReportHazard />} />
        <Route path="/home-page" element={<HomePage />} />
      </Routes>
    </Router>
  );
};

export default MainRouter;
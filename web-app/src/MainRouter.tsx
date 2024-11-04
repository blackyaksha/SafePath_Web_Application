import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandingPage from './LandingPage';
import SimulationTool from './Simulation Tool/SimulationTool';

const MainRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/simulation-tool" element={<SimulationTool />} />
      </Routes>
    </Router>
  );
};

export default MainRouter;
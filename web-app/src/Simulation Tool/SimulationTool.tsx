// src/Simulation Tool/SimulationTool.tsx
import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import './SimulationTool.css';
import ExploreMapControls from './ExploreMapControls'; // Import the new component

// Create a component to load the GLTF model
function Model() {
  const { scene } = useGLTF('./map-files/Mayamot_Antipolo.gltf');
  return <primitive object={scene} scale={[250, 250, 250]} />;
}

function SimulationTool() {
  const [selectedFeature, setSelectedFeature] = useState('map'); // State to track selected feature
  const [searchTerm, setSearchTerm] = useState(''); // State to track search input

  // Render controls based on the selected feature
  const renderControls = () => {
    switch (selectedFeature) {
      case 'map':
        return (
          <ExploreMapControls onSearch={setSearchTerm} /> // Use the new component
        );
      case 'route':
        return (
          <div>
            <h3>Route Optimization Controls</h3>
            {/* Add controls specific to route optimization here */}
          </div>
        );
      case 'report':
        return (
          <div>
            <h3>Report Hazard Controls</h3>
            {/* Add controls specific to reporting hazards here */}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="simulation-container">
      {/* Side Panel */}
      <div className="side-panel">
        {/* Map Icon Button */}
        <button className="icon-button" onClick={() => setSelectedFeature('map')}>
          <div className="icon-container">
            <span className="material-icons">map</span>
            <span className="icon-text">Explore Map</span>
          </div>
        </button>
        
        {/* Route Icon Button */}
        <button className="icon-button" onClick={() => setSelectedFeature('route')}>
          <div className="icon-container">
            <span className="material-icons">route</span>
            <span className="icon-text">Optimize Routes</span>
          </div>
        </button>

        {/* Report hazards Icon Button */}
        <button className="icon-button" onClick={() => setSelectedFeature('report')}>
          <div className="icon-container">
            <span className="material-icons">report_gmailerrorred</span>
            <span className="icon-text">Report a Hazard</span>
          </div>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Render the controls based on the selected feature */}
        {renderControls()}

        {/* 3D Model Canvas */}
        <Canvas camera={{ near: 0.1, far: 1000 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} />
          <Model />
          <OrbitControls minDistance={1} maxDistance={2000} />
        </Canvas>
      </div>
    </div>
  );
}

export default SimulationTool;

// src/Simulation Tool/SimulationTool.tsx
import React, { useState, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { Link } from 'react-router-dom';  // Import Link from react-router-dom
import './SimulationTool.css';
import HazardMapControls from './HazardMapControls'; // Import the new component
import OptimizeRouteControls from './OptimizeRouteControls'; // Import the new component
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';  // Import React Leaflet components
import 'leaflet/dist/leaflet.css';  // Import Leaflet CSS
import { LatLngExpression, divIcon } from 'leaflet';  // Import LatLngExpression
import opencage from 'opencage-api-client';  // Import the OpenCage API client
import { PerspectiveCamera } from 'three'; // Import PerspectiveCamera

// Create a component to load the GLTF model
function Model() {
  const { scene } = useGLTF('./map-files/3D/ANTIPOLO 3D MAP.glb');
  console.log(scene.children); // Log children to inspect them
  return <primitive object={scene} scale={[1, 1, 1]} position={[0, 0, 0]} />;
}

function SimulationTool() {
  const [selectedFeature, setSelectedFeature] = useState('map'); // State to track selected feature
  const [searchTerm, setSearchTerm] = useState(''); // State to track search input
  const [viewMode, setViewMode] = useState('3d');  // State to track view mode
  const [mapCenter, setMapCenter] = useState<LatLngExpression>([51.505, -0.09]);  // State to track map center

  const mapRef = useRef<L.Map | null>(null); // Define the type of mapRef
  const cameraRef = useRef<PerspectiveCamera | null>(null);

  const UpdateMapView = ({ center }: { center: LatLngExpression }) => {
    const map = useMap();
    mapRef.current = map; // Store the map instance in the ref
    map.setView(center);
    return null;
  };

  const customIcon = divIcon({
    className: 'custom-marker-icon',
    html: '<span class="material-icons" style="font-size: 36px; color: red;">room</span>',
  });

  // Function to render the 2D map
  const render2DMap = () => (
    <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }} zoomControl={false}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={mapCenter} icon={customIcon} />
      <UpdateMapView center={mapCenter} />
    </MapContainer>
  );

  // Function to render the 3D model
  const render3DModel = () => (
    <Canvas 
      camera={{ position: [0, 2000, 2000], near: 0.1, far: 50000 }}  // Adjust camera position
      gl={{ antialias: true, logarithmicDepthBuffer: true }}  // Enable logarithmic depth buffer
    >
      <directionalLight position={[10, 10, 10]} intensity={12} />
      <directionalLight position={[-10, -10, -10]} intensity={11} />
      <hemisphereLight args={[0xffffff, 0x444444, 10]} />
      <pointLight position={[0, 1000, 0]} intensity={10} />
      <pointLight position={[1000, 0, 0]} intensity={9} />
      <pointLight position={[-1000, 0, 0]} intensity={9} />
      <spotLight position={[0, 500, 500]} intensity={8} angle={0.3} penumbra={1} />
      <spotLight position={[0, -500, -500]} intensity={8} angle={0.3} penumbra={1} />
      <spotLight position={[500, 500, 0]} intensity={8} angle={0.3} penumbra={1} />
      <spotLight position={[-500, -500, 0]} intensity={8} angle={0.3} penumbra={1} />
      <spotLight position={[0, 0, 1000]} intensity={8} angle={0.3} penumbra={1} />
      <Model />
      <OrbitControls 
        target={[0, 0, 0]}  // Adjust target to focus on the model
        minDistance={0.1} 
        maxDistance={10000} 
        zoomSpeed={2.0}
      />
      <CameraSetup />
    </Canvas>
  );

  const CameraSetup = () => {
    const { camera } = useThree();
    if (camera instanceof PerspectiveCamera) {
      cameraRef.current = camera;
    }
    return null;
  };

  // Render controls based on the selected feature
  const renderControls = () => {
    switch (selectedFeature) {
      case 'map':
        return <HazardMapControls onSearch={setSearchTerm} viewMode={viewMode} setViewMode={setViewMode} setMapCenter={setMapCenter} />;
      case 'route':
        return <OptimizeRouteControls onSearch={setSearchTerm} viewMode={viewMode} setViewMode={setViewMode} />;
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

  // Function to handle zoom in
  const handleZoomIn = () => {
    if (viewMode === '2d' && mapRef.current) {
      mapRef.current.zoomIn(); // Zoom in the 2D map
    } else if (viewMode === '3d' && cameraRef.current) {
      cameraRef.current.zoom += 0.1;
      cameraRef.current.updateProjectionMatrix();
    }
  };

  // Function to handle zoom out
  const handleZoomOut = () => {
    if (viewMode === '2d' && mapRef.current) {
      mapRef.current.zoomOut(); // Zoom out the 2D map
    } else if (viewMode === '3d' && cameraRef.current) {
      cameraRef.current.zoom -= 0.1;
      cameraRef.current.updateProjectionMatrix();
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
            <span className="icon-text">Hazard Map</span>
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

        {/* Logo at the bottom with clickable Link */}
        <Link to="/" className="logo-bottom">
          <img src="/logo/SafePath-Logo.png" alt="SafePath Logo" />
        </Link>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        {renderControls()}

        {/* Conditionally render 2D map or 3D model based on viewMode */}
        {viewMode === '2d' ? render2DMap() : render3DModel()}

        {/* Custom Zoom Controls */}
        <div className="custom-zoom-controls">
          <button onClick={handleZoomIn} className="zoom-button">
            <span className="material-icons">add</span>
          </button>
          <button onClick={handleZoomOut} className="zoom-button">
            <span className="material-icons">remove</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default SimulationTool;

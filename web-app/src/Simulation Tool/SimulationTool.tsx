import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import "./SimulationTool.css";
import HazardMapControls from "./HazardMapControls";
import OptimizeRouteControls from "./OptimizeRouteControls";
import ReportHazardsControls from "./ReportHazardsControls";
import "leaflet/dist/leaflet.css";
import { LatLng } from "leaflet";
import Map, {
  Source,
  Layer,
  NavigationControl,
  GeolocateControl,
} from "react-map-gl";
import shp from "shpjs";

const SENSOR_API_URL =
  process.env.REACT_APP_SENSOR_API_URL ?? "http://127.0.0.1:5000/api/sensor-data";

const streetfloodSensorLocations = [
  {
    name: "N.S. Amoranto Street",
    lat: 14.63559186578589,
    lon: 121.0081000074452,
  },
  { name: "New Greenland", lat: 14.700767513181207, lon: 121.1159461907311 },
  { name: "Kalantiaw Street", lat: 14.6191769, lon: 121.068252 },
  {
    name: "F. Calderon Street",
    lat: 14.7084683570545,
    lon: 121.04810055319089,
  },
  {
    name: "Christine Street",
    lat: 14.650162106610242,
    lon: 121.01147413437955,
  },
  {
    name: "Ramon Magsaysay Brgy Hall",
    lat: 14.659152430769959,
    lon: 121.02188283176864,
  },
  { name: "Phil-Am", lat: 14.64852649078562, lon: 121.03110197159769 },
  { name: "Holy Spirit", lat: 14.683750536396918, lon: 121.07628398218428 },
  { name: "Libis", lat: 14.615697486834684, lon: 121.0750335591855 },
  { name: "South Triangle", lat: 14.637119372511387, lon: 121.02641468052553 },
  {
    name: "Nagkaisang Nayon",
    lat: 14.719332140062093,
    lon: 121.02888218537234,
  },
  { name: "Tandang Sora", lat: 14.6818637, lon: 121.0322006 },
  { name: "Talipapa", lat: 14.690215772387946, lon: 121.02782905845723 },
];

const waterwayfloodSensorLocations = [
  { name: "North Fairview", lat: 14.705586083344288, lon: 121.05887390190463 },
  { name: "Batasan-San Mateo", lat: 14.6797553, lon: 121.1094325 },
  { name: "Bahay Toro", lat: 14.661408312453277, lon: 121.0200054969958 },
  { name: "Sta Cruz", lat: 14.629846368678633, lon: 121.01500119153002 },
  { name: "San Bartolome", lat: 14.712423745639178, lon: 121.02088308641669 },
];

const MAPBOX_TOKEN =
  "pk.eyJ1IjoiYmVhcmtuZWVzIiwiYSI6ImNtMmo0ZHB1ZTAxbW8yanBvaHJtaDJ5cjcifQ.l5fWqJY-4JtKOjun2MehoA"; // Replace with your actual token
const tomtomApiKey = "lGflzY7sC1myxaUFeXjqGdK9aAwjGdHN";

interface HazardMarker {
  id: string;
  type: string;
  position: LatLng;
  flood_level?: number;
  color?: string;
}

interface Route {
  route_id: string;
  coordinates: [number, number][];
  profile: string;
  distance: number;
  duration: number;
  geometry: { coordinates: [number, number][] };
  score?: number;
  obstructions: number;
  closedLanes: number;
  closedRoads: number;
  totalFloodLevel: number; // Add this line
}

interface Incident {
  lat: number;
  lon: number;
  category: string;
}

// Add the formatDuration helper function here
const formatDuration = (seconds: number): string => {
  if (!seconds) return "N/A";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.round(seconds % 60);

  const hourText = hours === 1 ? "hr" : "hrs";
  const minuteText = minutes === 1 ? "min" : "mins";
  const secondText = remainingSeconds === 1 ? "sec" : "secs";

  if (hours > 0) {
    if (minutes > 0 || remainingSeconds > 0) {
      return `${hours} ${hourText} ${
        minutes > 0 ? `${minutes} ${minuteText}` : ""
      } ${remainingSeconds > 0 ? `${remainingSeconds} ${secondText}` : ""}`;
    }
    return `${hours} ${hourText}`;
  }

  if (minutes > 0) {
    if (remainingSeconds > 0) {
      return `${minutes} ${minuteText} ${remainingSeconds} ${secondText}`;
    }
    return `${minutes} ${minuteText}`;
  }

  return `${remainingSeconds} ${secondText}`;
};

type LightPreset = "dawn" | "day" | "dusk" | "night";

// Add new interface for optimization session
interface OptimizationSession {
  id: string;
  startLocation: string;
  destination: string;
  selectedRoute: Route | null;
  routes: Route[];
  hazardMarkers: HazardMarker[];
  timestamp: Date;
}

// Add waypoint property to the interfaces

interface FloodedArea {
  level: string;
  location: string;
  waypoint: [number, number];
}

interface FloodedReservoirArea {
  level: string;
  normal?: string;
  location: string;
  waypoint: [number, number];
}

function SimulationTool() {
  const [selectedFeature, setSelectedFeature] = useState("map");
  const [isMapStyleLoaded, setIsMapStyleLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("3d");
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    14.6510546, 121.0486254,
  ]);
  const [hazardMarkers, setHazardMarkers] = useState<HazardMarker[]>([]);
  const [searchLocation, setSearchLocation] = useState<[number, number] | null>(
    null
  );
  const [floodLevel, setFloodLevel] = useState<
    "none" | "low" | "medium" | "high"
  >("none");
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedProfile, setSelectedProfile] = useState("optimal");
  const mapRef = useRef<any>(null);
  const [isLightingOpen, setIsLightingOpen] = useState(false);
  const [isMapStyleOpen, setIsMapStyleOpen] = useState(false);

  // Simulation Mode & User-Inputted Flood Levels
  const [simulationMode, setSimulationMode] = useState(false);
  const [simulatedFloodValues, setSimulatedFloodValues] = useState<{ [sensorName: string]: number }>({});

  const [routeType, setRouteType] = useState("destination");

  const [evacuationCenters, setEvacuationCentersLoc] = useState<any[]>([]);

  // ✅ Function to disable 3D elements when switching to 2D mode
  const disable3DLayers = () => {
    if (mapRef.current && viewMode === "2d") {
      const map = mapRef.current.getMap();
      try {
        // Only try to set basemap property for standard style
        if (mapType === "standard") {
          map.setConfigProperty("basemap", "show3dObjects", false);
        }
        // For all styles, try to hide the 3d-buildings layer if it exists
        if (map.getLayer("3d-buildings")) {
          map.setLayoutProperty("3d-buildings", "visibility", "none");
        }
        console.log("✅ 3D buildings disabled in 2D mode");
      } catch (error) {
        console.log(
          "Note: Some 3D features not available in current map style"
        );
      }
    }
  };

  const [isMapLoading, setIsMapLoading] = useState(true);
  const [lightPreset, setLightPreset] = useState<LightPreset>("day"); // ✅ Default to 'day'
  // Add new states
  const [floodedAreas, setFloodedAreas] = useState<FloodedArea[]>([]);
  const [isFloodedAreasLoading, setIsFloodedAreasLoading] = useState(false); // NEW
  const [floodedReservoirAreas, setFloodedReservoirAreas] = useState<
    FloodedReservoirArea[]
  >([]);
  const [isFloodedReservoirAreasLoading, setIsFloodedReservoirAreasLoading] =
    useState(false); // NEW
  const [floodFetchError, setFloodFetchError] = useState(false); // NEW
  const [reservoirFetchError, setReservoirFetchError] = useState(false); // NEW

  const [floodSensorsWaterways, setFloodSensorsWaterways] = useState(false);
  const [floodSensorsStreets, setFloodSensorsStreets] = useState(false);

  const [activeDropdown, setActiveDropdown] = useState<
    "lighting" | "mapStyle" | "sessions" | null
  >(null);

  const handleDropdownClick = (
    dropdown: "lighting" | "mapStyle" | "sessions"
  ) => {
    if (activeDropdown === dropdown) {
      setActiveDropdown(null); // Close if clicking the same dropdown
    } else {
      setActiveDropdown(dropdown); // Open the clicked dropdown and close the other
    }
  };

  // Update the light preset function to switch back to standard style if needed
  const updateLightPreset = (preset: LightPreset) => {
    setLightPreset(preset);

    // If user is trying to change lighting in a non-standard style,
    // switch to standard style first
    if (mapType !== "standard") {
      console.log("Switching to standard style to support lighting preset");
      setMapType("standard");
    }

    // Apply the lighting preset (will work properly now that we're in standard style)
    if (mapRef.current) {
      try {
        const map = mapRef.current.getMap();
        map.setConfigProperty("basemap", "lightPreset", preset);
        console.log(`Applied ${preset} lighting preset successfully`);
      } catch (error) {
        console.warn("Error applying light preset:", error);
      }
    }
  };

  const [geojsonData, setGeojsonData] = useState<any>(null);
  const [hydrologicalCheckbox, setHydrologicalCheckbox] = useState(false);
  const [roadClosuresCheckbox, setRoadClosuresCheckbox] = useState(false);
  const [floodCheckbox, setFloodCheckbox] = useState(false);
  interface IncidentMarker {
    lat: number;
    lon: number;
    category: string;
  }

  const [incidentMarkers, setIncidentMarkers] = useState<IncidentMarker[]>([]);

  // ✅ State to store real-time debris/traffic blockage count
  const [obstructionCount, setObstructionCount] = useState<number>(0);
  const [closedLanesCount, setClosedLanesCount] = useState<number>(0);
  const [closedRoadsCount, setClosedRoadsCount] = useState<number>(0);

  // Add a new state for map type
  const [mapType, setMapType] = useState("standard"); // Default to "standard"

  // Function to get the appropriate Mapbox style URL based on the selected map type
  const getMapStyle = () => {
    switch (mapType) {
      case "streets":
        return "mapbox://styles/mapbox/streets-v12";
      case "satellite":
        return "mapbox://styles/mapbox/satellite-streets-v12";
      case "standard":
      default:
        return "mapbox://styles/mapbox/standard";
    }
  };

  const [realTimeData, setRealTimeData] = useState<any>(null);
  const [selectedDataCategory, setSelectedDataCategory] = useState<
    string | null
  >(null);

  const fetchRealTimeData = async () => {
    try {
      const response = await fetch(SENSOR_API_URL);
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      setRealTimeData(data);
      setSelectedFeature("realtime"); // Switch to Real-Time Data View
    } catch (error) {
      console.error("Error fetching real-time data:", error);
      alert("Failed to fetch real-time data. Check the API.");
    }
  };

  const fetchTomTomHazards = async (
    routeCoordinates: [number, number][] | undefined
  ) => {
    try {
      console.log("🔍 Fetching hazards for route:", routeCoordinates);

      if (!routeCoordinates || routeCoordinates.length === 0) {
        console.warn("⚠️ No route coordinates available for hazard checking.");
        setObstructionCount(0);
        setClosedLanesCount(0);
        setClosedRoadsCount(0);
        return;
      }

      // Extract bounding box for API request
      const lats = routeCoordinates.map((coord) => coord[1]);
      const lons = routeCoordinates.map((coord) => coord[0]);
      const minLat = Math.min(...lats),
        maxLat = Math.max(...lats);
      const minLon = Math.min(...lons),
        maxLon = Math.max(...lons);

      if (isNaN(minLat) || isNaN(maxLat) || isNaN(minLon) || isNaN(maxLon)) {
        console.error("❌ Invalid bounding box values:", {
          minLat,
          maxLat,
          minLon,
          maxLon,
        });
        return;
      }

      // API request excluding category 11 (flooding)
      const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${tomtomApiKey}&bbox=${minLon},${minLat},${maxLon},${maxLat}&fields={incidents{type,geometry{type,coordinates},properties{iconCategory}}}&language=en-GB&timeValidityFilter=present&categoryFilter=0,1,2,3,4,5,6,7,8,9,10,14`;

      console.log("🔍 Fetching TomTom hazards from:", url);
      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`Failed to fetch hazard data: ${response.status}`);

      const data = await response.json();
      console.log("✅ Raw TomTom Response:", data);

      if (!data || !data.incidents || !Array.isArray(data.incidents)) {
        console.error("❌ No incidents found in API response:", data);
        setObstructionCount(0);
        setClosedLanesCount(0);
        setClosedRoadsCount(0);
        return;
      }

      // Incident category labels
      const categoryLabels: { [key: number]: string } = {
        0: "Unknown",
        1: "Accident",
        2: "Fog",
        3: "Dangerous Conditions",
        4: "Rain",
        5: "Ice",
        6: "Jam",
        7: "Lane Closed",
        8: "Road Closed",
        9: "Road Works",
        10: "Wind",
        14: "Broken Down Vehicle",
      };

      // Define which categories count as Obstructions, Closed Lanes, and Closed Roads
      const obstructionCategories = new Set([0, 1, 3, 5, 6, 9, 14]);
      const closedLaneCategories = new Set([7]);
      const closedRoadCategories = new Set([8]);

      // Extract and filter incidents **only near the route**
      let obstructionCount = 0;
      let closedLanesCount = 0;
      let closedRoadsCount = 0;

      const matchedHazards = data.incidents
        .map(
          (incident: {
            geometry: { coordinates: any };
            properties: { iconCategory: number };
          }) => {
            const coords = incident.geometry.coordinates;
            if (!Array.isArray(coords) || coords.length === 0) return null;

            const [incidentLon, incidentLat] = Array.isArray(coords[0])
              ? coords[0]
              : coords;
            const category = incident.properties.iconCategory;

            // ✅ Check if the incident is **near** the route
            const isCloseToRoute = routeCoordinates.some(
              ([routeLon, routeLat]) => {
                const distance = Math.sqrt(
                  Math.pow(routeLat - incidentLat, 2) +
                    Math.pow(routeLon - incidentLon, 2)
                );
                return distance < 0.00034; // 🔹 Increase threshold for better accuracy
              }
            );

            if (!isCloseToRoute) return null; // ✅ Ignore incidents that are far from the route

            // ✅ Count only relevant hazards
            if (obstructionCategories.has(category)) obstructionCount++;
            if (closedLaneCategories.has(category)) closedLanesCount++;
            if (closedRoadCategories.has(category)) closedRoadsCount++;

            return {
              lat: incidentLat,
              lon: incidentLon,
              category: categoryLabels[category] || "Unknown",
            };
          }
        )
        .filter(Boolean) as Incident[];

      console.log("🚧 Filtered Incidents (Near Route):", matchedHazards);
      console.log(`✅ Obstructions Count: ${obstructionCount}`);
      console.log(`✅ Closed Lanes Count: ${closedLanesCount}`);
      console.log(`✅ Closed Roads Count: ${closedRoadsCount}`);

      // ✅ Update state with **only hazards close to the route**
      setObstructionCount(obstructionCount);
      setClosedLanesCount(closedLanesCount);
      setClosedRoadsCount(closedRoadsCount);
      setIncidentMarkers(matchedHazards);
    } catch (error) {
      console.error("❌ Error fetching real-time hazards:", error);
      setObstructionCount(0);
      setClosedLanesCount(0);
      setClosedRoadsCount(0);
    }
  };

  const fetchStreetFloodSensorData = async (
    routeCoordinates: [number, number][] | undefined
  ) => {
    try {
      console.log("🌊 Fetching flood sensor data...");

      if (!routeCoordinates || routeCoordinates.length === 0) {
        console.warn("⚠️ No route coordinates available for flood checking.");
        setFloodedAreas([]); // Reset flood data
        return;
      }

      // ✅ Log Waypoint Coordinates of Selected Route
      console.log("🚗 Selected Route Waypoints:", routeCoordinates);

      // Fetch sensor data from the backend
      const response = await fetch(SENSOR_API_URL);
      if (!response.ok)
        throw new Error(
          `Failed to fetch flood sensor data: ${response.status}`
        );

      const data = await response.json();
      const streetFloodSensors = data.street_flood_sensors || [];

      console.log("✅ Fetched Flood Sensors:", streetFloodSensors);

      // Convert sensor data to a dictionary for quick lookup
      const sensorDataMap: { [key: string]: string } = {};
      streetFloodSensors.forEach((sensor: any) => {
        const floodLevel = sensor.CURRENT || "0.0 m";
        sensorDataMap[sensor["SENSOR NAME"]] =
          floodLevel === "0.0 m" ? "No Flood" : floodLevel;
      });

      // Check which waypoints are close to flood sensors
      const matchedFloodedAreas: {
        level: string;
        location: string;
        waypoint: [number, number];
      }[] = [];
      const matchedSensors: { sensor: string; lat: number; lon: number }[] = []; // ✅ NEW: To log matched sensors

      streetfloodSensorLocations.forEach((sensor) => {
        const sensorLat = sensor.lat;
        const sensorLon = sensor.lon;
        const floodLevel = sensorDataMap[sensor.name] || "0.0 m"; // Default to 0.0 m if no flood detected

        // Find the closest waypoint(s) to this sensor
        const closeWaypoints = routeCoordinates
          .map(([routeLon, routeLat], index) => ({
            distance: Math.sqrt(
              Math.pow(routeLat - sensorLat, 2) +
                Math.pow(routeLon - sensorLon, 2)
            ),
            location: `Point ${index + 1}`,
            waypoint: [routeLat, routeLon] as [number, number], // ✅ Explicitly cast as tuple
          }))
          .filter((wp) => wp.distance < 0.0006) // Distance threshold of ≈66.7 meters
          .map((wp) => ({
            level: floodLevel,
            location: wp.location,
            waypoint: wp.waypoint, // ✅ No type error now
          }));

        if (closeWaypoints.length > 0) {
          matchedSensors.push({
            sensor: sensor.name,
            lat: sensorLat,
            lon: sensorLon,
          }); // ✅ Log Matched Sensors
        }

        matchedFloodedAreas.push(...closeWaypoints);
      });

      // ✅ Log matched waypoints close to flood sensors
      console.log("🌊 Matched Flooded Waypoints:", matchedFloodedAreas);

      // ✅ Log matched flood sensors
      console.log("📍 Matched Sensors:", matchedSensors);

      // ✅ Ensure the default "No sensors in proximity" message matches the expected type
      setFloodedAreas(
        matchedFloodedAreas.length > 0 ? matchedFloodedAreas : [] // empty array, so the map won't try to render non-waypoint data
      );
    } catch (error) {
      console.error("❌ Error fetching flood sensor data:", error);
      setFloodedAreas([]);
      setFloodFetchError(true);
    } finally {
      setIsFloodedAreasLoading(false);
    }
  };

  const fetchWaterwayFloodSensorData = async (
    routeCoordinates: [number, number][] | undefined
  ) => {
    try {
      console.log("🌊 Fetching reservoir flood sensor data...");

      if (!routeCoordinates || routeCoordinates.length === 0) {
        console.warn("⚠️ No route coordinates available for flood checking.");
        setFloodedReservoirAreas([]); // Reset flood data
        return;
      }

      // ✅ Log Waypoint Coordinates of Selected Route
      console.log("🚗 Selected Route Waypoints:", routeCoordinates);

      // Fetch sensor data from the backend
      const response = await fetch(SENSOR_API_URL);
      if (!response.ok)
        throw new Error(
          `Failed to fetch reservoir flood sensor data: ${response.status}`
        );

      const reservoirdata = await response.json();
      const reservoirFloodSensors = reservoirdata.flood_sensors || [];

      console.log("✅ Fetched Reservoir Flood Sensors:", reservoirFloodSensors);

      // Convert sensor data to a dictionary for quick lookup
      const reservoirSensorDataMap: {
        [key: string]: { current: string; normal: string };
      } = {};
      reservoirFloodSensors.forEach((sensor: any) => {
        const currentLevel = sensor.CURRENT || "0.0";
        const normalLevel = sensor["NORMAL LEVEL"] || "0.0"; // ✅ Fetch NORMAL LEVEL
        reservoirSensorDataMap[sensor["SENSOR NAME"]] = {
          current: currentLevel === "0.0" ? "No Flood" : `${currentLevel} m`,
          normal: `${normalLevel} m`, // ✅ Store normal level
        };
      });

      // ✅ Store unique matched sensors
      const matchedReservoirSensors: {
        level: string;
        normal: string;
        location: string;
      }[] = [];
      const matchedFloodedReservoirAreas: {
        level: string;
        normal: string;
        location: string;
        waypoint: [number, number];
      }[] = [];

      waterwayfloodSensorLocations.forEach((sensor) => {
        const sensorLat = sensor.lat;
        const sensorLon = sensor.lon;
        const reservoirData = reservoirSensorDataMap[sensor.name] || {
          current: "0.0 m",
          normal: "0.0 m",
        };

        // ✅ Find the **nearest** waypoint within the threshold
        let nearestWaypoint = null;
        let minDistance = Infinity;

        routeCoordinates.forEach(([routeLon, routeLat], index) => {
          const distance = Math.sqrt(
            Math.pow(routeLat - sensorLat, 2) +
              Math.pow(routeLon - sensorLon, 2)
          );
          if (distance < 0.0006 && distance < minDistance) {
            // 🔹 Keep only the closest waypoint (within ≈66.7 meters)
            minDistance = distance;
            nearestWaypoint = {
              level: reservoirData.current,
              normal: reservoirData.normal, // ✅ Store normal level
              location: `Point ${index + 1}`,
              waypoint: [routeLat, routeLon] as [number, number],
            };
          }
        });

        if (nearestWaypoint) {
          matchedFloodedReservoirAreas.push(nearestWaypoint); // ✅ Log the closest waypoint per sensor
          matchedReservoirSensors.push({
            level: reservoirData.current,
            normal: reservoirData.normal,
            location: sensor.name,
          });
        }
      });

      // ✅ Log only the nearest waypoint per sensor
      console.log(
        "🌊 Matched Reservoir Flooded Waypoints:",
        matchedFloodedReservoirAreas
      );

      // ✅ Log matched sensors only once
      console.log("📍 Matched Reservoir Sensors:", matchedReservoirSensors);

      // ✅ Ensure proper UI fallback when no sensors are nearby
      setFloodedReservoirAreas(
        matchedFloodedReservoirAreas.length > 0
          ? matchedFloodedReservoirAreas
          : []
      );
    } catch (error) {
      console.error("❌ Error fetching reservoir flood sensor data:", error);
      setFloodedReservoirAreas([]);
      setReservoirFetchError(true);
    } finally {
      setIsFloodedReservoirAreasLoading(false);
    }
  };

  // ✅ NEW: State to track selected route details
  const [selectedRouteInfo, setSelectedRouteInfo] = useState<Route | null>(
    null
  );

  // ✅ Effect to update debris/traffic blockage count when route changes
  useEffect(() => {
    if (selectedRouteInfo && selectedRouteInfo.geometry) {
      fetchTomTomHazards(selectedRouteInfo.geometry.coordinates);
      fetchStreetFloodSensorData(selectedRouteInfo.geometry.coordinates);
      fetchWaterwayFloodSensorData(selectedRouteInfo.geometry.coordinates);
    } else {
      // Reset counts when no valid route is selected
      setObstructionCount(0);
      setClosedLanesCount(0);
      setClosedRoadsCount(0);
      setFloodedAreas([]);
      setFloodedReservoirAreas([]);
    }
  }, [selectedRouteInfo]);

  // Remove the fetch logic from the [selectedProfile, routes] effect, only keep setSelectedRouteInfo logic
  useEffect(() => {
    if (selectedProfile && routes.length > 0) {
      const selectedRoute = routes[parseInt(selectedProfile)]; // Convert profile to integer
      if (selectedRoute) {
        setSelectedRouteInfo(selectedRoute);
      } else {
        setObstructionCount(0);
        setClosedLanesCount(0);
        setClosedRoadsCount(0);
        setFloodedAreas([]);
        setFloodedReservoirAreas([]);
      }
    }
  }, [selectedProfile, routes]);

  useEffect(() => {
    fetch("/map-files/3D/WGS84.zip")
      .then((res) => res.arrayBuffer())
      .then((buffer) => shp(buffer))
      .then((geojson) => {
        console.log("✅ Loaded GeoJSON:", geojson);

        const normalizedGeojson = Array.isArray(geojson) ? geojson[0] : geojson;

        if (!normalizedGeojson || !normalizedGeojson.features) {
          console.error("❌ Invalid GeoJSON format", normalizedGeojson);
          return;
        }

        // 🔹 Log first 10 feature properties to check available fields
        normalizedGeojson.features.slice(0, 10).forEach((feature, index) => {
          console.log(`📍 Feature ${index} Properties:`, feature.properties);
        });

        setGeojsonData(normalizedGeojson);
      })
      .catch((err) => console.error("❌ Error loading shapefile:", err));
  }, []);

  useEffect(() => {
    console.log("🚗 Routes Data Updated:", routes);
  }, [routes]);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current.getMap();

    if (viewMode === "3d") {
      console.log("🔄 Switching to True 3D View...");

      // Only try to enable 3D buildings for standard style
      if (mapType === "standard") {
        try {
          map.setConfigProperty("basemap", "show3dObjects", true);
          console.log("✅ 3D buildings enabled in standard style");
        } catch (error) {
          console.log("Note: Unable to set 3D buildings in current style");
        }
      }

      map.flyTo({
        center: [mapCenter[1], mapCenter[0]],
        zoom: 14,
        pitch: 60,
        bearing: -10,
        essential: true,
      });
    }

    if (viewMode === "2d") {
      console.log("🔄 Switching to True 2D View...");

      map.flyTo({
        center: [mapCenter[1], mapCenter[0]],
        zoom: 14,
        pitch: 0,
        bearing: 0,
        essential: true,
      });

      disable3DLayers();
    }
  }, [viewMode, mapCenter, mapType]); // Added mapType as a dependency

  const render2DMap = () => (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      {isMapLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>
            Loading Map<span className="dots"></span>
          </p>
        </div>
      )}
      <Map
        initialViewState={{
          latitude: mapCenter[0],
          longitude: mapCenter[1],
          zoom: 14,
          pitch: 0,
          bearing: 0,
        }}
        ref={mapRef}
        style={{ width: "100%", height: "100vh", cursor: "grab" }}
        mapStyle={getMapStyle()} // Use the function to get appropriate style
        mapboxAccessToken={MAPBOX_TOKEN}
        terrain={isMapStyleLoaded ? { source: "mapbox-dem" } : undefined}
        attributionControl={false}
        dragRotate={false}
        pitchWithRotate={false}
        onLoad={() => {
          console.log("✅ Map style has loaded");
          setIsMapLoading(false);
          setIsMapStyleLoaded(true);
          updateLightPreset(lightPreset);
          disable3DLayers();
        }}
        onMouseEnter={() => {
          if (mapRef.current) {
            mapRef.current.getCanvas().style.cursor = "grab"; // ✅ Show grab cursor when entering
          }
        }}
        onMouseLeave={() => {
           if (mapRef.current) {
             mapRef.current.getCanvas().style.cursor = ""; // ✅ Reset cursor when leaving
           }
        }}
        onClick={
          simulationMode
            ? (e: any) => {
                // Check for features under pointer for 'flood-sensors'
                const features =
                  e.features ||
                  (e?.point && mapRef.current?.queryRenderedFeatures
                    ? mapRef.current.queryRenderedFeatures(e.point)
                    : []);
                if (!features) return;
                const sensorFeature = features.find(
                  (f: any) => f.source === "flood-sensors"
                );
                if (sensorFeature && sensorFeature.properties) {
                  // Remove parentheses from "(Sensor name)"
                  const raw = sensorFeature.properties.sensorName || "";
                  const sensorName =
                    typeof raw === "string"
                      ? raw.replace(/^\(/, "").replace(/\)$/, "")
                      : "";
                  let prev =
                    simulatedFloodValues[sensorName] !== undefined
                      ? String(simulatedFloodValues[sensorName])
                      : "";
                  const input = window.prompt(
                    `Set flood level for "${sensorName}" (meters):`,
                    prev
                  );
                  if (
                    input !== null &&
                    !isNaN(Number(input)) &&
                    input.trim() !== ""
                  ) {
                    setSimulatedFloodValues({
                      ...simulatedFloodValues,
                      [sensorName]: Number(input),
                    });
                  }
                }
              }
            : undefined
        }
        interactiveLayerIds={
          simulationMode ? ["flood-sensor-layer"] : undefined
        }
        onMouseDown={() => {
          if (mapRef.current) {
            mapRef.current.getCanvas().style.cursor = "grabbing"; // ✅ Change to grabbing on drag start
          }
        }}
        onMouseUp={() => {
          if (mapRef.current) {
            mapRef.current.getCanvas().style.cursor = "grab"; // ✅ Change back to grab on drag end
          }
        }}
      >
        <NavigationControl position="top-left" />
        <GeolocateControl
          position="top-left"
          trackUserLocation
          showUserHeading
        />

        {/* ✅ Only render layers when the map style has fully loaded */}
        {isMapStyleLoaded && (
          <>
            {selectedFeature === "route" && floodedAreas.length > 0 && (
              <Source
                id="street-flooded-waypoints"
                type="geojson"
                data={{
                  type: "FeatureCollection",
                  features: floodedAreas
                    .filter((area) => area.waypoint) // Sanity check
                    .map((area, index) => ({
                      type: "Feature",
                      geometry: {
                        type: "Point",
                        coordinates: [area.waypoint[1], area.waypoint[0]], // [lng, lat]
                      },
                      properties: {
                        id: `street-flood-${index}`,
                        label: `${area.level} - ${
                          area.location || `Point ${index + 1}`
                        }`,
                      },
                    })),
                }}
              >
                {/* Circle marker */}
                <Layer
                  id="street-flooded-waypoint-layer"
                  type="circle"
                  paint={{
                    "circle-radius": 6,
                    "circle-color": "#03e8fc",
                    "circle-stroke-width": 2,
                    "circle-stroke-color": "#FFF",
                    "circle-emissive-strength": 1,
                  }}
                />
                {/* Label */}
                <Layer
                  id="street-flooded-waypoint-label"
                  type="symbol"
                  layout={{
                    "text-field": ["get", "label"],
                    "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
                    "text-size": 13,
                    "text-offset": [0, 1.2],
                    "text-anchor": "top",
                    "text-allow-overlap": true,
                    "text-ignore-placement": true,
                  }}
                  paint={{
                    "text-color": "#000000",
                    "text-halo-color": "#fff",
                    "text-halo-width": 2,
                  }}
                />
              </Source>
            )}

            {/* ✅ Add Flood Sensor Markers (3D View) */}
            {selectedFeature === "route" && floodSensorsStreets && (
              <Source
                id="flood-sensors"
                type="geojson"
                data={{
                  type: "FeatureCollection",
                  features: streetfloodSensorLocations.map((sensor, index) => ({
                    type: "Feature",
                    geometry: {
                      type: "Point",
                      coordinates: [sensor.lon, sensor.lat],
                    },
                    properties: {
                      sensorNumber: `Sensor ${index + 1}`, // 🔹 "Sensor X"
                      sensorName: `(${sensor.name})`, // 🔹 "(Location Name)"
                    },
                  })),
                }}
              >
                {/* 🔵 Sensor Marker Icon */}
                <Layer
                  id="flood-sensor-layer"
                  type="circle"
                  paint={{
                    "circle-radius": 28,
                    "circle-color": "#009dff",
                    "circle-stroke-width": 3,
                    "circle-stroke-color": "#FFFFFF",
                    "circle-opacity": 0.2,
                    "circle-emissive-strength": 1,
                  }}
                />

                {/* ✅ "Sensor X" Text - Moved Closer to Marker */}
                <Layer
                  id="sensor-number-labels"
                  type="symbol"
                  layout={{
                    "text-field": ["get", "sensorNumber"],
                    "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
                    "text-size": 14, // ✅ Ensure same font size
                    "text-offset": [0, 0.8], // 🔹 Moved closer to the marker
                    "text-anchor": "top",
                    "text-allow-overlap": true,
                    "text-ignore-placement": true,
                  }}
                  paint={{
                    "text-color": "#ffffff",
                    "text-halo-color": "#000000",
                    "text-halo-width": 2,
                  }}
                />

                {/* ✅ "(Location Name)" Text - Same Style as "Sensor X", Moved Closer */}
                <Layer
                  id="sensor-location-labels"
                  type="symbol"
                  layout={{
                    "text-field": ["get", "sensorName"],
                    "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"], // ✅ Same as "Sensor X"
                    "text-size": 12, // ✅ Match size with "Sensor X"
                    "text-offset": [0, 2.4], // 🔹 Moved closer to "Sensor X"
                    "text-anchor": "top",
                    "text-allow-overlap": true,
                    "text-ignore-placement": true,
                  }}
                  paint={{
                    "text-color": "#ffffff",
                    "text-halo-color": "#000000",
                    "text-halo-width": 2,
                  }}
                />
              </Source>
            )}

            {/* Evacuation Center Markers */}
            {selectedFeature === "route" &&
              routeType === "nearest" &&
              evacuationCenters.length > 0 && (
                <Source
                  id="evacuation-centers"
                  type="geojson"
                  data={{
                    type: "FeatureCollection",
                    features: evacuationCenters.map((center, index) => {
                      const [lat, lng] = center.gps_coordinates
                        .split(",")
                        .map(Number);
                      return {
                        type: "Feature",
                        geometry: {
                          type: "Point",
                          coordinates: [lng, lat],
                        },
                        properties: {
                          id: center.id,
                          name: center.location_name,
                          description: `Evacuation Center ${index + 1}`,
                        },
                      };
                    }),
                  }}
                >
                  {/* Marker Icon */}
                  <Layer
                    id="evacuation-center-layer"
                    type="circle"
                    paint={{
                      "circle-radius": 6,
                      "circle-color": "#ff8c00",
                      "circle-stroke-width": 2,
                      "circle-stroke-color": "#FFFFFF",
                      "circle-emissive-strength": 1,
                    }}
                  />

                  {/* Center Labels */}
                  <Layer
                    id="evacuation-center-labels"
                    type="symbol"
                    layout={{
                      "text-field": ["get", "name"],
                      "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
                      "text-size": 12,
                      "text-offset": [0, -1.5],
                      "text-anchor": "bottom",
                      "text-allow-overlap": true,
                      "text-ignore-placement": true,
                    }}
                    paint={{
                      "text-color": "#ffffff",
                      "text-halo-color": "#000000",
                      "text-halo-width": 2,
                    }}
                  />
                </Source>
              )}

            {/* ✅ Add Flood Sensor Markers (3D View) */}
            {selectedFeature === "route" && floodSensorsWaterways && (
              <Source
                id="reservoir-flood-sensors"
                type="geojson"
                data={{
                  type: "FeatureCollection",
                  features: waterwayfloodSensorLocations.map(
                    (sensor, index) => ({
                      type: "Feature",
                      geometry: {
                        type: "Point",
                        coordinates: [sensor.lon, sensor.lat],
                      },
                      properties: {
                        sensorNumber: `Sensor ${index + 1}`, // 🔹 "Sensor X"
                        sensorName: `(${sensor.name})`, // 🔹 "(Location Name)"
                      },
                    })
                  ),
                }}
              >
                {/* 🔵 Sensor Marker Icon */}
                <Layer
                  id="reservoir-flood-sensor-layer"
                  type="circle"
                  paint={{
                    "circle-radius": 6,
                    "circle-color": "#12e678",
                    "circle-stroke-width": 2,
                    "circle-stroke-color": "#FFFFFF",
                    "circle-emissive-strength": 1,
                  }}
                />

                {/* ✅ "Sensor X" Text - Moved Closer to Marker */}
                <Layer
                  id="reservoir-sensor-number-labels"
                  type="symbol"
                  layout={{
                    "text-field": ["get", "sensorNumber"],
                    "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
                    "text-size": 14, // ✅ Ensure same font size
                    "text-offset": [0, 0.8], // 🔹 Moved closer to the marker
                    "text-anchor": "top",
                    "text-allow-overlap": true,
                    "text-ignore-placement": true,
                  }}
                  paint={{
                    "text-color": "#ffffff",
                    "text-halo-color": "#000000",
                    "text-halo-width": 2,
                  }}
                />

                {/* ✅ "(Location Name)" Text - Same Style as "Sensor X", Moved Closer */}
                <Layer
                  id="reservoir-sensor-location-labels"
                  type="symbol"
                  layout={{
                    "text-field": ["get", "sensorName"],
                    "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"], // ✅ Same as "Sensor X"
                    "text-size": 12, // ✅ Match size with "Sensor X"
                    "text-offset": [0, 2.4], // 🔹 Moved closer to "Sensor X"
                    "text-anchor": "top",
                    "text-allow-overlap": true,
                    "text-ignore-placement": true,
                  }}
                  paint={{
                    "text-color": "#ffffff",
                    "text-halo-color": "#000000",
                    "text-halo-width": 2,
                  }}
                />
              </Source>
            )}

            {/* ✅ Add Incident Markers */}
            {selectedFeature === "route" && incidentMarkers.length > 0 && (
              <Source
                id="incident-markers"
                type="geojson"
                data={{
                  type: "FeatureCollection",
                  features: incidentMarkers.map((incident, index) => ({
                    type: "Feature",
                    geometry: {
                      type: "Point",
                      coordinates: [incident.lon, incident.lat],
                    },
                    properties: {
                      id: index,
                      color: "#fcd109", // Yellow for incident markers
                      incidentName: incident.category, // ✅ Store category name for labels
                    },
                  })),
                }}
              >
                <Layer
                  id="incident-layer"
                  type="circle"
                  paint={{
                    "circle-radius": 6,
                    "circle-color": "#fcd109",
                    "circle-stroke-width": 2,
                    "circle-stroke-color": "#FFFFFF",
                    "circle-emissive-strength": 1,
                  }}
                />

                {/* ✅ NEW: Symbol Layer for Incident Names */}
                <Layer
                  id="incident-labels"
                  type="symbol"
                  layout={{
                    "text-field": ["get", "incidentName"], // ✅ Use incidentName property for text
                    "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
                    "text-size": 14,
                    "text-offset": [0, 1.2], // ✅ Move text slightly above markers
                    "text-anchor": "top",
                  }}
                  paint={{
                    "text-color": "#fff",
                    "text-halo-color": "rgba(0,0,0,0.8)", // ✅ Add black background for visibility
                    "text-halo-width": 2,
                  }}
                />
              </Source>
            )}

            {/* ✅ Show the legend only when floodCheckbox is enabled */}
            {floodCheckbox && selectedFeature === "map" && (
              <div
                style={{
                  position: "absolute",
                  top: "15px",
                  right: "15px",
                  backgroundColor: "rgba(255, 255, 255, 0.85)",
                  padding: "10px",
                  borderRadius: "8px",
                  boxShadow: "0px 4px 8px rgba(0,0,0,0.2)",
                  fontSize: "13px",
                  fontFamily: "'Inter', sans-serif",
                  zIndex: 999,
                }}
              >
                <h4
                  style={{
                    margin: "0 0 8px",
                    fontSize: "14px",
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  Flood Level Legend
                </h4>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "4px",
                  }}
                >
                  <span
                    style={{
                      width: "18px",
                      height: "18px",
                      backgroundColor: "#a1a8c7",
                      display: "inline-block",
                      marginRight: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
                  ></span>
                  <span>Low (0.1m - 0.5m)</span>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "4px",
                  }}
                >
                  <span
                    style={{
                      width: "18px",
                      height: "18px",
                      backgroundColor: "#5f72c9",
                      display: "inline-block",
                      marginRight: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
                  ></span>
                  <span>Medium (0.5m - 1.5m)</span>
                </div>

                <div style={{ display: "flex", alignItems: "center" }}>
                  <span
                    style={{
                      width: "18px",
                      height: "18px",
                      backgroundColor: "#1c3cc9",
                      display: "inline-block",
                      marginRight: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
                  ></span>
                  <span>High (1.5m - 2.5m)</span>
                </div>
              </div>
            )}

            {/* ✅ Add the Flood Layer and Control it Dynamically */}
            {geojsonData && selectedFeature === "map" && (
              <Source
                id="flood-hazard"
                type="geojson"
                data={geojsonData}
                generateId={true}
                promoteId="id" // ✅ Ensures separate polygons
              >
                <Layer
                  id="flood-hazard-extrusion"
                  type="fill-extrusion"
                  paint={{
                    // ✅ Corrected `fill-extrusion-color` logic with "case"
                    "fill-extrusion-color": [
                      "case",
                      [
                        "all",
                        ["==", ["get", "Var"], 3],
                        ["in", floodLevel, ["literal", ["high"]]],
                      ],
                      "#1c3cc9", // 🟦 High Flood (Only when "high" is selected)
                      [
                        "all",
                        ["==", ["get", "Var"], 2],
                        ["in", floodLevel, ["literal", ["medium", "high"]]],
                      ],
                      "#5f72c9", // 🟦 Medium Flood (Visible when "medium" or "high" is selected)
                      [
                        "all",
                        ["==", ["get", "Var"], 1],
                        [
                          "in",
                          floodLevel,
                          ["literal", ["low", "medium", "high"]],
                        ],
                      ],
                      "#a1a8c7", // 🟦 Low Flood (Always visible if any flood level is selected)
                      "rgba(0,0,0,0)", // ✅ Default: Transparent if no flood level is selected
                    ],

                    // ✅ Corrected `fill-extrusion-height` logic
                    "fill-extrusion-height": [
                      "case",
                      [
                        "all",
                        ["==", ["get", "Var"], 3],
                        ["in", floodLevel, ["literal", ["high"]]],
                      ],
                      2.5, // 🟦 High Flood → 2.5m
                      [
                        "all",
                        ["==", ["get", "Var"], 2],
                        ["in", floodLevel, ["literal", ["medium", "high"]]],
                      ],
                      1.5, // 🟦 Medium Flood → 1.5m
                      [
                        "all",
                        ["==", ["get", "Var"], 1],
                        [
                          "in",
                          floodLevel,
                          ["literal", ["low", "medium", "high"]],
                        ],
                      ],
                      0.5, // 🟦 Low Flood → 0.5m
                      0, // ✅ Default: No extrusion if no flood level is selected
                    ],

                    // ✅ Ensures extrusion starts from the ground
                    "fill-extrusion-base": 0,

                    // ✅ Improves visibility at different zoom levels
                    "fill-extrusion-opacity": [
                      "interpolate",
                      ["linear"],
                      ["zoom"],
                      10,
                      0.7, // 🔹 Balanced visibility when zoomed out
                      14,
                      0.85, // 🔹 Mid-level visibility
                      18,
                      0.95, // 🔹 High visibility when zoomed in
                    ],
                    "fill-extrusion-emissive-strength": 1,
                  }}
                />
              </Source>
            )}

            <Source
              id="mapbox-dem"
              type="raster-dem"
              url="mapbox://mapbox.terrain-rgb"
              tileSize={512}
              maxzoom={14}
            />
            <Layer
              id="terrain-layer"
              type="hillshade"
              source="mapbox-dem"
              layout={{ visibility: "none" }}
            />

            {/* Filter and display selected route */}
            {selectedFeature === "route" && (
              <>
                {/* Render background routes first */}
                {routes
                  .filter((route) => route.route_id !== selectedProfile)
                  .map((route, index) => (
                    <Source
                      key={`background-route-${index}`}
                      id={`background-route-${index}`}
                      type="geojson"
                      data={{
                        type: "Feature",
                        geometry: {
                          type: "LineString",
                          coordinates: route.geometry.coordinates,
                        },
                      }}
                    >
                      {/* White Outline */}
                      <Layer
                        id={`background-route-outline-${index}`}
                        type="line"
                        source={`background-route-${index}`}
                        layout={{
                          "line-join": "round",
                          "line-cap": "round",
                        }}
                        paint={{
                          "line-color": "#FFFFFF", // White outline
                          "line-width": 13, // Slightly thicker than the main route
                          "line-opacity": 1,
                          "line-emissive-strength": 1,
                        }}
                      />

                      {/* Main Route Line */}
                      <Layer
                        id={`background-route-layer-${index}`}
                        type="line"
                        source={`background-route-${index}`}
                        layout={{
                          "line-join": "round",
                          "line-cap": "round",
                        }}
                        paint={{
                          "line-color": "#4287f5",
                          "line-width": 8, // Thinner than the outline
                          "line-opacity": 0.75,
                          "line-emissive-strength": 1,
                        }}
                      />
                    </Source>
                  ))}

                {/* Render selected route last */}
                {routes
                  .filter((route) => route.route_id === selectedProfile)
                  .map((route) => (
                    <Source
                      key={`selected-route`}
                      id={`selected-route`}
                      type="geojson"
                      data={{
                        type: "Feature",
                        geometry: {
                          type: "LineString",
                          coordinates: route.geometry.coordinates,
                        },
                      }}
                    >
                      {/* White Outline */}
                      <Layer
                        id={`selected-route-outline`}
                        type="line"
                        source={`selected-route`}
                        layout={{
                          "line-join": "round",
                          "line-cap": "round",
                        }}
                        paint={{
                          "line-color": "#FFFFFF", // White outline
                          "line-width": 13, // Slightly thicker than the main route
                          "line-opacity": 1,
                          "line-emissive-strength": 1,
                        }}
                      />

                      {/* Main Selected Route Line */}
                      <Layer
                        id={`selected-route-layer`}
                        type="line"
                        source={`selected-route`}
                        layout={{
                          "line-join": "round",
                          "line-cap": "round",
                        }}
                        paint={{
                          "line-color": "#85ff03", // Selected route color
                          "line-width": 8, // Thinner than the outline
                          "line-opacity": 1,
                          "line-emissive-strength": 1,
                        }}
                      />
                    </Source>
                  ))}
              </>
            )}

            {/* ✅ Search Location Marker */}
            {selectedFeature === "map" && searchLocation && (
              <Source
                id="search-cone-marker"
                type="geojson"
                data={{
                  type: "FeatureCollection",
                  features: (() => {
                    const baseRadius = 0.00002;
                    const topRadius = 0.0005;
                    const numLayers = 120;
                    const numSides = 50;
                    const heightStep = 1.5;
                    const baseHeightOffset = 15;
                    const angleStep = (2 * Math.PI) / numSides;

                    let layers = [];

                    for (
                      let layerIndex = 0;
                      layerIndex < numLayers;
                      layerIndex++
                    ) {
                      const normalizedIndex = layerIndex / numLayers;
                      const layerRadius =
                        baseRadius +
                        (topRadius - baseRadius) *
                          Math.sin((normalizedIndex * Math.PI) / 2);
                      const layerHeight =
                        baseHeightOffset + layerIndex * heightStep;

                      const layerPolygon = Array.from(
                        { length: numSides + 1 },
                        (_, i) => [
                          searchLocation[1] +
                            layerRadius * Math.cos(i * angleStep),
                          searchLocation[0] +
                            layerRadius * Math.sin(i * angleStep),
                        ]
                      );

                      layers.push({
                        type: "Feature",
                        geometry: {
                          type: "Polygon",
                          coordinates: [layerPolygon],
                        },
                        properties: {
                          height: heightStep,
                          base: layerHeight,
                          color: "#ffcc00", // ✅ Search marker in Yellow
                          emissiveStrength: 1,
                        },
                      });
                    }

                    return layers;
                  })(),
                }}
              >
                <Layer
                  id="search-cone-layer"
                  type="fill-extrusion"
                  paint={{
                    "fill-extrusion-color": ["get", "color"],
                    "fill-extrusion-height": ["get", "height"],
                    "fill-extrusion-base": ["get", "base"],
                    "fill-extrusion-opacity": 1.0,
                    "fill-extrusion-emissive-strength": [
                      "get",
                      "emissiveStrength",
                    ],
                  }}
                />
              </Source>
            )}

            {/* ✅ Start & Destination Markers for Route*/}
            {selectedFeature === "route" && hazardMarkers.length > 0 && (
              <Source
                id="cone-markers"
                type="geojson"
                data={{
                  type: "FeatureCollection",
                  features: hazardMarkers.flatMap((marker) => {
                    const baseRadius = 0.00002;
                    const topRadius = 0.0005;
                    const numLayers = 120; // Adjusted for better performance
                    const numSides = 50; // Lowered to improve performance
                    const heightStep = 1.5;
                    const baseHeightOffset = 15;

                    const angleStep = (2 * Math.PI) / numSides;
                    let layers = [];

                    for (
                      let layerIndex = 0;
                      layerIndex < numLayers;
                      layerIndex++
                    ) {
                      const normalizedIndex = layerIndex / numLayers;
                      const layerRadius =
                        baseRadius +
                        (topRadius - baseRadius) *
                          Math.sin((normalizedIndex * Math.PI) / 2);
                      const layerHeight =
                        baseHeightOffset + layerIndex * heightStep;

                      const layerPolygon = Array.from(
                        { length: numSides + 1 },
                        (_, i) => [
                          marker.position.lng +
                            layerRadius * Math.cos(i * angleStep),
                          marker.position.lat +
                            layerRadius * Math.sin(i * angleStep),
                        ]
                      );

                      layers.push({
                        type: "Feature",
                        geometry: {
                          type: "Polygon",
                          coordinates: [layerPolygon],
                        },
                        properties: {
                          height: heightStep,
                          base: layerHeight,
                          color:
                            marker.type === "start" ? "#34eb4f" : "#eb4034",
                          emissiveStrength: 1,
                        },
                      });
                    }

                    return layers;
                  }),
                }}
              >
                <Layer
                  id="cone-markers-layer"
                  type="fill-extrusion"
                  paint={{
                    "fill-extrusion-color": [
                      "coalesce",
                      ["get", "color"],
                      "#34eb4f",
                    ],
                    "fill-extrusion-height": ["coalesce", ["get", "height"], 1],
                    "fill-extrusion-base": ["coalesce", ["get", "base"], 0],
                    "fill-extrusion-opacity": 1.0,
                    "fill-extrusion-emissive-strength": [
                      "coalesce",
                      ["get", "emissiveStrength"],
                      1,
                    ],
                  }}
                />
              </Source>
            )}
          </>
        )}

        {/* Top Center Control Buttons */}
        <div className="top-center-controls">
          <div className="dropdown-container">
            <button
              className="control-button"
              onClick={() => handleDropdownClick("lighting")}
            >
              Lighting
              <span className="material-icons">
                {activeDropdown === "lighting"
                  ? "arrow_drop_up"
                  : "arrow_drop_down"}
              </span>
            </button>
            {activeDropdown === "lighting" && (
              <div className="dropdown-menu lighting-menu">
                <button
                  className={lightPreset === "dawn" ? "active" : ""}
                  onClick={() => updateLightPreset("dawn")}
                  disabled={mapType !== "standard"}
                >
                  <span className="material-icons">wb_twilight</span>
                </button>
                <button
                  className={lightPreset === "day" ? "active" : ""}
                  onClick={() => updateLightPreset("day")}
                  disabled={mapType !== "standard"}
                >
                  <span className="material-icons">wb_sunny</span>
                </button>
                <button
                  className={lightPreset === "dusk" ? "active" : ""}
                  onClick={() => updateLightPreset("dusk")}
                  disabled={mapType !== "standard"}
                >
                  <span className="material-icons">wb_twighlight</span>
                </button>
                <button
                  className={lightPreset === "night" ? "active" : ""}
                  onClick={() => updateLightPreset("night")}
                  disabled={mapType !== "standard"}
                >
                  <span className="material-icons">nights_stay</span>
                </button>
              </div>
            )}
          </div>
          <div className="dropdown-container">
            <button
              className="control-button"
              onClick={() => handleDropdownClick("mapStyle")}
            >
              Map Style
              <span className="material-icons">
                {activeDropdown === "mapStyle"
                  ? "arrow_drop_up"
                  : "arrow_drop_down"}
              </span>
            </button>
            {activeDropdown === "mapStyle" && (
              <div className="dropdown-menu map-style-menu">
                <button
                  onClick={() => setMapType("standard")}
                  className={`map-type-button ${
                    mapType === "standard" ? "active" : ""
                  }`}
                >
                  <img
                    src="/bg-images/standard-map.png"
                    alt="Standard map"
                    className="button-image"
                  />
                  <span className="button-text">Standard</span>
                </button>
                <button
                  onClick={() => setMapType("streets")}
                  className={`map-type-button ${
                    mapType === "streets" ? "active" : ""
                  }`}
                >
                  <img
                    src="/bg-images/streets-map.png"
                    alt="Streets map"
                    className="button-image"
                  />
                  <span className="button-text">Streets</span>
                </button>
                <button
                  onClick={() => setMapType("satellite")}
                  className={`map-type-button ${
                    mapType === "satellite" ? "active" : ""
                  }`}
                >
                  <img
                    src="/bg-images/satellite-map.png"
                    alt="Satellite map"
                    className="button-image"
                  />
                  <span className="button-text">Satellite</span>
                </button>
              </div>
            )}
          </div>
          {/* Only show sessions button if there are sessions */}
          {optimizationSessions.length > 0 && (
            <div className="dropdown-container">
              <button
                className="control-button"
                onClick={() => handleDropdownClick("sessions")}
              >
                Shared Routes
                <span className="material-icons">
                  {activeDropdown === "sessions"
                    ? "arrow_drop_up"
                    : "arrow_drop_down"}
                </span>
                <div className="sessions-count">
                  {optimizationSessions.length}
                </div>
              </button>
              {activeDropdown === "sessions" && renderSessionsMenu()}
            </div>
          )}
        </div>

        {/* ✅ Manually add attribution text for 3D Mapbox */}
        <div
          style={{
            position: "absolute",
            bottom: "10px",
            right: "10px",
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            padding: "4px 10px",
            borderRadius: "5px",
            fontSize: "12px",
            fontFamily: "'Inter', sans-serif",
            color: "#000",
            zIndex: 999,
          }}
        >
          &copy;{" "}
          <a
            href="https://www.mapbox.com/about/maps"
            target="_blank"
            rel="noopener noreferrer"
          >
            Mapbox{" "}
          </a>
          &copy;{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
          >
            OpenStreetMap
          </a>{" "}
          contributors | Powered by{" "}
          <a
            href="https://www.geoapify.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Geoapify
          </a>{" "}
          |
          <a
            href="https://apps.mapbox.com/feedback/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <strong> Improve this map</strong>
          </a>
        </div>
      </Map>
    </div>
  );

  const render3DMapbox = () => (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      {isMapLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>
            Loading Map<span className="dots"></span>
          </p>
        </div>
      )}
      <Map
        initialViewState={{
          latitude: mapCenter[0],
          longitude: mapCenter[1],
          zoom: 14,
          pitch: 60,
          bearing: -10,
        }}
        ref={mapRef}
        style={{ width: "100%", height: "100vh", cursor: "grab" }}
        mapStyle={getMapStyle()} // Use the function to get appropriate style
        mapboxAccessToken={MAPBOX_TOKEN}
        terrain={isMapStyleLoaded ? { source: "mapbox-dem" } : undefined}
        attributionControl={false}
        onLoad={() => {
          console.log("✅ Map style has loaded");
          setIsMapLoading(false);
          setIsMapStyleLoaded(true);
          updateLightPreset(lightPreset);
        }}
        onMouseEnter={() => {
          if (mapRef.current) {
            mapRef.current.getCanvas().style.cursor = "grab"; // ✅ Show grab cursor when entering
          }
        }}
        onMouseLeave={() => {
          if (mapRef.current) {
            mapRef.current.getCanvas().style.cursor = ""; // ✅ Reset cursor when leaving
          }
        }}
        onMouseDown={() => {
          if (mapRef.current) {
            mapRef.current.getCanvas().style.cursor = "grabbing"; // ✅ Change to grabbing on drag start
          }
        }}
        onMouseUp={() => {
          if (mapRef.current) {
            mapRef.current.getCanvas().style.cursor = "grab"; // ✅ Change back to grab on drag end
          }
        }}
      >
        <NavigationControl position="top-left" />
        <GeolocateControl
          position="top-left"
          trackUserLocation
          showUserHeading
        />

        {/* ✅ Only render layers when the map style has fully loaded */}
        {isMapStyleLoaded && (
          <>
            {selectedFeature === "route" && floodedAreas.length > 0 && (
              <Source
                id="street-flooded-waypoints"
                type="geojson"
                data={{
                  type: "FeatureCollection",
                  features: floodedAreas
                    .filter((area) => area.waypoint) // Sanity check
                    .map((area, index) => ({
                      type: "Feature",
                      geometry: {
                        type: "Point",
                        coordinates: [area.waypoint[1], area.waypoint[0]], // [lng, lat]
                      },
                      properties: {
                        id: `street-flood-${index}`,
                        label: `${area.level} - ${
                          area.location || `Point ${index + 1}`
                        }`,
                      },
                    })),
                }}
              >
                {/* Circle marker */}
                <Layer
                  id="street-flooded-waypoint-layer"
                  type="circle"
                  paint={{
                    "circle-radius": 6,
                    "circle-color": "#03e8fc",
                    "circle-stroke-width": 2,
                    "circle-stroke-color": "#FFF",
                    "circle-emissive-strength": 1,
                  }}
                />
                {/* Label */}
                <Layer
                  id="street-flooded-waypoint-label"
                  type="symbol"
                  layout={{
                    "text-field": ["get", "label"],
                    "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
                    "text-size": 13,
                    "text-offset": [0, 1.2],
                    "text-anchor": "top",
                    "text-allow-overlap": true,
                    "text-ignore-placement": true,
                  }}
                  paint={{
                    "text-color": "#000000",
                    "text-halo-color": "#fff",
                    "text-halo-width": 2,
                  }}
                />
              </Source>
            )}

            {/* ✅ Add Flood Sensor Markers (3D View) */}
            {selectedFeature === "route" && floodSensorsStreets && (
              <Source
                id="flood-sensors"
                type="geojson"
                data={{
                  type: "FeatureCollection",
                  features: streetfloodSensorLocations.map((sensor, index) => ({
                    type: "Feature",
                    geometry: {
                      type: "Point",
                      coordinates: [sensor.lon, sensor.lat],
                    },
                    properties: {
                      sensorNumber: `Sensor ${index + 1}`, // 🔹 "Sensor X"
                      sensorName: `(${sensor.name})`, // 🔹 "(Location Name)"
                    },
                  })),
                }}
              >
                {/* 🔵 Sensor Marker Icon */}
                <Layer
                  id="flood-sensor-layer"
                  type="circle"
                  paint={{
                    "circle-radius": 6,
                    "circle-color": "#009dff",
                    "circle-stroke-width": 2,
                    "circle-stroke-color": "#FFFFFF",
                    "circle-emissive-strength": 1,
                  }}
                />

                {/* ✅ "Sensor X" Text - Moved Closer to Marker */}
                <Layer
                  id="sensor-number-labels"
                  type="symbol"
                  layout={{
                    "text-field": ["get", "sensorNumber"],
                    "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
                    "text-size": 14, // ✅ Ensure same font size
                    "text-offset": [0, 0.8], // 🔹 Moved closer to the marker
                    "text-anchor": "top",
                    "text-allow-overlap": true,
                    "text-ignore-placement": true,
                  }}
                  paint={{
                    "text-color": "#ffffff",
                    "text-halo-color": "#000000",
                    "text-halo-width": 2,
                  }}
                />

                {/* ✅ "(Location Name)" Text - Same Style as "Sensor X", Moved Closer */}
                <Layer
                  id="sensor-location-labels"
                  type="symbol"
                  layout={{
                    "text-field": ["get", "sensorName"],
                    "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"], // ✅ Same as "Sensor X"
                    "text-size": 12, // ✅ Match size with "Sensor X"
                    "text-offset": [0, 2.4], // 🔹 Moved closer to "Sensor X"
                    "text-anchor": "top",
                    "text-allow-overlap": true,
                    "text-ignore-placement": true,
                  }}
                  paint={{
                    "text-color": "#ffffff",
                    "text-halo-color": "#000000",
                    "text-halo-width": 2,
                  }}
                />
              </Source>
            )}

            {/* Evacuation Center Markers */}
            {selectedFeature === "route" &&
              routeType === "nearest" &&
              evacuationCenters.length > 0 && (
                <Source
                  id="evacuation-centers"
                  type="geojson"
                  data={{
                    type: "FeatureCollection",
                    features: evacuationCenters.map((center, index) => {
                      const [lat, lng] = center.gps_coordinates
                        .split(",")
                        .map(Number);
                      return {
                        type: "Feature",
                        geometry: {
                          type: "Point",
                          coordinates: [lng, lat],
                        },
                        properties: {
                          id: center.id,
                          name: center.location_name,
                          description: `Evacuation Center ${index + 1}`,
                        },
                      };
                    }),
                  }}
                >
                  {/* Marker Icon */}
                  <Layer
                    id="evacuation-center-layer"
                    type="circle"
                    paint={{
                      "circle-radius": 6,
                      "circle-color": "#ff8c00",
                      "circle-stroke-width": 2,
                      "circle-stroke-color": "#FFFFFF",
                      "circle-emissive-strength": 1,
                    }}
                  />

                  {/* Center Labels */}
                  <Layer
                    id="evacuation-center-labels"
                    type="symbol"
                    layout={{
                      "text-field": ["get", "name"],
                      "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
                      "text-size": 12,
                      "text-offset": [0, -1.5],
                      "text-anchor": "bottom",
                      "text-allow-overlap": true,
                      "text-ignore-placement": true,
                    }}
                    paint={{
                      "text-color": "#ffffff",
                      "text-halo-color": "#000000",
                      "text-halo-width": 2,
                    }}
                  />
                </Source>
              )}

            {/* ✅ Add Flood Sensor Markers (3D View) */}
            {selectedFeature === "route" && floodSensorsWaterways && (
              <Source
                id="reservoir-flood-sensors"
                type="geojson"
                data={{
                  type: "FeatureCollection",
                  features: waterwayfloodSensorLocations.map(
                    (sensor, index) => ({
                      type: "Feature",
                      geometry: {
                        type: "Point",
                        coordinates: [sensor.lon, sensor.lat],
                      },
                      properties: {
                        sensorNumber: `Sensor ${index + 1}`, // 🔹 "Sensor X"
                        sensorName: `(${sensor.name})`, // 🔹 "(Location Name)"
                      },
                    })
                  ),
                }}
              >
                {/* 🔵 Sensor Marker Icon */}
                <Layer
                  id="reservoir-flood-sensor-layer"
                  type="circle"
                  paint={{
                    "circle-radius": 6,
                    "circle-color": "#12e678",
                    "circle-stroke-width": 2,
                    "circle-stroke-color": "#FFFFFF",
                    "circle-emissive-strength": 1,
                  }}
                />

                {/* ✅ "Sensor X" Text - Moved Closer to Marker */}
                <Layer
                  id="reservoir-sensor-number-labels"
                  type="symbol"
                  layout={{
                    "text-field": ["get", "sensorNumber"],
                    "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
                    "text-size": 14, // ✅ Ensure same font size
                    "text-offset": [0, 0.8], // 🔹 Moved closer to the marker
                    "text-anchor": "top",
                    "text-allow-overlap": true,
                    "text-ignore-placement": true,
                  }}
                  paint={{
                    "text-color": "#ffffff",
                    "text-halo-color": "#000000",
                    "text-halo-width": 2,
                  }}
                />

                {/* ✅ "(Location Name)" Text - Same Style as "Sensor X", Moved Closer */}
                <Layer
                  id="reservoir-sensor-location-labels"
                  type="symbol"
                  layout={{
                    "text-field": ["get", "sensorName"],
                    "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"], // ✅ Same as "Sensor X"
                    "text-size": 12, // ✅ Match size with "Sensor X"
                    "text-offset": [0, 2.4], // 🔹 Moved closer to "Sensor X"
                    "text-anchor": "top",
                    "text-allow-overlap": true,
                    "text-ignore-placement": true,
                  }}
                  paint={{
                    "text-color": "#ffffff",
                    "text-halo-color": "#000000",
                    "text-halo-width": 2,
                  }}
                />
              </Source>
            )}

            {/* ✅ Add Incident Markers */}
            {selectedFeature === "route" && incidentMarkers.length > 0 && (
              <Source
                id="incident-markers"
                type="geojson"
                data={{
                  type: "FeatureCollection",
                  features: incidentMarkers.map((incident, index) => ({
                    type: "Feature",
                    geometry: {
                      type: "Point",
                      coordinates: [incident.lon, incident.lat],
                    },
                    properties: {
                      id: index,
                      color: "#fcd109", // Yellow for incident markers
                      incidentName: incident.category, // ✅ Store category name for labels
                    },
                  })),
                }}
              >
                <Layer
                  id="incident-layer"
                  type="circle"
                  paint={{
                    "circle-radius": 6,
                    "circle-color": "#fcd109",
                    "circle-stroke-width": 2,
                    "circle-stroke-color": "#FFFFFF",
                    "circle-emissive-strength": 1,
                  }}
                />

                {/* ✅ NEW: Symbol Layer for Incident Names */}
                <Layer
                  id="incident-labels"
                  type="symbol"
                  layout={{
                    "text-field": ["get", "incidentName"], // ✅ Use incidentName property for text
                    "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
                    "text-size": 14,
                    "text-offset": [0, 1.2], // ✅ Move text slightly above markers
                    "text-anchor": "top",
                  }}
                  paint={{
                    "text-color": "#fff",
                    "text-halo-color": "rgba(0,0,0,0.8)", // ✅ Add black background for visibility
                    "text-halo-width": 2,
                  }}
                />
              </Source>
            )}

            {/* ✅ Show the legend only when floodCheckbox is enabled */}
            {floodCheckbox && selectedFeature === "map" && (
              <div
                style={{
                  position: "absolute",
                  top: "15px",
                  right: "15px",
                  backgroundColor: "rgba(255, 255, 255, 0.85)",
                  padding: "10px",
                  borderRadius: "8px",
                  boxShadow: "0px 4px 8px rgba(0,0,0,0.2)",
                  fontSize: "13px",
                  fontFamily: "'Inter', sans-serif",
                  zIndex: 999,
                }}
              >
                <h4
                  style={{
                    margin: "0 0 8px",
                    fontSize: "14px",
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  Flood Level Legend
                </h4>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "4px",
                  }}
                >
                  <span
                    style={{
                      width: "18px",
                      height: "18px",
                      backgroundColor: "#a1a8c7",
                      display: "inline-block",
                      marginRight: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
                  ></span>
                  <span>Low (0.1m - 0.5m)</span>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "4px",
                  }}
                >
                  <span
                    style={{
                      width: "18px",
                      height: "18px",
                      backgroundColor: "#5f72c9",
                      display: "inline-block",
                      marginRight: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
                  ></span>
                  <span>Medium (0.5m - 1.5m)</span>
                </div>

                <div style={{ display: "flex", alignItems: "center" }}>
                  <span
                    style={{
                      width: "18px",
                      height: "18px",
                      backgroundColor: "#1c3cc9",
                      display: "inline-block",
                      marginRight: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
                  ></span>
                  <span>High (1.5m - 2.5m)</span>
                </div>
              </div>
            )}

            {/* ✅ Add the Flood Layer and Control it Dynamically */}
            {geojsonData && selectedFeature === "map" && (
              <Source
                id="flood-hazard"
                type="geojson"
                data={geojsonData}
                generateId={true}
                promoteId="id" // ✅ Ensures separate polygons
              >
                <Layer
                  id="flood-hazard-extrusion"
                  type="fill-extrusion"
                  paint={{
                    // ✅ Corrected `fill-extrusion-color` logic with "case"
                    "fill-extrusion-color": [
                      "case",
                      [
                        "all",
                        ["==", ["get", "Var"], 3],
                        ["in", floodLevel, ["literal", ["high"]]],
                      ],
                      "#1c3cc9", // 🟦 High Flood (Only when "high" is selected)
                      [
                        "all",
                        ["==", ["get", "Var"], 2],
                        ["in", floodLevel, ["literal", ["medium", "high"]]],
                      ],
                      "#5f72c9", // 🟦 Medium Flood (Visible when "medium" or "high" is selected)
                      [
                        "all",
                        ["==", ["get", "Var"], 1],
                        [
                          "in",
                          floodLevel,
                          ["literal", ["low", "medium", "high"]],
                        ],
                      ],
                      "#a1a8c7", // 🟦 Low Flood (Always visible if any flood level is selected)
                      "rgba(0,0,0,0)", // ✅ Default: Transparent if no flood level is selected
                    ],

                    // ✅ Corrected `fill-extrusion-height` logic
                    "fill-extrusion-height": [
                      "case",
                      [
                        "all",
                        ["==", ["get", "Var"], 3],
                        ["in", floodLevel, ["literal", ["high"]]],
                      ],
                      2.5, // 🟦 High Flood → 2.5m
                      [
                        "all",
                        ["==", ["get", "Var"], 2],
                        ["in", floodLevel, ["literal", ["medium", "high"]]],
                      ],
                      1.5, // 🟦 Medium Flood → 1.5m
                      [
                        "all",
                        ["==", ["get", "Var"], 1],
                        [
                          "in",
                          floodLevel,
                          ["literal", ["low", "medium", "high"]],
                        ],
                      ],
                      0.5, // 🟦 Low Flood → 0.5m
                      0, // ✅ Default: No extrusion if no flood level is selected
                    ],

                    // ✅ Ensures extrusion starts from the ground
                    "fill-extrusion-base": 0,

                    // ✅ Improves visibility at different zoom levels
                    "fill-extrusion-opacity": [
                      "interpolate",
                      ["linear"],
                      ["zoom"],
                      10,
                      0.7, // 🔹 Balanced visibility when zoomed out
                      14,
                      0.85, // 🔹 Mid-level visibility
                      18,
                      0.95, // 🔹 High visibility when zoomed in
                    ],
                    "fill-extrusion-emissive-strength": 1,
                  }}
                />
              </Source>
            )}

            <Source
              id="mapbox-dem"
              type="raster-dem"
              url="mapbox://mapbox.terrain-rgb"
              tileSize={512}
              maxzoom={14}
            />
            <Layer
              id="terrain-layer"
              type="hillshade"
              source="mapbox-dem"
              layout={{ visibility: "visible" }}
            />

            <Layer
              id="3d-buildings"
              source="composite"
              source-layer="building"
              type="fill-extrusion"
              minzoom={2}
              paint={{
                "fill-extrusion-color": "#8c8c8c", // ✅ Vibrant gray-blue shade
                "fill-extrusion-height": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  2,
                  ["*", ["get", "height"], 0.2], // ✅ Make buildings slightly visible at zoom 2
                  6,
                  ["*", ["get", "height"], 0.5], // ✅ Increase height visibility at zoom 6
                  10,
                  ["get", "height"], // ✅ Normal height at zoom 10+
                ],
                "fill-extrusion-opacity": 0.95, // ✅ Almost fully opaque
                "fill-extrusion-ambient-occlusion-intensity": 0.8, // ✅ Enhances shading
                "fill-extrusion-vertical-gradient": false, // ✅ Avoids transparency at the top
              }}
            />

            {/* Filter and display selected route */}
            {selectedFeature === "route" && (
              <>
                {/* Render background routes first */}
                {routes
                  .filter((route) => route.route_id !== selectedProfile)
                  .map((route, index) => (
                    <Source
                      key={`background-route-${index}`}
                      id={`background-route-${index}`}
                      type="geojson"
                      data={{
                        type: "Feature",
                        geometry: {
                          type: "LineString",
                          coordinates: route.geometry.coordinates,
                        },
                      }}
                    >
                      {/* White Outline */}
                      <Layer
                        id={`background-route-outline-${index}`}
                        type="line"
                        source={`background-route-${index}`}
                        layout={{
                          "line-join": "round",
                          "line-cap": "round",
                        }}
                        paint={{
                          "line-color": "#FFFFFF", // White outline
                          "line-width": 13, // Slightly thicker than the main route
                          "line-opacity": 1,
                          "line-emissive-strength": 1,
                        }}
                      />

                      {/* Main Route Line */}
                      <Layer
                        id={`background-route-layer-${index}`}
                        type="line"
                        source={`background-route-${index}`}
                        layout={{
                          "line-join": "round",
                          "line-cap": "round",
                        }}
                        paint={{
                          "line-color": "#4287f5",
                          "line-width": 8, // Thinner than the outline
                          "line-opacity": 0.75,
                          "line-emissive-strength": 1,
                        }}
                      />
                    </Source>
                  ))}

                {/* Render selected route last */}
                {routes
                  .filter((route) => route.route_id === selectedProfile)
                  .map((route) => (
                    <Source
                      key={`selected-route`}
                      id={`selected-route`}
                      type="geojson"
                      data={{
                        type: "Feature",
                        geometry: {
                          type: "LineString",
                          coordinates: route.geometry.coordinates,
                        },
                      }}
                    >
                      {/* White Outline */}
                      <Layer
                        id={`selected-route-outline`}
                        type="line"
                        source={`selected-route`}
                        layout={{
                          "line-join": "round",
                          "line-cap": "round",
                        }}
                        paint={{
                          "line-color": "#FFFFFF", // White outline
                          "line-width": 13, // Slightly thicker than the main route
                          "line-opacity": 1,
                          "line-emissive-strength": 1,
                        }}
                      />

                      {/* Main Selected Route Line */}
                      <Layer
                        id={`selected-route-layer`}
                        type="line"
                        source={`selected-route`}
                        layout={{
                          "line-join": "round",
                          "line-cap": "round",
                        }}
                        paint={{
                          "line-color": "#85ff03", // Selected route color
                          "line-width": 8, // Thinner than the outline
                          "line-opacity": 1,
                          "line-emissive-strength": 1,
                        }}
                      />
                    </Source>
                  ))}
              </>
            )}

            {/* ✅ Location Search Marker */}
            {selectedFeature === "map" && searchLocation && (
              <Source
                id="search-cone-marker"
                type="geojson"
                data={{
                  type: "FeatureCollection",
                  features: (() => {
                    const baseRadius = 0.00002;
                    const topRadius = 0.0005;
                    const numLayers = 120;
                    const numSides = 50;
                    const heightStep = 1.5;
                    const baseHeightOffset = 15;
                    const angleStep = (2 * Math.PI) / numSides;

                    let layers = [];

                    for (
                      let layerIndex = 0;
                      layerIndex < numLayers;
                      layerIndex++
                    ) {
                      const normalizedIndex = layerIndex / numLayers;
                      const layerRadius =
                        baseRadius +
                        (topRadius - baseRadius) *
                          Math.sin((normalizedIndex * Math.PI) / 2);
                      const layerHeight =
                        baseHeightOffset + layerIndex * heightStep;

                      const layerPolygon = Array.from(
                        { length: numSides + 1 },
                        (_, i) => [
                          searchLocation[1] +
                            layerRadius * Math.cos(i * angleStep),
                          searchLocation[0] +
                            layerRadius * Math.sin(i * angleStep),
                        ]
                      );

                      layers.push({
                        type: "Feature",
                        geometry: {
                          type: "Polygon",
                          coordinates: [layerPolygon],
                        },
                        properties: {
                          height: heightStep,
                          base: layerHeight,
                          color: "#ffcc00", // ✅ Search marker in Yellow
                          emissiveStrength: 1,
                        },
                      });
                    }

                    return layers;
                  })(),
                }}
              >
                <Layer
                  id="search-cone-layer"
                  type="fill-extrusion"
                  paint={{
                    "fill-extrusion-color": ["get", "color"],
                    "fill-extrusion-height": ["get", "height"],
                    "fill-extrusion-base": ["get", "base"],
                    "fill-extrusion-opacity": 1.0,
                    "fill-extrusion-emissive-strength": [
                      "get",
                      "emissiveStrength",
                    ],
                  }}
                />
              </Source>
            )}

            {/* ✅ Route Start & Destination Marker */}
            {selectedFeature === "route" && hazardMarkers.length > 0 && (
              <Source
                id="cone-markers"
                type="geojson"
                data={{
                  type: "FeatureCollection",
                  features: hazardMarkers.flatMap((marker) => {
                    const baseRadius = 0.00002;
                    const topRadius = 0.0005;
                    const numLayers = 120; // Adjusted for better performance
                    const numSides = 50; // Lowered to improve performance
                    const heightStep = 1.5;
                    const baseHeightOffset = 15;

                    const angleStep = (2 * Math.PI) / numSides;
                    let layers = [];

                    for (
                      let layerIndex = 0;
                      layerIndex < numLayers;
                      layerIndex++
                    ) {
                      const normalizedIndex = layerIndex / numLayers;
                      const layerRadius =
                        baseRadius +
                        (topRadius - baseRadius) *
                          Math.sin((normalizedIndex * Math.PI) / 2);
                      const layerHeight =
                        baseHeightOffset + layerIndex * heightStep;

                      const layerPolygon = Array.from(
                        { length: numSides + 1 },
                        (_, i) => [
                          marker.position.lng +
                            layerRadius * Math.cos(i * angleStep),
                          marker.position.lat +
                            layerRadius * Math.sin(i * angleStep),
                        ]
                      );

                      layers.push({
                        type: "Feature",
                        geometry: {
                          type: "Polygon",
                          coordinates: [layerPolygon],
                        },
                        properties: {
                          height: heightStep,
                          base: layerHeight,
                          color:
                            marker.type === "start" ? "#34eb4f" : "#eb4034",
                          emissiveStrength: 1,
                        },
                      });
                    }

                    return layers;
                  }),
                }}
              >
                <Layer
                  id="cone-markers-layer"
                  type="fill-extrusion"
                  paint={{
                    "fill-extrusion-color": [
                      "coalesce",
                      ["get", "color"],
                      "#34eb4f",
                    ],
                    "fill-extrusion-height": ["coalesce", ["get", "height"], 1],
                    "fill-extrusion-base": ["coalesce", ["get", "base"], 0],
                    "fill-extrusion-opacity": 1.0,
                    "fill-extrusion-emissive-strength": [
                      "coalesce",
                      ["get", "emissiveStrength"],
                      1,
                    ],
                  }}
                />
              </Source>
            )}
          </>
        )}

        {/* Top Center Control Buttons */}
        <div className="top-center-controls">
          <div className="dropdown-container">
            <button
              className="control-button"
              onClick={() => handleDropdownClick("lighting")}
            >
              Lighting
              <span className="material-icons">
                {activeDropdown === "lighting"
                  ? "arrow_drop_up"
                  : "arrow_drop_down"}
              </span>
            </button>
            {activeDropdown === "lighting" && (
              <div className="dropdown-menu lighting-menu">
                <button
                  className={lightPreset === "dawn" ? "active" : ""}
                  onClick={() => updateLightPreset("dawn")}
                  disabled={mapType !== "standard"}
                >
                  <span className="material-icons">wb_twilight</span>
                </button>
                <button
                  className={lightPreset === "day" ? "active" : ""}
                  onClick={() => updateLightPreset("day")}
                  disabled={mapType !== "standard"}
                >
                  <span className="material-icons">wb_sunny</span>
                </button>
                <button
                  className={lightPreset === "dusk" ? "active" : ""}
                  onClick={() => updateLightPreset("dusk")}
                  disabled={mapType !== "standard"}
                >
                  <span className="material-icons">wb_twighlight</span>
                </button>
                <button
                  className={lightPreset === "night" ? "active" : ""}
                  onClick={() => updateLightPreset("night")}
                  disabled={mapType !== "standard"}
                >
                  <span className="material-icons">nights_stay</span>
                </button>
              </div>
            )}
          </div>
          <div className="dropdown-container">
            <button
              className="control-button"
              onClick={() => handleDropdownClick("mapStyle")}
            >
              Map Style
              <span className="material-icons">
                {activeDropdown === "mapStyle"
                  ? "arrow_drop_up"
                  : "arrow_drop_down"}
              </span>
            </button>
            {activeDropdown === "mapStyle" && (
              <div className="dropdown-menu map-style-menu">
                <button
                  onClick={() => setMapType("standard")}
                  className={`map-type-button ${
                    mapType === "standard" ? "active" : ""
                  }`}
                >
                  <img
                    src="/bg-images/standard-map.png"
                    alt="Standard map"
                    className="button-image"
                  />
                  <span className="button-text">Standard</span>
                </button>
                <button
                  onClick={() => setMapType("streets")}
                  className={`map-type-button ${
                    mapType === "streets" ? "active" : ""
                  }`}
                >
                  <img
                    src="/bg-images/streets-map.png"
                    alt="Streets map"
                    className="button-image"
                  />
                  <span className="button-text">Streets</span>
                </button>
                <button
                  onClick={() => setMapType("satellite")}
                  className={`map-type-button ${
                    mapType === "satellite" ? "active" : ""
                  }`}
                >
                  <img
                    src="/bg-images/satellite-map.png"
                    alt="Satellite map"
                    className="button-image"
                  />
                  <span className="button-text">Satellite</span>
                </button>
              </div>
            )}
          </div>
          {/* Only show sessions button if there are sessions */}
          {optimizationSessions.length > 0 && (
            <div className="dropdown-container">
              <button
                className="control-button"
                onClick={() => handleDropdownClick("sessions")}
              >
                Shared Routes
                <span className="material-icons">
                  {activeDropdown === "sessions"
                    ? "arrow_drop_up"
                    : "arrow_drop_down"}
                </span>
                <div className="sessions-count">
                  {optimizationSessions.length}
                </div>
              </button>
              {activeDropdown === "sessions" && renderSessionsMenu()}
            </div>
          )}
        </div>

        {/* ✅ Manually add attribution text for 3D Mapbox */}
        <div
          style={{
            position: "absolute",
            bottom: "10px",
            right: "10px",
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            padding: "4px 10px",
            borderRadius: "5px",
            fontSize: "12px",
            fontFamily: "'Inter', sans-serif",
            color: "#000",
            zIndex: 999,
          }}
        >
          &copy;{" "}
          <a
            href="https://www.mapbox.com/about/maps"
            target="_blank"
            rel="noopener noreferrer"
          >
            Mapbox{" "}
          </a>
          &copy;{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
          >
            OpenStreetMap
          </a>{" "}
          contributors | Powered by{" "}
          <a
            href="https://www.geoapify.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Geoapify
          </a>{" "}
          |
          <a
            href="https://apps.mapbox.com/feedback/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <strong> Improve this map</strong>
          </a>
        </div>
      </Map>
    </div>
  );

  const renderControls = () => {
    switch (selectedFeature) {
      case "map":
        return (
          <HazardMapControls
            onSearch={setSearchTerm}
            viewMode={viewMode}
            setViewMode={setViewMode}
            setMapCenter={setMapCenter}
            onFloodLevelChange={setFloodLevel}
            onSearchResult={(lat, lng) => {
              setMapCenter([lat, lng]);
              setSearchLocation([lat, lng]); // ✅ Store search location for 3D marker
            }}
            setSearchLocation={setSearchLocation} // ✅ Fix: Pass the function
            selectedFeature={selectedFeature} // ✅ Fix: Pass the selected feature state
            floodCheckbox={floodCheckbox} // ✅ Pass to HazardMapControls
            setFloodCheckbox={setFloodCheckbox} // ✅ Allow update
            hydrologicalCheckbox={hydrologicalCheckbox}
            setHydrologicalCheckbox={setHydrologicalCheckbox}
            roadClosuresCheckbox={roadClosuresCheckbox}
            setRoadClosuresCheckbox={setRoadClosuresCheckbox}
          />
        );
      case "route":
        return (
          <OptimizeRouteControls
            onSearch={setSearchTerm}
            viewMode={viewMode}
            setViewMode={setViewMode}
            hazardMarkers={hazardMarkers}
            setHazardMarkers={setHazardMarkers}
            setRoutes={setRoutes}
            routes={routes}
            selectedProfile={selectedProfile}
            setSelectedProfile={setSelectedProfile}
            setMapCenter={setMapCenter}
            setSelectedRouteInfo={setSelectedRouteInfo}
            floodSensorsStreets={floodSensorsStreets} // ✅ Pass state value
            setFloodSensorsStreets={setFloodSensorsStreets} // ✅ Pass setter function
            floodSensorsWaterways={floodSensorsWaterways} // ✅ Pass state value
            setFloodSensorsWaterways={setFloodSensorsWaterways} // ✅ Pass setter functionzz
            setEvacuationCentersLoc={setEvacuationCentersLoc}
            evacuationCenters={evacuationCenters}
            routeType={routeType}
            setRouteType={setRouteType}
            onCreateSession={handleCreateSession}
            routeModeTab={routeModeTab}
            setRouteModeTab={setRouteModeTab}
            filteredRoutes={filteredRoutes}
            simulationMode={simulationMode}
            setSimulationMode={setSimulationMode}
            simulatedFloodValues={simulatedFloodValues}
            setSimulatedFloodValues={setSimulatedFloodValues}
          />
        );
      case "report":
        return <ReportHazardsControls />;
      default:
        return null;
    }
  };

  // Add function to handle session creation
  const handleCreateSession = (currentSession: {
    startLocation: string;
    destination: string;
    selectedRoute: Route | null;
    routes: Route[];
    hazardMarkers: HazardMarker[];
  }) => {
    const newSession: OptimizationSession = {
      id: `session-${Date.now()}`,
      ...currentSession,
      timestamp: new Date(),
    };

    setOptimizationSessions((prev: OptimizationSession[]) => [
      ...prev,
      newSession,
    ]);
    setActiveSession(newSession.id);
  };

  // Add function to switch between sessions
  const handleSessionSwitch = (sessionId: string) => {
    const session = optimizationSessions.find(
      (s: OptimizationSession) => s.id === sessionId
    );
    if (session) {
      setActiveSession(sessionId);
      setRoutes(session.routes);
      setHazardMarkers(session.hazardMarkers);
    }
  };

  // Modify the sessions dropdown menu section
  const renderSessionsMenu = () => (
    <div className="dropdown-menu sessions-menu">
      {optimizationSessions.map((session: OptimizationSession) => (
        <div
          key={session.id}
          className="session-item"
          onClick={() => handleSessionSwitch(session.id)}
        >
          <div className="session-info">
            <div className="session-title">
              {session.startLocation} → {session.destination}
            </div>
            <div className="session-timestamp">
              {session.timestamp.toLocaleString()}
            </div>
          </div>
          {activeSession === session.id && (
            <span className="material-icons active-indicator">check</span>
          )}
        </div>
      ))}
      {optimizationSessions.length === 0 && (
        <div className="no-sessions">No active sessions</div>
      )}
    </div>
  );

  // Add these new state variables
  const [optimizationSessions, setOptimizationSessions] = useState<
    OptimizationSession[]
  >([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);

  // 1. Add state for routeModeTab at the top of SimulationTool
  const [routeModeTab, setRouteModeTab] = useState<
    "best" | "driving" | "cycling" | "walking" | "motorcycle"
  >("best");

  // 2. Filter routes for both map and dropdown
  const filteredRoutes =
    routeModeTab === "best"
      ? routes
      : routes.filter((route) => route.profile === routeModeTab);

  // 3. When routeModeTab changes, auto-select the first route in the filtered list
  useEffect(() => {
    if (
      filteredRoutes.length > 0 &&
      !filteredRoutes.some((route) => route.route_id === selectedProfile)
    ) {
      setSelectedProfile(filteredRoutes[0].route_id);
      setSelectedRouteInfo(filteredRoutes[0]);
    }
    // If the current selection is still valid, do nothing!
  }, [routeModeTab, filteredRoutes]);

  // 4. In map rendering, only render filteredRoutes (not all routes) unless in 'best' mode
  // In render2DMap and render3DMapbox, replace 'routes' with 'filteredRoutes' for all route rendering logic

  return (
    <div className="simulation-container">
      <div className="side-panel">
        <button
          className="icon-button"
          onClick={() => setSelectedFeature("map")}
        >
          <div className="icon-container">
            <span className="material-icons">map</span>
            <span className="icon-text">Hazard Map</span>
          </div>
        </button>
        <button
          className="icon-button"
          onClick={() => setSelectedFeature("route")}
        >
          <div className="icon-container">
            <span className="material-icons">route</span>
            <span className="icon-text">Optimize Routes</span>
          </div>
        </button>
        <button
          className="icon-button"
          onClick={() => setSelectedFeature("report")}
        >
          <div className="icon-container">
            <span className="material-icons">report_gmailerrorred</span>
            <span className="icon-text">Report a Hazard</span>
          </div>
        </button>
        <button className="icon-button" onClick={fetchRealTimeData}>
          <div className="icon-container">
            <span className="material-icons">sensors</span>
            <span className="icon-text">Live Sensor Data</span>
          </div>
        </button>
        <Link to="/" className="logo-bottom">
          <img src="/logo/SafePath-Logos.png" alt="SafePath Logo" />
        </Link>
      </div>
      <div className="main-content">
        {renderControls()}
        {viewMode === "2d" ? render2DMap() : render3DMapbox()}
      </div>

      {/* ✅ Real-Time Data Panel (Displays fetched sensor data) */}
      {selectedFeature === "realtime" && realTimeData && (
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "105px",
            width: "350px",
            backgroundColor: "rgba(255, 255, 255, 0.85)",
            borderRadius: "10px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            fontFamily: "'Inter', sans-serif",
            fontSize: "14px",
            zIndex: "1000",
          }}
        >
          <div className="display-control-header" style={{ width: "100%" }}>
            <h4 className="text-center">Monitor Sensor Data</h4>
          </div>
          {/* ✅ Category Dropdown with Arrow Icon */}
          <div
            style={{
              position: "relative",
              display: "inline-block",
              width: "100%",
              marginBottom: "20px",
              marginTop: "20px",
              paddingLeft: "20px",
              paddingRight: "20px",
            }}
          >
            <select
              value={selectedDataCategory ?? ""}
              onChange={(e) => setSelectedDataCategory(e.target.value)}
              className="profile-select-dropdown"
              style={{
                width: "100%",
                height: "30px",
                fontSize: "12px",
                padding: "4px 8px",
                border: "1px solid #a1a1a1",
                borderRadius: "5px",
                appearance: "none",
                fontFamily: "Inter, sans-serif",
                outline: "none",
                textTransform: "uppercase",
                fontWeight: selectedDataCategory ? "bold" : "normal",
              }}
            >
              <option value="" disabled>
                Select Sensor
              </option>
              {Object.keys(realTimeData).map((category) => (
                <option key={category} value={category}>
                  {category === "rain_gauge"
                    ? "🌧️ RAIN GAUGE"
                    : category === "flood_sensors"
                    ? "🌊 FLOOD SENSORS (WATERWAYS)"
                    : category === "street_flood_sensors"
                    ? "🌊 FLOOD SENSORS (STREETS)"
                    : category === "flood_risk_index"
                    ? "📈 FLOOD RISK INDEX"
                    : category === "earthquake_sensors"
                    ? "⚠️ EARTHQUAKE SENSORS"
                    : category.replace(/_/g, " ").toUpperCase()}
                </option>
              ))}
            </select>

            {/* Arrow icon */}
            <div
              style={{
                position: "absolute",
                right: "25px",
                top: "4px",
                pointerEvents: "none",
                fontSize: "20px",
                color: "black",
                transition: "color 0.3s ease-in-out",
              }}
            >
              <span className="material-icons">arrow_drop_down</span>
            </div>
          </div>

          {/* ✅ Display Selected Category Data */}
          {selectedDataCategory && realTimeData[selectedDataCategory] && (
            <div
              style={{
                margin: "0px 20px 20px 20px",
                maxHeight: "500px",
                overflowY: "auto",
                border: "0.5px solid #ddd",
                borderRadius: "6px",
                padding: "8px",
                backgroundColor: "#fff",
              }}
            >
              <ul style={{ paddingLeft: "10px", listStyleType: "none" }}>
                {realTimeData[selectedDataCategory].map(
                  (sensor: any, index: number) => (
                    <li
                      key={index}
                      style={{
                        fontSize: "13px",
                        padding: "6px 0",
                        borderBottom: "0.5px solid #eaeaea",
                      }}
                    >
                      <strong style={{ color: "#333" }}>
                        {sensor["SENSOR NAME"]}
                      </strong>
                      :{/* ✅ Show Normal Level First */}
                      {sensor["NORMAL LEVEL"] && (
                        <span
                          style={{
                            color: "#666",
                            fontWeight: "500",
                            marginLeft: "5px",
                          }}
                        >
                          <br />
                          (Normal: {sensor["NORMAL LEVEL"]})
                        </span>
                      )}
                      {/* ✅ Show Current Level Next */}
                      <span
                        style={{
                          color: "#d32f2f",
                          fontWeight: "600",
                          marginLeft: "5px",
                        }}
                      >
                        {sensor["CURRENT"]}
                      </span>
                      {/* ✅ Show Description Only for Street Flood Sensors */}
                      {selectedDataCategory === "street_flood_sensors" &&
                        sensor["DESCRIPTION"] && (
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#666",
                              marginTop: "2px",
                            }}
                          >
                            ☄ {sensor["DESCRIPTION"]}
                          </div>
                        )}
                    </li>
                  )
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Route Info Container */}
      {selectedFeature === "route" && selectedRouteInfo && (
        <div
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            backgroundColor: "white",
            padding: "12px",
            borderRadius: "10px",
            boxShadow: "0 4px 4px rgba(0, 0, 0, 0.25)",
            fontFamily: "'Inter', sans-serif",
            fontSize: "14px",
            width: "auto",
          }}
        >
          {/* ✅ Show "Best Route" if optimal is selected */}
          <h4
            style={{
              fontSize: "13px",
              fontWeight: "bold",
              marginTop: "2px",
              textAlign: "center",
            }}
          >
            Route{" "}
            {(() => {
              const routeIndex = filteredRoutes.findIndex(
                (route) => route.route_id === selectedRouteInfo?.route_id
              );
              if (routeIndex === -1) return "Unknown";

              const label = [" - Best Route", " - 2nd Best", " - 3rd Best"];
              return `${routeIndex + 1}${
                routeIndex < label.length ? label[routeIndex] : ""
              }`;
            })()}
            {closedRoadsCount > 0 ? " (Impassable)" : ""}
          </h4>

          {/* ✅ Divider line */}
          <hr
            style={{
              border: "0",
              height: "1px",
              background: "#ccc", // Subtle gray divider
              margin: "14.5px 0",
            }}
          />

          {/* ✅ Grid layout for aligned labels and values */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "4fr 4fr",
              gap: "8px",
              fontSize: "13px",
            }}
          >
            <span style={{ fontSize: "12px", fontWeight: "650" }}>
              Profile:
            </span>
            <span style={{ fontSize: "12px" }}>
              {selectedRouteInfo?.profile
                ? selectedRouteInfo.profile.charAt(0).toUpperCase() +
                  selectedRouteInfo.profile.slice(1)
                : "Unknown"}
            </span>
            <span style={{ fontSize: "12px", fontWeight: "650" }}>
              Distance:
            </span>
            <span style={{ fontSize: "12px" }}>
              {selectedRouteInfo.distance.toFixed(1)} km
            </span>
            <span style={{ fontSize: "12px", fontWeight: "650" }}>
              Travel Time (Est.):
            </span>
            <span style={{ fontSize: "12px" }}>
              {formatDuration(selectedRouteInfo.duration)}
            </span>
            {/* ✅ Divider line */}
            <span style={{ gridColumn: "span 2" }}>
              <hr
                style={{
                  border: "0",
                  height: "0.5px",
                  background: "#ccc", // Subtle gray divider
                  margin: "8px 0",
                }}
              />
            </span>
            <span style={{ fontSize: "12px", fontWeight: "650" }}>
              Nearby Waterway Level:
            </span>
            {floodedReservoirAreas === null ||
            floodedReservoirAreas.length === 0 ? (
              <span style={{ fontSize: "12px" }}>No sensors nearby</span> // ✅ Show this when data is still loading or unavailable
            ) : floodedReservoirAreas.length === 1 &&
              floodedReservoirAreas[0].level === "No sensors nearby" ? (
              <span style={{ fontSize: "12px" }}>No sensors nearby</span> // ✅ Show only this if no sensors detected
            ) : (
              <span style={{ fontSize: "12px" }}>
                {floodedReservoirAreas.map((flood, index) => (
                  <div key={index}>
                    {flood.level}{" "}
                    {flood.normal ? `(Normal: ${flood.normal})` : ""}
                  </div>
                ))}
              </span>
            )}
            <span style={{ fontSize: "12px", fontWeight: "650" }}>
              Flooded Areas:
            </span>
            {floodedAreas === null || floodedAreas.length === 0 ? (
              <span style={{ fontSize: "12px" }}>No sensors nearby</span> // ✅ Show this when data is still loading or unavailable
            ) : floodedAreas.length === 1 &&
              floodedAreas[0].level === "No sensors nearby" ? (
              <span style={{ fontSize: "12px" }}>No sensors nearby</span> // ✅ Show only this if no sensors detected
            ) : (
              <span style={{ fontSize: "12px" }}>
                {floodedAreas.map((flood, index) => (
                  <div key={index}>
                    {flood.level} - {flood.location}
                  </div>
                ))}
              </span>
            )}
            <span style={{ fontSize: "12px", fontWeight: "650" }}>
              Obstructions:
            </span>
            <span style={{ fontSize: "12px" }}>{obstructionCount}</span>{" "}
            {/* ✅ Updated dynamically */}
            <span style={{ fontSize: "12px", fontWeight: "650" }}>
              Closed Lanes:
            </span>
            <span style={{ fontSize: "12px" }}>{closedLanesCount}</span>{" "}
            {/* ✅ Updated dynamically */}
            <span
              style={{
                fontSize: "12px",
                fontWeight: "650",
                marginBottom: "7px",
              }}
            >
              Closed Roads:
            </span>
            <span style={{ fontSize: "12px" }}>{closedRoadsCount}</span>{" "}
            {/* ✅ Updated dynamically */}
          </div>
        </div>
      )}
    </div>
  );
}

export default SimulationTool;

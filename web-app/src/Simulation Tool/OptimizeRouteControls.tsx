import React, { useState, useEffect } from "react";
import {
  IconButton,
  styled,
  Radio,
  RadioGroup,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import Autosuggest from "react-autosuggest";
import { HazardMarker } from "./types";
import { LatLng } from "leaflet";
import { createClient } from "@supabase/supabase-js";
import { Button, CircularProgress } from "@mui/material";
import Switch, { SwitchProps } from "@mui/material/Switch";

const supabaseUrl = "https://yucnqqtyzpsqwixilbeu.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1Y25xcXR5enBzcXdpeGlsYmV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk1OTg5MTgsImV4cCI6MjA1NTE3NDkxOH0.uRs-5fJrDnlXBnameJfkKFNtjT11mvkloN7IgyCFCO0";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Sensor data API environment variable (consistent with .env)
const SENSOR_API_URL =
  process.env.REACT_APP_SENSOR_API_URL ?? "http://127.0.0.1:5000/api/sensor-data";

interface OptimizeRouteControlsProps {
  onSearch: (value: string) => void;
  viewMode: string;
  setViewMode: (mode: string) => void;
  hazardMarkers: HazardMarker[];
  setHazardMarkers: (markers: HazardMarker[]) => void;
  setRoutes: (routes: Route[]) => void;
  routes: Route[];
  selectedProfile: string;
  setSelectedProfile: (index: string) => void;
  setMapCenter: (center: [number, number]) => void;
  setSelectedRouteInfo: (route: Route) => void;
  floodSensorsStreets: boolean;
  setFloodSensorsStreets: (value: boolean) => void;
  floodSensorsWaterways: boolean;
  setFloodSensorsWaterways: (value: boolean) => void;
  setEvacuationCentersLoc: (centers: any[]) => void;
  evacuationCenters: any[];
  routeType: string;
  setRouteType: (type: string) => void;
  onCreateSession: (session: {
    startLocation: string;
    destination: string;
    selectedRoute: Route | null;
    routes: Route[];
    hazardMarkers: HazardMarker[];
  }) => void;
  routeModeTab: string;
  setRouteModeTab: (
    mode: "best" | "driving" | "cycling" | "walking" | "motorcycle"
  ) => void;
  filteredRoutes: Route[];
  simulationMode: boolean;
  setSimulationMode: (val: boolean) => void;
  simulatedFloodValues: { [sensorName: string]: number };
  setSimulatedFloodValues: (val: { [sensorName: string]: number }) => void;
}

interface Suggestion {
  name: string;
  lat: string;
  lon: string;
}

// Define the Route interface
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
  totalFloodLevel: number;
}

const modes = ["driving", "cycling", "walking", "motorcycle"];

const accessToken =
  "pk.eyJ1IjoiYmVhcmtuZWVzIiwiYSI6ImNtMmo0ZHB1ZTAxbW8yanBvaHJtaDJ5cjcifQ.l5fWqJY-4JtKOjun2MehoA";

// Initialize pheromone levels for all routes
let pheromones: Record<string, number> = {};

// Define the TomTom API key
const tomtomApiKey = "lGflzY7sC1myxaUFeXjqGdK9aAwjGdHN"; // Replace with your actual API key

// Add this interface near the top of the file with other interfaces
interface StreetFloodSensor {
  "SENSOR NAME": string;
  CURRENT: string;
  // Add other properties if needed
}

// Add new interfaces
interface AntSolution {
  route: Route;
  quality: number;
  score: number;
}

// ACO Configuration Parameters
const ACO_CONFIG = {
  numAnts: 30, // Number of artificial ants in the colony
  numIterations: 100, // Maximum number of iterations
  evaporationRate: 0.5, // Rate at which pheromone evaporates (0 to 1)
  alpha: 1.0, // Importance of pheromone trails (exploitation)
  beta: 2.0, // Importance of heuristic information (exploration)
  q0: 0.9, // Probability threshold for exploitation vs exploration
};

// Pheromone trail bounds to prevent stagnation
const MIN_PHEROMONE = 0.1; // Minimum pheromone level to maintain exploration
const MAX_PHEROMONE = 5.0; // Maximum pheromone level to prevent dominance
const CONVERGENCE_THRESHOLD = 5; // Number of iterations without improvement before early stopping

// Function to generate possible routes
async function generatePossibleRoutes(
  start: LatLng,
  end: LatLng,
  mode: string
): Promise<Route[]> {
  // --- Mapbox Section ---
  const mapboxUrl = `https://api.mapbox.com/directions/v5/mapbox/${mode}/${start.lng},${start.lat};${end.lng},${end.lat}?geometries=geojson&alternatives=true&access_token=${accessToken}`;
  let mapboxRoutes: Route[] = [];

  try {
    const mbResp = await fetch(mapboxUrl);
    if (mbResp.ok) {
      const mbData = await mbResp.json();
      mapboxRoutes = mbData.routes.map((route: any, i: number) => ({
        route_id: `${mode}_mapbox_${i + 1}`,
        profile: mode,
        distance: route.distance / 1000, // to km
        duration: route.duration,
        geometry: route.geometry,
        coordinates: route.geometry.coordinates, // Make sure coordinates are included
        obstructions: 0,
        closedLanes: 0,
        closedRoads: 0,
        totalFloodLevel: 0,
      }));
    }
  } catch (err) {
    console.error("Mapbox routes error for mode", mode, err);
  }

  // --- TomTom Section ---
  // Translate our internal 'mode' to TomTom
  let tomtomMode = "";
  if (mode === "driving") tomtomMode = "car";
  if (mode === "walking") tomtomMode = "pedestrian";
  if (mode === "cycling") tomtomMode = "bicycle";
  if (mode === "motorcycle") tomtomMode = "motorcycle";
  // Only use TomTom for those modes!
  let tomtomRoutes: Route[] = [];
  if (tomtomMode) {
    const ttUrl = `https://api.tomtom.com/routing/1/calculateRoute/${start.lat},${start.lng}:${end.lat},${end.lng}/json?travelMode=${tomtomMode}&computeBestOrder=false&routeRepresentation=polyline&key=${tomtomApiKey}&maxAlternatives=3`;
    try {
      const ttResp = await fetch(ttUrl);
      if (ttResp.ok) {
        const ttData = await ttResp.json();
        // TomTom returns a single best + altRoutes array
        const main = ttData.routes || []; // fallback to [] if missing
        tomtomRoutes = main.map((route: any, i: number) => ({
          route_id: `${mode}_tomtom_${i + 1}`,
          profile: mode,
          // TomTom gives lengthInMeters and travelTimeInSeconds
          distance: route.summary.lengthInMeters / 1000,
          duration: route.summary.travelTimeInSeconds,
          geometry: {
            // Convert TomTom encoded polyline to [lng, lat] array
            type: "LineString",
            coordinates: decodeTomTomPolyline(route.legs[0].points),
          },
          coordinates: decodeTomTomPolyline(route.legs[0].points),
          obstructions: 0,
          closedLanes: 0,
          closedRoads: 0,
          totalFloodLevel: 0,
        }));
      }
    } catch (err) {
      console.error("TomTom routes error for mode", mode, err);
    }
  }

  // Combine Mapbox and TomTom
  return [...mapboxRoutes, ...tomtomRoutes];
}

// Polyline decoding helper for TomTom's format
function decodeTomTomPolyline(points: any[]): [number, number][] {
  // TomTom's points are {latitude,longitude}; convert directly
  if (!Array.isArray(points)) return [];
  return points.map((pt) => [pt.longitude, pt.latitude]);
}

const IOSSwitch = styled((props: SwitchProps) => (
  <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
))(({ theme }) => ({
  width: 34,
  height: 18,
  padding: 0,
  "& .MuiSwitch-switchBase": {
    padding: 0,
    margin: 2,
    transitionDuration: "200ms",
    "&.Mui-checked": {
      transform: "translateX(16px)",
      color: "white",
      "& + .MuiSwitch-track": {
        backgroundColor: "#AAD400",
        opacity: 1,
        border: 0,
      },
      "&.Mui-disabled + .MuiSwitch-track": {
        opacity: 0.5,
      },
    },
  },
  "& .MuiSwitch-thumb": {
    boxSizing: "border-box",
    width: 14,
    height: 14,
  },
  "& .MuiSwitch-track": {
    borderRadius: 26 / 2,
    backgroundColor: "gray",
    opacity: 1,
    transition: theme.transitions.create(["background-color"], {
      duration: 500,
    }),
  },
}));

const objectiveFunction = (route: Route): number => {
  const weights = {
    distance: 3.0,
    obstruction: 3.0,
    closedLane: 3.0,
    closedRoad: 10.0,
    floodLevel: 10.0,
  };

  // Calculate route score
  const score =
    weights.distance * route.distance +
    weights.obstruction * route.obstructions +
    weights.closedLane * route.closedLanes +
    weights.closedRoad * route.closedRoads +
    weights.floodLevel * route.totalFloodLevel;

  // Log calculated route scores in console
  console.log(`Route ${route.route_id} scoring details:`, {
    distance: `${route.distance}m (weight: ${weights.distance})`,
    obstructions: `${route.obstructions} (weight: ${weights.obstruction})`,
    closedLanes: `${route.closedLanes} (weight: ${weights.closedLane})`,
    closedRoads: `${route.closedRoads} (weight: ${weights.closedRoad})`,
    floodLevel: `${route.totalFloodLevel}m (weight: ${weights.floodLevel})`,
    totalScore: score,
  });

  return score;
};

// Core ACO route selection function implementing ant decision making
const selectRoute = (routes: Route[]): AntSolution => {
  if (Math.random() < ACO_CONFIG.q0) {
    // Exploitation phase: Choose best route based on pheromone and heuristic
    let bestQuality = -1;
    let selectedRoute: Route | null = null;

    routes.forEach((route) => {
      const pheromone = pheromones[route.route_id];

      // Heuristic value is inverse of route score (shorter/safer routes preferred)
      const heuristic = 1.0 / Math.max(objectiveFunction(route), 1e-6);

      // Combined quality using ACO formula: τ^α * η^β
      const quality =
        Math.pow(pheromone, ACO_CONFIG.alpha) *
        Math.pow(heuristic, ACO_CONFIG.beta);

      if (quality > bestQuality) {
        bestQuality = quality;
        selectedRoute = route;
      }
    });

    const route = selectedRoute || routes[0];
    return { route, quality: bestQuality, score: objectiveFunction(route) };
  }
  // Exploration phase: Probabilistic route selection
  else {
    let totalQuality = 0;
    const routeQualities: { route: Route; quality: number }[] = [];

    // Calculate quality for all routes
    routes.forEach((route) => {
      const pheromone = pheromones[route.route_id];
      const heuristic = 1.0 / Math.max(objectiveFunction(route), 1e-6);
      const quality =
        Math.pow(pheromone, ACO_CONFIG.alpha) *
        Math.pow(heuristic, ACO_CONFIG.beta);
      totalQuality += quality;
      routeQualities.push({ route, quality });
    });

    // Random selection if all qualities are 0
    if (totalQuality === 0) {
      const route = routes[Math.floor(Math.random() * routes.length)];
      return {
        route,
        quality: 0,
        score: objectiveFunction(route),
      };
    }

    // Roulette wheel selection based on route qualities
    const r = Math.random() * totalQuality;
    let currentSum = 0;

    for (const { route, quality } of routeQualities) {
      currentSum += quality;
      if (currentSum >= r) {
        return { route, quality, score: objectiveFunction(route) };
      }
    }

    // Fallback: return last route if no better option
    const lastRoute = routeQualities[routeQualities.length - 1].route;
    return {
      route: lastRoute,
      quality: routeQualities[routeQualities.length - 1].quality,
      score: objectiveFunction(lastRoute),
    };
  }
};

// Main ACO process for route optimization
async function acoProcess(
  start: LatLng,
  end: LatLng,
  routes: Route[]
): Promise<Route[] | null> {
  if (!routes.length) {
    console.error("No possible routes found. Exiting.");
    return null;
  }

  // Stigmergy: Initialize pheromone trails based on initial route qualities
  let pheromones: Record<string, number> = {};
  routes.forEach((route) => {
    const initialQuality = 1.0 / objectiveFunction(route);
    pheromones[route.route_id] = initialQuality;
  });

  let bestSolution: AntSolution | null = null;
  let lastBestScore = Infinity;
  let convergenceCount = 0;
  const iterationBestSolutions: AntSolution[] = [];

  // Local search function to improve solutions by examining nearby routes
  const localSearch = (solution: AntSolution): AntSolution => {
    // Find neighboring routes within 1km of current route's distance
    const neighbors = routes.filter(
      (r) =>
        Math.abs(r.distance - solution.route.distance) < 1000 && // within 1km
        r.route_id !== solution.route.route_id
    );

    let bestNeighbor = solution;
    for (const route of neighbors) {
      const score = objectiveFunction(route);
      if (score < bestNeighbor.score) {
        bestNeighbor = { route, quality: 1.0 / score, score };
      }
    }
    return bestNeighbor;
  };

  // Calculate variance for parameter adaptation
  const calculateVariance = (values: number[]): number => {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squareDiffs = values.map((val) => Math.pow(val - mean, 2));
    return squareDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  };

  // Dynaic parameter adaptation function based on solution diversity
  const updateParameters = (iteration: number) => {
    // Gradually increase exploitation probability iterations progress
    ACO_CONFIG.q0 = Math.min(
      0.9,
      0.5 + (iteration / ACO_CONFIG.numIterations) * 0.4
    );

    // Adjust pheromone importance based on trail diversity
    const pheromoneValues = Object.values(pheromones);
    const pheromoneVariance = calculateVariance(pheromoneValues);
    if (pheromoneVariance < 0.1) {
      // If pheromone trails are too similar, increase exploration
      ACO_CONFIG.alpha *= 0.95;
    } else {
      // If trails are diverse, maintain current balance
      ACO_CONFIG.alpha = Math.min(2.0, ACO_CONFIG.alpha * 1.05);
    }
  };

  // Main ACO iteration loop
  for (let iteration = 0; iteration < ACO_CONFIG.numIterations; iteration++) {
    console.log(`\nIteration ${iteration + 1}/${ACO_CONFIG.numIterations}`);
    const antSolutions: AntSolution[] = [];

    // Update parameters dynamically
    updateParameters(iteration);

    // Each ant selects a route
    for (let ant = 0; ant < ACO_CONFIG.numAnts; ant++) {
      const solution = selectRoute(routes);
      // Apply local search to improve solution
      const improvedSolution = localSearch(solution);
      antSolutions.push(improvedSolution);

      // Update best solution if necessary
      if (!bestSolution || improvedSolution.score < bestSolution.score) {
        bestSolution = improvedSolution;
      }
    }

    // Check for convergence
    if (bestSolution && Math.abs(bestSolution.score - lastBestScore) < 0.001) {
      convergenceCount++;
      if (convergenceCount >= CONVERGENCE_THRESHOLD) {
        console.log("ACO converged early after", iteration + 1, "iterations");
        break;
      }
    } else {
      convergenceCount = 0;
    }
    lastBestScore = bestSolution?.score ?? Infinity;

    // Store iteration's best solution
    const iterationBest = antSolutions.reduce((best, current) =>
      current.score < best.score ? current : best
    );
    iterationBestSolutions.push(iterationBest);

    // Pheromone updates with evaporation and bounds
    Object.keys(pheromones).forEach((routeId) => {
      pheromones[routeId] = Math.max(
        MIN_PHEROMONE,
        Math.min(
          MAX_PHEROMONE,
          pheromones[routeId] * (1 - ACO_CONFIG.evaporationRate)
        )
      );
    });

    // Pheromone deposit
    antSolutions.forEach((solution) => {
      const deposit = 1.0 / solution.score;
      pheromones[solution.route.route_id] = Math.max(
        MIN_PHEROMONE,
        Math.min(MAX_PHEROMONE, pheromones[solution.route.route_id] + deposit)
      );
    });

    // Additional deposit for the best-so-far solution with bounds
    if (bestSolution) {
      const bestDeposit = 2.0 / bestSolution.score;
      pheromones[bestSolution.route.route_id] = Math.max(
        MIN_PHEROMONE,
        Math.min(
          MAX_PHEROMONE,
          pheromones[bestSolution.route.route_id] + bestDeposit
        )
      );
    }

    // Log pheromone levels and convergence info periodically in console
    if ((iteration + 1) % 10 === 0) {
      console.log("Current pheromone levels:", pheromones);
      console.log(`Best score so far: ${bestSolution?.score}`);
      console.log(`Convergence count: ${convergenceCount}`);
      console.log(`Current q0: ${ACO_CONFIG.q0}`);
      console.log(`Current alpha: ${ACO_CONFIG.alpha}`);
    }
  }

  // Sort routes by their final scores
  const finalRoutes = [...routes].sort(
    (a, b) => objectiveFunction(a) - objectiveFunction(b)
  );

  // Return routes sorted by final scores
  return finalRoutes.map((route) => ({
    ...route,
    score: objectiveFunction(route),
  }));
}

const OptimizeRouteControls: React.FC<OptimizeRouteControlsProps> = (props) => {
  // Destructure all props for clarity and explicitness
  const {
    onSearch,
    viewMode,
    setViewMode,
    setHazardMarkers,
    setRoutes,
    routes,
    selectedProfile,
    setSelectedProfile,
    setMapCenter,
    setSelectedRouteInfo,
    floodSensorsStreets,
    setFloodSensorsStreets,
    floodSensorsWaterways,
    setFloodSensorsWaterways,
    setEvacuationCentersLoc,
    routeType,
    setRouteType,
    onCreateSession,
    hazardMarkers,
    routeModeTab,
    setRouteModeTab,
    filteredRoutes,
    simulationMode,
    setSimulationMode,
    simulatedFloodValues,
    setSimulatedFloodValues,
  } = props;

  // Flood calculation (MUST be above first use)
  const fetchStreetFloodLevels = async (routeCoordinates: [number, number][]) => {
    try {
      if (simulationMode && Object.keys(simulatedFloodValues).length > 0) {
        const sensorCoordinates: { [key: string]: [number, number] } = {
          "N.S. Amoranto Street": [121.0081000074452, 14.63559186578589],
          "New Greenland": [121.1159461907311, 14.700767513181207],
          "Kalantiaw Street": [121.068252, 14.6191769],
          "F. Calderon Street": [121.04810055319089, 14.7084683570545],
          "Christine Street": [121.01147413437955, 14.650162106610242],
          "Ramon Magsaysay Brgy Hall": [121.02188283176864, 14.659152430769959],
          "Phil-Am": [121.03110197159769, 14.64852649078562],
          "Holy Spirit": [121.07628398218428, 14.683750536396918],
          Libis: [121.0750335591855, 14.615697486834684],
          "South Triangle": [121.02641468052553, 14.637119372511387],
          "Nagkaisang Nayon": [121.02888218537234, 14.719332140062093],
          "Tandang Sora": [121.0322006, 14.6818637],
          Talipapa: [121.02782905845723, 14.690215772387946],
        };
        let totalFloodLevel = 0;
        for (const waypoint of routeCoordinates) {
          const [routeLon, routeLat] = waypoint;
          let waypointFloodLevel = 0;
          for (const [sensorName, simValUnknown] of Object.entries(simulatedFloodValues)) {
            const simValue = typeof simValUnknown === "number" ? simValUnknown : Number(simValUnknown);
            if (isNaN(simValue)) continue;
            const coord = sensorCoordinates[sensorName];
            if (!coord) continue;
            const [sensorLon, sensorLat] = coord;
            const distance = Math.sqrt(
              Math.pow(routeLat - sensorLat, 2) + Math.pow(routeLon - sensorLon, 2)
            );
            if (distance < 0.0006 && simValue > 0) {
              waypointFloodLevel += simValue;
            }
          }
          totalFloodLevel += waypointFloodLevel;
        }
        return totalFloodLevel;
      }

      // fallback to backend
      const response = await fetch(SENSOR_API_URL);
      if (!response.ok)
        throw new Error(
          `Failed to fetch flood sensor data: ${response.status}`
        );

      const data = await response.json();
      const streetFloodSensors = (data.street_flood_sensors ||
        []) as any[];

      const sensorCoordinates: { [key: string]: [number, number] } = {
        "N.S. Amoranto Street": [121.0081000074452, 14.63559186578589],
        "New Greenland": [121.1159461907311, 14.700767513181207],
        "Kalantiaw Street": [121.068252, 14.6191769],
        "F. Calderon Street": [121.04810055319089, 14.7084683570545],
        "Christine Street": [121.01147413437955, 14.650162106610242],
        "Ramon Magsaysay Brgy Hall": [121.02188283176864, 14.659152430769959],
        "Phil-Am": [121.03110197159769, 14.64852649078562],
        "Holy Spirit": [121.07628398218428, 14.683750536396918],
        Libis: [121.0750335591855, 14.615697486834684],
        "South Triangle": [121.02641468052553, 14.637119372511387],
        "Nagkaisang Nayon": [121.02888218537234, 14.719332140062093],
        "Tandang Sora": [121.0322006, 14.6818637],
        Talipapa: [121.02782905845723, 14.690215772387946],
      };

      let totalFloodLevel = 0;
      for (const waypoint of routeCoordinates) {
        let waypointFloodLevel = 0;
        const [routeLon, routeLat] = waypoint;
        for (const sensor of streetFloodSensors) {
          const sensorCoords = sensorCoordinates[sensor["SENSOR NAME"]];
          if (!sensorCoords) continue;
          const [sensorLon, sensorLat] = sensorCoords;
          const distance = Math.sqrt(
            Math.pow(routeLat - sensorLat, 2) +
            Math.pow(routeLon - sensorLon, 2)
          );
          if (distance < 0.0006 && sensor.CURRENT !== "No Flood") {
            const floodLevel = parseFloat(sensor.CURRENT.replace(" m", ""));
            if (!isNaN(floodLevel)) {
              waypointFloodLevel += floodLevel;
            }
          }
        }
        totalFloodLevel += waypointFloodLevel;
      }
      return totalFloodLevel;
    } catch (error) {
      console.error("Error fetching flood sensor data:", error);
      return 0;
    }
  };
  const [selectedHazardMode, setSelectedHazardMode] = useState("monitor");
  const [dropdownVisible3, setDropdownVisible3] = useState(false);
  const [dropdownVisible4, setDropdownVisible4] = useState(false);
  const [loading, setLoading] = useState(false);
  // Use the simulationMode and setSimulationMode from props, not local state!
  // const [simulationMode, setSimulationMode] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [evacuationCenters, setEvacuationCenters] = useState<any[]>([]);
  const [selectedRadius, setSelectedRadius] = useState<number | null>(null);
  const [selectedEvacuationCenter, setSelectedEvacuationCenter] = useState<
    string | null
  >(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [isSavingSession, setIsSavingSession] = useState(false);

  const calculateDistance = (loc1: LatLng, loc2: LatLng): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (loc2.lat - loc1.lat) * (Math.PI / 180);
    const dLon = (loc2.lng - loc1.lng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(loc1.lat * (Math.PI / 180)) *
        Math.cos(loc2.lat * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const fetchEvacuationCenters = async (
    radius: number,
    userLocation: LatLng
  ) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.from("QC_Philippines").select("*");

      if (error) throw new Error(error.message);

      const filteredLocations = data.filter((location) => {
        const [lat, lng] = location.gps_coordinates.split(",").map(Number);
        const locationLatLng = new LatLng(lat, lng);
        const distance = calculateDistance(userLocation, locationLatLng);
        return distance <= radius;
      });

      setEvacuationCenters(filteredLocations); // Update parent state directly
      setEvacuationCentersLoc(filteredLocations); // Update the centers in parent component
    } catch (err) {
      console.error("Error fetching locations:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle changes in checkbox selection
  const handleFloodSensorsWaterwaysChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFloodSensorsWaterways(event.target.checked);
  };

  const handleFloodSensorsStreetsChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFloodSensorsStreets(event.target.checked);
  };

  const handleLocationGPSClick = (setLocation: (value: string) => void) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const locationString = `Lat: ${latitude.toFixed(
            5
          )}, Lon: ${longitude.toFixed(5)}`;
          setLocation(locationString);
        },
        (error) => {
          console.error("Error fetching GPS location:", error);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  };

  const StyledRadio = styled(Radio)(({}) => ({
    "&.Mui-checked": {
      color: "#AAD400", // Set the color when the radio button is selected
    },
    "&.MuiRadio-root": {
      color: "#000000", // Default color
    },
  }));

  // Add new state declarations
  const [startLocationValue, setStartLocationValue] = useState("");
  const [destinationValue, setDestinationValue] = useState("");
  const [startSuggestions, setStartSuggestions] = useState<Suggestion[]>([]);
  const [destSuggestions, setDestinationSuggestions] = useState<Suggestion[]>(
    []
  );

  // Add state to store coordinates
  const [startCoordinates, setStartCoordinates] = useState<{
    lat: string;
    lon: string;
  } | null>(null);
  const [destinationCoordinates, setDestinationCoordinates] = useState<{
    lat: string;
    lon: string;
  } | null>(null);

  // Update fetch suggestions function
  const fetchSuggestions = async (value: string): Promise<Suggestion[]> => {
    try {
      console.log(`Fetching suggestions for: ${value}`); // Log input search query

      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
          value
        )}&format=json&apiKey=052066f9048a4fd19c3a66f9d5fdaea0`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const results = await response.json();
      console.log("Raw API Response:", results); // Log full API response

      const suggestions = results.results.map((result: any) => ({
        name: result.formatted,
        lat: result.lat.toString(),
        lon: result.lon.toString(),
      }));

      console.log("Formatted Suggestions:", suggestions); // Log formatted suggestions
      return suggestions;
    } catch (error) {
      console.error("Error fetching suggestions from Geopify:", error);
      return [];
    }
  };

  // Update the get suggestions functions with logs
  const handleFetchedStartLocationSuggestions = async ({ value }: any) => {
    console.log(`Fetching start location suggestions for: ${value}`);
    const suggestions = await fetchSuggestions(value);
    setStartSuggestions(suggestions);
  };

  const handleFetchedDestinationSuggestions = async ({ value }: any) => {
    console.log(`Fetching destination suggestions for: ${value}`);
    const suggestions = await fetchSuggestions(value);
    setDestinationSuggestions(suggestions);
  };

  // Update the clear suggestions functions
  const clearStartSuggestions = () => {
    setStartSuggestions([]);
  };
  const clearDestinationSuggestions = () => {
    setDestinationSuggestions([]);
  };

  // Functions for start location
  const handleStartInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    { newValue }: any
  ) => {
    setStartLocationValue(newValue);
    onSearch(newValue);
  };

  const handleStartSuggestionSelected = (
    event: any,
    { suggestion }: { suggestion: Suggestion }
  ) => {
    setStartLocationValue(suggestion.name);
    setStartCoordinates({ lat: suggestion.lat, lon: suggestion.lon });
    onSearch(suggestion.name);
    setMapCenter([parseFloat(suggestion.lat), parseFloat(suggestion.lon)]);
  };

  // Functions for destination
  const handleDestinationInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    { newValue }: any
  ) => {
    setDestinationValue(newValue);
  };

  const handleDestSuggestionSelected = (
    event: any,
    { suggestion }: { suggestion: Suggestion }
  ) => {
    setDestinationValue(suggestion.name);
    setDestinationCoordinates({ lat: suggestion.lat, lon: suggestion.lon });
  };

  // Function to render suggestion
  const renderSuggestion = (suggestion: Suggestion) => (
    <div className="suggestion-item">{suggestion.name}</div>
  );

  // Modify the handleProfileChange function
  const handleProfileChange = (routeId: string) => {
    const selectedRoute = routes.find((route) => route.route_id === routeId);
    if (selectedRoute) {
      setSelectedProfile(routeId);
      setSelectedRouteInfo(selectedRoute);
    }
  };

  console.log("Selected Profile:", selectedProfile);
  console.log(
    "Filtered Routes:",
    routes.filter((route: Route) => route.profile === selectedProfile)
  );

  // Update the useEffect that handles route fetching
  useEffect(() => {
    let isActive = true; // Add flag to prevent updates after unmount
    let intervalId: NodeJS.Timeout | null = null;

    const fetchAndSortRoutes = async () => {
      if (!startCoordinates || !destinationCoordinates || !isActive) return;

      try {
        // Fetch and sort routes
        const startLatLng = new LatLng(
          parseFloat(startCoordinates.lat),
          parseFloat(startCoordinates.lon)
        );
        const destinationLatLng = new LatLng(
          parseFloat(destinationCoordinates.lat),
          parseFloat(destinationCoordinates.lon)
        );

        let allRoutes: Route[] = [];

        // Fetch routes for all modes
        for (const mode of modes) {
          const modeRoutes = await generatePossibleRoutes(
            startLatLng,
            destinationLatLng,
            mode
          );
          if (modeRoutes) {
            allRoutes = allRoutes.concat(modeRoutes);
          }
        }

        if (!isActive) return; // Check if component is still mounted

        // Fetch hazards for all routes
        const routesWithHazards = await fetchHazardsForAllRoutes(allRoutes);

        if (!isActive) return;

        // Use ACO to determine the best route
        const acoResults = await acoProcess(
          startLatLng,
          destinationLatLng,
          routesWithHazards
        );

        if (!isActive) return;

        if (acoResults) {
          // Clear existing routes before setting new ones
          setRoutes([]); // Clear existing routes

          // Small delay to ensure clean state
          await new Promise((resolve) => setTimeout(resolve, 50));

          if (!isActive) return;

          // Set the new routes
          setRoutes(acoResults);
          if (!acoResults.some((route) => route.route_id === selectedProfile)) {
            setSelectedProfile(acoResults[0].route_id);
            setSelectedRouteInfo(acoResults[0]);
          }

          // Update hazard markers
          setHazardMarkers([
            {
              id: "start",
              type: "start",
              position: startLatLng,
              color: "green",
            },
            {
              id: "destination",
              type: "destination",
              position: destinationLatLng,
              color: "red",
            },
          ]);
        }
      } catch (error) {
        console.error("Error in fetchAndSortRoutes:", error);
      }
    };

    // Initial fetch
    fetchAndSortRoutes();

    // Set up interval for subsequent fetches
    intervalId = setInterval(fetchAndSortRoutes, 60000);

    // Cleanup function
    return () => {
      isActive = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [startCoordinates, destinationCoordinates]);

  useEffect(() => {
    if (routes.length > 0) {
      setSelectedProfile(routes[0].route_id);
      setSelectedRouteInfo(routes[0]);
    }
  }, [routeModeTab, routes]);

  async function fetchHazardsForAllRoutes(routes: Route[]) {
    console.log("Starting hazard fetch for routes:", routes);

    const updatedRoutes = await Promise.all(
      routes.map(async (route) => {
        // Get hazards first
        const { obstructions, closedLanes, closedRoads } = await fetchHazards(
          route.geometry.coordinates
        );

        // Get flood levels
        const totalFloodLevel = await fetchStreetFloodLevels(
          route.geometry.coordinates
        );

        console.log(`Route ${route.route_id} hazard details:`, {
          obstructions,
          closedLanes,
          closedRoads,
          totalFloodLevel,
        });

        return {
          ...route,
          obstructions,
          closedLanes,
          closedRoads,
          totalFloodLevel,
        };
      })
    );

    // Log the routes before sorting
    console.log(
      "Routes with hazards before sorting:",
      updatedRoutes.map((r) => ({
        id: r.route_id,
        distance: r.distance,
        floodLevel: r.totalFloodLevel,
        score: objectiveFunction(r),
      }))
    );

    // Sort routes by score
    const sortedRoutes = [...updatedRoutes].sort((a, b) => {
      const scoreA = objectiveFunction(a);
      const scoreB = objectiveFunction(b);
      return scoreA - scoreB;
    });

    // Log the routes after sorting
    console.log(
      "Routes after sorting:",
      sortedRoutes.map((r) => ({
        id: r.route_id,
        distance: r.distance,
        floodLevel: r.totalFloodLevel,
        score: objectiveFunction(r),
      }))
    );

    return sortedRoutes;
  }

  async function fetchHazards(routeCoordinates: [number, number][]) {
    // Extract bounding box for API request
    const lats = routeCoordinates.map((coord) => coord[1]);
    const lons = routeCoordinates.map((coord) => coord[0]);
    const minLat = Math.min(...lats),
      maxLat = Math.max(...lats);
    const minLon = Math.min(...lons),
      maxLon = Math.max(...lons);

    const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${tomtomApiKey}&bbox=${minLon},${minLat},${maxLon},${maxLat}&fields={incidents{type,geometry{type,coordinates},properties{iconCategory}}}&language=en-GB&timeValidityFilter=present&categoryFilter=0,1,2,3,4,5,6,7,8,9,10,14`;

    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`Failed to fetch hazard data: ${response.status}`);

    const data = await response.json();

    // Define which categories count as Obstructions, Closed Lanes, and Closed Roads
    const obstructionCategories = new Set([0, 1, 3, 5, 6, 9, 14]);
    const closedLaneCategories = new Set([7]);
    const closedRoadCategories = new Set([8]);

    let obstructionCount = 0;
    let closedLanesCount = 0;
    let closedRoadsCount = 0;

    data.incidents.forEach(
      (incident: {
        geometry: { coordinates: any };
        properties: { iconCategory: number };
      }) => {
        const coords = incident.geometry.coordinates;
        if (!Array.isArray(coords) || coords.length === 0) return;

        const [incidentLon, incidentLat] = Array.isArray(coords[0])
          ? coords[0]
          : coords;
        const category = incident.properties.iconCategory;

        // Check if the incident is near the route
        const isCloseToRoute = routeCoordinates.some(([routeLon, routeLat]) => {
          const distance = Math.sqrt(
            Math.pow(routeLat - incidentLat, 2) +
              Math.pow(routeLon - incidentLon, 2)
          );
          return distance < 0.00034; // Adjust threshold as needed
        });

        if (!isCloseToRoute) return;

        if (obstructionCategories.has(category)) obstructionCount++;
        if (closedLaneCategories.has(category)) closedLanesCount++;
        if (closedRoadCategories.has(category)) closedRoadsCount++;
      }
    );

    return {
      obstructions: obstructionCount,
      closedLanes: closedLanesCount,
      closedRoads: closedRoadsCount,
    };
  }

    // fetchStreetFloodLevels moved inside component so we have direct access to props
    // REMOVE the old top-level function definition

  // Modify the publish button click handler
  const handlePublishSession = async () => {
    if (filteredRoutes.length > 0) {
      setIsSavingSession(true); // Start loading
      try {
        // Find the selected evacuation center if in "nearest" mode
        let destinationText = destinationValue;
        if (routeType === "nearest" && selectedEvacuationCenter) {
          const selectedCenter = evacuationCenters.find(
            (center) => center.id.toString() === selectedEvacuationCenter
          );
          if (selectedCenter) {
            destinationText = selectedCenter.location_name;
          }
        }

        // First, insert into Route_Optimizations table
        const { data: routeOptimization, error: routeOptError } = await supabase
          .from("Route_Optimizations")
          .insert([
            {
              start_location: startLocationValue,
              destination: destinationText,
              created_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (routeOptError) throw routeOptError;

        // Get the generated route_optimization_id
        const routeOptimizationId = routeOptimization.id;

        // Fetch existing routes for the given route_optimization_id
        const { data: existingRoutes, error: fetchError } = await supabase
          .from("Routes")
          .select("route_number")
          .eq("route_optimization_id", routeOptimizationId);

        if (fetchError) throw fetchError;

        // Determine the starting route_number
        let nextRouteNumber = 1;
        if (existingRoutes.length > 0) {
          nextRouteNumber =
            Math.max(...existingRoutes.map((r) => r.route_number)) + 1;
        }

        // Insert each route with an incremented route_number
        for (let i = 0; i < filteredRoutes.length; i++) {
          const route = filteredRoutes[i];

          const { data: routeData, error: routeError } = await supabase
            .from("Routes")
            .insert([
              {
                route_optimization_id: routeOptimizationId,
                route_number: nextRouteNumber + i,
                profile: route.profile,
                eta: route.duration.toString(),
                distance: route.distance,
                waypoints: JSON.stringify(route.coordinates),
                created_at: new Date().toISOString(),
              },
            ])
            .select("id") // Select the ID of the inserted route
            .single();

          if (routeError) throw routeError;

          const routeId = routeData.id; // Get the numeric ID

          // Insert hazards using the numeric route ID
          if (
            route.obstructions > 0 ||
            route.closedLanes > 0 ||
            route.closedRoads > 0
          ) {
            const { error: hazardError } = await supabase
              .from("Hazards")
              .insert([
                {
                  route_id: routeId, // Use the numeric ID
                  obstructions: route.obstructions,
                  closed_lanes: route.closedLanes,
                  closed_roads: route.closedRoads,
                  affected_waypoints: JSON.stringify(route.coordinates),
                  created_at: new Date().toISOString(),
                },
              ]);

            if (hazardError) throw hazardError;
          }

          // Insert waterway flooded areas if any
          const waterwayFloodedWaypoints = route.coordinates.filter((coord) =>
            hazardMarkers.some(
              (marker) =>
                marker.type === "waterway_flood" &&
                marker.position.lat === coord[1] &&
                marker.position.lng === coord[0]
            )
          );

          if (waterwayFloodedWaypoints.length > 0) {
            const { error: waterwayError } = await supabase
              .from("Waterway_Flooded_Areas")
              .insert([
                {
                  route_id: routeId, // Use the numeric ID
                  affected_waypoints: JSON.stringify(waterwayFloodedWaypoints),
                  created_at: new Date().toISOString(),
                },
              ]);

            if (waterwayError) throw waterwayError;
          }

          // Insert street flooded areas if any
          const streetFloodedWaypoints = route.coordinates.filter((coord) =>
            hazardMarkers.some(
              (marker) =>
                marker.type === "street_flood" &&
                marker.position.lat === coord[1] &&
                marker.position.lng === coord[0]
            )
          );

          if (streetFloodedWaypoints.length > 0) {
            const { error: streetError } = await supabase
              .from("Street_Flooded_Areas")
              .insert([
                {
                  route_id: routeId, // Use the numeric ID
                  affected_waypoints: JSON.stringify(streetFloodedWaypoints),
                  created_at: new Date().toISOString(),
                },
              ]);

            if (streetError) throw streetError;
          }
        }

        // After successful database insertion, update the UI
        onCreateSession({
          startLocation: startLocationValue,
          destination: destinationText,
          selectedRoute:
            filteredRoutes.find((r) => r.route_id === selectedProfile) ||
            filteredRoutes[0],
          routes: filteredRoutes,
          hazardMarkers: hazardMarkers,
        });

        console.log("Session successfully saved and added to dropdown menu!", {
          startLocation: startLocationValue,
          destination: destinationText,
          routeCount: filteredRoutes.length,
        });
      } catch (error) {
        console.error("Error saving session:", error);
        // You might want to show an error message to the user here
      } finally {
        setIsSavingSession(false); // Stop loading regardless of outcome
      }
    }
  };

  return (
    <div className="explore-map-controls">
      <div
        className="search-bar-container"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.85)",
          padding: "0",
          borderRadius: "10px",
          boxShadow: "0 4px 4px rgba(0, 0, 0, 0.25)",
          width: "320px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ width: "320px", marginBottom: "8px" }}>
          <div className="display-control-header" style={{ width: "320px" }}>
            <h4 className="text-center">Find Evacuation Routes</h4>
          </div>
          <RadioGroup
            row
            aria-label="routeType"
            name="routeType"
            className="flex justify-center gap-[26px]"
            value={routeType}
            onChange={(e) => setRouteType(e.target.value)}
          >
            <div className="flex flex-col items-center">
              <span
                className="radio-button-text text-center"
                style={{ marginTop: "15px", fontSize: "11px" }}
              >
                Set
                <br />
                Destination
              </span>
              <StyledRadio value="destination" />
            </div>
            <div className="flex flex-col items-center">
              <span
                className="radio-button-text text-center"
                style={{ marginTop: "15px", fontSize: "11px" }}
              >
                Find
                <br />
                Evacuation Area
              </span>
              <StyledRadio value="nearest" />
            </div>
          </RadioGroup>
        </div>

        {/* Divider Line with adjusted spacing */}
        <hr
          className="border-t-2 w-[257px] mx-auto border-gray-300"
          style={{ marginBottom: "20px" }}
        />

        <div
          style={{
            position: "relative",
            width: "260px",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <span
              className="material-icons"
              style={{
                position: "absolute",
                left: "9px", // ✅ Adjust position
                fontSize: "21px",
                color: "green", // ✅ Green color for start marker
                zIndex: 10,
              }}
            >
              fmd_good
            </span>
            <Autosuggest
              suggestions={startSuggestions}
              onSuggestionsFetchRequested={
                handleFetchedStartLocationSuggestions
              }
              onSuggestionsClearRequested={clearStartSuggestions}
              getSuggestionValue={(suggestion: Suggestion) => suggestion.name}
              renderSuggestion={renderSuggestion}
              onSuggestionSelected={handleStartSuggestionSelected}
              inputProps={{
                placeholder: "Enter starting location...",
                value: startLocationValue,
                onChange: handleStartInputChange,
                className: "routing-searchBar",
                style: { paddingRight: "68px" },
              }}
              theme={{
                container: "autosuggest-container",
                suggestionsContainer:
                  startSuggestions.length > 0
                    ? "suggestions-container floating"
                    : "suggestions-container hidden",
                suggestionsList: "suggestions-list",
                suggestion: "suggestion-item",
                suggestionHighlighted: "suggestion-item-highlighted",
              }}
            />
            <IconButton
              style={{
                position: "absolute",
                right: "30px",
                top: "50%",
                transform: "translateY(-50%)",
                padding: "9px",
              }}
              aria-label="search"
              disableRipple
            >
              <span className="material-icons" style={{ fontSize: "20px" }}>
                search
              </span>
            </IconButton>
            <IconButton
              style={{
                position: "absolute",
                right: "5px",
                top: "50%",
                transform: "translateY(-50%)",
                padding: "7px",
              }}
              aria-label="Use GPS Location"
              onClick={() => handleLocationGPSClick(setStartLocationValue)}
              disableRipple
            >
              <span className="material-icons" style={{ fontSize: "20px" }}>
                near_me
              </span>
            </IconButton>
          </div>

          {/* Add search radius input for Nearest Evacuation Area mode */}
          {routeType === "nearest" && (
            <div
              style={{
                marginTop: "10px",
                width: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Search inputs row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <input
                  type="number"
                  placeholder="Min distance (km)"
                  className="radius-input"
                  value={selectedRadius || ""}
                  onChange={(e) => setSelectedRadius(Number(e.target.value))}
                />
                <button
                  onClick={() => {
                    if (selectedRadius && startCoordinates) {
                      const startLatLng = new LatLng(
                        parseFloat(startCoordinates.lat),
                        parseFloat(startCoordinates.lon)
                      );
                      fetchEvacuationCenters(selectedRadius, startLatLng);
                    }
                  }}
                  className="radius-search-button"
                >
                  Search
                </button>
              </div>

              {loading && (
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <CircularProgress
                    style={{ marginTop: "18px" }}
                    size={20}
                    color="inherit"
                  />
                </div>
              )}

              {evacuationCenters.length > 0 && (
                <>
                  {/* Add Select Destination label */}
                  <span
                    style={{
                      fontSize: "12px",
                      fontFamily: "Inter, sans-serif",
                      fontWeight: "600",
                      display: "block",
                      marginTop: "15px",
                      marginBottom: "5px",
                    }}
                  >
                    Select Destination
                  </span>
                  <div
                    style={{
                      width: "100%",
                      position: "relative",
                    }}
                  >
                    <select
                      value={selectedEvacuationCenter || ""}
                      onChange={async (event) => {
                        const selectedCenterId = event.target.value;
                        setSelectedEvacuationCenter(selectedCenterId);

                        // Find the selected evacuation center
                        const selectedCenter = evacuationCenters.find(
                          (center) => center.id.toString() === selectedCenterId
                        );
                        if (selectedCenter) {
                          const [lat, lng] = selectedCenter.gps_coordinates
                            .split(",")
                            .map(Number);
                          const newDestination = new LatLng(lat, lng);
                          setDestinationCoordinates({
                            lat: lat.toString(),
                            lon: lng.toString(),
                          });

                          // Check if startCoordinates is set
                          if (startCoordinates) {
                            const startLatLng = new LatLng(
                              parseFloat(startCoordinates.lat),
                              parseFloat(startCoordinates.lon)
                            );
                            const allRoutes = await generatePossibleRoutes(
                              startLatLng,
                              newDestination,
                              routeType
                            );

                            if (allRoutes.length > 0) {
                              setRoutes(allRoutes);
                              setSelectedProfile("0"); // Reset to the first route
                              setSelectedRouteInfo(allRoutes[0]); // Set the first route as selected

                              // Update hazard markers
                              setHazardMarkers([
                                {
                                  id: "start",
                                  type: "start",
                                  position: startLatLng,
                                  color: "green",
                                },
                                {
                                  id: "destination",
                                  type: "destination",
                                  position: newDestination,
                                  color: "red",
                                },
                              ]);
                            } else {
                              console.error("No routes generated.");
                            }
                          } else {
                            console.error("Start coordinates are not set.");
                          }
                        } else {
                          console.error("Selected center not found.");
                        }
                      }}
                      style={{
                        width: "100%",
                        height: "30px",
                        fontSize: "12px",
                        padding: "4px 8px",
                        paddingRight: "35px",
                        border: "1px solid #a1a1a1",
                        borderRadius: "5px",
                        appearance: "none",
                        fontFamily: "Inter, sans-serif",
                        outline: "none",
                      }}
                    >
                      <option value="">Select an Evacuation Center</option>
                      {evacuationCenters.map((center) => (
                        <option key={center.id} value={center.id}>
                          {center.location_name}
                        </option>
                      ))}
                    </select>
                    <div
                      style={{
                        position: "absolute",
                        right: "5px",
                        top: "4px",
                        pointerEvents: "none",
                        fontSize: "20px",
                        color:
                          evacuationCenters.length > 0 ? "black" : "#CECECE",
                      }}
                    >
                      <span className="material-icons">arrow_drop_down</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <div
            style={{ height: routeType === "destination" ? "10px" : "0px" }}
          ></div>

          {routeType === "destination" ? (
            <>
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span
                  className="material-icons"
                  style={{
                    position: "absolute",
                    left: "9px", // ✅ Adjust position
                    fontSize: "21px",
                    color: "red", // ✅ Green color for start marker
                    zIndex: 10,
                  }}
                >
                  fmd_good
                </span>
                <Autosuggest
                  suggestions={destSuggestions}
                  onSuggestionsFetchRequested={
                    handleFetchedDestinationSuggestions
                  }
                  onSuggestionsClearRequested={clearDestinationSuggestions}
                  getSuggestionValue={(suggestion: Suggestion) =>
                    suggestion.name
                  }
                  renderSuggestion={renderSuggestion}
                  onSuggestionSelected={handleDestSuggestionSelected}
                  inputProps={{
                    placeholder: "Enter destination...",
                    value: destinationValue,
                    onChange: handleDestinationInputChange,
                    className: "routing-searchBar",
                    style: { paddingRight: "68px" },
                  }}
                  theme={{
                    container: "autosuggest-container",
                    suggestionsContainer:
                      destSuggestions.length > 0
                        ? "suggestions-container floating"
                        : "suggestions-container hidden",
                    suggestionsList: "suggestions-list",
                    suggestion: "suggestion-item",
                    suggestionHighlighted: "suggestion-item-highlighted",
                  }}
                />
                <IconButton
                  style={{
                    position: "absolute",
                    right: "30px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    padding: "9px",
                  }}
                  aria-label="search"
                  disableRipple
                >
                  <span className="material-icons" style={{ fontSize: "20px" }}>
                    search
                  </span>
                </IconButton>
                <IconButton
                  style={{
                    position: "absolute",
                    right: "5px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    padding: "7px",
                  }}
                  aria-label="Use GPS Location"
                  onClick={() => handleLocationGPSClick(setDestinationValue)}
                  disableRipple
                >
                  <span className="material-icons" style={{ fontSize: "20px" }}>
                    near_me
                  </span>
                </IconButton>
              </div>
              {/* Mode Selector Bar */}
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  justifyContent: "center",
                  alignItems: "center",
                  margin: "8px 0",
                  width: "100%",
                }}
              >
                <IconButton
                  onClick={() => setRouteModeTab("best")}
                  style={{
                    color: routeModeTab === "best" ? "#AAD400" : "#444",
                    borderRadius: "50%",
                    transition: "color 0.2s, background 0.2s",
                  }}
                >
                  <span className="material-icons">alt_route</span>
                </IconButton>
                <IconButton
                  onClick={() => setRouteModeTab("driving")}
                  style={{
                    color: routeModeTab === "driving" ? "#AAD400" : "#444",
                    borderRadius: "50%",
                    transition: "color 0.2s, background 0.2s",
                  }}
                >
                  <span className="material-icons">directions_car</span>
                </IconButton>
                <IconButton
                  onClick={() => setRouteModeTab("motorcycle")}
                  style={{
                    color: routeModeTab === "motorcycle" ? "#AAD400" : "#444",
                    borderRadius: "50%",
                    transition: "color 0.2s, background 0.2s",
                  }}
                >
                  <span className="material-icons">two_wheeler</span>
                </IconButton>
                <IconButton
                  onClick={() => setRouteModeTab("cycling")}
                  style={{
                    color: routeModeTab === "cycling" ? "#AAD400" : "#444",
                    borderRadius: "50%",
                    transition: "color 0.2s, background 0.2s",
                  }}
                >
                  <span className="material-icons">directions_bike</span>
                </IconButton>
                <IconButton
                  onClick={() => setRouteModeTab("walking")}
                  style={{
                    color: routeModeTab === "walking" ? "#AAD400" : "#444",
                    borderRadius: "50%",
                    transition: "color 0.2s, background 0.2s",
                  }}
                >
                  <span className="material-icons">directions_walk</span>
                </IconButton>
              </div>

              {/* Label for the dropdown with increased top and bottom margin */}
              {filteredRoutes.length > 0 && (
                <span
                  style={{
                    fontSize: "12px",
                    fontFamily: "Inter, sans-serif",
                    fontWeight: "600",
                    display: "block", // Ensure it's on a new line
                    marginTop: "0px", // Increased space above the label
                    marginBottom: "5px", // Existing space below the label
                  }}
                >
                  Routes
                </span>
              )}

              {/* Wrapper for the select element to adjust arrow icon position */}
              {/* Wrapper for the select element */}
              {filteredRoutes.length > 0 && (
                <div
                  style={{
                    position: "relative",
                    display: "inline-block",
                    width: "260px",
                    marginRight: "20px",
                  }}
                >
                  <select
                    value={selectedProfile}
                    onChange={(e) => handleProfileChange(e.target.value)}
                    className="profile-select-dropdown"
                    style={{
                      width: "100%",
                      height: "30px",
                      fontSize: "12px",
                      padding: "4px 8px",
                      border:
                        filteredRoutes.length > 0
                          ? "1px solid #a1a1a1"
                          : "1px solid #CECECE",
                      borderRadius: "5px",
                      appearance: "none",
                      fontFamily: "Inter, sans-serif",
                      outline: "none",
                      transition: "border-color 0.3s ease-in-out",
                    }}
                    disabled={filteredRoutes.length === 0}
                  >
                    {(routeModeTab === "best"
                      ? filteredRoutes.slice(0, 3)
                      : filteredRoutes
                    ).map((route, index) => (
                      <option key={route.route_id} value={route.route_id}>
                        Route {index + 1}
                        {index === 0
                          ? " - Best Route"
                          : index === 1
                          ? " - 2nd Best"
                          : index === 2
                          ? " - 3rd Best"
                          : ""}
                      </option>
                    ))}
                  </select>

                  {/* Arrow icon */}
                  <div
                    style={{
                      position: "absolute",
                      right: "5px",
                      top: "4px",
                      pointerEvents: "none",
                      fontSize: "20px",
                      color: filteredRoutes.length > 0 ? "black" : "#CECECE",
                      transition: "color 0.3s ease-in-out",
                    }}
                  >
                    <span className="material-icons">arrow_drop_down</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            // Add routes dropdown for Nearest Evacuation Area
            <>
              {/* Mode Selector Bar */}
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  justifyContent: "center",
                  alignItems: "center",
                  margin: "8px 0",
                  width: "100%",
                }}
              >
                <IconButton
                  onClick={() => setRouteModeTab("best")}
                  style={{
                    color: routeModeTab === "best" ? "#AAD400" : "#444",
                    borderRadius: "50%",
                    transition: "color 0.2s, background 0.2s",
                  }}
                >
                  <span className="material-icons">alt_route</span>
                </IconButton>
                <IconButton
                  onClick={() => setRouteModeTab("driving")}
                  style={{
                    color: routeModeTab === "driving" ? "#AAD400" : "#444",
                    borderRadius: "50%",
                    transition: "color 0.2s, background 0.2s",
                  }}
                >
                  <span className="material-icons">directions_car</span>
                </IconButton>
                <IconButton
                  onClick={() => setRouteModeTab("motorcycle")}
                  style={{
                    color: routeModeTab === "motorcycle" ? "#AAD400" : "#444",
                    borderRadius: "50%",
                    transition: "color 0.2s, background 0.2s",
                  }}
                >
                  <span className="material-icons">two_wheeler</span>
                </IconButton>
                <IconButton
                  onClick={() => setRouteModeTab("cycling")}
                  style={{
                    color: routeModeTab === "cycling" ? "#AAD400" : "#444",
                    borderRadius: "50%",
                    transition: "color 0.2s, background 0.2s",
                  }}
                >
                  <span className="material-icons">directions_bike</span>
                </IconButton>
                <IconButton
                  onClick={() => setRouteModeTab("walking")}
                  style={{
                    color: routeModeTab === "walking" ? "#AAD400" : "#444",
                    borderRadius: "50%",
                    transition: "color 0.2s, background 0.2s",
                  }}
                >
                  <span className="material-icons">directions_walk</span>
                </IconButton>
              </div>

              {/* Label for the dropdown */}
              {filteredRoutes.length > 0 && (
                <span
                  style={{
                    fontSize: "12px",
                    fontFamily: "Inter, sans-serif",
                    fontWeight: "600",
                    display: "block",
                    marginTop: "0px",
                    marginBottom: "5px",
                  }}
                >
                  Routes
                </span>
              )}

              {/* Wrapper for the select element */}
              {/* Wrapper for the select element */}
              {filteredRoutes.length > 0 && (
                <div
                  style={{
                    position: "relative",
                    display: "inline-block",
                    width: "260px",
                    marginRight: "20px",
                  }}
                >
                  <select
                    value={selectedProfile}
                    onChange={(e) => handleProfileChange(e.target.value)}
                    className="profile-select-dropdown"
                    style={{
                      width: "100%",
                      height: "30px",
                      fontSize: "12px",
                      padding: "4px 8px",
                      border:
                        filteredRoutes.length > 0
                          ? "1px solid #a1a1a1"
                          : "1px solid #CECECE",
                      borderRadius: "5px",
                      appearance: "none",
                      fontFamily: "Inter, sans-serif",
                      outline: "none",
                      transition: "border-color 0.3s ease-in-out",
                    }}
                    disabled={filteredRoutes.length === 0}
                  >
                    {(routeModeTab === "best"
                      ? filteredRoutes.slice(0, 3)
                      : filteredRoutes
                    ).map((route, index) => (
                      <option key={route.route_id} value={route.route_id}>
                        Route {index + 1}
                        {index === 0
                          ? " - Best Route"
                          : index === 1
                          ? " - 2nd Best"
                          : index === 2
                          ? " - 3rd Best"
                          : ""}
                      </option>
                    ))}
                  </select>

                  {/* Arrow icon */}
                  <div
                    style={{
                      position: "absolute",
                      right: "5px",
                      top: "4px",
                      pointerEvents: "none",
                      fontSize: "20px",
                      color: filteredRoutes.length > 0 ? "black" : "#CECECE",
                      transition: "color 0.3s ease-in-out",
                    }}
                  >
                    <span className="material-icons">arrow_drop_down</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Show Sensors Dropdown */}
        <div
          className="debris-options mt-[7.5px] mr-[20px]"
          style={{ width: "100%" }}
        >
          <div className="debris-option">
            <div className="flex justify-between items-center">
              <span className="material-icons text-[18px] ml-[40px]">
                sensors
              </span>
              <span className="hazards-radio-texts ml-2">Show Sensors</span>
            </div>
            <IconButton
              aria-label="toggle dropdown"
              className="dropdown-icon"
              disableRipple
              disableFocusRipple
              onClick={() => setDropdownVisible3(!dropdownVisible3)}
            >
              <span className="material-icons mr-2">
                {dropdownVisible3 ? "arrow_drop_up" : "arrow_drop_down"}
              </span>
            </IconButton>
          </div>
          {dropdownVisible3 && (
            <div className="checkboxes ml-[70px] mb-[6px] flex flex-col gap-1">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={floodSensorsWaterways}
                    onChange={handleFloodSensorsWaterwaysChange}
                    size="small"
                  />
                }
                label={
                  <div className="ml-1 checkbox-label-container">
                    <span className="hazards-radio-texts">
                      Flood Sensors (Waterways)
                    </span>
                  </div>
                }
                className="checkbox-label"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={floodSensorsStreets}
                    onChange={handleFloodSensorsStreetsChange}
                    size="small"
                  />
                }
                label={
                  <div className="ml-1 checkbox-label-container">
                    <span className="hazards-radio-texts">
                      Flood Sensors (Streets)
                    </span>
                  </div>
                }
                className="checkbox-label"
              />
            </div>
          )}
        </div>

        {/* Simulation Mode Switch */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "10px",
            marginBottom: "10px",
            width: "100%",
          }}
        >
          <span
            style={{
              fontWeight: 600,
              fontSize: "12.5px",
              marginRight: "8px",
              color: "#00000",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Simulation Mode
          </span>
          <IOSSwitch
            checked={simulationMode}
            onChange={(e) => setSimulationMode(e.target.checked)}
          />
        </div>


        {/* Add publish button centered at the bottom */}
        {filteredRoutes.length > 0 && (
          <div className="publish-button-container">
            <button
              className="publish-button"
              onClick={handlePublishSession}
              disabled={isSavingSession}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                opacity: isSavingSession ? 0.7 : 1,
              }}
            >
              {isSavingSession ? (
                <>
                  <CircularProgress size={16} style={{ color: "white" }} />
                  <span style={{ width: "108px", textAlign: "center" }}>
                    Saving...
                  </span>
                </>
              ) : (
                <>
                  <span style={{ width: "135px", marginRight: "-28.5px" }}>
                    Share routes --{">"}
                  </span>
                  <span className="material-icons">phone_android</span>
                </>
              )}
            </button>
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: "0px",
            marginBottom: "10px",
            width: "260px",
            alignItems: "flex-end",
          }}
        ></div>
      </div>

      {/* Display Mode */}
      <div
        className="display-control flex flex-col items-center"
        style={{ width: "320px" }}
      >
        <div className="display-control-header mb-2">
          <h4 className="text-center">Display Mode</h4>
        </div>
        <RadioGroup
          row
          aria-label="view"
          name="view"
          className="flex justify-center gap-[26px] mt-1.5"
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value)}
        >
          <div className="flex flex-col items-center">
            <span className="radio-button-text text-center">2D View</span>
            <StyledRadio value="2d" />
          </div>
          <div className="flex flex-col items-center">
            <span className="radio-button-text text-center">3D View</span>
            <StyledRadio value="3d" />
          </div>
        </RadioGroup>
      </div>
    </div>
  );
};

export default OptimizeRouteControls;

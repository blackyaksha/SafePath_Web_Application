import { LatLng } from 'leaflet'; // Import LatLng from leaflet

// Define a type for coordinates
export interface Coordinates {
  lat: string;
  lon: string;
}

// Define a type for a step in a route leg
export interface Step {
  maneuver: {
    location: [number, number];
  };
}

// Define a type for a route leg
export interface Leg {
  steps: Step[];
}

// Define a type for a route
export interface Route {
  geometry: {
    coordinates: [number, number][];
    type?: string;
  };
  legs: Leg[];
  distance: number;
}

// Define a type for the response from Mapbox API
export interface MapboxResponse {
  routes: Route[];
}

// Extend the existing types file with a new type for the route data
export interface RouteData {
  mode: string;
  route_id: string;
  waypoints: {
    coordinates: [number, number];
    flood_level: number;
    debris_hazard: number;
  }[];
  distance: number;
}

// Define a type for a hazard marker
export interface HazardMarker {
  id: string;
  type: string;
  position: LatLng;
  flood_level?: number;
  color?: string;
}

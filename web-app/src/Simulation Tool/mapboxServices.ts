/// <reference path="./polyline.d.ts" />

import { Coordinates, MapboxResponse, Route, Step, RouteData } from './types';
import { lineString } from '@turf/helpers';
import simplify from '@turf/simplify';
import { LatLng } from 'leaflet';

// Helper function to check if a node is in all routes
function isNodeInAllRoutes(node: Step, routes: RouteData[]): boolean {
  return routes.every(route =>
    route.waypoints.some(step =>
      step.coordinates && node.maneuver && node.maneuver.location &&
      step.coordinates[0] === node.maneuver.location[0] &&
      step.coordinates[1] === node.maneuver.location[1]
    )
  );
}

// Helper function to decode and simplify polyline
function decodeAndSimplifyPolyline(geometry: { coordinates: [number, number][]; type: string }, tolerance: number = 0.000001): [number, number][] {
    if (geometry.type === 'LineString') {
        const line = lineString(geometry.coordinates);
        const simplified = simplify(line, { tolerance: tolerance, highQuality: true });
        // Swap coordinates to lat, long format
        return simplified.geometry.coordinates.map(coord => [coord[1], coord[0]] as [number, number]);
    }
    throw new Error('Unsupported geometry type');
}

// Function to fetch routes from Mapbox for multiple travel modes
export const fetchRoutesFromMapbox = async (
  startCoordinates: Coordinates, 
  destinationCoordinates: Coordinates, 
  hazardNodes: Step[], 
  travelModes: string[] = ['walking', 'cycling', 'driving']
) => {
  const routesForAllModes: RouteData[] = [];

  // Fetch routes for each travel mode
  const fetchPromises = travelModes.map(mode => {
    const url = `https://api.mapbox.com/directions/v5/mapbox/${mode}/${startCoordinates.lon},${startCoordinates.lat};${destinationCoordinates.lon},${destinationCoordinates.lat}?geometries=geojson&access_token=pk.eyJ1Ijoic2hhaW4zNCIsImEiOiJjbTQybGV5MHMwMXo5MndvaGJ1NjNrOGsyIn0.EA9hszZJFG9opl34eu08-g`;
    return fetch(url)
      .then(response => response.json())
      .then((data: MapboxResponse) => {
        console.log(`Routes fetched for mode ${mode}:`, data.routes);  // Log fetched routes
        const routes = data.routes.map((route: Route) => {
          const geometry = {
            coordinates: route.geometry.coordinates,
            type: route.geometry.type || 'LineString'  // Provide a default type if missing
          };
          const waypoints = decodeAndSimplifyPolyline(geometry);
          return {
            mode: mode,
            route_id: `${mode}_route`,  // Custom route_id based on mode
            waypoints: waypoints.map(coord => ({
              coordinates: coord,  // Already in lat, long format
              flood_level: 0,
              debris_hazard: 0
            })),
            distance: route.distance / 1000  // Convert meters to kilometers
          };
        });
        routesForAllModes.push(...routes);
      }).catch(error => {
        console.error(`Error fetching routes for mode ${mode}:`, error);
      });
  });

  try {
    await Promise.all(fetchPromises);

    // Assuming hazardNodes should be common across all modes
    if (routesForAllModes.length > 0) {
      const commonHazardNodes = hazardNodes.filter(node => isNodeInAllRoutes(node, routesForAllModes));
      return {
        routes: routesForAllModes,
        commonHazardNodes
      };
    }
  } catch (error) {
    console.error('Error fetching routes from Mapbox:', error);
    return { routes: [], commonHazardNodes: [] };
  }
};

// Define a type for the route data expected from Mapbox
interface MapboxRoute {
  geometry: {
    coordinates: [number, number][];
  };
  distance: number;
  duration: number;
}

export async function fetchRoutes(start: LatLng, end: LatLng, profile: string) {
  const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${start.lng},${start.lat};${end.lng},${end.lat}?geometries=geojson&access_token=pk.eyJ1Ijoic2hhaW4zNCIsImEiOiJjbTQybGV5MHMwMXo5MndvaGJ1NjNrOGsyIn0.EA9hszZJFG9opl34eu08-g`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.routes.map((route: MapboxRoute) => ({
      coordinates: route.geometry.coordinates.map(coord => [coord[1], coord[0]]),
      profile,
      distance: route.distance,
      duration: route.duration
    }));
  } catch (error) {
    console.error('Failed to fetch routes:', error);
    return [];
  }
}

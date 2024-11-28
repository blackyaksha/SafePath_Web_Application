import json
import random
import requests
from shapely.geometry import LineString

# Load input data
with open('routing-algorithm/input.json', 'r') as f:
    data = json.load(f)

# ACO parameters
num_ants = 30
num_iterations = 100
evaporation_rate = 0.5
pheromone_importance = 1.0
heuristic_importance = 2.0

# Initialize pheromone levels for all routes
pheromones = {}
for area in data['evacuation_areas']:
    for route in area['routes']:
        pheromones[(area['area_id'], route['route_id'])] = 1.0  # Initial pheromone level

# Objective function to minimize
def objective_function(route):
    return (route['distance'] * 0.333) + (route['hazard_zones'] * 0.333) + (route['flood_depth'] * 0.333)

# ACO main loop
best_route = None
best_value = float('inf')

for iteration in range(num_iterations):
    all_routes = []  # Store all ant-selected routes in this iteration
    
    for _ in range(num_ants):
        # Each ant evaluates all routes globally
        ant_route = None
        ant_value = float('inf')

        for area in data['evacuation_areas']:
            # Calculate probabilities for each route in this area
            probabilities = []
            for route in area['routes']:
                pheromone = pheromones[(area['area_id'], route['route_id'])]
                heuristic = 1.0 / objective_function(route)
                probability = (pheromone ** pheromone_importance) * (heuristic ** heuristic_importance)
                probabilities.append(probability)
            
            # Normalize probabilities
            total = sum(probabilities)
            probabilities = [p / total for p in probabilities]
            
            # Select a route based on probabilities
            selected_route = random.choices(area['routes'], weights=probabilities, k=1)[0]
            selected_value = objective_function(selected_route)
            
            # If this is the best route for this ant, update it
            if selected_value < ant_value:
                ant_route = {
                    'area_id': area['area_id'],
                    'destination_coordinates': area['destination_coordinates'],
                    'route_id': selected_route['route_id'],
                    'distance': selected_route['distance'],
                    'hazard_zones': selected_route['hazard_zones'],
                    'flood_depth': selected_route['flood_depth']
                }
                ant_value = selected_value
        
        all_routes.append((ant_route, ant_value))
        
        # Update global best solution if needed
        if ant_value < best_value:
            best_route = ant_route
            best_value = ant_value
    
    # Pheromone update: evaporation and deposition
    for area in data['evacuation_areas']:
        for route in area['routes']:
            pheromones[(area['area_id'], route['route_id'])] *= (1 - evaporation_rate)  # Evaporate pheromones
    
    for route, value in all_routes:
        pheromones[(route['area_id'], route['route_id'])] += 1.0 / value  # Deposit pheromones

# Fetch waypoints using OSRM API
def fetch_waypoints(start, end):
    osrm_url = f"http://router.project-osrm.org/route/v1/driving/{start[1]},{start[0]};{end[1]},{end[0]}?overview=full&geometries=geojson"
    response = requests.get(osrm_url)
    if response.status_code == 200:
        data = response.json()
        waypoints = data['routes'][0]['geometry']['coordinates']
        # Convert waypoints from [lon, lat] to [lat, lon]
        return [[lat, lon] for lon, lat in waypoints]
    else:
        return []

# Simplify waypoints
def simplify_waypoints(waypoints, tolerance=0.000001):
    line = LineString(waypoints)
    simplified_line = line.simplify(tolerance, preserve_topology=True)
    return list(simplified_line.coords)

# Get waypoints for the best route
waypoints = fetch_waypoints(data['starting_location_coordinates'], best_route['destination_coordinates'])
simplified_waypoints = simplify_waypoints(waypoints, tolerance=0.000001)

# Output the best route with waypoints
output_data = {
    "starting_location_coordinates": data['starting_location_coordinates'],
    "best_route": {
        "area_id": best_route['area_id'],
        "waypoints": simplified_waypoints,
        "destination_coordinates": best_route['destination_coordinates'],
        "route_id": best_route['route_id'],
        "distance": best_route['distance'],
        "hazard_zones": best_route['hazard_zones'],
        "flood_depth": best_route['flood_depth']
    }
}

with open('routing-algorithm/output-aco.json', 'w') as f:
    json.dump(output_data, f, indent=4)

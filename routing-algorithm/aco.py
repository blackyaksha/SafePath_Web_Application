import json
import random
import requests
from shapely.geometry import LineString
import polyline

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

# Define transportation modes for Mapbox
modes = ['walking', 'cycling', 'driving']

# Your Mapbox API access token
access_token = 'pk.eyJ1Ijoic2hhaW4zNCIsImEiOiJjbTQybGV5MHMwMXo5MndvaGJ1NjNrOGsyIn0.EA9hszZJFG9opl34eu08-g'

def generate_possible_routes(start, end, mode):
    """
    Fetches possible routes between start and end coordinates for a given mode using Mapbox API.
    """
    mapbox_url = f"https://api.mapbox.com/directions/v5/mapbox/{mode}/{start[1]},{start[0]};{end[1]},{end[0]}?geometries=polyline&access_token={access_token}"
    response = requests.get(mapbox_url)
    
    if response.status_code == 200:
        data = response.json()
        routes = data.get('routes', [])
        return [
            {
                'route_id': f'{mode}_route_{i+1}',
                'mode': mode,  # Add mode to the route data
                'distance': route['distance'] / 1000,  # Convert meters to kilometers
                'geometry': route['geometry']
            }
            for i, route in enumerate(routes)
        ]
    else:
        print(f"Error fetching routes for mode {mode}: {response.status_code}")
        print(f"Response content: {response.text}")
        return []

# Collect all possible routes for each mode
all_possible_routes = []
for mode in modes:
    all_possible_routes.extend(
        generate_possible_routes(data['starting_location_coordinates'], data['destination_coordinates'], mode)
    )

if not all_possible_routes:
    print("No possible routes found. Exiting.")
    exit()

# Initialize pheromones for each route
for route in all_possible_routes:
    pheromones[route['route_id']] = 1.0

def calculate_penalty(nodes):
    """
    Calculates additional penalties based on flood levels and debris hazards.
    Each criterion has equal weight (33.3%)
    """
    total_flood = sum(node['flood_level'] for node in nodes)
    total_debris = sum(node['debris_hazard'] for node in nodes)
    return total_flood + total_debris

def objective_function(route, nodes):
    """
    Objective function to evaluate a route based on distance and hazards.
    Each criterion has equal weight (33.3%)
    """
    distance_component = route['distance']
    hazards = calculate_penalty(nodes)
    flood_component = sum(node['flood_level'] for node in nodes)
    debris_component = sum(node['debris_hazard'] for node in nodes)
    
    # All components weighted equally at 33.3%
    return (distance_component + flood_component + debris_component) / 3

# ACO main loop
best_route = None
best_value = float('inf')

for iteration in range(num_iterations):
    all_routes = []  # Store routes selected by ants in this iteration
    
    for _ in range(num_ants):
        probabilities = []
        for route in all_possible_routes:
            route_nodes = next((r['nodes'] for r in data['routes'] if r['route_id'] == route['route_id']), [])
            pheromone = pheromones[route['route_id']]
            heuristic = 1.0 / max(objective_function(route, route_nodes), 1e-6)
            probabilities.append((pheromone ** pheromone_importance) * (heuristic ** heuristic_importance))
        
        # Normalize probabilities
        total = sum(probabilities)
        probabilities = [p / total for p in probabilities]
        
        # Select a route based on probabilities
        selected_route = random.choices(all_possible_routes, weights=probabilities, k=1)[0]
        route_nodes = next((r['nodes'] for r in data['routes'] if r['route_id'] == selected_route['route_id']), [])
        selected_value = objective_function(selected_route, route_nodes)
        
        # Update local best route
        all_routes.append((selected_route, selected_value))
        if selected_value < best_value:
            best_route = selected_route
            best_value = selected_value

    # Pheromone update
    for route in all_possible_routes:
        pheromones[route['route_id']] *= (1 - evaporation_rate)
    
    for route, value in all_routes:
        pheromones[route['route_id']] += 1.0 / value

def decode_polyline(polyline_str):
    """Decodes a polyline string into a list of coordinates."""
    return polyline.decode(polyline_str)

def simplify_waypoints(waypoints, tolerance=0.000001):
    """Simplifies a list of waypoints using a given tolerance."""
    if not waypoints:
        return []
    line = LineString(waypoints)
    simplified_line = line.simplify(tolerance, preserve_topology=True)
    return list(simplified_line.coords)

# Decode and simplify waypoints for the best route
if best_route:
    waypoints = decode_polyline(best_route['geometry'])
    simplified_waypoints = simplify_waypoints(waypoints)

    # Output the best route with waypoints
    output_data = {
        "starting_location_coordinates": data['starting_location_coordinates'],
        "best_route": {
            "route_id": best_route['route_id'],
            "mode": best_route['mode'],  # Add mode to the output
            "waypoints": simplified_waypoints,
            "destination_coordinates": data['destination_coordinates'],
            "distance": best_route['distance']
        }
    }

    with open('routing-algorithm/output-aco.json', 'w') as f:
        json.dump(output_data, f, indent=4)

    print(f"Selected best route: {best_route['route_id']} using mode: {best_route['mode']} with distance: {best_route['distance']} km")
else:
    print("No valid route selected.")

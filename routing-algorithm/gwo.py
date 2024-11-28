import json
import random
import requests
from shapely.geometry import LineString

# Load input data
with open('routing-algorithm/input.json', 'r') as f:
    data = json.load(f)

# GWO parameters
num_wolves = 30
num_iterations = 100
a_max = 2  # Maximum value of the coefficient a

# Objective function to minimize
def objective_function(route):
    return (route['distance'] * 0.333) + (route['hazard_zones'] * 0.333) + (route['flood_depth'] * 0.333)

# Initialize wolves (each wolf is represented by indices of selected routes for each area)
wolves = []
for _ in range(num_wolves):
    wolf = []
    for area in data['evacuation_areas']:
        # Add 'destination_coordinates' and 'area_id' to each route for clarity
        for route in area['routes']:
            route['destination_coordinates'] = area['destination_coordinates']
            route['area_id'] = area['area_id']
        # Randomly select a route index for this evacuation area
        wolf.append(random.randint(0, len(area['routes']) - 1))
    wolves.append(wolf)

# Initialize global best route
global_best_route = None
global_best_value = float('inf')

# GWO main loop
for iteration in range(num_iterations):
    # Evaluate all wolves
    for wolf in wolves:
        wolf_route_value = 0
        for i, area in enumerate(data['evacuation_areas']):
            # Get the route selected by the wolf for this area (index of the selected route)
            route_index = wolf[i]
            route = area['routes'][route_index]  # Correctly index the route list
            value = objective_function(route)
            wolf_route_value += value
            if wolf_route_value < global_best_value:
                global_best_route = route
                global_best_value = wolf_route_value

    # Identify alpha, beta, and delta wolves
    sorted_wolves = sorted(wolves, key=lambda w: sum(objective_function(area['routes'][w[i]]) for i, area in enumerate(data['evacuation_areas'])))
    alpha, beta, delta = sorted_wolves[:3]

    # Update positions of wolves
    a = a_max - iteration * (a_max / num_iterations)  # Linearly decrease a from a_max to 0
    for wolf in wolves:
        for i, area in enumerate(data['evacuation_areas']):
            # Get the current selected route index for the wolf
            current_route_index = wolf[i]
            current_route = area['routes'][current_route_index]

            # Calculate A and C for alpha, beta, and delta
            A1 = 2 * a * random.random() - a
            C1 = 2 * random.random()
            A2 = 2 * a * random.random() - a
            C2 = 2 * random.random()
            A3 = 2 * a * random.random() - a
            C3 = 2 * random.random()

            # Get the route objects for alpha, beta, and delta using their selected indices
            alpha_route = area['routes'][alpha[i]]
            beta_route = area['routes'][beta[i]]
            delta_route = area['routes'][delta[i]]

            # Calculate D and X for alpha, beta, and delta
            D_alpha = abs(C1 * objective_function(alpha_route) - objective_function(current_route))
            X1 = objective_function(alpha_route) - A1 * D_alpha

            D_beta = abs(C2 * objective_function(beta_route) - objective_function(current_route))
            X2 = objective_function(beta_route) - A2 * D_beta

            D_delta = abs(C3 * objective_function(delta_route) - objective_function(current_route))
            X3 = objective_function(delta_route) - A3 * D_delta

            # Calculate the new position (average of alpha, beta, delta influence)
            X_new = (X1 + X2 + X3) / 3

            # Select the closest matching route based on objective value
            new_route_index = min(range(len(area['routes'])), key=lambda r: abs(objective_function(area['routes'][r]) - X_new))
            wolf[i] = new_route_index  # Update the route selection for the wolf


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

# Ensure global_best_route is valid before accessing its elements
if global_best_route:
    # Get the best route object using global_best_route indices
    best_route = global_best_route  # Now this holds the full route object
    destination_coordinates = best_route['destination_coordinates']
    waypoints = fetch_waypoints(data['starting_location_coordinates'], destination_coordinates)
    simplified_waypoints = simplify_waypoints(waypoints, tolerance=0.000001)

    # Output the best route with waypoints
    output_data = {
        "starting_location_coordinates": data['starting_location_coordinates'],
        "best_route": {
            "area_id": best_route['area_id'],
            "waypoints": simplified_waypoints,
            "destination_coordinates": destination_coordinates,
            "route_id": best_route['route_id'],
            "distance": best_route['distance'],
            "hazard_zones": best_route['hazard_zones'],
            "flood_depth": best_route['flood_depth']
        }
    }

    with open('routing-algorithm/output-gwo.json', 'w') as f:
        json.dump(output_data, f, indent=4)
else:
    print("No valid route found.")

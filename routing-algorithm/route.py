import json
import folium

# Load the optimized route from output-aco.json
with open('routing-algorithm/output-aco.json', 'r') as f:
    output_data = json.load(f)

# Extract coordinates
starting_location = output_data['starting_location_coordinates']
waypoints = output_data['best_route']['waypoints']
destination = output_data['best_route']['destination_coordinates']

# Create a map centered around the starting location
m = folium.Map(location=starting_location, zoom_start=14)

# Add a marker for the starting location
folium.Marker(
    location=starting_location,
    popup='Starting Location',
    icon=folium.Icon(color='green')
).add_to(m)

# Add a marker for the destination
folium.Marker(
    location=destination,
    popup='Destination',
    icon=folium.Icon(color='red')
).add_to(m)

# Add the route as a polyline
folium.PolyLine(
    locations=[starting_location] + waypoints + [destination],
    color='blue',
    weight=5,
    opacity=0.7
).add_to(m)

# Save the map to an HTML file
m.save('routing-algorithm/optimized_route_map.html')

print("Map has been saved to 'routing-algorithm/optimized_route_map.html'. Open this file in a web browser to view the route.")

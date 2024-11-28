import fetch from 'node-fetch';
import simplifyCoords from 'simplify-js'; // Assuming you have a similar library

// Define start and end coordinates
const start = [14.5612, 121.2195]; // Starting point
const end = [14.5586, 121.208243];   // Destination point

// OSRM server URL
const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;

// Send request to OSRM
fetch(osrmUrl)
    .then(response => {
        if (!response.ok) {
            throw new Error(`Request failed with status code: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // Check if the response contains routes
        if (data.routes && data.routes.length > 0) {
            // Extract waypoints and convert to [latitude, longitude] format
            const waypoints = data.routes[0].geometry.coordinates;
            const waypointsFixed = waypoints.map(([lon, lat]) => ({ x: lon, y: lat }));

            // Simplify waypoints using a similar algorithm
            const tolerance = 0.0001; // Adjust tolerance for more or less simplification
            const simplifiedWaypoints = simplifyCoords(waypointsFixed, tolerance);

            // Convert simplified waypoints back to [latitude, longitude] format
            const simplifiedWaypointsArray = simplifiedWaypoints.map(point => [point.y, point.x]);

            console.log("Waypoints (lat, lon):", simplifiedWaypointsArray);
        } else {
            console.log("No routes found in the response.");
        }
    })
    .catch(error => {
        console.error(error.message);
    });
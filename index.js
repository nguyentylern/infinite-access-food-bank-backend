import express from 'express';
import cors from 'cors';
import 'dotenv/config';

const app = express();

app.use(cors());
app.use(express.json());


const google_api = process.env['GOOGLE_API_KEY'];

const port = 7878;

app.listen(port, () => {
    console.log(`Server listening on port ${port}.`);
})

app.get('/:zip/:location_type', async (req, res) => {
    let input_zip = req.params.zip;
    let location_type = req.params.location_type;
    let lat, lon;
    try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${input_zip}&key=${google_api}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP Error. Status: ${response.status}`);
        }
        const json = await response.json();
        if (
            json.results &&
            json.results[0] &&
            json.results[0].geometry &&
            json.results[0].geometry.location
        ) {
            let location = json.results[0].geometry.location;
            lat = location.lat;
            lon = location.lng;
            console.log("Latitude: ", lat, ", Longitude: ", lon);

            let locations = [];
            try {
                const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat}%2C${lon}&keyword=${location_type}&rankby=distance&key=${google_api}`;
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP Error. Status: ${response.status}`);
                }
                const json = await response.json();
                if (
                    json.results &&
                    json.results[0] &&
                    json.results[0].name &&
                    json.results[0].geometry &&
                    json.results[0].geometry.location
                ) {
                    for (let i = 0; i < json.results.length; i++) {
                        let location_lat = json.results[i].geometry.location.lat;
                        let location_lon = json.results[i].geometry.location.lng;
                        let radius = 6371; // Radius of the earth in km
                        let d_lat = (location_lat - lat) * (Math.PI / 180);  // deg_to_rad below
                        let d_lon = (location_lon - lon) * (Math.PI / 180); 
                        let a = 
                            Math.sin(d_lat / 2) * Math.sin(d_lat / 2) +
                            Math.cos((lat) * (Math.PI / 180)) * Math.cos((location_lat) * (Math.PI / 180)) * 
                            Math.sin(d_lon/2) * Math.sin(d_lon/2); 
                        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
                        let d = radius * c; // Distance in km
                        let m = d * 0.621371 // Distance in miles

                        locations.push({
                            name: json.results[i].name,
                            location: json.results[i].vicinity,
                            distance: m
                        })
                    }
                }
                res.send(locations);
            } catch (error) {
                console.error("Error fetching data: ", error);
                res.status(500);
            }
        }
    } catch (e) {
        console.error("Error fetching data: ", e);
        res.status(500);
    }
})
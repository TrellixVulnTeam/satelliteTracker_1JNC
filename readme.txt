Welcome to my satellite tracker project!

This project tracks 100 different satellites in their orbits around the earth,
with 10 groundsites on the earth's surface.

The point of the project is to visualize satellite paths in 3D, while also
showing where those paths are visible to different points on the earth.

This project uses python 3 to calculate orbital data for each satellite,
and passes all of that in to a csv file. D3.js is used to parse the csv file
and propogate the satellite orbits. Three.js is used to create the 3D scene.

The application can be run either by double-clicking on app.py, or with the following 
command in the root directory:
python app.py
It will take a few seconds to first start up because new orbital positions are being
calculated. You should be good to go once the following message is shown:
"Running on http://127.0.0.1:5000/ (Press CTRL+C to quit)"

You should then be able to access the application by going to localhost:5000 in a
web browser.

The application allows for the user to select and view any of the satellite orbits from
the spacecraft in the list on the left hand side of the window.

The satellite path shown is a 12 hour snapshot of the satellite's path around the earth.
The user can also select a ground site to show where the satellite's orbit will be
visible to that ground site's location on the earth.

As a fun experiment, I added a DirectionalLight to shine on the globe and show in real time which
parts of the earth are lit by the sun. Rather than just have the light rotate around the earth
at a set angle, I have opted to grab data on where the sun will be during a 12 hour period, and
have the DirectionalLight follow that path. This way it will be as real-to-life as I can manage
to make it.



Going Forward:
The project currently only calculates new orbital data when app.py is first run. This needs to
be changed so that the data is recalculated every 6 hours, and new TLE data is pulled from
space-track.org every 24 hours. The UI also needs to be updated with the new satellite
paths without refreshing the pages.

I have some additional UI features planned, such as the ability to hover over a
satellite path and have a tooltip pop up, showing the name of the satellite that path 
belongs to.

I also am planning on grabbing the user's location based on their IP address, and calculating
the visibility of satellites based on that location.
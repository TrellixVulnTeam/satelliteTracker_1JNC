Welcome to my satellite tracker project!

This project tracks 100 different satellites in their orbits around the earth,
with 10 groundsites on the earth's surface.

The point of the project is to visualize satellite paths in 3D, while also
showing where those paths are visible to different points on the earth.

This project uses python 3 to calculate orbital data for each satellite,
and passes all of that data over to the javascript to parse out the data and display 
each satellite orbit. The data is also saved to a json file for ease of use.

The application can be run by starting a CLI in the root directory and running the following command:
python main.py

A free account with space-track.org and ipstack.com are both required at this time in order to gather
necessary data to show the satellites' orbits. You will be asked on startup to provide your username
and password for space-track, as well as your ipstack access key.
You should then be able to access the application by going to localhost:5000 in a
web browser.

Depending on how long ago the orbital data was calculated, it can take a few seconds to recalculate
before the loading screen in the browser disappears.

The application allows for the user to select and view any of the satellite orbits from
the spacecraft in the list on the left hand side of the window.

The satellite path shown is a 12 hour snapshot of the satellite's path around the earth.
The user can also select a ground site to show where the satellite's orbit will be
visible to that ground site's location on the earth.

As an experiment, I added a shader to the globe that follows an orbiting DirectionalLight to show where the 
sun is shining on the earth in real time. Rather than just have the light rotate around the earth at a set 
angle, I have opted to grab data on where the sun will be during a 12 hour period, and have the 
DirectionalLight follow that path. This way it will be as real-to-life as I can manage to make it.

Going Forward:
I have some additional UI features planned, such as the ability to click on a satellite path and have the UI 
show the time that the satellite will be at that point on its path.
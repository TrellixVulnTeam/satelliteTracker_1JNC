Welcome to my satellite tracker project!

This project tracks 100 different satellites in their orbits around the earth,
with 15 groundsites on the earth's surface.

The point of the project is to visualize satellite paths in 3D, while also
showing where those paths are visible to different points on the earth.

This project uses python to calculate orbital data for each satellite,
and passes all of that in to a csv file. D3.js is used to parse the csv file
and propogate the satellite orbits. Three.js is used to create the 3D scene.

The project can be run with a simple python command from the root directory:
If python 2 is installed:
python -m SimpleHTTPServer 8080
If python 3 is installed:
python -m http.server 8080

The application currently allows for the user to select and view satellite orbits.
The satellite path shown is a 24 hour snapshot of the satellite's future path.
The user can also select a ground site to show where the satellite's orbit will be
visible to that location on the earth.


Going Forward:
The project currently requires the user to run the TLE.py file in order to calculate
updated satellite data before either starting the javascript side of the application,
or refreshing the webpage if they've already got the project running. This is less
than ideal, and I plan on adding code in both python and javascript files to
allow for a client/server relationship between them. Once this is done, the python
side will grab new data from space-track.org once every 24 hours, and will
recalculate orbital data again 12 hours later using the data it already has from
space-track.org.

I have some additional UI features planned, such as the ability to hover over a
satellite path and have a tag pop up, showing the time that the spacecraft will
pass through that point.
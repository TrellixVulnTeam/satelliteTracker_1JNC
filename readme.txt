This project uses D3.js to parse a csv table and propogate satellite orbits.
Three.js is for the 3D view.

The project can be run with a simple python command:
If python 2 is installed, the following command can be run in the root directory:
python -m SimpleHTTPServer 8080
If python 3 is installed, the following command can be run in the root directory:
python -m http.server 8080

As it stands, I currently have only propogated the orbit path for the ISS, changing
the color of the path as it comes above the horizon of a specified ground station.

The python file loads data from space-track.org and gathers the necessary information
for the javascript to create the orbit.

Known Issue:
In the python application, I currently am writing a date to a file to check against
to see if the TLE data needs to be updated. Every once in a while, it will freak
out either when reading from the file or writing to it, stating that the format
of the time data is wrong. It has to do with whether or not there is a decimal
to the seconds of the date. It doesn't like having them when writing to a file,
but it doesn't like not having them when reading from the file. I have hopefully
fixed this in a hacky way by creating the datetime and later adding .3333333
seconds to it later on. It has working in both reading and writing when I've
tested it.



Going Forward:
I currently am using text files to store information about the spacecraft. I'm going
to implement a database to store all of that information. For the sake of sharing
the source code, I will probably leave the text files as a default option so the
project runs without needing a database set up.

I don't currently have the python and the javascript applications talking to one
another. The goal is to have the python application update once every 24 hours
with new TLE information from spacetrack and send a notification for the web page
to refresh and load the new data.

I want to include an actual UI. I'm in the beginning stages of the application,
but I plan on having sliders to choose date and time ranges for an orbit path,
options to select and deselect spacecraft, and the ability to send a request
for a spacecraft not in the database.

Host the application. It's probably not worth much if I can't show the thing
actually running.

There are many more small cosmetic changes I plan on making as I get further into
building the total application. I'll keep updating this as I solidify those plans.
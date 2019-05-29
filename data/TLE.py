# https://pypi.org/project/spacetrack/
# pip install spacetrack
from spacetrack import SpaceTrackClient
import spacetrack.operators as op
from numpy import diff
import numpy as np
# pip install skyfield    https://rhodesmill.org/skyfield/
from skyfield.api import Topos, load
import json
# https://pynative.com/python-mysql-database-connection/    https://pynative.com/install-mysql-connector-python/
# pip install mysql-connector-python
# import mysql.connector
from datetime import datetime, timedelta
from pytz import timezone

# some ideas for going forward:
# Django: https://medium.com/cs-math/11-things-i-wish-i-knew-about-django-development-before-i-started-my-company-f29f6080c131


# get TLE information from CelesTrakstations_url = 'http://celestrak.com/NORAD/elements/stations.txt'
"""satellites = load.tle(stations_url)
# for the following line, ISS, ZARYA, or ISS (ZARYA) can be used. Some spacecraft have multiple keys (names) that can be used
satellite = satellites['ISS (ZARYA)']"""

spacecraftNames = []  # list of spacecraft keys to get TLE values
IDs = [4, 8, 9, 11, 12, 18, 19, 20, 22, 24, 25, 26, 29, 30, 31, 32, 33, 34, 46, 48, 49, 54, 168, 19822, 20580, 22049,
25492, 25544, 25989, 25994, 27424, 27540, 27607, 30580, 30797, 31135, 33401, 33591, 33595, 36827, 37755, 37818, 37843,
39075, 39084, 39444, 40069, 40482, 41019, 41332, 41765, 41834, 42709, 42711, 42713, 42722, 42726, 42740, 42982, 43020,
43021, 43231, 43466, 43467, 43468, 43546, 43547, 43548, 43549, 43550, 43551, 43552, 43553, 43554, 43556, 43557, 43558,
43559, 43560, 43561, 43565, 43595, 43596, 43597, 43598, 43638, 43639, 43640, 43702, 43756, 43870, 44029, 44030, 44031,
44032, 44033, 44069, 44110, 44188, 44222]
print(len(IDs))
timeNow = datetime.now()
fl = 'time.txt'
with open(fl, 'r') as file:
    timeOld = file.read()
    timeOld = datetime.strptime(timeOld, '%Y-%m-%d %H:%M:%S.%f')

# gets new data from space-track.org if it has been longer than a day
# that TLE data has been requested
if timeNow > timeOld:
    # TODO: validate username and password with spacetrack API
    user = input("spacetrack username: ")
    pd = input("password: ")
    st = SpaceTrackClient(user, pd)
    timeOld = datetime(timeNow.year, timeNow.month, timeNow.day, 0, 7, 35) + timedelta(days=1)
    timeOld += timedelta(seconds=.3333333)
    with open(fl, 'w') as file:
        file.write(str(timeOld))
    # norad_cat_id=[op.inclusive_range(1,36050)] instead of norad_cat_id=[25544, 42712], etc.
    data = st.tle_latest(norad_cat_id=IDs, ordinal=1, format='json')
    a = json.loads(data)
    print("got new data")
    spacecraftNames.clear()

    fl = 'spacecraft.txt'
    with open(fl, 'w') as file:
        for x in range(len(a)):
            craft = a[x]
            b = craft['TLE_LINE0'] + '\n'
            file.write(b)
            name = b[2:]
            spacecraftNames.append(name)
            b = craft['TLE_LINE1'] + '\n'
            file.write(b)
            b = craft['TLE_LINE2'] + '\n'
            file.write(b)
    fl = 'names.txt'
    with open(fl, 'w') as file:
        for name in spacecraftNames:
            file.write(name)

if len(spacecraftNames) == 0:
    fl = 'names.txt'
    with open(fl, 'r') as file:
        for line in file:
            spacecraftNames.append(line)

fl = 'spacecraft.txt'
# loads a dictionary of spacecraft TLEs and other relevant information
satellites = load.tle(fl)
d = timeNow.utcnow()

fl = "position.csv"
f = open(fl, "w+")
f.close()
with open(fl, 'a') as file:
    file.write('name,')
    file.write('latitude,')
    file.write('longitude,')
    file.write('elevation,')
    file.write('year,')
    file.write('month,')
    file.write('day,')
    file.write('hour,')
    file.write('minute,')
    file.write('second,')
    file.write('horizon,\n')
ts = load.timescale()
ground = Topos('41.72 N', '-111.82 E', None, None, 1403)
ground2 = Topos('28.57 N', '-80.65 E')
# creates a list of every minute for the next 24 hours
minutes = range(60*24)
# creates a list of times for each minute of the above minutes list
t = ts.utc(d.year, d.month, d.day, d.hour + (d.minute / 60), minutes)
mountain = timezone('US/Mountain')
for craft in spacecraftNames:
    # grabs a spacecraft by its name from the dictionary, removing the \n
    # character at the end of the spacecraftNames string
    satellite = satellites[craft[:-1]]

    """"# specifies the ground site latitude, longitude and elevation
    t = ts.now()
    difference = satellite - ground
    topocentric = difference.at(t)
    # the following five lines were an experiment to test whether the
    # spacecraft was currently above the horizon of the ground site or not
    alt, az, distance = topocentric.altaz()
    if alt.degrees > 0:
        print(spacecraftNames[0][:-1], 'is above the horizon')
    else:
        print(spacecraftNames[0][:-1], 'is not above the horizon')
    """
    # https://rhodesmill.org/brandon/2018/tiangong/

    beginning = datetime.now()
    # gets the spacecraft position at time t, which is a list in this case
    geocentric = satellite.at(t)
    # gets the longitude latitude of the point on the earth below the spacecraft,
    # and the spacecraft's elevation above the earth at time t
    subpoint = geocentric.subpoint()
    lat = subpoint.latitude.degrees
    long = subpoint.longitude.degrees
    el = subpoint.elevation.km
    # calculates the positions of the spacecraft during the list of times in t
    # to get an orbit
    orbit = (satellite - ground).at(t)
    orbit2 = (satellite - ground2).at(t)
    alt, az, dist = orbit.altaz()
    alt2, az2, dist2 = orbit2.altaz()
    above_horizon1 = np.array(alt.degrees > 0)
    above_horizon2 = np.array(alt2.degrees > 0)
    above_horizon = above_horizon1 + above_horizon2

    # gets data about the spacecraft and its orbit and writes it to a csv file
    with open(fl, 'a') as file:
        for i in range(len(lat)):
            file.write(craft[:-1] + ',')
            file.write(str(lat[i]) + ',')
            file.write(str(long[i]) + ',')
            file.write(str(el[i]) + ',')
            temp = str(t[i].utc)[1:-1]
            file.write(temp + ',')
            file.write(str(int(above_horizon[i])))
            file.write(',\n')
    ending = datetime.now()
    print(alt, 'calculated in', ending - beginning, 'seconds')

    # tells when the spacecraft rises above the viewer's horizon, and when
    # the satellite dips below the horizon
    """def plot_sky(pass_indices):
       i, j = pass_indices
       print('Rises:', t[i].astimezone(mountain))
       print('Sets:', t[j].astimezone(mountain))

    boundaries, = diff(above_horizon).nonzero()
    passes = boundaries.reshape(len(boundaries) // 2, 2)
    print(passes)
    for g in range(5):
       plot_sky(passes[g])"""

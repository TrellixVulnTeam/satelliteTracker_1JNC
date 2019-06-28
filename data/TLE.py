# https://pypi.org/project/spacetrack/
# pip install spacetrack
from spacetrack import SpaceTrackClient
import spacetrack.operators as op
from numpy import diff
import numpy as np
# pip install skyfield	  https://rhodesmill.org/skyfield/
from skyfield.api import Topos, load
from skyfield import almanac
import json
# https://pynative.com/python-mysql-database-connection/	https://pynative.com/install-mysql-connector-python/
# pip install mysql-connector-python
# import mysql.connector
from datetime import datetime, timedelta
from pytz import timezone
import threading
from multiprocessing.dummy import Pool as ThreadPool

# TODO: add a < while True: > loop to the program that checks for the times when the satellite data
# be updated. It will need to check right after we pass hour = 0, minute = 7 and second = 36 to grab
# all new data from space-track, and then again when hour = 12, minute = 7 and second = 36 to
# recalculate a 24 hour orbit prediction with the data already grabbed from space-track



# get TLE information from CelesTrak stations_url = 'http://celestrak.com/NORAD/elements/stations.txt'
"""satellites = load.tle(stations_url)
# for the following line, ISS, ZARYA, or ISS (ZARYA) can be used. Some spacecraft have multiple keys (names) that can be used
satellite = satellites['ISS (ZARYA)']"""

spacecraftNames = []  # list of spacecraft keys to get TLE values
IDs = [11, 20, 22, 29, 46, 19822, 20580, 22049, 23191, 23439, 23560, 23715, 25492, 25544, 25989, 25994,
       27424, 27540, 27600, 27607, 30580, 30797, 31135, 32275, 32781, 33401, 33591, 33752, 36827, 37755, 37790, 37818,
       38771, 39026, 39034, 39075, 39084, 39088, 39444, 39768, 40019, 40069, 40296, 40482, 40719, 40878, 40889,
       41019, 41032, 41332, 41765, 41783, 41834, 41875, 42711, 42722, 42726, 42808, 42959, 42982, 43020, 43021,
       43115, 43231, 43437, 43466, 43468, 43472, 43539, 43546, 43547, 43548, 43549, 43550, 43552, 43556, 43557,
       43558, 43559, 43560, 43565, 43566, 43567, 43595, 43596, 43638, 43707, 43935, 44030, 44031, 44032,
       44033, 44045, 44057, 44062, 44109, 44229, 44231, 44235, 44259]

siteLocations = np.array([
    Topos('38.883056 N', '-77.017369 E'), Topos('29.557857 N', '-95.089023 E'), Topos('28.579680 N', '-80.653010 E'),
    Topos('55.912104 N', '37.810254 E'), Topos('45.963929 N', '63.305125 E'), Topos('45.521186 N', '-73.393632 E'),
    Topos('48.086873 N', '11.280641 E'), Topos('18.913628 N', '-155.682263 E'), Topos('5.224441 N', '-52.776433 E'),
    Topos('36.065140 N', '140.127613 E'), Topos('-72.002914 N', '2.525675 E'), Topos('-35.401565 N', '148.981433 E'),
    Topos('-25.890233 N', '27.685390 E'), Topos('64.753870 N', '-147.345851 E'), Topos('13.071199 N', '76.099593 E')
])
siteNames = np.array(
    ["NASA HQ (D.C.)", "NASA Mission Control Center", "Kennedy Space Center", "Moscow Mission Control Center",
     "Baikonur Cosmodrome (Kazakhstan)", "Canadian Space Center", "German Space Operation Center",
     "South Point Satellite Station (Hawai'i)", "Guiana Space Center", "Tsukuba Space Center (Japan)",
     "Troll Satellite Station (Antarctica)", "Canberra Deep Space Complex (Australia)",
     "KSAT Hartebeesthoek (South Africa)", "North Pole Satellite Station (Alaska)", "Master Control Facility (India)"])





# potential help to speed up calculations:
# https://github.com/skyfielders/python-skyfield/issues/30
# https://pyorbital.readthedocs.io/en/latest/
# https://github.com/skyfielders/python-skyfield/issues/188
# https://programmingforresearch.wordpress.com/2012/10/30/using-pyephem-to-get-the-ground-coordinates-of-a-satellite/
# https://www.reddit.com/r/Python/comments/9pl4bc/using_python_pyephem_and_opencv_to_track/

def sortNames(e):
    return e.name

def compareTime():
    timeNow = datetime.now()
    fl = 'time.txt'
    with open(fl, 'r') as file:
        timeOld = file.read()
        timeOld = datetime.strptime(timeOld, '%Y-%m-%d %H:%M:%S.%f')
    if timeNow > timeOld:
        getNewData(timeNow)
    else:
        fl = 'names.txt'
        with open(fl, 'r') as file:
            for line in file:
                spacecraftNames.append(line)
    fl = 'spacecraft.txt'
    # loads a dictionary of spacecraft TLEs and other relevant information
    satellites = load.tle(fl)
    satList = satellites.values()
    satList = list(set(satList))
    satList.sort(key=sortNames)
    d = timeNow.utcnow()
    return (satList,d,spacecraftNames)



def getNewData(timeNow):
    # gets new data from space-track.org if it has been longer than a day
    # that TLE data has been requested
    fl = 'time.txt'
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
    spacecraftNames.sort()
    fl = 'names.txt'
    with open(fl, 'w') as file:
        for name in spacecraftNames:
            file.write(name)
    return spacecraftNames

def writeSpacecraftTitle():
    fl = "satelliteData.csv"
    with open(fl, 'w') as file:
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
        for i in range(len(siteLocations)):
            file.write('h' + str((i + 1)) + ',')
        file.write('\n')

def writeGSData(oLength):
    fl = "groundData.csv"
    with open(fl, 'w') as file:
        file.write('name,')
        file.write('lat,')
        file.write('lon,\n')
        for i in range(len(siteLocations)):
            file.write(siteNames[i] + ',')
            file.write(str(siteLocations[i].latitude.degrees) + ',')
            file.write(str(siteLocations[i].longitude.degrees) + ',')
            file.write('\n')
    fl = "orbitLength.csv"
    with open(fl, 'w') as file:
        file.write("len,\n")
        file.write(str(oLength))


    # calculates the positions of the spacecraft during the list of times in t
    # to get an orbit
def getOrbitData(satellite, t):
    print(satellite.name)
    # https://rhodesmill.org/brandon/2018/tiangong/

    # gets the spacecraft position at time t, which is a list in this case
    geocentric = satellite.at(t)
    # gets the longitude latitude of the point on the earth below the spacecraft,
    # and the spacecraft's elevation above the earth at time t
    subpoint = geocentric.subpoint()
    lat = subpoint.latitude.degrees
    long = subpoint.longitude.degrees
    el = subpoint.elevation.km
    horizonData = []
    for i in siteLocations:
        orbit = (satellite - i).at(t)
        alt, az, dist = orbit.altaz()
        horizonData.append((alt.degrees > 0).astype(int))


    # gets data about the spacecraft and its orbit and writes it to a csv file
    fl = "satelliteData.csv"
    with open(fl, 'a') as file:
        for i in range(len(lat)):
            file.write(satellite.name + ',')
            file.write(str(lat[i]) + ',')
            file.write(str(long[i]) + ',')
            file.write(str(el[i]) + ',')
            timeStripped = str(t[i].utc)[1:-1]
            file.write(timeStripped + ',')
            for j in horizonData:
                file.write(str(int(j[i])) + ',')
            file.write('\n')

def getSunPos(t):
    planets = load('de421.bsp')
    earth, sun = planets['earth'], planets['sun']
    point = earth + Topos('90 N', '0 E', None, None, -6378136)
    fl = 'sun.csv'
    with open(fl, 'w') as file:
        file.write('lat,')
        file.write('lon,\n')
        for tTime in t:
            alt, az, dis = point.at(tTime).observe(sun).apparent().altaz()
            az = 180 - az.degrees
            file.write(str(alt.degrees) + ',')
            file.write(str(az) + ',\n')

def main():
    ts = load.timescale()
    m = 60
    hr = 24
    minutes = range(m * hr)
    writeSpacecraftTitle()
    writeGSData(m * hr)
    satellites, d, spacecraftNames = compareTime()
    print(satellites)
    print(len(satellites))
    t = ts.utc(d.year, d.month, d.day, d.hour + (d.minute / 60), minutes)
    getSunPos(t)

    #satellite = satellites[craft]  # [:-1]
    for craft in satellites:
        getOrbitData(craft, t)

if __name__ == "__main__":
    main()
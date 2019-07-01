# https://pypi.org/project/spacetrack/
# pip install spacetrack
from spacetrack import SpaceTrackClient
import spacetrack.operators as op
from numpy import diff
import numpy as np
# pip install skyfield	  https://rhodesmill.org/skyfield/
from skyfield.api import Topos, load
import json
# https://pynative.com/python-mysql-database-connection/	https://pynative.com/install-mysql-connector-python/
# pip install mysql-connector-python
# import mysql.connector
from datetime import datetime, timedelta
from numba import jit



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

iter = 0
ts = load.timescale()
m = 60
hr = 6
minutes = range(m * hr)
d = datetime.utcnow()
t = ts.utc(d.year, d.month, d.day, d.hour + (d.minute / 60), minutes)
t.gast = t.gmst
fl = 'satelliteData.csv'


# potential help to speed up calculations:
# https://github.com/skyfielders/python-skyfield/issues/30
# https://pyorbital.readthedocs.io/en/latest/
# https://github.com/skyfielders/python-skyfield/issues/188
# https://programmingforresearch.wordpress.com/2012/10/30/using-pyephem-to-get-the-ground-coordinates-of-a-satellite/
# https://www.reddit.com/r/Python/comments/9pl4bc/using_python_pyephem_and_opencv_to_track/

def sortNames(e):
    return e.name

def compareTime(timeNow):
    fl = 'time.txt'
    with open(fl, 'r') as file:
        timeOld = file.read()
        timeOld = datetime.strptime(timeOld, '%Y-%m-%d %H:%M:%S.%f')
    if timeNow > timeOld:
        getNewData()
        timeOld = datetime(timeNow.year, timeNow.month, timeNow.day, 0, 7, 35) + timedelta(days=1)
        timeOld += timedelta(seconds=.3333333)
        with open(fl, 'w') as file:
            file.write(str(timeOld))
    fl = 'spacecraft.txt'
    # loads a dictionary of spacecraft TLEs and other relevant information
    satellites = load.tle(fl)
    satList = satellites.values()
    satList = list(set(satList))
    satList.sort(key=sortNames)
    satList = np.asarray(satList)
    return (satList)


def getNewData():
    # gets new data from space-track.org if it has been longer than a day
    # that TLE data has been requested
    fl = 'time.txt'
    # TODO: validate username and password with spacetrack API
    user = input("spacetrack username: ")
    pd = input("password: ")
    st = SpaceTrackClient(user, pd)

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
            b = craft['TLE_LINE1'] + '\n'
            file.write(b)
            b = craft['TLE_LINE2'] + '\n'
            file.write(b)



def getOrbitData(sat):
    pos = np.array(sat.at(t).position.km)/10
    alt = [(((sat - x).at(t)).altaz()) for x in siteLocations]
    #alt = (alt[0][0].degrees > 0)*1
    #print(len(alt))
    tt = t[iter].utc_datetime()
    with open(fl, 'a') as f:
        for i in range(len(pos[0])):
            f.write(sat.name + ',')
            for j in range(len(pos)):
                f.write(str(pos[j][i]) + ',')
            f.write(str(tt.year) + ',')
            f.write(str(tt.month) + ',')
            f.write(str(tt.day) + ',')
            f.write(str(tt.hour) + ',')
            f.write(str(tt.minute) + ',')
            f.write(str(tt.second) + ',')
            for j in range(len(alt)):
                a = (alt[j][0].degrees > 0)*1
                f.write(str(a[i]) + ',')
            f.write('\n')


def writeTitle(fl):
    with open(fl,'w') as f:
        f.write('name,')
        f.write('x,')
        f.write('y,')
        f.write('z,')
        f.write('year,')
        f.write('month,')
        f.write('day,')
        f.write('hour,')
        f.write('minute,')
        f.write('second,')
        for i in range(len(siteLocations)):
            f.write('h' + str(i+1) + ',')
        f.write('\n')

def main():
    satList = compareTime(d)
    fl = 'satelliteData.csv'
    writeTitle(fl)
    v = np.vectorize(getOrbitData)
    v(satList)
    e = datetime.utcnow() - d
    print(e)

if __name__ == "__main__":
    main()
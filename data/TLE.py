# https://pypi.org/project/spacetrack/
# pip install spacetrack
from spacetrack import SpaceTrackClient
import ephem
import json, operator
from datetime import datetime, timedelta
import math

# TODO: add a < while True: > loop to the program that checks for the times when the satellite data
# be updated. It will need to check right after we pass hour = 0, minute = 7 and second = 36 to grab
# all new data from space-track, and then again when hour = 12, minute = 7 and second = 36 to
# recalculate a 24 hour orbit prediction with the data already grabbed from space-track




# get TLE information from CelesTrak stations_url = 'http://celestrak.com/NORAD/elements/stations.txt'
"""satellites = load.tle(stations_url)
# for the following line, ISS, ZARYA, or ISS (ZARYA) can be used. Some spacecraft have multiple keys (names) that can be used
satellite = satellites['ISS (ZARYA)']"""


IDs = [11, 20, 22, 29, 46, 19822, 20580, 22049, 23191, 23439, 23560, 23715, 25492, 25544, 25989, 25994,
       27424, 27540, 27600, 27607, 30580, 30797, 31135, 32275, 32781, 33591, 33752, 36827, 37755, 37790, 37818,
       38771, 39026, 39034, 39075, 39084, 39088, 39444, 39768, 40019, 40069, 40296, 40482, 40719, 40878, 40889,
       41019, 41032, 41332, 41765, 41783, 41834, 41875, 42711, 42722, 42726, 42808, 42959, 42982, 43020, 43021,
       43115, 43231, 43437, 43466, 43468, 43539, 43546, 43547, 43548, 43549, 43550, 43552, 43556, 43557,
       43558, 43559, 43560, 43565, 43566, 43567, 43595, 43596, 43638, 43707, 43935, 44030, 44031, 44032,
       44033, 44045, 44057, 44062, 44109, 44229, 44231, 44235, 44259, 44332, 44364]

#print(len(IDs))
sites = [
    ['38.883056', '-77.017369'], ['29.557857', '-95.089023'], ['28.579680', '-80.653010'],
    ['55.912104', '37.810254'], ['45.963929', '63.305125'], ['45.521186', '-73.393632'],
    ['48.086873', '11.280641'], ['18.913628', '-155.682263'], ['5.224441', '-52.776433'],
    ['36.065140', '140.127613'], ['-72.002914', '2.525675'], ['-35.401565', '148.981433'],
    ['-25.890233', '27.685390'], ['64.753870', '-147.345851'], ['13.071199', '76.099593 ']
]

siteNames = [
    "NASA HQ (D.C.)", "NASA Mission Control Center", "Kennedy Space Center", "Moscow Mission Control Center",
     "Baikonur Cosmodrome (Kazakhstan)", "Canadian Space Center", "German Space Operation Center",
     "South Point Satellite Station (Hawai'i)", "Guiana Space Center", "Tsukuba Space Center (Japan)",
     "Troll Satellite Station (Antarctica)", "Canberra Deep Space Complex (Australia)",
     "KSAT Hartebeesthoek (South Africa)", "North Pole Satellite Station (Alaska)", "Master Control Facility (India)"
]

m = 60
hr = 12
a = datetime.utcnow() - timedelta(minutes = 1);
a = a.replace(second=0, microsecond=0)
dList = [a + timedelta(minutes=x) for x in range(0, (m*hr))]

# potential help to speed up calculations:
# https://github.com/skyfielders/python-skyfield/issues/30
# https://pyorbital.readthedocs.io/en/latest/
# https://github.com/skyfielders/python-skyfield/issues/188
# https://programmingforresearch.wordpress.com/2012/10/30/using-pyephem-to-get-the-ground-coordinates-of-a-satellite/
# https://www.reddit.com/r/Python/comments/9pl4bc/using_python_pyephem_and_opencv_to_track/

timeNow = datetime.utcnow()
def timeInfo():
    with open('time.txt', 'r') as f:
        timeOld = f.read()
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
        with open('time.txt', 'w') as f:
            f.write(str(timeOld))
        # norad_cat_id=[op.inclusive_range(1,36050)] instead of norad_cat_id=[25544, 42712], etc.
        data = st.tle_latest(norad_cat_id=IDs, ordinal=1, format='json')
        a = json.loads(data)
        a.sort(key=operator.itemgetter('OBJECT_NAME'))
        print("got new data")

        with open('spacecraft.txt', 'w') as f:
            for x in range(len(a)):
                craft = a[x]
                b = (craft['TLE_LINE0'] + '\n')[2:]
                f.write(b)
                b = craft['TLE_LINE1'] + '\n'
                f.write(b)
                b = craft['TLE_LINE2'] + '\n'
                f.write(b)



def readTLEfile(TLEfile):
    f=open(TLEfile)
    theList=f.read().split('\n')
    f.close()

    return theList


def comp():
    TLEs = readTLEfile("spacecraft.txt")
    numSats = int(len(TLEs) / 3.0)
    with open('satelliteData.csv', 'w') as f:
        f.write('name,')
        f.write('latitude,')
        f.write('longitude,')
        f.write('elevation,')
        f.write('year,')
        f.write('month,')
        f.write('day,')
        f.write('hour,')
        f.write('minute,')
        f.write('second,')
        for i in range(len(sites)):
            f.write('h' + str(i+1) + ',')
        f.write('\n')
        for i in range(int(numSats)):
            temp = []
            for j in range(3):
                temp.append(TLEs[i * 3 + j])
            sat = ephem.readtle(temp[0], temp[1], temp[2])

            for j in range(len(dList)):
                tt = dList[j]
                sat.compute(tt)
                #the following are needed to get the lat and lon in a format that can be written to a file
                lat = (float(repr(sat.sublat)) * 180 / math.pi)
                lon = (float(repr(sat.sublong)) * 180 / math.pi)
                distance = (sat.elevation / 1000)
                f.write(str(sat.name) + ',' + str(lat) + ',' + str(lon) + ',' + str(distance) + ',')
                f.write(str(tt.year) + ',' + str(tt.month) + ',' + str(tt.day) + ',' + str(tt.hour) + ',' + str(tt.minute) + ',')
                f.write(str(0) + ',')
                for k in sites:
                    obs = ephem.Observer()
                    obs.date = tt
                    #the following are to change the degrees latitude and longitude to radians
                    obs.lat = float(k[0])*math.pi/180
                    obs.lon = float(k[1])*math.pi/180
                    sat.compute(obs)
                    f.write(str((sat.alt > 0) * 1) + ',')
                f.write('\n')

def getSunData():
    greenwich = ephem.Observer()
    greenwich.lat = "0"
    greenwich.lon = "0"   
    sun = ephem.Sun(greenwich)
    with open('sun.csv', 'w') as f:
        f.write('lat,')
        f.write('lon,\n')
        for j in range(len(dList)):
            greenwich.date = dList[j]
            sun.compute(greenwich.date)
            sun_lon = math.degrees(sun.ra - greenwich.sidereal_time() )
            if sun_lon < -180.0 :
              sun_lon = 360.0 + sun_lon 
            elif sun_lon > 180.0 :
              sun_lon = sun_lon - 360.0
            sun_lat = math.degrees(sun.dec)
            f.write(str(sun_lat) + ',' + str(sun_lon) + '\n')
            
def writeGroundSites():
    with open("orbitLength.csv", 'w') as f:
        f.write("len,\n")
        f.write(str(m * hr))
    with open("groundData.csv", 'w') as f:
        f.write("name,lat,lon\n")
        for i in range(len(siteNames)):
            f.write(siteNames[i] + ',' + str(sites[i][0]) + ',' + str(sites[i][1]) + '\n')

if __name__ == '__main__':
    print("==== pyephem benchmarck ====")
    print(" ")   
    timeInfo()
    t0=datetime.utcnow()
    print("start calculation using pyephem:",t0)
    comp()
    getSunData()
    writeGroundSites()
    t1=datetime.utcnow()
    print("Calculation ended",t1)
    leph=t1-t0
    print(" ")
    print("\t\tLasting", leph)

# https://pypi.org/project/spacetrack/
# pip install spacetrack
from spacetrack import SpaceTrackClient
import spacetrack.operators as op
import ephem
import json
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import math

IDs = [11, 20, 22, 29, 46, 19822, 20580, 22049, 23191, 23439, 23560, 23715, 25492, 25544, 25791, 25989, 25994,
       27424, 27540, 27600, 27607, 30580, 30797, 31135, 32275, 32781, 33591, 33752, 36827, 37755, 37790, 37818,
       38771, 39026, 39034, 39075, 39084, 39088, 39444, 39768, 40019, 40069, 40296, 40482, 40719, 40878, 40889,
       41019, 41032, 41332, 41783, 41875, 42711, 42726, 42808, 42959, 42982, 43020, 43021,
       43115, 43231, 43437, 43466, 43468, 43539, 43546, 43547, 43548, 43549, 43550, 43552, 43556, 43557,
       43558, 43559, 43560, 43565, 43566, 43567, 43595, 43596, 43638, 43707, 43935, 44030, 44031, 44032,
       44033, 44045, 44057, 44062, 44109, 44229, 44231, 44235, 44259, 44332, 44364, 44374, 44420]

sites = [
    [29.557857, -95.089023], [48.086873, 11.280641], [18.913628, -155.682263], 
	[5.224441, -52.776433], [36.065140, 140.127613], [-72.002914, 2.525675], 
	[-35.401565, 148.981433], [64.753870, -147.345851], 
	[13.071199, 76.099593]
]

siteNames = [
    "NASA Mission Control Center", "German Space Operation Center",
     "South Point Satellite Station (Hawai'i)", "Guiana Space Center", 
	 "Tsukuba Space Center (Japan)", "Troll Satellite Station (Antarctica)",
	 "Canberra Deep Space Complex (Australia)",
	 "North Pole Satellite Station (Alaska)", "Master Control Facility (India)"
]

m = 60
hr = 12
a = datetime.utcnow() - timedelta(minutes = 1)
a = a.replace(second=0, microsecond=0)
dList = [a + timedelta(minutes=x) for x in range(0, (m*hr))]
    

def timeInfo(timeOld):
    timeNow = datetime.utcnow()

    # gets new data from space-track.org if it has been longer than a day
    # that TLE data has been requested
    if timeNow > timeOld:
        # TODO: validate username and password with spacetrack API
        user = input("spacetrack username: ")
        pd = input("password: ")
        st = SpaceTrackClient(user, pd)
        timeOld = datetime(timeNow.year, timeNow.month, timeNow.day, 0, 7, 35) + timedelta(days=1)
        timeOld += timedelta(seconds=.3333333)
        data = st.tle_latest(norad_cat_id=IDs, orderby='object_name', ordinal=1, format='json')
        d = a + relativedelta(months=+2)
        decay_epoch = op.inclusive_range(datetime(a.year, a.month, a.day),datetime(d.year, d.month, d.day))
        depr = st.decay(decay_epoch=decay_epoch, orderby='norad_cat_id', format='json')
        satData = json.loads(data)
        deprData = json.loads(depr)
        deprList = [x for x in deprData for y in satData if x['NORAD_CAT_ID'] == y['NORAD_CAT_ID']]
        print()
        print("got new data")
        for x in deprList:
            print('Spacecraft', x["OBJECT_NAME"], 'NORAD ID:', x['NORAD_CAT_ID'], 'will decay on', x['DECAY_EPOCH'])
            print('Please replace this spacecraft with a new spacecraft to avoid errors in calculating satellite orbits')
            print('A list of spacecraft that will decay in the next 60 days has been saved to decay.csv for your convenience')
            print()
        
        with open('static/data/decay.csv', 'w') as f:
            f.write('NORAD ID,OBJECT NAME\n')
            for x in deprData:
                f.write(x['NORAD_CAT_ID'] + ',' + x["OBJECT_NAME"] + '\n')

        with open('static/data/spacecraft.txt', 'w') as f:
            for x in range(len(satData)):
                craft = satData[x]
                b = craft['TLE_LINE0'][2:]
                if b == 'OBJECT A' or b == 'OBJECT AA':
                    b += ' (STARLINK)\n'
                elif b == 'OBJECT D':
                    b += ' (MICRODRAGON)\n'
                elif b == 'OBJECT F':
                    b += ' (MYSAT-1)\n'
                elif b == 'HST':
                    b = 'HUBBLE SPACE TELESCOPE\n'
                elif b == 'LIGHTSAIL':
                    b += ' 2\n'
                else:
                    b += '\n'  
                f.write(b)
                b = craft['TLE_LINE1'] + '\n'
                f.write(b)
                b = craft['TLE_LINE2'] + '\n'
                f.write(b)
    return timeOld



def readTLEfile(TLEfile):
    f=open(TLEfile)
    theList=f.read().split('\n')
    f.close()

    return theList


def comp(u):
    sites.insert(0, u)
    siteNames.insert(0, "Your Location")
    TLEs = readTLEfile("static/data/spacecraft.txt")
    numSats = int(len(TLEs) / 3.0)
    with open('static/data/satelliteData.csv', 'w') as f:
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
    with open('static/data/sun.csv', 'w') as f:
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
    with open("static/data/orbitLength.csv", 'w') as f:
        f.write("len,\n")
        f.write(str(m * hr))
    with open("static/data/groundData.csv", 'w') as f:
        f.write("name,lat,lon\n")
        for i in range(len(siteNames)):
            f.write(siteNames[i] + ',' + str(sites[i][0]) + ',' + str(sites[i][1]) + '\n')
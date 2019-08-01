# https://pypi.org/project/spacetrack/
# pip install spacetrack
from spacetrack import SpaceTrackClient
import spacetrack.operators as op
import ephem
import json
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import math
import csv

IDs = [11, 20, 22, 29, 46, 19822, 20580, 22049, 23191, 23439, 23560, 23715, 25492, 25544, 25791, 25989, 25994,
       27424, 27540, 27600, 27607, 30580, 30797, 31135, 32275, 32781, 33591, 33752, 36827, 37755, 37790, 37818,
       38771, 39026, 39034, 39075, 39084, 39088, 39444, 39768, 40019, 40069, 40296, 40482, 40719, 40878, 40889,
       41019, 41032, 41332, 41783, 41875, 42711, 42726, 42808, 42959, 42982, 43020, 43021,
       43115, 43231, 43437, 43466, 43468, 43539, 43546, 43547, 43548, 43549, 43550, 43552, 43556, 43557,
       43558, 43559, 43560, 43565, 43566, 43567, 43595, 43596, 43638, 43707, 43935, 44030, 44031, 44032,
       44033, 44045, 44057, 44062, 44109, 44229, 44231, 44235, 44259, 44332, 44364, 44374, 44420]

sites = [
    ["NASA Mission Control Center",[29.557857, -95.089023]],
    ["German Space Operation Center",[48.086873, 11.280641]], 
    ["South Point Satellite Station (Hawai'i)",[19.0, -155.65]], 
	["Guiana Space Center",[5.224441, -52.776433]],
    ["Tsukuba Space Center (Japan)",[36.065140, 140.127613]], 
    ["Troll Satellite Station (Antarctica)",[-72.002914, 2.525675]], 
	["Canberra Deep Space Complex (Australia)",[-35.401565, 148.981433]],
    ["North Pole Satellite Station (Alaska)",[64.753870, -147.345851]], 
	["Master Control Facility (India)", [13.071199, 76.099593]]
]

m = 60
hr = 12
    

def timeInfo(timeNow, timeOld):
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
        timeNow = timeNow.replace(second=0, microsecond=0)
        d = timeNow + relativedelta(months=+2)
        decay_epoch = op.inclusive_range(datetime(timeNow.year, timeNow.month, timeNow.day),datetime(d.year, d.month, d.day))
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
        with open('static/data/timestamp.txt', 'w') as f:
            f.write(str(timeOld))
            
def getSunData(dList):
    greenwich = ephem.Observer()
    greenwich.lat = "0"
    greenwich.lon = "0"   
    sun = ephem.Sun(greenwich)
    sunList = []
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
            sunList.append([sun_lat,sun_lon])
    return sunList
            
def writeGroundSites():
    with open("static/data/orbitLength.csv", 'w') as f:
        f.write("len,\n")
        f.write(str(m * hr))
    with open("static/data/groundData.csv", 'w') as f:
        f.write("name,lat,lon\n")
        for i in range(len(sites)):
            f.write(sites[i][0] + ',' + str(sites[i][1][0]) + ',' + str(sites[i][1][1]) + '\n')



def readTLEfile(TLEfile):
    f=open(TLEfile)
    theList=f.read().split('\n')
    f.close()

    return theList


def comp(loc, update):
    writeGroundSites()
    jData = {}
    satKeys = []
    dlist = None
    dateArr = []
    sitesList = [["Your Location", loc]]
    TLEs = readTLEfile("static/data/spacecraft.txt")
    numSats = int(len(TLEs) / 3.0)
    sitesList.extend(sites)
    if update:
        with open('static/data/satelliteData.csv', 'w') as f:
            a = datetime.utcnow() - timedelta(minutes = 1)
            a = a.replace(second=0, microsecond=0)
            dList = [a + timedelta(minutes=x) for x in range(0, (m*hr))]
            sunData = getSunData(dList)
            jData['numSats'] = numSats
            jData["sun"] = sunData   
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
    with open('static/data/satelliteData.csv', 'a') as f:
        for i in range(int(numSats)):
            spacecraft = {}
            horizon = []
            tempHorizon = []
            tleData = []
            for j in range(3):
                tleData.append(TLEs[i * 3 + j])
            sat = ephem.readtle(tleData[0], tleData[1], tleData[2])
            satKeys.append(sat.name)
            if update:
                pos = []
                jData['update'] = "true"
                for j in range(len(dList)):
                    tt = dList[j]
                    if i == 0 and j == 0:
                        dateArr.append(tt.year)
                        dateArr.append(tt.month)
                        dateArr.append(tt.day)
                        dateArr.append(tt.hour)
                        dateArr.append(tt.minute)
                        dateArr.append(tt.second)
                        jData['time'] = dateArr
                    sat.compute(tt)
                    #the following are needed to get the lat and lon in a format that can be written to a file
                    lat = (float(repr(sat.sublat)) * 180 / math.pi)
                    lon = (float(repr(sat.sublong)) * 180 / math.pi)
                    distance = (sat.elevation / 1000)
                    pos.append([lat,lon,distance])
                    f.write(str(sat.name) + ',' + str(lat) + ',' + str(lon) + ',' + str(distance) + ',')
                    f.write(str(tt.year) + ',' + str(tt.month) + ',' + str(tt.day) + ',' + str(tt.hour) + ',' + str(tt.minute) + ',')
                    f.write(str(0) + ',')
                    for l,k in enumerate(sitesList):
                        obs = ephem.Observer()
                        obs.date = tt
                        #the following are to change the degrees latitude and longitude to radians
                        obs.lat = float(k[1][0])*math.pi/180
                        obs.lon = float(k[1][1])*math.pi/180
                        sat.compute(obs)
                        if j == 0:
                            tempHorizon.append([])
                        tempHorizon[l].append(((sat.alt > 0) * 1))
                        if k[0] != "Your Location":
                            f.write(str((sat.alt > 0) * 1) + ',')
                        #append sat name with sat horizon data to JSON might want to switch for loop for dList and
                        #for loop for sitesList
                    f.write('\n')
                spacecraft["pos"] = pos
                for n, name in enumerate(sitesList):
                    horizon.append([[(sitesList[n][0])],tempHorizon[n]])
                spacecraft["horizon"] = horizon
                jData[sat.name] = spacecraft
            else:
                """essentially only used if it has been less than six hours from when the app is started
                that data has been calculated. This just grabs the above/below horizon data for the user's
                location and sends it back. This should cut down on calculation time so the screen isn't
                loading for quite so long each time. This situation should only come up when a user
                is using a local copy of the app and they have had it turned off for longer than 6 hours.
                Otherwise, the app will recalculate every 6 hours while it is running."""
                with open('static/data/satelliteData.csv', 'r') as f:
                    reader = csv.reader(f)
                    header = next(reader)
                    row = next(reader)
                    b = datetime(int(row[4]), int(row[5]), int(row[6]), int(row[7]), int(row[8]), int(row[9]))
                    dList = [b + timedelta(minutes=x) for x in range(0, (m*hr))]
                jData['update'] = "false"
                for j in range(len(dList)):
                    tt = dList[j]
                    k=sitesList[0]
                    obs = ephem.Observer()
                    obs.date = tt
                    #the following are to change the degrees latitude and longitude to radians
                    obs.lat = float(k[1][0])*math.pi/180
                    obs.lon = float(k[1][1])*math.pi/180
                    sat.compute(obs)
                    tempHorizon.append(((sat.alt > 0) * 1))
                jData[sat.name] = tempHorizon
        jData["OP"] = m*hr
        jData["satKeys"] = satKeys
        jData["sites"] = sitesList
    return jData
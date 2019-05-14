# https://pypi.org/project/spacetrack/
# pip install spacetrack
from spacetrack import SpaceTrackClient
import spacetrack.operators as op
from numpy import diff
# pip install skyfield    https://rhodesmill.org/skyfield/
from skyfield.api import Topos, load
import json
# https://pynative.com/python-mysql-database-connection/    https://pynative.com/install-mysql-connector-python/
# pip install mysql-connector-python
#import mysql.connector
from datetime import datetime, timedelta
from pytz import timezone

"""
#get TLE information from CelesTrak
stations_url = 'http://celestrak.com/NORAD/elements/stations.txt'
satellites = load.tle(stations_url)
#for the following line, ISS, ZARYA, or ISS (ZARYA) can be used. Some spacecraft have multiple keys (names) that can be used
satellite = satellites['ISS (ZARYA)']
print(satellite)
"""
spacecraftNames=[]  #list of spacecraft keys to get TLE values

timeNow = datetime.now()
fl = 'time.txt'
with open(fl, 'r') as file:
   timeOld = file.read()
   timeOld = datetime.strptime(timeOld, '%Y-%m-%d %H:%M:%S.%f')
   
#gets new data from space-track.org if it has been longer than a day
#that TLE data has been requested
if timeNow > timeOld:
   timeOld = datetime(timeNow.year, timeNow.month, timeNow.day, 0, 7, 35) + timedelta(days = 1)
   timeOld += timedelta(seconds=.3333333)
   with open(fl, 'w') as file:
      file.write(str(timeOld))
	  
   #TODO: validate username and password with spacetrack API
   user = input("spacetrack username: ")
   pd = input("password: ")
   st = SpaceTrackClient(user, pd)
   # norad_cat_id=[op.inclusive_range(1,36050)] instead of norad_cat_id=[25544, 42712], etc.
   data = st.tle_latest(norad_cat_id=[25544, 42712], ordinal=1, format='json')
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

#loads a dictionary of spacecraft TLEs and other relevant information
satellites = load.tle(fl)
#grabs a spacecraft by its name from the dictionary, removing the \n
#character at the end of the spacecraftNames string
satellite = satellites[spacecraftNames[0][:-1]]
ts = load.timescale()
t = ts.now()

#specifies the ground site latitude, longitude and elevation
ground = Topos('41.72 N', '-111.82 E', None, None, 1403)
difference = satellite - ground
topocentric = difference.at(t)
#the following five lines were an experiment to test whether the
#spacecraft was currently above the horizon of the ground site or not
alt, az, distance = topocentric.altaz()
if alt.degrees > 0:
   print(spacecraftNames[0][:-1], 'is above the horizon')
else:
   print(spacecraftNames[0][:-1], 'is not above the horizon')

# https://rhodesmill.org/brandon/2018/tiangong/
#creates a list of every minute for the next 24 hours
minutes = range(60 * 24)
d = timeNow.utcnow()
#creates a list of times for each minute of the above minutes list
t = ts.utc(d.year, d.month, d.day, d.hour + (d.minute/60), minutes)
mountain = timezone('US/Mountain')
beginning = datetime.now()
#gets the spacecraft position at time t, which is a list in this case
geocentric = satellite.at(t)
#gets the longitude latitude of the point on the earth below the spacecraft,
#and the spacecraft's elevation above the earth at time t
subpoint = geocentric.subpoint()
lat = subpoint.latitude.degrees
long = subpoint.longitude.degrees
el =  subpoint.elevation.km
#calculates the positions of the spacecraft during the list of times in t
#to get an orbit
orbit = (satellite - ground).at(t)
alt, az, dist = orbit.altaz()
above_horizon = alt.degrees > 0

#gets data about the spacecraft and its orbit and writes it to a csv file
fl = "position.csv"
with open(fl, 'w') as file:
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
   for i in range(len(lat)):
      file.write(str(lat[i])+ ',') 
      file.write(str(long[i])+ ',')
      file.write(str(el[i])+',')
      temp = str(t[i].utc)[1:-1]
      file.write(temp+',')
      file.write(str(int(above_horizon[i])))
      file.write(',\n')
ending = datetime.now()
print(alt, 'calculated in', ending-beginning, 'seconds')
input()

#tells when the spacecraft rises above the viewer's horizon, and when
#the satellite dips below the horizon
"""def plot_sky(pass_indices):
   i, j = pass_indices
   print('Rises:', t[i].astimezone(mountain))
   print('Sets:', t[j].astimezone(mountain))
   
boundaries, = diff(above_horizon).nonzero()
passes = boundaries.reshape(len(boundaries) // 2, 2)
print(passes)
for g in range(5):
   plot_sky(passes[g])"""
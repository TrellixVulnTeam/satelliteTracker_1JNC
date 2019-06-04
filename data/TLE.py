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
from pytz import timezone
import collections




# get TLE information from CelesTrakstations_url = 'http://celestrak.com/NORAD/elements/stations.txt'
"""satellites = load.tle(stations_url)
# for the following line, ISS, ZARYA, or ISS (ZARYA) can be used. Some spacecraft have multiple keys (names) that can be used
satellite = satellites['ISS (ZARYA)']"""

spacecraftNames = []  # list of spacecraft keys to get TLE values
IDs = [11, 20, 22, 29, 46, 19822, 20580, 22049, 23191, 23439, 23560, 23715, 25492, 25544, 25989, 25994, 
27424, 27540, 27600, 27607, 30580, 30797, 31135, 32781, 33401, 33591, 33752, 36827, 37755, 37790, 37818, 
38771, 39026, 39034, 39075, 39084, 39088, 39444, 39768, 40019, 40069, 40296, 40482, 40719, 40878, 40889, 
41019, 41032, 41332, 41765, 41783, 41834, 41875, 42711, 42722, 42726, 42808, 42959, 42982, 43020, 43021, 
43115, 43231, 43437, 43466, 43468, 43472, 43539, 43546, 43547, 43548, 43549, 43550, 43552, 43556, 43557, 
43558, 43559, 43560, 43561, 43565, 43566, 43567, 43595, 43596, 43638, 43707, 43935, 44030, 44031, 44032, 
44033, 44045, 44057, 44062, 44109, 44229, 44231, 44235, 44259]

groundSites = {"NASA HQ (D.C.)": Topos('38.883056 N', '-77.017369 E'), "NASA Mission Control Center": Topos('29.557857 N', '-95.089023 E'),
"Kennedy Space Center": Topos('28.579680 N', '-80.653010 E'), "Moscow Mission Control Center": Topos('55.912104 N', '37.810254 E'),
"Baikonur Cosmodrome (Kazakhstan)": Topos('45.963929 N', '63.305125 E'), "Canadian Space Center": Topos('45.521186 N', '-73.393632 E'),
"German Space Operation Center": Topos('48.086873 N', '11.280641 E'), "BIOTESC (Zurich)": Topos('46.994580 N', '8.310018 E'),
"Guiana Space Center": Topos('5.224441 N', '-52.776433 E'), "Tsukuba Space Center (Japan)": Topos('36.065140 N', '140.127613 E')}
horizonData = []


print(groundSites["NASA HQ (D.C.)"].latitude.degrees)
print(groundSites["NASA HQ (D.C.)"].longitude.degrees)

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
	spacecraftNames.sort()
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

fl = "groundData.csv"
f = open(fl, "w+")
f.close()
with open(fl, 'a') as file:
	file.write('name,')
	file.write('lat,')
	file.write('lon,\n')
for site in groundSites:
	with open(fl, 'a') as file:
		file.write(site + ',')
		file.write(str(groundSites[site].latitude.degrees) + ',')
		file.write(str(groundSites[site].longitude.degrees) + ',')
		file.write('\n')

fl = "satelliteData.csv"
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
	for i in range(len(groundSites)):
		a = i+1;
		file.write('h'+str(a) + ',')
	file.write('\n')
ts = load.timescale()
# creates a list of every minute for the next 24 hours
minutes = range(60*24)
# creates a list of times for each minute of the above minutes list
t = ts.utc(d.year, d.month, d.day, d.hour + (d.minute / 60), minutes)
mountain = timezone('US/Mountain')
for craft in spacecraftNames:
	# grabs a spacecraft by its name from the dictionary, removing the \n
	# character at the end of the spacecraftNames string
	satellite = satellites[craft[:-1]]
	print(craft[:-1])
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
	for i in groundSites:
		orbit = (satellite - groundSites[i]).at(t)
		alt, az, dist = orbit.altaz()
		horizonData.append(np.array(alt.degrees > 0))

	# gets data about the spacecraft and its orbit and writes it to a csv file
	with open(fl, 'a') as file:
		for i in range(len(lat)):
			file.write(craft[:-1] + ',')
			file.write(str(lat[i]) + ',')
			file.write(str(long[i]) + ',')
			file.write(str(el[i]) + ',')
			temp = str(t[i].utc)[1:-1]
			file.write(temp + ',')
			for j in range(len(groundSites)):
				file.write(str(int(horizonData[j][i])) + ',')
			file.write(',\n')
	ending = datetime.now()
	#print(alt, 'calculated in', ending - beginning, 'seconds')
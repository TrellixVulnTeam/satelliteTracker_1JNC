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

# TODO: add a < while True: > loop to the program that checks for the times when the satellite data
#be updated. It will need to check right after we pass hour = 0, minute = 7 and second = 36 to grab
#all new data from space-track, and then again when hour = 12, minute = 7 and second = 36 to
#recalculate a 24 hour orbit prediction with the data already grabbed from space-track


#either use numba or numpy vectorization
#https://towardsdatascience.com/speed-up-your-algorithms-part-2-numba-293e554c5cc1


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

groundSites = {
"NASA HQ (D.C.)": Topos('38.883056 N', '-77.017369 E'), "NASA Mission Control Center": Topos('29.557857 N', '-95.089023 E'),
"Kennedy Space Center": Topos('28.579680 N', '-80.653010 E'), "Moscow Mission Control Center": Topos('55.912104 N', '37.810254 E'),
"Baikonur Cosmodrome (Kazakhstan)": Topos('45.963929 N', '63.305125 E'), "Canadian Space Center": Topos('45.521186 N', '-73.393632 E'),
"German Space Operation Center": Topos('48.086873 N', '11.280641 E'), "South Point Satellite Station (Hawai'i)": Topos('18.913628 N', '-155.682263 E'),
"Guiana Space Center": Topos('5.224441 N', '-52.776433 E'), "Tsukuba Space Center (Japan)": Topos('36.065140 N', '140.127613 E'),
"Troll Satellite Station (Antarctica)": Topos('-72.002914 N', '2.525675 E'), 
"Canberra Deep Space Complex (Australia)": Topos('-35.401565 N', '148.981433 E'), 
"KSAT Hartebeesthoek (South Africa)": Topos('-25.890233 N', '27.685390 E'),
"North Pole Satellite Station (Alaska)": Topos('64.753870 N', '-147.345851 E'),
"Master Control Facility (India)": Topos('13.071199 N', '76.099593 E')
}
horizonData = []

#potential help to speed up calculations: 
#https://github.com/skyfielders/python-skyfield/issues/30
#https://pyorbital.readthedocs.io/en/latest/
#https://github.com/skyfielders/python-skyfield/issues/188
#https://programmingforresearch.wordpress.com/2012/10/30/using-pyephem-to-get-the-ground-coordinates-of-a-satellite/
#https://www.reddit.com/r/Python/comments/9pl4bc/using_python_pyephem_and_opencv_to_track/

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
	file.write('lon,')
	file.write('lenlen\n')
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
	file.write('h1,')
	file.write('h2,')
	file.write('h3,')
	file.write('h4,')
	file.write('h5,')
	file.write('h6,')
	file.write('h7,')
	file.write('h8,')
	file.write('h9,')
	file.write('h10,')
	file.write('h11,')
	file.write('h12,')
	file.write('h13,')
	file.write('h14,')
	file.write('h15,\n')
ts = load.timescale()

ground = Topos('38.883056 N', '-77.017369 E')
ground2 = Topos('29.557857 N', '-95.089023 E')
ground3 = Topos('28.579680 N', '-80.653010 E')
ground4 = Topos('55.912104 N', '37.810254 E')
ground5 = Topos('45.963929 N', '63.305125 E')
ground6 = Topos('45.521186 N', '-73.393632 E')
ground7 = Topos('48.086873 N', '11.280641 E')
ground8 = Topos('18.913628 N', '-155.682263 E')
ground9 = Topos('5.224441 N', '-52.776433 E')
ground10 = Topos('36.065140 N', '140.127613 E')
ground11 = Topos('-72.002914 N', '2.525675 E')
ground12 = Topos('-35.401565 N', '148.981433 E')
ground13 = Topos('-25.890233 N', '27.685390 E')
ground14 = Topos('64.8 N', '-147.65 E')
ground15 = Topos('13.071199 N', '76.099593 E')
# creates a list of every minute for the next 24 hours
m = 60
hr = 24
fl = "orbitLength.csv"
with open(fl, 'w') as file:
	file.write("len,\n")
	file.write(str(m*hr))
minutes = range(m*hr)
fl = "satelliteData.csv"
# creates a list of times for each minute of the above minutes list
t = ts.utc(d.year, d.month, d.day, d.hour + (d.minute / 60), minutes)
mountain = timezone('US/Mountain')
for craft in spacecraftNames:
	# grabs a spacecraft by its name from the dictionary, removing the \n
	# character at the end of the spacecraftNames string
	satellite = satellites[craft[:-1]]
	print(craft[:-1])
	# https://rhodesmill.org/brandon/2018/tiangong/


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
	orbit3 = (satellite - ground3).at(t)
	orbit4 = (satellite - ground4).at(t)
	orbit5 = (satellite - ground5).at(t)
	orbit6 = (satellite - ground6).at(t)
	orbit7 = (satellite - ground7).at(t)
	orbit8 = (satellite - ground8).at(t)
	orbit9 = (satellite - ground9).at(t)
	orbit10 = (satellite - ground10).at(t)
	orbit11 = (satellite - ground11).at(t)
	orbit12 = (satellite - ground12).at(t)
	orbit13 = (satellite - ground13).at(t)
	orbit14 = (satellite - ground14).at(t)
	orbit15 = (satellite - ground15).at(t)
	alt, az, dist = orbit.altaz()
	alt2, az2, dist2 = orbit2.altaz()
	alt3, az3, dist3 = orbit3.altaz()
	alt4, az4, dist4 = orbit4.altaz()
	alt5, az5, dist5 = orbit5.altaz()
	alt6, az6, dist6 = orbit6.altaz()
	alt7, az7, dist7 = orbit7.altaz()
	alt8, az8, dist8 = orbit8.altaz()
	alt9, az9, dist9 = orbit9.altaz()
	alt10, az10, dist10 = orbit10.altaz()
	alt11, az11, dist11 = orbit11.altaz()
	alt12, az12, dist12 = orbit12.altaz()
	alt13, az13, dist13 = orbit13.altaz()
	alt14, az14, dist14 = orbit14.altaz()
	alt15, az15, dist15 = orbit15.altaz()
	above_horizon1 = np.array(alt.degrees > 0)
	above_horizon2 = np.array(alt2.degrees > 0)
	above_horizon3 = np.array(alt3.degrees > 0)
	above_horizon4 = np.array(alt4.degrees > 0)
	above_horizon5 = np.array(alt5.degrees > 0)
	above_horizon6 = np.array(alt6.degrees > 0)
	above_horizon7 = np.array(alt7.degrees > 0)
	above_horizon8 = np.array(alt8.degrees > 0)
	above_horizon9 = np.array(alt9.degrees > 0)
	above_horizon10 = np.array(alt10.degrees > 0)
	above_horizon11 = np.array(alt11.degrees > 0)
	above_horizon12 = np.array(alt12.degrees > 0)
	above_horizon13 = np.array(alt13.degrees > 0)
	above_horizon14 = np.array(alt14.degrees > 0)
	above_horizon15 = np.array(alt15.degrees > 0)

	# gets data about the spacecraft and its orbit and writes it to a csv file
	with open(fl, 'a') as file:
		for i in range(len(lat)):
			file.write(craft[:-1] + ',')
			file.write(str(lat[i]) + ',')
			file.write(str(long[i]) + ',')
			file.write(str(el[i]) + ',')
			temp = str(t[i].utc)[1:-1]
			file.write(temp + ',')
			file.write(str(int(above_horizon1[i])) + ',')
			file.write(str(int(above_horizon2[i])) + ',')
			file.write(str(int(above_horizon3[i])) + ',')
			file.write(str(int(above_horizon4[i])) + ',')
			file.write(str(int(above_horizon5[i])) + ',')
			file.write(str(int(above_horizon6[i])) + ',')
			file.write(str(int(above_horizon7[i])) + ',')
			file.write(str(int(above_horizon8[i])) + ',')
			file.write(str(int(above_horizon9[i])) + ',')
			file.write(str(int(above_horizon10[i])) + ',')
			file.write(str(int(above_horizon11[i])) + ',')
			file.write(str(int(above_horizon12[i])) + ',')
			file.write(str(int(above_horizon13[i])) + ',')
			file.write(str(int(above_horizon14[i])) + ',')
			file.write(str(int(above_horizon15[i])) + ',')
			file.write('\n')

planets = load('de421.bsp')
earth, sun, moon = planets['earth'], planets['sun'], planets['moon']
point = earth + Topos('90 N', '0 E', None, None, -6378136)
fl = 'sun.csv'
with open(fl, 'w') as file:
	file.write('lat,')
	file.write('lon,\n')
	for tTime in t:
		alt, az, dis = point.at(tTime).observe(sun).apparent().altaz()
		az = 180-az.degrees
		file.write(str(alt.degrees) + ',')
		file.write(str(az) + ',\n')
# https://pypi.org/project/spacetrack/
# pip install spacetrack
from spacetrack import SpaceTrackClient
import ephem
import json, operator
from datetime import datetime, timedelta
import math

IDs = [11, 20, 22, 29, 46, 19822, 20580, 22049, 23191, 23439, 23560, 23715, 25492, 25544, 25989, 25994,
       27424, 27540, 27600, 27607, 30580, 30797, 31135, 32275, 32781, 33591, 33752, 36827, 37755, 37790, 37818,
       38771, 39026, 39034, 39075, 39084, 39088, 39444, 39768, 40019, 40069, 40296, 40482, 40719, 40878, 40889,
       41019, 41032, 41332, 41765, 41783, 41834, 41875, 42711, 42722, 42726, 42808, 42959, 42982, 43020, 43021,
       43115, 43231, 43437, 43466, 43468, 43539, 43546, 43547, 43548, 43549, 43550, 43552, 43556, 43557,
       43558, 43559, 43560, 43565, 43566, 43567, 43595, 43596, 43638, 43707, 43935, 44030, 44031, 44032,
       44033, 44045, 44057, 44062, 44109, 44229, 44231, 44235, 44259, 44332, 44364]

IDs2 = [11,20,22,29,46,503,573,737,746,829,1360,2514,3173,3174,3825,6192,6916,7276,7376,7530,7625,7780,8195,8601
,9495,9829,9880,9931,9941,10059,10150,10455,10637,10703,10925,10970,11057,11080,11158,11261,11417,11509,11635,
11715,11871,11896,12032,12078,12093,12156,12295,12303,12376,12546,12624,12627,12818,12933,12997,12998,12999,13000,
13001,13002,13011,13012,13070,13080,13124,13205,13295,13367,13777,13875,13890,13912,13969,14129,14182,14670,14780,
14781,14790,14884,15095,15199,15214,15267,15350,15354,15429,15738,15827,15952,16064,16103,16183,16393,16527,16614,
16849,16909,16993,17078,17213,17328,18103,18129,18701,18881,18946,19548,19554,19608,19807,19822,19883,20169,20322,
20330,20437,20438,20439,20440,20441,20442,20480,20536,20580,20596,20707,20712,21087,21089,21118,21196,21426,21575,
21639,21706,21833,22049,22076,22077,22178,22238,22314,22321,22594,22654,22671,22825,22826,22828,22829,22949,22979,
22996,23125,23126,23191,23194,23230,23420,23439,23560,23613,23642,23715,23802,24278,24282,24285,24286,24292,24293,
24720,24761,24793,24795,24796,24800,24836,24841,24842,24870,24871,24873,24883,24903,24907,24944,24946,24948,24960,
24967,25023,25024,25025,25042,25043,25068,25077,25078,25104,25105,25175,25262,25263,25273,25286,25319,25320,25327,
25344,25396,25397,25467,25485,25492,25503,25509,25520,25527,25544,25635,25636,25661,25682,25693,25727,25756,25757,
25758,25791,25847,25867,25949,25989,25994,26038,26042,26106,26113,26388,26410,26411,26463,26464,26476,26495,26536,
26548,26554,26608,26609,26610,26611,26639,26898,26931,26932,27367,27368,27376,27389,27424,27450,27540,27566,27600,
27605,27607,27844,27848,27939,28375,28382,28500,28544,28545,28650,28895,29260,29668,30580,30797,30798,31135,32275,
32781,32785,32787,32789,32791,32953,33493,33498,33499,33591,33751,33752,35008,35932,35933,35934,35935,36122,36827,
37170,37206,37212,37398,37755,37790,37818,37839,37841,37854,37855,38752,38753,38771,38995,39026,39034,39070,39075,
39084,39088,39444,39768,40019,40069,40296,40482,40483,40484,40485,40719,40878,40889,41019,41032,41332,41765,41783,
41834,41875,41896,41917,41918,41919,41920,41921,41922,41923,41924,41925,41926,42711,42719,42722,42726,42803,42804,
42805,42806,42807,42808,42808,42809,42810,42811,42812,42955,42956,42957,42958,42959,42959,42960,42961,42962,42963,
42964,42982,43020,43021,43070,43071,43072,43073,43074,43075,43076,43077,43078,43079,43115,43229,43231,43249,43250,
43251,43252,43253,43254,43255,43256,43257,43258,43437,43466,43468,43478,43479,43480,43481,43482,43539,43546,43547,
43548,43549,43550,43552,43556,43557,43558,43559,43560,43565,43566,43567,43569,43570,43571,43572,43573,43574,43575,
43576,43577,43578,43595,43596,43638,43707,43922,43923,43924,43925,43926,43927,43928,43929,43930,43931,43935,44030,
44031,44032,44033,44045,44057,44062,44109,44229,44231,44235,44259,44332,44334,44364]

sites = [
    ['29.557857', '-95.089023'], ['48.086873', '11.280641'], ['18.913628', '-155.682263'], 
	['5.224441', '-52.776433'], ['36.065140', '140.127613'], ['-72.002914', '2.525675'], 
	['-35.401565', '148.981433'], ['-25.890233', '27.685390'], ['64.753870', '-147.345851'], 
	['13.071199', '76.099593 ']
]

siteNames = [
    "NASA Mission Control Center", "German Space Operation Center",
     "South Point Satellite Station (Hawai'i)", "Guiana Space Center", 
	 "Tsukuba Space Center (Japan)", "Troll Satellite Station (Antarctica)",
	 "Canberra Deep Space Complex (Australia)", "KSAT Hartebeesthoek (South Africa)", 
	 "North Pole Satellite Station (Alaska)", "Master Control Facility (India)"
]

m = 60
hr = 12
a = datetime.utcnow() - timedelta(minutes = 1);
a = a.replace(second=0, microsecond=0)
dList = [a + timedelta(minutes=x) for x in range(0, (m*hr))]


def timeInfo():
    timeNow = datetime.utcnow()
    with open('static/data/time.txt', 'r') as f:
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
        with open('static/data/time.txt', 'w') as f:
            f.write(str(timeOld))
        # norad_cat_id=[op.inclusive_range(1,36050)] instead of norad_cat_id=[25544, 42712], etc.
        data = st.tle_latest(norad_cat_id=IDs2, ordinal=1, format='json')
        a = json.loads(data)
        a.sort(key=operator.itemgetter('OBJECT_NAME'))
        print("got new data")

        with open('static/data/spacecraft.txt', 'w') as f:
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


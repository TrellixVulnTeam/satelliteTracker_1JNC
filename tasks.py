import TLE
from datetime import datetime, timedelta

timeNow = datetime.utcnow()
with open('static/data/timestamp.txt', 'r') as f:
    timeOld = f.read().split('\n')
    timeOld[0] = datetime.strptime(timeOld[0], '%Y-%m-%d %H:%M:%S.%f')
    timeOld[1] = datetime.strptime(timeOld[1], '%Y-%m-%d %H:%M:%S.%f')
timeOld[1] += timedelta(hours=10)
if timeNow > timeOld[1]:
    timeOld = TLE.timeInfo(timeOld[0])
    TLE.comp()
    TLE.getSunData()
    TLE.writeGroundSites()
    with open('static/data/timestamp.txt', 'w') as f:
        f.write(str(timeOld)+'\n')
        f.write(str(timeNow))
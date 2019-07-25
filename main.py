from flask import Flask, render_template
import TLE
from datetime import datetime, timedelta
import sqlalchemy
import geoip2.database
from requests import get

app = Flask(__name__)

@app.route('/', methods=['GET', 'POST'])
def index():
    return render_template('index.html')

if __name__ == '__main__':
    ip = get('https://api.ipify.org').text
    reader = geoip2.database.Reader('./GeoLite2/GeoLite2-City.mmdb')
    response = reader.city(ip)
    uLoc = [response.location.latitude, response.location.longitude]
    timeNow = datetime.utcnow()
    with open('static/data/timestamp.txt', 'r') as f:
        timeOld = f.read().split('\n')
        timeOld[0] = datetime.strptime(timeOld[0], '%Y-%m-%d %H:%M:%S.%f')
        timeOld[1] = datetime.strptime(timeOld[1], '%Y-%m-%d %H:%M:%S.%f')
    timeOld[1] += timedelta(hours=10)
    if timeNow > timeOld[1]:
        timeOld = TLE.timeInfo(timeOld[0])
        
        TLE.comp(uLoc)
        TLE.getSunData()
        TLE.writeGroundSites()
        with open('static/data/timestamp.txt', 'w') as f:
            f.write(str(timeOld)+'\n')
            f.write(str(timeNow))
    app.run()
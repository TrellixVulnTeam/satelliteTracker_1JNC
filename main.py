from flask import Flask, render_template, request
import TLE
from datetime import datetime, timedelta


app = Flask(__name__)

@app.route('/', methods=['GET', 'POST'])
def index():
    return render_template('index.html')
    
@app.route('/comm', methods=['POST'])
def info():
    latLon = request.get_json()
    location = []
    location.append(latLon['latitude'])
    location.append(latLon['longitude'])
    print(latLon)
    return 'OK', 200

if __name__ == '__main__':
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
    app.run()
from flask import Flask, render_template, request
import TLE
from datetime import datetime, timedelta

ST = []
access = None

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')
    
@app.route('/comm', methods=['POST'])
def info():
    global refresh
    latLon = request.get_json()
    location = []
    location.append(latLon['latitude'])
    location.append(latLon['longitude'])
    timeNow = datetime.utcnow()
    with open('static/data/timestamp.txt', 'r') as f:
        timeOld = f.read().split('\n')
        timeOld[0] = datetime.strptime(timeOld[0], '%Y-%m-%d %H:%M:%S.%f')
        timeOld[1] = datetime.strptime(timeOld[1], '%Y-%m-%d %H:%M:%S.%f')
    TLE.timeInfo(timeNow, timeOld[0], ST)
    if timeNow < timeOld[1]:
        jData = TLE.comp(location, None)
    else:
        jData = TLE.comp(location, timeOld[1])
    return jData, 200

@app.route('/access', methods=['POST'])
def access():
    return access, 200

if __name__ == '__main__':
    print("This application requires that you have a free account with both space-track.org and ipstack.com")
    print("If you do not already have an account with either of these tools, please create one now.")
    ST.append(input("Space-Track username: "))
    ST.append(input("Space-Track password: "))
    access = input("ipstack access key: ")
    app.run()
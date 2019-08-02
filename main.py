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
    latLon = request.get_json()
    location = []
    location.append(latLon['latitude'])
    location.append(latLon['longitude'])
    timeNow = datetime.utcnow()
    with open('static/data/timestamp.txt', 'r') as f:
        timeOld = f.read()
        timeOld = datetime.strptime(timeOld, '%Y-%m-%d %H:%M:%S.%f')
    TLE.timeInfo(timeNow, timeOld, ST)
    if latLon["runRecently"] != "false":
        jData = TLE.comp(location, False)
    else:
        jData = TLE.comp(location, True)
    return jData, 200

@app.route('/access', methods=['POST'])
def access():
    return "hello", 200

if __name__ == '__main__':
    print("This application requires that you have a free account with both space-track.org and ipstack.com")
    print("If you do not already have an account with either of these tools, please create one now.")
    ST.append(input("Space-Track username: "))
    ST.append(input("Space-Track password: "))
    app.run()
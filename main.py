from flask import Flask, render_template, request
import TLE
from datetime import datetime, timedelta

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
    TLE.timeInfo(timeNow, timeOld)
    if latLon['run'] != "false":
        jData = TLE.comp(location, False)
    else:
        jData = TLE.comp(location, True)
    return jData, 200

if __name__ == '__main__':
    app.run()
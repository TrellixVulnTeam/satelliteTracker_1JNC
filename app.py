from flask import Flask, render_template
import TLE

app = Flask(__name__)

@app.route('/', methods=['GET', 'POST'])
def index():
    return render_template('index.html')

if __name__ == '__main__':
    TLE.timeInfo()
    TLE.comp()
    TLE.getSunData()
    TLE.writeGroundSites()
    app.run()

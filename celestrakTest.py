import requests

txt = requests.get("http://celestrak.com/NORAD/elements/stations.txt").text
with open("test.txt", 'w') as f:
    f.write(txt)
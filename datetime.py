#print ("Content-Disposition: attachment; filename=weather_data.csv\r\n\r\n")

print ("Content-type: text/html\r\n\r\n")
print("<html>")
print("<head>")
print("<title>Weather Data</title>")
print("</head>")
print("<body>")
print("<p>File is now downloading...</p>")

import cgi
import psycopg2
import csv

#connection to the database
conn = psycopg2.connect("host=localhost dbname=oceanMapping user=postgres password=admin")
cur = conn.cursor()

#getting the form
form = cgi.FieldStorage()

#getting time query
startdate= form.getvalue('startdate');
enddate= form.getvalue('enddateinput');
starttime = form.getvalue('starttime')
endtime = form.getvalue('endtime')

timestamp1=startdate+' '+starttime+':00'
timestamp2=enddate+' '+endtime+':00'

#array for data
arrayData=[]
header=[]

header.append('timestamp')

if form.getvalue('Temp(C)'):
    arrayData.append('temperature')
    header.append('Temp(C)')
if form.getvalue('DewPointTemp(C)'):
    arrayData.append('dewtemperature')
    header.append('DewPointTemp(C)')
if form.getvalue('RelHum(%)'):
    arrayData.append('relhumidity')
    header.append('RelHum(%)')
if form.getvalue('WindDir(10sdeg)'):
    arrayData.append('winddirection')
    header.append('WindDir(10sdeg)')
if form.getvalue('WindSpd(km/h)'):
    arrayData.append('windspeed')
    header.append('WindSpd(km/h)')
if form.getvalue('Visibility(km)'):
    arrayData.append('visibility')
    header.append('Visibility(km)')
if form.getvalue('StnPress(kPa)'):
    arrayData.append('stnpressure')
    header.append('StnPress(kPa)')
if form.getvalue('Hmdx'):
    arrayData.append('hmdx')
    header.append('Hmdx')
if form.getvalue('WindChill'):
    arrayData.append('windchill')
    header.append('WindChill')
if form.getvalue('Weather'):
    arrayData.append('weather')
    header.append('Weather')

#select structure
select ='SELECT timestamp'


for data in arrayData:
    select =select+', '+data
select = select +" FROM weather WHERE timestamp >= '"+timestamp1+"' AND timestamp < '"+timestamp2 +"' ORDER BY timestamp"


cur.execute(
            select
        )
#rows = cur.fetchone()
#print file

#print rows
with open('csvfile.csv', "wb") as csv_file:
    writer = csv.writer(csv_file, delimiter=',')
    writer.writerow(header)
    for row in cur:
        writer.writerow(row)
    conn.commit()

print("<button onclick=window.open('csvfile.csv')>Download File</button>")
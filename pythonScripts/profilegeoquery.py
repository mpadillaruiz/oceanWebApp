import cgi
import psycopg2
import csv
import shapely
import shapely.wkb
import urllib
import sys
import sysconfig
import shutil
import os


#connection to the database
conn = psycopg2.connect("host=localhost dbname=oceanMapping user=postgres password=admin")
cur = conn.cursor()

#getting the form
form = cgi.FieldStorage()

#getting polygon
polygon= form.getvalue('polygon');

#get the time frame
year= form.getvalue('year');
month= form.getvalue('month');
day= form.getvalue('day');

#with open('csvfile.csv', "wb") as csv_file:
#    writer = csv.writer(csv_file, delimiter=',')
filename ='profile.csv'
filename = urllib.unquote(filename)

print ("Content-Disposition: attachment; filename="+filename+"\r\n\r\n")

print(year)
print(month)
print(day)


#SELECT * FROM mvp_points WHERE extract (year from timestamp) = \''+year+'\' AND ST_Within(geom,ST_GeomFromText(\''+polygon+'\',4326))
#select structure
#timestamp::timestamp::date = '2003-05-22'
#SELECT * FROM mvp_points WHERE extract (year from timestamp) = 2003 AND extract (day from timestamp) = 20 AND extract (month from timestamp) = 5
selectDepth ='SELECT * FROM mvp_points WHERE extract (year from timestamp) = \''+year+'\'';

if str(month) != 'NaN':
    selectDepth =selectDepth+ ' AND extract (month from timestamp) = \''+month+'\'';

if str(day) != 'NaN':
    selectDepth =selectDepth+ ' AND extract (day from timestamp) = \''+day+'\'';

selectDepth = selectDepth+ ' AND ST_Within(geom,ST_GeomFromText(\''+polygon+'\',4326))';



cur.execute(
            selectDepth
        )
#rows = cur.fetchone()
#print file



for row in cur:
    with open(filename, "ab") as csv_file:


        writer = csv.writer(csv_file, delimiter=',')


        #Cruise,Station,mon/day/yr,hh:mm,Longitude [degrees_east],Latitude [degrees_north],Bot. Depth [m],DEPTH [m],QF,TEMPERATURE [?C],QF,SALINITY [PSS-78],QF,SOUNDSPEED [m/s],QF
        #id,CruiseName,Instrumentation,TimeStamp,Lng,Lat,BottomDepth,Depth,Temperature,Salinity,SoundSpeed
        geometry = shapely.wkb.loads(row[4], hex=True)

        #write header
        writer.writerow(["Cruise: "+row[1]])
        writer.writerow(["Station: "+row[2]])
        writer.writerow(["Longitude: "+str(geometry.coords[0][0])])
        writer.writerow(["Latitude: "+str(geometry.coords[0][1])])
        writer.writerow(["Timestamp: "+str(row[3])])
        writer.writerow(["BottomDepth:"+str(row[5])])

        #space
        writer.writerow([])

        #write data
        writer.writerow(["Depth","Temperature","Salinity","SoundSpeed"])
        depth = row[6]
        temperature=row[7]
        sal = row[8]
        soundspeed=row[9]

        for d, t, s,ss in zip(depth,temperature,sal,soundspeed):
            writer.writerow([str(d),str(t),str(s),str(ss)])


conn.commit()

file = open(filename,'rb')
print(file.read())
file.close()
os.remove(filename)

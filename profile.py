print ("Content-type: text/html\r\n\r\n")
print("<html>")
print("<head>")
print("<title>Profiles</title>")
print("</head>")
print("<body>")

import cgi
import psycopg2
import csv

# Import the necessary packages and modules
import matplotlib.pyplot as plt
import numpy as np

#connection to the database
conn = psycopg2.connect("host=localhost dbname=oceanMapping user=postgres password=admin")
cur = conn.cursor()

#getting the form
form = cgi.FieldStorage()

#getting time query
id2= form.getvalue('id');

#select structure
selectDepth ='SELECT depth,temperature,salinity,soundspeed FROM mvp_points WHERE id ='+id2;


cur.execute(
            selectDepth
        )
#rows = cur.fetchone()
#print file

#print rows
#with open('csvfile.csv', "wb") as csv_file:
#    writer = csv.writer(csv_file, delimiter=',')
for row in cur:
    y =row[0]
    xtem=row[1]
    xsal=row[2]
    xsound=row[3]

conn.commit()

# Prepare the data
#x = np.linspace(0, 10, 100)



# Plot the data
plt.gca().invert_yaxis()

tempfile = 'profiles/tempProfile'+str(id2)+'.png';
salfile = 'profiles/salProfile'+str(id2)+'.png';
soundfile = 'profiles/soundProfile'+str(id2)+'.png';

plt.figure(1)
plt.plot(xtem, y,color='red')
plt.ylabel('Depth [m]')
plt.xlabel('Temperature [C]')
# Add a legend
#plt.legend()
plt.savefig(tempfile)

plt.figure(2)
plt.gca().invert_yaxis()
plt.plot(xsal, y,color='blue')
plt.ylabel('Depth [m]')
plt.xlabel('Salinity [PSS]')
# Add a legend
#plt.legend()
plt.savefig(salfile)

plt.figure(3)
plt.gca().invert_yaxis()
plt.plot(xsound, y,color='green')
plt.ylabel('Depth [m]')
plt.xlabel('Sound Speed [m/s]')
# Add a legend
#plt.legend()
plt.savefig(soundfile)

# Show the plot
#plt.show()

print("<button onclick=window.open(\'"+tempfile+"\')>Download Temperature profile png</button>")
print("<button onclick=window.open(\'"+salfile+"\')>Download Salinity profile png</button>")
print("<button onclick=window.open(\'"+salfile+"\')>Download SoundSpeed profile png</button>")
print('<form target="_blank" name="csv" action="formatprofile.py" method=""><input type="hidden" name="id" value="'+id2+'"><input type="submit" value="Download csv file" class="btn btn-primary"></form>')

print("<img src=\""+tempfile+"\">")
print("<img src=\""+salfile+"\">")
print("<img src=\""+soundfile+"\">")

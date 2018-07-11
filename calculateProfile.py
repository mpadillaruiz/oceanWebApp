import requests
import cgi
from lxml import etree
# Import the necessary packages and modules
import matplotlib.pyplot as plt
import numpy as np
import ast

print ("Content-type: text/html\r\n\r\n")
print("<html>")
print("<head>")
print("<title>Longitudinal Profile</title>")
print("</head>")
print("<body>")

#getting the form
form = cgi.FieldStorage()

#getting time query
polygon= form.getvalue('polygon');
#polygon= "LINESTRING(-66.13331794738771 45.2901051754516,-66.13769531250001 45.28932018599128)";

layer="oceanMapping:BILI_Lowersj_1m_0001_.tif";

#if form.getvalue('5'):
#    layer ="oceanMapping:LowerSJRIVER_50m_4326"

#Remember to change the BoundingBox in each request if you change the layer for the calculation

xml = """<?xml version="1.0" encoding="UTF-8"?><wps:Execute version="1.0.0" service="WPS" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.opengis.net/wps/1.0.0" xmlns:wfs="http://www.opengis.net/wfs" xmlns:wps="http://www.opengis.net/wps/1.0.0" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:gml="http://www.opengis.net/gml" xmlns:ogc="http://www.opengis.net/ogc" xmlns:wcs="http://www.opengis.net/wcs/1.1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xsi:schemaLocation="http://www.opengis.net/wps/1.0.0 http://schemas.opengis.net/wps/1.0.0/wpsAll.xsd">
  <ows:Identifier>py:profile2</ows:Identifier>
  <wps:DataInputs>
    <wps:Input>
      <ows:Identifier>raster1</ows:Identifier>
      <wps:Reference mimeType="image/tiff" xlink:href="http://geoserver/wcs" method="POST">
        <wps:Body>
          <wcs:GetCoverage service="WCS" version="1.1.1">
            <ows:Identifier>"""+layer+"""</ows:Identifier>
            <wcs:DomainSubset>
              <ows:BoundingBox crs="http://www.opengis.net/gml/srs/epsg.xml#4326">
				<ows:LowerCorner>-66.74021500690543 45.12625352724145</ows:LowerCorner>
                <ows:UpperCorner>-65.14216587758257 45.650018971521824</ows:UpperCorner>
              </ows:BoundingBox>
            </wcs:DomainSubset>
            <wcs:Output format="image/tiff"/>
          </wcs:GetCoverage>
        </wps:Body>
      </wps:Reference>
    </wps:Input>
    <wps:Input>
      <ows:Identifier>line</ows:Identifier>
      <wps:Data>
        <wps:ComplexData mimeType="application/wkt"><![CDATA["""+polygon+"""]]></wps:ComplexData>
      </wps:Data>
    </wps:Input>
  </wps:DataInputs>
  <wps:ResponseForm>
    <wps:ResponseDocument/>
  </wps:ResponseForm>
</wps:Execute>"""

headers = {'Content-Type': 'application/xml'} # set what your server accepts
xp = etree.fromstring(requests.post('http://localhost:8080/geoserver/wps', data=xml, headers=headers).content)
values = xp.xpath("//wps:ExecuteResponse/wps:ProcessOutputs/wps:Output",namespaces={'wps': "http://www.opengis.net/wps/1.0.0"})
r=values[0].xpath("//wps:Data/wps:LiteralData/text()",namespaces={'wps': "http://www.opengis.net/wps/1.0.0"})

distances=r[0]
points = r[1]
depths = r[2]



strs = points.replace('[','').split('],')
xxlist = [map(float, s.replace(']','').split(',')) for s in strs]
#points = ast.literal_eval(points)

strs = depths.replace('[','').split('],')
zzlist = [map(float, s.replace(']','').split(',')) for s in strs]

if len(zzlist[0])>1:
    arrayz =[]
    for z in zzlist:
        arrayz.append(z[0])
    zzlist=arrayz

distances = distances.replace('[','')
ddlist = map(float, distances.replace(']','').split(','))


print("<p>Total length of the profile: "+str(ddlist[0])+"</p>")
print("<p>Starting point: "+str(xxlist[0])+"</p>")
print("<p>Ending point: "+str(xxlist[len(xxlist)-1])+"</p>")


xxlist= list(np.arange(0, ddlist[0], 5))
if xxlist[len(xxlist)-1]< ddlist[0]:
    xxlist.append(ddlist[0])

profileFile = 'profiles/longitudinal.png';

plt.figure(1)
plt.plot(xxlist, zzlist, color='black')
# Adding labeling
plt.title('Longitudinal profile')
plt.ylabel('Depth [m]')
plt.xlabel('Total distance of the profile')

plt.savefig(profileFile)

print("<img src=\""+profileFile+"\"></br></br>")

# Show the plot
#plt.show()

print("<button onclick=window.open(\'"+profileFile+"\')>Download profile png</button>")
print('<form target="_blank" name="csv" action="formatprofile2.py" method="POST"><input type="hidden" name="zlist" value="'+depths+'"><input type="hidden" name="xlist" value="'+points+'"><input type="submit" value="Download csv file" class="btn btn-primary"></form>')

print("</body>")
print("</html>")

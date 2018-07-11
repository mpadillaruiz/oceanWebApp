import requests
import cgi
from lxml import etree

print ("Content-type: text/html\r\n\r\n")
print("<html>")
print("<head>")
print("<title>Bathymetry statistics</title>")
print("</head>")
print("<body>")

#getting the form
form = cgi.FieldStorage()

#getting area for calculating the stats
polygon= form.getvalue('polygon');

#Stats are calculated at the lowest resolution
layer="oceanMapping:BILI_Lowersj_1m_0001_.tif";

#Remember to change the BoundingBox in each request if you change the layer for the calculation

xml = """<?xml version="1.0" encoding="UTF-8"?><wps:Execute version="1.0.0" service="WPS" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.opengis.net/wps/1.0.0" xmlns:wfs="http://www.opengis.net/wfs" xmlns:wps="http://www.opengis.net/wps/1.0.0" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:gml="http://www.opengis.net/gml" xmlns:ogc="http://www.opengis.net/ogc" xmlns:wcs="http://www.opengis.net/wcs/1.1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xsi:schemaLocation="http://www.opengis.net/wps/1.0.0 http://schemas.opengis.net/wps/1.0.0/wpsAll.xsd">
  <ows:Identifier>py:rasterStatistics</ows:Identifier>
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
      <ows:Identifier>polygon</ows:Identifier>
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
xp = etree.fromstring(requests.post('http://131.202.94.74:8080/geoserver/wps', data=xml, headers=headers).content)
values = xp.xpath("//wps:ExecuteResponse/wps:ProcessOutputs/wps:Output",namespaces={'wps': "http://www.opengis.net/wps/1.0.0"})
r=values[0].xpath("//wps:Data/wps:LiteralData/text()",namespaces={'wps': "http://www.opengis.net/wps/1.0.0"})

print ("<p>Area covered:</p><p> "+polygon+"</p>")
print ("<p>Total number of Depths: "+r[1]+"</p>")
print ("<p>Maximum depth: "+"%.3f" % +r[2]+" m</p>")
print ("<p>Minimum depth: "+"%.3f" % +r[3]+" m</p>")
print ("<p>Average depth: "+"%.3f" % +r[0]+" m</p>")
print ("<p>Standard deviation: "+"%.3f" % +r[2]+" m</p>")
print("</body>")
print("</html>")
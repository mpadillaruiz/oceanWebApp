$(document).ready(function () {
	//Function to disable the area selection help (once they go back to the page, the help will not appear)
	var booleanhelp=(localStorage.getItem("nohelp") === "true");
		
	if(booleanhelp){
    }
	else{
		//if help is enable: select the POPUP and show it
		$("#popup").hide().fadeIn(200);

		//close the POPUP if the button with id="close" is clicked
		$("#close").on("click", function (e) {
			e.preventDefault();
			$("#popup").fadeOut(200);
		});
	}
});

// Map configuration
var map = L.map('tiled-map');

//Set the map view to the whole world
map.setView([45.407183, -66.110985], 3);
	
//Variable to keep rectangle bounds to send it to the main application
var latlng;
	
// Initialize the FeatureGroup layer to store editable layers
var editableLayers = new L.FeatureGroup();

//Add editable layers to the map
map.addLayer(editableLayers);

//Layer to store rectangles to show areas with data available
var dataRectangle = new L.FeatureGroup(); //Because is set up as a feature group, it is easy to add new rectangles to show new data areas
//Add layer to the map
map.addLayer(dataRectangle);

//Right now we will only add data for Lower Saint John River
//SJ Area geographical bounds
var bounds = [[44.713995, -67.556988], [46.029812, -64.156720]];
//Create an orange rectangle
var SJData = L.rectangle(bounds, {color: "#ff7800", weight: 0.5});
//Create a label for the rectangle
var label = new L.Tooltip({direction:"center"})
label.setContent("Lower Saint John River")
label.setLatLng(SJData.getBounds().getCenter())
SJData.bindTooltip(label);
var rectpopUp = L.popup();
//Button creation
var container = L.DomUtil.create('div');
rectBtn = createButton('Select this region', container),
container.innerHTML = ''+rectBtn+ '&nbsp;&nbsp;&nbsp;&nbsp;'; 
//Add button to the popup
rectpopUp.setContent(rectBtn);
//Setting onclick event of the button
L.DomEvent.on(rectBtn, 'click', () => {
	//Adding rectangle bounds to the local storage of the browser
	localStorage.setItem("ne_lat",bounds[0][0]);
	localStorage.setItem("ne_lng",bounds[0][1]);
	localStorage.setItem("sw_lat",bounds[1][0]);
	localStorage.setItem("sw_lng",bounds[1][1]);
	//Redirect to the main page of the application
	location.href = "mainApp.html";
});
//Attach the popup to the layer
SJData.bindPopup(rectpopUp);

//Add the rectangle to LayerGroup
dataRectangle.addLayer(SJData);
	
//Initialize the base map and add it to the map
var basemaps = {
	'Basemap': basemap().addTo(map)
};
	
//Drawing options
var drawPluginOptions = {
	position: 'topright',
	draw: {
		//We will only allow the user to select an area by a rectangle
		rectangle: {
			allowIntersection: false, // Restricts shapes to simple polygons
			drawError: {
				color: '#e1e100', // Color the shape will turn when intersects
				message: '<strong>Oh snap!<strong> you can\'t draw that!' // Message that will show when intersect
			},
			shapeOptions: {
				color: '#97009c'
			}
		},
		// disable each other toolbar item by setting them to false
		polyline: false,
		circle: false,
		polygon: false,
		marker: false,
		circlemarker:false
	},
	edit: {
		featureGroup: editableLayers
	}
};
	
//Adding drawing control to the map
map.addControl(new L.Control.Draw(drawPluginOptions));

//Function when creating a drawing
map.on('draw:created', function(e) {
	var layer = e.layer;
	
	//After creating a drawing, a popup will be attached to the rectangle, to allow the user to select the area
	var layerPopUp = L.popup();
	
	//Button creation
	var container = L.DomUtil.create('div');
	startBtn = createButton('Select this region', container),
	container.innerHTML = ''+startBtn+ '&nbsp;&nbsp;&nbsp;&nbsp;'; 
	
	//Add button to the popup
	layerPopUp.setContent(startBtn);
		
	//Setting global latlng to the rectangle bounds
	latlng = layer._bounds;

	//Setting onclick event of the button
	L.DomEvent.on(startBtn, 'click', () => {
		//Adding rectangle bounds to the local storage of the browser
		localStorage.setItem("ne_lat",latlng._northEast.lat);
		localStorage.setItem("ne_lng",latlng._northEast.lng);
		localStorage.setItem("sw_lat",latlng._southWest.lat);
		localStorage.setItem("sw_lng",latlng._southWest.lng);
		//Redirect to the main page of the application
		location.href = "mainApp.html";
	});
	
	//This is needed in case the user creates several rectangles
	//The bounds will be set everytime the rectangle is clicked
	layer.on('click', function (event) {
		latlng = e.layer._bounds;
	});

	//Attach the popup to the layer
	layer.bindPopup(layerPopUp);
	
	//Add the new rectangle to editable LayerGroup
	editableLayers.addLayer(layer);
	
	//Open the popup
	layer.openPopup();

});

	/*Create a button function
	Returns a button giving a container to put it in and a label for the button text
	*/
function createButton(label, container) {
		var btn = L.DomUtil.create('button', '', container);
		btn.setAttribute('type', 'button');
		btn.setAttribute('class','btn btn-primary custombtn');
		btn.innerHTML = label;
		return btn;
	};
	
//Function to create a base map from stamen.com
function basemap() {
    var attr = 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.';
    return L.tileLayer("http://tile.stamen.com/toner-background/{z}/{x}/{y}.png", {
        opacity: 0.1,
        attribution: attr
    });
}







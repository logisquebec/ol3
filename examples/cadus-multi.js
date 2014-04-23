// NOCOMPILE
// This example uses the GMapx v3 API, which we do not have an exports file for.
goog.require('ol.Map');
goog.require('ol.View2D');
goog.require('ol.control.GoogleMapsCurrentPosition');
goog.require('ol.control.GoogleMapsDirections');
goog.require('ol.interaction');
goog.require('ol.interaction.DragPan');
goog.require('ol.interaction.DragStyleCursor');
goog.require('ol.layer.Vector');
goog.require('ol.proj');
goog.require('ol.source.GeoJSON');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Icon');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
goog.require('ol.style.Text');



var gmap = new google.maps.Map(document.getElementById('gmap'), {
  disableDefaultUI: true,
  keyboardShortcuts: false,
  draggable: false,
  disableDoubleClickZoom: true,
  scrollwheel: false,
  streetViewControl: false
});

var view = new ol.View2D();
view.on('change:center', function() {
  var center = ol.proj.transform(view.getCenter(), 'EPSG:3857', 'EPSG:4326');
  gmap.setCenter(new google.maps.LatLng(center[1], center[0]));
});
view.on('change:resolution', function() {
  gmap.setZoom(view.getZoom());
});

var vector = new ol.layer.Vector({
  source: new ol.source.GeoJSON(({
    object: {
      'type': 'FeatureCollection',
      'crs': {
        'type': 'name',
        'properties': {
          'name': 'EPSG:3857'
        }
      },
      'features': []
    }
  })),
  style: new ol.style.Style({
    fill: new ol.style.Fill({
      color: 'rgba(255, 255, 255, 0.6)'
    }),
    stroke: new ol.style.Stroke({
      color: '#319FD3',
      width: 1
    })
  })
});

var olMapDiv = document.getElementById('olmap');
var map = new ol.Map({
  layers: [vector],
  interactions: ol.interaction.defaults({
    altShiftDragRotate: false,
    dragPan: false,
    touchRotate: false
  }).extend([
    new ol.interaction.DragPan({kinetic: false}),
    new ol.interaction.DragStyleCursor()
  ]),
  renderer: 'canvas',
  target: olMapDiv,
  view: view
});
view.setCenter([-7910219, 6176130]);
view.setZoom(14);

olMapDiv.parentNode.removeChild(olMapDiv);
gmap.controls[google.maps.ControlPosition.TOP_LEFT].push(olMapDiv);

var createDetourIconStyle = function() {
  return function(resolution) {
    var style = new ol.style.Style({
      image: new ol.style.Circle({
        radius: 5,
        fill: new ol.style.Fill({color: 'white'}),
        stroke: new ol.style.Stroke({color: 'black', width: 2})
      }),
      text: new ol.style.Text({
        fill: new ol.style.Fill({color: 'red'}),
        font: 'bold 14px Arial',
        offsetX: 8,
        offsetY: -3,
        stroke: new ol.style.Stroke({color: 'black', width: 2}),
        text: this.getProperties().myLabel,
        textAlign: 'left',
        textBaseline: 'bottom'
      })
    });
    return [style];
  };
};

var olCurrentPosition = new ol.control.GoogleMapsCurrentPosition({
  'geocoderComponentRestrictions': {'country': 'CA'},
  'currentPositionText': 'Ma position'
});

var iconStyles = [];
for (var i = 1, len = 8; i <= len; i++) {
  iconStyles.push(new ol.style.Style({
    image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
      anchor: [0.5, 46],
      anchorXUnits: 'fraction',
      anchorYUnits: 'pixels',
      opacity: 0.75,
      src: 'data/icon' + i + '.png'
    }))
  }));
}

var directions = new ol.control.GoogleMapsDirections({
  'gmap': gmap,
  'target': 'gmaps-directions',
  'enableCurrentPosition': true,
  'currentPositionControl': olCurrentPosition,
  'defaultTravelModes': [
    ol.control.GoogleMapsDirections.TravelMode.CARPOOLING,
    ol.control.GoogleMapsDirections.TravelMode.TRANSIT,
    ol.control.GoogleMapsDirections.TravelMode.WALKING
  ],
  'geocoderComponentRestrictions': {'country': 'CA'},
  'getURL': '/usager/adresses/obtenir',
  'multimodalUrl': 'data/cadus/multimodal.json',
  'addWaypointButtonText': 'Ajouter un point',
  'currentPositionText': 'Ma position',
  'searchButtonText': 'Rechercher',
  'clearButtonText': 'Effacer',
  'removeButtonText': 'Supprimer',
  'suggestedRoutesText': 'Routes suggérées',
  'aroundText': 'environ',
  'copyrightText': 'Données cartographiques ©2014 Google',
  'totalDistanceText': 'Distance Totale',
  'bicyclingText': 'Bicyclette',
  'carpoolingText': 'Covoiturage',
  'drivingText': 'Auto-Solo',
  'transitText': 'Autobus',
  'walkingText': 'Marche',
  'lineStyle': new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: [80, 140, 255, 0.6],
      width: 6
    })
  }),
  'iconStyles': iconStyles,
  'detourLabelProperty': 'myLabel',
  'detourIconStyle': createDetourIconStyle(),
  'panel': 'gmaps-directions-panel',
  'popupPixelBuffer': 150
});
map.addControl(directions);


/** @type {string} */
directions.startGeocoder_.input_.value =
    '980 Rue Saint-Paul, Chicoutimi, QC G7J 3C2, Canada';


/** @type {string} */
directions.endGeocoder_.input_.value =
    '930 Rue Jacques-Cartier Est, Chicoutimi, QC G7H 7K9, Canada';
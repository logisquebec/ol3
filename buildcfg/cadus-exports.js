goog.require('ol.Map');
goog.require('ol.View2D');
goog.require('ol.control.GoogleMapsAddresses');
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

goog.exportSymbol(
    'ol.Map',
    ol.Map);

goog.exportSymbol(
    'ol.View2D',
    ol.View2D);

goog.exportProperty(
    ol.View2D.prototype,
    'on',
    ol.View2D.prototype.on);

goog.exportProperty(
    ol.View2D.prototype,
    'getZoom',
    ol.View2D.prototype.getZoom);

goog.exportSymbol(
    'ol.proj.transform',
    ol.proj.transform);

goog.exportSymbol(
    'ol.layer.Vector',
    ol.layer.Vector);

goog.exportSymbol(
    'ol.source.GeoJSON',
    ol.source.GeoJSON);

goog.exportSymbol(
    'ol.style.Style',
    ol.style.Style);

goog.exportSymbol(
    'ol.style.Stroke',
    ol.style.Stroke);

goog.exportSymbol(
    'ol.interaction.defaults',
    ol.interaction.defaults);

goog.exportProperty(
    ol.Collection.prototype,
    'extend',
    ol.Collection.prototype.extend);

goog.exportSymbol(
    'ol.interaction.DragPan',
    ol.interaction.DragPan);

goog.exportSymbol(
    'ol.interaction.DragStyleCursor',
    ol.interaction.DragStyleCursor);

goog.exportProperty(
    ol.View2D.prototype,
    'setCenter',
    ol.View2D.prototype.setCenter);

goog.exportProperty(
    ol.View2D.prototype,
    'setZoom',
    ol.View2D.prototype.setZoom);

goog.exportProperty(
    ol.Object.prototype,
    'getProperties',
    ol.Object.prototype.getProperties);

goog.exportSymbol(
    'ol.style.Circle',
    ol.style.Circle);

goog.exportSymbol(
    'ol.style.Text',
    ol.style.Text);

goog.exportSymbol(
    'ol.style.Fill',
    ol.style.Fill);

goog.exportSymbol(
    'ol.control.GoogleMapsDirections',
    ol.control.GoogleMapsDirections);

goog.exportProperty(
    ol.control.GoogleMapsDirections.prototype,
    'getGeocoderInfo',
    ol.control.GoogleMapsDirections.prototype.getGeocoderInfo);

goog.exportProperty(
    ol.control.GoogleMapsDirections.prototype,
    'load',
    ol.control.GoogleMapsDirections.prototype.load);

goog.exportProperty(
    ol.control.GoogleMapsDirections.prototype,
    'on',
    ol.control.GoogleMapsDirections.prototype.on);

goog.exportProperty(
    ol.control.GoogleMapsDirections.prototype,
    'save',
    ol.control.GoogleMapsDirections.prototype.save);

goog.exportProperty(
    ol.control.GoogleMapsDirections,
    'EventType',
    ol.control.GoogleMapsDirections.EventType);

goog.exportProperty(
    ol.control.GoogleMapsDirections.EventType,
    'ROUTECOMPLETE',
    ol.control.GoogleMapsDirections.EventType.ROUTECOMPLETE);

goog.exportProperty(
    ol.control.GoogleMapsDirections.EventType,
    'CLEAR',
    ol.control.GoogleMapsDirections.EventType.CLEAR);

goog.exportProperty(
    ol.control.GoogleMapsDirections.EventType,
    'SELECT',
    ol.control.GoogleMapsDirections.EventType.SELECT);

goog.exportProperty(
    ol.control.GoogleMapsDirections,
    'TravelMode',
    ol.control.GoogleMapsDirections.TravelMode);

goog.exportProperty(
    ol.control.GoogleMapsDirections.TravelMode,
    'BICYCLING',
    ol.control.GoogleMapsDirections.TravelMode.BICYCLING);

goog.exportProperty(
    ol.control.GoogleMapsDirections.TravelMode,
    'CARPOOLING',
    ol.control.GoogleMapsDirections.TravelMode.CARPOOLING);

goog.exportProperty(
    ol.control.GoogleMapsDirections.TravelMode,
    'DRIVING',
    ol.control.GoogleMapsDirections.TravelMode.DRIVING);

goog.exportProperty(
    ol.control.GoogleMapsDirections.TravelMode,
    'TRANSIT',
    ol.control.GoogleMapsDirections.TravelMode.TRANSIT);

goog.exportProperty(
    ol.control.GoogleMapsDirections.TravelMode,
    'WALKING',
    ol.control.GoogleMapsDirections.TravelMode.WALKING);


goog.exportSymbol(
    'ol.style.Icon',
    ol.style.Icon);

goog.exportProperty(
    ol.Map.prototype,
    'addControl',
    ol.Map.prototype.addControl);

goog.exportSymbol(
    'ol.control.GoogleMapsAddresses',
    ol.control.GoogleMapsAddresses);

goog.exportSymbol(
    'ol.control.GoogleMapsCurrentPosition',
    ol.control.GoogleMapsCurrentPosition);

goog.exportProperty(
    ol.control.GoogleMapsCurrentPosition.prototype,
    'getCurrentPosition',
    ol.control.GoogleMapsCurrentPosition.prototype.getCurrentPosition);

goog.exportProperty(
    ol.control.GoogleMapsCurrentPosition.prototype,
    'setCurrentPosition',
    ol.control.GoogleMapsCurrentPosition.prototype.setCurrentPosition);
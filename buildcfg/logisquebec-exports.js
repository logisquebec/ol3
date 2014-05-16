goog.require('ol.Map');
goog.require('ol.View2D');
goog.require('ol.interaction');
goog.require('ol.interaction.DragPan');
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
    'ol.style.Icon',
    ol.style.Icon);

goog.exportProperty(
    ol.Map.prototype,
    'addControl',
    ol.Map.prototype.addControl);

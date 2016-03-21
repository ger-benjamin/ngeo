


/** @const **/
var app = {};


/** @type {!angular.Module} **/
app.module = angular.module('app', ['gmf']);

app.module.constant('gmfTreeUrl', 'data/themes.json');


/**
 * @param {gmf.Themes} gmfThemes Themes service.
 * @constructor
 * @ngInject
 */
app.MainController = function(gmfThemes) {

  gmfThemes.loadThemes();

  /**
   * @type {Array.<gmfx.SearchDirectiveDatasource>}
   * @export
   */
  this.searchDatasources = [{
    groupValues: ['osm', 'district'],
    groupActions: [],
    labelKey: 'label',
    projection: 'EPSG:21781',
    url: 'https://geomapfish-demo.camptocamp.net/2.0/wsgi/fulltextsearch'
  }];

  /**
   * Style for search results
   * @param {ol.Feature} feature The searched feature.
   * @param {number} resolution The current resolution of the map.
   * @return {ol.style.Style} A style for this kind of features.
   * @export
   */
  this.searchStyle = function(feature, resolution) {
    var stroke, fill, image;
    var kind = feature.get('layer_name');
    switch (kind) {
      case 'osm':
        fill = new ol.style.Fill({color: [255, 255, 255, 0.6]});
        image = new ol.style.Circle({fill: fill, radius: 5, stroke: stroke});
        stroke = new ol.style.Stroke({color: [50, 150, 200, 1], width: 2});
        break;
      case gmf.COORDINATES_LAYER_NAME:
        image = new ol.style.RegularShape({
          stroke: new ol.style.Stroke({color: [0, 0, 0, 0.7], width: 2}),
          points: 4,
          radius: 8,
          radius2: 0,
          angle: 0
        })
        break;
      default:
        fill = new ol.style.Fill({color: [255, 255, 255, 0.6]});
        image = new ol.style.Circle({fill: fill, radius: 5, stroke: stroke}),
        stroke = new ol.style.Stroke({color: [255, 0, 0, 1], width: 2});
    }
    return new ol.style.Style({
      fill: fill,
      image: image,
      stroke: stroke
    });
  };


  /**
   * @type {ol.Map}
   * @export
   */
  this.map = new ol.Map({
    layers: [
      new ol.layer.Tile({
        source: new ol.source.OSM()
      })
    ],
    view: new ol.View({
      center: [0, 0],
      zoom: 4
    })
  });

};


app.module.controller('MainController', app.MainController);

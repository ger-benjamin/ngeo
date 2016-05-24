
/** @suppress {extraRequire} */


/** @const **/
var app = {};


/** @type {!angular.Module} **/
app.module = angular.module('app', ['gmf']);


/**
 * @constructor
 * @ngInject
 */
app.MainController = function() {

  var epsg2056FilterLabel = 'Coordinates';

  /**
   * @type {Array.<gmfx.MousePositionProjection>}
   * @export
   */
  this.projections = [{
    code: 'EPSG:2056',
    label: 'CH1903+ / LV03',
    filter: 'ngeoSwissCoordinates:' + epsg2056FilterLabel + ' (m) : '
  }, {
    code: 'EPSG:21781',
    label: 'CH1903 / LV03',
    filter: 'ngeoEastNorthCoordinates:2:[ :; : ]'
  }, {
    code: 'EPSG:4326',
    label: 'WGS84 UTM 31',
    filter: 'ngeoDMSCoordinates'
  }];

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

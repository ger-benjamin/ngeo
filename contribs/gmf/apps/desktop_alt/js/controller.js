/**
 * Application entry point.
 *
 * This file defines the "app_desktop" Closure namespace, which is be used as
 * the Closure entry point (see "closure_entry_point" in the "build.json"
 * file).
 *
 * This file includes `goog.require`'s for all the components/directives used
 * by the HTML page and the controller to provide the configuration.
 */
goog.provide('app.AlternativeDesktopController');
goog.provide('app_desktop_alt');

goog.require('app');
goog.require('gmf.AbstractDesktopController');
/** @suppress {extraRequire} */
goog.require('gmf.authenticationDirective');
/** @suppress {extraRequire} */
goog.require('ngeo.proj.EPSG2056');
/** @suppress {extraRequire} */
goog.require('ngeo.proj.EPSG21781');


app.module.constant('ngeoExportFeatureFormats', [
  ngeo.FeatureHelper.FormatType.KML,
  ngeo.FeatureHelper.FormatType.GPX
]);

// Filter to apply by default on all coordinates.
app.module.constant('ngeoPointfilter', 'ngeoNumberCoordinates:0:{x} E, {y} N');

app.module.constant('ngeoQueryOptions', {
  'limit': 20
});


/**
 * @param {angular.Scope} $scope Scope.
 * @param {angular.$injector} $injector Main injector.
 * @constructor
 * @extends {gmf.AbstractDesktopController}
 * @ngInject
 * @export
 */
app.AlternativeDesktopController = function($scope, $injector) {
  goog.base(
      this, {
        srid: 21781,
        mapViewConfig: {
          center: [632464, 185457],
          minZoom: 3,
          zoom: 3
        }
      }, $scope, $injector);

  /**
   * @type {boolean}
   * @export
   */
  this.showInfobar = true;

  /**
   * @type {ngeo.ScaleselectorOptions}
   * @export
   */
  this.scaleSelectorOptions = {
    'dropup': true
  };

  var $sce = $injector.get('$sce');

  /**
   * @type {!Object.<string, string>}
   * @export
   */
  this.scaleSelectorValues = {
    '0': $sce.trustAsHtml('1&nbsp;:&nbsp;250\'000'),
    '1': $sce.trustAsHtml('1&nbsp;:&nbsp;100\'000'),
    '2': $sce.trustAsHtml('1&nbsp;:&nbsp;50\'000'),
    '3': $sce.trustAsHtml('1&nbsp;:&nbsp;20\'000'),
    '4': $sce.trustAsHtml('1&nbsp;:&nbsp;10\'000'),
    '5': $sce.trustAsHtml('1&nbsp;:&nbsp;5\'000'),
    '6': $sce.trustAsHtml('1&nbsp;:&nbsp;2\'000'),
    '7': $sce.trustAsHtml('1&nbsp;:&nbsp;1\'000'),
    '8': $sce.trustAsHtml('1&nbsp;:&nbsp;500'),
    '9': $sce.trustAsHtml('1&nbsp;:&nbsp;250'),
    '10': $sce.trustAsHtml('1&nbsp;:&nbsp;100'),
    '11': $sce.trustAsHtml('1&nbsp;:&nbsp;50')
  };

  /**
   * @type {Array.<gmfx.MousePositionProjection>}
   * @export
   */
  this.mousePositionProjections = [{
    code: 'EPSG:2056',
    label: 'CH1903+ / LV03',
    filter: 'ngeoNumberCoordinates::{x}, {y} m:false'
  }, {
    code: 'EPSG:21781',
    label: 'CH1903 / LV03',
    filter: 'ngeoNumberCoordinates::{x}, {y} m:false'
  }, {
    code: 'EPSG:4326',
    label: 'WGS84',
    filter: 'ngeoDMSCoordinates:2'
  }];
};
goog.inherits(app.AlternativeDesktopController, gmf.AbstractDesktopController);


app.module.controller('AlternativeDesktopController', app.AlternativeDesktopController);
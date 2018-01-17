goog.provide('gmf.lidarProfileComponent');

goog.require('gmf');
goog.require('ol.geom.LineString');

goog.require('ngeo.lidarProfile');

ngeo.module.value('gmfLidarProfileTemplateUrl',
  /**
     * @param {!angular.JQLite} $element Element.
     * @param {!angular.Attributes} $attrs Attributes.
     * @return {string} Template.
     */
  ($element, $attrs) => {
    const templateUrl = $attrs['gmfLidarProfileTemplateUrl'];
    return templateUrl !== undefined ? templateUrl :
      `${gmf.baseTemplateUrl}/lidarprofile.html`;
  });


/**
 * @param {!angular.JQLite} $element Element.
 * @param {!angular.Attributes} $attrs Attributes.
 * @param {!function(!angular.JQLite, !angular.Attributes): string} gmfLidarProfileTemplateUrl Template function.
 * @return {string} Template URL.
 * @ngInject
 */
function gmfLidarProfileTemplateUrl($element, $attrs, gmfLidarProfileTemplateUrl) {
  return gmfLidarProfileTemplateUrl($element, $attrs);
}


/**
 * Provide a component that display a lidar profile panel.
 * @ngdoc component
 * @ngname gmfLidarProfile
 */
gmf.lidarProfileComponent = {
  controller: 'GmfLidarProfileController',
  bindings: {
    'active': '=gmfLidarProfileActive',
    'line': '=gmfLidarProfileLine',
    'getMapFn': '&?gmfLidarProfileMap',
    'getOptionsFn': '&?gmfLidarProfileOptions'
  },
  templateUrl: gmfLidarProfileTemplateUrl
};


gmf.module.component('gmfLidarProfile', gmf.lidarProfileComponent);


/**
 * @param {angular.Scope} $scope Angular scope.
 * @param {angular.$http} $http Angular http service.
 * @param {angular.JQLite} $element Element.
 * @param {angular.$filter} $filter Angular filter
 * @param {angular.$window} $window Angular window service.
 * @param {angularGettext.Catalog} gettextCatalog Gettext catalog.
 * @param {string} pytreeLidarProfileJsonUrl URL of GMF service JSON profile.
 * @param {gmf.LidarProfileConfig} gmfLidarProfileConfig LiDAR Profile Configuration Service
 * @constructor
 * @private
 * @ngInject
 * @ngdoc controller
 * @ngname GmfLidarProfileController
 */
gmf.LidarProfileController = function($scope, $http, pytreeLidarProfileJsonUrl, gmfLidarProfileConfig) {

  /**
   * @type {angular.Scope}
   * @private
   */
  this.$scope_ = $scope;

  /**
   * @type {angular.$http}
   * @private
   */
  this.$http_ = $http;

  /**
   * @type {string}
   * @private
   */
  this.pytreeLidarProfileJsonUrl_ = pytreeLidarProfileJsonUrl;

  /**
   * @type {gmf.LidarProfileConfig}
   * @private
   */
  this.gmfLidarProfileConfig_ = gmfLidarProfileConfig;

  /**
   * @type {ol.Map}
   * @private
   */
  this.map_ = null;

  /**
   * @type {ol.geom.LineString}
   * @export
   */
  this.line;

  /**
   * Distance to highlight on the profile. (Property used in ngeo.Profile.)
   * @type {number}
   * @export
   */
  this.profileHighlight = -1;
  /**
   * Measure tool state
   * @type {boolean}
   * @export
   */
  this.lidarProfileMeasureActive = false;

  /**
   * @type {boolean}
   * @export
   */
  this.active = false;

  /**
   * @type {ol.EventsKey}
   * @private
   */
  this.pointerMoveKey_;

  // Watch the active value to activate/deactive events listening.
  $scope.$watch(
    () => this.active,
    (newValue, oldValue) => {
      if (oldValue !== newValue) {
        this.updateEventsListening_();
      }
    });

  // Watch the line to update the profileData (data for the chart).
  $scope.$watch(
    () => this.line,
    (newLine, oldLine) => {
      if (oldLine !== newLine) {
        this.update_();
      }
    });

  $scope.$watch(
    () => this.gmfLidarProfileConfig_,
    (newConfig, oldConfig) => {
      if (oldConfig !== newConfig) {
        this.update_();
      }
    }
  );

  this.updateEventsListening_();
};


/**
 * Init the controller
 */
gmf.LidarProfileController.prototype.$onInit = function() {
  this.map_ = this['getMapFn'] ? this['getMapFn']() : null;
  this.nbPoints_ = this['getNbPointsFn'] ? this['getNbPointsFn']() : 100;

  let hoverPointStyle;
  const hoverPointStyleFn = this['getHoverPointStyleFn'];
  if (hoverPointStyleFn) {
    hoverPointStyle = hoverPointStyleFn();
    goog.asserts.assertInstanceof(hoverPointStyle, ol.style.Style);
  } else {
    hoverPointStyle = new ol.style.Style({
      image: new ol.style.Circle({
        fill: new ol.style.Fill({color: '#ffffff'}),
        radius: 3
      })
    });
  }
};


/**
 * @private
 */
gmf.LidarProfileController.prototype.update_ = function() {
  this.isErrored = false;
  ngeo.lidarProfile.loader.clearBuffer();
  if (this.line) {
    this.gmfLidarProfileConfig_.olLinestring = this.line;
    this.gmfLidarProfileConfig_.map = this.map_;
    ngeo.lidarProfile.setOptions(this.gmfLidarProfileConfig_);
    ngeo.lidarProfile.loader.getProfileByLOD(0,
      true,
      this.gmfLidarProfileConfig_.profileConfig.minLOD);
  } else {
    ngeo.lidarProfile.loader.cartoHighlight.setPosition(undefined);
  }
  this.active = !!this.line;
};


/**
 * @private
 */
gmf.LidarProfileController.prototype.updateEventsListening_ = function() {
  if (this.active && this.map_ !== null) {
    this.pointerMoveKey_ = ol.events.listen(this.map_, 'pointermove',
      this.onPointerMove_.bind(this));
  } else {
    ol.Observable.unByKey(this.pointerMoveKey_);
  }
};


gmf.module.controller('GmfLidarProfileController', gmf.LidarProfileController);

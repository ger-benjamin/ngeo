goog.provide('gmf.lidarPanelComponent');

goog.require('gmf');
goog.require('gmf.lidarProfile');
goog.require('gmf.lidarProfile.options');
goog.require('gmf.lidarProfile.loader');
goog.require('gmf.lidarProfile.plot2canvas');
goog.require('gmf.lidarProfile.utils');
goog.require('ol.geom.LineString');


gmf.module.value('gmfLidarPanelTemplateUrl',
  /**
     * @param {!angular.JQLite} $element Element.
     * @param {!angular.Attributes} $attrs Attributes.
     * @return {string} Template.
     */
  ($element, $attrs) => {
    const templateUrl = $attrs['gmfLidarPanelTemplateUrl'];
    return templateUrl !== undefined ? templateUrl :
      `${gmf.baseTemplateUrl}/lidarpanel.html`;
  });


/**
 * @param {!angular.JQLite} $element Element.
 * @param {!angular.Attributes} $attrs Attributes.
 * @param {!function(!angular.JQLite, !angular.Attributes): string} gmfLidarPanelTemplateUrl Template function.
 * @return {string} Template URL.
 * @ngInject
 */
function gmfLidarPanelTemplateUrl($element, $attrs, gmfLidarPanelTemplateUrl) {
  return gmfLidarPanelTemplateUrl($element, $attrs);
}


/**
 * Provide a component that display a lidar profile panel.
 * @ngdoc component
 * @ngname gmfLidarPanel
 */
gmf.lidarPanelComponent = {
  controller: 'gmfLidarPanelController',
  bindings: {
    'active': '=gmfLidarPanelActive',
    'map': '=gmfLidarPanelMap',
    'line': '=gmfLidarPanelLine'
  },
  templateUrl: gmfLidarPanelTemplateUrl
};


gmf.module.component('gmfLidarPanel', gmf.lidarPanelComponent);


/**
 * @param {gmf.LidarProfileConfig} gmfLidarProfileConfig gmf gmfLidarProfileConfig.
 * @constructor
 * @private
 * @ngInject
 * @ngdoc controller
 * @ngname gmfLidarPanelController
 */
gmf.LidarPanelController = function(gmfLidarProfileConfig) {
  this.gmfLidarProfileConfig = gmfLidarProfileConfig;

  /**
  * @type {ol.geom.LineString}
  * @export
  */
  this.line;

  /**
  * @type {number}
  * @export
  */
  this.profilWidth;

  /**
  * @type {boolean}
  * @export
  */
  this.autoWidth = true;

  /**
   * @type {ol.Map}
   * @export
   */
  this.map = null;

  /**
   * @type {Object}
   * @export
   */
  this.pointAttributes = {
    availableOptions: [],
    selectedOption: {}
  };

  /**
  * @type {{bytes: number, elements: number, name: string, value: string, visible: number}}
  * @export
  */
  this.pointAttributes.selectedOption = {
    bytes: -1,
    elements: -1,
    name: '',
    value: '',
    visible: 0
  };

};

/**
 * @private
 */
gmf.LidarPanelController.prototype.$onInit = function() {
  this.gmfLidarProfileConfig.initProfileConfig().then((resp) => {
    this.ready = true;
    this.line = this.line;
    this.active = this.active;
    this.map = this.map;
    this.pointAttributes = this.gmfLidarProfileConfig.profileConfig.pointAttributes;
    this.pointAttributes.selectedOption = this.gmfLidarProfileConfig.profileConfig.pointAttributes.selectedOption;
  });
};

/**
 * @export
 * @return {Object} classification
 */
gmf.LidarPanelController.prototype.getClassification = function() {
  return this.gmfLidarProfileConfig.profileConfig.classification;
};

/**
 * @export
 * @return {Object} this.pointAttributes
 */
gmf.LidarPanelController.prototype.getPointAttributes = function() {
  return this.gmfLidarProfileConfig.profileConfig.pointAttributes.availableOptions;
};

/**
 * @export
 * @return {Object} this.pointAttributes
 */
gmf.LidarPanelController.prototype.getSelectedAttribute = function() {
  return this.gmfLidarProfileConfig.profileConfig.pointAttributes.selectedOption;
};

/**
 * @export
 * @param {string} material the material string code
 */
gmf.LidarPanelController.prototype.setDefaultAttribute = function(material) {
  this.gmfLidarProfileConfig.profileConfig.defaultAttribute = material;
  if (this.line) {
    gmf.lidarProfile.plot2canvas.changeStyle(material);
  }
};

/**
 * @export
 * @return {number} width of the profile
 */
gmf.LidarPanelController.prototype.getWidth = function() {
  this.profilWidth = this.gmfLidarProfileConfig.profileConfig.profilWidth;
  return this.gmfLidarProfileConfig.profileConfig.profilWidth;
};

/**
 * @export
 * @param {Object} classification the classification code
 * @param {number} key the classification code
 */
gmf.LidarPanelController.prototype.setClassification = function(classification, key) {
  this.gmfLidarProfileConfig.profileConfig.classification[key].visible = classification.visible;
  if (this.line) {
    gmf.lidarProfile.plot2canvas.setClassActive(this.gmfLidarProfileConfig.profileConfig.classification,
      this.gmfLidarProfileConfig.profileConfig.defaultAttribute);
  }
};

/**
 * @export
 * @param {number} profileWidth set the width using user inputs and redraw the profile
 */
gmf.LidarPanelController.prototype.setWidth = function(profileWidth) {
  this.gmfLidarProfileConfig.profileConfig.profilWidth = profileWidth;
  if (this.line) {
    this.gmfLidarProfileConfig.olLinestring = this.line;
    this.gmfLidarProfileConfig.map = this.map;
    gmf.lidarProfile.options.setOptions(this.gmfLidarProfileConfig);
    gmf.lidarProfile.loader.getProfileByLOD(0, true, this.gmfLidarProfileConfig.profileConfig.minLOD);
  }
};

/**
 * @export
 * @param {boolean} autoWidth use a precalculated profile width from pytree
 */
gmf.LidarPanelController.prototype.setAutoWidth = function(autoWidth) {
  this.gmfLidarProfileConfig.profileConfig.autoWidth = autoWidth;
  if (this.line) {
    this.gmfLidarProfileConfig.olLinestring = this.line;
    this.gmfLidarProfileConfig.map = this.map;
    gmf.lidarProfile.options.setOptions(this.gmfLidarProfileConfig);
    gmf.lidarProfile.loader.getProfileByLOD(0, true, this.gmfLidarProfileConfig.profileConfig.minLOD);
  }
};

/**
 * @export
 */
gmf.LidarPanelController.prototype.csvExport = function() {
  if (this.line) {
    gmf.lidarProfile.utils.getPointsInProfileAsCSV(gmf.lidarProfile.loader.profilePoints);
  }
};

/**
 * @export
 */
gmf.LidarPanelController.prototype.pngExport = function() {
  if (this.line) {
    gmf.lidarProfile.utils.exportToImageFile();
  }
};


gmf.module.controller('gmfLidarPanelController', gmf.LidarPanelController);

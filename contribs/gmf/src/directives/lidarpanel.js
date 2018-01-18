goog.provide('gmf.lidarPanelComponent');

goog.require('gmf');
goog.require('ngeo.lidarProfile');
goog.require('ngeo.lidarProfile.plot2canvas');
goog.require('ngeo.lidarProfile.utils');
goog.require('ol.geom.LineString');


ngeo.module.value('gmfLidarPanelTemplateUrl',
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
    this.getPointAttributes();
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
 */
gmf.LidarPanelController.prototype.getPointAttributes = function() {
  const attr = [];
  for (const key in this.gmfLidarProfileConfig.profileConfig.pointAttributes) {
    if (this.gmfLidarProfileConfig.profileConfig.pointAttributes[key].visible == 1) {
      attr.push(this.gmfLidarProfileConfig.profileConfig.pointAttributes[key]);
    }
  }
  this.pointAttributes = {
    availableOptions: attr,
    selectedOption: this.gmfLidarProfileConfig.profileConfig.pointAttributes[this.gmfLidarProfileConfig.profileConfig.defaultPointAttribute]
  };
};

/**
 * @export
 * @param {string} material the material string code
 */
gmf.LidarPanelController.prototype.setDefaultAttribute = function(material) {
  this.gmfLidarProfileConfig.profileConfig.defaultAttribute = material;
  if (this.line) {
    ngeo.lidarProfile.plot2canvas.changeStyle(material);
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
    ngeo.lidarProfile.plot2canvas.setClassActive(this.gmfLidarProfileConfig.profileConfig.classification,
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
    ngeo.lidarProfile.setOptions(this.gmfLidarProfileConfig);
    ngeo.lidarProfile.loader.getProfileByLOD(0, true, this.gmfLidarProfileConfig.profileConfig.minLOD);
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
    ngeo.lidarProfile.setOptions(this.gmfLidarProfileConfig);
    ngeo.lidarProfile.loader.getProfileByLOD(0, true, this.gmfLidarProfileConfig.profileConfig.minLOD);
  }
};

/**
 * @export
 */
gmf.LidarPanelController.prototype.csvExport = function() {
  if (this.line) {
    ngeo.lidarProfile.utils.getPointsInProfileAsCSV(ngeo.lidarProfile.loader.profilePoints);
  }
};

/**
 * @export
 */
gmf.LidarPanelController.prototype.pngExport = function() {
  if (this.line) {
    ngeo.lidarProfile.utils.exportToImageFile();
  }
};


gmf.module.controller('gmfLidarPanelController', gmf.LidarPanelController);

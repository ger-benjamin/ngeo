goog.provide('gmf.DisplayquerygridController');
goog.provide('gmf.displayquerygridDirective');

goog.require('gmf');
goog.require('ngeo.FeatureOverlay');
goog.require('ngeo.FeatureOverlayMgr');
goog.require('ol.Collection');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');


/**
 * Results of the query source.
 * @typedef {{
 *     core: Object,
 *     grid: Object,
 *     listeners: Array.<Object>,
 *     selection: Object
 * }}
 */
gmf.GridUIApi;


ngeo.module.value('gmfDisplayquerygridTemplateUrl',
    /**
     * @param {angular.JQLite} element Element.
     * @param {angular.Attributes} attrs Attributes.
     * @return {string} Template.
     */
    function(element, attrs) {
      var templateUrl = attrs['gmfDisplayquerygridTemplateurl'];
      return templateUrl !== undefined ? templateUrl :
          gmf.baseTemplateUrl + '/displayquerygrid.html';
    });


/**
 * Provide a directive to display results of the {@link ngeo.queryResult} in a
 * grid and shows related features on the map using
 * the {@link ngeo.FeatureOverlayMgr}.
 *
 * You can override the default directive's template by setting the
 * value `gmfDisplayquerygridTemplateUrl`.
 *
 * Features displayed on the map use a default style but you can override these
 * styles by passing ol.style.Style objects as attributes of this directive.
 *
 * Example:
 *
 *      <gmf-displayquerygrid
 *        gmf-displayquerygrid-featuresstyle="ctrl.styleForAllFeatures"
 *        gmf-displayquerygrid-selectedfeaturestyle="ctrl.styleForTheCurrentFeature">
 *      </gmf-displayquerygrid>
 *
 * @htmlAttribute {ol.style.Style} gmf-displayquerygrid-featuresstyle A style
 *     object for all features from the result of the query.
 * @htmlAttribute {ol.style.Style} selectedfeaturestyle A style
 *     object for the current displayed feature.
 * @param {string} gmfDisplayquerygridTemplateUrl URL to a template.
 * @return {angular.Directive} Directive Definition Object.
 * @ngInject
 * @ngdoc directive
 * @ngname gmfDisplayquerygrid
 */
gmf.displayquerygridDirective = function(
    gmfDisplayquerygridTemplateUrl) {
  return {
    bindToController: true,
    controller: 'GmfDisplayquerygridController',
    controllerAs: 'ctrl',
    templateUrl: gmfDisplayquerygridTemplateUrl,
    replace: true,
    restrict: 'E',
    scope: {
      'featuresStyleFn': '&gmfDisplayquerygridFeaturesstyle',
      'selectedFeatureStyleFn': '&gmfDisplayquerygridSourceselectedfeaturestyle'
    }
  };
};


gmf.module.directive('gmfDisplayquerygrid', gmf.displayquerygridDirective);


/**
 * @param {angular.Scope} $scope Angular scope.
 * @param {angular.$timeout} $timeout Angular timeout.
 * @param {ngeox.QueryResult} ngeoQueryResult ngeo query result.
 * @param {ngeo.FeatureOverlayMgr} ngeoFeatureOverlayMgr The ngeo feature
 *     overlay manager service.
 * @constructor
 * @export
 * @ngInject
 * @ngdoc Controller
 * @ngname GmfDisplayquerygridController
 */
gmf.DisplayquerygridController = function($scope, $timeout, ngeoQueryResult,
    ngeoFeatureOverlayMgr) {

  /**
   * @type {angular.Scope}
   * @private
   */
  this.$scope_ = $scope;

  /**
   * @type {angular.$timeout}
   * @private
   */
  this.$timeout_ = $timeout;

  /**
   * @type {ngeox.QueryResult}
   * @export
   */
  this.ngeoQueryResult = ngeoQueryResult;

  /**
   * @type {boolean}
   * @private
   */
  this.removeEmptyColumns_ = false;

  /**
   * @type {number}
   * @private
   */
  this.maxResults_ = 200;

  /**
   * @type {boolean}
   * @export
   */
  this.tooManyResults = false;

  /**
   * @type {!Object.<number|string, gmfx.GridSource>}
   * @export
   */
  this.gridSources = {};

  /**
   * @type {!Object.<number|string, gmf.GridUIApi>}
   * @export
   */
  this.gridUIApis = {};

  /**
   * @type {string}
   * @export
   */
  this.selectedTab;

  /**
   * @type {Object}
   * @private
   */
  this.gridUIOptionsModel_ = {
    enableColumnResizing: true,
    enableRowHeaderSelection: false,
    enableRowSelection: true,
    enableSelectAll: true,
    multiSelect: true
  };

  /**
   * @type {ol.Collection}
   * @private
   */
  this.features_ = new ol.Collection();

  var featuresOverlay = ngeoFeatureOverlayMgr.getFeatureOverlay();
  var featuresStyle = this['featuresStyleFn']();
  if (featuresStyle !== undefined) {
    goog.asserts.assertInstanceof(featuresStyle, ol.style.Style);
    featuresOverlay.setStyle(featuresStyle);
  }
  featuresOverlay.setFeatures(this.features_);

  /**
   * @type {ngeo.FeatureOverlay}
   * @private
   */
  this.highlightFeatureOverlay_ = ngeoFeatureOverlayMgr.getFeatureOverlay();

  /**
   * @type {ol.Collection}
   * @private
   */
  this.highlightFeatures_ = new ol.Collection();
  this.highlightFeatureOverlay_.setFeatures(this.highlightFeatures_);

  var highlightFeatureStyle = this['selectedFeatureStyleFn']();
  if (highlightFeatureStyle !== undefined) {
    goog.asserts.assertInstanceof(highlightFeatureStyle, ol.style.Style);
  } else {
    var fill = new ol.style.Fill({color: [255, 0, 0, 0.6]});
    var stroke = new ol.style.Stroke({color: [255, 0, 0, 1], width: 2});
    highlightFeatureStyle = new ol.style.Style({
      fill: fill,
      image: new ol.style.Circle({fill: fill, radius: 5, stroke: stroke}),
      stroke: stroke
    });
  }
  this.highlightFeatureOverlay_.setStyle(highlightFeatureStyle);

  this.$scope_.$watchCollection(
      function() {
        return ngeoQueryResult;
      },
      function(newQueryResult, oldQueryResult) {
        if (newQueryResult !== oldQueryResult) {
          this.updateData_();
        }
      }.bind(this));

  this.COUNT = 0;
};


/**
 * @export
 */
gmf.DisplayquerygridController.prototype.debug = function() {
  //debugger;
};


/**
 * @private
 */
gmf.DisplayquerygridController.prototype.updateData_ = function() {
  this.clear();
  if (this.ngeoQueryResult.total > this.maxResults_) {
    this.tooManyResults = true;
    return;
  }
  this.collectData_();

  var ids = Object.keys(this.gridSources);
  if (ids.length > 0) {
    this.selectedTab = this.gridSources[ids[0]].source.label;
  }
};


/**
 * Collect all features in the queryResult object.
 * @private
 */
gmf.DisplayquerygridController.prototype.collectData_ = function() {
  var sources = this.ngeoQueryResult.sources;
  this.features_.clear();
  for (var i = 0; i < sources.length; i++) {
    var source = sources[i];
    var features = source.features;
    if (features.length === 0) {
      continue;
    }
    var allProperties = [];
    var featureGeometriesNames = [];
    var feature, properties, featureGeometryName;
    for (var ii = 0; ii < features.length; ii++) {
      feature = features[ii];
      properties = feature.getProperties();
      featureGeometryName = feature.getGeometryName();
      if (featureGeometriesNames.indexOf(featureGeometryName) === -1) {
        featureGeometriesNames.push(featureGeometryName);
      }
      if (properties !== undefined) {
        allProperties.push(properties);
        this.features_.push(feature);
      }
    }

    this.cleanProperties_(allProperties, featureGeometriesNames);
    if (allProperties.length > 0) {
      this.makeGrid_(allProperties, source);
    }
  }
};


/**
 * @param {Array.<Object>} data TODO.
 * @param {ngeox.QueryResultSource} source TODO.
 * @private
 */
gmf.DisplayquerygridController.prototype.makeGrid_ = function(data, source) {
  var sourceId = source.id;
  this.gridSources[sourceId] = {
    gridUIOptions: this.getGridUIOptions_(data, sourceId),
    isLoading: true,
    source: source
  };

  // The timeout stand for: On grid ready, do:
  this.$timeout_(function() {
    var gridSource = this.gridSources[sourceId];
    var gridUIApi = this.gridUIApis[sourceId];
    // Wait that the the first tab is ready to deactivate the spinner.
    if (this.selectedTab === gridSource.source.label && gridUIApi) {
      gridUIApi['core']['handleWindowResize']().then(function() {
        gridSource.isLoading = false;
      });
    } else {
      // Deactivate spinner on others tab in all case
      gridSource.isLoading = false;
    }
  }.bind(this));
};


/**
 * @param {Object} data TODO
 * @param {number|string} gridSourceId TODO
 * @return {Object} TODO
 * @private
 */
gmf.DisplayquerygridController.prototype.getGridUIOptions_ = function(
    data, gridSourceId) {
  var columns = Object.keys(data[0]);
  var columnDefs = [];
  columns.forEach(function(column) {
    columnDefs.push({
      field: column,
      minWidth: 150
    });
  });
  // Disable last column resizing
  columnDefs[columns.length - 1].enableColumnResizing = false;

  var gridUIOptions = {
    data: data,
    columnDefs: columnDefs
  };
  goog.object.extend(gridUIOptions, this.gridUIOptionsModel_);

  gridUIOptions['onRegisterApi'] = function(gridUIApi) {
    this.gridUIApis[gridSourceId] = gridUIApi;
  }.bind(this);

  return gridUIOptions;
};


/**
 * Remove the current selected feature and source and remove all features
 * from the map.
 * @export
 */
gmf.DisplayquerygridController.prototype.clear = function() {
  this.gridSources = {};
  this.source = null;
  this.selectedSource = null;
  this.tooManyResults = false;
  this.features_.clear();
  this.highlightFeatures_.clear();
};

/**
 * TODO
 * @param {Array.<Object>} allProperties TODO.
 * @param {Array.<string>} featureGeometriesNames TODO.
 * @private
 */
gmf.DisplayquerygridController.prototype.cleanProperties_ = function(
    allProperties, featureGeometriesNames) {
  allProperties.forEach(function(properties) {
    featureGeometriesNames.forEach(function(featureGeometryName) {
      delete properties[featureGeometryName];
    });
    delete properties['boundedBy'];
  });

  if (this.removeEmptyColumns_ === true) {
    var keysToKeep = [];
    var i, key;
    for (key in allProperties[0]) {
      for (i = 0; i < allProperties.length; i++) {
        if (allProperties[i][key] !== undefined) {
          keysToKeep.push(key);
          break;
        }
      }
    }
    var keyToRemove;
    allProperties.forEach(function(properties) {
      keyToRemove = [];
      for (key in properties) {
        if (keysToKeep.indexOf(key) === -1) {
          keyToRemove.push(key);
        }
      }
      keyToRemove.forEach(function(key) {
        delete properties[key];
      });
    });
  }
};


/**
 * @param {gmfx.GridSource} gridSource TODO
 * @export
 */
gmf.DisplayquerygridController.prototype.onSelectTab = function(gridSource) {
  var source = gridSource.source;
  this.selectedTab = source.label;
  this.$timeout_(function() {
    var gridUIApi = this.gridUIApis[source.id];
    if (gridUIApi) {
      gridUIApi['core']['handleWindowResize']();
    }
  }.bind(this));
};


gmf.module.controller('GmfDisplayquerygridController',
    gmf.DisplayquerygridController);

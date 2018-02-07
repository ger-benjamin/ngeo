goog.provide('gmf.lidarProfile.Config');

goog.require('gmf');


gmf.lidarProfile.Config = class {

  /**
   * Configuration service to configure the gmf.lidarPanelComponent and gmf.lidarProfile instance
   * Requires a Pytree service: https://github.com/sitn/pytree
   *
   * @struct
   * @param {angular.$http} $http Angular http service.
   * @param {string} pytreeLidarProfileJsonUrl pytree Lidar profile URL.
   * @ngInject
   * @ngdoc service
   * @ngname gmfLidarProfileConfig
   */
  constructor($http, pytreeLidarProfileJsonUrl) {

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
     * @type {Object}
     */
    this.profileConfig = {
      margin: {
        'left': 40,
        'top': 10,
        'right': 200,
        'bottom': 40
      },
      tolerance: 5,
      configLoaded: false,
      pointAttributes: {},
      pointAttributesRaw: null,
      classification: null
    };
  }


  /**
   * Initialize the service variables from Pytree profile_config_gmf2 route
   * @export
   * @return {Object} configuration values
   */
  initProfileConfig() {
    return this.$http_.get(`${this.pytreeLidarProfileJsonUrl_}/profile_config_gmf2`).then((resp) => {

      this.profileConfig.classification = resp.data['classification_colors'];
      this.profileConfig.profilWidth = resp.data['width'];
      this.profileConfig.autoWidth = true;
      this.profileConfig.minLOD = resp.data['minLOD'];
      this.profileConfig.initialLOD = resp.data['initialLOD'];
      this.profileConfig.pointSize = resp.data['point_size'];
      this.profileConfig.maxLevels = resp.data['max_levels'];
      this.profileConfig.maxPoints = resp.data['max_point_number'];
      this.profileConfig.pointSum = 0;
      this.profileConfig.defaultAttribute = resp.data['default_attribute'];
      this.profileConfig.defaultPointCloud = resp.data['default_point_cloud'];
      this.profileConfig.defaultColor = resp.data['default_color'];
      this.profileConfig.pointClouds = resp.data['pointclouds'];
      this.profileConfig.pointAttributesRaw = resp.data['point_attributes'];
      this.profileConfig.defaultPointAttribute = resp.data['default_point_attribute'];
      this.profileConfig.debug = resp.data['debug'];

      const attr = [];
      for (const key in this.profileConfig.pointAttributesRaw) {
        if (this.profileConfig.pointAttributesRaw[key].visible == 1) {
          attr.push(this.profileConfig.pointAttributesRaw[key]);
        }
      }

      const selectedMat = this.profileConfig.pointAttributesRaw[this.profileConfig.defaultPointAttribute];

      this.profileConfig.pointAttributes = {
        availableOptions: attr,
        selectedOption: selectedMat
      };
    });
  }
};

gmf.module.service('gmfLidarProfileConfig', gmf.lidarProfile.Config);

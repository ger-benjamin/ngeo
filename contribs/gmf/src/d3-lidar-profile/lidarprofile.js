goog.provide('gmf.lidarProfile');


gmf.lidarProfile = function(options) {

  /**
  * @type {Object}
  */
  this.options_ = options;

  /**
  * @type {Object}
  */
  const parent = this;

  /**
  * @type {Object}
  */
  this.plot = new gmf.lidarProfile.plot(options, parent);

  /**
  * @type {Object}
  */
  this.loader = new gmf.lidarProfile.loader(options, this.plot);

  /**
  * @type {Object}
  */
  this.measure = new gmf.lidarProfile.measure(options, parent);


};

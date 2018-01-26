goog.provide('gmf.lidarProfile');


gmf.lidarProfile = function(options) {

  this.options_ = options;

  const parent = this;

  this.plot = new gmf.lidarProfile.plot(options, parent);

  this.loader = new gmf.lidarProfile.loader(options, this.plot);


};

gmf.lidarProfile.prototype.printOptions = function() {
  console.log('printOptions');
  console.log(this.options_);

};

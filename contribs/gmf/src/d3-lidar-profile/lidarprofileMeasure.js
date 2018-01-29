goog.provide('gmf.lidarProfile.measure');


/**
* @constructor
* @param {Object} options to be defined in gmfx
* @param {Object} parent the parent class
*/
gmf.lidarProfile.measure = function(options, parent) {

/**
* @type {Object}
*/
  this.options_ = options;

  /**
  * @type {Object}
  */
  this.profileMeasure;

  /**
  * @type {Object}
  */
  this.parent_ = parent;


};

/**
* Clear the current measure
* @export
*/
gmf.lidarProfile.measure.prototype.clearMeasure = function() {

  this.profileMeasure = {
    pStart: {
      set: false
    },
    pEnd: {
      set: false
    }
  };

  const svg = d3.select('svg#profileSVG');
  svg.selectAll('#text_m').remove();
  svg.selectAll('#start_m').remove();
  svg.selectAll('#end_m').remove();
  svg.selectAll('#line_m').remove();

  d3.select('#height_measure').html('');

};

/**
* Activate the measure tool
* @param {boolean} active state of the measure tool
* @export
*/
gmf.lidarProfile.measure.prototype.setMeasureActive = function(active) {

  const that = this;

  function measureHeigt() {

    const canvasCoordinates = d3.mouse(d3.select('#profileCanvas').node());
    const margin = that.options_.profileConfig.margin;
    const svgCoordinates = d3.mouse(this);
    const xs = svgCoordinates[0];
    const ys = svgCoordinates[1];
    const tolerance = 2;
    const sx = that.options_.profileConfig.scaleX;
    const sy = that.options_.profileConfig.scaleY;
    const pointSize = 3;
    const p = that.parent_.loader.utils.getClosestPoint(that.parent_.loader.profilePoints, canvasCoordinates[0], canvasCoordinates[1], tolerance);

    if (!that.profileMeasure.pStart.set) {
      if (p !== undefined) {

        that.profileMeasure.pStart.distance = p.distance;
        that.profileMeasure.pStart.altitude = p.altitude;
        that.profileMeasure.pStart.cx = sx(p.distance) + margin.left;
        that.profileMeasure.pStart.cy = sy(p.altitude) + margin.top;

      } else {

        that.profileMeasure.pStart.distance = sx.invert(xs);
        that.profileMeasure.pStart.altitude = sy.invert(ys);
        that.profileMeasure.pStart.cx = xs;
        that.profileMeasure.pStart.cy = ys;

      }

      that.profileMeasure.pStart.set = true;
      d3.select('svg#profileSVG').append('circle')
        .attr('id', 'start_m')
        .attr('cx', that.profileMeasure.pStart.cx)
        .attr('cy', that.profileMeasure.pStart.cy)
        .attr('r', pointSize)
        .style('fill', 'red');

    } else if (!that.profileMeasure.pEnd.set) {
      if (p !== undefined) {

        that.profileMeasure.pEnd.distance = p.distance;
        that.profileMeasure.pEnd.altitude = p.altitude;
        that.profileMeasure.pEnd.cx = sx(p.distance) + margin.left;
        that.profileMeasure.pEnd.cy = sy(p.altitude) + margin.top;
      } else {
        that.profileMeasure.pEnd.distance = sx.invert(xs);
        that.profileMeasure.pEnd.altitude = sy.invert(ys);
        that.profileMeasure.pEnd.cx = xs;
        that.profileMeasure.pEnd.cy = ys;

      }

      that.profileMeasure.pEnd.set = true;
      d3.select('svg#profileSVG').append('circle')
        .attr('id', 'end_m')
        .attr('cx', that.profileMeasure.pEnd.cx)
        .attr('cy', that.profileMeasure.pEnd.cy)
        .attr('r', pointSize)
        .style('fill', 'red');

      d3.select('svg#profileSVG').append('line')
        .attr('id', 'line_m')
        .attr('x1', that.profileMeasure.pStart.cx)
        .attr('y1', that.profileMeasure.pStart.cy)
        .attr('x2', that.profileMeasure.pEnd.cx)
        .attr('y2', that.profileMeasure.pEnd.cy)
        .attr('stroke-width', 2)
        .attr('stroke', 'red');

    } else {

      that.startMeasure();

    }

    const dH = that.profileMeasure.pEnd.altitude - that.profileMeasure.pStart.altitude;
    const dD = that.profileMeasure.pEnd.distance - that.profileMeasure.pStart.distance;

    const height = Math.round(10 * Math.sqrt(Math.pow(dH, 2) + Math.pow(dD, 2))) / 10;

    if (!isNaN(height)) {
      d3.select('#height_measure').html(`Hauteur: ${height}</p>`);
      d3.select('svg#profileSVG').append('text')
        .attr('id', 'text_m')
        .attr('x', 10 + (that.profileMeasure.pStart.cx + that.profileMeasure.pEnd.cx) / 2)
        .attr('y', (that.profileMeasure.pStart.cy + that.profileMeasure.pEnd.cy) / 2)
        .text(`${height} m`)
        .attr('font-family', 'sans-serif')
        .attr('font-size', '14px')
        .style('font-weight', 'bold')
        .attr('fill', 'red');
    }
  }

  if (active) {
    this.clearMeasure();
    d3.select('svg#profileSVG').on('click', measureHeigt);
  } else {
    this.clearMeasure();
    d3.select('svg#profileSVG').on('click', null);
  }
};

gmf.lidarProfile.measure.prototype.startMeasure = function() {
  this.clearMeasure();
  d3.select('svg#profileSVG').on('click', this.measureHeight);
};

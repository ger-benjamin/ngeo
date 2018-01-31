goog.provide('gmf.lidarProfile.measure');


/**
* Measure tool for the d3 chart
* @constructor
* @param {Object} options to be defined in gmfx
* @param {gmf.lidarProfile} parent instance
*/
gmf.lidarProfile.measure = function(options, parent) {

/**
* @type {Object}
* @private
*/
  this.options_ = options;

  /**
  * @type {gmfx.lidarMeasure}
  * @private
  */
  this.profileMeasure_ = {
    pStart: {
      distance: undefined,
      altitude: undefined,
      color_packed: [],
      coords: [],
      intensity: undefined,
      classification: undefined,
      set: false
    },
    pEnd: {
      distance: undefined,
      altitude: undefined,
      color_packed: [],
      coords: [],
      intensity: undefined,
      classification: undefined,
      set: false
    }
  };

  /**
  * @type {gmf.lidarProfile}
  * @private
  */
  this.parent_ = parent;


};

/**
* Clear the current measure
* @export
*/
gmf.lidarProfile.measure.prototype.clearMeasure = function() {

  this.profileMeasure_ = {
    pStart: {
      distance: undefined,
      altitude: undefined,
      color_packed: [],
      coords: [],
      intensity: undefined,
      classification: undefined,
      set: false
    },
    pEnd: {
      distance: undefined,
      altitude: undefined,
      color_packed: [],
      coords: [],
      intensity: undefined,
      classification: undefined,
      set: false
    }
  };

  const svg = d3.select('svg#profileSVG');
  svg.selectAll('#text_m').remove();
  svg.selectAll('#start_m').remove();
  svg.selectAll('#end_m').remove();
  svg.selectAll('#line_m').remove();

  d3.select('#height_measure').html('');
  d3.select('svg#profileSVG').on('click', null);

  d3.select('svg#profileSVG').style('cursor', 'default');


};

/**
* Activate the measure tool
* @export
*/
gmf.lidarProfile.measure.prototype.setMeasureActive = function() {

  const that = this;
  d3.select('svg#profileSVG').style('cursor', 'pointer');

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
    if (!that.profileMeasure_.pStart.set) {

      if (p !== undefined) {

        that.profileMeasure_.pStart.distance = p.distance;
        that.profileMeasure_.pStart.altitude = p.altitude;
        that.profileMeasure_.pStart.cx = sx(p.distance) + margin.left;
        that.profileMeasure_.pStart.cy = sy(p.altitude) + margin.top;

      } else {

        that.profileMeasure_.pStart.distance = sx.invert(xs);
        that.profileMeasure_.pStart.altitude = sy.invert(ys);
        that.profileMeasure_.pStart.cx = xs;
        that.profileMeasure_.pStart.cy = ys;

      }

      that.profileMeasure_.pStart.set = true;
      d3.select('svg#profileSVG').append('circle')
        .attr('id', 'start_m')
        .attr('cx', that.profileMeasure_.pStart.cx)
        .attr('cy', that.profileMeasure_.pStart.cy)
        .attr('r', pointSize)
        .style('fill', 'red');

    } else if (!that.profileMeasure_.pEnd.set) {
      if (p !== undefined) {

        that.profileMeasure_.pEnd.distance = p.distance;
        that.profileMeasure_.pEnd.altitude = p.altitude;
        that.profileMeasure_.pEnd.cx = sx(p.distance) + margin.left;
        that.profileMeasure_.pEnd.cy = sy(p.altitude) + margin.top;
      } else {
        that.profileMeasure_.pEnd.distance = sx.invert(xs);
        that.profileMeasure_.pEnd.altitude = sy.invert(ys);
        that.profileMeasure_.pEnd.cx = xs;
        that.profileMeasure_.pEnd.cy = ys;

      }

      that.profileMeasure_.pEnd.set = true;
      d3.select('svg#profileSVG').append('circle')
        .attr('id', 'end_m')
        .attr('cx', that.profileMeasure_.pEnd.cx)
        .attr('cy', that.profileMeasure_.pEnd.cy)
        .attr('r', pointSize)
        .style('fill', 'red');

      d3.select('svg#profileSVG').append('line')
        .attr('id', 'line_m')
        .attr('x1', that.profileMeasure_.pStart.cx)
        .attr('y1', that.profileMeasure_.pStart.cy)
        .attr('x2', that.profileMeasure_.pEnd.cx)
        .attr('y2', that.profileMeasure_.pEnd.cy)
        .attr('stroke-width', 2)
        .attr('stroke', 'red');

    }

    if (that.profileMeasure_.pStart.set && that.profileMeasure_.pEnd.set) {
      const dH = that.profileMeasure_.pEnd.altitude - that.profileMeasure_.pStart.altitude;
      const dD = that.profileMeasure_.pEnd.distance - that.profileMeasure_.pStart.distance;

      const height = Math.round(10 * Math.sqrt(Math.pow(dH, 2) + Math.pow(dD, 2))) / 10;

      if (!isNaN(height)) {
        d3.select('#height_measure').html(`Hauteur: ${height}</p>`);
        d3.select('svg#profileSVG').append('text')
          .attr('id', 'text_m')
          .attr('x', 10 + (that.profileMeasure_.pStart.cx + that.profileMeasure_.pEnd.cx) / 2)
          .attr('y', (that.profileMeasure_.pStart.cy + that.profileMeasure_.pEnd.cy) / 2)
          .text(`${height} m`)
          .attr('font-family', 'sans-serif')
          .attr('font-size', '14px')
          .style('font-weight', 'bold')
          .attr('fill', 'red');
      }
      that.profileMeasure_.pEnd.set = false;
      that.profileMeasure_.pStart.set = false;
    }

  }

  d3.select('svg#profileSVG').on('click', measureHeigt);

};

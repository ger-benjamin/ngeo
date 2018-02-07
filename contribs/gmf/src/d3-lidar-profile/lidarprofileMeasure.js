goog.provide('gmf.lidarProfile.Measure');


gmf.lidarProfile.Measure = class {

  /**
   * Measure tool for the d3 chart
   * @struct
   * @param {gmf.lidarProfile.Manager} gmfLidarProfileManagerInstance gmf lidar profile manager instance
   */
  constructor(gmfLidarProfileManagerInstance) {

    /**
     * @type {gmf.lidarProfile.Manager}
     * @private
     */
    this.manager_ = gmfLidarProfileManagerInstance;

    /**
     * @type {!gmfx.lidarPoint}
     * @private
     */
    this.pStart_ = {};

    /**
     * @type {!gmfx.lidarPoint}
     * @private
     */
    this.pEnd_ = {};
  }


  /**
   * Clear the current measure
   * @export
   */
  clearMeasure() {
    this.pStart_ = {};
    this.pEnd_ = {};

    const svg = d3.select('svg#profileSVG');
    svg.selectAll('#text_m').remove();
    svg.selectAll('#start_m').remove();
    svg.selectAll('#end_m').remove();
    svg.selectAll('#line_m').remove();

    d3.select('#height_measure').html('');
    d3.select('svg#profileSVG').on('click', null);

    d3.select('svg#profileSVG').style('cursor', 'default');
  }


  /**
   * Activate the measure tool
   * @export
   */
  setMeasureActive() {
    d3.select('svg#profileSVG').style('cursor', 'pointer');
    d3.select('svg#profileSVG').on('click', this.measureHeigt.bind(this));
  }


  /**
   * FIXME missing description
   */
  measureHeigt() {
    const canvasCoordinates = d3.mouse(d3.select('#profileCanvas').node());
    const margin = this.manager_.options.profileConfig.client.margin;
    const svgCoordinates = d3.mouse(d3.select('svg#profileSVG').node());
    const xs = svgCoordinates[0];
    const ys = svgCoordinates[1];
    const tolerance = 2;
    const sx = this.manager_.plot.scaleX;
    const sy = this.manager_.plot.scaleY;
    const pointSize = 3;
    const p = this.manager_.loader.utils.getClosestPoint(this.manager_.loader.profilePoints,
      canvasCoordinates[0], canvasCoordinates[1], tolerance, this.manager_.plot.scaleX, this.manager_.plot.scaleY);
    if (!this.pStart_.set) {

      if (p !== undefined) {
        this.pStart_.distance = p.distance;
        this.pStart_.altitude = p.altitude;
        this.pStart_.cx = sx(p.distance) + margin.left;
        this.pStart_.cy = sy(p.altitude) + margin.top;
      } else {
        this.pStart_.distance = sx['invert'](xs);
        this.pStart_.altitude = sy['invert'](ys);
        this.pStart_.cx = xs;
        this.pStart_.cy = ys;
      }

      this.pStart_.set = true;
      d3.select('svg#profileSVG').append('circle')
        .attr('id', 'start_m')
        .attr('cx', this.pStart_.cx)
        .attr('cy', this.pStart_.cy)
        .attr('r', pointSize)
        .style('fill', 'red');

    } else if (!this.pEnd_.set) {
      if (p !== undefined) {

        this.pEnd_.distance = p.distance;
        this.pEnd_.altitude = p.altitude;
        this.pEnd_.cx = sx(p.distance) + margin.left;
        this.pEnd_.cy = sy(p.altitude) + margin.top;
      } else {
        this.pEnd_.distance = sx['invert'](xs);
        this.pEnd_.altitude = sy['invert'](ys);
        this.pEnd_.cx = xs;
        this.pEnd_.cy = ys;

      }

      this.pEnd_.set = true;
      d3.select('svg#profileSVG').append('circle')
        .attr('id', 'end_m')
        .attr('cx', this.pEnd_.cx)
        .attr('cy', this.pEnd_.cy)
        .attr('r', pointSize)
        .style('fill', 'red');

      d3.select('svg#profileSVG').append('line')
        .attr('id', 'line_m')
        .attr('x1', this.pStart_.cx)
        .attr('y1', this.pStart_.cy)
        .attr('x2', this.pEnd_.cx)
        .attr('y2', this.pEnd_.cy)
        .attr('stroke-width', 2)
        .attr('stroke', 'red');

    }

    if (this.pStart_.set && this.pEnd_.set) {
      const dH = this.pEnd_.altitude - this.pStart_.altitude;
      const dD = this.pEnd_.distance - this.pStart_.distance;

      const height = Math.round(10 * Math.sqrt(Math.pow(dH, 2) + Math.pow(dD, 2))) / 10;

      if (!isNaN(height)) {
        d3.select('#height_measure').html(`Hauteur: ${height}</p>`);
        d3.select('svg#profileSVG').append('text')
          .attr('id', 'text_m')
          .attr('x', 10 + (this.pStart_.cx + this.pEnd_.cx) / 2)
          .attr('y', (this.pStart_.cy + this.pEnd_.cy) / 2)
          .text(`${height} m`)
          .attr('font-family', 'sans-serif')
          .attr('font-size', '14px')
          .style('font-weight', 'bold')
          .attr('fill', 'red');
      }
      this.pEnd_.set = false;
      this.pStart_.set = false;
    }
  }
};

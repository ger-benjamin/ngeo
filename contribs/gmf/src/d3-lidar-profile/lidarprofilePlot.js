goog.provide('gmf.lidarProfile.plot');
goog.require('gmf.lidarProfile.measure');

/**
* @constructor
* @param {Object} options to be defined in gmfx
* @param {Class} parent to be defined in gmfx
*/
gmf.lidarProfile.plot = function(options, parent) {

/**
 * @type {Object}
 */
  this.options = options;

  this.parent_ = parent;

  this.utils = new gmf.lidarProfile.utils(options, null);

};

/**
 * Draw the points to the canvas element
 * @param {gmfx.LidarProfilePoints} points Object containing arrays of point properties
 * @param {string} material material used to determine point color
 * @export
*/
gmf.lidarProfile.plot.prototype.drawPoints = function(points, material) {
  let i = -1;
  const n = points.distance.length;
  let cx, cy;
  const ctx = d3.select('#profileCanvas').node().getContext('2d');
  const profileConfig = this.options.profileConfig;

  while (++i < n) {

    const distance = points.distance[i];
    const altitude = points.altitude[i];
    const rgb = points.color_packed[i];
    const intensity = points.intensity[i];
    const classification = points.classification[i];
    if (profileConfig.classification[classification] && profileConfig.classification[classification].visible) {

      cx = profileConfig.scaleX(distance);
      cy = profileConfig.scaleY(altitude);

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      if (material == 'COLOR_PACKED') {
        ctx.fillStyle = `RGB(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
      } else if (material == 'INTENSITY') {
        ctx.fillStyle = `RGB(${intensity}, ${intensity}, ${intensity})`;
      } else if (material == 'CLASSIFICATION') {
        ctx.fillStyle = `RGB(${profileConfig.classification[classification].color})`;
      } else {
        ctx.fillStyle = profileConfig.defaultColor;
      }
      ctx.arc(cx, cy, profileConfig.pointSize, 0, 2 * Math.PI, false);
      ctx.fill();
    }
  }
};

/**
 * Setupt the SVG components of the d3 chart
 * @param {Array.<number>} rangeX range of the x scale
 * @param {Array.<number>} rangeY range of the y scale
 * @export
*/
gmf.lidarProfile.plot.prototype.setupPlot = function(rangeX, rangeY) {

  const canvasEl = d3.select('#profileCanvas').node();
  const ctx = d3.select('#profileCanvas')
    .node().getContext('2d');
  ctx.clearRect(0, 0, canvasEl.getBoundingClientRect().width, canvasEl.getBoundingClientRect().height);

  const margin = this.options.profileConfig.margin;
  const containerWidth = d3.select('.gmf-lidar-profile-container').node().getBoundingClientRect().width;
  const containerHeight = d3.select('.gmf-lidar-profile-container').node().getBoundingClientRect().height;
  const width = containerWidth - (margin.left + margin.right);
  const height = containerHeight - (margin.top + margin.bottom);
  d3.select('#profileCanvas')
    .attr('height', height)
    .attr('width', width)
    .style('background-color', 'black')
    .style('z-index', 0)
    .style('position', 'absolute')
    .style('margin-left', `${margin.left.toString()}px`)
    .style('margin-top', `${margin.top.toString()}px`);

  const domainProfileWidth = rangeX[1] - rangeX[0];
  const domainProfileHeight = rangeY[1] - rangeY[0];
  const domainRatio = domainProfileWidth / domainProfileHeight;
  const rangeProfileWidth = width;
  const rangeProfileHeight = height;
  const rangeRatio = rangeProfileWidth / rangeProfileHeight;

  let sx, sy, domainScale;
  if (domainRatio < rangeRatio) {
    const domainScale = rangeRatio / domainRatio;
    const domainScaledWidth = domainProfileWidth * domainScale;
    sx = d3.scaleLinear()
      .domain([0, domainScaledWidth])
      .range([0, width]);
    sy = d3.scaleLinear()
      .domain(rangeY)
      .range([height, 0]);
  } else {
    domainScale =  domainRatio / rangeRatio;
    const domainScaledHeight = domainProfileHeight * domainScale;
    const domainHeightCentroid = (rangeY[1] + rangeY[0]) / 2;
    sx = d3.scaleLinear()
      .domain(rangeX)
      .range([0, width]);
    sy = d3.scaleLinear()
      .domain([
        domainHeightCentroid - domainScaledHeight / 2,
        domainHeightCentroid + domainScaledHeight / 2])
      .range([height, 0]);
  }

  this.options.profileConfig.scaleX = sx;
  this.options.profileConfig.scaleY = sy;
  const that = this;
  function zoomed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'mousemove') {
      if (d3.event.sourceEvent.movementX == 0 && d3.event.sourceEvent.movementY == 0) {
        return;
      }
    }

    gmf.lidarProfile.measure.clearMeasure();

    const tr = d3.event.transform;
    const svg = d3.select('svg#profileSVG');
    const xAxis = d3.axisBottom(sx);
    const yAxis = d3.axisLeft(sy)
      .tickSize(-width);
    svg.select('.x.axis').call(xAxis.scale(tr.rescaleX(sx)));
    svg.select('.y.axis').call(yAxis.scale(tr.rescaleY(sy)));
    ctx.clearRect(0, 0, width, height);

    svg.select('.y.axis').selectAll('g.tick line')
      .style('opacity', '0.5')
      .style('stroke', '#b7cff7');

    that.options.profileConfig.currentZoom = tr.k;
    that.options.profileConfig.scaleX = tr.rescaleX(sx);
    that.options.profileConfig.scaleY = tr.rescaleY(sy);
  }

  const zoom = d3.zoom()
    .scaleExtent([1, 100])
    .translateExtent([[0, 0], [width, height]])
    .extent([[0, 0], [width, height]])
    .on('zoom', zoomed);

  function zoomEnd() {
    ctx.clearRect(0, 0, width, height);
    that.parent_.loader.updateData();
  }
  zoom.on('end', zoomEnd);
  // TODO: check behaviour!!
  // zoom.on('start', this.loader.abortPendingRequests);

  d3.select('svg#profileSVG')
    .call(zoom)
    .on('dblclick.zoom', null);


  d3.select('svg#profileSVG').selectAll('*').remove();
  const svg = d3.select('svg#profileSVG')
    .attr('width', width + margin.left)
    .attr('height', height + margin.top + margin.bottom);

  d3.select('svg#profileSVG')
    .on('mousemove', function() {
      that.pointHighlight(that);
    });


  const xAxis = d3.axisBottom(sx);
  const yAxis = d3.axisLeft(sy)
    .tickSize(-width);

  svg.select('.y.axis').selectAll('g.tick line').style('stroke', '#b7cff7');

  svg.append('g')
    .attr('class', 'y axis')
    .call(yAxis);

  svg.append('g')
    .attr('class', 'x axis')
    .call(xAxis);

  svg.select('.y.axis').attr('transform', `translate(${margin.left}, ${margin.top})`);
  svg.select('.x.axis').attr('transform', `translate(${margin.left}, ${height + margin.top})`);

  svg.select('.y.axis').selectAll('g.tick line')
    .style('opacity', '0.5')
    .style('stroke', '#b7cff7');

  this.options.profileConfig.previousDomainX = sx.domain();
  this.options.profileConfig.previousDomainY = sy.domain();

};

/**
 * Update the Openlayers overlay that shows point position and attributes
 * @export
 * @param {Object} that scope of the plot class
*/
gmf.lidarProfile.plot.prototype.pointHighlight = function(that) {

  const svg = d3.select('svg#profileSVG');
  const pointSize = that.options.profileConfig.pointSize;
  const margin = that.options.profileConfig.margin;
  const tolerance = that.options.profileConfig.tolerance;

  const canvasCoordinates = d3.mouse(d3.select('#profileCanvas').node());
  const sx = that.options.profileConfig.scaleX;
  const sy = that.options.profileConfig.scaleY;
  let cx, cy;
  const p = that.utils.getClosestPoint(that.parent_.loader.profilePoints, canvasCoordinates[0], canvasCoordinates[1], tolerance);
  if (p != undefined) {

    cx = sx(p.distance) + margin.left;
    cy = sy(p.altitude) + margin.top;

    svg.selectAll('#highlightCircle').remove();

    d3.select('svg#profileSVG').append('circle')
      .attr('id', 'highlightCircle')
      .attr('cx', cx)
      .attr('cy', cy)
      .attr('r', pointSize + 1)
      .style('fill', 'orange');

    const html = `Distance: ${Math.round(10 * p.distance) / 10}<br>
    Altitude: ${Math.round(10 * p.altitude) / 10}<br>
    Classification: ${this.options.profileConfig.classification[p.classification].name}<br>
    Intensity: ${p.intensity}<br>`;

    d3.select('#profileInfo')
      .html(html);
    this.parent_.loader.cartoHighlight.setElement(null);
    const el = document.createElement('div');
    el.className += 'tooltip gmf-tooltip-measure';
    el.innerHTML = html;

    this.parent_.loader.cartoHighlight.setElement(el);
    this.parent_.loader.cartoHighlight.setPosition([p.coords[0], p.coords[1]]);
    const classifColor = this.options.profileConfig.classification[p.classification].color;
    this.parent_.loader.lidarPointHighlight.getSource().clear();
    const lidarPointGeom = new ol.geom.Point([p.coords[0], p.coords[1]]);
    const lidarPointFeature = new ol.Feature(lidarPointGeom);
    if (typeof (classifColor) !== undefined) {

      lidarPointFeature.setStyle(new ol.style.Style({
        image: new ol.style.Circle({
          fill: new ol.style.Fill({
            color: `rgba(${classifColor}, 1)`
          }),
          radius: 3
        })
      }));
    }

    this.parent_.loader.lidarPointHighlight.getSource().addFeature(lidarPointFeature);
  } else {
    this.parent_.loader.lidarPointHighlight.getSource().clear();
    svg.select('#highlightCircle').remove();
    d3.select('#profileInfo').html('');
    this.parent_.loader.cartoHighlight.setPosition(undefined);
  }
};

/**
* Change the profile style according to the material
* @param {string} material sets profile points colors
* @export
*/
gmf.lidarProfile.plot.prototype.changeStyle = function(material) {
  const ctx = d3.select('#profileCanvas')
    .node().getContext('2d');
  ctx.clearRect(0, 0, d3.select('#profileCanvas').node().width, d3.select('#profileCanvas').node().height);
  gmf.lidarProfile.plot.drawPoints(this.parent_loader.profilePoints, material);
};

/**
* Show/Hide classes in the profile
* @param {gmfx.lidarPointAttribute} classification classification object
* @param {string} material sets profile points colors
* @export
*/
gmf.lidarProfile.plot.prototype.setClassActive = function(classification, material) {
  this.options.profileConfig.classification = classification;
  const ctx = d3.select('#profileCanvas')
    .node().getContext('2d');
  ctx.clearRect(0, 0, d3.select('#profileCanvas').node().width, d3.select('#profileCanvas').node().height);
  gmf.lidarProfile.plot.drawPoints(this.parent_.loader.profilePoints, material);
};

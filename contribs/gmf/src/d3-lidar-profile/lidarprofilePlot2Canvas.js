goog.provide('gmf.lidarProfile.plot2canvas');
goog.require('gmf.lidarProfile.measure');
goog.require('gmf.lidarProfile');

/**
 * @param {Object} points Object containing arrays of point properties
 * @param {string} material material used to determine point color
 * @export
*/
gmf.lidarProfile.plot2canvas.drawPoints = function(points, material) {
  let i = -1;
  const n = points.distance.length;
  let cx, cy;
  const ctx = d3.select('#profileCanvas').node().getContext('2d');
  const profileConfig = gmf.lidarProfile.options.profileConfig;

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
 * @param {Array.<number>} rangeX range of the x scale
 * @param {Array.<number>} rangeY range of the y scale
 * @export
*/
gmf.lidarProfile.plot2canvas.setupPlot = function(rangeX, rangeY) {
  const canvasEl = d3.select('#profileCanvas').node();
  const ctx = d3.select('#profileCanvas')
    .node().getContext('2d');
  ctx.clearRect(0, 0, canvasEl.getBoundingClientRect().width, canvasEl.getBoundingClientRect().height);

  const margin = gmf.lidarProfile.options.profileConfig.margin;
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

  gmf.lidarProfile.options.profileConfig.scaleX = sx;
  gmf.lidarProfile.options.profileConfig.scaleY = sy;

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

    gmf.lidarProfile.options.profileConfig.currentZoom = tr.k;
    gmf.lidarProfile.options.profileConfig.scaleX = tr.rescaleX(sx);
    gmf.lidarProfile.options.profileConfig.scaleY = tr.rescaleY(sy);
  }

  const zoom = d3.zoom()
    .scaleExtent([1, 100])
    .translateExtent([[0, 0], [width, height]])
    .extent([[0, 0], [width, height]])
    .on('zoom', zoomed);

  function zoomEnd() {
    ctx.clearRect(0, 0, width, height);
    gmf.lidarProfile.loader.updateData();
  }
  zoom.on('end', zoomEnd);
  zoom.on('start', gmf.lidarProfile.loader.abortPendingRequests);

  d3.select('svg#profileSVG')
    .call(zoom)
    .on('dblclick.zoom', null);


  d3.select('svg#profileSVG').selectAll('*').remove();

  const svg = d3.select('svg#profileSVG')
    .attr('width', width + margin.left)
    .attr('height', height + margin.top + margin.bottom);

  d3.select('svg#profileSVG')
    .on('mousemove', gmf.lidarProfile.plot2canvas.pointHighlight);

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

  gmf.lidarProfile.options.profileConfig.previousDomainX = sx.domain();
  gmf.lidarProfile.options.profileConfig.previousDomainY = sy.domain();

};

/**
 * @param {Object} points Object containing points properties as arrays
 * @param {number} xs mouse x coordinate on canvas element
 * @param {number} ys mouse y coordinate on canvas element
 * @param {number} tolerance snap sensibility
 * @return {Object} closestPoint the closest point to the clicked coordinates
 * @export
*/
gmf.lidarProfile.plot2canvas.getClosestPoint = function(points, xs, ys, tolerance) {
  const d = points;
  const tol = tolerance;
  const sx = gmf.lidarProfile.options.profileConfig.scaleX;
  const sy = gmf.lidarProfile.options.profileConfig.scaleY;
  const distances = [];
  const hP = [];

  for (let i = 0; i < d.distance.length; i++) {
    if (sx(d.distance[i]) < xs + tol && sx(d.distance[i]) > xs - tol && sy(d.altitude[i]) < ys + tol && sy(d.altitude[i]) > ys - tol) {

      const pDistance =  Math.sqrt(Math.pow((sx(d.distance[i]) - xs), 2) + Math.pow((sy(d.altitude[i]) - ys), 2));

      hP.push({
        distance: d.distance[i],
        altitude: d.altitude[i],
        classification: d.classification[i],
        color_packed: d.color_packed[i],
        intensity: d.intensity[i],
        coords: d.coords[i]
      });
      distances.push(pDistance);
    }
  }

  let closestPoint;

  if (hP.length > 0) {
    const minDist = Math.min(distances);
    const indexMin = distances.indexOf(minDist);
    if (indexMin != -1) {
      closestPoint = hP[indexMin];
    } else {
      closestPoint = hP[0];
    }
  }
  return closestPoint;
};

/**
 * @export
*/
gmf.lidarProfile.plot2canvas.pointHighlight = function() {

  const svg = d3.select('svg#profileSVG');
  const pointSize = gmf.lidarProfile.options.profileConfig.pointSize;
  const margin = gmf.lidarProfile.options.profileConfig.margin;
  const tolerance = gmf.lidarProfile.options.profileConfig.tolerance;

  const canvasCoordinates = d3.mouse(d3.select('#profileCanvas').node());
  const sx = gmf.lidarProfile.options.profileConfig.scaleX;
  const sy = gmf.lidarProfile.options.profileConfig.scaleY;
  let cx, cy;
  const p = gmf.lidarProfile.plot2canvas.getClosestPoint(gmf.lidarProfile.loader.profilePoints, canvasCoordinates[0], canvasCoordinates[1], tolerance);
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
    Classification: ${gmf.lidarProfile.options.profileConfig.classification[p.classification].name}<br>
    Intensity: ${p.intensity}<br>`;

    d3.select('#profileInfo')
      .html(html);
    gmf.lidarProfile.loader.cartoHighlight.setElement(null);
    const el = document.createElement('div');
    el.className += 'tooltip gmf-tooltip-measure';
    el.innerHTML = html;

    gmf.lidarProfile.loader.cartoHighlight.setElement(el);
    gmf.lidarProfile.loader.cartoHighlight.setPosition([p.coords[0], p.coords[1]]);
    const classifColor = gmf.lidarProfile.options.profileConfig.classification[p.classification].color;
    gmf.lidarProfile.loader.lidarPointHighlight.getSource().clear();
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

    gmf.lidarProfile.loader.lidarPointHighlight.getSource().addFeature(lidarPointFeature);
  } else {
    gmf.lidarProfile.loader.lidarPointHighlight.getSource().clear();
    svg.select('#highlightCircle').remove();
    d3.select('#profileInfo').html('');
    gmf.lidarProfile.loader.cartoHighlight.setPosition(undefined);
  }
};

/**
* @param {string} material sets profile points colors
* @export
*/
gmf.lidarProfile.plot2canvas.changeStyle = function(material) {
  const ctx = d3.select('#profileCanvas')
    .node().getContext('2d');
  ctx.clearRect(0, 0, d3.select('#profileCanvas').node().width, d3.select('#profileCanvas').node().height);
  gmf.lidarProfile.plot2canvas.drawPoints(gmf.lidarProfile.loader.profilePoints, material);
};

/**
* @param {Object} classification classification object
* @param {string} material sets profile points colors
* @export
*/
gmf.lidarProfile.plot2canvas.setClassActive = function(classification, material) {
  gmf.lidarProfile.options.profileConfig.classification = classification;
  const ctx = d3.select('#profileCanvas')
    .node().getContext('2d');
  ctx.clearRect(0, 0, d3.select('#profileCanvas').node().width, d3.select('#profileCanvas').node().height);
  gmf.lidarProfile.plot2canvas.drawPoints(gmf.lidarProfile.loader.profilePoints, material);
};

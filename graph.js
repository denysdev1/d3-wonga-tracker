const dims = { height: 300, width: 300, radius: 150 };
const cent = { x: dims.width / 2 + 5, y: dims.height / 2 + 5 };
const svg = d3
  .select('.canvas')
  .append('svg')
  .attr('width', dims.width + 150)
  .attr('height', dims.height + 150);

const graph = svg
  .append('g')
  .attr('transform', `translate(${cent.x}, ${cent.y})`);

const pie = d3
  .pie()
  .sort(null)
  .value((d) => d.cost);

const arcPath = d3
  .arc()
  .outerRadius(dims.radius)
  .innerRadius(dims.radius / 2);

const color = d3.scaleOrdinal(d3['schemeSet2']);
const legendGroup = svg
  .append('g')
  .attr('transform', `translate(${dims.width + 40}, 10)`);

const legend = d3
  .legendColor()
  .shape('path', d3.symbol().type(d3.symbolCircle)())
  .shapePadding(10)
  .scale(color);

const tip = d3
  .tip()
  .attr('class', 'tip card')
  .html((d) => {
    const capitalizedName = d.data.name[0].toUpperCase() + d.data.name.slice(1);
    let content = `<div class="name">${capitalizedName}</div>`;

    content += `<div class="cost">${d.data.cost}</div>`;
    content += `<div class="delete">Click slice to delete</div>`;

    return content;
  });

graph.call(tip);

const update = (data) => {
  color.domain(data.map((d) => d.name));

  legendGroup.selectAll('.legend-item').remove();

  const legendItems = legendGroup
    .selectAll('.legend-item')
    .data(data)
    .enter()
    .append('g')
    .attr('class', 'legend-item')
    .attr('transform', (d, i) => `translate(0, ${i * 24})`);

  legendItems
    .append('path')
    .attr('d', d3.symbol().type(d3.symbolCircle)())
    .attr('fill', (d) => color(d.name))
    .attr('stroke', '#fff')
    .attr('stroke-width', 1);

  legendItems
    .append('text')
    .attr('x', 12)
    .attr('y', 5)
    .attr('fill', 'white')
    .text((d) => d.name);
  legendGroup.selectAll('text').attr('fill', 'white');

  const paths = graph.selectAll('path').data(pie(data));

  paths.exit().transition().duration(750).attrTween('d', arcTweenExit).remove();

  paths
    .attr('d', arcPath)
    .transition()
    .duration(750)
    .attrTween('d', arcTweenUpdate);

  paths
    .enter()
    .append('path')
    .attr('class', 'arc')
    .attr('stroke', '#fff')
    .attr('stroke-width', 3)
    .attr('fill', (d) => color(d.data.name))
    .each(function (d) {
      this._current = d;
    })
    .transition()
    .duration(750)
    .attrTween('d', arcTweenEnter);

  graph
    .selectAll('path')
    .on('mouseover', (e, d) => {
      tip.show(d, e.currentTarget);
      handleMouseOver(e);
    })
    .on('mouseout', (e, d) => {
      tip.hide();
      handleMouseOut(e);
    })
    .on('click', handleClick);
};

let data = [];

db.collection('expenses').onSnapshot((res) => {
  res.docChanges().forEach((change) => {
    const doc = { ...change.doc.data(), id: change.doc.id };

    switch (change.type) {
      case 'added':
        data.push(doc);
        break;
      case 'modified':
        const index = data.findIndex((item) => item.id === doc.id);
        data[index] = doc;
        break;
      case 'removed':
        data = data.filter((item) => item.id !== doc.id);
        legendGroup
          .selectAll('.legend-item')
          .filter((d) => d.name === doc.name)
          .remove();
        break;
      default:
        break;
    }
  });

  update(data);
});

const arcTweenEnter = (d) => {
  const i = d3.interpolate(d.endAngle, d.startAngle);

  return (t) => {
    d.startAngle = i(t);

    return arcPath(d);
  };
};

const arcTweenExit = (d) => {
  const i = d3.interpolate(d.startAngle, d.endAngle);

  return (t) => {
    d.startAngle = i(t);

    return arcPath(d);
  };
};

function arcTweenUpdate(d) {
  const i = d3.interpolate(this._current, d);

  this._current = i(1);

  return (t) => arcPath(i(t));
}

const handleMouseOver = (e) => {
  d3.select(e.currentTarget)
    .transition('changeSliceFill')
    .duration(300)
    .attr('fill', '#fff');
};

const handleMouseOut = (e) => {
  d3.select(e.currentTarget)
    .transition('changeSliceFill')
    .duration(300)
    .attr('fill', (d) => color(d.data.name));
};

const handleClick = (e, d) => {
  const id = d.data.id;

  db.collection('expenses').doc(id).delete();
};

<template>
  <div class="vis-component" ref="chart">
    <h6><h5>Renewable Energy Transition Project Identification: (Data for 2000 - 2022)</h5></h6>
    <svg id="scatter2-svg" :width="svgWidth" :height="svgHeight" @dblclick="resetZoom">
      <g class="chart-group" ref="chartGroup">
        <g class="grid-background" ref="gridBackground"></g>
        <g class="brush-group" ref="brushGroup"></g>
        <g class="axis axis-x" ref="axisX"></g>
        <g class="axis axis-y" ref="axisY"></g>
        <g class="points-group" ref="pointsGroup"></g>
      </g>
    </svg>
    
    <div id="tooltip" class="tooltip" style="opacity:0;"></div>
  </div>
</template>

<script>

import * as d3 from 'd3';

export default {
  name: 'Scatterplot_1',
  props: {
  },
  data() {
    const svgWidth = window.innerWidth * 4 / 12;
    const svgHeight = window.innerHeight * 0.35;
    return {
      zoomedXScale: null,
      zoomedYScale: null,
      svgWidth: svgWidth,
      svgHeight: svgHeight,
      svgPadding: {
        top: 5, right: 15, bottom: 60, left: 60,
      },
      significantChange: false,
    }
  },
  mounted() {
    this.drawChart(this.xScale, this.yScale);
    this.addBrush();
    this.initialize();
    // this.paintChart(this.xScale, this.yScale);

  },
  methods: {
    initialize() {
      var localbrushedCountries = [];
      this.filteredData.forEach(d => localbrushedCountries.push(d.id));
    },
    resetZoom() {
      this.zoomedXScale = null;
      this.zoomedYScale = null;
      // this.paintChart(this.xScale, this.yScale);
      this.drawChart(this.xScale, this.yScale);
      this.initialize()
    },
    // called for each updage
    drawChart(xScale, yScale) {
      xScale = xScale || this.xScale;
      yScale = yScale || this.yScale;

      // Update axes
      this.drawXAxis(xScale);
      this.drawYAxis(yScale);
      
      d3.select(this.$refs.chartGroup)
        .attr('transform', `translate(${this.svgPadding.left},${this.svgPadding.top})`);
      this.drawPoints(xScale, yScale);
      // this.paintChart(xScale, yScale);
    },
    // brush for showing on choroplethmap
    addBrush() {
      this.brush = d3.brush()
        .extent([[0,0], [this.svgWidth - this.svgPadding.left - this.svgPadding.right, 
          this.svgHeight - this.svgPadding.bottom - this.svgPadding.top]])
        .on('end', this.onBrush);
      
      d3.select(this.$refs.brushGroup)
        .attr('class', 'brush')
        .call(this.brush);
    },
    // get states in brush
    onBrush(event) {
      this.significantChange = true;
      var selection = event.selection;
      var localbrushedCountries = [];
      var x0,x1,y0,y1,idleTimeout;
      if (!selection) {
        // Reset zoom and clear brushed countries
        this.filteredData.forEach(d => localbrushedCountries.push(d.id));
        if (!idleTimeout) return idleTimeout = setTimeout(() => {
          idleTimeout = null
        }, 1)    
      } else {
        // Calculate new scales for zoom
        if (this.zoomedXScale) {
          x0 = this.zoomedXScale.invert(selection[0][0]);
          x1 = this.zoomedXScale.invert(selection[1][0]);
          y0 = this.zoomedYScale.invert(selection[1][1]);
          y1 = this.zoomedYScale.invert(selection[0][1]);
        } else {
          x0 = this.xScale.invert(selection[0][0]);
          x1 = this.xScale.invert(selection[1][0]);
          y0 = this.yScale.invert(selection[1][1]);
          y1 = this.yScale.invert(selection[0][1]);
        }

        this.zoomedXScale = d3.scaleLinear().domain([x0, x1]).range([0, this.svgWidth - this.svgPadding.left - this.svgPadding.right]);
        this.zoomedYScale = d3.scaleLinear().domain([y0, y1]).range([this.svgHeight - this.svgPadding.top - this.svgPadding.bottom, 0]);

        this.drawChart(this.zoomedXScale, this.zoomedYScale);

        this.filteredData.forEach(d => {
          if (d.energyGeneration >= y0 && d.energyGeneration <= y1 && d.energyCapacity >= x0 && d.energyCapacity <= x1) {
            localbrushedCountries.push(d.id);
          }
        });
        
      }

      // this.paintChart(this.zoomedXScale, this.zoomedYScale);

      d3.select('#scatter2-svg').select(".brush").call(this.brush.move, null);
    },
    drawXAxis(xScale) {
      const xAxisGroup = d3.select(this.$refs.axisX)
        .attr('transform', `translate(0, ${this.svgHeight - this.svgPadding.top - this.svgPadding.bottom})`)
        .call(d3.axisBottom(xScale));

      // Rotate the ticks
      xAxisGroup.selectAll(".tick text")
      .attr("transform", "rotate(50)")
      .attr("x", 9)
      .attr("y", 0)
      .style("text-anchor", "start");

      // Position the axis label
      xAxisGroup.append('text')
      .attr('class', 'x-axis-label')
      .attr('x', this.svgWidth / 2)
      .attr('y', this.svgPadding.bottom - 5)

      
      .style('text-anchor', 'middle')
      .style('fill', 'black')
      .style('font-size', '12px')
      .text('Renewable Energy Capacity');
    },
    drawYAxis(yScale) {
      const yAxisGroup = d3.select(this.$refs.axisY)
        .attr('transform', `translate(0, 0)`)
        .call(d3.axisLeft(yScale))
        .style('font-size', '10px');

      // Rotate the ticks
      yAxisGroup.selectAll('.tick text')
        .attr('transform', 'rotate(-50)')
        .style('text-anchor', 'end');

      // Remove any existing y-axis label before adding a new one
      yAxisGroup.selectAll('.y-axis-label').remove();

      // Add new y-axis label
      yAxisGroup.append('text')
        .attr('class', 'y-axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('y', -this.svgPadding.left + 15)
        .attr('x', -this.svgHeight / 2) // Position in the middle of y-axis
        .style('text-anchor', 'middle') // Center the text on its x position
        .style('fill', 'black')
        .style('font-size', '12px')
        .text('Non-Renewable Energy Capacity');
    },


    // add country points on scatterplot
    drawPoints(xScale, yScale) {
      const pointsGroup = d3.select(this.$refs.pointsGroup);
      const tooltip = d3.select("#tooltip");
      const transition = this.significantChange? d3.transition().duration(750) : d3.transition().duration(0);

      const xRange = xScale.range();
      const yRange = yScale.range();
      const inBoundData = this.filteredData.filter(d => {

        const cx = xScale(d.renewable);
        const cy = yScale(d.nonRenewable);
        


        return cx >= xRange[0] && cx <= xRange[1] && cy <= yRange[0] && cy >= yRange[1];
      });
      pointsGroup.selectAll('.point')
        .data(inBoundData, function(d) { return d.id; })
        .join(
          enter => enter.append('circle')
                        .attr('class', 'point')
                        .attr('cx', d => xScale(d.renewable))
                        .attr('cy', this.svgHeight - this.svgPadding.bottom) // start from bottom
                        .attr('r', 6) // start from zero radius
                        .call(enter => enter.transition(transition)
                            .attr('cy', d => yScale(d.nonRenewable))
                            .attr('r', 6)),
          update => update.call(update => update.transition(transition)
                              .attr('cx', d => xScale(d.renewable))
                              .attr('cy', d => yScale(d.nonRenewable))),
          exit => exit.call(exit => exit.transition(transition)
                            .attr('cy', this.svgHeight - this.svgPadding.bottom)
                            .attr('r', 0)
                            .remove())
        )
        .attr('fill', "rgb(1, 39, 39)")
        .on('mouseover', function(event, d) {
          d3.select(this)
            .raise()
            .attr('stroke', 'green')
            .attr('stroke-width', 2);
          let renewableEnergyTemp = d.renewable === 0 ? 'No Data' : d.renewable.toFixed(2);
          let nonRenewableEnergyTemp = d.nonRenewable === 0 ? 'No Data' : d.nonRenewable.toFixed(2);
          tooltip.transition()
            .duration(200)
            .style('opacity', 1);
          tooltip.html(`
            <table>
              <tr><td class="label">Country:</td>         <td class="country_value">${d.country}</td></tr>
              <tr><td class="label">Non-Renewable Energy:</td>     <td class="value">${nonRenewableEnergyTemp}</td></tr>
              <tr><td class="label">Renewable Energy:</td>        <td class="value">${renewableEnergyTemp}</td></tr>
            </table>
          `)
          .style('left', (event.clientX - 275) + 'px')
          .style('top', (event.clientY - 100) + 'px');
        })
        .on('mouseout', function() {
          d3.select(this)
            .attr('r', 6)
            .attr('stroke', 'none')
            .attr('stroke-width', 0);
          tooltip.transition()
            .duration(500)
            .style('opacity', 0);
        })
        
      this.significantChange = false;
    },
      
    // coloring the grid
    // paintChart(xScale, yScale) {
    //   xScale = xScale || this.xScale;
    //   yScale = yScale || this.yScale;
    //   const background = d3.select(this.$refs.gridBackground);
    //   background.selectAll('rect').remove()
    //   background.selectAll('#plot-area-clip-background').remove()
    //   const colors = [
    //     "rgb(230, 230, 230)",
    //     "rgb(220, 220, 220)",
    //     "rgb(230, 230, 230)",
    //     "rgb(220, 220, 220)", 
    //     "rgb(230, 230, 230)", 
    //     "rgb(220, 220, 220)",
    //     "rgb(230, 230, 230)", 
    //     "rgb(220, 220, 220)",
    //     "rgb(230, 230, 230)",
    //   ];
    //   background.append("defs").append("clipPath")
    //     .attr("id", "plot-area-clip-background")
    //     .append("rect")
    //     .attr("width", this.svgWidth - this.svgPadding.left - this.svgPadding.right)
    //     .attr("height", this.svgHeight - this.svgPadding.top - this.svgPadding.bottom);
    //   const xFirstTick = this.renewableEnergyMin + (this.renewableEnergyMax - this.renewableEnergyMin)/3;
    //   const xSecondTick = this.renewableEnergyMin + 2*(this.renewableEnergyMax - this.renewableEnergyMin)/3;
    //   const xValues = [this.renewableEnergyMin, xFirstTick, xSecondTick, this.renewableEnergyMax];
    //   const yFirstTick = this.nonRenewableEnergyMin + (this.nonRenewableEnergyMax - this.nonRenewableEnergyMin)/3;
    //   const ySecondTick = this.nonRenewableEnergyMin + 2*(this.nonRenewableEnergyMax - this.nonRenewableEnergyMin)/3;
    //   const yValues = [this.nonRenewableEnergyMin, yFirstTick, ySecondTick,this.nonRenewableEnergyMax];
    //   for (let i = 0; i < yValues.length - 1; i++) {
    //     for (let j = 0; j < xValues.length - 1; j++) {
    //       background.append('rect')
    //         .attr('x', xScale(xValues[j]))
    //         .attr('y', yScale(yValues[i+1]))
    //         .attr("clip-path", "url(#plot-area-clip-background)")
    //         .attr('fill', colors[j + i * 3])
    //         .attr('opacity', 0) // Start with an opacity of 0 for the transition
    //         .attr('width', xScale(xValues[j+1]) - xScale(xValues[j]))
    //         .attr('height', yScale(yValues[i]) - yScale(yValues[i+1]))
    //         .attr('opacity', 1);
    //     }
    //   }
    // },
    sumEnergyCapacityByCountry(data) {
      // Assuming each entry in `data` has a `country` field and a `capacity` field
      const summedData = data.reduce((acc, item) => {
        const country = item.country;
        if (!acc[country]) {
          acc[country] = { ...item, capacity: 0 }; // copy all properties
        }
        acc[country].capacity += parseFloat(item.capacity) || 0;
        return acc;
      }, {});

      // Convert the object back into an array
      return Object.values(summedData);
    },
  },
  computed: {
    filteredData() {
      return this.combinedData.filter(d => d.energyCapacity !== 0 && d.energyCapacity !== 0);
    },
    combinedData() {
      let totalRenewable = this.energyCapacity
        .filter(ec => ec['energyType'] === 'Total Renewable')
        .filter(ec => ec.id)
        .reduce((accumulator, current) => {
          const valueToAdd = Number(current.value) || 0;
          if (accumulator[current.id]) {
            accumulator[current.id].value += valueToAdd;
          } else {
            accumulator[current.id] = {
              id: current.id,
              country: current.country,
              value: valueToAdd
            };
          }
          return accumulator;
          }, {});
      let totalNonRenewable = this.energyCapacity
        .filter(ec => ec['energyType'] === 'Total Non-Renewable')
        .filter(ec => ec.id)
        .reduce((accumulator, current) => {
          const valueToAdd = Number(current.value) || 0;
          if (accumulator[current.id]) {
            accumulator[current.id].value += valueToAdd;
          } else {
            accumulator[current.id] = {
              id: current.id,
              country: current.country,
              value: valueToAdd
            };
          }
          return accumulator;
          }, {});
      
      let renewableArray = Object.values(totalRenewable);
      let nonRenewableArray = Object.values(totalNonRenewable);
      let combined = renewableArray.map(rn => {
        let totalNonRenewableData = nonRenewableArray.find(nr => nr.id === rn.id);
        return {
          id: rn.id,
          country: rn.country,
          renewable: rn.value,
          nonRenewable: totalNonRenewableData? totalNonRenewableData.value: 0,
        };
      });
      return combined;
    },
    energyCapacity: {
      get() {
        return this.$store.getters.energyCapacity;
      }
    },
    energyGeneration: {
      get() {
        return this.$store.getters.energyGeneration;
      }
    },
    nonRenewableEnergyMax() {
      const maxNonRenewable = Math.max(...this.filteredData.map(d => d.nonRenewable));
      let roundedMax;
      if (maxNonRenewable > 1000000) {
        roundedMax = Math.ceil(maxNonRenewable / 100000) * 100000;
      } else if (maxNonRenewable > 100000) {
        roundedMax = Math.ceil(maxNonRenewable / 10000) * 10000;
      } else if (maxNonRenewable > 10000) {
        roundedMax = Math.ceil(maxNonRenewable / 1000) * 1000;
      } else {
        // No rounding needed
        roundedMax = maxNonRenewable;
      }
      return roundedMax;
      // return 1300000;
    },
    nonRenewableEnergyMin() {
      const minNonRenewable = Math.min(...this.filteredData.map(d => d.nonRenewable));
      return minNonRenewable;
    },
    renewableEnergyMax() {
      const maxRenewable = Math.max(...this.filteredData.map(d => d.renewable));
      let roundedMax;
      if (maxRenewable > 1000000) {
        roundedMax = Math.ceil(maxRenewable / 100000) * 100000;
      } else if (maxRenewable > 100000) {
        roundedMax = Math.ceil(maxRenewable / 10000) * 10000;
      } else if (maxRenewable > 10000) {
        roundedMax = Math.ceil(maxRenewable / 1000) * 1000;
      } else {
        // No rounding needed
        roundedMax = maxRenewable;
      }
      return roundedMax;
      // return 700000;
    },
    renewableEnergyMin() {
      const minRenewable = Math.min(...this.filteredData.map(d => d.renewable));
      
      return minRenewable;
    },
    xScale() {
      return d3.scaleLinear()
        .rangeRound([0, this.svgWidth - this.svgPadding.left - this.svgPadding.right])
        .domain([this.renewableEnergyMin, this.renewableEnergyMax]);
    },
    yScale() {
      return d3.scaleLinear()
        .rangeRound([this.svgHeight - this.svgPadding.top - this.svgPadding.bottom, 0])
        .domain([this.nonRenewableEnergyMin, this.nonRenewableEnergyMax]);
    },
  },
  watch: {
    energyCapacity: {
      handler() {
        let xScale = this.zoomedXScale || this.xScale;
        let yScale = this.zoomedYScale || this.yScale;
        this.drawChart(xScale, yScale);
      },
      deep: true,
    },
    energyGeneration: {
      handler() {
        let xScale = this.zoomedXScale || this.xScale;
        let yScale = this.zoomedYScale || this.yScale;
        this.drawChart(xScale, yScale);
      },
      deep: true,
    },
    // filteredData: {
    //   handler() {
    //     this.initialize();
    //   },
    //   deep: true,
    // },
    // xScale: {
    //   handler() {
    //     let xScale = this.zoomedXScale || this.xScale;
    //     let yScale = this.zoomedYScale || this.yScale;
    //     // this.paintChart(xScale, yScale);
    //   },
    //   deep: true,
    // }
  },
}
</script>

<style>
</style>

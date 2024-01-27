<template>
  <div class="vis-component" ref="chart">
    <h6>Carbon Stocks / Land Cover Information per Country</h6>
    <svg id="scatter1-svg" :width="svgWidth" :height="svgHeight" @dblclick="resetZoom">
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
    }
  },
  mounted() {
    this.paintChart(this.xScale, this.yScale);
    this.drawChart(this.xScale, this.yScale);
    this.drawXAxis(this.xScale);
    this.drawYAxis(this.yScale);
    this.addBrush();
    this.initialize();

    d3.select('#scatter1-svg').on('click', (event) => {
      if (event.target === d3.select('#scatter1-svg').node()) {
        this.removeSelection();
      }
    });
  },
  methods: {
    removeSelection() {
      this.$store.commit('removeSelectedCountries');
    },
    initialize() {
      var localbrushedCountries = [];
      this.filteredData.forEach(d => localbrushedCountries.push(d.id));
      this.$store.commit('changeBrushedCountries', localbrushedCountries);
    },
    resetZoom() {
      this.zoomedXScale = null;
      this.zoomedYScale = null;
      this.paintChart(this.xScale, this.yScale);
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
      const filteredPoints = this.filteredData.filter(d => this.brushedCountries.includes(d.id));
      var selection = event.selection;
      var localbrushedCountries = [];
      
      var x0,x1,y0,y1,idleTimeout;
      if (!selection) {
        filteredPoints.forEach(d => localbrushedCountries.push(d.id));
        if (!idleTimeout) return idleTimeout = setTimeout(() => {
          idleTimeout = null
        }, 1);
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

        // Redraw chart with new scales
        this.drawChart(this.zoomedXScale, this.zoomedYScale);

        // Filter brushed countries
        filteredPoints.forEach(d => {
          if (d.carbonStocks >= y0 && d.carbonStocks <= y1 && d.landCover >= x0 && d.landCover <= x1) {
            localbrushedCountries.push(d.id);
          }
        });
        
      }

      this.paintChart(this.zoomedXScale, this.zoomedYScale)

      d3.select('#scatter1-svg').select(".brush").call(this.brush.move, null)

      this.$store.commit('changeBrushedCountries', localbrushedCountries);
    },
    // X-axis
    drawXAxis(xScale) {
      const xAxisGroup = d3.select(this.$refs.axisX)
        .attr('transform', `translate(0, ${this.svgHeight - this.svgPadding.top - this.svgPadding.bottom})`)
        .call(d3.axisBottom(xScale))
        .style('font-size', '10');

      const xAxisText = xAxisGroup.selectAll('.x-axis-label').data(['Land Cover Index (Compared to 2015)']);

      xAxisText.enter()
        .append('text')
        .attr('class', 'x-axis-label')
        .merge(xAxisText)
        .attr('x', this.svgWidth/2 + this.svgPadding.left + this.svgPadding.right + 5)
        .attr('y', this.svgPadding.bottom - 10)
        .attr('text-anchor', 'end')
        .style('fill', 'black')
        .style('font-size', '14px')
        .text(d => d);
      },
    // Y-axis
    drawYAxis(yScale) {
      const yAxisGroup = d3.select(this.$refs.axisY)
        .attr('transform', `translate( 0, 0)`)
        .call(d3.axisLeft(yScale))
        .style('font-size', '10');
        
      const yAxisText = yAxisGroup.selectAll('.y-axis-label').data(['Carbon Stocks']);

      yAxisText.enter()
        .append('text')
        .attr('class', 'y-axis-label')
        .merge(yAxisText)
        .attr('transform', 'rotate(-90)')
        .attr('y', -this.svgPadding.left + 5)
        .attr('x', -this.svgHeight/4 + this.svgPadding.top + this.svgPadding.bottom + 10)
        .attr('dy', '0.71em')
        .attr('text-anchor', 'end') 
        .attr('fill', 'black')
        .style('font-size', '14px')
        .text("Carbon Stocks Index (Compared to 1992)");
    },
    // add country points on scatterplot
    drawPoints(xScale, yScale) {
      const pointsGroup = d3.select(this.$refs.pointsGroup);
      const filteredPoints = this.filteredData.filter(d => this.brushedCountries.includes(d.id));

      const tooltip = d3.select("#tooltip");
      const transition = d3.transition().duration(750);
      filteredPoints.sort((a, b) => {
        const aSelected = this.selectedCountries.includes(a.id);
        const bSelected = this.selectedCountries.includes(b.id);
        return aSelected === bSelected ? 0 : aSelected ? 1 : -1;
      });
      const xRange = xScale.range();
      const yRange = yScale.range();
      const inBoundData = filteredPoints.filter(d => {

        const cx = xScale(d.landCover);
        const cy = yScale(d.carbonStocks);
        


        return cx >= xRange[0] && cx <= xRange[1] && cy <= yRange[0] && cy >= yRange[1];
      });


      pointsGroup.selectAll('.point')
        .data(inBoundData, function(d) { return d.id; })
        .join(
          enter => enter.append('circle')
                        .attr('class', 'point')
                        .attr('cx', d => xScale(d.landCover))
                        .attr('cy', this.svgHeight - this.svgPadding.bottom) // start from bottom
                        .attr('r', 6) // start from zero radius
                        .call(enter => enter.transition(transition)
                            .attr('cy', d => yScale(d.carbonStocks))
                            .attr('r', 6)),
          update => update.call(update => update.transition(transition)
                            .attr('cx', d => xScale(d.landCover))
                            .attr('cy', d => yScale(d.carbonStocks))),
          exit => exit.call(exit => exit.transition(transition)
                            .attr('cy', this.svgHeight - this.svgPadding.bottom)
                            .attr('r', 0)
                            .remove())
        )
        .attr('fill', d => this.selectedCountries.includes(d.id) ? "rgb(253, 255, 181)" : "rgb(1, 39, 39)")
        
        .on('mouseover', function(event, d) {
          d3.select(this)
            .raise()
            .attr('stroke', 'aqua')
            .attr('stroke-width', 2);
          let landCoverTemp = d.landCover === 0 ? 'No Data' : d.landCover.toFixed(2);
          let carbonStocksTemp = d.carbonStocks === 0 ? 'No Data' : d.carbonStocks.toFixed(2);
          let disastersFreqTemp = d.disastersFreq === -1 ? 'No Data' : d.disastersFreq;
          tooltip.transition()
            .duration(200)
            .style('opacity', 1);
          tooltip.html(`
            <table>
              <tr><td class="label">Country:</td>         <td class="country_value">${d.country}</td></tr>
              <tr><td class="label">Carbon Stocks:</td>     <td class="value">${carbonStocksTemp}</td></tr>
              <tr><td class="label">Land Cover:</td>        <td class="value">${landCoverTemp}</td></tr>
              <tr><td class="label">Disasters Frequency:</td>     <td class="value">${disastersFreqTemp}</td></tr>
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
        .on('click', (event, d) => this.handleClick(d.id));

    },
    handleClick(countryId) {
      const isSelected = this.selectedCountries.includes(countryId);
      if (!isSelected) {
        this.$store.commit('changeSelectedCountries', countryId);
      } else {
        this.$store.commit('removeSelectedCountry', countryId);
      }
    },
      
    // coloring the grid
    paintChart(xScale, yScale) {
      xScale = xScale || this.xScale;
      yScale = yScale || this.yScale;
      const background = d3.select(this.$refs.gridBackground);
      background.selectAll('rect').remove()
      background.selectAll('#plot-area-clip-background').remove()
      const colors = [
        "rgb(230, 230, 230)",
        "rgb(220, 183, 210)", // 0 1 
        "rgb(211, 146, 194)", // 0 0 
        "rgb(195, 238, 199)", // 1 2 
        "rgb(151, 185, 199)", 
        "rgb(168, 140, 191)", // 1 0 
        "rgb(148, 221, 166)", // 2 2 
        "rgb(129, 186, 162)", // 2 1 
        "rgb(107, 120, 155)",
      ];
      background.append("defs").append("clipPath")
        .attr("id", "plot-area-clip-background")
        .append("rect")
        .attr("width", this.svgWidth - this.svgPadding.left - this.svgPadding.right)
        .attr("height", this.svgHeight - this.svgPadding.top - this.svgPadding.bottom);
      const xFirstTick = this.landCoverMin + (this.landCoverMax - this.landCoverMin)/3;
      const xSecondTick = this.landCoverMin + 2*(this.landCoverMax - this.landCoverMin)/3;
      const xValues = [this.landCoverMin, xFirstTick, xSecondTick, this.landCoverMax];
      const yFirstTick = this.carbonStocksMin + (this.carbonStocksMax - this.carbonStocksMin)/3;
      const ySecondTick = this.carbonStocksMin + 2*(this.carbonStocksMax - this.carbonStocksMin)/3;
      const yValues = [this.carbonStocksMin, yFirstTick, ySecondTick,this.carbonStocksMax];
      for (let i = 0; i < yValues.length - 1; i++) {
        for (let j = 0; j < xValues.length - 1; j++) {
          background.append('rect')
            .attr('x', xScale(xValues[j]))
            .attr('y', yScale(yValues[i+1]))
            .attr('width', (xScale(xValues[j+1]) - xScale(j)))
            .attr('height', (yScale(yValues[i]) - yScale(yValues[i+1])))
            .attr("clip-path", "url(#plot-area-clip-background)")
            .attr('fill', colors[j + i * 3])
            .attr('opacity', 1);
          background.append('rect')
            .attr('x', xScale(xValues[j]))
            .attr('y', yScale(yValues[i+1]))
            .attr('width', 0)  // Start with a width of 0 for the transition
            .attr('height', 0) // Start with a height of 0 for the transition
            .attr("clip-path", "url(#plot-area-clip-background)")
            .attr('fill', colors[j + i * 3])
            .attr('opacity', 0) // Start with an opacity of 0 for the transition
            .attr('width', xScale(xValues[j+1]) - xScale(xValues[j]))
            .attr('height', yScale(yValues[i]) - yScale(yValues[i+1]))
            .attr('opacity', 1);
        }
      }
    },
  },
  computed: {
    filteredData() {
      return this.combinedData.filter(d => d.landCover !== 0);
    },
    combinedData() {
      let combined = this.carbonStocks.map(cs => {
        let landCoverData = this.landCover.find(landCover => landCover.id === cs.id);
        let disastersFreqData = this.disastersFreq.find(disastersFreq => disastersFreq.id === cs.id);
        return {
          id: cs.id,
          country: cs.country,
          carbonStocks: cs.value,
          landCover: landCoverData ? landCoverData.value: 0,
          disastersFreq: disastersFreqData ? disastersFreqData.value: -1
        };
      });
      return combined;
    },
    landCover: {
      get() {
        return this.$store.getters.landCover;
      }
    },
    carbonStocks: {
      get() {
        return this.$store.getters.carbonStocks;
      }
    },
    disastersFreq: {
      get() {
        return this.$store.getters.disastersFreq;
      }
    },
    carbonStocksMax() {
      return 200;
    },
    carbonStocksMin() {
      return 0;
    },
    landCoverMax() {
      return 130;
    },
    landCoverMin() {
      return 70;
    },
    xScale() {
      return d3.scaleLinear()
        .rangeRound([0, this.svgWidth - this.svgPadding.left - this.svgPadding.right])
        .domain([this.landCoverMin, this.landCoverMax]);
    },
    yScale() {
      return d3.scaleLinear()
        .rangeRound([this.svgHeight - this.svgPadding.top - this.svgPadding.bottom, 0])
        .domain([this.carbonStocksMin, this.carbonStocksMax]);
    },
    
    brushedCountries: {
      get() {
        return this.$store.getters.brushedCountries;
      }
    },
    selectedCountries: {
      get() {
        return this.$store.getters.selectedCountries;
      }
    }
  },
  watch: {
    landCover: {
      handler() {
        let xScale = this.zoomedXScale || this.xScale;
        let yScale = this.zoomedYScale || this.yScale;
        this.drawChart(xScale, yScale);
      },
      deep: true,
    },
    carbonStocks: {
      handler() {
        let xScale = this.zoomedXScale || this.xScale;
        let yScale = this.zoomedYScale || this.yScale;
        this.drawChart(xScale, yScale);
      },
      deep: true,
    },
    disastersFreq: {
      handler() {
        let xScale = this.zoomedXScale || this.xScale;
        let yScale = this.zoomedYScale || this.yScale;
        this.drawChart(xScale, yScale);
      },
      deep: true,
    },
    selectedCountries: {
      handler() {
        this.drawChart(this.zoomedXScale, this.zoomedYScale);
      },
      deep: true,
    },
    filteredData: {
      handler() {
        this.initialize();
      },
      deep: true,
    },
    brushedCountries: {
      handler() {
        if (this.zoomedXScale && this.zoomedYScale) {
          this.drawPoints(this.zoomedXScale, this.zoomedYScale);
        } else {
          this.drawPoints(this.xScale, this.yScale);
        }
      },
      deep: true,
    }
  },
}
</script>

<style>
</style>

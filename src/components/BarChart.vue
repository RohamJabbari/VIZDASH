<template>
  <div class="vis-component" ref="chart">
    <h6>Disasters Frequency per Country</h6>
    <svg id="bar-svg" :width="svgWidth" :height="svgHeight" @dblclick="resetZoom" >
      <g class="chart-group" ref="chartGroup">
        <g class="brush-group" ref="brushGroup"></g>
        <g class="axis axis-x" ref="axisX"></g>
        <g class="axis axis-y" ref="axisY"></g>
        <g class="bars-group" ref="barsGroup"></g>
      </g>
    </svg>
    <div id="tooltip" class="tooltip" style="opacity:0;"></div>
  </div>
</template>

<script>

import * as d3 from 'd3';

export default {
  name: 'BarChart',
  props: {
  },
  data() {
    const svgWidth = window.innerWidth * 4 / 12;
    const svgHeight = window.innerHeight * 0.35;
    return {
      zoomedXScale: null,
      // zoomedYScale: null,
      svgWidth: svgWidth,
      svgHeight: svgHeight,
      svgPadding: {
        top: 5, right: 20, bottom: 120, left: 100,
      }
      
    }
  },
  mounted() {
    this.drawChart(this.xScale);
    this.addBrush();
    this.initialize();
    d3.select("#bar-svg").append('g')
      .attr('transform', 'translate(' + (this.svgWidth/2) + ','+ (this.svgHeight-10) +')')
      .append("text")
      .text("Country")
      .style("font-size", "14px")
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
      var localbrushedCountries = [];
      this.$store.commit('changeBrushedCountries', localbrushedCountries);
      this.initialize();
      this.drawChart(this.xScale);
    },
    drawChart(xScale) {
      if (this.$refs.chart) this.svgWidth = this.$refs.chart.clientWidth;
      d3.select(this.$refs.chartGroup)
        .attr('transform', `translate(${this.svgPadding.left},${this.svgPadding.top})`);
      this.drawXAxis(xScale);
      this.drawYAxis();
      this.drawBars(xScale);
    },
    drawXAxis(xScale) {
      const transition = d3.transition().duration(750); // Duration in milliseconds

      const selectedData = this.filteredData.filter(d => this.selectedCountries.includes(d.id)).map(d => d.country);

      const xAxisGroup = d3.select(this.$refs.axisX)
        .attr('transform', `translate( 0, ${this.svgHeight - this.svgPadding.top - this.svgPadding.bottom} )`)
        .transition(transition) // Apply transition to the axis group
        .call(d3.axisBottom(xScale));

      xAxisGroup.selectAll('text')
        .attr('y', '7px')
        .attr('x', '15px')
        .style('text-anchor', 'start')
        .attr('dx', '-.8em')
        .attr('dy', '.15em')
        .attr('transform', 'rotate(60)')
        .style('font-size', '10px')
        .attr('opacity', function(d) {
            // Check if the country ID is in the selectedCountries array
            let opacity = 0;
            if (selectedData && selectedData.length !== 0) {
              opacity = selectedData.includes(d) ? 1 : 0;
            } else if (this.filteredData.length < 50) {
              opacity = 1
            } else {
              opacity = 0
            }
            return opacity;

        }.bind(this));

      const label = d3.select(this.$refs.axisX).select('.x-axis-label');
      if (label.empty()) {
        d3.select(this.$refs.axisX) // Append to the main group, not the transitioning group
          .append('text')
          .attr('class', 'x-axis-label')
          .attr('x', this.svgWidth / 2)
          .attr('y', this.svgHeight *2) 
          .style('text-anchor', 'middle')
          .style('font-size', '12px')
          .text('Countries');
      }

    },
    drawYAxis() {
      d3.select(this.$refs.axisY)
        .call(d3.axisLeft(this.yScale))
        .style('font-size', '10px')
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -this.svgHeight/2 + this.svgPadding.top + this.svgPadding.bottom - 30)
        .attr('y', -this.svgPadding.left +55)
        .attr('dy', '0.71em')
        .attr('text-anchor', 'end')
        .attr('fill', 'black')
        .style('font-size', '12px')
        .text("Disaster Frequency");
    },
    drawBars(xScale) {
      const barsGroup = d3.select(this.$refs.barsGroup);
      const tooltip = d3.select("#tooltip");
      const transition = d3.transition().duration(750);

      // Filter the data to only include brushed countries
      const brushedData = this.brushedCountries.length
        ? this.filteredData.filter(d => this.brushedCountries.includes(d.id))
        : this.filteredData;

      barsGroup.selectAll('.bar')
        .data(brushedData, function(d) { return d.id; })
        .join(
          enter => enter.append('rect')
            .attr('class', 'bar')
            .attr('x', (d) => xScale(d.country))
            .attr('width', xScale.bandwidth())
            .attr('y', this.svgHeight - this.svgPadding.top - this.svgPadding.bottom) // Start from bottom
            .attr('height', 0) 
            .call(enter => enter.transition(transition) // Transition on enter
              .attr('y', (d) => this.yScale(d.value))
              .attr('height', (d) => this.svgHeight - this.svgPadding.top - this.svgPadding.bottom - this.yScale(d.value))),
          update => update.call(update => update.transition(transition) // Transition on update
            .attr('x', (d) => xScale(d.country))
            .attr('width', xScale.bandwidth())
            .attr('y', (d) => this.yScale(d.value))
            .attr('height', (d) => this.svgHeight - this.svgPadding.top - this.svgPadding.bottom - this.yScale(d.value))),
          exit => exit.call(exit => exit.transition(transition) // Transition on exit
            .attr('y', this.svgHeight - this.svgPadding.top - this.svgPadding.bottom)
            .attr('height', 0)
            .remove())
        )
        .attr('fill', d => {
          const countryData = this.filteredData.find(s => s.id === d.id);
          const isSelected = this.selectedCountries.includes(d.id);
          if (countryData.country) {
            if (isSelected) {
              if (this.brushedCountries.includes(countryData.id)) {
                return 'rgb(253, 255, 181)';
              } else {
                return 'rgb(150, 150, 150)';
              }
            } else {
              if (this.brushedCountries.includes(countryData.id)) {
                return this.getColorForCountry(countryData);
              } else {
                return 'rgb(130, 130, 130)';
              }
            }
          } else {
            return 'darkgrey';
          }
        })
        .on('click', (event, d) => this.handleBarClick(d.id))
        .on('mouseover', (event, d) => {
          let landCoverTemp;
          let carbonStocksTemp;
          let disastersFreqTemp;
          const hoveringLandCover = this.landCover.find(country => country.id === d.id);
          const hoveringCarbonStocks = this.carbonStocks.find(country => country.id === d.id);
          const hoveringDisasters = this.disastersFreq.find(country => country.id === d.id)
          if (hoveringLandCover) {
            landCoverTemp = hoveringLandCover.value === 0 ? 'No Data' : hoveringLandCover.value.toFixed(4);
          } else {
            landCoverTemp = 'No Data';
          }
          if (hoveringCarbonStocks) {
            carbonStocksTemp = hoveringCarbonStocks.value === 0 ? 'No Data' : hoveringCarbonStocks.value.toFixed(4);
          } else {
            carbonStocksTemp = 'No Data';
          }
          if (hoveringDisasters) {
            disastersFreqTemp = hoveringDisasters.value === -1 ? 'No Data' : hoveringDisasters.value;
          } else {
            disastersFreqTemp = 'No Data';
          }
          tooltip.transition()
            .duration(200)
            .style('opacity', 1);


          tooltip.html(`
            <table>
              <tr><td class="label">Country:</td>         <td class="value">${d.country}</td></tr>
              <tr><td class="label">CarbonStocks:</td>        <td class="value">${carbonStocksTemp}</td></tr>
              <tr><td class="label">LandCoverIndex:</td>     <td class="value">${landCoverTemp}</td></tr>
              <tr><td class="label">disastersFreq:</td>     <td class="value">${disastersFreqTemp}</td></tr>
            </table>
          `)
            .style('left', (event.clientX - 275) + 'px')
            .style('top', (event.clientY - 400) + 'px');
        })
        .on('mouseout', () => {
          tooltip.transition().duration(500).style('opacity', 0);
          
        });
    },

    handleBarClick(countryId) {
      const isSelected = this.selectedCountries.includes(countryId);
      if (!isSelected) {
        this.$store.commit('changeSelectedCountries', countryId);
      } else {
        this.$store.commit('removeSelectedCountry', countryId);
      }
    },
    getColorForCountry(countryData) {
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
      const landCoverData = this.landCover.find(country => country.id === countryData.id);
      const carbonStocksData = this.carbonStocks.find(country => country.id === countryData.id);
      if (!landCoverData || !carbonStocksData) {
        // Handle the case where data is not available for the country
        return 'darkgrey';
      }
      let landCoverCategory = this.getLandCoverCategory(landCoverData.value);
      let carbonStocksCategory = this.getCarbonStocksCategory(carbonStocksData.value);

      if (carbonStocksCategory === 'low' && landCoverCategory === 'low') return colors[0];
      if (carbonStocksCategory === 'low' && landCoverCategory === 'medium') return colors[1];
      if (carbonStocksCategory === 'low' && landCoverCategory === 'high') return colors[2];
      if (carbonStocksCategory === 'medium' && landCoverCategory === 'low') return colors[3];
      if (carbonStocksCategory === 'medium' && landCoverCategory === 'medium') return colors[4];
      if (carbonStocksCategory === 'medium' && landCoverCategory === 'high') return colors[5];
      if (carbonStocksCategory === 'high' && landCoverCategory === 'low') return colors[6];
      if (carbonStocksCategory === 'high' && landCoverCategory === 'medium') return colors[7];
      if (carbonStocksCategory === 'high' && landCoverCategory === 'high') return colors[8];
    },
    getLandCoverCategory(landCover) {
      const xFirstTick = this.landCoverMin + (this.landCoverMax - this.landCoverMin) / 3;
      const xSecondTick = this.landCoverMin + 2 * (this.landCoverMax - this.landCoverMin) / 3;
      const xThresholds = [xFirstTick, xSecondTick];
      if (landCover <= xThresholds[0]) return 'low';
      if (landCover <= xThresholds[1]) return 'medium';
      return 'high';
    },

    getCarbonStocksCategory(carbonStocks) {
      const yFirstTick = this.carbonStocksMin + (this.carbonStocksMax - this.carbonStocksMin) / 3;
      const ySecondTick = this.carbonStocksMin + 2 * (this.carbonStocksMax - this.carbonStocksMin) / 3;
      const yThresholds = [yFirstTick, ySecondTick];
      if (carbonStocks <= yThresholds[0]) return 'low';
      if (carbonStocks <= yThresholds[1]) return 'medium';
      return 'high';
    },

    addBrush() {
      this.brush = d3.brushX()
        .extent([[0,0], [this.svgWidth - this.svgPadding.left - this.svgPadding.right, 
          this.svgHeight - this.svgPadding.bottom - this.svgPadding.top]])
        .on('end', this.onBrush);
      
      d3.select(this.$refs.brushGroup)
        .attr('class', 'brush')
        .call(this.brush);
    },
    // get states in brush
    onBrush(event) {
      var selection = event.selection;
      var brushedIds = [];
      var xScale;
      if (this.zoomedXScale) {
        xScale = this.zoomedXScale;
      } else {
        xScale = this.xScale
      }

      if (selection) {
        const [x0, x1] = selection;
        
        // Filter the data based on the brushed selection
        brushedIds = this.filteredData
          .filter(d => {
            const x = xScale(d.country);
            return x >= x0 && x <= x1;
          })
          .map(d => d.id);
      }
      this.drawBars(xScale); // Redraw bars with updated data
        
      var idleTimeout;
      if (!selection) {
        if (!idleTimeout) return idleTimeout = setTimeout(() => {
          idleTimeout = null
        }, 1) 
      }
      d3.select('#bar-svg').select(".brush").call(this.brush.move, null)

      this.$store.commit('changeBrushedCountries', brushedIds);
    },
    
  },
  computed: {
    
    filteredData() {
      let filtered = this.disastersFreq.filter(d => d.value > 0);
      if (this.brushedCountries.length > 0) {
        filtered = filtered.filter(d => this.brushedCountries.includes(d.id));
      }
      filtered.sort((a, b) => d3.descending(+a.value, +b.value));
      return filtered;
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
    dataMax() {
      return 40;
    },
    dataMin() {
      return 0;
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
      return d3.scaleBand()
        .rangeRound([0, this.svgWidth - this.svgPadding.left - this.svgPadding.right]).padding(0.15)
        .domain(this.filteredData.map((d) => d.country));
    },
    yScale() {
      return d3.scaleLinear()
        .rangeRound([this.svgHeight - this.svgPadding.top - this.svgPadding.bottom, 0])
        .domain([this.dataMin > 0 ? 0 : this.dataMin, this.dataMax]);
    },
    selectedCountries: {
      get() {
        return this.$store.getters.selectedCountries;
      }
    },
    brushedCountries: {
      get() {
        return this.$store.getters.brushedCountries;
      }
    },
  },
  watch: {
    landCover: {
      handler() {
        this.drawChart(this.xScale);
      },
      deep: true,
    },
    carbonStocks: {
      handler() {
        this.drawChart(this.xScale);
      },
      deep: true,
    },
    disastersFreq: {
      handler() {
        this.drawChart(this.xScale);
      },
      deep: true,
    },
    brushedCountries: {
      handler() {
        this.drawChart(this.xScale);
      },
      deep: true,
    },
    selectedCountries: {
      handler() {
        if (this.zoomedXScale) {
          this.drawChart(this.zoomedXScale);
        } else {
          this.drawChart(this.xScale);
        }
      },
      deep: true,
    }
  },
}
</script>

<style>

.bar:hover {
  border-width: 1;
  border-color: rgb(253, 255, 181);
  opacity: 0.7;
}


</style>

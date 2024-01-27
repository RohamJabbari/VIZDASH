<template>
  <div class="vis-component" ref="chart">
    <h6>Carbon Stocks / Land Cover Map</h6>
    <svg id="map-svg" :width="svgWidth" :height="svgHeight" @dblclick="removeSelection">
      <defs>
        <pattern id="stripes" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="2" height="4" transform="translate(0,0)" fill="white"></rect>
        </pattern>
      </defs>
      <g class="chart-group" ref="chartGroup">
        <g class="grid-background" ref="gridBackground"></g>
        <g class="axis axis-x" ref="axisX"></g>
        <g class="axis axis-y" ref="axisY"></g>
        <g class="points-group" ref="pointsGroup"></g>
      </g>
    </svg>
    <div id="tooltip" class="tooltip" style="opacity:0;"></div>
  </div>
</template>

<script>

import mapWorld from '@/assets/world-geo.json';
import * as d3 from 'd3';

export default {
  name: 'ChoroplethMap',
  props: {
  },
  data() {
    const svgWidth = window.innerWidth * 4 / 12;
    const svgHeight = window.innerHeight * 0.35;
    return {
      svgWidth: svgWidth,
      svgHeight: svgHeight,
      svgPadding: {
        top: 5, right: 15, bottom: 60, left: 60,
      }
    }
  },
  mounted() {
    this.drawMap();
  },
  methods: {
    removeSelection() {
      this.$store.commit('removeSelectedCountries');
    },
    drawMap() {
      const svg = d3.select(this.$refs.chartGroup);
      const projection = d3.geoMercator().fitSize([this.svgWidth, this.svgHeight], mapWorld);

      const pathGenerator = d3.geoPath().projection(projection);
      const tooltip = d3.select("#tooltip");

      svg.selectAll('.country')
        .data(mapWorld.features)
        .join('path')
        .attr('class', 'country')
        .attr('d', pathGenerator)
        .attr('transform', 'scale(1)')
        .attr('fill', d => {
          const countryData = this.filteredData.find(s => s.id === d.id);
          const isSelected = this.selectedCountries.includes(d.id);
          
          if (countryData) {
          if (countryData.carbonStocks > 200 || countryData.landCover > 130) {
            return "url(#stripes)"; // Apply stripe pattern
          } else {
            if (isSelected) {
              if (this.brushedCountries.includes(countryData.id)) {
                
                return 'rgb(253, 255, 181)';
              } else {
                return 'rgb(150, 150, 150)'
              }
            } else {
              if (this.brushedCountries.includes(countryData.id)) {
                return this.getColorForCountry(countryData);
              } else {
                return 'darkgrey';
              }
            }
          }} else {
            return 'darkgray';
          }
        })
        .attr('opacity', 1)
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
              <tr><td class="label">Country:</td>         <td class="value">${d.properties.name}</td></tr>
              <tr><td class="label">CarbonStocks:</td>        <td class="value">${carbonStocksTemp}</td></tr>
              <tr><td class="label">LandCoverIndex:</td>     <td class="value">${landCoverTemp}</td></tr>
              <tr><td class="label">disastersFreq:</td>     <td class="value">${disastersFreqTemp}</td></tr>
            </table>
          `)
            .style('left', (event.clientX - 375) + 'px')
            .style('top', (event.clientY - 100) + 'px');
        })
        .on('mouseout', function() {
          tooltip.transition()
            .duration(300)
            .style('opacity', 0);
        })
        .on('click', (event, d) => this.handleClick(d.id))
    },
    handleClick(countryId) {
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
      let landCoverCategory = this.getLandCoverCategory(countryData.landCover);
      let carbonStocksCategory = this.getCarbonStocksCategory(countryData.carbonStocks);

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
      const xFirstTick = this.landCoverMin + (this.landCoverMax - this.landCoverMin)/3;
      const xSecondTick = this.landCoverMin + 2*(this.landCoverMax - this.landCoverMin)/3;
      const xThresholds = [xFirstTick, xSecondTick];
      if (landCover <= xThresholds[0]) return 'low';
      if (landCover <= xThresholds[1]) return 'medium';
      return 'high';
    },

    getCarbonStocksCategory(carbonStocks) {
      const yFirstTick = this.carbonStocksMin + (this.carbonStocksMax - this.carbonStocksMin)/3;
      const ySecondTick = this.carbonStocksMin + 2*(this.carbonStocksMax - this.carbonStocksMin)/3;
      const yThresholds = [yFirstTick, ySecondTick]; 
      if (carbonStocks <= yThresholds[0]) return 'low';
      if (carbonStocks <= yThresholds[1]) return 'medium';
      return 'high';
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
  },

  watch: {
    disastersFreq: {
      handler() {
        this.drawMap();
      },
      deep: true,
    },
    carbonStocks: {
      handler() {
        this.drawMap();
      },
      deep: true,
    },
    landCover: {
      handler() {
        this.drawMap();
      },
      deep: true,
    },
    brushedCountries: {
      handler() {
        this.drawMap();
      },
      deep: true,
    },
    selectedCountries: {
      handler() {
        this.drawMap();
      },
      deep: true,
    }
  },
}
</script>

<style>
  .country {
    stroke: #5b5b5b;
    stroke-width: 1px;
  }

  .country:hover {
    fill-opacity: 0.7;
    stroke: rgb(253, 255, 181);
  }

  .tooltip {
    position: absolute;
    text-align: center;
    padding: 8px;
    font: 12px sans-serif;
    background: rgb(253, 241, 252);
    border: 1px;
    border-radius: 8px;
    pointer-events: none;
  }

.tooltip table {
  width: 100%;
  border-collapse: collapse;
}

.tooltip .label {
  width: 150px;
  text-align: left;
  font-size: 12px;
  white-space: nowrap;
}

.tooltip .country_value {
  width: 300px;
  text-align: right;
  font-size: 12px;
  white-space: nowrap;
}

.tooltip .value {
  width: 150px;
  font-size: 12px;
  text-align: right;
  white-space: nowrap;
}

.small-country-circle {
    stroke: red; /* Adjust the color as needed */
    stroke-width: 3;
    opacity: 0.7;
}
</style>

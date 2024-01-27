<template>
  
  <div id="app">
    <div class="container-fluid">
      <div class="row">
        <div class="col-md-12">
          <h5>Mitigation and Disaster Relief Project Identification: (Data for 1992 - 2020)</h5>
        </div>
      </div>
      
      <div class="row">
        <div class="col-md-2"></div>
        <div class="col-md-8">
          <YearSlider/>
        </div>
        <div class="col-md-2"></div>
      </div>
      <div class="row">
        <div class="col-md-1">
        </div>
        <div class="col-md-5 border-container">
          <ChoroplethMap/>
        </div>
        <div class="col-md-5 border-container">
          <Scatterplot_1/>
        </div>
        <div class="col-md-1">
        </div>
      </div>
      <div class="row"><br></div>
      <div class="row">
        <!-- <div class="col-md-1"></div> -->
        <div class="col-md-12">
          
        </div>
        <!-- <div class="col-md-1"></div> -->
      </div>
      <div class="row">
        <div class="col-md-1">
        </div>
        <div class="col-md-5 energy-container">
          <Scatterplot_2/>
        </div>
       
        <div class="col-md-5 border-container">
          <BarChart/>
        </div>
        <div class="col-md-1">
        </div>
      </div>
    
    </div>
  </div>
</template>

<script>
// Hint: Replace 'BarChart' in this file with the Scatterplot
import ChoroplethMap from './components/ChoroplethMap.vue';
import YearSlider from './components/YearSlider.vue';
import Scatterplot_1 from './components/Scatterplot_1.vue';
import Scatterplot_2 from './components/Scatterplot_2.vue';
import BarChart from './components/BarChart.vue';
// import StackedBarChart from './components/StackedBarChart.vue';
export default {
  name: 'App',
  components: {
    ChoroplethMap, YearSlider, Scatterplot_1, Scatterplot_2, BarChart
  },
  mounted() {
    this.$store.dispatch('loadData');
    this.$store.dispatch('loadEnergyData')
  },
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #000000;
  margin-top: 0px;
  background-color: #ebebeb;
  min-height: 100vh;
}

.energy-container {
  background-color: #f3f3f3;
  border: 7px solid #f3f3f3;
  padding: 5px;
}
</style>

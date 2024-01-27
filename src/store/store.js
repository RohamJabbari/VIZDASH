import Vue from 'vue';
import Vuex from 'vuex';
import * as d3 from 'd3';

Vue.use(Vuex);

const store = new Vuex.Store({
  state: {
    selectedYear: 2018,
    selectedCountries: [],
    brushedCountries: [],
    disastersFreq: [],
    carbonStocks: [],
    landCover: [],
    energy: [],
    energyGeneration: [],
    energyCapacity: [],
  },
  mutations: {
    changeSelectedYear (state, year) {
      state.selectedYear = year;
    },
    changeSelectedCountries(state, val) {
      state.selectedCountries.push(val);
    },
    removeSelectedCountries(state) {
      state.selectedCountries = [];
    },
    changeBrushedCountries(state, val) {
      state.brushedCountries = val;
    },
    removeSelectedCountry(state, val) {
      state.selectedCountries = state.selectedCountries.filter(id => id !== val);
    },
  },
  getters: {
    selectedYear: (state) => state.selectedYear,
    selectedCountries: (state) => state.selectedCountries,
    brushedCountries: (state) => state.brushedCountries,
    disastersFreq: (state) => filterDataBySelectedYear(state.disastersFreq, state.selectedYear),
    carbonStocks: (state) => filterDataBySelectedYear(state.carbonStocks, state.selectedYear),
    landCover: (state) => filterDataBySelectedYear(state.landCover, state.selectedYear),
    energy: (state) => filterEnergyDataByYear(state.energy, state.selectedYear),
    energyGeneration: (state) => filterEnergyDataByYear(state.energyGeneration, state.selectedYear),
    energyCapacity: (state) => filterEnergyDataByYear(state.energyCapacity, state.selectedYear),
  },
  actions: {
    loadData({state}) {
      d3.csv('./27_Climate-related_Disasters_Frequency.csv').then((data) => { 
        state.disastersFreq = data;
      })

      d3.csv('./26_Forest_and_Carbon.csv').then((data) => { 
        state.carbonStocks = data;
      })

      d3.csv('./25_Land_Cover_Accounts.csv').then((data) => { 
        state.landCover = data;
      })
    },

    loadEnergyData({state}) {
      d3.csv('./5_Energy_Transition.csv').then((data) => {

        const energyGeneration = data.filter(item => item['Indicator'] === 'Electricity Generation');
        const energyCapacity = data.filter(item => item['Indicator'] === 'Electricity Installed Capacity');
        state.energy = data;
        state.energyGeneration = energyGeneration;
        state.energyCapacity = energyCapacity;
      })
    },

  }
})

function filterDataBySelectedYear(data, selectedYear) {
  if (selectedYear < 1992) {
    selectedYear = 1992
  } else if (selectedYear > 2020) {
    selectedYear = 2020
  }
  let result = data
                  .filter(item => selectedYear in item)
                  .map(item => ({
                    country: item.Country,
                    id: item.ISO2,
                    value: +item[selectedYear],
                  }))
  return result;
}

function filterEnergyDataByYear(data, selectedYear) {
  if (selectedYear < 2000) {
    selectedYear = 2000
  } else if (selectedYear > 2022) {
    selectedYear = 2022
  }
  let result = data
                  .filter(item => selectedYear in item)
                  .map(item => ({
                    country: item.Country,
                    id: item.ISO2,
                    energyType: item['Energy Type'],
                    technology: item.Technology,
                    value: +item[selectedYear]
                  }))
    return result;
}

export default store;

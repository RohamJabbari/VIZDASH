<template>
  <div>
    <label for="range-year" style="font-size: 16px; font-weight: bold;">Year Selection</label>
    <b-form-input id="range-year" v-model="selectedYear" type="range" min="1992" max="2022"></b-form-input>
    <div class="mt-2" style="font-size: 12px;">
      Selected Year: {{ selectedYear }} {{ dash(selectedYear) }}<span :style="{ color: getLabelColor(selectedYear) }">{{ getFootprintLabel(selectedYear) }}</span>
      </div>
  </div>
</template>

<script>
export default {
  name: 'YearSlider',
  props: {
  },
  data() {
    return {
    }
  },
  mounted() {
  },
  methods: {
    getFootprintLabel(year) {
      if (year > 2020) {
        return `(Carbon Footprint showing data for: 2020)`;
      } else if (year < 2000) {
        return `(Energy Transition showing data for: 2000)`;
      } else {
        return '';
      }
    },
    getLabelColor(year) {
      return year > 2020 || year < 2000? 'red' : 'inherit';
    },
    dash(year) {
      if (year > 2020) {
        return ` - `;
      } else if (year < 2000) {
        return ` - `;
      } else {
        return '';
      }
    }
  },
  computed: {
    selectedYear: {
      get() {
        return this.$store.getters.selectedYear;
      },
      set(val) {
        this.$store.commit('changeSelectedYear', val);
      },
    },
  },
  watch: {
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>

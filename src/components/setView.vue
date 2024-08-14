<template>
    <div class="container">
      <h1>DataSets</h1>
      <el-select v-model="localDataSet1" class="select" @change="changeSelect(1, localDataSet1)">
        <el-option value="dataA">dataA</el-option>
        <el-option value="dataB">dataB</el-option>
      </el-select>
      <el-select v-model="localDataSet2" class="select" @change="changeSelect(2, localDataSet2)">
        <el-option value="dataA">dataA</el-option>
        <el-option value="dataB">dataB</el-option>
      </el-select>
      <h1>Filters</h1>
      <div class="block">
        <h2>Node</h2>
        <el-slider v-model="localNodeFilter" show-input :max="20"></el-slider>
      </div>
      <div class="block">
        <h2>Link</h2>
        <el-slider v-model="localLinkFilter" show-input :max="20"></el-slider>
      </div>
      <div class="block">
        <h2>Step</h2>
        <el-slider v-model="localStepFilter" range :max="20"></el-slider>
      </div>
      <h1>Visulization</h1>
    </div>
  </template>
  
  <script>
  export default {
    data() {
        return {
            localDataSet1: this.dataSet1,
            localDataSet2: this.dataSet2,
            localNodeFilter: this.nodeFilter,
            localLinkFilter: this.linkFilter,
            localStepFilter: this.stepFilter
        }
    },
    props:['dataSet1','dataSet2', 'nodeFilter', 'linkFilter', 'stepFilter'],
    methods:{
        changeSelect(index, value){
            this.$bus.$emit('changeDataSet', index, value)
        }
    },
    watch: {//监听属性，同步改变
    dataSet1(newVal) {
      this.localDataSet1 = newVal;
    },
    dataSet2(newVal) {
      this.localDataSet2 = newVal;
    },
    localNodeFilter(newVal) {
      this.$bus.$emit('changeNodeFilter', newVal)
    },
    localLinkFilter(newVal) {
      this.$bus.$emit('changeLinkFilter', newVal) 
    },
    localStepFilter(newVal) {
      this.$bus.$emit('changeStepFilter', newVal)
    }
  }
  }
  </script>
  
  <style scoped>
    .container {
        padding-left: 20px;
        display: flex;
        flex-direction: column;
        align-items: left;
        justify-content: top;
    }
    .select {
        width: 150px;
        margin-top: 10px
    }
    .filter-container {
        width: 100%;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;

    }
    h1 {
        margin-top: 20px;
        margin-bottom: 20px;
    }

  </style>
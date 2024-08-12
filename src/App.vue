<template>
  <div id="app">
    <SetView id="set-view" :dataSet1="dataSet1" :dataSet2="dataSet2" :node="node" :link="link" :step="step"></SetView>
    <MainView id="main-view" :node="node" :link="link" :step="step" ></MainView>
    <boardView id="show-view"></boardView>
  </div>
</template>

<script>
import MainView from './components/mainView.vue';
import boardView from './components/boardVIew.vue';
import SetView from './components/setView.vue';



export default {
  name: 'App',
  components: {
    boardView,
    SetView,
    MainView
  },
  data() {
    return {
      dataSet1:'dataA',//数据集标签，用于标识
      dataSet2:'dataB',
      node:10,//节点流量筛选
      link:10,//边流量筛选
      step:[0,6],//迭代次数
    };
  },
  computed: {
  },
  methods: {
    changeDataSet(index, value) {//选择数据集
      if (index === 1) {
        this.dataSet2 = this.dataSet1;
        this.dataSet1 = value;
      } else {
        this.dataSet1 = this.dataSet2;
        this.dataSet2 = value;
      }
    },


  },
  mounted(){
    this.$bus.$on('changeDataSet', this.changeDataSet);
  },
  beforeDestroy() {
      this.$bus.$off('changeDataSet')
  },
}
</script>

<style>

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

#app {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: row;
  align-items: top;
  justify-content: center;
  padding-top: 20px;
  padding-bottom: 20px;
  padding-left: 20px;
}

#set-view {
  width: 280px;
  height: 700px;
  border-radius: 5px;
  background-color: #d3d3d1;
}

#main-view {
  width: 60%;
  height: 100%;
  border-radius: 5px;
  border: #d3d3d1 3px solid;
}

#show-view {
  width: 20%;
  height: 100%;
}

</style>

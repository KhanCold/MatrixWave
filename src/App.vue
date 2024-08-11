<template>
  <div id="app">
    <SetView id="set-view" :dataSet1="dataSet1" :dataSet2="dataSet2" :node="node" :link="link" :step="step"></SetView>
    <MainView id="main-view" :dataA="dataA" :dataB="dataB" :node="node" :link="link" :step="step" :routeStep="routStep" :pageNames="pageNames"></MainView>
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
      dataA:[],//生成的数据集A
      dataB:[],//生成的数据集B

      //生成数据集参数
      routStep:7,//路径最长值
      maxNumber:1000,//路径最大数量
      pageNames:['page1', 'page2', 'page3', 'page4', 'page5', 'page6', 'page7', 'page8', 'page9', 'page10'],
    };
  },
  computed: {
    // dataSetA() { //实际的数据集A
    //   return this.dataSet1 === 'dataA'? this.dataA : this.dataB;
    // },
    // dataSetB() { //实际的数据集B
    //   return this.dataSet1 === 'dataA'? this.dataB : this.dataA;
    // },
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
    createDataSets() {//创建数据集 数据集格式:[['page1','page3','page2'],...]

      let dataSet = [];

      for (let i = 0; i < this.maxNumber; i++) {
        let route = [];//一个路径
        for (let j = 0; j < this.routStep; j++) {
          //每次有30%概率结束循环，控制路径长度随机
          if (Math.random() < 0.3) {break;}
          let pageIndex = Math.floor(Math.random() * this.pageNames.length);//随机选择页面
          route.push(this.pageNames[pageIndex]);
      }
      if(route.length > 1)//路径长度大于1才加入数据集
        dataSet.push(route);
    }
    console.log('createDataSets', dataSet);
    return dataSet;
    },
    getDataSets() {//获取数据集
      this.dataA = this.createDataSets();
      this.dataB = this.createDataSets();
    },
  },
  mounted(){
    this.getDataSets();
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

<template>
  <div id="app">

    <SetView id="set-view" :dataSet1="dataSet1" :dataSet2="dataSet2" :nodeFilter="nodeFilter" :linkFilter="linkFilter" :stepFilter="stepFilter"></SetView>
    <MainView id="main-view" :nodeFilter="nodeFilter" :linkFilter="linkFilter" :stepFilter="stepFilter" :pageNames="pageNames" :colorArr="colorArr" :pageColor="pageColor" :nodeWidth="nodeWidth" :nodeHeight="nodeHeight"></MainView>
    <boardView id="show-view" :pageNames="pageNames" :colorArr="colorArr" :pageColor="pageColor" :nodeWidth="nodeWidth" :nodeHeight="nodeHeight"></boardView>
    
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
      nodeFilter:10,//节点流量筛选
      linkFilter:10,//边流量筛选
      stepFilter:[0, 5],//迭代次数
      pageNames:['homePage','aboutPage','contactPage','productPage','servicePage',
      'blogPage','newsPage','loginPage','registerPage','searchPage','cartPage','checkoutPage'
      ,'paymentPage','thankyouPage','dropOff'],//页面名称
      colorArr: [
        '#670a67', '#810c81', '#9a3d9a', '#a755a7', '#c086c0', '#ffffff',
        '#FFE0A3', '#FFC168', '#FF9D2D', '#FFA500', '#FF7800'
      ],
      pageColor: [//页面颜色
        '#008080', '#1F78B4', '#E66100', '#33A02C', '#FFA500',
        '#6A3D9A', '#FF7F00', '#B15928', '#B2DF8A', '#FB9A99',
        '#988ED5', '#FFD92F', '#8C564B', '#A6CEE3', '#000000'
      ],
      nodeWidth: 60,//节点的最大宽度，按照节点的average值来计算
      nodeHeight: 15,//节点的高度 但是文字size等的高度也和此一样，不然会有错位
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
    this.$bus.$on('changeNodeFilter', (value) => {
      this.nodeFilter = value;
    });
    this.$bus.$on('changeLinkFilter', (value) => {
      this.linkFilter = value;
    });
    this.$bus.$on('changeStepFilter', (value) => {
      this.stepFilter = value;
    });
    this.$bus.$on('getLinkMaxVolume', (value) => {
      // console.log('app:getLinkMaxVolume', value);
      this.linkFilter = value;
    });
    this.$bus.$on('getNodeMaxVolume', (value) => {
      this.localNodeFilter = value;
    });
  },
  beforeDestroy() {
      this.$bus.$off('changeDataSet')
      this.$bus.$off('changeNodeFilter')
      this.$bus.$off('changeLinkFilter')
      this.$bus.$off('changeStepFilter')
      this.$bus.$off('getLinkMaxVolume')
      this.$bus.$off('getNodeMaxVolume')
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

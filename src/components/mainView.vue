<template>
  <div>
    <h1 id="container"></h1>
  </div>
</template>

<script>
import Konva from 'konva';

export default {
  props:['dataA', 'dataB','node','link','step', 'routeStep', 'pageNames'],
  data() {
    return {
      animationFrameId: null, // 用于存储requestAnimationFrame返回的ID
      colorArr: [
        '#670a67', '#810c81', '#9a3d9a', '#a755a7', '#c086c0', '#FFFFFF',
        '#FFE0A3', '#FFC168', '#FF9D2D', '#FFA500', '#FF7800'
      ],
      pageColor: [
        '#008080', '#1F78B4', '#E66100', '#33A02C', '#FFA500',
        '#6A3D9A', '#FF7F00', '#B15928', '#B2DF8A', '#FB9A99',
        '#988ED5', '#FFD92F', '#8C564B', '#A6CEE3', '#000000'
      ],
      nodeWidth: 30,//节点的宽度
      nodeHeight: 30,//节点的高度
      //节点的数据格式[[{averageVolume:, relativeVolume:},...]...] 每一个数组代表一个step，其中的每一个对象代表一个节点的数据
      nodeDataA: [],//节点数据A 
      nodeDataB: [],
      //link的数据格式[[{averageVolume:, relativeVolume:},...]...] 邻接矩阵，第1行第2列代表第1个节点和第2个节点的相互连接情况，以此类推link[i][j]表示节点i和节点j的相互连接情况 
      LinkDataA: [],//link数据A
      LinkDataB: [],
    }
  },
  mounted() {
    this.getNodeData();
    this.createGraph();
    this.logFunction();
  },
  beforeDestroy() {
  },
  methods: {
    createGraph() {//创建图形
      let container = document.getElementById('container');
      let stage = new Konva.Stage({
        container: 'container',
        width: container.clientWidth,
        height: container.clientHeight
      });

      let layer = new Konva.Layer();

      let rect = new Konva.Rect({
        x: 0,
        y: 0,
        width: container.clientWidth,
        height: 500,
        fill: 'red',
        draggable: true, // 启用拖拽
      });

      layer.add(rect);
      stage.add(layer);
    },
    transformNodeData(originalData){//将原始node数据转换为nodeData
    //原始数据格式：[['page7', 'page1', 'page8', 'page5', 'page4', 'page5', 'page1'],['page9', 'page2'], ...]
    //每一个数组代表了一个序列,序列节点为数组中的元素如'page7'，序列最长为this.routeStep，节点编号序列为this.pageNames:['page1', 'page2',...]
    //将原始数据转换为[[1,2,3,..],....]数组中的每一个元素代表一个节点的流量总和，子数组代表每一个step的数据
      let nodeData = [];
      for(let i = 0; i < this.routeStep; i++){
        let pageVolumeTotal = [];//每一个page的流量总和
        //获取每个序列的第i step
        let originalStepData = originalData.filter(subArray => subArray.length >= i).map(subArray => subArray[i]);
        // console.log('originalStepData:',originalStepData);

        for(let j = 0; j < originalStepData.length; j++){//遍历出每个page的流量总和
            let pageIndex = this.pageNames.indexOf(originalStepData[j]);
            if(pageIndex === -1){//如果pageNames中没有这个page，则跳过
              continue;
            }
            if(pageVolumeTotal[pageIndex] === undefined){
              pageVolumeTotal[pageIndex] = 0;
            }
            pageVolumeTotal[pageIndex] += 1;
          }
          nodeData.push(pageVolumeTotal);
        }
        return nodeData;
    },
    getNodeData(){
      console.log('dataA:',JSON.stringify((this.dataA)));
      this.nodeDataA = this.transformNodeData(this.dataA);
      this.nodeDataB = this.transformNodeData(this.dataB);
    },
    logFunction(){//测试用函数
      console.log('nodeDataA:',JSON.stringify(this.nodeDataA));
    },


  }
}
</script>

<style scoped>
  h1 {
    width: 100%;
    height: 100%;
  }
</style>
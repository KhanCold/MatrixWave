<template>
  <div>
    <h1 id="container"></h1>
  </div>
</template>

<script>
import Konva from 'konva';

export default {
  props:['node','link','step', 'routeStep'],
  data() {
    return {
      layer: null,//Konva图层
      stage: null,//Konva画布
      strokeWidth: 1,//线条宽度
       //生成数据集参数
      routStep:7,//路径最长值
      maxNumber:300,//路径最大数量
      dataA: [],//数据集A
      dataB: [],//数据集B
      pageNames:['homePage','aboutPage','contactPage','productPage','servicePage',
      'blogPage','newsPage','loginPage','registerPage','searchPage','cartPage','checkoutPage'
      ,'paymentPage','thankyouPage','errorPage'],//页面名称
      colorArr: [
        '#670a67', '#810c81', '#9a3d9a', '#a755a7', '#c086c0', '#edf2fa',
        '#FFE0A3', '#FFC168', '#FF9D2D', '#FFA500', '#FF7800'
      ],
      pageColor: [//页面颜色
        '#008080', '#1F78B4', '#E66100', '#33A02C', '#FFA500',
        '#6A3D9A', '#FF7F00', '#B15928', '#B2DF8A', '#FB9A99',
        '#988ED5', '#FFD92F', '#8C564B', '#A6CEE3', '#000000'
      ],
      nodeWidth: 30,//节点的最大宽度，按照节点的average值来计算
      nodeHeight: 15,//节点的高度 但是文字size等的高度也和此一样，不然会有错位
      nodeMaxVolume: 0,//节点的最大流量
      nodeMinVolume: 0,//节点的最小流量
      linkMaxVolume: 0,//link的最大流量
      linkMinVolume: 0,//link的最小流量
      //节点的数据格式[[1,2,3,..],....]数组中的每一个元素代表一个节点的流量总和，子数组代表每一个step的数据
      nodeDataA: [],//节点数据A
      nodeDataB: [],
      //link的数据格式[[[1,2,3...]] 邻接矩阵，第1行第2列代表第1个节点和第2个节点的相互连接情况，以此类推link[i][j]表示节点i和节点j的相互连接情况 
      //矩阵的形状为[this.pageNames.length,this.pageNames.length + 1]，最后一列代表dropout节点的连接情况
      LinkDataA: [],//link数据A
      LinkDataB: [],
      nodeDataShow: [],//用于可视化的节点数据，数据格式：[[{nodeAVolume:1,nodeBVolume:3,average:2,diff:1, diffPercent:0.1},...],,...]
                        //每个元素代表一个节点的流量数据，包含nodeAVolume,nodeBVolume,average,diff,diffPercent
      linkDataShow: [],//用于可视化的link数据，数据格式：[[[{source:1,target:2,LinkAvolume:3, LinkBvolume:2, diff:1,diffPercent:0.1}]]]
    }
  },
  computed: {

  },
  mounted() {
    this.getDataSets();//创建数据集
    this.getNodeAndLinkData();//获取节点和link数据
    this.getCompareAndAverageNodeData(this.nodeDataA, this.nodeDataB);//比较两个节点数据集，计算平均值和差值 并得到volume的最大值和最小值
    this.getCompareAndAverageLinkData(this.LinkDataA, this.LinkDataB);//比较两个link数据集，计算平均值和差值 并得到volume的最大值和最小值
    this.createGraph();
    this.drawGraph();
    this.logFunction();
  },
  beforeDestroy() {
  },
  methods: {
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
      // console.log('createDataSets', JSON.stringify(dataSet));
      return dataSet;
    },
    getDataSets() {//获取数据集
      this.dataA = this.createDataSets();
      this.dataB = this.createDataSets();
    },
    transformNodeData(originalData){//将原始node数据转换为nodeData
    //原始数据格式：[['page7', 'page1', 'page8', 'page5', 'page4', 'page5', 'page1'],['page9', 'page2'], ...]
    //每一个数组代表了一个序列,序列节点为数组中的元素如'page7'，序列最长为this.routeStep，节点编号序列为this.pageNames:['page1', 'page2',...]
    //将原始数据转换为[[1,2,3,..],....]数组中的每一个元素代表一个节点的流量总和，子数组代表每一个step的数据
        let nodeData = [];
      for (let i = 0; i < this.routStep; i++) {
        // 初始化每个page的流量总和数组，长度等于pageNames的长度，初始值为0
        let pageVolumeTotal = new Array(this.pageNames.length).fill(0);

        // 获取每个序列的第i step
        let originalStepData = originalData.filter(subArray => subArray.length > i).map(subArray => subArray[i]);

        // 遍历出每个page的流量总和
        for (let j = 0; j < originalStepData.length; j++) {
          let pageIndex = this.pageNames.indexOf(originalStepData[j]);
          // 如果pageNames中有这个page，则累加流量
          if (pageIndex !== -1) {
            pageVolumeTotal[pageIndex]++;
          }
        }
        // 将当前step的流量总和数组添加到nodeData中
        nodeData.push(pageVolumeTotal);
      }
      return nodeData;
    },
    transformLinkData(originalData){//将原始link数据转换为linkData
      //原始数据格式：[['page7', 'page1', 'page8', 'page5', 'page4', 'page5', 'page1'],['page9', 'page2'], ...]
      //每一个数组代表了一个序列,序列节点为数组中的元素如'page7'，序列最长为this.routeStep，节点编号序列为this.pageNames:['page1', 'page2',...]
      //每一条link是由当前节点和后面的节点构成的，如'page7'->'page1'，就是一个link
      //将原始数据转换为邻接矩阵[[[1,2,3...]]]，其中内次的第一层数组的长度为this.routstep，代表这每一个step的邻接矩阵
      //第二层数组第1行第2列代表第1个节点和第2个节点的相互连接的次数，以此类推link[i][j]表示节点i和节点j的相互连接情况，
      //每一个矩阵的形状为[this.pageNames.length,this.pageNames.length + 1]，最后一列代表dropout节点的连接情况

      // 确定矩阵的大小，根据pageNames的长度
      const matrixSize = this.pageNames.length;
      let linkData = new Array(matrixSize).fill(0).map(() => new Array(matrixSize + 1).fill(0));

      // 遍历原始数据
      originalData.forEach((sequence) => {
        // 遍历序列中的每个页面
        sequence.forEach((page, pageIndex) => {
          // 检查是否是最后一个页面
          if (pageIndex < sequence.length - 1) {
            // 找到当前页面和下一个页面的索引
            const currentPageIndex = this.pageNames.indexOf(page);
            const nextPageIndex = this.pageNames.indexOf(sequence[pageIndex + 1]);

            // 如果找到索引，则增加邻接矩阵中的相应元素
            if (currentPageIndex !== -1 && nextPageIndex !== -1) {
              linkData[currentPageIndex][nextPageIndex]++;
            }
          }
        });
      });

      // 处理dropout节点的连接情况，这里假设dropout节点是最后一个节点
      // 遍历原始数据，统计每个节点到dropout节点的连接次数
      originalData.forEach((sequence) => {
        // 找到当前序列最后一个页面的索引
        const lastIndex = this.pageNames.indexOf(sequence[sequence.length - 1]);
        // 增加到dropout节点的连接次数
        linkData[lastIndex][matrixSize]++;
      });

      return linkData;
      
    },
    getNodeAndLinkData(){//获取节点和link数据
      this.nodeDataA = this.transformNodeData(this.dataA);
      this.nodeDataB = this.transformNodeData(this.dataB);
      this.LinkDataA = this.transformLinkData(this.dataA);
      this.LinkDataB = this.transformLinkData(this.dataB);
    },
    getCompareAndAverageNodeData(nodeDataA, nodeDataB){//比较两个节点数据集，计算平均值和差值 并得到volume的最大值和最小值
      //nodeData格式：[[1,2,3,..],....]数组中的每一个元素代表一个节点的流量总和，子数组代表每一个step的数据
      //数据格式：[[{nodeAVolume:1,nodeBVolume:3,average:2,diff:1, diffPercent:0.1},...],,...]
      //每个元素代表一个节点的流量数据，包含nodeAVolume,nodeBVolume,average,diff,diffPercent,子数组代表每一个step的数据
      
      // 存储结果的数组
      const result = [];

      // 遍历nodeDataA和nodeDataB的每一个step
      for (let i = 0; i < this.routStep; i++) {
        // 获取当前step的数据，如果不存在则使用0作为默认值
        const stepDataA = nodeDataA[i] || [];
        const stepDataB = nodeDataB[i] || [];

        // 存储当前step的比较结果
        const stepResult = [];

        // 遍历每一个节点的数据
        for (let j = 0; j < this.pageNames.length; j++) {
              const nodeDataAItem = stepDataA[j];
              const nodeDataBItem = stepDataB[j];

              // 计算平均值、差值、差值百分比
              const average = (nodeDataAItem + nodeDataBItem) / 2;
              const diff = nodeDataAItem - nodeDataBItem;
              const diffPercent = (diff / ((nodeDataAItem + nodeDataBItem) / 2)) || 0;

              // 存储当前节点的比较结果
              stepResult.push({
                nodeAVolume: nodeDataAItem,
                nodeBVolume: nodeDataBItem,
                average: average,
                diff: diff,
                diffPercent: diffPercent
              });
            }

            // 将当前step的结果添加到总结果数组中
            result.push(stepResult);
          }

          // 计算最大值和最小值，这里假设最大值和最小值是针对所有step的
          this.nodeMaxVolume = Math.max(...result.flat().map(item => Math.max(item.nodeAVolume, item.nodeBVolume)));
          this.nodeMinVolume = Math.min(...result.flat().map(item => Math.min(item.nodeAVolume, item.nodeBVolume)));

          this.nodeDataShow = result;
    },
    getCompareAndAverageLinkData(linkDataA, linkDataB){//比较两个link数据集，计算平均值和差值 并得到volume的最大值和最小值
      //link的数据格式[[[1,2,3...]]]邻接矩阵，第1行第2列代表第1个节点和第2个节点的相互连接情况，以此类推link[i][j]表示节点i和节点j的相互连接情况
      //矩阵的形状为[this.pageNames.length,this.pageNames.length + 1]，最后一列代表dropout节点的连接情况
      //转换为数据格式：[[[{source:1,target:2,LinkAvolume:3, LinkBvolume:2, diff:1,diffPercent:0.1}]]]link的流量数据


      let result = [];

      // 遍历矩阵中的每个元素
      for (let i = 0; i < this.pageNames.length; i++) {
        let lineResult = [];
        for (let j = 0; j < this.pageNames.length + 1; j++) {
          
          const linkA = linkDataA[i][j];
          const linkB = linkDataB[i][j];

          // 计算差值、平均值和差值百分比
          const diff = linkA - linkB;
          const average = (linkA + linkB) / 2;
          const diffPercent = (diff / average) || 0;

          // 将结果添加到结果数组中
          lineResult.push({
            source: i,
            target: j,
            LinkAvolume: linkA,
            LinkBvolume: linkB,
            diff: diff,
            diffPercent: diffPercent,
            average: average
          });
        }
        result.push(lineResult);
      }

      
      // 计算volume的最大值和最小值
      const maxVolume = Math.max(...result.map(link => Math.max(link.LinkAvolume, link.LinkBvolume)));
      const minVolume = Math.min(...result.map(link => Math.min(link.LinkAvolume, link.LinkBvolume)));

      this.linkMaxVolume = maxVolume;
      this.linkMinVolume = minVolume;

      this.linkDataShow = result;
    },
    createGraph() {//创建图层
      let container = document.getElementById('container');
      this.stage = new Konva.Stage({
        container: 'container',
        width: container.clientWidth,
        height: container.clientHeight
      });

      this.layer = new Konva.Layer();
    },
    drawGraph() {//绘制图形

      let firstStepData = this.nodeDataShow[0];
      //画笔位置
      let pen = {x: 0, y: 0}

      let group = new Konva.Group({//用于统一操作 这个group用于装一个step
        x: 120,
        y: 40,
        // rotation: 315,
        draggable: true,
      });

      //绘制节点
      for(let i = 0; i < this.pageNames.length; i++){
        
        let node = firstStepData[i];

        //node 数据格式：{nodeAVolume:1,nodeBVolume:3,average:2,diff:1, diffPercent:0.1}
        //矩形颜色根据diffPercent设置颜色,-1到1之间，对应了11个颜色
        let colorIndex = Math.floor((node.diffPercent + 1) / 2 * 10);
        let nodeWidth = node.average / this.nodeMaxVolume * this.nodeWidth;
        let rect = new Konva.Rect({
        x: pen.x + (this.nodeWidth - nodeWidth) / 2,//居中
        y: pen.y,
        width: nodeWidth,
        height: this.nodeHeight,
        fill: this.colorArr[colorIndex],//根据diffPercent设置颜色,-1到1之间，对应了11个颜色
        stroke: 'black',
        strokeWidth: this.strokeWidth, 
      });

      pen.y += this.nodeHeight + this.strokeWidth / 2;

      group.add(rect);
      }

      pen.x += this.nodeWidth + 10;
      pen.y = 0;
      //绘制矩形虚线框
      let lw = (this.nodeHeight + this.strokeWidth / 2) * (this.pageNames.length + 1);
      let lh = (this.nodeHeight + this.strokeWidth / 2) * this.pageNames.length; //+ this.strokeWidth / 2是因为边也有宽度

      let rect = new Konva.Rect({ 
        x: pen.x,
        y: pen.y,
        width: lw,
        height: lh,
        fill: 'transparent',
        stroke: 'black',
        strokeWidth: this.strokeWidth,
        dash: [5, 5]
      });
      group.add(rect);

      //绘制dropout的line，黑色直线

      //绘制page的标识，用圆圈标识，颜色按照在pageNames中的顺序设置
      pen.x += lw + 10;
      pen.y = this.nodeHeight / 2;
      for(let i = 0; i < this.pageNames.length; i++){

        let circle = new Konva.Circle({
          x: pen.x,
          y: pen.y,
          radius: this.nodeHeight / 2,
          fill: this.pageColor[i],
        });
        pen.y += this.nodeHeight + this.strokeWidth / 2;
        
        group.add(circle);
      }

      //绘制page的标识，文字标识 这里的坑是文件的大小必须与ndoeHeight相等，否则会对不上
      pen.x += 10;
      pen.y = 0;
      for(let i = 0; i < this.pageNames.length; i++){

        let text = new Konva.Text({
          x: pen.x,
          y: pen.y,
          text: this.pageNames[i],
          fontSize: this.nodeHeight,
          fill: 'black',
        });
        pen.y += this.nodeHeight + this.strokeWidth / 2;
        
        group.add(text);
      }


      //绘制link外面的大矩形，也就是diff,size固定，颜色代表差异大小
      firstStepData = this.linkDataShow[0];
      console.log(firstStepData);
      // pen.x = this.nodeWidth + 10;
      // pen.y = 0;
      // for(let i = 0; i < this.pageNames.length; i++){
      //   for(let j = 0; j < this.pageNames.length + 1; j++){
      
      //     let link = firstStepData[i][j];
          
      //     let rect = new Konva.Rect({
      //       x: pen.x,
      //       y: pen.y,
      //       width: this.nodeHeight + this.strokeWidth / 2,
      //       height: this.nodeHeight + this.strokeWidth / 2,
      //       fill: this.colorArr[Math.floor((link.diffPercent + 1) / 2 * 10)],
      //     });
      //     pen.x += this.nodeHeight;
      //     group.add(rect);
      //   }
      //   pen.y += this.nodeWidth;
      //   pen.x = 0;
      // }












      this.layer.add(group);
      this.stage.add(this.layer);
    },




    logFunction(){//测试用函数
      // console.log('nodeDataA:',JSON.stringify(this.nodeDataA));
      // console.log('LinkDataA:',JSON.stringify(this.LinkDataA));
      // console.log('nodeDataShow:',JSON.stringify(this.nodeDataShow));
      // console.log('linkDataShow:',JSON.stringify(this.linkDataShow));
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
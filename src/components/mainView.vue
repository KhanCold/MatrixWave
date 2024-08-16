<template>
  <div>
    <h1 id="container"></h1>
  </div>
</template>

<script>
import Konva from 'konva';

export default {
  props:['nodeFilter','linkFilter','stepFilter','pageNames', 'colorArr', 'pageColor', 'nodeWidth', 'nodeHeight'],
  data() {
    return {
      layer: null,//Konva图层
      stage: null,//Konva画布
      strokeWidth: 1,//线条宽度
      stageX:0,//画布的起始点
      stageY:400,//画布的位置
      //生成数据集参数
      routStep:20,//路径最长值 A->B->C->D->E,路径长度为5，但是需要注意实际序列是A->B->C->D->E->dropOff，所以实际路径长度为6
      spaceBetween:10,//元素之间的留白距离
      maxNumber: 1000,//路径最大数量
      dataA: [],//数据集A
      dataB: [],//数据集B
      
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
      linkDataShow: [],//用于可视化的link数据，数据格式：[[[{source:1,target:2,LinkAvolume:3, LinkBvolume:2, average, diff:1,diffPercent:0.1}]]]
    }
  },
  created() {
  },
  watch:{
    linkMaxVolume(value){ this.$bus.$emit('getLinkMaxVolume', value);},
    nodeMaxVolume(value){ this.$bus.$emit('getnodeMaxVolume', value);},
    stepFilter(){this.createGraph(); this.drawGraph();},
    nodeFilter(){this.createGraph(); this.drawGraph();},
    linkFilter(){this.createGraph(); this.drawGraph();},
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
          //每次有0.3概率结束循环，控制路径长度随机
          if (Math.random() < 0.2) {break;}

          let pageIndex = Math.floor(Math.random() * (this.pageNames.length - 1));//随机选择页面
          route.push(this.pageNames[pageIndex]);
      }
      if(route.length > 1)//路径长度大于1才加入数据集
        route.push('dropOff');
        dataSet.push(route);
      }

      return dataSet;
    },
    getDataSets() {//获取数据集
      this.dataA = this.createDataSets();
      this.dataB = this.createDataSets();
    },
    transformNodeData(originalData){//将原始node数据转换为nodeData
    //原始数据格式：[['page7', 'page1', 'page8', 'page5', 'page4', 'page5', 'dropOff'],['page9', 'page2'], ...]
    //每一个数组代表了一个序列,序列节点为数组中的元素如'page7'，序列最长为this.routeStep + 1，节点编号序列为this.pageNames:['page1', 'page2',...]
    //将原始数据转换为[[1,2,3,..],....]数组中的每一个元素代表一个节点的流量总和，子数组代表每一个step的数据
        let nodeData = [];
      for (let i = 0; i < this.routStep + 1; i++) {
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
      // console.log('nodeData:',JSON.stringify(nodeData));
      return nodeData;
    },
    transformLinkData(originalData){//将原始link数据转换为linkData
      //原始数据格式：[['page7', 'page1', 'page8', 'page5', 'page4', 'page5', 'page1'],['page9', 'page2'], ...]
      //每一个数组代表了一个序列,序列节点为数组中的元素如'page7'，序列最长为this.routeStep，节点编号序列为this.pageNames:['page1', 'page2',...]
      //每一条link是由当前节点和后面的节点构成的，如'page7'->'page1'，就是一个link
      //将原始数据转换为邻接矩阵[[[1,2,3...]]]，其中包含this.routStep个矩阵，每一个矩阵代表着每一个step的邻接矩阵
      //第二层数组代表的就是第n层的邻接矩阵。代表着第n个节点和第n+1个节点的相互连接情况
      //第1行第2列代表第1个节点和第2个节点的相互连接的次数，以此类推link[i][j]表示节点i和节点j的相互连接情况
      //每一个矩阵的形状为[this.pageNames.length,this.pageNames.length + 1]，最后一列代表dropout节点的连接情况,如第一个序列,'page1'->dropout，就是link[0][this.pageNames.length] += 1
      

      // 初始化邻接矩阵数组，每个矩阵的大小为 [pageNames.length, pageNames.length + 1]
      let linkData = new Array(this.routeStep);
      for (let i = 0; i < this.routStep; i++) {
        linkData[i] = new Array(this.pageNames.length + 1).fill(0).map(() => new Array(this.pageNames.length + 1).fill(0));
      }

      // 遍历原始数据，构建邻接矩阵
      originalData.forEach(sequence => {
        sequence.forEach((currentPage, index) => {
          if (index < sequence.length - 1) {// 如果不是最后一个节点，则连接到下一个节点
            const nextPage = sequence[index + 1];
            linkData[index][this.pageNames.indexOf(currentPage)][this.pageNames.indexOf(nextPage)]++;
          }
        });
      });

      return linkData;
    },
    getNodeAndLinkData(){//获取节点和link数据 调用多个函数
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
      for (let i = 0; i < this.routStep + 1; i++) {
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
              const diffPercent = (diff / nodeDataAItem) || 0;

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
      //link的数据格式[[[1,2,3...]]],其中包含了this.routStep个邻接矩阵，矩阵中第1行第2列代表第1个节点和第2个节点的相互连接情况，以此类推link[i][j]表示节点i和节点j的相互连接情况
      //邻接矩阵的形状为[this.pageNames.length,this.pageNames.length + 1]，最后一列代表dropout节点的连接情况
      //转换为数据格式：[[[{source:1,target:2,LinkAvolume:3, LinkBvolume:2, average, diff:1,diffPercent:0.1}]]]link的流量数据

      let result = [];
      for(let i = 0; i < this.routStep; i++){
        let stepLinkDataA = linkDataA[i];
        let stepLinkDataB = linkDataB[i];
        let stepLinkDataShow = [];
        for(let j = 0; j < this.pageNames.length; j++){
          let lineData = [];
          for(let k = 0; k < this.pageNames.length + 1; k++){
            let linkA = stepLinkDataA[j][k];
            let linkB = stepLinkDataB[j][k];
            // console.log('linkA:',linkA,'linkB:',linkB,'diff:',(linkA - linkB) / linkA || 0);
            let linkData = {
              source: j,
              target: k,
              LinkAvolume: linkA,
              LinkBvolume: linkB,
              average: (linkA + linkB) / 2,
              diff: linkA - linkB,
              diffPercent: (linkA - linkB) / linkA || 0
            };
            lineData.push(linkData);
          }
          stepLinkDataShow.push(lineData);
        }
        result.push(stepLinkDataShow);
      }
      this.linkMaxVolume = Math.max(...result.flat().flat().map(item => Math.max(item.LinkAvolume, item.LinkBvolume)));
      this.linkMinVolume = Math.min(...result.flat().flat().map(item => Math.min(item.LinkAvolume, item.LinkBvolume)));
      
      this.linkDataShow = result;
    },
    onMouseWheel(event) {
      event.preventDefault(); // 阻止浏览器默认滚动行为

      const stage = this.stage;
      const scaleBy = 1.3; // 定义缩放比例，可以根据实际情况调整

      // 计算缩放中心为当前鼠标指针在舞台上的坐标
      const pointerPosition = stage.getPointerPosition();
      const centerX = pointerPosition.x;
      const centerY = pointerPosition.y;

      // 计算缩放前舞台的缩放级别
      let oldScaleX = stage.scaleX();
      let oldScaleY = stage.scaleY();

      // 根据鼠标滚轮事件确定缩放方向
      let newScale = event.deltaY < 0 ? oldScaleX * scaleBy : oldScaleX / scaleBy;

      // 更新舞台的缩放级别
      stage.scaleX(newScale);
      stage.scaleY(newScale);

      // 计算缩放后舞台的新偏移量，确保鼠标指针位置不变
      let newOffsetX = centerX - (centerX - stage.x()) * (newScale / oldScaleX);
      let newOffsetY = centerY - (centerY - stage.y()) * (newScale / oldScaleY);

      // 更新舞台的位置
      stage.position({
        x: newOffsetX,
        y: newOffsetY
});

// 重绘舞台
stage.draw();
    },
    createGraph() {//创建图层

      let container = document.getElementById('container');
      this.stage = new Konva.Stage({
        container: 'container',
        width: container.clientWidth,
        height: container.clientHeight
      });
      
      this.layer = new Konva.Layer();
      this.layer.addEventListener("wheel", this.onMouseWheel);
      // this.layer.on('pointerover', ()=> {
      //   this.layer.opacity(0.5);
      // });
    },
    getColorIndex(diffPercent) {
      // 确保diffPercent在-1到1之间
      diffPercent = Math.max(-1, Math.min(1, diffPercent));

      // 计算在-1到0之间的索引
      let index = (diffPercent + 1) / 2 * 5; // 将-1到0映射到0到5
      if (diffPercent === 0) {
        index = 5; // 0对应中间的颜色
      } else if (diffPercent > 0) {
        index = 6 + (diffPercent / 1) * 5; // 将0到1映射到6到10
      }

      // 返回颜色数组中的相应颜色
      return this.colorArr[Math.floor(index)];
    },
    drawNode(nodeStepData, pen, stepGroup) {//绘制节点
      for(let i = 0; i < this.pageNames.length; i++){
          
          let node = nodeStepData[i];

          //node 数据格式：{nodeAVolume:1,nodeBVolume:3,average:2,diff:1, diffPercent:0.1}
          let nodeWidth = node.average / this.nodeMaxVolume * this.nodeWidth;
          let rect = new Konva.Rect({
          x: pen.x + (this.nodeWidth - nodeWidth) / 2,//居中
          y: pen.y,
          width: nodeWidth,
          height: this.nodeHeight,
          fill: this.getColorIndex(node.diffPercent),//根据diffPercent设置颜色,-1到1之间，对应了11个颜色
          stroke: 'black',
          strokeWidth: this.strokeWidth, 
        });

        pen.y += this.nodeHeight + this.strokeWidth / 2;

        stepGroup.add(rect);
        }
    },
    drawRect(pen, lw, lh, stepGroup){//绘制虚线框
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
        stepGroup.add(rect);
    },
    drawPageID(pen, lw, lh, stepGroup){//绘制page的标识 包括圆圈和文字
        //绘制page的标识，用圆圈标识，颜色按照在pageNames中的顺序设置 
        for(let i = 0; i < this.pageNames.length; i++){

          let circle = new Konva.Circle({
            x: pen.x,
            y: pen.y,
            radius: this.nodeHeight / 2,
            fill: this.pageColor[i],
          });
          pen.y += this.nodeHeight + this.strokeWidth / 2;
          
          stepGroup.add(circle);
        }

        //绘制page的标识，文字标识 这里的坑是文件的大小必须与ndoeHeight相等，否则会对不上
        pen.x += this.spaceBetween;
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
          
          stepGroup.add(text);
        }
    },
    drawLinkinner(linkStepData, pen, stepGroup, i, j){//绘制link的内部逻辑
          // 绘制link外面的大矩形，也就是diff,size固定，颜色代表差异大小
          let outerRect = new Konva.Rect({
              x: pen.x,
              y: pen.y,
              width: this.nodeHeight,
              height: this.nodeHeight,
              stroke: 'transparent',
              strokeWidth: this.strokeWidth, 
              fill: this.getColorIndex(linkStepData[i][j].diffPercent),
            });
            //绘制link里面的黑色小矩形，正方形的size代表两个数据集的平均链接量

            outerRect.on('pointerover', function() {
              outerRect.setStroke('red');
              outerRect.setStrokeWidth(2);
            });
            outerRect.on('pointerout', function() {
              outerRect.setStroke('transparent');
            });

            let widthMax = this.nodeHeight - this.strokeWidth;//里面小矩形的最大宽度

            let width = linkStepData[i][j].average / this.linkMaxVolume * widthMax;
            let innerRect = new Konva.Rect({
              x: pen.x + (this.nodeHeight - width) / 2,
              y: pen.y + (this.nodeHeight - width) / 2,
              width: width,
              height: width,
              stroke: 'black',
              strokeWidth: this.strokeWidth,
              fill: 'black',
            });

            pen.x += this.nodeHeight + this.strokeWidth / 2;
            stepGroup.add(outerRect);
            stepGroup.add(innerRect);
    },
    drawLink(k,linkStepData, pen, stepGroup) {//绘制link
      pen.y = 0; 
        for(let i = 0; i < this.pageNames.length; i++){
          pen.x = this.nodeWidth + this.spaceBetween;
          if(k % 2 === 0) {
          for(let j = this.pageNames.length - 1; j >= 0; j--){//反向是为了z字形
            this.drawLinkinner(linkStepData, pen, stepGroup, i, j);
          }
        }
          else {
            for(let j = 0; j < this.pageNames.length; j++){//反向是为了z字形
            this.drawLinkinner(linkStepData, pen, stepGroup, i, j);
          }
          }
          pen.y += this.nodeHeight + this.strokeWidth / 2;
        
      }
    },
    drawLine(pen, lh, stepGroup){//绘制黑色直线
      let line = new Konva.Line({
        points: [pen.x, pen.y, pen.x, pen.y + lh],
        stroke: 'black',
        strokeWidth: this.strokeWidth,
      });
      
      stepGroup.add(line);
    },
    drawGraph() {//绘制图形
      let group = new Konva.Group({//用于统一操作 这个group用于装所有的step
        x: this.stageX,
        y: this.stageY,
        draggable: true,
        
      });
      let xOffset = 0;//每个step之间的x偏移量，用于z字形排列
      let yOffset = 0;//每个step之间的y偏移量，用于z字形排列
      // let k = 1;//用于向上或向下移动

      let cnt =  Math.min(this.stepFilter[1], this.routStep);
      for(let i = this.stepFilter[0]; i < cnt; i++) {//绘制不同的step 起始根据filter来确定
        let k = i - this.stepFilter[0];//循环第几次
        //虚线框的长度和宽度
        let lh = (this.nodeHeight + this.strokeWidth / 2) * this.pageNames.length; //+ this.strokeWidth / 2是因为边也有宽度

        let stepBetweenX = this.nodeWidth + this.spaceBetween + lh;//两个step之间的距离
        let stepBetweenY = lh;
        let lineX = Math.sqrt(stepBetweenX * stepBetweenX + stepBetweenY * stepBetweenY);//x上的直线距离
        
        if(i % 2){ xOffset += lineX; yOffset -= 50;}
        else {
          xOffset += 50;
          yOffset += 50;//不知道为啥要加50，但是加了就刚好对齐了
        }

        let nodeStepData = this.nodeDataShow[i];
        
        //画笔位置
        let pen = {x: 0, y: 0}
    
        let stepGroup = new Konva.Group({//用于统一操作 这个group用于装一个step
          x: xOffset,
          y: yOffset,
          rotation: i % 2 === 0 ? -45 : 45,//z字形
          // draggable: true,
        });

        //绘制节点
        this.drawNode(nodeStepData, pen, stepGroup);

        //绘制矩形虚线框
        pen.x += this.nodeWidth + this.spaceBetween;
        pen.y = 0;
        this.drawRect(pen, lh, lh, stepGroup);


        
        //绘制page的标识包括圆圈和文字
        pen.x += lh + this.spaceBetween;
        pen.y = this.nodeHeight / 2;
        this.drawPageID(pen, lh, lh, stepGroup);

        //绘制link，包含两个矩形
        let linkStepData = this.linkDataShow[i];
        this.drawLink(k ,linkStepData, pen, stepGroup);

        //绘制dropout的line，黑色直线
        if(k % 2 === 0) this.drawLine({x:this.nodeWidth + this.spaceBetween + this.nodeHeight,y:0},lh,stepGroup);
        else this.drawLine({x:this.nodeWidth + this.spaceBetween + lh - this.nodeHeight, y:0}, lh, stepGroup);

        group.add(stepGroup);
      }

      this.layer.add(group);
      this.stage.add(this.layer);
    },
    logFunction(){//测试用函数
      // console.log('nodeDataA:',JSON.stringify(this.nodeDataA));
      // console.log('LinkDataA:',JSON.stringify(this.LinkDataA));
      // console.log('nodeDataShow:',JSON.stringify(this.nodeDataShow));
      // console.log('linkDataShow:',JSON.stringify(this.linkDataShow));
      // console.log('nodeMaxVolume:',this.nodeMaxVolume);
      // console.log('linkMaxVolume:',this.linkMaxVolume);
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
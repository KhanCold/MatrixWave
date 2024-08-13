<template>
  <div id="board" ref="board">

  </div>
</template>

<script>
import Konva from 'konva';
export default {
  props:['pageNames', 'colorArr', 'pageColor', 'nodeWidth', 'nodeHeight'],
  data() {
    return {
      nodeMaxVolume: 0,
      linkMaxVolume: 0,
    }
  },
  mounted() {
    this.$bus.$on('getnodeMaxVolume',value=>this.nodeMaxVolume = value);
    this.$bus.$on('getLinkMaxVolume',value=>this.linkMaxVolume = value);
  },
  watch: {
    nodeMaxVolume() {
      this.drawGraph();
    }
  },
  beforeDestroy() {
    this.$bus.$off('getnodeMaxVolume');
    this.$bus.$off('getLinkMaxVolume');
  },
  methods: {
    drawText(text, pen, fontSize = 30){//绘制文字
      let title = new Konva.Text({
        x: pen.x,
        y: pen.y,
        text: text,
        fontSize: fontSize,
        fontFamily: 'Arial',
        fill: 'black',
        fontStyle: 'bold'
      });
      return title;
    },
    drawColorRect(layer, pen){//绘制颜色矩阵

      pen.y += 50;
      pen.x = 10;
      layer.add(this.drawText('-100%', pen, this.nodeHeight));

      pen.x = 70;

      for(let i = 0; i < 11; i ++)
      {
        let rect = new Konva.Rect({
          x: pen.x,
          y: pen.y,
          width: this.nodeHeight,
          height: this.nodeHeight,
          fill: this.colorArr[i],
          stroke: 'black',
          strokeWidth: 1
        });
        layer.add(rect);
        pen.x += this.nodeHeight + 8;
      }

      pen.x += 10;
      layer.add(this.drawText('100%', pen, this.nodeHeight));
    },
    drawGraph() {
      let container = this.$refs.board;
      let stage = new Konva.Stage({
        container: container, // 注意这里应该传入DOM元素，而不是字符串ID
        width: container.clientWidth,
        height: container.clientHeight
      });

      let layer = new Konva.Layer();

      let pen = {x: 70, y: 50};

      //绘制文字Node Encodings
      layer.add(this.drawText('Node Encodings', pen));

      pen = {x:30, y: 90 + (this.nodeWidth - this.nodeHeight) / 2}
      layer.add(this.drawText('1', pen, this.nodeHeight));
      pen.x = 70;
      pen.y = 90;
      //绘制Node Encodings的小矩形
      for(let i = 0; i < 11; i ++)
      {
        let rect = new Konva.Rect({
          x: pen.x,
          y: pen.y + (this.nodeWidth *(1 - i / 11)) / 2,
          width: this.nodeHeight,
          height: this.nodeWidth * (i / 11),
          fill: 'white',
          stroke: 'black',
          strokeWidth: 1
        });
        layer.add(rect);
        pen.x += this.nodeHeight + 8;
      }

      pen.y = 90 + (this.nodeWidth - this.nodeHeight) / 2;
      pen.x += 10;
      layer.add(this.drawText(this.nodeMaxVolume, pen, this.nodeHeight));


      //绘制颜色描述矩阵
      this.drawColorRect(layer, pen);

      pen.x = 70;
      pen.y += 50;
      //绘制文字Link Encodings
      layer.add(this.drawText('Link Encodings', pen));
      //绘制颜色描述矩阵
      this.drawColorRect(layer, pen);


      pen.x = 30;
      pen.y += 50;
      layer.add(this.drawText('1', pen, this.nodeHeight));
      pen.x = 70;

      //绘制Link Encodings的小矩形
      for(let i = 0; i < 11; i ++) {
        let rect = new Konva.Rect({
          x: pen.x + (this.nodeHeight *(1 - i / 11)) / 2,
          y: pen.y + (this.nodeHeight *(1 - i / 11)) / 2,
          width: this.nodeHeight * (i / 11),
          height: this.nodeHeight * (i / 11),
          fill: 'black',
          stroke: 'black',
          strokeWidth: 1
        });
        layer.add(rect);
        pen.x += this.nodeHeight + 8;
      }
      pen.x += 10;
      layer.add(this.drawText(this.linkMaxVolume, pen, this.nodeHeight));

      //绘制页面名称
      pen.x = 70;
      pen.y += 70;
      layer.add(this.drawText('Page Groups', pen));
      pen.y += 50;
      //绘制页面名称的小矩形和文字
      for(let i = 0; i < this.pageNames.length; i ++) {
        //绘制小矩形
        let rect = new Konva.Rect({
          x: pen.x,
          y: pen.y,
          width: this.nodeHeight,
          height: this.nodeHeight,
          fill: this.pageColor[i],
          stroke: 'black',
          strokeWidth: 1
        });
        //绘制文字
        let text = this.drawText(this.pageNames[i], {x: pen.x + 20, y: pen.y}, this.nodeHeight);
        layer.add(rect);
        layer.add(text);
        pen.y += this.nodeHeight + 8;
      }

      stage.add(layer);
    },
}
}


</script>

<style scoped>
  .container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    padding-left: 20px;
    padding-top: 60px;
    /* background-color: pink; */
  }

  .title {
    font-size: 20px;
    font-weight: bold;
    margin-top: 20px;
    margin-bottom: 20px;
  }


</style>
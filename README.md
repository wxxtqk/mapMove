# mapMove
### 百度地图JavascriptApi Marker平滑移动及车头指向行径方向,

相信只要是使用百度地图做实时定位服务的朋友都会遇到这个问题,在对坐标位置进行覆盖物展示的时候,会出现由于获取坐标数据时间或者两个坐标点相距过远,导致在视觉上看Marker移动就像“僵尸跳”一样，一蹦一蹦的给客户看分分钟鄙视你到不能自已。另外如果用的是有指向性图标ICON的时候，更会引来吐槽~诶诶诶，你这小车车怎么在这个立交桥转弯的时候车头向着后面呢？怎么搞得嘛你！会不会弄啊你！

参考了这位大神http://www.cnblogs.com/peixuanzhihou/p/6540086.html的思路，自己把代码进行一定的改进，哪儿有不对的的地方，希望各位指出，我也是一个百度地图新手

```html
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>Document</title>
	<style type="text/css">
		      body, html,#allmap {width: 100%;height: 100%;overflow: hidden;margin:0;}
	</style>
	<script type="text/javascript" src="http://api.map.baidu.com/api?v=2.0&ak=您的KEY"></script>
</head>
<body>
	<div id="allmap"></div>
</body>
</html>
<script type="text/javascript">
	  var map = new BMap.Map("allmap"); 
    var point = new BMap.Point(116.405, 39.930);
    map.centerAndZoom(point, 15);
    map.addControl(new BMap.NavigationControl());
    map.enableScrollWheelZoom();
    var myP1 = new BMap.Point(116.425,39.93936);    //起点
    var myP2 = new BMap.Point(116.435,39.920);    //终点
    var myIcon = new BMap.Icon('./car.png',new BMap.Size(32,32)) //设置车辆的标志
    var marker = new BMap.Marker(myP1,{icon:myIcon})
    map.addOverlay(marker)
    console.log(marker)
/**
    *小车移动
    *@param {Point} prvePoint 开始坐标(PrvePoint)
    *@param {Point} newPoint 目标点坐标
    *@param {Function} 动画效果
    *@return  无返回值
    */
var Move = function(prvePoint, newPoint, marker){
    // 当前帧数
    var currentCount = 0
    // _当前的坐标,把球面坐标坐标转化为平面坐标
    var _prvePoint = map.getMapType().getProjection().lngLatToPoint(prvePoint)
    // _终点的坐标,把球面坐标坐标转化为平面坐标
    var _newPoint = map.getMapType().getProjection().lngLatToPoint(newPoint)
    console.log('起始点的球面坐标',_prvePoint)
    console.log('终点点的球面坐标',_newPoint)
    // 运行的状态
    var runTime = 10000
    // 每隔多长时间执行一次
    var intervalTimer = 16.7 
    // 两点之间要循环定位的次数
    var count = runTime / intervalTimer
    //设置定时器
    var timer = null
    console.log(myP2)
    timer = setInterval(function(){
      // 防止便利完后maker不在了
      if (currentCount > count) {
        clearInterval(timer)
        marker.setPosition(myP2)
        return
      }else {
        currentCount++
         var x = linear(_prvePoint.x, _newPoint.x, currentCount, count),
             y = linear(_prvePoint.y, _newPoint.y, currentCount, count);
      }
      var pos = map.getMapType().getProjection().pointToLngLat(new BMap.Pixel(x, y))

      //设置marker角度(两点之间的距离车的角度保持一致)
      if (currentCount == 1) {
        //转换角度
        setRotation(prvePoint,newPoint,marker)
      }
      //最后一次的pos等于0
      marker.setPosition(pos)
    },intervalTimer)
    /*
    *缓动效果
    *初始坐标，目标坐标，当前的步长，总的步长
    *@param{BMap.Pixel} initPos 初始平面坐标
    *@parm{BMap.Pixel} targetPos 目标平面坐标
    *@param{number} 当前帧数
    *@param {number} count 总帧数
    */
    var linear = function (initPos, targetPos, currentCount, count) {
        var b = initPos, 
        c = targetPos - initPos,
        t = currentCount,
        d = count;
        return c * t / d + b;
    }

    /**
    *在每个点的真实步骤中设置小车转动的角度
    *@param{BMap.Point} curPos 起点
     *@param{BMap.Point} targetPos 终点
    */
    function setRotation(curPos, targetPos,marker){
      var deg = 0
      curPos = map.pointToPixel(curPos)
      targetPos = map.pointToPixel(targetPos)
      if (targetPos.x != curPos.x) {
          var tan = (targetPos.y - curPos.y) / (targetPos.x - curPos.x),
          atan = Math.atan(tan);
          deg = atan * 360 / (2 * Math.PI);
          if (targetPos.x < curPos.x) {
              deg = -deg + 90 + 90;
          } else {
              deg = -deg;
          }
          deg = -90+deg  //这段代码是我自己加的，只要加了deg = -90+deg 车辆的车头指向才会正确,
          console.log('不等于的时候',deg)
          console.log('起点x',curPos.x)
          console.log('起点y',curPos.y)         
          console.log('终点x',targetPos.x)
          console.log('终点y',targetPos.y)
          marker.setRotation(-deg);

      } else {
          var disy = targetPos.y - curPos.y;
          var bias = 0;
          if (disy > 0)
              bias = -1
          else
              bias = 1
          marker.setRotation(-bias * 90);
          console.log('等于的时候',deg)
      }
    }
}
Move(myP1, myP2,marker)

</script>
```

其中对setRotation函数中下面这段代码是我加以改进的。其实下面这段代码有点不太理解，我只有在加了deg=-90+deg后车辆的车头指向才会正确。

```javascript
 deg = -90+deg  //这段代码是我自己加的，只要加了deg = -90+deg 车辆的车头指向才会正确,
```

![GIF.gif](GIF.gif)

我这个demo的起点和终点设置的比较远，可以根据需求进行自我调整

### 在百度地图上显示态势图

 在百度地图显示态势图 https://github.com/wxxtqk/mapMove/tree/master/trend




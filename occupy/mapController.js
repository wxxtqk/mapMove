/**
 * 地图相关操作库
 */
function MapController(container, center) {
    this.map = new BMap.Map(container)
    this.point = new BMap.Point(center.lon, center.lat);
    this.map.centerAndZoom(this.point, 16);
    this.map.addControl(new BMap.NavigationControl());
    this.map.enableScrollWheelZoom();
    this.map.addEventListener('click',function(e){
        console.log(e)
    })
}
/**
 * 以事发地为中间,radius为半径画circle
 * @param {any} radius circle的半径 
 */
MapController.prototype.mapCircle = function (radius) {
    var circle = new BMap.Circle(this.point,
        radius, {
            strokeColor: "red", //原型边框颜色
            strokeWeight: 2,
            strokeStyle: 'dashed',
            strokeOpacity: 0.5,
            fillColor: 'transparent'
        })
    this.map.addOverlay(circle) // 创建circle
    return this
}
/**
 * 用图片标记事发地
 * @param {any} point  标记的点
 * @param {any} icon  标记的图片
 */
MapController.prototype.markerIcon = function (point, icon) {
    this.markerPoint = new BMap.Point(point.lon, point.lat) // 标记的位置
    var marker = icon ? new BMap.Marker(this.markerPoint, {
        icon: icon
    }) : new BMap.Marker(this.markerPoint)
    this.map.addOverlay(marker)
    return marker
}
/**
 * 给标记添加点击事件,在地图上显示窗口信息
 * @param {string} content 
 * @param {object} marker 
 */
MapController.prototype.addClick = function (marker, content) {
    content = content || '默认信息'
    marker.addEventListener('click', function (e) {
        var p = e.target
        var point = new BMap.Point(p.getPosition().lng, p.getPosition().lat) // 获取点击的marker的经纬度
        var infoWindow = new BMap.InfoWindow(content) //创建信息窗口对象
        this.map.openInfoWindow(infoWindow, point); //开启信息窗口
    })
}
/**
 *地图标记水源 
 * @param {array} data 水源数据 
 * @param return 返回水源信息[array]
 */
MapController.prototype.sourceWater = function (data) {
    var imgsrc = ["./water.png", "./water.png", "./water.png", "./water.png"]
    this.waterList = []
    for (var i = 0; i < data.length; i++) {
        var marker = this.markerIcon({
            lon: data[i].fireWaterLon,
            lat: data[i].fireWaterLai
        }, new BMap.Icon(imgsrc[0], new BMap.Size(13, 21)))
        this.waterList.push({
            marker: marker,
            info: data[i]
        })
    }
    return this.waterList
}
/**
 * 画直线
 * @param {*} prvePoint  起始点
 * @param {*} newPoint  终点
 * @param {*} options  一些配置参数
 */
MapController.prototype.mapLine = function (prvePoint, newPoint, options) {
    var config = {
        color: 'blue',
        weight: 2,
        opacity: 0.5,
        style: 'solid'
    }
    prvePoint = new BMap.Point(prvePoint.lon, prvePoint.lat)
    newPoint = new BMap.Point(newPoint.lon, newPoint.lat)
    options = $.extend(config, options)
    // 警戒线到水源的位置的虚线
    var polyline = new BMap.Polyline([
        prvePoint, newPoint
    ], {
        strokeColor: options.color,
        strokeWeight: options.weight,
        strokeOpacity: options.opacity,
        strokeStyle: options.style
    });
    this.map.addOverlay(polyline)
    return this
}

/**
 * 消防车移动
 * @param {object} prvePoint 
 * @param {object} newPoint 
 */

function Move(marker, options) {
    this.marker = marker
    this.map = options.map
    this.mapLine = options.mapLine
}
Move.prototype.car = function (prvePoint, newPoint, time, end) {
    self = this
    end = end
    console.log(this)
    markerNext = newPoint
    prvePoint = new BMap.Point(prvePoint.lon, prvePoint.lat)
    newPoint = new BMap.Point(newPoint.lon, newPoint.lat)
    // 当前帧数
    var currentCount = 0
    // _当前的坐标,把球面坐标坐标转化为平面坐标
    var _prvePoint = self.map.getMapType().getProjection().lngLatToPoint(prvePoint)
    // _终点的坐标,把球面坐标坐标转化为平面坐标
    var _newPoint = self.map.getMapType().getProjection().lngLatToPoint(newPoint)
    // 运行的状态
    var runTime = time || 100000
    // 每隔多长时间执行一次
    var intervalTimer = 30.7
    // 两点之间要循环定位的次数
    var count = runTime / intervalTimer
    //设置定时器
    var timer = null
    timer = setInterval(function () {
        // 防止便利完后maker不在了
        if (currentCount > count) {
            clearInterval(timer)
            self.marker.setPosition(newPoint)
            if (end) {
                self.car(markerNext, end, 20000)
                self.mapLine(markerNext,end,{
                    style: 'dashed'
                })
            }
            return
        } else {
            currentCount++
            var x = linear(_prvePoint.x, _newPoint.x, currentCount, count),
                y = linear(_prvePoint.y, _newPoint.y, currentCount, count);
        }
        var pos = self.map.getMapType().getProjection().pointToLngLat(new BMap.Pixel(x, y))

        //设置marker角度(两点之间的距离车的角度保持一致)
        if (currentCount == 1) {
            //转换角度
            setRotation(prvePoint, newPoint, self.marker)
        }
        //最后一次的pos等于0
        self.marker.setPosition(pos)
    }, intervalTimer)
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
    function setRotation(curPos, targetPos, marker) {
        var deg = 0
        curPos = self.map.pointToPixel(curPos)
        targetPos = self.map.pointToPixel(targetPos)
        if (targetPos.x != curPos.x) {
            var tan = (targetPos.y - curPos.y) / (targetPos.x - curPos.x),
                atan = Math.atan(tan);
            deg = atan * 360 / (2 * Math.PI);
            if (targetPos.x < curPos.x) {
                deg = -deg + 90 + 90;
            } else {
                deg = -deg;
            }
            deg = -90 + deg
            marker.setRotation(-deg)
        } else {
            var disy = targetPos.y - curPos.y;
            var bias = 0;
            if (disy > 0)
                bias = -1
            else
                bias = 1
            marker.setRotation(-bias * 90);
        }
    }

}

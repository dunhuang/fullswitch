# INTRO 简介
这是一个实现满屏滚动的插件，可以配合jquery和zepto使用
# 页面结构
三层结构，参考demo
# OPTIONS 配置
```javascript
  var list = $('.fullswitch-container .fullswitch-pagelist'); 使用插件时结构层次须与本例一致，但不一定用ul或li标签，
  list.fullSwitch({
    pages: 'fullswitch-page', 
    scrollPage: '.fullswitch-longpage', //超长页（长度超出屏幕的页），只能一个
    easing: 'ease-in-out',
    hash: true, //不支持url hash就写成false
    unTouchedPages: '.page7', //不能用触摸翻屏的page，可以多个
    orientStretch: false//
  });
```
  配置项列表如下：
```javascript
  {
    speed: 200,
    axis: 'y', //方向: y: vertical, x: horizontal
    pages: 'section', //pages selector name
    scrollPage: false, //超长页（长度超出屏幕的页），只能一个
    unTouchedPages: false, //不能滑动的页
    threshold: 50, //变页的门槛值px值
    fromScrollToOther: true, //是否可以从超长页到其他页
    swipeMaxTime: 500, //swipe事件的临界时间,ms
    swipeBaseTime: 500, //模拟scroll事件时计算的基础时间
    scrollSwipe: true, //是否支持scrollSwipe事件
    scrollSwipeGap: 50,
    loop: false, //是否可以从最后一页到第一页
    easing: 'cubic-bezier(0,.84,1,.22)', //easing 贝瑟尔曲线
    mouseMoveAvailable: true, //是否支持mouseMove事件
    orientStretch: true,//在终端方向改变时是否拉伸页面背景，false为等比缩小，true为拉伸铺满
    hash: false //启动hash功能
  }
 ```
# API 
  * goNext() 到下一页
  * goPrev() 到上一页
  * goPage(to,from) 从from页到to页
  * goStep(step) 可以用来设置".fullswitch-pagelist"的transform值 
  * goPresent() 回到本页
  * offTouch() 关闭touch事件监听
  * onTouch() 启动touch事件监听
# EVENT 事件
  * 绑定gopage事件，当从from页开始换到to页时触发（变页动画开始时触发）<br/>
  ```
  list.on("gopage", function (e, to, from) {
    ...
  });
  ```
  * 绑定transend事件，当变到page页时触发（与上面的区别是此事件在变页动画结束时触发）<br/>
  ```
  list.on("transend", function(e, page){
    ...
  });
  ```
  * 绑定orientationchange事件，在page页时发生orientchange事件时触发<br/>
  ```
  list.on("orientchange", function(e, page){
    ...
  }); 
  ```
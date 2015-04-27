$(function () { //如scroll内容中有图片，应在window.onload里使用,否则可在$(document).ready中使用

  var list = $('.container .pagelist'); //使用插件时结构层次须与本例一致，但不一定用ul或li标签，
  //容器初始化
  list.fullSwitch({
    pages: 'section', //全部的page
    //fromScrollToOther: false,
    scrollPage: '.scrollbox', //支持scroll的超长page，只能一个
    scrollSwipeMaxTime: 500,
    swipeBaseTime: 500,
    easing: 'cubic-bezier(0,.84,1,.22)',
    speed: 200,
    hash: true //不支持hash就写成false
      //unTouchedPages: '.page7'//不能用触摸翻屏的page，可以多个
      /*其他设置项见插件pageBox.js*/
  });

  list.on('transend', function (e, page) {
    //绑定动画结束事件，在翻页动画结束时触发，page：动画结束时的当前页
    console.log('transend', page);
  });

  //按钮点击翻屏事件
  $('.nextpage', list).on('tap', function () {
    list.fullSwitch('goNext'); //翻页驱动，下一页
  });
  $('.prevpage', list).on('tap', function () {
    list.fullSwitch('goPrev'); //翻页驱动，上一页
  });

  $('.offtouch').on('tap', function () {
    list.fullSwitch('offTouch');
  });
  $('.ontouch').on('tap', function () {
    list.fullSwitch('onTouch');
  });
});
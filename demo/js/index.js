$(function () { //如scroll内容中有图片，应在window.onload里使用,否则可在$(document).ready中使用

  var list = $('.fullswitch-container .fullswitch-pagelist'); //使用插件时结构层次须与本例一致，但不一定用ul或li标签，
  //容器初始化
  list.fullSwitch({
    pages: 'fullswitch-page', //全部的page
    scrollPage: '.fullswitch-longpage', //支持scroll的超长page，只能一个
    easing: 'ease-in-out',
    unTouchedPages: '.page7', //不能用触摸翻屏的page，可以多个
    orientStretch: false
  });
  //按钮点击翻屏事件
  $('.nextpage', list).on('click', function () {
    list.fullSwitch('goNext'); //翻页驱动，下一页
  });
  $('.prevpage', list).on('click', function () {
    list.fullSwitch('goPrev'); //翻页驱动，上一页
  });
  $('.offtouch').on('click', function () {
    list.fullSwitch('offTouch');
  });
  $('.ontouch').on('click', function () {
    list.fullSwitch('onTouch');
  });
});
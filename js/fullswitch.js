/*
 *  Description: fullswith.js depends on jquery 1.8 + or zepto, which is used to switch pages by TOUCH event, while each page occupies full screen.
 *      One oversized page is also supported in this plugin.
 *      h5的转场插件，实现全屏页面touch切换，支持一个超长页面并模拟它的滚动事件。依赖jquery 1.8 + 或 zepto
 *
 *  Author: Dunhuang
 *  QQ: 573329
 *  Email: shiyh2012@foxmail.com
 *  Date: 04/21/2015
 */
;
(function ($, window, undefined) {
  var pluginName = 'fullSwitch',
    document = window.document,
    methodHandler = ["goPage", "goStep", "goNext", "goPrev", "goPresent", "offTouch", "onTouch"],
    defaults = {
      speed: 200,
      axis: 'y', //方向: y: vertical, x: horizontal
      pages: 'section', //pages selector name
      scrollPage: false, //if there false，有写class
      unTouchedPages: false, //不能滑动的页
      threshold: 50, //变页的门槛值px值
      fromScrollToOther: true, //scroll页可以到其他页吗
      swipeMaxTime: 500, //swipe事件的临界时间,ms
      swipeBaseTime: 500, //模拟scroll事件时计算的基础时间
      scrollSwipe: true, //是否支持scrollSwipe事件
      loop: false, //是否可以从最后一页到第一页
      easing: 'cubic-bezier(0,.84,1,.22)', //easing 贝瑟尔曲线
      mouseMoveAvailable: true, //是否支持mouseMove事件
      orientStretch: true,
      hash: false //启动hash功能
    };

  function Plugin(element, options) {
      this.options = $.extend({}, defaults, options);
      this.transendEvent = this.getTransendEventName();
      this.transitionName = this.getPrefixProp('transition');
      this.transformName = this.getPrefixProp('transform');
      this.ul = $(element);
      this.pages = this.ul.children();
      this.length = this.pages.length;
      this.axis = this.options.axis;
      this.changed = false;
      if (this.length === 0) return false;
      if (this.options.scrollPage) {
        this.scrollPage = this.ul.find(this.options.scrollPage);
        this.scrollIndex = this.scrollPage.index();
      }
      if (this.options.unTouchedPages) {
        this.unTouchedPages = this.ul.find(this.options.unTouchedPages);
      }
      this._initPx();
      this.page = 0; //当前显示的页码
      this.prePage = 0;
      this.started = false;
      this.moved = false;
      this.animating = false;
      this.startPos = {};
      this.movePos = {};
      this.endPos = {};
      this.trans = {};
      this.startTrans = {};
      this.init();
    }
    // Helper function to get the proper vendor property name.
    // (`transition` => `WebkitTransition`)
  Plugin.prototype.getPrefixProp = function (prop) {
    // Handle unprefixed versions (FF16+, for example)
    var div = document.createElement('div');
    if (prop in div.style) return prop;

    var prefixes = ['Moz', 'Webkit', 'O', 'ms'];
    var prop_ = prop.charAt(0).toUpperCase() + prop.substr(1);

    for (var i = 0; i < prefixes.length; ++i) {
      var vendorProp = prefixes[i] + prop_;
      if (vendorProp in div.style) {
        return vendorProp;
      }
    }
  };

  Plugin.prototype.getTransendEventName = function () {
    var eventNames = {
      'transition': 'transitionend',
      'MozTransition': 'transitionend',
      'OTransition': 'oTransitionEnd',
      'WebkitTransition': 'webkitTransitionEnd',
      'msTransition': 'MSTransitionEnd'
    };
    // Detect the 'transitionend' event needed.
    return eventNames[this.getPrefixProp('transition')] || null;
  };

  Plugin.prototype._initPx = function () {
    var that = this
    this.unitHeight = this.axis === 'y' ? window.innerHeight : window.innerWidth;
    //this.unitHeight = this.axis === 'y' ? parseInt(document.documentElement.clientHeight) : parseInt(document.documentElement.clientWidth);
    //this.unitHeight = this.axis === 'y' ? this.pages.eq(0).height() : this.pages.eq(0).width(); 
    this.scrollHeight = !this.options.scrollPage ? 0 : (this.axis === 'y' ? this.scrollPage.height() : this.scrollPage.width());
    this.height = this.unitHeight * (this.length - 1) + this.scrollHeight;
    if (window.innerHeight > window.innerWidth) {
      this.pages.css({
        width: window.innerWidth,
        height: this.unitHeight
      });
    } else {
      this.pages.css({
        width: that.options.orientStretch ? window.innerWidth : window.innerHeight / window.innerWidth * window.innerHeight,
        height: this.unitHeight
      });
    }
    $('body').css({
      height: this.unitHeight
    });
    if (this.options.scrollPage) {
      this.scrollPage.css({
        height: this.scrollHeight
      });
    }
    this.ul.css({
      height: this.height
    });
    this._initPageArr();
  };

  Plugin.prototype._initPageArr = function () {
    var h = 0,
      pageH = 0,
      that = this,
      index;
    this.pageArr = [];
    for (var i = 0; i < this.pages.length; i++) {
      pageH = this.axis === 'y' ? this.pages.eq(i).height() : this.pages.eq(i).width();
      this.pageArr.push([-h, -h - pageH + 1]);
      h += pageH;
    }
    this.scrollTransArr = [];
    if (this.options.scrollPage) {
      this.scrollTransArr = [this.pageArr[this.scrollIndex][0], this.pageArr[this.scrollIndex][1] + this.unitHeight];
    }
    this.unTouchedArr = [];
    if (this.options.unTouchedPages) {
      this.unTouchedPages.each(function () {
        index = $(this).index();
        that.unTouchedArr.push(that.pageArr[index][0]);
      });
    }
  }

  Plugin.prototype.init = function () {
    var that = this;
    this._setTransform(0);
    //绑定tuchstart事件
    this.handler = {
      tstart: function (e) {
        that._eventstart.call(that, e, true);
      },
      tmove: function (e) {
        that._eventmove.call(that, e, true);
      },
      tend: function (e) {
        that._eventend.call(that, e, true);
      },
      mstart: function (e) {
        that._eventstart.call(that, e, false);
      },
      mmove: function (e) {
        that._eventmove.call(that, e, false);
      },
      mend: function (e) {
        that._eventend.call(that, e, false);
      }
    }
    document.addEventListener('touchstart', that.handler.tstart, false);
    document.addEventListener('touchmove', that.handler.tmove, false);
    document.addEventListener('touchend', that.handler.tend, false);
    if (this.options.mouseMoveAvailable) { //鼠标事件
      document.addEventListener('mousedown', that.handler.mstart, false);
      document.addEventListener('mousemove', that.handler.mmove, false);
      document.addEventListener('mouseup', that.handler.mend, false);
    }
    //绑定webkitTransitionEnd事件
    this.ul[0].addEventListener(that.transendEvent, function (e) {
      //this.started = false; 
      that._transitionend.call(that, e);
      that.ul.trigger('transend', that.page);
    }, false);
    window.addEventListener("orientationchange", function (e) {
      setTimeout(function () {
        that._initPx();
        that.removeTrans();
        that.goPage(that.page);
      }, 200);
    }, false);
    if (this.options.hash) {
      var hash = parseInt(location.hash.substring(1));
      hash = isNaN(hash) ? 0 : hash;
      this.page = hash;
      this.goStep(this.pageArr[hash][0]);
    }
  };

  Plugin.prototype._eventstart = function (e, iftouch) {
    var that = this,
      ev = iftouch ? e.changedTouches[0] : e,
      arrTrans = [];
    this.started = false;
    this.removeTrans();
    this.startPos = {
      x: ev.pageX,
      y: ev.pageY
    };
    this.startTrans = this._getTrans();
    if (this.options.unTouchedPages && this.unTouchedArr.indexOf(this.startTrans[this.axis]) > -1) {
      return false;
    }
    this.started = true;
    this.moved = false;
    this.startTime = e.timeStamp;
  };

  Plugin.prototype._eventmove = function (e, iftouch) {
    if (!this.started) return;
    this.moved = true;
    e.preventDefault();
    var ev = iftouch ? e.changedTouches[0] : e;
    this.movePos = {
      x: ev.pageX,
      y: ev.pageY
    }
    this.moveTime = e.timeStamp;
    if (!this.options.loop) {
      if (this.startTrans[this.axis] === this.pageArr[0][0] && this.movePos[this.axis] > this.startPos[this.axis]) {
        return; //第一页，不能上拉
      }
      if (this.scrollPage && this.scrollIndex === this.length - 1) { //scroll页是最后一页
        if (this.startTrans[this.axis] === this.scrollTransArr[1] && this.movePos[this.axis] < this.startPos[this.axis]) { //到达最后一页，底部不能下拉
          return;
        }
        if (this.startTrans[this.axis] + this.movePos[this.axis] - this.startPos[this.axis] > this.pageArr[this.length - 1][1]) {
          this.goStep(this.startTrans[this.axis] + this.movePos[this.axis] - this.startPos[this.axis]);
        }
      }
    }
    if (this.options.scrollPage && this.startTrans[this.axis] <= this.scrollTransArr[0] && this.startTrans[this.axis] >= this.scrollTransArr[1] && !this.fromScrollToOthers) { //超长页且不能到别的页
      if (this.movePos[this.axis] > this.startPos[this.axis]) { //上
        if (this.startTrans[this.axis] + this.movePos[this.axis] - this.startPos[this.axis] > this.scrollTransArr[0]) {
          return;
        }
      } else if (this.movePos[this.axis] < this.startPos[this.axis]) { //下
        if (this.startTrans[this.axis] + this.movePos[this.axis] - this.startPos[this.axis] < this.scrollTransArr[1]) {
          return;
        }
      }
    }
    if (this.startTrans[this.axis] + this.movePos[this.axis] - this.startPos[this.axis] > this.pageArr[this.length - 1][0]) {
      this.goStep(this.startTrans[this.axis] + this.movePos[this.axis] - this.startPos[this.axis]);
    }
  };

  Plugin.prototype._eventend = function (e, iftouch) {
    var ev = iftouch ? e.changedTouches[0] : e,
      margin0 = 0,
      margin1 = 0,
      step, endstep;
    if (this.options.scrollPage) {
      margin0 = this.scrollTransArr[0];
      margin1 = this.scrollTransArr[1];
    }
    this.endPos = {
      x: ev.pageX,
      y: ev.pageY
    };
    if (!this.started) return;
    this.started = false;
    if (this.endPos[this.axis] == this.startPos[this.axis]) { //没有移动
      return;
    }
    this.trans = this._getTrans();
    this.endTime = e.timeStamp;
    if (this.endPos[this.axis] < this.startPos[this.axis]) { //向下滚屏，一般情况出下一页
      if (!this.options.scrollPage) { //只有一般页
        if (Math.abs(this.endPos[this.axis] - this.startPos[this.axis]) >= this.options.threshold) {
          this.goNext();
        } else {
          this.goPresent();
        }
      } else { //存在超长页
        if (!this.options.fromScrollToOther && this.startTrans[this.axis] === margin1) { //如果现在在超长页页尾，不能进入别的页
          //this.goScrollBot(); 
        } else if (this.scrollIndex === this.length - 1 && this.startTrans[this.axis] === margin1) { //超长页为最后一页，在页尾
          if (this.options.loop) { //循环
            this.goNext();
          } else { //不动
            return;
          }
        } else if (this.startTrans[this.axis] > margin0 || this.startTrans[this.axis] < margin1) { //现在在一般页
          if (Math.abs(this.endPos[this.axis] - this.startPos[this.axis]) >= this.options.threshold) {
            this.goNext();
          } else {
            this.goPresent();
          }
          return;
        } else if (this.startTrans[this.axis] === margin1) { //到达scroll页的下边界，下一页
          this.goNext();
        } else { //超长页面区域
          step = this.startTrans[this.axis] + this.endPos[this.axis] - this.startPos[this.axis];

          var distance = Math.abs(this.endPos[this.axis] - this.startPos[this.axis]);
          var timediff = this.endTime - this.startTime;
          if (!this.options.scrollSwipe || timediff >= this.options.swipeMaxTime) { //大于0.5秒，只挪动相应距离，无滑动
            endstep = Math.max(step, margin1);
          } else {
            endstep = Math.max(step - distance * this.scrollHeight / this.unitHeight * (this.options.swipeBaseTime - timediff) / this.options.swipeMaxTime, margin1);
            this.ul[0].style[this.transitionName] = 'all ' + (this.options.swipeBaseTime) / 1000 + 's ease-out';
          }
          step = endstep;
          this.goStep(step);
        }
      }
    } else { //向上滚屏
      if (!this.options.scrollPage) { //只有一般页
        if (Math.abs(this.endPos[this.axis] - this.startPos[this.axis]) >= this.options.threshold) {
          this.goPrev();
        } else {
          this.goPresent();
        }
      } else { //存在超长页
        if (!this.options.fromScrollToOther && this.startTrans[this.axis] === margin0) { //如果现在在超长页页头，且不能进入别的页
          //this.goScrollTop(); 
        } else if (this.startTrans[this.axis] > margin0 || this.startTrans[this.axis] < margin1) { //
          if (Math.abs(this.endPos[this.axis] - this.startPos[this.axis]) >= this.options.threshold) {
            this.goPrev();
          } else {
            this.goPresent();
          }
          return;
        } else if (this.startTrans[this.axis] === margin0) { //到达scroll页的上边界，上一页
          this.goPrev();
        } else { //超长页面区域
          step = this.startTrans[this.axis] + this.endPos[this.axis] - this.startPos[this.axis];

          var distance = Math.abs(this.endPos[this.axis] - this.startPos[this.axis]);
          var timediff = this.endTime - this.startTime;
          if (!this.options.scrollSwipe || timediff >= this.options.swipeMaxTime) { //大于0.5秒，只挪动相应距离，无滑动
            endstep = Math.min(step, margin0);
          } else {
            endstep = Math.min(step + distance * this.scrollHeight / this.unitHeight * (this.options.swipeBaseTime - timediff) / this.options.swipeMaxTime, margin0);
            this.ul[0].style[this.transitionName] = 'all ' + (this.options.swipeBaseTime) / 1000 + 's ease-out';
          }
          step = endstep;
          this.goStep(step);
        }
      }
    }
  };

  Plugin.prototype._getPageIndex = function (h) {
    if (h < this.pageArr[0]) return -1;
    for (var i = 0; i < this.pageArr.length; i++) {
      if (h <= this.pageArr[i][1] && h >= this.pageArr[i][0]) return i;
    }
    return i;
  };

  Plugin.prototype._getTrans = function () {
    var transformStr = this.ul[0].style[this.transformName] || '',
      arrTrans = transformStr.match(/translate3d\((.*)\)/),
      arr;
    if (!arrTrans || arrTrans.length == 0) {
      this.ul[0].style[this.transformName] = 'translate3d(0,0,0)';
      arr = [0, 0, 0];
    } else {
      arr = arrTrans[1].split(',');
    }
    return {
      x: parseInt(arr[0], 10),
      y: parseInt(arr[1], 10)
    }
  };
  Plugin.prototype._transitionend = function (e) {
    var that = this;
    this.animating = false;
    this.options.transEndCb && this.options.transEndCb.call(that, that.page);
  }
  Plugin.prototype.getAxis = function () {
    return this.options.axis;
  }
  Plugin.prototype.goStep = function (step) {
    this.trans[this.axis] = step;
    this._setTransform(step);
  };

  Plugin.prototype._setTransform = function (step) {
    if (this.axis === 'y') {
      this.ul[0].style[this.transformName] = 'translate3d(0,' + step + 'px,0)';
    } else {
      this.ul[0].style[this.transformName] = 'translate3d(' + step + 'px,0,0)';
    }
  };
  Plugin.prototype.goPage = function (to, from) {
    this.page = to;
    this.options.hash && (location.hash = '#' + to);
    if (typeof from == 'undefined') {
      from = this.page;
    }
    if (this.options.scrollPage) {
      if (to === this.scrollIndex && from === this.scrollIndex + 1) {
        this.goScrollBot();
        this.ul.trigger('gopage', [to, from]);
        return;
      }
    }
    this.addTrans();
    var newMargin = 0;
    if (to >= this.pageArr.length) {
      to = from;
    } else if (to < 0) {
      to = 0;
    }
    newMargin = this.pageArr[to][0];
    this._setTransform(newMargin);
    this.animating = true;
    this.ul.trigger('gopage', [to, from]);
  };

  Plugin.prototype.goNext = function () {
    var index = this.page;
    if (index === this.pageArr.length - 1) {
      if (this.options.loop) {
        index = 0;
      }
    } else {
      index++;
    }
    this.goPage(index, this.page);
  };

  Plugin.prototype.goPresent = function () {
    this.goPage(this.page, this.page);
  };

  Plugin.prototype.offTouch = function () {
    var that = this;
    document.removeEventListener('touchstart', that.handler.tstart, false);
    document.removeEventListener('touchmove', that.handler.tmove, false);
    document.removeEventListener('touchend', that.handler.tend, false);
    if (this.options.mouseMoveAvailable) { //鼠标事件
      document.removeEventListener('mousedown', that.handler.mstart, false);
      document.removeEventListener('mousemove', that.handler.mmove, false);
      document.removeEventListener('mouseup', that.handler.mend, false);
    }
  }

  Plugin.prototype.onTouch = function () {
    this.offTouch();
    var that = this;
    document.addEventListener('touchstart', that.handler.tstart, false);
    document.addEventListener('touchmove', that.handler.tmove, false);
    document.addEventListener('touchend', that.handler.tend, false);
    if (this.options.mouseMoveAvailable) { //鼠标事件
      document.addEventListener('mousedown', that.handler.mstart, false);
      document.addEventListener('mousemove', that.handler.mmove, false);
      document.addEventListener('mouseup', that.handler.mend, false);
    }
  }

  Plugin.prototype.goScrollBot = function () {
    this.addTrans();
    var newMargin = 0;
    this.page = this.scrollIndex;
    newMargin = this.scrollTransArr[1];
    this._setTransform(newMargin);
  };

  Plugin.prototype.goScrollTop = function () {
    this.addTrans();
    var newMargin = this.scrollTransArr[0];
    this._setTransform(newMargin);
  };

  Plugin.prototype.goPrev = function () {
    var index = this.page;
    if (index !== 0) {
      index--;
    }
    this.goPage(index, this.page);
  };

  Plugin.prototype.addTrans = function () {
    this.ul[0].style[this.transitionName] = 'all ' + this.options.speed / 1000 + 's ' + this.options.easing;
  };

  Plugin.prototype.removeTrans = function () {
    this.ul[0].style[this.transitionName] = 'all 0 linear';
  };

  $.fn[pluginName] = function (options) {
    if (typeof options == 'string') {
      var args = arguments,
        method = options,
        isHandler = function () {
          for (var i = 0; i < methodHandler.length; i++) {
            if (methodHandler[i] === method) return true;
          }
          return false;
        };
      Array.prototype.shift.call(args);
      if (method == 'check') {
        return !!this.data('plugin_' + pluginName);
      } else if (isHandler()) {
        return this.each(function () {
          var _plugin = $(this).data('plugin_' + pluginName);
          if (_plugin && _plugin[method]) _plugin[method].apply(_plugin, args);
        });
      } else {
        throw new TypeError(pluginName + ' has no method "' + method + '"');
      }
    } else {
      return this.each(function () {
        var _plugin = $(this).data('plugin_' + pluginName);
        if (!_plugin) {
          $(this).data('plugin_' + pluginName, new Plugin(this, options));
        }
      });
    }
  };

}($, window));
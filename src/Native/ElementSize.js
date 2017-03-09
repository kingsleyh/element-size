var _kingsleyh$element_size$Native_ElementSize = function () {

    // based on http://www.backalleycoder.com/2013/03/18/cross-browser-event-based-element-resize-detection/
    (function () {
        var attachEvent = document.attachEvent,
            stylesCreated = false;

        var resetTriggers;
        var scrollListener;

        if (!attachEvent) {
            var requestFrame = (function () {
                var raf = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame ||
                    function (fn) {
                        return window.setTimeout(fn, 20);
                    };
                return function (fn) {
                    return raf(fn);
                };
            })();

            var cancelFrame = (function () {
                var cancel = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame ||
                    window.clearTimeout;
                return function (id) {
                    return cancel(id);
                };
            })();

            resetTriggers = function (element) {
                var triggers = element.__resizeTriggers__,
                    expand = triggers.firstElementChild,
                    contract = triggers.lastElementChild,
                    expandChild = expand.firstElementChild;
                contract.scrollLeft = contract.scrollWidth;
                contract.scrollTop = contract.scrollHeight;
                expandChild.style.width = expand.offsetWidth + 1 + 'px';
                expandChild.style.height = expand.offsetHeight + 1 + 'px';
                expand.scrollLeft = expand.scrollWidth;
                expand.scrollTop = expand.scrollHeight;
            };

            function checkTriggers(element) {
                return element.offsetWidth != element.__resizeLast__.width ||
                    element.offsetHeight != element.__resizeLast__.height;
            }

            scrollListener = function (e) {
                var element = this;
                resetTriggers(this);
                if (this.__resizeRAF__) cancelFrame(this.__resizeRAF__);
                this.__resizeRAF__ = requestFrame(function () {
                    if (checkTriggers(element)) {
                        element.__resizeLast__.width = element.offsetWidth;
                        element.__resizeLast__.height = element.offsetHeight;
                        element.__resizeListeners__.forEach(function (fn) {
                            fn.call(element, e);
                        });
                    }
                });
            };

            /* Detect CSS Animations support to detect element display/re-attach */
            var animation = false,
                animationstring = 'animation',
                keyframeprefix = '',
                animationstartevent = 'animationstart',
                domPrefixes = 'Webkit Moz O ms'.split(' '),
                startEvents = 'webkitAnimationStart animationstart oAnimationStart MSAnimationStart'.split(' '),
                pfx = '';
            {
                var elm = document.createElement('fakeelement');
                if (elm.style.animationName !== undefined) {
                    animation = true;
                }

                if (animation === false) {
                    for (var i = 0; i < domPrefixes.length; i++) {
                        if (elm.style[domPrefixes[i] + 'AnimationName'] !== undefined) {
                            pfx = domPrefixes[i];
                            animationstring = pfx + 'Animation';
                            keyframeprefix = '-' + pfx.toLowerCase() + '-';
                            animationstartevent = startEvents[i];
                            animation = true;
                            break;
                        }
                    }
                }
            }

            var animationName = 'resizeanim';
            var animationKeyframes = '@' + keyframeprefix + 'keyframes ' + animationName + ' { from { opacity: 0; } to { opacity: 0; } } ';
            var animationStyle = keyframeprefix + 'animation: 1ms ' + animationName + '; ';
        }

        function createStyles() {
            if (!stylesCreated) {
                //opacity:0 works around a chrome bug https://code.google.com/p/chromium/issues/detail?id=286360
                var css = (animationKeyframes ? animationKeyframes : '') +
                        '.resize-triggers { ' + (animationStyle ? animationStyle : '') + 'visibility: hidden; opacity: 0; } ' +
                        '.resize-triggers, .resize-triggers > div, .contract-trigger:before { content: \" \"; display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; } .resize-triggers > div { background: #eee; overflow: auto; } .contract-trigger:before { width: 200%; height: 200%; }',
                    head = document.head || document.getElementsByTagName('head')[0],
                    style = document.createElement('style');

                style.type = 'text/css';
                if (style.styleSheet) {
                    style.styleSheet.cssText = css;
                } else {
                    style.appendChild(document.createTextNode(css));
                }

                head.appendChild(style);
                stylesCreated = true;
            }
        }

        window.addResizeListener = function (element, fn) {
            if (attachEvent) element.attachEvent('onresize', fn);
            else {
                if (!element.__resizeTriggers__) {
                    if (getComputedStyle(element).position == 'static') element.style.position = 'relative';
                    createStyles();
                    element.__resizeLast__ = {};
                    element.__resizeListeners__ = [];
                    (element.__resizeTriggers__ = document.createElement('div')).className = 'resize-triggers';
                    element.__resizeTriggers__.innerHTML = '<div class="expand-trigger"><div></div></div>' +
                        '<div class="contract-trigger"></div>';
                    element.appendChild(element.__resizeTriggers__);
                    resetTriggers(element);

                    element.addEventListener('scroll', scrollListener, true);

                    /* Listen for a css animation to detect element display/re-attach */
                    animationstartevent && element.__resizeTriggers__.addEventListener(animationstartevent, function (e) {
                        if (e.animationName == animationName)
                            resetTriggers(element);
                    });
                }
                element.__resizeListeners__.push(fn);
            }
        };

        window.removeResizeListener = function (element, fn) {
            if (attachEvent) element.detachEvent('onresize', fn);
            else {
                element.__resizeListeners__.splice(element.__resizeListeners__.indexOf(fn), 1);
                if (!element.__resizeListeners__.length) {
                    element.removeEventListener('scroll', scrollListener);
                    element.__resizeTriggers__ = !element.removeChild(element.__resizeTriggers__);
                }
            }
        }
    })();

    function size(selector) {
        return _elm_lang$core$Native_Scheduler.nativeBinding(function (callback) {
                var n = document.querySelector(selector);
                var s = {
                    selector: selector,
                    width: 0,
                    height: 0,
                    top: 0,
                    left: 0
                };
                if (n) {
                    s = {
                        selector: selector,
                        width: n.offsetWidth,
                        height: n.offsetHeight,
                        top: n.offsetTop,
                        left: n.offsetLeft
                    };
                }

                callback(_elm_lang$core$Native_Scheduler.succeed(s));
        });
    }

    function onResize(selector, decoder, toTask) {
        return _elm_lang$core$Native_Scheduler.nativeBinding(function (callback) {

            function performTask(event) {
                var result = A2(_elm_lang$core$Json_Decode$decodeValue, decoder, event);
                if (result.ctor === 'Ok') {
                    _elm_lang$core$Native_Scheduler.rawSpawn(toTask(result._0));
                }
            }

            var node = document.querySelector(selector);

            if(node) {
                window.addResizeListener(node, performTask);
            }

            return function () {
                if(node) {
                    window.removeResizeListener(node, performTask);
                }
            };
        });
    }

        return {
            onResize: F3(onResize),
            size: size
        };

}();


/*
DCSS - https://github.com/afrothunder/DCSS

Copyright (c) 2014 Osvaldo Rosado

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
 */

(function() {
  var _base, _base1, _base2, _base3, _base4, _base5, _base6, _base7, _base8;

  if (window.DCSS == null) {
    window.DCSS = {};
  }

  if ((_base = window.DCSS).attributeHandlers == null) {
    _base.attributeHandlers = {};
  }

  if ((_base1 = window.DCSS).functionHandlers == null) {
    _base1.functionHandlers = {};
  }

  if ((_base2 = window.DCSS).parseData == null) {
    _base2.parseData = [];
  }

  if ((_base3 = window.DCSS).curRelAddress == null) {
    _base3.curRelAddress = "./";
  }

  if ((_base4 = window.DCSS).functionDefinition == null) {
    _base4.functionDefinition = /([\w-]+)\((("(.+?)")|('(.+?)'))\)/g;
  }

  if ((_base5 = window.DCSS).functionArgumentDefinition == null) {
    _base5.functionArgumentDefinition = /('(.+?)'|"(.+?)")/g;
  }

  if ((_base6 = window.DCSS).async == null) {
    _base6.async = false;
  }

  if ((_base7 = window.DCSS).staticPageContent == null) {
    _base7.staticPageContent = false;
  }

  if ((_base8 = window.DCSS).overridejQueryCSS == null) {
    _base8.overridejQueryCSS = true;
  }

  (function($) {
    var _base10, _base11, _base12, _base13, _base14, _base15, _base9;
    if (DCSS.Run == null) {
      DCSS.Run = function() {
        var data, _i, _len, _ref;
        if (DCSS.overridejQueryCSS) {
          $.fn.css = $.fn.dcss;
        }
        if (DCSS.async) {
          console.log("DCSS: Running Asynchronously");
        } else {
          console.log("DCSS: Running Synchronously");
        }
        $('link[rel="stylesheet"]').each(function() {
          var externalProcess;
          externalProcess = function(data) {
            var parseData;
            if (data === void 0) {
              return new Error("File could not be loaded");
            }
            parseData = DCSS.Preprocess(DCSS.Parse(data));
            if (parseData.length > 0) {
              return DCSS.parseData.push([DCSS.curRelAddress, parseData]);
            }
          };
          DCSS.curRelAddress = $(this).attr('href').substring(0, $(this).attr('href').lastIndexOf("/"));
          return $.ajax({
            url: $(this).attr('href'),
            success: externalProcess,
            async: DCSS.async
          });
        });
        $('style').each(function() {
          var parseData;
          DCSS.curRelAddress = "./";
          parseData = DCSS.Preprocess(DCSS.Parse($(this).text()));
          if (parseData.length > 0) {
            return DCSS.parseData.push([DCSS.curRelAddress, parseData]);
          }
        });
        _ref = DCSS.parseData;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          data = _ref[_i];
          DCSS.curRelAddress = data[0];
          DCSS.Interpret(data[1]);
        }
        return DCSS.Refresh();
      };
    }
    DCSS.ReflowEvents = [];
    if (DCSS.Refresh == null) {
      DCSS.Refresh = function() {
        var event, _i, _len, _ref, _results;
        _ref = DCSS.ReflowEvents;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          event = _ref[_i];
          _results.push(DCSS.ReflowAttributeHandler(event[0], event[1], event[2], event[3], event[4]));
        }
        return _results;
      };
    }
    if (DCSS.ReflowAttributeHandler == null) {
      DCSS.ReflowAttributeHandler = function(type, selector, property, processedValue, DCSSObjects) {
        var funct, functionArguments, functionName, functionString, jQ, _fn, _i, _len;
        selector = $(selector);
        jQ = jQuery;
        jQ.fn.css = jQ.fn._dcss_int;
        selector.css = selector._dcss_int;
        _fn = function($, jQuery) {
          var val;
          val = DCSS.functionHandlers[functionName].apply(void 0, functionArguments);
          return processedValue = processedValue.replace(functionString, val);
        };
        for (_i = 0, _len = DCSSObjects.length; _i < _len; _i++) {
          funct = DCSSObjects[_i];
          functionName = funct[0];
          functionArguments = funct[1];
          functionString = funct[2];
          _fn(jQ, jQ);
        }
        if (type === "custom") {
          return (function($, jQuery) {
            return DCSS.attributeHandlers[property](selector, processedValue);
          })(jQ, jQ);
        } else {
          return selector._dcss_int(property, processedValue);
        }
      };
    }
    if (DCSS.Preprocess == null) {
      DCSS.Preprocess = function(dcsData) {
        var DCSSAttributes, DCSSData, attribute, attributeCount, funct, functionName, isDCSS, object, selector, selectorCount, _i, _j, _len, _len1, _ref;
        DCSSData = [];
        attributeCount = 0;
        selectorCount = 0;
        for (_i = 0, _len = dcsData.length; _i < _len; _i++) {
          object = dcsData[_i];
          selector = $(object.selector);
          if (selector.length < 1) {
            continue;
          }
          DCSSAttributes = [];
          _ref = object.attributes;
          for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
            attribute = _ref[_j];
            isDCSS = false;
            while ((funct = DCSS.functionDefinition.exec(attribute.value)) != null) {
              functionName = funct[1];
              if (functionName === "url" || functionName === "calc") {
                continue;
              }
              if (DCSS.functionHandlers[functionName] != null) {
                isDCSS = true;
                break;
              }
            }
            if (DCSS.attributeHandlers[attribute.property] != null) {
              isDCSS = true;
            }
            if (isDCSS) {
              attributeCount++;
              DCSSAttributes.push(attribute);
            }
          }
          if (DCSSAttributes.length > 0) {
            object.attributes = DCSSAttributes;
            selectorCount++;
            DCSSData.push(object);
          }
        }
        console.log("DCSS: Found " + attributeCount + " dynamic attributes across " + selectorCount + " selectors.");
        return DCSSData;
      };
    }
    if (DCSS.Interpret == null) {
      DCSS.Interpret = function(dcsData) {
        var DCSSObjects, argument, attribute, funct, functionArguments, functionName, functionString, functionValue, object, processedValue, selector, _i, _j, _len, _len1, _ref;
        if (!dcsData) {
          return;
        }
        if (dcsData.length < 1) {
          return;
        }
        for (_i = 0, _len = dcsData.length; _i < _len; _i++) {
          object = dcsData[_i];
          selector = $(object.selector);
          if (!selector) {
            continue;
          }
          if (selector.length < 1) {
            continue;
          }
          _ref = object.attributes;
          for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
            attribute = _ref[_j];
            DCSSObjects = [];
            processedValue = attribute.value;
            while ((funct = DCSS.functionDefinition.exec(attribute.value)) != null) {
              functionString = funct[0];
              functionName = funct[1];
              functionValue = funct[2];
              functionArguments = [selector];
              while ((argument = DCSS.functionArgumentDefinition.exec(functionValue)) != null) {
                argument = argument[2] ? argument[2] : argument[3];
                functionArguments.push(argument);
              }
              if (DCSS.functionHandlers[functionName] != null) {
                DCSSObjects.push([functionName, functionArguments, functionString]);
              }
            }
            if (DCSS.attributeHandlers[attribute.property] != null) {
              DCSS.ReflowEvents.push(["custom", object.selector, attribute.property, attribute.value, DCSSObjects]);
            } else {
              DCSS.ReflowEvents.push(["standard", object.selector, attribute.property, attribute.value, DCSSObjects]);
            }
          }
        }
      };
    }
    if (DCSS.Parse == null) {
      DCSS.Parse = function(data) {
        var components, cparts, line, lines, nc, parts, prop, section, sections, val, _i, _j, _len, _len1;
        if (typeof data !== "string") {
          return {};
        }
        data = data.replace(/\/\*.*?\*\//g, "");
        sections = data.split("}");
        components = [];
        for (_i = 0, _len = sections.length; _i < _len; _i++) {
          section = sections[_i];
          nc = {};
          parts = section.split("{");
          if (parts.length < 2) {
            continue;
          }
          nc.selector = parts[0].replace(/[\t\n\r]/g, "").trim();
          nc.attributes = [];
          lines = parts[1].split(/[\;\n]/);
          for (_j = 0, _len1 = lines.length; _j < _len1; _j++) {
            line = lines[_j];
            cparts = line.split(":");
            if (cparts.length < 2) {
              continue;
            }
            prop = cparts[0].replace(/[\t\n\r\ ]/g, "").trim();
            val = cparts[1].trim();
            nc.attributes.push({
              property: prop,
              value: val
            });
          }
          components.push(nc);
        }
        return components;
      };
    }
    $(window).on("load", function() {
      var observer;
      DCSS.Run();
      if (!DCSS.staticPageContent) {
        if (typeof MutationObserver !== "undefined" && MutationObserver !== null) {
          console.log("DCSS: Mutation Observers Enabled.");
          observer = new MutationObserver(function(mutations) {
            return function() {
              return DCSS.Refresh();
            };
          });
          return observer.observe(document, {
            childList: true,
            subtree: true
          });
        } else {
          console.log("DCSS: Polling Enabled.");
          return setInterval((function() {
            return DCSS.Refresh();
          }), 300);
        }
      } else {
        return console.log("DCSS: Running in static page mode.");
      }
    });
    $(window).on("resize scroll touchmove", (function() {
      return DCSS.Refresh();
    }));
    if ((_base9 = DCSS.functionHandlers)["match-max"] == null) {
      _base9["match-max"] = function(selector, matchElement, matchProperty) {
        var maxElem, maxValue;
        maxValue = $(matchElement).css(matchProperty);
        maxElem = matchElement;
        $(matchElement).each(function() {
          var value;
          value = $(this).css("matchProperty");
          if (parseInt(value) > parseInt(maxValue)) {
            maxValue = value;
            return maxElem = this;
          }
        });
        return DCSS.functionHandlers["match"](selector, maxElem, matchProperty);
      };
    }
    if ((_base10 = DCSS.functionHandlers)["match-min"] == null) {
      _base10["match-min"] = function(selector, matchElement, matchProperty) {
        var minElem, minValue;
        minValue = $(matchElement).css(matchProperty);
        minElem = matchElement;
        $(matchElement).each(function() {
          var value;
          value = $(this).css("matchProperty");
          if (parseInt(value) < parseInt(minValue)) {
            minValue = value;
            return minElem = this;
          }
        });
        return DCSS.functionHandlers["match"](selector, minElem, matchProperty);
      };
    }
    if ((_base11 = DCSS.functionHandlers)["match"] == null) {
      _base11["match"] = function(selector, matchElement, matchProperty) {
        return $(matchElement).css(matchProperty);
      };
    }
    if ((_base12 = DCSS.functionHandlers)["js"] == null) {
      _base12["js"] = function(selector, js) {
        return eval(js);
      };
    }
    if ((_base13 = DCSS.functionHandlers)["url"] == null) {
      _base13["url"] = function(selector, url) {
        if (url.indexOf("./") === 0 || url.indexOf("./") === 1) {
          return "url('" + DCSS.curRelAddress + "/" + url + "')";
        } else {
          return "url('" + url + "')";
        }
      };
    }
    if ((_base14 = DCSS.attributeHandlers)["-d-fill"] == null) {
      _base14["-d-fill"] = function(selector, value) {
        var apply;
        switch (value) {
          case "window":
            selector.css("position", "fixed");
            selector.css("top", "0");
            return selector.css("left", "0");
          case "container":
          case "window":
            selector.css("margin", "0");
            selector.css("padding", "0");
            apply = function() {
              selector.css("width", "100%");
              return selector.css("height", "100%");
            };
            return setTimeout(apply, 0);
        }
      };
    }
    if ((_base15 = DCSS.attributeHandlers)["-d-center"] == null) {
      _base15["-d-center"] = function(selector, value) {
        return selector.each(function() {
          var apply;
          selector = $(this);
          if (selector.offsetParent() !== selector.parent()) {
            selector.parent().css("position", "relative");
          }
          if (value === "horizontal" || value === "both") {
            selector.css("position", "absolute");
            apply = function() {
              var parentWidth, width;
              width = selector.outerWidth();
              parentWidth = selector.offsetParent().innerWidth();
              return selector.css("left", (parentWidth / 2) - (width / 2) + "px");
            };
            setTimeout(apply, 0);
          }
          if (value === "vertical" || value === "both") {
            selector.css("position", "absolute");
            apply = function() {
              var height, parentHeight;
              height = selector.outerHeight();
              parentHeight = selector.offsetParent().innerHeight();
              return selector.css("top", (parentHeight / 2) - (height / 2) + "px");
            };
            return setTimeout(apply, 0);
          }
        });
      };
    }
  })(jQuery);

  (function($) {
    $.fn._dcss_css = $.fn.css;
    $.fn._dcss_int = function(property, value) {
      var css, cssText, nText, posEnd, posStart, rule, ruleValue, selector;
      if (value != null) {
        selector = this.selector;
        if ((selector == null) || selector === "") {
          return this._dcss_css(property, value);
        }
        rule = selector + '{' + property + ':';
        ruleValue = value + ';}';
        css = rule + ruleValue;
        if ($("#DCSS_STYLE_HANDLER").length === 0) {
          $("<style id='DCSS_STYLE_HANDLER'></style>").appendTo("head");
        }
        cssText = $("#DCSS_STYLE_HANDLER").text();
        if (cssText.indexOf(rule) !== -1) {
          posStart = cssText.indexOf(rule);
          posEnd = cssText.indexOf('}', posStart) + 1;
          nText = cssText.substring(0, posStart) + css + cssText.substring(posEnd);
          $("#DCSS_STYLE_HANDLER").text(nText);
        } else {
          $("#DCSS_STYLE_HANDLER").append(css);
        }
        return this;
      } else {
        return this._dcss_css(property);
      }
    };
    $.fn.dcss = function(property, value) {
      var css, parseData;
      if (value != null) {
        css = this.selector + '{' + property + ':' + value + ';}';
        parseData = DCSS.Preprocess(DCSS.Parse(css));
        if (parseData.length > 0) {
          DCSS.curRelAddress = "./";
          DCSS.Interpret(parseData);
          DCSS.parseData.push([DCSS.curRelAddress, parseData]);
          return this;
        } else {
          return this._dcss_css(property, value);
        }
      } else {
        return this._dcss_css(property);
      }
    };
  })(jQuery);

}).call(this);

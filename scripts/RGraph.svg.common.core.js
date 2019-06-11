// version: 2019-05-27
    /**
    * o--------------------------------------------------------------------------------o
    * | This file is part of the RGraph package - you can learn more at:               |
    * |                                                                                |
    * |                         https://www.rgraph.net                                 |
    * |                                                                                |
    * | RGraph is licensed under the Open Source MIT license. That means that it's     |
    * | totally free to use and there are no restrictions on what you can do with it!  |
    * o--------------------------------------------------------------------------------o
    */

    RGraph        = window.RGraph || {isRGraph: true,isRGraphSVG: true};
    RGraph.SVG    = RGraph.SVG    || {};
    RGraph.SVG.FX = RGraph.SVG.FX || {};


// Module pattern
(function (win, doc, undefined)
{
    var RG  = RGraph,
        ua  = navigator.userAgent,
        ma  = Math;

    RG.SVG.REG = {
        store: []
    };
    
    // ObjectRegistry
    RG.SVG.OR = {objects: []};
    
    // Used to categorise trigonometery functions
    RG.SVG.TRIG        = {};
    RG.SVG.TRIG.HALFPI = ma.PI * .4999;
    RG.SVG.TRIG.PI     = RG.SVG.TRIG.HALFPI * 2;
    RG.SVG.TRIG.TWOPI  = RG.SVG.TRIG.PI * 2;

    RG.SVG.ISIE = ua.indexOf('rident') > 0;
    RG.SVG.ISFF = ua.indexOf('irefox') > 0;
    
    RG.SVG.events = [];


    // This allows you to set globalconfiguration values that are copied to
    // all objects automatically.
    RG.SVG.GLOBALS = {};


    RG.SVG.ISFF     = ua.indexOf('Firefox') != -1;
    RG.SVG.ISOPERA  = ua.indexOf('Opera') != -1;
    RG.SVG.ISCHROME = ua.indexOf('Chrome') != -1;
    RG.SVG.ISSAFARI = ua.indexOf('Safari') != -1 && !RG.SVG.ISCHROME;
    RG.SVG.ISWEBKIT = ua.indexOf('WebKit') != -1;

    RG.SVG.ISIE     = ua.indexOf('Trident') > 0 || navigator.userAgent.indexOf('MSIE') > 0;
    RG.SVG.ISIE6    = ua.indexOf('MSIE 6') > 0;
    RG.SVG.ISIE7    = ua.indexOf('MSIE 7') > 0;
    RG.SVG.ISIE8    = ua.indexOf('MSIE 8') > 0;
    RG.SVG.ISIE9    = ua.indexOf('MSIE 9') > 0;
    RG.SVG.ISIE10   = ua.indexOf('MSIE 10') > 0;
    RG.SVG.ISIE11UP = ua.indexOf('MSIE') == -1 && ua.indexOf('Trident') > 0;
    RG.SVG.ISIE10UP = RG.SVG.ISIE10 || RG.SVG.ISIE11UP;
    RG.SVG.ISIE9UP  = RG.SVG.ISIE9 || RG.SVG.ISIE10UP;








    //
    // Create an SVG tag
    //
    RG.SVG.createSVG = function (opt)
    {
        var container = opt.container,
            obj       = opt.object;

        if (container.__svg__) {
            return container.__svg__;
        }

        var svg = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute('style', 'top: 0; left: 0; position: absolute');
            svg.setAttribute('width', container.offsetWidth);
            svg.setAttribute('height', container.offsetHeight);
            svg.setAttribute('version', '1.1');
            svg.setAttributeNS("http://www.w3.org/2000/xmlns/", 'xmlns', 'http://www.w3.org/2000/svg');
            svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
            svg.__object__    = obj;
            svg.__container__ = container;
        container.appendChild(svg);

        container.__svg__    = svg;
        container.__object__ = obj;

        var style = getComputedStyle(container);
        if (style.position !== 'absolute' && style.position !== 'fixed' && style.position !== 'sticky') {
            container.style.position = 'relative';
        }

        // Add the groups that facilitate "background layers"

        var numLayers = 10;

        for (var i=1; i<=numLayers; ++i) {
            
            var group = RG.SVG.create({
                svg: svg,
                type: 'g',
                attr: {
                    className: 'background' + i
                }
            });

            // Store a reference to the group
            obj.layers['background' + i] = group;
            svg['background' + i]        = group;
        }
        
        // Add the group tag to the SVG that contains all of the elements
        var group = RG.SVG.create({
            svg: svg,
            type: 'g',
            attr: {
                className: 'all-elements'
            }
        });

        container.__svg__.all = group;

        return svg;
    };








    //
    // Create a defs tag inside the SVG
    //
    RG.SVG.createDefs = function (obj)
    {
        if (!obj.svg.defs) {

            var defs = RG.SVG.create({
                svg: obj.svg,
                type: 'defs'
            });
    
            obj.svg.defs = defs;
        }

        return defs;
    };








    //
    // Creates a tag depending on the args that you give
    //
    //@param opt object The options for the function
    //
    RG.SVG.create = function (opt)
    {
        var ns  = "http://www.w3.org/2000/svg",
            tag = doc.createElementNS(ns, opt.type);

        // Add the attributes
        for (var o in opt.attr) {
            if (typeof o === 'string') {
            
                var name = o;

                if (o === 'className') {
                    name = 'class';
                }
                if ( (opt.type === 'a' || opt.type === 'image') && o === 'xlink:href') {
                    tag.setAttributeNS('http://www.w3.org/1999/xlink', o, String(opt.attr[o]));
                } else {
                    if (RG.SVG.isNull(opt.attr[o])) {
                        opt.attr[o] = '';
                    }
                    tag.setAttribute(name, String(opt.attr[o]));
                }
            }
        }
        
        // Add the style
        for (var o in opt.style) {
            if (typeof o === 'string') {
                tag.style[o] = String(opt.style[o]);
            }
        }

        if (opt.parent) {
            opt.parent.appendChild(tag);
        } else {
            opt.svg.appendChild(tag);
        }

        return tag;
    };








    //
    // Function that adds up all of the offsetLeft and offsetTops to get
    // X/Y coords for the mouse
    //
    //@param object e The event object
    //@return array   The X/Y coordinate pair representing the mouse
    //                location in relation to the SVG tag.
    //
    RG.SVG.getMouseXY = function(e)
    {
        // This is necessary for IE9
        if (!e.target) {
            return;
        }

        var el = e.target, offsetX = 0, offsetY = 0, x, y;


        if (typeof el.offsetParent !== 'undefined') { 
            do {
                offsetX += el.offsetLeft;
                offsetY += el.offsetTop;
            } while ((el = el.offsetParent));
        }

        x = e.pageX;
        y = e.pageY;

        x -= (2 * (parseInt(document.body.style.borderLeftWidth) || 0));
        y -= (2 * (parseInt(document.body.style.borderTopWidth) || 0));


        // We return a javascript array with x and y defined
        return [x, y];
    };








    //
    // Draws an X axis
    //
    //@param The chart object
    //
    RG.SVG.drawXAxis = function (obj)
    {
        var prop = obj.properties;

        // Draw the axis
        if (prop.xaxis) {

            var y = obj.type === 'hbar' ? obj.height - prop.marginBottom : obj.getYCoord(obj.scale.min < 0 && obj.scale.max < 0 ? obj.scale.max : (obj.scale.min > 0 && obj.scale.max > 0 ? obj.scale.min : 0));

            var axis = RG.SVG.create({
                svg: obj.svg,
                parent: obj.svg.all,
                type: 'path',
                attr: {
                    d: 'M{1} {2} L{3} {4}'.format(
                        prop.marginLeft,
                        y,
                        obj.width - prop.marginRight,
                        y
                    ),
                    fill: prop.xaxisColor,
                    stroke: prop.xaxisColor,
                    'stroke-width': typeof prop.xaxisLinewidth === 'number' ? prop.xaxisLinewidth : 1,
                    'shape-rendering': 'crispEdges',
                    'stroke-linecap': 'square'
                }
            });


            // HBar X axis
            if (obj.type === 'hbar') {
                var width  = obj.graphWidth / obj.data.length,
                    x      = prop.marginLeft,
                    startY = (obj.height - prop.marginBottom),
                    endY   = (obj.height - prop.marginBottom) + prop.xaxisTickmarksLength;

            // Line/Bar/Waterfall/Scatter X axis
            } else {
                var width  = obj.graphWidth / obj.data.length,
                    x      = prop.marginLeft,
                    startY = obj.getYCoord(0) - (prop.yaxisScaleMin < 0 ? prop.xaxisTickmarksLength : 0),
                    endY   = obj.getYCoord(0) + prop.xaxisTickmarksLength;
                    
                if (obj.scale.min < 0 && obj.scale.max <= 0) {
                    startY = prop.marginTop;
                    endY   = prop.marginTop - prop.xaxisTickmarksLength;
                }

                if (obj.scale.min > 0 && obj.scale.max > 0) {
                    startY = obj.getYCoord(obj.scale.min);
                    endY   = obj.getYCoord(obj.scale.min) + prop.xaxisTickmarksLength;
                }
            }








            // Draw the tickmarks
            if (prop.xaxisTickmarks) {

                // The HBar uses a scale
                if (prop.xaxisScale) {

                    for (var i=0; i<(typeof prop.xaxisLabelsPositionEdgeTickmarksCount === 'number' ? prop.xaxisLabelsPositionEdgeTickmarksCount : (obj.scale.numlabels + (prop.yaxis && prop.xaxisScaleMin === 0 ? 0 : 1))); ++i) {
                    
                        if (obj.type === 'hbar') {
                            var dataPoints = obj.data.length;
                        }
                    
                        x = prop.marginLeft + ((i+(prop.yaxis && prop.xaxisScaleMin === 0 ? 1 : 0)) * (obj.graphWidth / obj.scale.numlabels));

                        // Allow Manual specification of number of tickmarks
                        if (typeof prop.xaxisLabelsPositionEdgeTickmarksCount === 'number') {
                            dataPoints = prop.xaxisLabelsPositionEdgeTickmarksCount;
                            var gap    = (obj.graphWidth / prop.xaxisLabelsPositionEdgeTickmarksCount);
                            x          = (gap * i) + prop.marginLeft + gap;
                        }

                        RG.SVG.create({
                            svg: obj.svg,
                            parent: obj.svg.all,
                            type: 'path',
                            attr: {
                                d: 'M{1} {2} L{3} {4}'.format(
                                    x,
                                    startY,
                                    x,
                                    endY
                                ),
                                stroke: prop.xaxisColor,
                                'stroke-width': typeof prop.xaxisLinewidth === 'number' ? prop.xaxisLinewidth : 1,
                                'shape-rendering': "crispEdges"
                            }
                        });
                    }




                } else {

                    // This style is used by Bar and Scatter charts
                    if (prop.xaxisLabelsPosition === 'section') {

                        if (obj.type === 'bar' || obj.type === 'waterfall') {
                            var dataPoints = obj.data.length;
                        } else if (obj.type === 'line'){
                            var dataPoints = obj.data[0].length;
                        } else if (obj.type === 'scatter') {
                            var dataPoints = prop.xaxisLabels ? prop.xaxisLabels.length : 10;
                        }
                        
                        // Allow Manual specification of number of tickmarks
                        if (typeof prop.xaxisLabelsPositionSectionTickmarksCount === 'number') {
                            dataPoints = prop.xaxisLabelsPositionSectionTickmarksCount;
                        }

                        for (var i=0; i<dataPoints; ++i) {
        
                            x = prop.marginLeft + (prop.marginInnerLeft || 0) + ((i+1) * ( (obj.graphWidth - (prop.marginInnerLeft || 0) - (prop.marginInnerRight || 0) ) / dataPoints));

                            RG.SVG.create({
                                svg: obj.svg,
                                parent: obj.svg.all,
                                type: 'path',
                                attr: {
                                    d: 'M{1} {2} L{3} {4}'.format(
                                        x + 0.001,
                                        startY,
                                        x,
                                        endY
                                    ),
                                    stroke: prop.xaxisColor,
                                    'stroke-width': typeof prop.xaxisLinewidth === 'number' ? prop.xaxisLinewidth : 1,
                                    'shape-rendering': "crispEdges"
                                }
                            });
                        }

                    // This style is used by line charts
                    } else if (prop.xaxisLabelsPosition === 'edge') {

                        if (typeof prop.xaxisLabelsPositionEdgeTickmarksCount === 'number') {
                            var len = prop.xaxisLabelsPositionEdgeTickmarksCount;
                        } else {
                            var len = obj.data && obj.data[0] && obj.data[0].length ? obj.data[0].length : 0;
                        }
    
                        for (var i=0; i<len; ++i) {

                            var gap = ( (obj.graphWidth) / (len - 1)),
                                x   = prop.marginLeft + ((i+1) * gap);

                            RG.SVG.create({
                                svg: obj.svg,
                                parent: obj.svg.all,
                                type: 'path',
                                attr: {
                                    d: 'M{1} {2} L{3} {4}'.format(
                                        x + 0.001,
                                        startY,
                                        x,
                                        endY
                                    ),
                                    stroke: prop.xaxisColor,
                                    'stroke-width': typeof prop.xaxisLinewidth === 'number' ? prop.xaxisLinewidth : 1,
                                    'shape-rendering': "crispEdges"
                                }
                            });
                        }
                    }
                }






                // Draw an extra tick if the Y axis is not being shown
                if (prop.yaxis === false || (prop.marginInnerLeft || 0) > 0) {
                    RG.SVG.create({
                        svg: obj.svg,
                        parent: obj.svg.all,
                        type: 'path',
                        attr: {
                            d: 'M{1} {2} L{3} {4}'.format(
                                prop.marginLeft + (prop.marginInnerLeft || 0) + 0.001,
                                startY,
                                prop.marginLeft + (prop.marginInnerLeft || 0),
                                endY
                            ),
                            stroke: obj.properties.xaxisColor,
                            'stroke-width': typeof prop.xaxisLinewidth === 'number' ? prop.xaxisLinewidth : 1,
                            'shape-rendering': "crispEdges",
                            parent: obj.svg.all,
                        }
                    });
                }
            }
        }












        //
        // Draw an X axis scale
        //
        if (prop.xaxisScale) {
        
            if (obj.type === 'scatter') {
                obj.xscale = RG.SVG.getScale({
                    object:    obj,
                    numlabels: prop.xaxisLabelsCount,
                    unitsPre:  prop.xaxisScaleUnitsPre,
                    unitsPost: prop.xaxisScaleUnitsPost,
                    max:       prop.xaxisScaleMax,
                    min:       prop.xaxisScaleMin,
                    point:     prop.xaxisScalePoint,
                    round:     prop.xaxisScaleRound,
                    thousand:  prop.xaxisScaleThousand,
                    decimals:  prop.xaxisScaleDecimals,
                    strict:    typeof prop.xaxisScaleMax === 'number',
                    formatter: prop.xaxisScaleFormatter
                });
                
                
                
                
                
                
                
                var segment = obj.graphWidth / prop.xaxisLabelsCount
                
                for (var i=0; i<obj.xscale.labels.length; ++i) {
                
                    var x = prop.marginLeft + (segment * i) + segment + prop.xaxisLabelsOffsetx;
                    var y = (obj.height - prop.marginBottom) + (prop.xaxis ? prop.xaxisTickmarksLength + 6 : 10) + (prop.xaxisLinewidth || 1) + prop.xaxisLabelsOffsety;
                
                    RG.SVG.text({
                        object: obj,
                        parent: obj.svg.all,
                        text:   obj.xscale.labels[i],
                        x:      x,
                        y:      y,
                        halign: 'center',
                        valign: 'top',
                        tag:    'labels.xaxis',
                        font:   prop.xaxisLabelsFont   || prop.textFont,
                        size:   typeof prop.xaxisLabelsSize === 'number' ? prop.xaxisLabelsSize : prop.textSize,
                        bold:   typeof prop.xaxisLabelsBold === 'boolean' ? prop.xaxisLabelsBold : prop.textBold,
                        italic: typeof prop.xaxisLabelsItalic === 'boolean' ? prop.xaxisLabelsItalic : prop.textItalic,
                        color:  prop.xaxisLabelsColor  || prop.textColor
                    });
                }
                
                
                
                
                
                // Add the minimum label if labels are enabled
                if (prop.xaxisLabelsCount > 0) {
                    var y   = obj.height - prop.marginBottom + prop.xaxisLabelsOffsety + (prop.xaxis ? prop.xaxisTickmarksLength + 6 : 10),
                        str = RG.SVG.numberFormat({
                            object:     obj,
                            num:        prop.xaxisScaleMin.toFixed(prop.xaxisScaleDecimals),
                            prepend:    prop.xaxisScaleUnitsPre,
                            append:     prop.xaxisScaleUnitsPost,
                            point:      prop.xaxisScalePoint,
                            thousand:   prop.xaxisScaleThousand,
                            formatter:  prop.xaxisScaleFormatter
                        });

                    var text = RG.SVG.text({
                        object: obj,
                        parent: obj.svg.all,
                        text: typeof prop.xaxisScaleFormatter === 'function' ? (prop.xaxisScaleFormatter)(this, prop.xaxisScaleMin) : str,
                        x: prop.marginLeft + prop.xaxisLabelsOffsetx,
                        y: y,
                        halign: 'center',
                        valign: 'top',
                        tag:    'labels.xaxis',
                        font:   prop.xaxisLabelsFont   || prop.textFont,
                        size:   typeof prop.xaxisLabelsSize === 'number' ? prop.xaxisLabelsSize : prop.textSize,
                        bold:   typeof prop.xaxisLabelsBold === 'number' ? prop.xaxisLabelsBold : prop.textBold,
                        italic: typeof prop.xaxisLabelsItalic === 'boolean' ? prop.xaxisLabelsItalic : prop.textItalic,
                        color:  prop.xaxisLabelsColor  || prop.textColor
                    });
                }
            
            
            // =========================================================================
            } else {

                var segment = obj.graphWidth / prop.xaxisLabelsCount,
                    scale   = obj.scale;
    
                for (var i=0; i<scale.labels.length; ++i) {
    
                    var x = prop.marginLeft + (segment * i) + segment + prop.xaxisLabelsOffsetx;
                    var y = (obj.height - prop.marginBottom) + (prop.xaxis ? prop.xaxisTickmarksLength + 6 : 10) + (prop.xaxisLinewidth || 1) + prop.xaxisLabelsOffsety;
    
                    RG.SVG.text({
                        object: obj,
                        parent: obj.svg.all,
                        text:   obj.scale.labels[i],
                        x:      x,
                        y:      y,
                        halign: 'center',
                        valign: 'top',
                        tag:    'labels.xaxis',
                        font:   prop.xaxisLabelsFont || prop.textFont,
                        size:   typeof prop.xaxisLabelsSize === 'number' ? prop.xaxisLabelsSize : prop.textSize,
                        bold:   typeof prop.xaxisLabelsBold === 'boolean' ? prop.xaxisLabelsBold : prop.textBold,
                        italic: typeof prop.xaxisLabelsItalic === 'boolean' ? prop.xaxisLabelsItalic : prop.textItalic,
                        color:  prop.xaxisLabelsColor  || prop.textColor
                    });
                }
                
                
                
                
    
                // Add the minimum label if labels are enabled
                if (prop.xaxisLabelsCount > 0) {
                    var y   = obj.height - prop.marginBottom + prop.xaxisLabelsOffsety + (prop.xaxis ? prop.xaxisTickmarksLength + 6 : 10),
                        str = RG.SVG.numberFormat({
                            object:     obj,
                            num:        prop.xaxisScaleMin.toFixed(prop.xaxisScaleDecimals),
                            prepend:    prop.xaxisScaleUnitsPre,
                            append:     prop.xaxisScaleUnitsPost,
                            point:      prop.xaxisScalePoint,
                            thousand:   prop.xaxisScaleThousand,
                            formatter:  prop.xaxisScaleFormatter
                        });
    
                    var text = RG.SVG.text({
                        object: obj,
                        parent: obj.svg.all,
                        text: typeof prop.xaxisScaleFormatter === 'function' ? (prop.xaxisScaleFormatter)(this, prop.xaxisScaleMin) : str,
                        x: prop.marginLeft + prop.xaxisLabelsOffsetx,
                        y: y,
                        halign: 'center',
                        valign: 'top',
                        tag:    'labels.xaxis',
                        font:   prop.xaxisLabelsFont   || prop.textFont,
                        size:   typeof prop.xaxisLabelsSize === 'number' ? prop.xaxisLabelsSize   : prop.textSize,
                        bold:   typeof prop.xaxisLabelsBold === 'boolean' ? prop.xaxisLabelsBold : prop.textBold,
                        italic: typeof prop.xaxisLabelsItalic === 'boolean' ? prop.xaxisLabelsItalic : prop.textItalic,
                        color:  prop.xaxisLabelsColor  || prop.textColor
                    });
                }
            }

        //
        // Draw the X axis labels
        //
        } else {
            if (typeof prop.xaxisLabels === 'object' && !RG.SVG.isNull(prop.xaxisLabels) ) {
            
                var angle = prop.xaxisLabelsAngle;

                // Loop through the X labels
                if (prop.xaxisLabelsPosition === 'section') {
                
                    var segment = (obj.width - prop.marginLeft - prop.marginRight - (prop.marginInnerLeft || 0) - (prop.marginInnerRight || 0) ) / prop.xaxisLabels.length;
                
                    for (var i=0; i<prop.xaxisLabels.length; ++i) {
                    
                        var x = prop.marginLeft + (prop.marginInnerLeft || 0) + (segment / 2) + (i * segment);

                        if (obj.scale.max <=0 && obj.scale.min < obj.scale.max) {
                            var y = prop.marginTop - (RG.SVG.ISFF ? 5 : 10)  - (prop.xaxisLinewidth || 1) + prop.xaxisLabelsOffsety;
                            var valign = 'bottom';
                        } else {
                            var y = obj.height - prop.marginBottom + (RG.SVG.ISFF ? 5 : 10) + (prop.xaxisLinewidth || 1) + prop.xaxisLabelsOffsety;
                            var valign = 'top';
                        }

                        RG.SVG.text({
                            object: obj,
                            parent: obj.svg.all,
                            text: prop.xaxisLabels[i],
                            x: x + prop.xaxisLabelsOffsetx,
                            y: y,
                            valign: (typeof angle === 'number' && angle) ? 'center' : valign,
                            halign: (typeof angle === 'number' && angle) ? 'right' : 'center',
                            angle: angle,
                            tag:    'labels.xaxis',
                            size:   typeof prop.xaxisLabelsSize === 'number' ? prop.xaxisLabelsSize : prop.textSize,
                            italic: typeof prop.xaxisLabelsItalic === 'boolean' ? prop.xaxisLabelsItalic : prop.textItalic,
                            font:   prop.xaxisLabelsFont   || prop.textFont,
                            bold:   typeof prop.xaxisLabelsBold === 'boolean' ? prop.xaxisLabelsBold : prop.textBold,
                            color:  prop.xaxisLabelsColor  || prop.textColor
                        });
                    }

                } else if (prop.xaxisLabelsPosition === 'edge') {
    
                    if (obj.type === 'line') {
                        var hmargin = prop.marginInner;
                    } else {
                        var hmargin = 0;
                    }
    
    
    
                    var segment = (obj.graphWidth - hmargin - hmargin) / (prop.xaxisLabels.length - 1);

                    for (var i=0; i<prop.xaxisLabels.length; ++i) {
                    
                        var x = prop.marginLeft + (i * segment) + hmargin;

                        if (obj.scale.max <= 0 && obj.scale.min < 0) {
                            valign = 'bottom';
                            y = prop.marginTop - (RG.SVG.ISFF ? 5 : 10) - (prop.xaxisTickmarksLength - 5)  - (prop.xaxisLinewidth || 1) + prop.xaxisLabelsOffsety
                        } else {
                            valign = 'top';
                            y = obj.height - prop.marginBottom + (RG.SVG.ISFF ? 5 : 10) + (prop.xaxisTickmarksLength - 5) + (prop.xaxisLinewidth || 1) + prop.xaxisLabelsOffsety;
                        }
                    
                        RG.SVG.text({
                            object: obj,
                            parent: obj.svg.all,
                            text: prop.xaxisLabels[i],
                            x: x + prop.xaxisLabelsOffsetx,
                            y: y,
                            valign: (typeof angle === 'number' && angle) ? 'center' : valign,
                            halign: (typeof angle === 'number' && angle) ? 'right' : 'center',
                            angle: angle,
                            tag:    'labels.xaxis',
                            size:   typeof prop.xaxisLabelsSize === 'number' ? prop.xaxisLabelsSize : prop.textSize,
                            italic: typeof prop.xaxisLabelsItalic === 'boolean' ? prop.xaxisLabelsItalic : prop.textItalic,
                            font:   prop.xaxisLabelsFont   ||  prop.textFont,
                            bold:   typeof prop.xaxisLabelsBold === 'boolean' ? prop.xaxisLabelsBold : prop.textBold,
                            color:  prop.xaxisLabelsColor  ||  prop.textColor
                        });
                    }
                }
            }
        }
    };








    //
    // Draws an Y axis
    //
    //@param The chart object
    //
    RG.SVG.drawYAxis = function (obj)
    {
        var prop = obj.properties;

        if (prop.yaxis) {

            // The X coordinate that the Y axis is positioned at
            if (obj.type === 'hbar') {
                
                var x = obj.getXCoord(prop.xaxisScaleMin > 0 ? prop.xaxisScaleMin : 0);
    
                if (prop.xaxisScaleMin < 0 && prop.xaxisScaleMax <= 0) {
                    x = obj.getXCoord(prop.xaxisScaleMax);
                }
            } else {
                var x = prop.marginLeft;
            }


            var axis = RG.SVG.create({
                svg: obj.svg,
                parent: obj.svg.all,
                type: 'path',
                attr: {
                    d: 'M{1} {2} L{3} {4}'.format(
                        x,
                        prop.marginTop,
                        x,
                        obj.height - prop.marginBottom
                    ),
                    stroke: prop.yaxisColor,
                    fill: prop.yaxisColor,
                    'stroke-width': typeof prop.yaxisLinewidth === 'number' ? prop.yaxisLinewidth : 1,
                    'shape-rendering': "crispEdges",
                    'stroke-linecap': 'square'
                }
            });

    
    
    

    

            if (obj.type === 'hbar') {
                
                var height = (obj.graphHeight - prop.marginInnerTop - prop.marginInnerBottom) / prop.yaxisLabels.length,
                    y      = prop.marginTop + prop.marginInnerTop,
                    len    = prop.yaxisLabels.length,
                    startX = obj.getXCoord(0) + (prop.xaxisScaleMin < 0 ? prop.yaxisTickmarksLength : 0),
                    endX   = obj.getXCoord(0) - prop.yaxisTickmarksLength;

                if (prop.xaxisScaleMin < 0 && prop.xaxisScaleMax <=0) {
                    startX = obj.getXCoord(prop.xaxisScaleMax);
                    endX   = obj.getXCoord(prop.xaxisScaleMax) + 5;
                }
                
                // A custom number of tickmarks
                if (typeof prop.yaxisLabelsPositionSectionTickmarksCount === 'number') {
                    len    = prop.yaxisLabelsPositionSectionTickmarksCount;
                    height = (obj.graphHeight - prop.marginInnerTop - prop.marginInnerBottom) / len;
                }

                //
                // Draw the tickmarks
                //
                if (prop.yaxisTickmarks) {
                    for (var i=0; i<len; ++i) {
                        // Draw the axis
                        var axis = RG.SVG.create({
                            svg: obj.svg,
                            parent: obj.svg.all,
                            type: 'path',
                            attr: {
                                d: 'M{1} {2} L{3} {4}'.format(
                                    startX,
                                    y,
                                    endX,
                                    y + 0.001
                                ),
                                stroke: prop.yaxisColor,
                                'stroke-width': typeof prop.yaxisLinewidth === 'number' ? prop.yaxisLinewidth : 1,
                                'shape-rendering': "crispEdges"
                            }
                        });
                        
                        y += height;
                    }
    
    
                    // Draw an extra tick if the X axis position is not zero or
                    // if the xaxis is not being shown
                    if (prop.xaxis === false) {

                        if (obj.type === 'hbar' && prop.xaxisScaleMin <= 0 && prop.xaxisScaleMax < 0) {
                            var startX = obj.getXCoord(prop.xaxisScaleMax);
                            var endX   = obj.getXCoord(prop.xaxisScaleMax) + prop.yaxisTickmarksLength;

                        } else {
                            var startX = obj.getXCoord(0) - prop.yaxisTickmarksLength;
                            var endX   = obj.getXCoord(0) + (prop.xaxisScaleMin < 0 ? prop.yaxisTickmarksLength : 0);
                        }

                        var axis = RG.SVG.create({
                            svg: obj.svg,
                            parent: obj.svg.all,
                            type: 'path',
                            attr: {
                                d: 'M{1} {2} L{3} {4}'.format(
                                    startX,
                                    ma.round(obj.height - prop.marginBottom - parseFloat(prop.marginInnerBottom)),

                                    endX,
                                    ma.round(obj.height - prop.marginBottom - parseFloat(prop.marginInnerBottom))
                                ),
                                stroke: obj.properties.yaxisColor,
                                'stroke-width': typeof prop.yaxisLinewidth === 'number' ? prop.yaxisLinewidth : 1,
                                'shape-rendering': "crispEdges"
                            }
                        });
                    }
                }

            //
            // Bar, Line etc types of chart
            //
            } else {

                var height = obj.graphHeight / prop.yaxisLabelsCount,
                    y      = prop.marginTop,
                    len    = prop.yaxisLabelsCount,
                    startX = prop.marginLeft,
                    endX   = prop.marginLeft - prop.yaxisTickmarksLength;

                // A custom number of tickmarks
                if (typeof prop.yaxisLabelsPositionEdgeTickmarksCount === 'number') {
                    len    = prop.yaxisLabelsPositionEdgeTickmarksCount;
                    height = obj.graphHeight / len;
                }

                //
                // Draw the tickmarks
                //
                if (prop.yaxisTickmarks) {
                    for (var i=0; i<len; ++i) {

                        // Draw the axis
                        var axis = RG.SVG.create({
                            svg: obj.svg,
                            parent: obj.svg.all,
                            type: 'path',
                            attr: {
                                d: 'M{1} {2} L{3} {4}'.format(
                                    startX,
                                    y,
                                    endX,
                                    y
                                ),
                                stroke: prop.yaxisColor,
                                'stroke-width': typeof prop.yaxisLinewidth === 'number' ? prop.yaxisLinewidth : 1,
                                'shape-rendering': "crispEdges"
                            }
                        });
                        
                        y += height;
                    }
    
    
                    // Draw an extra tick if the X axis position is not zero or
                    //if the xaxis is not being shown

                    if (    (prop.yaxisScaleMin !== 0 || prop.xaxis === false || obj.mirrorScale)
                        && !(obj.scale.min > 0 && obj.scale.max > 0) ) {

                        var axis = RG.SVG.create({
                            svg: obj.svg,
                            parent: obj.svg.all,
                            type: 'path',
                            attr: {
                                d: 'M{1} {2} L{3} {4}'.format(
                                    prop.marginLeft - prop.yaxisTickmarksLength,
                                    obj.height - prop.marginBottom,
                                    prop.marginLeft,
                                    obj.height - prop.marginBottom - 0.001
                                ),
                                stroke: prop.yaxisColor,
                                'stroke-width': typeof prop.yaxisLinewidth === 'number' ? prop.yaxisLinewidth : 1,
                                'shape-rendering': "crispEdges"
                            }
                        });
                    }
                }
            }
        }






        //
        // Draw the Y axis labels
        //
        if (prop.yaxisScale) {

            var segment = (obj.height - prop.marginTop - prop.marginBottom) / prop.yaxisLabelsCount;

            for (var i=0; i<obj.scale.labels.length; ++i) {

                var y = obj.height - prop.marginBottom - (segment * i) - segment;

                RG.SVG.text({
                    object: obj,
                    parent: obj.svg.all,
                    text:   obj.scale.labels[i],
                    x:      prop.marginLeft - 7 - (prop.yaxis ? (prop.yaxisTickmarksLength - 3) : 0) + prop.yaxisLabelsOffsetx,
                    y:      y + prop.yaxisLabelsOffsety,
                    halign: prop.yaxisLabelsHalign || 'right',
                    valign: prop.yaxisLabelsValign || 'center',
                    tag:    'labels.yaxis',
                    font:   prop.yaxisLabelsFont   || prop.textFont,
                    size:   typeof prop.yaxisLabelsSize === 'number' ? prop.yaxisLabelsSize : prop.textSize,
                    bold:   typeof prop.yaxisLabelsBold === 'boolean' ? prop.yaxisLabelsBold : prop.textBold,
                    italic: typeof prop.yaxisLabelsItalic === 'boolean' ? prop.yaxisLabelsItalic : prop.textItalic,
                    color:  prop.yaxisLabelsColor  || prop.textColor
                });
            }




            //
            // Add the minimum label
            //
            var y   = obj.height - prop.marginBottom,
                // Changed this to use obj.scale.min instead of prop.yaxisScaleMin
                // on 11/11/18 because mirrored scales had zero as the bottom
                // value when it should have been a mirror of the top value
                str = (prop.yaxisScaleUnitsPre + obj.scale.min.toFixed(prop.yaxisScaleDecimals).replace(/\./, prop.yaxisScalePoint) + prop.yaxisScaleUnitsPost);

            var text = RG.SVG.text({
                object: obj,
                parent: obj.svg.all,
                text: typeof prop.yaxisScaleFormatter === 'function' ? (prop.yaxisScaleFormatter)(this, prop.yaxisScaleMin) : str,
                x: prop.marginLeft - 7 - (prop.yaxis ? (prop.yaxisTickmarksLength - 3) : 0) + prop.yaxisLabelsOffsetx,
                y: y + prop.yaxisLabelsOffsety,
                halign: 'right',
                valign: 'center',
                tag:    'labels.yaxis',
                font:   prop.yaxisLabelsFont   || prop.textFont,
                size:   typeof prop.yaxisLabelsSize === 'number' ? prop.yaxisLabelsSize : prop.textSize,
                bold:   typeof prop.yaxisLabelsBold === 'boolean' ? prop.yaxisLabelsBold : prop.textBold,
                italic: typeof prop.yaxisLabelsItalic === 'boolean' ? prop.yaxisLabelsItalic : prop.textItalic,
                color:  prop.yaxisLabelsColor  || prop.textColor
            });
        
        
        //
        // Draw Y axis labels (eg when specific labels are defined or
        //the chart is an HBar
        //
        } else if (prop.yaxisLabels && prop.yaxisLabels.length) {

            for (var i=0; i<prop.yaxisLabels.length; ++i) {

                var segment = (obj.graphHeight - (prop.marginInnerTop || 0) - (prop.marginInnerBottom || 0) ) / prop.yaxisLabels.length,
                    y       = prop.marginTop + (prop.marginInnerTop || 0) + (segment * i) + (segment / 2) + prop.yaxisLabelsOffsety,
                    x       = prop.marginLeft - 7 /*- (prop.yaxis ? (prop.yaxisTickmarksLength) : 0)*/ - (prop.yaxisLinewidth || 1) + prop.yaxisLabelsOffsetx,
                    halign  = 'right';

                // HBar labels
                if (obj.type === 'hbar' && obj.scale.min < obj.scale.max && obj.scale.max <= 0) {
                    halign = 'left';
                    x      = obj.width - prop.marginRight + 7 + prop.yaxisLabelsOffsetx;
                
                // HBar labels (again?)
                } else if (obj.type === 'hbar' && !prop.yaxisLabelsSpecific) {
                    var segment = (obj.graphHeight - (prop.marginInnerTop || 0) - (prop.marginInnerBottom || 0) ) / (prop.yaxisLabels.length);
                    y = prop.marginTop + (prop.marginInnerTop || 0) + (segment * i) + (segment / 2) + prop.yaxisLabelsOffsety;

                // Specific scale
                } else {
                    var segment = (obj.graphHeight - (prop.marginInnerTop || 0) - (prop.marginInnerBottom || 0) ) / (prop.yaxisLabels.length - 1);
                    y = obj.height - prop.marginBottom - (segment * i) + prop.yaxisLabelsOffsety;
                }

                var text = RG.SVG.text({
                    object: obj,
                    parent: obj.svg.all,
                    text:   prop.yaxisLabels[i] ? prop.yaxisLabels[i] : '',
                    x:      x,
                    y:      y,
                    halign: halign,
                    valign: 'center',
                    tag:    'labels.yaxis',
                    font:   prop.yaxisLabelsFont || prop.textFont,
                    size:   typeof prop.yaxisLabelsSize === 'number' ? prop.yaxisLabelsSize : prop.textSize,
                    bold:   typeof prop.yaxisLabelsBold === 'boolean' ? prop.yaxisLabelsBold : prop.textBold,
                    italic: typeof prop.yaxisLabelsItalic === 'boolean' ? prop.yaxisLabelsItalic : prop.textItalic,
                    color:  prop.yaxisLabelsColor || prop.textColor
                });
            }
        }
    };








    //
    // Draws the background
    //
    //@param The chart object
    //
    RG.SVG.drawBackground = function (obj)
    {
        var prop = obj.properties;

        // Set these properties so that if it doesn't exist things don't fail
        if (typeof prop.variant3dOffsetx !== 'number') prop.variant3dOffsetx = 0;
        if (typeof prop.variant3dOffsety !== 'number') prop.variant3dOffsety = 0;




        if (prop.backgroundColor) {

            RG.SVG.create({
                svg:  obj.svg,
                parent: obj.svg.all,
                type: 'rect',
                attr: {
                    x: -1 + prop.variant3dOffsetx + prop.marginLeft,
                    y: -1 - prop.variant3dOffsety + prop.marginTop,
                    width: parseFloat(obj.svg.getAttribute('width')) + 2 - prop.marginLeft - prop.marginRight,
                    height: parseFloat(obj.svg.getAttribute('height')) + 2 - prop.marginTop - prop.marginBottom,
                    fill: prop.backgroundColor
                }
            });
        }













        // Render a background image
        // <image xlink:href="firefox.jpg" x="0" y="0" height="50px" width="50px"/>
        if (prop.backgroundImage) {
        
            var attr = {
                'xlink:href': prop.backgroundImage,
                //preserveAspectRatio: 'xMidYMid slice',
                preserveAspectRatio: prop.backgroundImageAspect || 'none',
                x: prop.marginLeft,
                y: prop.marginTop
            };

            if (prop.backgroundImageStretch) {

                attr.x      = prop.marginLeft + prop.variant3dOffsetx;
                attr.y      = prop.marginTop + prop.variant3dOffsety;
                attr.width  = obj.width - prop.marginLeft - prop.marginRight;
                attr.height = obj.height - prop.marginTop - prop.marginBottom;

            } else {

                if (typeof prop.backgroundImageX === 'number') {
                    attr.x =  prop.backgroundImageX + prop.variant3dOffsetx;
                } else {
                    attr.x =  prop.marginLeft + prop.variant3dOffsetx;
                }

                if (typeof prop.backgroundImageY === 'number') {
                    attr.y =  prop.backgroundImageY + prop.variant3dOffsety;
                } else {
                    attr.y =  prop.marginTop + prop.variant3dOffsety;
                }

                if (typeof prop.backgroundImageW === 'number') {
                    attr.width =  prop.backgroundImageW;
                }
                 

                if (typeof prop.backgroundImageH === 'number') {
                    attr.height =  prop.backgroundImageH;
                }

            }

            //
            // Account for the chart being 3d
            //
            if (prop.variant === '3d') {
                attr.x += prop.variant3dOffsetx;
                attr.y -= prop.variant3dOffsety;
            }



            var img = RG.SVG.create({
                svg:  obj.svg,
                parent: obj.svg.all,
                type: 'image',
                attr: attr,
                style: {
                    opacity: typeof prop.backgroundImageOpacity === 'number' ? prop.backgroundImageOpacity : 1
                }
            });
            
            // Set the width and height if necessary
            if (!prop.backgroundImageStretch) {
                var img2    = new Image();
                img2.src    = prop.backgroundImage;
                img2.onload = function ()
                {
                    if (prop.backgroundImageW === 'number') img.setAttribute('width', prop.backgroundImageW);
                    if (prop.backgroundImageH === 'number') img.setAttribute('height', prop.backgroundImageH);
                };
            }
        }











        if (prop.backgroundGrid) {

            var parts = [];



            // Add the horizontal lines to the path
            if (prop.backgroundGridHlines) {

                if (typeof prop.backgroundGridHlinesCount === 'number') {
                    var count = prop.backgroundGridHlinesCount;
                } else if (obj.type === 'hbar' || obj.type === 'bipolar') {
                    if (typeof prop.yaxisLabels === 'object' && !RG.SVG.isNull(prop.yaxisLabels) && prop.yaxisLabels.length) {
                        var count = prop.yaxisLabels.length;
                    } else if (obj.type === 'hbar') {
                        var count = obj.data.length;
                    } else if (obj.type === 'bipolar') {
                        var count = obj.left.length;
                    }
                } else {
                    var count = prop.yaxisLabelsCount || 5;
                }

                for (var i=0; i<=count; ++i) {

                    parts.push('M{1} {2} L{3} {4}'.format(
                        prop.marginLeft + prop.variant3dOffsetx,
                        prop.marginTop + (obj.graphHeight / count) * i - prop.variant3dOffsety,
                        obj.width - prop.marginRight + prop.variant3dOffsetx,
                        prop.marginTop + (obj.graphHeight / count) * i - prop.variant3dOffsety
                    ));
                }


                // Add an extra background grid line to the path - this its
                // underneath the X axis and shows up if its not there.
                parts.push('M{1} {2} L{3} {4}'.format(
                    prop.marginLeft + prop.variant3dOffsetx,
                    obj.height - prop.marginBottom - prop.variant3dOffsety,
                    obj.width - prop.marginRight + prop.variant3dOffsetx,
                    obj.height - prop.marginBottom - prop.variant3dOffsety
                ));
            }



            // Add the vertical lines to the path
            if (prop.backgroundGridVlines) {

                if (obj.type === 'line' && RG.SVG.isArray(obj.data[0])) {
                    var len = obj.data[0].length;
                } else if (obj.type === 'hbar') {
                    var len = prop.xaxisLabelsCount || 10;
                } else if (obj.type === 'bipolar') {
                    var len = prop.xaxisLabelsCount || 10;
                } else if (obj.type === 'scatter') {
                    var len = (prop.xaxisLabels && prop.xaxisLabels.length) || 10;
                } else if (obj.type === 'waterfall') {
                    var len = obj.data.length;

                } else {
                    var len = obj.data.length;
                }

                var count = typeof prop.backgroundGridVlinesCount === 'number' ? prop.backgroundGridVlinesCount : len;

                if (prop.xaxisLabelsPosition === 'edge') {
                    count--;
                }
            
                for (var i=0; i<=count; ++i) {
                    parts.push('M{1} {2} L{3} {4}'.format(
                        prop.marginLeft + ((obj.graphWidth / count) * i) + prop.variant3dOffsetx,
                        prop.marginTop - prop.variant3dOffsety,
                        prop.marginLeft + ((obj.graphWidth / count) * i) + prop.variant3dOffsetx,
                        obj.height - prop.marginBottom - prop.variant3dOffsety
                    ));
                }
            }





            // Add the box around the grid
            if (prop.backgroundGridBorder) {
                parts.push('M{1} {2} L{3} {4} L{5} {6} L{7} {8} z'.format(
                    
                    prop.marginLeft + prop.variant3dOffsetx,
                    prop.marginTop  - prop.variant3dOffsety,
                    
                    obj.width - prop.marginRight + prop.variant3dOffsetx,
                    prop.marginTop - prop.variant3dOffsety,
                    
                    obj.width - prop.marginRight + prop.variant3dOffsetx,
                    obj.height - prop.marginBottom - prop.variant3dOffsety,
                    
                    prop.marginLeft + prop.variant3dOffsetx,
                    obj.height - prop.marginBottom - prop.variant3dOffsety
                ));
            }

            
            // Get the dash array if its defined to be dotted or dashed
            var dasharray;

            if (prop.backgroundGridDashed) {
                dasharray = [3,5];
            } else if (prop.backgroundGridDotted) {
                dasharray = [1,3];
            } else if (prop.backgroundGridDashArray) {
                dasharray = prop.backgroundGridDashArray;
            } else {
                dasharray = '';
            }


            // Now draw the path
            var grid = RG.SVG.create({
                svg: obj.svg,
                parent: obj.svg.all,
                type: 'path',
                attr: {
                    className: 'rgraph_background_grid',
                    d: parts.join(' '),
                    stroke: prop.backgroundGridColor,
                    fill: 'rgba(0,0,0,0)',
                    'stroke-width': prop.backgroundGridLinewidth,
                    'shape-rendering': "crispEdges",
                    'stroke-dasharray': dasharray
                },
                style: {
                    pointerEvents: 'none'
                }
            });

        }





        // Draw the title and subtitle
        if (obj.type !== 'bipolar') {
            RG.SVG.drawTitle(obj);
        }
    };








    /**
    * Returns true/false as to whether the given variable is null or not
    * 
    * @param mixed arg The argument to check
    */
    RG.SVG.isNull = function (arg)
    {
        // must BE DOUBLE EQUALS - NOT TRIPLE
        if (arg == null || typeof arg === 'object' && !arg) {
            return true;
        }
        
        return false;
    };








    /**
    * Returns an appropriate scale. The return value is actualy an object consisting of:
    *  scale.max
    *  scale.min
    *  scale.scale
    * 
    * @param  obj object  The graph object
    * @param  prop object An object consisting of configuration properties
    * @return     object  An object containg scale information
    */
    RG.SVG.getScale = function (opt)
    {
        var obj          = opt.object,
            prop         = obj.properties,
            numlabels    = opt.numlabels,
            unitsPre     = opt.unitsPre,
            unitsPost    = opt.unitsPost,
            max          = Number(opt.max),
            min          = Number(opt.min),
            strict       = opt.strict,
            decimals     = Number(opt.decimals),
            point        = opt.point,
            thousand     = opt.thousand,
            originalMax  = max,
            round        = opt.round,
            scale        = {max:1,labels:[],values:[]},
            formatter    = opt.formatter;


        /**
        * Special case for 0
        * 
        * ** Must be first **
        */

        if (max === 0 && min === 0) {

            var max = 1;

            for (var i=0; i<numlabels; ++i) {

                var label = ((((max - min) / numlabels) * (i + 1)) + min).toFixed(decimals);

                scale.labels.push(unitsPre + label + unitsPost);
                scale.values.push(parseFloat(label))
            }

        /**
        * Manually do decimals
        */
        } else if (max <= 1 && !strict) {

            var arr = [
                1,0.5,
                0.10,0.05,
                0.010,0.005,
                0.0010,0.0005,
                0.00010,0.00005,
                0.000010,0.000005,
                0.0000010,0.0000005,
                0.00000010,0.00000005,
                0.000000010,0.000000005,
                0.0000000010,0.0000000005,
                0.00000000010,0.00000000005,
                0.000000000010,0.000000000005,
                0.0000000000010,0.0000000000005
            ], vals = [];



            for (var i=0; i<arr.length; ++i) {
                if (max > arr[i]) {
                    i--;
                    break;
                }
            }


            scale.max    = arr[i]
            scale.labels = [];
            scale.values = [];


            for (var j=0; j<numlabels; ++j) {
                
                var value = ((((arr[i] - min) / numlabels) * (j + 1)) + min).toFixed(decimals);

                scale.values.push(value);
                scale.labels.push(RG.SVG.numberFormat({
                    object: obj,
                    num: value,
                    prepend: unitsPre,
                    append: unitsPost,
                    point: prop.yaxisScalePoint,
                    thousand: prop.yaxisScaleThousand,
                    formatter: formatter
                }));
            }




        } else if (!strict) {

            /**
            * Now comes the scale handling for integer values
            */

            // This accommodates decimals by rounding the max up to the next integer
            max = ma.ceil(max);

            var interval = ma.pow(10, ma.max(1, Number(String(Number(max) - Number(min)).length - 1)) );
            var topValue = interval;

            while (topValue < max) {
                topValue += (interval / 2);
            }

            // Handles cases where the max is (for example) 50.5
            if (Number(originalMax) > Number(topValue)) {
                topValue += (interval / 2);
            }

            // Custom if the max is greater than 5 and less than 10
            if (max <= 10) {
                topValue = (Number(originalMax) <= 5 ? 5 : 10);
            }
    
    
            // Added 02/11/2010 to create "nicer" scales
            if (obj && typeof(round) == 'boolean' && round) {
                topValue = 10 * interval;
            }

            scale.max = topValue;


            for (var i=0; i<numlabels; ++i) {

                var label = RG.SVG.numberFormat({
                    object: obj,
                    num: ((((i+1) / numlabels) * (topValue - min)) + min).toFixed(decimals),
                    prepend: unitsPre,
                    append: unitsPost,
                    point: point,
                    thousand: thousand,
                    formatter: formatter
                });

                scale.labels.push(label);
                scale.values.push(((((i+1) / numlabels) * (topValue - min)) + min).toFixed(decimals));
            }

        } else if (typeof max === 'number' && strict) {

            /**
            * ymax is set and also strict
            */
            for (var i=0; i<numlabels; ++i) {
                
                scale.labels.push(RG.SVG.numberFormat({
                    object: obj,
                    formatter: formatter,
                    num: ((((i+1) / numlabels) * (max - min)) + min).toFixed(decimals),
                    prepend: unitsPre,
                    append: unitsPost,
                    point: point,
                    thousand: thousand
                }));


                scale.values.push(
                    ((((i+1) / numlabels) * (max - min)) + min).toFixed(decimals)
                );
            }

            // ???
            scale.max = max;
        }

        
        scale.unitsPre  = unitsPre;
        scale.unitsPost = unitsPost;
        scale.point     = point;
        scale.decimals  = decimals;
        scale.thousand  = thousand;
        scale.numlabels = numlabels;
        scale.round     = Boolean(round);
        scale.min       = min;

        //
        // Convert all of the scale values to numbers
        //
        for (var i=0; i<scale.values.length; ++i) {
            scale.values[i] = parseFloat(scale.values[i]);
        }

        return scale;
    };








    /**
    * Pads/fills the array
    * 
    * @param  array arr The array
    * @param  int   len The length to pad the array to
    * @param  mixed     The value to use to pad the array (optional)
    */
    RG.SVG.arrayFill = 
    RG.SVG.arrayPad  = function (opt)
    {
        var arr   = opt.array,
            len   = opt.length,
            value = (typeof opt.value === 'undefined' ? null : opt.value);

        if (arr.length < len) {            
            for (var i=arr.length; i<len; i+=1) {
                arr[i] = value;
            }
        }
        
        return arr;
    };








    /**
    * An array sum function
    * 
    * @param  array arr The  array to calculate the total of
    * @return int       The summed total of the arrays elements
    */
    RG.SVG.arraySum = function (arr)
    {
        // Allow integers
        if (typeof arr === 'number') {
            return arr;
        }
        
        // Account for null
        if (RG.SVG.isNull(arr)) {
            return 0;
        }

        var i, sum, len = arr.length;

        for(i=0,sum=0;i<len;sum+=arr[i++]);

        return sum;
    };








    /**
    * Returns the maximum numeric value which is in an array. This function IS NOT
    * recursive
    * 
    * @param  array arr The array (can also be a number, in which case it's returned as-is)
    * @param  int       Whether to ignore signs (ie negative/positive)
    * @return int       The maximum value in the array
    */
    RG.SVG.arrayMax = function (arr)
    {
        var max = null
        
        if (typeof arr === 'number') {
            return arr;
        }
        
        if (RG.SVG.isNull(arr)) {
            return 0;
        }

        for (var i=0,len=arr.length; i<len; ++i) {
            if (typeof arr[i] === 'number') {

                var val = arguments[1] ? ma.abs(arr[i]) : arr[i];
                
                if (typeof max === 'number') {
                    max = ma.max(max, val);
                } else {
                    max = val;
                }
            }
        }

        return max;
    };








    /**
    * Returns the minimum numeric value which is in an array
    * 
    * @param  array arr The array (can also be a number, in which case it's returned as-is)
    * @param  int       Whether to ignore signs (ie negative/positive)
    * @return int       The minimum value in the array
    */
    RG.SVG.arrayMin = function (arr)
    {
        var max = null,
            min = null,
            ma  = Math;
        
        if (typeof arr === 'number') {
            return arr;
        }
        
        if (RG.SVG.isNull(arr)) {
            return 0;
        }

        for (var i=0,len=arr.length; i<len; ++i) {
            if (typeof arr[i] === 'number') {

                var val = arguments[1] ? ma.abs(arr[i]) : arr[i];
                
                if (typeof min === 'number') {
                    min = ma.min(min, val);
                } else {
                    min = val;
                }
            }
        }

        return min;
    };








    /**
    * Returns the maximum value which is in an array
    * 
    * @param  array arr The array
    * @param  int   len The length to pad the array to
    * @param  mixed     The value to use to pad the array (optional)
    */
    RG.SVG.arrayPad = function (arr, len)
    {
        if (arr.length < len) {
            var val = arguments[2] ? arguments[2] : null;
            
            for (var i=arr.length; i<len; i+=1) {
                arr[i] = val;
            }
        }
        
        return arr;
    };








    /**
    * An array sum function
    * 
    * @param  array arr The  array to calculate the total of
    * @return int       The summed total of the arrays elements
    */
    RG.SVG.arraySum = function (arr)
    {
        // Allow integers
        if (typeof arr === 'number') {
            return arr;
        }
        
        // Account for null
        if (RG.SVG.isNull(arr)) {
            return 0;
        }

        var i, sum, len = arr.length;

        for(i=0,sum=0;i<len;sum+=arr[i++]);

        return sum;
    };








    /**
    * Takes any number of arguments and adds them to one big linear array
    * which is then returned
    * 
    * @param ... mixed The data to linearise. You can strings, booleans, numbers or arrays
    */
    RG.SVG.arrayLinearize = function ()
    {
        var arr  = [],
            args = arguments

        for (var i=0,len=args.length; i<len; ++i) {

            if (typeof args[i] === 'object' && args[i]) {
                for (var j=0,len2=args[i].length; j<len2; ++j) {
                    var sub = RG.SVG.arrayLinearize(args[i][j]);
                    
                    for (var k=0,len3=sub.length; k<len3; ++k) {
                        arr.push(sub[k]);
                    }
                }
            } else {
                arr.push(args[i]);
            }
        }

        return arr;
    };








    /**
    * Takes one off the front of the given array and returns the new array.
    * 
    * @param array arr The array from which to take one off the front of array 
    * 
    * @return array The new array
    */
    RG.SVG.arrayShift = function(arr)
    {
        var ret = [];
        
        for(var i=1,len=arr.length; i<len; ++i) {
            ret.push(arr[i]);
        }
        
        return ret;
    };








    /**
    * Reverses the order of an array
    * 
    * @param array arr The array to reverse
    */
    RG.SVG.arrayReverse = function (arr)
    {
        if (!arr) {
            return;
        }

        var newarr=[];

        for(var i=arr.length - 1; i>=0; i-=1) {
            newarr.push(arr[i]);
        }
        
        return newarr;
    };








    /**
    * Makes a clone of an object
    * 
    * @param obj val The object to clone
    */
    RG.SVG.arrayClone = function (obj)
    {
        if(obj === null || typeof obj !== 'object') {
            return obj;
        }

        if (RG.SVG.isArray(obj)) {

            var temp = [];
    
            for (var i=0,len=obj.length;i<len; ++i) {
    
                if (typeof obj[i]  === 'number') {
                    temp[i] = (function (arg) {return Number(arg);})(obj[i]);
    
                } else if (typeof obj[i]  === 'string') {
                    temp[i] = (function (arg) {return String(arg);})(obj[i]);
                
                } else if (typeof obj[i] === 'function') {
                    temp[i] = obj[i];
                
                } else {
                    temp[i] = RG.SVG.arrayClone(obj[i]);
                }
            }
        } else if (typeof obj === 'object') {
            
            var temp = {};
            
            for (var i in obj) {
                if (typeof i === 'string') {
                    temp[i] = obj[i];
                }
            }
        }

        return temp;
    };








    //
    // Converts an the truthy values to falsey values and vice-versa
    //
    RG.SVG.arrayInvert = function (arr)
    {
        for (var i=0,len=arr.length; i<len; ++i) {
            arr[i] = !arr[i];
        }

        return arr;
    };








    //
    // An array_trim function that removes the empty elements off
    //both ends
    //
    RG.SVG.arrayTrim = function (arr)
    {
        var out = [], content = false;

        // Trim the start
        for (var i=0; i<arr.length; i++) {
        
            if (arr[i]) {
                content = true;
            }
        
            if (content) {
                out.push(arr[i]);
            }
        }
        
        // Reverse the array and trim the start again
        out = RG.SVG.arrayReverse(out);

        var out2 = [], content = false ;
        for (var i=0; i<out.length; i++) {
        
            if (out[i]) {
                content = true;
            }
        
            if (content) {
                out2.push(out[i]);
            }
        }
        
        // Now reverse the array and return it
        out2 = RG.SVG.arrayReverse(out2);

        return out2;
    };








    /**
    * Determines if the given object is an array or not
    * 
    * @param mixed obj The variable to test
    */
    RG.SVG.isArray = function (obj)
    {
        if (obj && obj.constructor) {
            var pos = obj.constructor.toString().indexOf('Array');
        } else {
            return false;
        }

        return obj != null &&
               typeof pos === 'number' &&
               pos > 0 &&
               pos < 20;
    };








    /**
    * Returns the absolute value of a number. You can also pass in an
    * array and it will run the abs() function on each element. It
    * operates recursively so sub-arrays are also traversed.
    * 
    * @param array arr The number or array to work on
    */
    RG.SVG.abs = function (value)
    {
        if (typeof value === 'string') {
            value = parseFloat(value) || 0;
        }

        if (typeof value === 'number') {
            return ma.abs(value);
        }

        if (typeof value === 'object') {
            for (i in value) {
                if (   typeof i === 'string'
                    || typeof i === 'number'
                    || typeof i === 'object') {

                    value[i] = RG.SVG.abs(value[i]);
                }
            }
            
            return value;
        }
        
        return 0;
    };








    //
    // Formats a number with thousand seperators so it's easier to read
    //
    // @param opt object The options to the function
    //
    RG.SVG.numberFormat = function (opt)
    {
        var obj                = opt.object,
            prepend            = opt.prepend ? String(opt.prepend) : '',
            append             = opt.append ? String(opt.append) : '',
            output             = '',
            decimal_seperator  = typeof opt.point === 'string' ? opt.point : '.',
            thousand_seperator = typeof opt.thousand === 'string' ? opt.thousand : ',',
            num                = opt.num
            decimals_trim      = opt.decimals_trim;

        RegExp.$1   = '';

        if (typeof opt.formatter === 'function') {
            return opt.formatter(obj, num);
        }

        // Ignore the preformatted version of "1e-2"
        if (String(num).indexOf('e') > 0) {
            return String(prepend + String(num) + append);
        }

        // We need then number as a string
        num = String(num);
        
        // Take off the decimal part - we re-append it later
        if (num.indexOf('.') > 0) {
            var tmp = num;
            num     = num.replace(/\.(.*)/, ''); // The front part of the number
            decimal = tmp.replace(/(.*)\.(.*)/, '$2'); // The decimal part of the number
        } else {
            decimal = '';
        }

        // Thousand seperator
        //var seperator = arguments[1] ? String(arguments[1]) : ',';
        var seperator = thousand_seperator;
        
        /**
        * Work backwards adding the thousand seperators
        */
        var foundPoint;
        for (i=(num.length - 1),j=0; i>=0; j++,i--) {
            var character = num.charAt(i);
            
            if ( j % 3 == 0 && j != 0) {
                output += seperator;
            }
            
            /**
            * Build the output
            */
            output += character;
        }
        
        /**
        * Now need to reverse the string
        */
        var rev = output;
        output = '';
        for (i=(rev.length - 1); i>=0; i--) {
            output += rev.charAt(i);
        }

        // Tidy up
        //output = output.replace(/^-,/, '-');
        if (output.indexOf('-' + thousand_seperator) == 0) {
            output = '-' + output.substr(('-' + thousand_seperator).length);
        }

        // Reappend the decimal
        if (decimal.length) {
            output =  output + decimal_seperator + decimal;
            decimal = '';
            RegExp.$1 = '';
        }

        //
        // Trim the decimals if it's all zeros
        //
        if (decimals_trim) {
            output = output.replace(/0+$/,'');
            output = output.replace(/\.$/,'');
        }

        // Minor bugette
        if (output.charAt(0) == '-') {
            output = output.replace(/-/, '');
            prepend = '-' + prepend;
        }

        return prepend + output + append;
    };








    //
    // A function that adds text to the chart
    //
    RG.SVG.text = function (opt)
    {
        var obj               = opt.object,
            parent            = opt.parent || opt.object.svg.all,
            size              = typeof opt.size === 'number' ? opt.size + 'pt' : (typeof opt.size === 'string' ? opt.size.replace(/pt$/,'') : 12) + 'pt',
            bold              = opt.bold ? 'bold' : 'normal',
            font              = opt.font ? opt.font : 'sans-serif',
            italic            = opt.italic ? 'italic' : 'normal',
            halign            = opt.halign,
            valign            = opt.valign,
            str               = opt.text,
            x                 = opt.x,
            y                 = opt.y,
            color             = opt.color ? opt.color : 'black',
            background        = opt.background || null,
            backgroundRounded = opt.backgroundRounded || 0,
            padding           = opt.padding || 0,
            link              = opt.link || '',
            linkTarget        = opt.linkTarget || '_blank',
            events            = (opt.events === false ? false : true),
            angle             = opt.angle;


        
        
        //
        // Change numbers to strings
        //
        if (typeof str === 'number') {
            str = String(str);
        }
        
        //
        // Change null values to an empty string
        //
        if (RG.SVG.isNull(str)) {
            str = '';
        }
        
        //
        // If the string starts with a carriage return add a unicode non-breaking
        // space to the start of it.
        //
        if (str && str.substr(0,2) == '\r\n' || str.substr(0,1) === '\n') {
            str = "\u00A0" + str;
        }




        // Horizontal alignment
        if (halign === 'right') {
            halign = 'end';
        } else if (halign === 'center' || halign === 'middle') {
            halign = 'middle';
        } else {
            halign = 'start';
        }

        // Vertical alignment
        if (valign === 'top') {
            valign = 'hanging';
        } else if (valign === 'center' || valign === 'middle') {
            valign = 'central';
            valign = 'middle';
        } else {
            valign = 'bottom';
        }

        //
        // If a link has been specified then the text node should
        // be a child of an a node
        if (link) {
            var a = RGraph.SVG.create({
                svg: obj.svg,
                type: 'a',
                parent: parent,
                attr: {
                    'xlink:href': link,
                    target: linkTarget
                }
            });
        }

        //
        // Text does not include carriage returns
        //
        if (str && str.indexOf && str.indexOf("\n") === -1) {
            var text = RG.SVG.create({
                svg: obj.svg,
                parent: link ? a : opt.parent,
                type: 'text',
                attr: {
                    tag: opt.tag ? opt.tag : '',
                    fill: color,
                    x: x,
                    y: y,
                    'font-size':         size,
                    'font-weight':       bold,
                    'font-family':       font,
                    'font-style':        italic,
                    'text-anchor':       halign,
                    'dominant-baseline': valign
                }
            });
    
            var textNode = document.createTextNode(str);
            text.appendChild(textNode);

            if (!events) {
                text.style.pointerEvents = 'none';
            }


        
        //
        // Includes carriage returns
        //
        } else if (str && str.indexOf) {
            
            // Measure the text
            var dimensions = RG.SVG.measureText({
                text: 'My',
                bold: bold,
                font: font,
                size: size
            });
            
            var lineHeight = dimensions[1];

            str = str.split(/\r?\n/);





            //
            // Account for the carriage returns and move the text
            // up as required
            //
            if (valign === 'bottom') {
                y -= str.length * lineHeight;
            }

            if (valign === 'center' || valign === 'middle') {
                y -= (str.length * lineHeight) / 2;
            }





            var text = RG.SVG.create({
                svg: obj.svg,
                parent: link ? a : opt.parent,
                type: 'text',
                attr: {
                    tag: opt.tag ? opt.tag : '',
                    fill: color,
                    x: x,
                    y: y,
                    'font-size':         size,
                    'font-weight':       bold,
                    'font-family':       font,
                    'font-style':        italic,
                    'text-anchor':       halign,
                    'dominant-baseline': valign
                }
            });

            if (!events) {
                text.style.pointerEvents = 'none';
            }


            for (var i=0; i<str.length; ++i) {

                var tspan = RG.SVG.create({
                    svg: obj.svg,
                    parent: text,
                    type: 'tspan',
                    attr: {
                        x: x,
                        dy: dimensions ? (dimensions[1] * (i ? 1 : 0)) + 3 : 0
                    }
                });

                var textNode = document.createTextNode(str[i]);
                tspan.appendChild(textNode);

                if (!events) {
                    tspan.style.pointerEvents = 'none';
                }

                var dimensions = RG.SVG.measureText({
                    text: str[i],
                    bold: bold,
                    font: font,
                    size: parseInt(size)
                });
            }
        }
        
        
        // Now add the rotation if necessary
        if (typeof angle === 'number' && angle && text) {
            text.setAttribute('x', 0);
            text.setAttribute('y', 0);
            text.setAttribute('transform', 'translate({1} {2}) rotate({3})'.format(x, y, -1 * angle));
        }



        //
        // Add a background color if specified
        //
        if (typeof background === 'string') {

            var parent = link ? a : parent;

            var bbox = text.getBBox(),
                rect = RG.SVG.create({
                    svg:    obj.svg,
                    parent: parent,
                    type:   'rect',
                    attr: {
                        x:      bbox.x - padding,
                        y:      bbox.y - padding,
                        width:  bbox.width + (padding * 2),
                        height: bbox.height + (padding * 2),
                        fill:   background,
                        rx: backgroundRounded,
                        ry: backgroundRounded
                    }
                });
                
                if (!events) {
                    rect.style.pointerEvents = 'none';
                }

            text.parentNode.insertBefore(rect, text);
        }



        if (RG.SVG.ISIE && (valign === 'hanging') && text) {
            text.setAttribute('y', y + (text.scrollHeight / 2));

        } else if (RG.SVG.ISIE && valign === 'middle') {
            text.setAttribute('y', y + (text.scrollHeight / 3));
        }




        if (RG.SVG.ISFF && text) {
            Y = y + (text.scrollHeight / 3);
        }
        
        return text;
    };








    //
    // Helps you get hold of the SPAN tag nodes that hold the text on the chart
    //
    RG.SVG.text.find = function (opt)
    {
        // Search criteria should include:
        //  o text (literal string and regex)
        if (typeof opt.object === 'object' && opt.object.isRGraph) {
            var svg = opt.object.svg;
        } else if (typeof opt.svg === 'object' && opt.svg.all) {
            var svg    = opt.svg;
            opt.object = svg.__object__;
        }
        
        // Look for text nodes based on the text
        var nodes = svg.getElementsByTagName('text');
        var found = [];

        for (var i=0,len=nodes.length; i<len; ++i) {

            var text = false,
                tag  = false;

            // Exact match or regex on the text
            if (typeof opt.text === 'string' && nodes[i].innerHTML === opt.text) {
                text = true;
            } else if (typeof opt.text === 'object' && nodes[i].innerHTML.match(opt.text)) {
                text = true;
            } else if (typeof opt.text === 'undefined') {
                text = true;
            }


            // Exact match or regex on the tag
            if (typeof opt.tag === 'string' && nodes[i].getAttribute('tag') === opt.tag) {
                tag = true;
            } else if (typeof opt.tag === 'object' && nodes[i].getAttribute('tag').match(opt.tag)) {
                tag = true;
            } else if (typeof opt.tag === 'undefined') {
                tag = true;
            }


            // Did all of the conditions pass?
            if (text === true && tag === true) {
                found.push(nodes[i])
            }
        }

        // If a callback has been specified then call it whilst
        // passing it the text
        if (typeof opt.callback === 'function') {
            (opt.callback)({nodes: found,object: opt.object});
        }

        return found;
    };








    //
    // Creates a UID that is applied to the object
    //
    RG.SVG.createUID = function ()
    {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c)
        {
            var r = ma.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    };








    //
    // Determines if the SVG DIV container is fixed
    //
    RG.SVG.isFixed = function (svg)
    {
        var obj = svg.parentNode,
            i   = 0;

        while (obj && obj.tagName.toLowerCase() != 'body' && i < 99) {

            if (obj.style.position === 'fixed') {
                return obj;
            }
            
            obj = obj.offsetParent;
        }

        return false;
    };








    /**
    * Sets an object in the RGraph registry
    * 
    * @param string name The name of the value to set
    */
    RG.SVG.REG.set = function (name, value)
    {
        RG.SVG.REG.store[name] = value;
        
        return value;
    };








    /**
    * Gets an object from the RGraph registry
    * 
    * @param string name The name of the value to fetch
    */
    RG.SVG.REG.get = function (name)
    {
        return RG.SVG.REG.store[name];
    };








    /**
    * Removes white-space from the start aqnd end of a string
    * 
    * @param string str The string to trim
    */
    RG.SVG.trim = function (str)
    {
        return RG.SVG.ltrim(RG.SVG.rtrim(str));
    };








    /**
    * Trims the white-space from the start of a string
    * 
    * @param string str The string to trim
    */
    RG.SVG.ltrim = function (str)
    {
        return str.replace(/^(\s|\0)+/, '');
    };








    /**
    * Trims the white-space off of the end of a string
    * 
    * @param string str The string to trim
    */
    RG.SVG.rtrim = function (str)
    {
        return str.replace(/(\s|\0)+$/, '');
    };








    //
    // Hides the currently shown tooltip
    //
    RG.SVG.hideTooltip = function ()
    {
        var tooltip = RG.SVG.REG.get('tooltip');

        if (tooltip && tooltip.parentNode /*&& (!uid || uid == tooltip.__canvas__.uid)*/) {
            tooltip.parentNode.removeChild(tooltip);
            tooltip.style.display = 'none';                
            tooltip.style.visibility = 'hidden';
            RG.SVG.REG.set('tooltip', null);
        }

        if (tooltip && tooltip.__object__) {
            RG.SVG.removeHighlight(tooltip.__object__);
        }
    };








    //
    // Creates a shadow
    //
    RG.SVG.setShadow = function (options)
    {
        var obj     = options.object,
            offsetx = options.offsetx  || 0,
            offsety = options.offsety || 0,
            blur    = options.blur || 0,
            opacity = options.opacity || 0,
            id      = options.id;

        var filter = RG.SVG.create({
            svg: obj.svg,
            parent: obj.svg.defs,
            type: 'filter',
            attr: {
                id: id,
                 width: "130%",
                 height: "130%"
            }
        });

        RG.SVG.create({
            svg: obj.svg,
            parent: filter,
            type: 'feOffset',
            attr: {
                result: 'offOut',
                'in': 'SourceGraphic',
                dx: offsetx,
                dy: offsety
            }
        });

        RG.SVG.create({
            svg: obj.svg,
            parent: filter,
            type: 'feColorMatrix',
            attr: {
                result: 'matrixOut',
                'in': 'offOut',
                type: 'matrix',
                values: '0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 {1} 0'.format(
                    opacity
                )
            }
        });

        RG.SVG.create({
            svg: obj.svg,
            parent: filter,
            type: 'feGaussianBlur',
            attr: {
                result: 'blurOut',
                'in': 'matrixOut',
                stdDeviation: blur
            }
        });

        RG.SVG.create({
            svg: obj.svg,
            parent: filter,
            type: 'feBlend',
            attr: {
                'in': 'SourceGraphic',
                'in2': 'blurOut',
                mode: 'normal'
            }
        });
    };








    /**
    * Takes a sequential index and returns the group/index variation of it. Eg if you have a
    * sequential index from a grouped bar chart this function can be used to convert that into
    * an appropriate group/index combination
    * 
    * @param nindex number The sequential index
    * @param data   array  The original data (which is grouped)
    * @return              The group/index information
    */
    RG.SVG.sequentialIndexToGrouped = function (index, data)
    {
        var group         = 0,
            grouped_index = 0;

        while (--index >= 0) {

            if (RG.SVG.isNull(data[group])) {
                group++;
                grouped_index = 0;
                continue;
            }

            // Allow for numbers as well as arrays in the dataset
            if (typeof data[group] == 'number') {
                group++
                grouped_index = 0;
                continue;
            }
            

            grouped_index++;
            
            if (grouped_index >= data[group].length) {
                group++;
                grouped_index = 0;
            }
        }

        return [group, grouped_index];
    };








    //
    // This is the reverse of the above function - converting
    // group/index to a sequential index
    //
    // @return number The sequential index
    //
    RG.SVG.groupedIndexToSequential = function (opt)
    {
        var dataset = opt.dataset,
            index   = opt.index,
            obj     = opt.object;

        for (var i=0,seq=0; i<=dataset; ++i) {
            for (var j=0; j<obj.data[dataset].length; ++j) {
                
                if (i === dataset && j === index) {
                    return seq;
                }
                seq++;
            }
        }
        
        return seq;
    };








    //
    // Takes any number of arguments and adds them to one big linear array
    // which is then returned
    //
    // @param ... mixed The data to linearise. You can strings, booleans, numbers or arrays
    //
    RG.SVG.arrayLinearize = function ()
    {
        var arr  = [],
            args = arguments

        for (var i=0,len=args.length; i<len; ++i) {

            if (typeof args[i] === 'object' && args[i]) {
                for (var j=0,len2=args[i].length; j<len2; ++j) {
                    var sub = RG.SVG.arrayLinearize(args[i][j]);
                    
                    for (var k=0,len3=sub.length; k<len3; ++k) {
                        arr.push(sub[k]);
                    }
                }
            } else {
                arr.push(args[i]);
            }
        }

        return arr;
    };








    //
    // This function converts coordinates into the type understood by
    // SVG for drawing arcs
    //
    RG.SVG.TRIG.toCartesian = function (options)
    {
        return {
            x: options.cx + (options.r * ma.cos(options.angle)),
            y: options.cy + (options.r * ma.sin(options.angle))
        };
    };








    //
    // This function, when given the x1,x2,y1,y2 coordinates will return
    //the diagonal length between the two using pythagorous.
    //
    RG.SVG.TRIG.getHypLength = function (opt)
    {
        var h = Math.abs(opt.x2 - opt.x1)
            v = Math.abs(opt.y2 - opt.y1),
            r = Math.sqrt(
                  (h * h)
                + (v * v)
            );

        return r;
    };








        // This takes centerx, centery, x and y coordinates and returns the
        // appropriate angle relative to the canvas angle system. Remember
        // that the canvas angle system starts at the EAST axis
        // 
        // @param  number cx  The centerx coordinate
        // @param  number cy  The centery coordinate
        // @param  number x   The X coordinate (eg the mouseX if coming from a click)
        // @param  number y   The Y coordinate (eg the mouseY if coming from a click)
        // @return number     The relevant angle (measured in in RADIANS)
        //
        RG.SVG.TRIG.getAngleByXY = function (opt)
        {
            var cx = opt.cx,
                cy = opt.cy,
                x  = opt.x,
                y  = opt.y;

            var angle = ma.atan((y - cy) / (x - cx));

            if (x >= cx && y >= cy) {
                angle += RG.SVG.TRIG.HALFPI;
            } else if (x >= cx && y < cy) {
                angle = angle + RG.SVG.TRIG.HALFPI;
            } else if (x < cx && y < cy) {
                angle = angle + RG.SVG.TRIG.PI + RG.SVG.TRIG.HALFPI;
            } else {
                angle = angle + RG.SVG.TRIG.PI + RG.SVG.TRIG.HALFPI;
            }
    
            return angle;
        };








    //
    // Gets a path that is usable by the SVG A path command
    //
    // @patam object options The options/arg to the function
    //
    // NB ** Still used by the Pie chart and the semi-circular Meter **
    //
    RG.SVG.TRIG.getArcPath = function (options)
    {
        //
        // Make circles start at the top instead of the right hand side
        //
        options.start -= 1.57;
        options.end   -= 1.57;

        var start = RG.SVG.TRIG.toCartesian({
            cx:    options.cx,
            cy:    options.cy,
            r:     options.r,
            angle: options.start}
        );

        var end = RG.SVG.TRIG.toCartesian({
            cx:    options.cx,
            cy:    options.cy,
            r:     options.r,
            angle: options.end
        });

        var diff = options.end - options.start;
        
        // Initial values
        var largeArc = '0';
        var sweep    = '0';

        if (options.anticlockwise && diff > 3.14) {
            largeArc = '0';
            sweep    = '0';
        } else if (options.anticlockwise && diff <= 3.14) {
            largeArc = '1';
            sweep    = '0';
        } else if (!options.anticlockwise && diff > 3.14) {
            largeArc = '1';
            sweep    = '1';
        } else if (!options.anticlockwise && diff <= 3.14) {
            largeArc = '0';
            sweep    = '1';
        }
        
        if (options.start > options.end && options.anticlockwise && diff <= 3.14) {
            largeArc = '0';
            sweep    = '0';
        }

        if (options.start > options.end && options.anticlockwise && diff > 3.14) {
            largeArc = '1';
            sweep    = '1';
        }


        if (typeof options.moveto === 'boolean' && options.moveto === false) {
            var d = [
                "A", options.r, options.r, 0, largeArc, sweep, end.x, end.y
            ];
        } else {
            var d = [
                "M", start.x, start.y, 
                "A", options.r, options.r, 0, largeArc, sweep, end.x, end.y
            ];
        }
        
        if (options.array === true) {
            return d;
        } else {
            return d.join(" ");
        }
    };








    //
    // Gets a path that is usable by the SVG A path command
    //
    // @patam object options The options/arg to the function
    //
    RG.SVG.TRIG.getArcPath2 = function (options)
    {
        //
        // Make circles start at the top instead of the right hand side
        //
        options.start -= 1.57;
        options.end   -= 1.57;

        var start = RG.SVG.TRIG.toCartesian({
            cx:    options.cx,
            cy:    options.cy,
            r:     options.r,
            angle: options.start
        });

        var end = RG.SVG.TRIG.toCartesian({
            cx:    options.cx,
            cy:    options.cy,
            r:     options.r,
            angle: options.end
        });

        var diff = ma.abs(options.end - options.start);
        
        // Initial values
        var largeArc = '0';
        var sweep    = '0';

        //TODO Put various options here for the correct combination of flags to use
        if (!options.anticlockwise) {
            if (diff > RG.SVG.TRIG.PI) {
                largeArc = '1';
                sweep    = '1';
            } else {
                largeArc = '0';
                sweep    = '1';
            }
        } else {
            if (diff > RG.SVG.TRIG.PI) {
                largeArc = '1';
                sweep    = '0';
            } else {
                largeArc = '0';
                sweep    = '0';
            }
        }

        if (typeof options.lineto === 'boolean' && options.lineto === false) {
            var d = [
                "M", start.x, start.y,
                "A", options.r, options.r, 0, largeArc, sweep, end.x, end.y
            ];
        } else {
            var d = [
                "M", options.cx, options.cy,
                "L", start.x, start.y, 
                "A", options.r, options.r, 0, largeArc, sweep, end.x, end.y
            ];
        }

        if (options.array === true) {
            return d;
        } else {
            return d.join(" ");
        }
    };








    //
    // Gets a path that is usable by the SVG A path command
    //
    // @param object options The options/arg to the function
    //
    RG.SVG.TRIG.getArcPath3 = function (options)
    {
        // Make sure the args are numbers
        options.cx     = Number(options.cx);
        options.cy     = Number(options.cy);
        options.radius = Number(options.radius);
        options.start  = Number(options.start);
        options.end    = Number(options.end);

        //
        // Make circles start at the top instead of the right hand side
        //
        options.start -= (ma.PI / 2);
        options.end   -= (ma.PI / 2);

        var start = RG.SVG.TRIG.toCartesian({
            cx:    options.cx,
            cy:    options.cy,
            r:     options.r,
            angle: options.start
        });

        var end = RG.SVG.TRIG.toCartesian({
            cx:    options.cx,
            cy:    options.cy,
            r:     options.r,
            angle: options.end
        });

        var diff = ma.abs(options.end - options.start);

        // Initial values
        var largeArc = '0';
        var sweep    = '0';

        //TODO Put various options here for the correct combination of flags to use
        if (!options.anticlockwise) {
            if (diff > RG.SVG.TRIG.PI) {
                largeArc = '1';
                sweep    = '1';
            } else {
                largeArc = '0';
                sweep    = '1';
            }
        } else {
            if (diff > RG.SVG.TRIG.PI) {
                largeArc = '1';
                sweep    = '0';
            } else {
                largeArc = '0';
                sweep    = '0';
            }
        }

        if (typeof options.lineto === 'boolean' && options.lineto === false) {
            var d = [
                "M", start.x, start.y,
                "A", options.r, options.r, 0, largeArc, sweep, end.x, end.y
            ];
        } else {
            var d = [
                "L", start.x, start.y,
                "A", options.r, options.r, 0, largeArc, sweep, end.x, end.y
            ];
        }

        if (options.array === true) {
            return d;
        } else {
            return d.join(" ");
        }
    };








    /**
    * This function gets the end point (X/Y coordinates) of a given radius.
    * You pass it the center X/Y and the radius and this function will return
    * the endpoint X/Y coordinates.
    * 
    * @param number cx    The center X coord
    * @param number cy    The center Y coord
    * @param number r     The length of the radius
    * @param number angle The anle to use
    */
    RG.SVG.TRIG.getRadiusEndPoint = function (opt)
    {
        // Allow for two arguments style
        if (arguments.length === 1) {

            var angle = opt.angle,
                r     = opt.r;

        } else if (arguments.length === 4) {

            var angle = arguments[0],
                r     = arguments[1];
        }

        var x = ma.cos(angle) * r,
            y = ma.sin(angle) * r;

        return [x, y];
    };








    /**
    * This function draws the title. This function also draws the subtitle.
    */
    RG.SVG.drawTitle = function (obj)
    {
        var prop = obj.properties;

        // Work out the X cooordinate for the title and subtitle
        var x      = ((obj.width - prop.marginLeft - prop.marginRight) / 2) + prop.marginLeft,
            y      = prop.marginTop - 10,
            valign = 'bottom';

        // If theres key defined then move the title up
        if (!RG.SVG.isNull(obj.properties.key)) {
            y -= 20;
        }

        // If X axis is at the top then move the title up
        if (   typeof obj.properties.yaxisScaleMax === 'number'
            && obj.properties.yaxisScaleMax <= 0
            && obj.properties.yaxisScaleMin < obj.properties.yaxisScaleMax
           ) {
            valign = 'top';
            y = obj.height - obj.properties.marginBottom + 10;
        }

        // Custom X coordinate
        if (typeof prop.titleX === 'number') {
            x = prop.titleX;
        }

        // Custom Y coordinate
        if (typeof prop.titleY === 'number') {
            y = prop.titleY;
        }
        
        // Custom X coordinate
        if (typeof prop.titleOffsetx === 'number') {
            x += prop.titleOffsetx;
        }

        // Custom Y coordinate
        if (typeof prop.titleOffsety === 'number') {
            y += prop.titleOffsety;
        }

        // Move the Y cood up if thers a subtitle
        if (typeof prop.titleSubtitle === 'string' || typeof prop.titleSubtitle === 'number') {
            var titleSubtitleDim = RG.SVG.measureText({
                bold:   prop.titleSubtitleBold,
                italic: prop.titleSubtitleItalic,
                size:   prop.titleSubtitleSize,
                font:   prop.titleSubtitleFont,
                text:   'Mg'
            });
            
            y -= titleSubtitleDim[1];
        }



        // Draw the title
        if (prop.title) {
            RG.SVG.text({
                object: obj,
                svg:    obj.svg,
                parent: obj.svg.all,
                tag:    'title',
                text:   prop.title.toString(),
                x:      x,
                y:      y,
                halign: prop.titleHalign || 'center',
                valign: valign,
                color:  prop.titleColor  || prop.textColor,
                size:   typeof prop.titleSize === 'number' ? prop.titleSize : prop.textSize + 4,
                bold:   typeof prop.titleBold === 'boolean' ? prop.titleBold : prop.textBold,
                italic: typeof prop.titleItalic === 'boolean' ? prop.titleItalic : prop.textItalic,
                font:   prop.titleFont || prop.textFont
            });
        }




        // Draw the subtitle if there's one defined
        if (
               (typeof prop.title === 'string' || typeof prop.title === 'number')
            && (typeof prop.titleSubtitle === 'string' || typeof prop.titleSubtitle === 'number')
           ) {

            RG.SVG.text({
                object: obj,
                svg:    obj.svg,
                parent: obj.svg.all,
                tag:    'subtitle',
                text:   prop.titleSubtitle,
                x:      x,
                y:      y + 5,
                halign: prop.titleHalign || 'center',
                valign: 'top',
                size:   typeof prop.titleSubtitleSize === 'number' ? prop.titleSubtitleSize : prop.textSize - 2,
                color:  prop.titleSubtitleColor || prop.textColor,
                bold:   typeof prop.titleSubtitleBold === 'boolean' ? prop.titleSubtitleBold : prop.textBold,
                italic: typeof prop.titleSubtitleItalic === 'boolean' ? prop.titleSubtitleItalic : prop.textItalic,
                font:   prop.titleSubtitleFont || prop.textFont
            });
        }
    };








    /**
    * Removes white-space from the start and end of a string
    * 
    * @param string str The string to trim
    */
    RG.SVG.trim = function (str)
    {
        return RG.SVG.ltrim(RG.SVG.rtrim(str));
    };








    /**
    * Trims the white-space from the start of a string
    * 
    * @param string str The string to trim
    */
    RG.SVG.ltrim = function (str)
    {
        return String(str).replace(/^(\s|\0)+/, '');
    };








    /**
    * Trims the white-space off of the end of a string
    * 
    * @param string str The string to trim
    */
    RG.SVG.rtrim = function (str)
    {
        return String(str).replace(/(\s|\0)+$/, '');
    };








    /**
    * This parses a single color value
    */
    RG.SVG.parseColorLinear = function (opt)
    {
        var obj   = opt.object,
            color = opt.color;

        if (!color || typeof color !== 'string') {
            return color;
        }

        if (color.match(/^gradient\((.*)\)$/i)) {
            
            var parts = RegExp.$1.split(':'),
                diff  = 1 / (parts.length - 1);

            if (opt && opt.direction && opt.direction === 'horizontal') {
                var grad = RG.SVG.create({
                    type: 'linearGradient',
                    parent: obj.svg.defs,
                    attr: {
                        id: 'RGraph-linear-gradient-' + obj.uid + '-' + obj.gradientCounter,
                        x1: opt.start || 0,
                        x2: opt.end || '100%',
                        y1: 0,
                        y2: 0,
                        gradientUnits: opt.gradientUnits || "userSpaceOnUse"
                    }
                });

            } else {

                var grad = RG.SVG.create({
                    type: 'linearGradient',
                    parent: obj.svg.defs,
                    attr: {
                        id: 'RGraph-linear-gradient-' + obj.uid + '-' + obj.gradientCounter,
                        x1: 0,
                        x2: 0,
                        y1: opt.start || 0,
                        y2: opt.end || '100%',
                        gradientUnits: opt.gradientUnits || "userSpaceOnUse"
                    }
                });
            }

            // Add the first color stop
            var stop = RG.SVG.create({
                type: 'stop',
                parent: grad,
                attr: {
                    offset: '0%',
                    'stop-color': RG.SVG.trim(parts[0])
                }
            });

            // Add the rest of the color stops
            for (var j=1,len=parts.length; j<len; ++j) {
                
                RG.SVG.create({
                    type: 'stop',
                    parent: grad,
                    attr: {
                        offset: (j * diff * 100) + '%',
                        'stop-color': RG.SVG.trim(parts[j])
                    }
                });
            }
        }
        
        color = grad ? 'url(#RGraph-linear-gradient-' + obj.uid + '-' + (obj.gradientCounter++) + ')' : color;

        return color;
    };








    /**
    * This parses a single color value
    */
    RG.SVG.parseColorRadial = function (opt)
    {
        var obj   = opt.object,
            color = opt.color;

        if (!color || typeof color !== 'string') {
            return color;
        }

        if (color.match(/^gradient\((.*)\)$/i)) {

            var parts = RegExp.$1.split(':'),
                diff  = 1 / (parts.length - 1);


            var grad = RG.SVG.create({
                type: 'radialGradient',
                parent: obj.svg.defs,
                attr: {
                    id: 'RGraph-radial-gradient-' + obj.uid + '-' + obj.gradientCounter,
                    gradientUnits: opt.gradientUnits || 'userSpaceOnUse',
                    cx: opt.cx || obj.centerx,
                    cy: opt.cy || obj.centery,
                    fx: opt.fx || obj.centerx,
                    fy: opt.fy || obj.centery,
                    r:  opt.r  || obj.radius
                }
            });

            // Add the first color stop
            var stop = RG.SVG.create({
                type: 'stop',
                parent: grad,
                attr: {
                    offset: '0%',
                    'stop-color': RG.SVG.trim(parts[0])
                }
            });

            // Add the rest of the color stops
            for (var j=1,len=parts.length; j<len; ++j) {
                
                RG.SVG.create({
                    type: 'stop',
                    parent: grad,
                    attr: {
                        offset: (j * diff * 100) + '%',
                        'stop-color': RG.SVG.trim(parts[j])
                    }
                });
            }
        }
        
        color = grad ? 'url(#RGraph-radial-gradient-' + obj.uid + '-' + (obj.gradientCounter++) + ')' : color;

        return color;
    };








    /**
    * Reset all of the color values to their original values
    * 
    * @param object
    */
    RG.SVG.resetColorsToOriginalValues = function (opt)
    {
        var obj = opt.object;

        if (obj.originalColors) {
            // Reset the colors to their original values
            for (var j in obj.originalColors) {
                if (typeof j === 'string') {
                    obj.properties[j] = RG.SVG.arrayClone(obj.originalColors[j]);
                }
            }
        }

        /**
        * If the function is present on the object to reset specific
        * colors - use that
        */
        if (typeof obj.resetColorsToOriginalValues === 'function') {
            obj.resetColorsToOriginalValues();
        }

        // Hmmm... Should this be necessary? I don't think it will
        // do any harm to leave it in.
        obj.originalColors = {};



        // Reset the colorsParsed flag so that they're parsed for gradients again
        obj.colorsParsed = false;
        
        // Reset the gradient counter
        obj.gradientCounter = 1;
    };








    //
    // Clear the SVG tag by deleting all of its
    // child nodes
    //
    // @param object svg The SVG tag (same as what is returned
    //                   by document.getElementById() )
    //
    RG.SVG.clear = function (svg)
    {
        // Clear all the layer nodes
        for (var i=1; i<=100; ++i) {
            if (svg['background' + i]) {
                
                // Clear all the nodes within this group
                while (svg['background' + i].lastChild) {
                    svg['background' + i].removeChild(svg['background' + i].lastChild);
                }
            } else {
                break;
            }
        }

        // Clear all the node within the "all" group
        while (svg.all.lastChild) {
            svg.all.removeChild(svg.all.lastChild);
        }
        
        // Clear Line chart hotspots
        if (svg.all.line_tooltip_hotspots) {
            while (svg.all.line_tooltip_hotspots.lastChild) {
                svg.all.line_tooltip_hotspots.removeChild(svg.all.line_tooltip_hotspots.lastChild);
            }
        }
    };








    /**
    * Adds an event listener
    * 
    * @param object obj   The graph object
    * @param string event The name of the event, eg ontooltip
    * @param object func  The callback function
    */
    RG.SVG.addCustomEventListener = function (obj, name, func)
    {
        // Initialise the events array if necessary
        if (typeof RG.SVG.events[obj.uid] === 'undefined') {
            RG.SVG.events[obj.uid] = [];
        }
        
        // Prepend "on" if necessary
        if (name.substr(0, 2) !== 'on') {
            name = 'on' + name;
        }

        RG.SVG.events[obj.uid].push({
            object: obj,
            event:  name,
            func:   func
        });

        return RG.SVG.events[obj.uid].length - 1;
    };








    /**
    * Used to fire one of the RGraph custom events
    * 
    * @param object obj   The graph object that fires the event
    * @param string event The name of the event to fire
    */
    RG.SVG.fireCustomEvent = function (obj, name)
    {
        if (obj && obj.isRGraph) {
            
            var uid = obj.uid;

            if (   typeof uid === 'string'
                && typeof RG.SVG.events === 'object'
                && typeof RG.SVG.events[uid] === 'object'
                && RG.SVG.events[uid].length > 0) {

                for(var j=0,len=RG.SVG.events[uid].length; j<len; ++j) {
                    if (RG.SVG.events[uid][j] && RG.SVG.events[uid][j].event === name) {
                        RG.SVG.events[uid][j].func(obj);
                    }
                }
            }
        }
    };








    /**
    * Clears all the custom event listeners that have been registered
    * 
    * @param string optional Limits the clearing to this object UID
    */
    RG.SVG.removeAllCustomEventListeners = function ()
    {
        var uid = arguments[0];

        if (uid && RG.SVG.events[uid]) {
            RG.SVG.events[uid] = {};
        } else {
            RG.SVG.events = [];
        }
    };








    /**
    * Clears a particular custom event listener
    * 
    * @param object obj The graph object
    * @param number i   This is the index that is return by .addCustomEventListener()
    */
    RG.SVG.removeCustomEventListener = function (obj, i)
    {
        if (   typeof RG.SVG.events === 'object'
            && typeof RG.SVG.events[obj.uid] === 'object'
            && typeof RG.SVG.events[obj.uid][i] === 'object') {
            
            RG.SVG.events[obj.uid][i] = null;
        }
    };








    //
    // Removes the highlight from the chart added by tooltips (possibly others too)
    //
    RG.SVG.removeHighlight = function (obj)
    {
        var highlight = RG.SVG.REG.get('highlight');

        if (highlight && RG.SVG.isArray(highlight) && highlight.length) {
            for (var i=0,len=highlight.length; i<len; ++i) {
                if (highlight[i].parentNode) {
                    //obj.svg.removeChild(highlight[i]);
                    highlight[i].parentNode.removeChild(highlight[i]);
                }
            }
        } else if (highlight && highlight.parentNode) {
            if (obj.type === 'scatter') {
                highlight.setAttribute('fill', 'transparent');
            } else {
                highlight.parentNode.removeChild(highlight);
            }
        }
    };








    //
    // Removes the highlight from the chart added by tooltips (possibly others too)
    //
    RG.SVG.redraw = function ()
    {
        if (arguments.length === 1) {

            var svg = arguments[0];

            RG.SVG.clear(svg);

            var objects = RG.SVG.OR.get('id:' + svg.parentNode.id);

            for (var i=0,len=objects.length; i<len; ++i) {

                // Reset the colors to the original values
                RG.SVG.resetColorsToOriginalValues({object: objects[i]});

                objects[i].draw();
            }
        } else {

            var tags = RG.SVG.OR.tags();

            for (var i in tags) {
                RG.SVG.redraw(tags[i]);
            }
        }
    };








    //
    // A better, more flexible, date parsing function
    //
    //@param  string str The string to parse
    //@return number     A number, as returned by Date.parse()
    //
    RG.SVG.parseDate = function (str)
    {
        var d = new Date();

        // Initialise the default values
        var defaults = {
            seconds: '00',
            minutes: '00',
              hours: '00',
               date: d.getDate(),
              month: d.getMonth() + 1,
               year: d.getFullYear()
        };

        // Create the months array for turning textual months back to numbers
        var months       = ['january','february','march','april','may','june','july','august','september','october','november','december'],
            months_regex = months.join('|');

        for (var i=0; i<months.length; ++i) {
            months[months[i]] = i;
            months[months[i].substring(0,3)] = i;
            months_regex = months_regex + '|' + months[i].substring(0,3);
        }

        // These are the seperators allowable for d/m/y and y/m/d dates
        // (Its part of a regexp so the position of the square brackets
        //  is crucial)
        var sep = '[-./_=+~#:;,]+';


        // Tokenise the string
        var tokens = str.split(/ +/);

        // Loop through each token checking what it is
        for (var i=0,len=tokens.length; i<len; ++i) {
            if (tokens[i]) {
                
                // Year
                if (tokens[i].match(/^\d\d\d\d$/)) {
                    defaults.year = tokens[i];
                }

                // Month
                var res = isMonth(tokens[i]);
                if (typeof res === 'number') {
                    defaults.month = res + 1; // Months are zero indexed
                }

                // Date
                if (tokens[i].match(/^\d?\d(?:st|nd|rd|th)?$/)) {
                    defaults.date = parseInt(tokens[i]);
                }

                // Time
                if (tokens[i].match(/^(\d\d):(\d\d):?(?:(\d\d))?$/)) {
                    defaults.hours   = parseInt(RegExp.$1);
                    defaults.minutes = parseInt(RegExp.$2);
                    
                    if (RegExp.$3) {
                        defaults.seconds = parseInt(RegExp.$3);
                    }
                }

                // Dateformat: XXXX-XX-XX
                if (tokens[i].match(new RegExp('^(\\d\\d\\d\\d)' + sep + '(\\d\\d)' + sep + '(\\d\\d)$', 'i'))) {
                    defaults.date  = parseInt(RegExp.$3);
                    defaults.month = parseInt(RegExp.$2);
                    defaults.year  = parseInt(RegExp.$1);

                }

                // Dateformat: XX-XX-XXXX
                if (tokens[i].match(new RegExp('^(\\d\\d)' + sep + '(\\d\\d)' + sep + '(\\d\\d\\d\\d)$','i') )) {
                    defaults.date  = parseInt(RegExp.$1);
                    defaults.month = parseInt(RegExp.$2);
                    defaults.year  = parseInt(RegExp.$3);
                }
            }
        }

        // Now put the defaults into a format thats recognised by Date.parse()
        str = '{1}/{2}/{3} {4}:{5}:{6}'.format(
            defaults.year,
            String(defaults.month).length     === 1 ? '0' + (defaults.month) : defaults.month,
            String(defaults.date).length      === 1 ? '0' + (defaults.date)      : defaults.date,
            String(defaults.hours).length     === 1 ? '0' + (defaults.hours)     : defaults.hours,
            String(defaults.minutes).length   === 1 ? '0' + (defaults.minutes)   : defaults.minutes,
            String(defaults.seconds).length   === 1 ? '0' + (defaults.seconds)   : defaults.seconds
        );

        return Date.parse(str);

        //
        // Support functions
        //
        function isMonth(str)
        {
            var res = str.toLowerCase().match(months_regex);

            return res ? months[res[0]] : false;
        }
    };








    // The ObjectRegistry add function
    RG.SVG.OR.add = function (obj)
    {
        RG.SVG.OR.objects.push(obj);

        return obj;
    };








    // The ObjectRegistry function that returns all of the objects. Th argument
    // can aither be:
    //
    // o omitted  All of the registered objects are returned
    // o id:XXX  All of the objects on that SVG tag are returned
    // o type:XXX All the objects of that type are returned
    //
    RG.SVG.OR.get = function ()
    {
        // Fetch objects that are on a particular SVG tag
        if (typeof arguments[0] === 'string' && arguments[0].substr(0, 3).toLowerCase() === 'id:') {
            
            var ret = [];

            for (var i=0; i<RG.SVG.OR.objects.length; ++i) {
                if (RG.SVG.OR.objects[i].id === arguments[0].substr(3)) {
                    ret.push(RG.SVG.OR.objects[i]);
                }
            }

            return ret;
        }


        // Fetch objects that are of a particular type
        //
        // TODO Allow multiple types to be specified
        if (typeof arguments[0] === 'string' && arguments[0].substr(0, 4).toLowerCase() === 'type') {
            
            var ret = [];
            
            for (var i=0; i<RG.SVG.OR.objects.length; ++i) {
                if (RG.SVG.OR.objects[i].type === arguments[0].substr(5)) {
                    ret.push(RG.SVG.OR.objects[i]);
                }
            }
            
            return ret;
        }


        // Fetch an object that has a specific UID
        if (typeof arguments[0] === 'string' && arguments[0].substr(0, 3).toLowerCase() === 'uid') {
            
            var ret = [];
            
            for (var i=0; i<RG.SVG.OR.objects.length; ++i) {
                if (RG.SVG.OR.objects[i].uid === arguments[0].substr(4)) {
                    ret.push(RG.SVG.OR.objects[i]);
                }
            }
            
            return ret;
        }

        return RG.SVG.OR.objects;
    };








    // The ObjectRegistry function that returns all of the registeredt SVG tags
    //
    RG.SVG.OR.tags = function ()
    {
        var tags = [];

        for (var i=0; i<RG.SVG.OR.objects.length; ++i) {
            if (!tags[RG.SVG.OR.objects[i].svg.parentNode.id]) {
                tags[RG.SVG.OR.objects[i].svg.parentNode.id] = RG.SVG.OR.objects[i].svg;
            }
        }

        return tags;
    };








    //
    // This function returns a two element array of the SVG x/y position in
    // relation to the page
    // 
    // @param object svg
    //
    RG.SVG.getSVGXY = function (svg)
    {
        var x  = 0,
            y  = 0,
            el = svg.parentNode; // !!!

        do {

            x += el.offsetLeft;
            y += el.offsetTop;

            // Account for tables in webkit
            if (el.tagName.toLowerCase() == 'table' && (RG.SVG.ISCHROME || RG.SVG.ISSAFARI)) {
                x += parseInt(el.border) || 0;
                y += parseInt(el.border) || 0;
            }

            el = el.offsetParent;

        } while (el && el.tagName && el.tagName.toLowerCase() != 'body');


        var paddingLeft = svg.style.paddingLeft ? parseInt(svg.style.paddingLeft) : 0,
            paddingTop  = svg.style.paddingTop ? parseInt(svg.style.paddingTop) : 0,
            borderLeft  = svg.style.borderLeftWidth ? parseInt(svg.style.borderLeftWidth) : 0,
            borderTop   = svg.style.borderTopWidth  ? parseInt(svg.style.borderTopWidth) : 0;

        if (navigator.userAgent.indexOf('Firefox') > 0) {
            x += parseInt(document.body.style.borderLeftWidth) || 0;
            y += parseInt(document.body.style.borderTopWidth) || 0;
        }

        return [x + paddingLeft + borderLeft, y + paddingTop + borderTop];
    };








    //
    // This function is a compatibility wrapper around
    // the requestAnimationFrame function.
    //
    // @param function func The function to give to the
    //                      requestAnimationFrame function
    //
    RG.SVG.FX.update = function (func)
    {
        win.requestAnimationFrame =
            win.requestAnimationFrame ||
            win.webkitRequestAnimationFrame ||
            win.msRequestAnimationFrame ||
            win.mozRequestAnimationFrame ||
            (function (func){setTimeout(func, 16.666);});
        
        win.requestAnimationFrame(func);
    };








    /**
    * This function returns an easing multiplier for effects so they eas out towards the
    * end of the effect.
    * 
    * @param number frames The total number of frames
    * @param number frame  The frame number
    */
    RG.SVG.FX.getEasingMultiplier = function (frames, frame)
    {
        var multiplier = ma.pow(ma.sin((frame / frames) * RG.SVG.TRIG.HALFPI), 3);

        return multiplier;
    };








    /**
    * Measures text by creating a DIV in the document and adding the relevant
    * text to it, then checking the .offsetWidth and .offsetHeight.
    * 
    * @param  object opt An object containing the following:
    *                        o text( string) The text to measure
    *                        o bold (bool)   Whether the text is bold or not
    *                        o font (string) The font to use
    *                        o size (number) The size of the text (in pts)
    * 
    * @return array         A two element array of the width and height of the text
    */
    RG.SVG.measureText = function (opt)
    {
        //text, bold, font, size
        var text   = opt.text   || '',
            bold   = opt.bold   || false,
            italic = opt.italic || false,
            font   = opt.font   || 'sans-serif',
            size   = opt.size   || 12,
            str    = text + ':' + italic + ':' + bold + ':' + font + ':' + size;

        // Add the sizes to the cache as adding DOM elements is costly and causes slow downs
        if (typeof RG.SVG.measuretext_cache === 'undefined') {
            RG.SVG.measuretext_cache = [];
        }

        if (typeof RG.SVG.measuretext_cache == 'object' && RG.SVG.measuretext_cache[str]) {
            return RG.SVG.measuretext_cache[str];
        }
        
        if (!RG.SVG.measuretext_cache['text-span']) {
            var span = document.createElement('SPAN');
                span.style.position = 'absolute';
                span.style.padding    = 0;
                span.style.display    = 'inline';
                span.style.top        = '-200px';
                span.style.left       = '-200px';
                span.style.lineHeight = '1em';
            document.body.appendChild(span);
            
            // Now store the newly created DIV
            RG.SVG.measuretext_cache['text-span'] = span;

        } else if (RG.SVG.measuretext_cache['text-span']) {
            var span = RG.SVG.measuretext_cache['text-span'];
        }

        span.innerHTML        = text.replace(/\r?\n/g, '<br />');
        span.style.fontFamily = font;
        span.style.fontWeight = bold ? 'bold' : 'normal';
        span.style.fontStyle  = italic ? 'italic' : 'normal';
        span.style.fontSize   = String(size).replace(/pt$/, '') + 'pt';

        var sizes = [span.offsetWidth, span.offsetHeight];

        //document.body.removeChild(span);
        RG.SVG.measuretext_cache[str] = sizes;

        return sizes;
    };








    /**
    * This function converts an array of strings to an array of numbers. Its used by the meter/gauge
    * style charts so that if you want you can pass in a string. It supports various formats:
    * 
    * '45.2'
    * '-45.2'
    * ['45.2']
    * ['-45.2']
    * '45.2,45.2,45.2' // A CSV style string
    * 
    * @param number frames The string or array to parse
    */
    RG.SVG.stringsToNumbers = function (str)
    {
        // An optional seperator to use intead of a comma
        var sep = arguments[1] || ',';
        
        
        // If it's already a number just return it
        if (typeof str === 'number') {
            return str;
        }





        if (typeof str === 'string') {
            if (str.indexOf(sep) != -1) {
                str = str.split(sep);
            } else {
                str = parseFloat(str);
            }
        }





        if (typeof str === 'object') {
            for (var i=0,len=str.length; i<len; i+=1) {
                str[i] = parseFloat(str[i]);
            }
        }

        return str;
    };








    // This function allows for numbers that are given as a +/- adjustment
    RG.SVG.getAdjustedNumber = function (opt)
    {
        var value = opt.value,
            prop  = opt.prop;
    
        if (typeof prop === 'string' && match(/^(\+|-)([0-9.]+)/)) {
            if (RegExp.$1 === '+') {
                value += parseFloat(RegExp.$2);
            } else if (RegExp.$1 === '-') {
                value -= parseFloat(RegExp.$2);
            }
        }
        
        return value;
    };








    // NOT USED ANY MORE
    RG.SVG.attribution=function(){return;};








    /**
    * Parse a gradient and returns the various parts
    * 
    * @param string str The gradient string
    */
    RG.SVG.parseGradient = function (str)
    {
    };








    /**
    * Generates a random number between the minimum and maximum
    * 
    * @param number min The minimum value
    * @param number max The maximum value
    * @param number     OPTIONAL Number of decimal places
    */
    RG.SVG.random = function (opt)
    {
        var min = opt.min,
            max = opt.max,
            dp  = opt.dp || opt.decimals || 0,
            r   = ma.random();

        return Number((((max - min) * r) + min).toFixed(dp));
    };








    /**
    * Fill an array full of random numbers
    */
    RG.SVG.arrayRand    =
    RG.SVG.arrayRandom  =
    RG.SVG.random.array = function (opt)
    {
        var num = opt.num,
            min = opt.min,
            max = opt.max,
            dp  = opt.dp || opt.decimals || 0;

        for(var i=0,arr=[]; i<num; i+=1) {
            arr.push(RG.SVG.random({min: min, max: max, dp: dp}));
        }
        
        return arr;
    };








    //
    // This function is called by each objects setter so that common BC
    // and adjustments are centralised. And there's less typing for me too.
    //
    // @param object opt An object of options to the function, which are:
    //                    object: The chart object
    //                    name:   The name of the config parameter
    //                    value:  The value thats being set
    //
    RG.SVG.commonSetter = function (opt)
    {
        var obj   = opt.object,
            name  = opt.name,
            value = opt.value;

        // The default event for tooltips is click
        if (name === 'tooltipsEvent'&& value !== 'click' && value !== 'mousemove') {
            value = 'click';
        }

        return {
            name:  name,
            value: value
        };
    };








    //
    // Generates logs for... log charts
    //
    // @param object opt The options:
    //                     o num  The number
    //                     o base The base
    //
    RG.SVG.log = function (opt)
    {
        var num  = opt.num,
            base = opt.base;

        return ma.log(num) / (base ? ma.log(base) : 1);
    };








    RG.SVG.donut = function (opt)
    {
        var arcPath1 = RG.SVG.TRIG.getArcPath3({
            cx: opt.cx,
            cy: opt.cy,
            r: opt.outerRadius,
            start: 0,
            end: RG.SVG.TRIG.TWOPI,
            anticlockwise: false,
            lineto: false
        });

        var arcPath2 = RG.SVG.TRIG.getArcPath3({
            cx: opt.cx,
            cy: opt.cy,
            r: opt.innerRadius,
            start: RG.SVG.TRIG.TWOPI,
            end: 0,
            anticlockwise: true,
            lineto: false
        });

        //
        // Create the red circle
        //
        var path = RG.SVG.create({
            svg: opt.svg,
            type: 'path',
            attr: {
                d: arcPath1 + arcPath2,
                stroke: opt.stroke,
                fill: opt.fill
            }
        });
        
        return path;
    };








    //
    // Copy the globals (if any have been set) from the global object to
    // this instances configuration
    //
    RG.SVG.getGlobals = function (obj)
    {
        var prop = obj.properties;
        
        for (i in RG.SVG.GLOBALS) {
            if (typeof i === 'string') {
                obj.set(i, RG.SVG.arrayClone(RG.SVG.GLOBALS[i]));
            }
        }
    };








    //
    // This function adds a link to the SVG document
    //
    // @param object opt The various options to the function
    //
    RG.SVG.link = function (opt)
    {
        var a = RGraph.SVG.create({
            svg: bar.svg,
            type: 'a',
            parent: bar.svg.all,
            attr: {
                'xlink:href': href,
                target:       target
            }
        });
        
        var text = RGraph.SVG.create({
            svg: bar.svg,
            type: 'text',
            parent: a,
            attr: {
                x: x,
                y: y,
                fill: fill
            }
        });
        
        text.innerHTML = text;
    };








    // This function is used to get the errorbar MAXIMUM value. Its in the common
    // file because it's used by multiple chart libraries
    //
    // @param object opt An object containing the arguments to the function
    //         o object: The chart object
    //         o index:  The index to fetch
    RG.SVG.getErrorbarsMaxValue = function (opt)
    {
        var obj   = opt.object,
            prop  = obj.properties,
            index = opt.index;

        if (typeof prop.errorbars === 'object' && !RG.SVG.isNull(prop.errorbars) && typeof prop.errorbars[index] === 'number') {
            var value = prop.errorbars[index];
        } else if (   typeof prop.errorbars === 'object'
                   && !RG.SVG.isNull(prop.errorbars)
                   && typeof prop.errorbars[index] === 'object'
                   && !RG.SVG.isNull(prop.errorbars[index])
                   && typeof prop.errorbars[index].max === 'number'
                  ) {
            var value = prop.errorbars[index].max;
        } else {
            var value = 0;
        }
        
        return value;
    };








    // This function is used to get the errorbar MINIMUM value. Its in the common
    // file because it's used by multiple chart libraries
    //
    // @param object opt An object containing the arguments to the function
    //         o object: The chart object
    //         o index:  The index to fetch
    RG.SVG.getErrorbarsMinValue = function (opt)
    {
        var obj   = opt.object,
            prop  = obj.properties,
            index = opt.index;

        if (   typeof prop.errorbars === 'object'
            && !RG.SVG.isNull(prop.errorbars)
            && typeof prop.errorbars[index] === 'object'
            && !RG.SVG.isNull(prop.errorbars[index])
            && typeof prop.errorbars[index].min === 'number'
           ) {
            var value = prop.errorbars[index].min;
        } else {
            var value = null;
        }
        
        return value;
    };








    // This function is used to get the errorbar color. Its in the common
    // file because it's used by multiple chart libraries
    //
    // @param object opt An object containing the arguments to the function
    //         o object: The chart object
    //         o index:  The index to fetch
    RG.SVG.getErrorbarsColor = function (opt)
    {
        var obj   = opt.object,
            prop  = obj.properties,
            index = opt.index;

        var color = prop.errorbarsColor || 'black';

        if (typeof prop.errorbars === 'object' && !RG.SVG.isNull(prop.errorbars) && typeof prop.errorbars[index] === 'object' && !RG.SVG.isNull(prop.errorbars[index]) && typeof prop.errorbars[index].color === 'string') {
            color = prop.errorbars[index].color;
        }
        
        return color;
    };








    // This function is used to get the errorbar linewidth. Its in the common
    // file because it's used by multiple chart libraries
    //
    // @param object opt An object containing the arguments to the function
    //         o object: The chart object
    //         o index:  The index to fetch
    RG.SVG.getErrorbarsLinewidth = function (opt)
    {
        var obj   = opt.object,
            prop  = obj.properties,
            index = opt.index;

        var linewidth = prop.errorbarsLinewidth || 1

        if (typeof prop.errorbars === 'object' && !RG.SVG.isNull(prop.errorbars) && typeof prop.errorbars[index] === 'object' && !RG.SVG.isNull(prop.errorbars[index]) && typeof prop.errorbars[index].linewidth === 'number') {
            linewidth = prop.errorbars[index].linewidth;
        }

        return linewidth;
    };








    // This function is used to get the errorbar capWidth. Its in the common
    // file because it's used by multiple chart libraries
    //
    // @param object opt An object containing the arguments to the function
    //         o object: The chart object
    //         o index:  The index to fetch
    RG.SVG.getErrorbarsCapWidth = function (opt)
    {
        var obj   = opt.object,
            prop  = obj.properties,
            index = opt.index;

        var capwidth = prop.errorbarsCapwidth || 10

        if (   typeof prop.errorbars === 'object'
            && !RG.SVG.isNull(prop.errorbars)
            && typeof prop.errorbars[index] === 'object'
            && !RG.SVG.isNull(prop.errorbars[index])
            && typeof prop.errorbars[index].capwidth === 'number'
            ) {

            capwidth = prop.errorbars[index].capwidth;
        }

        return capwidth;
    };








    // Allows the conversion of older names and values to newer
    // ones.
    //
    // *** When adding this to a new chart library there needs to be
    // *** two changes done:
    // ***  o Add the list of aliases as a object variable (eg this.aliases = {}; )
    // ***  o The bit that goes in the setter that calls the
    // ***    RG.propertyNameAlias() function - copy this from the Bar chart object
    //
    RG.SVG.propertyNameAlias = function (opt)
    {
        var obj = opt.object;

        if (typeof obj.propertyNameAliases[opt.name] === 'string') {
            return {
                name:  obj.propertyNameAliases[opt.name],
                value: opt.value
            };
        } else if (typeof obj.propertyNameAliases[opt.name] === 'function') {
            var tmp = (obj.propertyNameAliases[opt.name])(opt);

            return {
                name:  tmp.name,
                value: tmp.value
            };
        }
        
        // Default response - return the name/value unchanged
        return {
            name:  opt.name,
            value: opt.value
        };
    };















    //
    // This is here so that if the tooltip library has not
    // been included, this function will show an alert
    //informing the user
    //
    if (typeof RG.SVG.tooltip !== 'function') {
        RG.SVG.tooltip = function ()
        {
            $a('The tooltip library has not been included!');
        };
    }








// End module pattern
})(window, document);








/**
* Loosly mimicks the PHP function print_r();
*/
window.$p = function (obj)
{
    var indent = (arguments[2] ? arguments[2] : '    ');
    var str    = '';

    var counter = typeof arguments[3] == 'number' ? arguments[3] : 0;
    
    if (counter >= 5) {
        return '';
    }
    
    switch (typeof obj) {
        
        case 'string':    str += obj + ' (' + (typeof obj) + ', ' + obj.length + ')'; break;
        case 'number':    str += obj + ' (' + (typeof obj) + ')'; break;
        case 'boolean':   str += obj + ' (' + (typeof obj) + ')'; break;
        case 'function':  str += 'function () {}'; break;
        case 'undefined': str += 'undefined'; break;
        case 'null':      str += 'null'; break;
        
        case 'object':
            // In case of null
            if (RGraph.SVG.isNull(obj)) {
                str += indent + 'null\n';
            } else {
                str += indent + 'Object {' + '\n'
                for (j in obj) {
                    str += indent + '    ' + j + ' => ' + window.$p(obj[j], true, indent + '    ', counter + 1) + '\n';
                }
                str += indent + '}';
            }
            break;
        
        
        default:
            str += 'Unknown type: ' + typeof obj + '';
            break;
    }


    /**
    * Finished, now either return if we're in a recursed call, or alert()
    * if we're not.
    */
    if (!arguments[1]) {
        alert(str);
    }
    
    return str;
};







/**
* A shorthand for the default alert() function
*/
window.$a = function (v)
{
    alert(v);
};








/**
* Short-hand for console.log
* 
* @param mixed v The variable to log to the console
*/
window.$cl = function (v)
{
    return console.log(v);
};








/**
* A basic string formatting function. Use it like this:
* 
* var str = '{1} {2} {3}'.format('a', 'b', 'c');
* 
* Outputs: a b c
*/
if (!String.prototype.format) {
  String.prototype.format = function()
  {
    var args = arguments;

    return this.replace(/{(\d+)}/g, function(str, idx)
    {
      return typeof args[idx - 1] !== 'undefined' ? args[idx - 1] : str;
    });
  };
}
this.LeaferIN = this.LeaferIN || {};
this.LeaferIN.flow = (function (exports, draw) {
    'use strict';

    const { M, L, C, Q, Z, N, D, X, G, F, O, P, U } = draw.PathCommandMap;
    const PathScaler = {
        scale(data, scaleX, scaleY) {
            if (!data)
                return;
            let command;
            let i = 0, len = data.length;
            while (i < len) {
                command = data[i];
                switch (command) {
                    case M:
                    case L:
                        scalePoints(data, scaleX, scaleY, i, 1);
                        i += 3;
                        break;
                    case C:
                        scalePoints(data, scaleX, scaleY, i, 3);
                        i += 7;
                        break;
                    case Q:
                        scalePoints(data, scaleX, scaleY, i, 2);
                        i += 5;
                        break;
                    case Z:
                        i += 1;
                        break;
                    case N:
                        scalePoints(data, scaleX, scaleY, i, 2);
                        i += 5;
                        break;
                    case D:
                        scalePoints(data, scaleX, scaleY, i, 2);
                        i += 9;
                        break;
                    case X:
                        scalePoints(data, scaleX, scaleY, i, 2);
                        i += 6;
                        break;
                    case G:
                        scalePoints(data, scaleX, scaleY, i, 2);
                        i += 9;
                        break;
                    case F:
                        scalePoints(data, scaleX, scaleY, i, 2);
                        i += 5;
                        break;
                    case O:
                        data[i] = G;
                        data.splice(i + 4, 0, data[i + 3], 0);
                        scalePoints(data, scaleX, scaleY, i, 2);
                        i += 7 + 2;
                        len += 2;
                        break;
                    case P:
                        data[i] = F;
                        data.splice(i + 4, 0, data[i + 3]);
                        scalePoints(data, scaleX, scaleY, i, 2);
                        i += 4 + 1;
                        len += 1;
                        break;
                    case U:
                        scalePoints(data, scaleX, scaleY, i, 2);
                        i += 6;
                        break;
                }
            }
        },
        scalePoints(data, scaleX, scaleY, start, pointCount) {
            for (let i = pointCount ? start + 1 : 0, end = pointCount ? i + pointCount * 2 : data.length; i < end; i += 2) {
                data[i] *= scaleX;
                data[i + 1] *= scaleY;
            }
        }
    };
    const { scalePoints } = PathScaler;

    const matrix = draw.MatrixHelper.get();
    const { topLeft, top, topRight, right, bottom, left } = draw.Direction9;
    function scaleResize(leaf, scaleX, scaleY) {
        if (leaf.pathInputed) {
            scaleResizePath(leaf, scaleX, scaleY);
        }
        else {
            if (scaleX !== 1)
                leaf.width *= scaleX;
            if (scaleY !== 1)
                leaf.height *= scaleY;
        }
    }
    function scaleResizeFontSize(leaf, scaleX, scaleY) {
        const { app } = leaf;
        const editor = app && app.editor;
        let fontScale = scaleX;
        if (editor.editing) {
            const layout = leaf.__layout;
            let { width, height } = layout.boxBounds;
            width *= scaleY - scaleX;
            height *= scaleX - scaleY;
            switch (editor.resizeDirection) {
                case top:
                case bottom:
                    fontScale = scaleY;
                    layout.affectScaleOrRotation ? leaf.moveInner(-width / 2, 0) : leaf.x -= width / 2;
                    break;
                case left:
                case right:
                    layout.affectScaleOrRotation ? leaf.moveInner(0, -height / 2) : leaf.y -= height / 2;
                    break;
                case topLeft:
                case topRight:
                    layout.affectScaleOrRotation ? leaf.moveInner(0, -height) : leaf.y -= height;
                    break;
            }
        }
        leaf.fontSize *= fontScale;
        const data = leaf.__;
        if (!data.__autoWidth)
            leaf.width *= fontScale;
        if (!data.__autoHeight)
            leaf.height *= fontScale;
    }
    function scaleResizePath(leaf, scaleX, scaleY) {
        PathScaler.scale(leaf.__.path, scaleX, scaleY);
        leaf.path = leaf.__.path;
    }
    function scaleResizePoints(leaf, scaleX, scaleY) {
        const { points } = leaf;
        typeof points[0] === 'object' ? points.forEach(p => { p.x *= scaleX, p.y *= scaleY; }) : PathScaler.scalePoints(points, scaleX, scaleY);
        leaf.points = points;
    }
    function scaleResizeGroup(group, scaleX, scaleY) {
        const { children } = group;
        for (let i = 0; i < children.length; i++) {
            matrix.a = scaleX;
            matrix.d = scaleY;
            children[i].transform(matrix, true);
        }
    }

    const leaf = draw.Leaf.prototype;
    leaf.scaleResize = function (scaleX, scaleY = scaleX, noResize) {
        const data = this;
        if (noResize || (data.editConfig && data.editConfig.editSize === 'scale')) {
            data.scaleX *= scaleX;
            data.scaleY *= scaleY;
        }
        else {
            if (scaleX < 0)
                data.scaleX *= -1, scaleX = -scaleX;
            if (scaleY < 0)
                data.scaleY *= -1, scaleY = -scaleY;
            this.__scaleResize(scaleX, scaleY);
        }
    };
    leaf.__scaleResize = function (scaleX, scaleY) {
        scaleResize(this, scaleX, scaleY);
    };
    leaf.resizeWidth = function (width) {
        const scale = width / this.getBounds('box', 'local').width;
        this.scaleOf(this.__layout.boxBounds, scale, this.__.lockRatio ? scale : 1, true);
    };
    leaf.resizeHeight = function (height) {
        const scale = height / this.getBounds('box', 'local').height;
        this.scaleOf(this.__layout.boxBounds, this.__.lockRatio ? scale : 1, scale, true);
    };
    draw.Text.prototype.__scaleResize = function (scaleX, scaleY) {
        if (this.__.resizeFontSize || (this.editConfig && this.editConfig.editSize === 'font-size')) {
            scaleResizeFontSize(this, scaleX, scaleY);
        }
        else {
            scaleResize(this, scaleX, scaleY);
        }
    };
    draw.Path.prototype.__scaleResize = function (scaleX, scaleY) {
        scaleResizePath(this, scaleX, scaleY);
    };
    draw.Line.prototype.__scaleResize = function (scaleX, scaleY) {
        if (this.pathInputed) {
            scaleResizePath(this, scaleX, scaleY);
        }
        else if (this.points) {
            scaleResizePoints(this, scaleX, scaleY);
        }
        else {
            this.width *= scaleX;
        }
    };
    draw.Polygon.prototype.__scaleResize = function (scaleX, scaleY) {
        if (this.pathInputed) {
            scaleResizePath(this, scaleX, scaleY);
        }
        else if (this.points) {
            scaleResizePoints(this, scaleX, scaleY);
        }
        else {
            scaleResize(this, scaleX, scaleY);
        }
    };
    draw.Group.prototype.__scaleResize = function (scaleX, scaleY) {
        scaleResizeGroup(this, scaleX, scaleY);
    };
    draw.Box.prototype.__scaleResize = function (scaleX, scaleY) {
        if (this.__.__autoSize && this.children.length) {
            scaleResizeGroup(this, scaleX, scaleY);
        }
        else {
            scaleResize(this, scaleX, scaleY);
            if (this.__.resizeChildren)
                scaleResizeGroup(this, scaleX, scaleY);
        }
    };

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise, SuppressedError, Symbol, Iterator */


    function __decorate(decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    }

    typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
    };

    class FlowData extends draw.BoxData {
    }

    exports.Flow = class Flow extends draw.Box {
        get __tag() { return 'Flow'; }
        constructor(data) {
            super(data);
            this.__hasAutoLayout = true;
        }
    };
    __decorate([
        draw.dataProcessor(FlowData)
    ], exports.Flow.prototype, "__", void 0);
    __decorate([
        draw.autoLayoutType('x')
    ], exports.Flow.prototype, "flow", void 0);
    exports.Flow = __decorate([
        draw.registerUI()
    ], exports.Flow);

    const point = {};
    const alignToInnerXMap = {
        'top-left': 'from',
        'top': 'center',
        'top-right': 'to',
        'right': 'to',
        'bottom-right': 'to',
        'bottom': 'center',
        'bottom-left': 'from',
        'left': 'from',
        'center': 'center',
        'baseline-left': 'from',
        'baseline-center': 'center',
        'baseline-right': 'to',
    };
    const alignToInnerYMap = {
        'top-left': 'from',
        'top': 'from',
        'top-right': 'from',
        'right': 'center',
        'bottom-right': 'to',
        'bottom': 'to',
        'bottom-left': 'to',
        'left': 'center',
        'center': 'center',
        'baseline-left': 'to',
        'baseline-center': 'to',
        'baseline-right': 'to',
    };
    function alignContent(box, content, align) {
        const data = box.__;
        const { contentBounds } = box.__layout;
        draw.AlignHelper.toPoint(align, content, contentBounds, point);
        content.x = data.__autoWidth ? contentBounds.x : point.x;
        content.y = data.__autoHeight ? contentBounds.y : point.y;
    }

    function align$1(box, data, contentAlign, innerXAlign) {
        alignContent(box, data, contentAlign);
        const { list } = data;
        if (list.length > 1) {
            if (!innerXAlign)
                innerXAlign = alignToInnerXMap[contentAlign];
            if (innerXAlign !== 'from') {
                let row;
                for (let i = 0, len = list.length; i < len; i++) {
                    row = list[i];
                    row.x = data.width - row.width;
                    if (innerXAlign === 'center')
                        row.x /= 2;
                }
            }
        }
    }

    const { move: move$3 } = draw.PointHelper;
    function layout$1(box, data, rowYAlign, reverse) {
        const { list } = data, reverseWrap = box.__.flowWrap === 'reverse';
        let row, { x, y } = data;
        for (let i = 0, len = list.length; i < len; i++) {
            row = list[reverseWrap ? len - 1 - i : i];
            layoutX(box, row, x, y, rowYAlign, reverse);
            y += row.height + data.gap;
        }
    }
    function layoutX(box, row, fromX, fromY, rowYAlign, reverse) {
        const { children } = box;
        let child, local, { x, start } = row, y = fromY;
        x += fromX;
        for (let j = 0, end = row.count; j < end; j++) {
            child = children[reverse ? start - j : start + j];
            if (child.__.inFlow && child.__.visible !== 0) {
                local = child.__flowBounds;
                if (rowYAlign !== 'from')
                    y = fromY + (row.height - local.height) / (rowYAlign === 'center' ? 2 : 1);
                move$3(child, x - local.x, y - local.y);
                x += local.width + row.gap;
            }
            else {
                end++;
            }
        }
    }

    function flowWrap(wrapData, data, wrapSide) {
        const otherSide = wrapSide === 'width' ? 'height' : 'width';
        wrapData[wrapSide] = Math.max(wrapData[wrapSide], data[wrapSide]);
        wrapData[otherSide] += wrapData.count ? data[otherSide] + wrapData.gap : data[otherSide];
        wrapData.list.push(data);
        wrapData.count++;
    }

    const p = {};
    function getParseData(box, isFlowX) {
        const { gap, flowAlign: align, flowWrap: wrap, __autoWidth, __autoHeight } = box.__;
        const needWrap = wrap && (isFlowX ? !__autoWidth : !__autoHeight);
        if (typeof gap === 'object') {
            p.xGap = gap.x || 0;
            p.yGap = gap.y || 0;
        }
        else {
            p.xGap = p.yGap = gap;
        }
        p.isAutoXGap = typeof p.xGap === 'string' && !__autoWidth;
        p.isAutoYGap = typeof p.yGap === 'string' && !__autoHeight;
        p.complex = needWrap || align !== 'top-left' || box.__hasGrow || p.isAutoXGap || p.isAutoYGap;
        p.wrap = needWrap;
        if (p.complex) {
            p.isFitXGap = p.xGap === 'fit' && !__autoWidth;
            p.isFitYGap = p.yGap === 'fit' && !__autoHeight;
            if (typeof align === 'object') {
                p.contentAlign = align.content || 'top-left';
                p.rowXAlign = align.x || 'from';
                p.rowYAlign = align.y || 'from';
            }
            else {
                p.contentAlign = align;
                p.rowXAlign = alignToInnerXMap[align];
                p.rowYAlign = alignToInnerYMap[align];
            }
        }
        return p;
    }
    function getDrawData(start, gap) {
        return { x: 0, y: 0, width: 0, height: 0, gap, start, count: 0, grow: 0 };
    }
    function getWrapDrawData() {
        return { x: 0, y: 0, width: 0, height: 0, gap: 0, count: 0, list: [] };
    }

    function autoGap(data, side, sideTotal, fit) {
        const { count } = data;
        if (count > 1 && (sideTotal > data[side] || fit)) {
            data.gap = (sideTotal - data[side]) / (count - 1);
            data[side] = sideTotal;
        }
    }

    function getItemBounds(child, itemBox) {
        return itemBox === 'box' ? child.__local : child.__layout.localStrokeBounds;
    }

    const { within: within$1 } = draw.MathHelper;
    function growX(box, row, width, reverse) {
        let child, grow, remainSpace, remainTotalSpace = 0, list = row.hasRangeSize && [], { grow: totalGrow, start } = row;
        const growSize = row.width < width ? (width - row.width) / totalGrow : 0, { children } = box;
        if (growSize)
            row.width = width;
        for (let j = 0, end = row.count; j < end; j++) {
            child = children[reverse ? start - j : start + j];
            if (child.__.inFlow && child.__.visible !== 0) {
                if (grow = child.__widthGrow) {
                    remainSpace = resizeWidth(child, child.__flowBounds, growSize * grow);
                    if (remainSpace) {
                        remainTotalSpace += remainSpace;
                        totalGrow -= grow;
                    }
                    else if (list) {
                        child.__.widthRange ? list.unshift(child) : list.push(child);
                    }
                }
            }
            else {
                end++;
            }
        }
        if (remainTotalSpace)
            assignRemainSpace$1(list, remainTotalSpace, totalGrow);
    }
    function assignRemainSpace$1(list, totalSpace, countGrow) {
        let grow, space, local, remain;
        list.forEach(child => {
            grow = child.__widthGrow;
            space = totalSpace / countGrow * grow;
            remain = resizeWidth(child, local = child.__flowBounds, local.width + space);
            totalSpace -= space - remain;
            countGrow -= grow;
        });
    }
    function resizeWidth(child, local, size) {
        const { widthRange, lockRatio } = child.__;
        const realSize = widthRange ? within$1(size, widthRange) : size;
        const scale = realSize / local.width;
        child.scaleResize(scale, lockRatio ? scale : 1);
        local.width = realSize;
        return size - realSize;
    }

    const { within } = draw.MathHelper;
    function growY(box, row, height, reverse) {
        let child, grow, remainSpace, remainTotalSpace = 0, list = row.hasRangeSize && [], { grow: totalGrow, start } = row;
        const growSize = row.height < height ? (height - row.height) / totalGrow : 0, { children } = box;
        if (growSize)
            row.height = height;
        for (let j = 0, end = row.count; j < end; j++) {
            child = children[reverse ? start - j : start + j];
            if (child.__.inFlow && child.__.visible !== 0) {
                if (grow = child.__heightGrow) {
                    remainSpace = resizeHeight(child, child.__flowBounds, growSize * grow);
                    if (remainSpace) {
                        remainTotalSpace += remainSpace;
                        totalGrow -= grow;
                    }
                    else if (list) {
                        child.__.heightRange ? list.unshift(child) : list.push(child);
                    }
                }
            }
            else {
                end++;
            }
        }
        if (remainTotalSpace)
            assignRemainSpace(list, remainTotalSpace, totalGrow);
    }
    function assignRemainSpace(list, totalSpace, countGrow) {
        let grow, space, local, remain;
        list.forEach(child => {
            grow = child.__heightGrow;
            space = totalSpace / countGrow * grow;
            remain = resizeHeight(child, local = child.__flowBounds, local.height + space);
            totalSpace -= space - remain;
            countGrow -= grow;
        });
    }
    function resizeHeight(child, local, size) {
        const { heightRange, lockRatio } = child.__;
        const realSize = heightRange ? within(size, heightRange) : size;
        const scale = realSize / local.height;
        child.scaleResize(lockRatio ? scale : 1, scale);
        local.height = realSize;
        return size - realSize;
    }

    const { move: move$2 } = draw.PointHelper;
    function flowX(box, reverse) {
        const side = 'width', { children, itemBox } = box, pData = getParseData(box, true);
        const { complex, wrap, xGap, yGap, isAutoXGap, isFitXGap } = pData;
        if (!children.length)
            return;
        const wrapData = wrap && getWrapDrawData(), xGapTempNum = isAutoXGap ? 0 : xGap;
        let child, local, localWidth, index, data, { x, y, width, height } = box.__layout.contentBounds;
        for (let i = 0, len = children.length; i < len; i++) {
            child = children[index = reverse ? len - 1 - i : i];
            if (child.__.inFlow && child.__.visible !== 0) {
                local = getItemBounds(child, itemBox);
                if (complex) {
                    child.__flowBounds = local;
                    if (!data)
                        data = getDrawData(index, xGapTempNum);
                    if (wrap && data.count && data.width + local.width > width) {
                        if (data.grow)
                            growX(box, data, width, reverse);
                        else if (isAutoXGap)
                            autoGap(data, side, width, isFitXGap);
                        flowWrap(wrapData, data, side);
                        data = getDrawData(index, xGapTempNum);
                    }
                    localWidth = local.width;
                    if (child.__widthGrow) {
                        data.grow += child.__widthGrow, localWidth = 0;
                        if (child.__.widthRange)
                            data.hasRangeSize = true;
                    }
                    if (child.__heightGrow)
                        resizeHeight(child, local, height);
                    data.width += data.count ? localWidth + xGapTempNum : localWidth;
                    data.height = Math.max(data.height, local.height);
                    data.count++;
                }
                else {
                    move$2(child, x - local.x, y - local.y);
                    x += local.width + xGapTempNum;
                }
            }
        }
        if (complex) {
            const { isAutoYGap, isFitYGap, contentAlign, rowXAlign, rowYAlign } = pData;
            if (data.count) {
                if (data.grow)
                    growX(box, data, width, reverse);
                else if (isAutoXGap)
                    autoGap(data, side, width, isFitXGap);
                if (wrap)
                    flowWrap(wrapData, data, side);
            }
            if (wrap) {
                if (isAutoYGap)
                    autoGap(wrapData, 'height', height, isFitYGap);
                else
                    wrapData.gap = yGap;
                align$1(box, wrapData, contentAlign, rowXAlign);
                layout$1(box, wrapData, rowYAlign, reverse);
            }
            else {
                alignContent(box, data, contentAlign);
                layoutX(box, data, 0, data.y, rowYAlign, reverse);
            }
        }
    }

    function align(box, data, contentAlign, rowYAlign) {
        alignContent(box, data, contentAlign);
        const { list } = data;
        if (list.length > 1) {
            if (!rowYAlign)
                rowYAlign = alignToInnerYMap[contentAlign];
            if (rowYAlign !== 'from') {
                let row;
                for (let i = 0, len = list.length; i < len; i++) {
                    row = list[i];
                    row.y = data.height - row.height;
                    if (rowYAlign === 'center')
                        row.y /= 2;
                }
            }
        }
    }

    const { move: move$1 } = draw.PointHelper;
    function layout(box, data, rowXAlign, reverse) {
        const { list } = data, reverseWrap = box.__.flowWrap === 'reverse';
        let row, { x, y } = data;
        for (let i = 0, len = list.length; i < len; i++) {
            row = list[reverseWrap ? len - 1 - i : i];
            layoutY(box, row, x, y, rowXAlign, reverse);
            x += row.width + data.gap;
        }
    }
    function layoutY(box, row, fromX, fromY, rowXAlign, reverse) {
        const { children } = box;
        let child, local, { y, start } = row, x = fromX;
        y += fromY;
        for (let j = 0, end = row.count; j < end; j++) {
            child = children[reverse ? start - j : start + j];
            if (child.__.inFlow && child.__.visible !== 0) {
                local = child.__flowBounds;
                if (rowXAlign !== 'from')
                    x = fromX + (row.width - local.width) / (rowXAlign === 'center' ? 2 : 1);
                move$1(child, x - local.x, y - local.y);
                y += local.height + row.gap;
            }
            else {
                end++;
            }
        }
    }

    const { move } = draw.PointHelper;
    function flowY(box, reverse) {
        const side = 'height', { children, itemBox } = box, pData = getParseData(box, false);
        const { complex, wrap, xGap, yGap, isAutoYGap, isFitYGap } = pData;
        if (!children.length)
            return;
        const wrapData = wrap && getWrapDrawData(), yGapTempNum = isAutoYGap ? 0 : yGap;
        let child, local, localHeight, index, data, { x, y, width, height } = box.__layout.contentBounds;
        for (let i = 0, len = children.length; i < len; i++) {
            child = children[index = reverse ? len - 1 - i : i];
            if (child.__.inFlow && child.__.visible !== 0) {
                local = getItemBounds(child, itemBox);
                if (complex) {
                    child.__flowBounds = local;
                    if (!data)
                        data = getDrawData(index, yGapTempNum);
                    if (wrap && data.count && data.height + local.height > height) {
                        if (data.grow)
                            growY(box, data, height, reverse);
                        if (isAutoYGap)
                            autoGap(data, side, height, isFitYGap);
                        flowWrap(wrapData, data, side);
                        data = getDrawData(index, yGapTempNum);
                    }
                    localHeight = local.height;
                    if (child.__heightGrow) {
                        data.grow += child.__heightGrow, localHeight = 0;
                        if (child.__.heightRange)
                            data.hasRangeSize = true;
                    }
                    if (child.__widthGrow)
                        resizeWidth(child, local, width);
                    data.height += data.count ? localHeight + yGapTempNum : localHeight;
                    data.width = Math.max(data.width, local.width);
                    data.count++;
                }
                else {
                    move(child, x - local.x, y - local.y);
                    y += local.height + yGapTempNum;
                }
            }
        }
        if (complex) {
            const { isAutoXGap, isFitXGap, contentAlign, rowXAlign, rowYAlign } = pData;
            if (data.count) {
                if (data.grow)
                    growY(box, data, height, reverse);
                if (isAutoYGap)
                    autoGap(data, side, height, isFitYGap);
                if (wrap)
                    flowWrap(wrapData, data, side);
            }
            if (wrap) {
                if (!isAutoXGap)
                    wrapData.gap = xGap;
                else
                    autoGap(wrapData, 'width', width, isFitXGap);
                align(box, wrapData, contentAlign, rowYAlign);
                layout(box, wrapData, rowXAlign, reverse);
            }
            else {
                alignContent(box, data, contentAlign);
                layoutY(box, data, data.x, 0, rowXAlign, reverse);
            }
        }
    }

    function autoBoundsType(defaultValue) {
        return draw.decorateLeafAttr(defaultValue, (key) => draw.attr({
            set(value) {
                const grow = typeof value === 'number' ? value : 0;
                key === 'autoWidth' ? this.__widthGrow = grow : this.__heightGrow = grow;
                if (grow && !(this.parent && this.parent.__hasGrow))
                    this.waitParent(() => { this.parent.__hasGrow = true; });
                this.__setAttr(key, value) && draw.doBoundsType(this);
            }
        }));
    }

    const ui = draw.UI.prototype, box = draw.Box.prototype, { __updateBoxBounds } = draw.Group.prototype;
    draw.autoLayoutType(false)(ui, 'flow');
    draw.boundsType(0)(ui, 'gap');
    draw.boundsType('top-left')(ui, 'flowAlign');
    draw.boundsType(false)(ui, 'flowWrap');
    draw.boundsType('box')(ui, 'itemBox');
    draw.boundsType(true)(ui, 'inFlow');
    autoBoundsType()(ui, 'autoWidth');
    autoBoundsType()(ui, 'autoHeight');
    draw.boundsType()(ui, 'lockRatio');
    draw.boundsType()(ui, 'autoBox');
    draw.boundsType()(ui, 'widthRange');
    draw.boundsType()(ui, 'heightRange');
    const { copyAndSpread } = draw.BoundsHelper;
    box.__updateFlowLayout = function () {
        const { leaferIsCreated, flow } = this;
        if (leaferIsCreated)
            this.leafer.created = false;
        switch (flow) {
            case 'x':
            case true:
                flowX(this);
                break;
            case 'y':
                flowY(this);
                break;
            case 'x-reverse':
                flowX(this, true);
                break;
            case 'y-reverse':
                flowY(this, true);
                break;
        }
        if (leaferIsCreated)
            this.leafer.created = true;
    };
    box.__updateContentBounds = function () {
        const { padding } = this.__;
        const layout = this.__layout;
        const same = layout.contentBounds === layout.boxBounds;
        if (padding) {
            if (same)
                layout.shrinkContent();
            copyAndSpread(layout.contentBounds, layout.boxBounds, padding, true);
        }
        else {
            if (!same)
                layout.shrinkContentCancel();
        }
    };
    box.__updateBoxBounds = function (secondLayout) {
        const data = this.__;
        if (this.children.length) {
            const { flow } = data;
            if (data.__autoSide) {
                flow && !secondLayout ? this.__updateRectBoxBounds() : __updateBoxBounds.call(this);
                const { boxBounds } = this.__layout;
                if (!data.__autoSize) {
                    if (data.__autoWidth) {
                        if (!flow)
                            boxBounds.width += boxBounds.x, boxBounds.x = 0;
                        boxBounds.height = data.height, boxBounds.y = 0;
                    }
                    else {
                        if (!flow)
                            boxBounds.height += boxBounds.y, boxBounds.y = 0;
                        boxBounds.width = data.width, boxBounds.x = 0;
                    }
                }
                flow && secondLayout && data.padding && copyAndSpread(boxBounds, boxBounds, data.padding, false, data.__autoSize ? null : (data.__autoWidth ? 'width' : 'height'));
                this.__updateNaturalSize();
            }
            else {
                this.__updateRectBoxBounds();
            }
            if (flow)
                this.__updateContentBounds();
        }
        else {
            this.__updateRectBoxBounds();
        }
    };

    exports.PathScaler = PathScaler;
    exports.scaleResize = scaleResize;
    exports.scaleResizeFontSize = scaleResizeFontSize;
    exports.scaleResizeGroup = scaleResizeGroup;
    exports.scaleResizePath = scaleResizePath;
    exports.scaleResizePoints = scaleResizePoints;

    return exports;

})({}, LeaferUI);

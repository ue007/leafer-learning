this.LeaferIN = this.LeaferIN || {};
this.LeaferIN.arrow = (function (exports, draw) {
    'use strict';

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

    class ArrowData extends draw.LineData {
    }

    exports.Arrow = class Arrow extends draw.Line {
        get __tag() { return 'Arrow'; }
        constructor(data) {
            super(data);
            this.__.__useArrow = true;
        }
    };
    __decorate([
        draw.dataProcessor(ArrowData)
    ], exports.Arrow.prototype, "__", void 0);
    __decorate([
        draw.strokeType('angle')
    ], exports.Arrow.prototype, "endArrow", void 0);
    exports.Arrow = __decorate([
        draw.registerUI()
    ], exports.Arrow);

    const { M: M$1, L: L$1, C: C$1, Q: Q$1, O: O$1 } = draw.PathCommandMap;
    const { rotate: rotate$1, copyFrom: copyFrom$1, scale } = draw.PointHelper;
    const point = {};
    const PathMatrixHelper = {
        layout(data, x, y, scaleX, scaleY, rotation, origin) {
            let command, i = 0, j, len = data.length;
            while (i < len) {
                command = data[i];
                switch (command) {
                    case M$1:
                    case L$1:
                        setPoint$1(data, i + 1, x, y, scaleX, scaleY, rotation, origin);
                        i += 3;
                        break;
                    case C$1:
                        for (j = 1; j < 6; j += 2)
                            setPoint$1(data, i + j, x, y, scaleX, scaleY, rotation, origin);
                        i += 7;
                        break;
                    case Q$1:
                        for (j = 1; j < 4; j += 2)
                            setPoint$1(data, i + j, x, y, scaleX, scaleY, rotation, origin);
                        i += 5;
                        break;
                    case O$1:
                        data[i + 1] += x;
                        data[i + 2] += y;
                        if (scaleX)
                            data[i + 3] *= scaleX;
                        if (rotation) {
                            data[i + 4] += rotation;
                            data[i + 5] += rotation;
                        }
                        i += 7;
                        break;
                }
            }
        },
        rotate(data, rotation, center) {
            PathMatrixHelper.layout(data, 0, 0, 1, 1, rotation, center);
        }
    };
    function setPoint$1(data, startIndex, x, y, scaleX, scaleY, rotation, origin) {
        copyFrom$1(point, data[startIndex], data[startIndex + 1]);
        if (rotation)
            rotate$1(point, rotation, origin);
        if (scaleX)
            scale(point, scaleX, scaleY);
        data[startIndex] = x + point.x;
        data[startIndex + 1] = y + point.y;
    }

    const { layout, rotate } = PathMatrixHelper;
    const { getAngle } = draw.PointHelper;
    const half = { x: -0.5 };
    const angle = { connect: half, offset: { x: -0.71, bevelJoin: 0.36, roundJoin: 0.22 }, path: [1, -3, -3, 2, 0, 0, 2, -3, 3] };
    const angleSide = { connect: half, offset: { x: -1.207, bevelJoin: 0.854, roundJoin: 0.707 }, path: [1, -3, -3, 2, 0, 0, 2, -1, 0] };
    const triangleLinePath = [1, -3, 0, 2, -3, -2, 2, 0, 0, 2, -3, 2, 2, -3, 0];
    const triangle = { connect: half, offset: { x: -0.9, bevelJoin: 0.624, roundJoin: 0.4 }, path: [...triangleLinePath, 1, -2.05, 1.1, 2, -2.05, -1.1] };
    const arrowLinePath = [1, -3, 0, 2, -3.5, -1.8, 2, 0, 0, 2, -3.5, 1.8, 2, -3, 0];
    const arrow = { connect: half, offset: { x: -1.1, bevelJoin: 0.872, roundJoin: 0.6 }, path: [...arrowLinePath, 1, -2.25, 0.95, 2, -2.25, -0.95] };
    const triangleFlip = { offset: half, path: [...triangle.path], };
    rotate(triangleFlip.path, 180, { x: -1.5, y: 0 });
    const circleLine = { connect: { x: -1.3 }, path: [1, 1.8, -0.1, 2, 1.8, 0, 26, 0, 0, 1.8, 0, 359, 0], };
    const circle = { connect: { x: 0.5 }, path: [...circleLine.path, 1, 0, 0, 26, 0, 0, 1, 0, 360, 0] };
    const squareLine = { connect: { x: -1.3 }, path: [1, -1.4, 0, 2, -1.4, -1.4, 2, 1.4, -1.4, 2, 1.4, 1.4, 2, -1.4, 1.4, 2, -1.4, 0] };
    const square = { path: [...squareLine.path, 2, -1.4, -0.49, 2, 1, -0.49, 1, -1.4, 0.49, 2, 1, 0.49] };
    const diamondLine = draw.DataHelper.clone(squareLine);
    const diamond = draw.DataHelper.clone(square);
    rotate(diamondLine.path, 45);
    rotate(diamond.path, 45);
    const mark = { offset: half, path: [1, 0, -2, 2, 0, 2] };
    const arrows = {
        angle,
        'angle-side': angleSide,
        arrow,
        triangle,
        'triangle-flip': triangleFlip,
        circle,
        'circle-line': circleLine,
        square,
        'square-line': squareLine,
        diamond,
        'diamond-line': diamondLine,
        mark,
    };
    function getArrowPath(ui, arrow, from, to, scale, connectOffset) {
        const { strokeCap, strokeJoin } = ui.__;
        const { offset, connect, path } = (typeof arrow === 'object' ? arrow : arrows[arrow]);
        let connectX = connect ? connect.x : 0;
        let offsetX = offset ? offset.x : 0;
        const data = [...path];
        if (strokeCap !== 'none')
            connectX -= 0.5;
        if (offset) {
            if (strokeJoin === 'round' && offset.roundJoin)
                offsetX += offset.roundJoin;
            else if (strokeJoin === 'bevel' && offset.bevelJoin)
                offsetX += offset.bevelJoin;
        }
        if (offsetX)
            layout(data, offsetX, 0);
        layout(data, to.x, to.y, scale, scale, getAngle(from, to));
        connectOffset.x = (connectX + offsetX) * scale;
        return data;
    }

    const { M, L, C, Q, Z, N, D, X, G, F, O, P, U } = draw.PathCommandMap;
    const { copy, copyFrom, getDistancePoint, } = draw.PointHelper;
    const connectPoint = {};
    const first = {}, second = {};
    const last = {}, now = {};
    const PathArrowModule = {
        list: arrows,
        addArrows(ui, changeRenderPath) {
            const { startArrow, endArrow, strokeWidth, __pathForRender: data } = ui.__;
            let command, i = 0, len = data.length, count = 0, useStartArrow = startArrow && startArrow !== 'none';
            while (i < len) {
                command = data[i];
                switch (command) {
                    case M:
                    case L:
                        if (count < 2 || i + 6 >= len) {
                            copyFrom(now, data[i + 1], data[i + 2]);
                            if (!count && useStartArrow)
                                copy(first, now);
                        }
                        i += 3;
                        break;
                    case C:
                        if (count === 1 || i + 7 === len)
                            copyPoints(data, last, now, i + 3);
                        i += 7;
                        break;
                    case Q:
                        if (count === 1 || i + 5 === len)
                            copyPoints(data, last, now, i + 1);
                        i += 5;
                        break;
                    case Z:
                        return;
                    case N:
                        i += 5;
                        break;
                    case D:
                        i += 9;
                        break;
                    case X:
                        i += 6;
                        break;
                    case G:
                        i += 9;
                        break;
                    case F:
                        i += 5;
                        break;
                    case O:
                        i += 7;
                        break;
                    case P:
                        i += 4;
                        break;
                    case U:
                        if (count === 1 || i + 6 === len)
                            copyPoints(data, last, now, i + 1);
                        i += 6;
                        break;
                }
                count++;
                if (count === 1 && command !== M)
                    return;
                if (count === 2 && useStartArrow)
                    copy(second, command === L ? now : last);
                if (i === len) {
                    const p = ui.__.__pathForRender = changeRenderPath ? [...data] : data;
                    if (useStartArrow) {
                        p.push(...getArrowPath(ui, startArrow, second, first, strokeWidth, connectPoint));
                        if (connectPoint.x) {
                            getDistancePoint(first, second, -connectPoint.x, true);
                            p[1] = second.x;
                            p[2] = second.y;
                        }
                    }
                    if (endArrow && endArrow !== 'none') {
                        p.push(...getArrowPath(ui, endArrow, last, now, strokeWidth, connectPoint));
                        if (connectPoint.x) {
                            getDistancePoint(now, last, -connectPoint.x, true);
                            let index;
                            switch (command) {
                                case L:
                                    index = i - 3 + 1;
                                    break;
                                case C:
                                    index = i - 7 + 5;
                                    break;
                                case Q:
                                    index = i - 5 + 3;
                                    break;
                                case U:
                                    index = i - 6 + 3;
                                    break;
                            }
                            if (index)
                                setPoint(p, last, index);
                        }
                    }
                }
                else {
                    copy(last, now);
                }
            }
        }
    };
    function copyPoints(data, from, to, startIndex) {
        copyFrom(from, data[startIndex], data[startIndex + 1]);
        copyFrom(to, data[startIndex + 2], data[startIndex + 3]);
    }
    function setPoint(data, point, startIndex) {
        data[startIndex] = point.x;
        data[startIndex + 1] = point.y;
    }

    function arrowType(defaultValue) {
        return draw.decorateLeafAttr(defaultValue, (key) => draw.attr({
            set(value) {
                if (this.__setAttr(key, value)) {
                    const data = this.__;
                    data.__useArrow = data.startArrow !== 'none' || data.endArrow !== 'none';
                    draw.doStrokeType(this);
                }
            }
        }));
    }

    const ui = draw.UI.prototype;
    arrowType('none')(ui, 'startArrow');
    arrowType('none')(ui, 'endArrow');
    Object.assign(draw.PathArrow, PathArrowModule);

    exports.ArrowData = ArrowData;
    exports.PathArrowModule = PathArrowModule;
    exports.PathMatrixHelper = PathMatrixHelper;
    exports.arrowType = arrowType;

    return exports;

})({}, LeaferUI);

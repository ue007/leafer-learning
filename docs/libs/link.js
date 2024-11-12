this.LeaferX = this.LeaferX || {};
this.LeaferX.connector = (function (exports, core, arrow) {
    'use strict';

    const QnConnectorProxy = (target, property, newValue, receiver) => {
        const before = target[property];
        if (property in watcher && newValue !== before) {
            const params = { val: newValue, before, target, receiver };
            const after = watcher[property].call(target, params);
            target[property] = after;
            target._draw();
        }
        else {
            target[property] = newValue;
        }
        return true;
    };
    const watcher = {
        'padding': ({ val }) => val,
        'margin': ({ val }) => val,
        'addPoint': ({ val }) => val,
        'type': ({ val }) => val,
    };

    function calcAngle(A, B, C) {
        let BA = { x: B.x - A.x, y: B.y - A.y };
        let BC = { x: B.x - C.x, y: B.y - C.y };
        let dotProduct = BA.x * BC.x + BA.y * BC.y;
        let magnitudeBA = Math.sqrt(BA.x * BA.x + BA.y * BA.y);
        let magnitudeBC = Math.sqrt(BC.x * BC.x + BC.y * BC.y);
        let angle = Math.acos(dotProduct / (magnitudeBA * magnitudeBC)) * (180 / Math.PI);
        let crossProduct = BA.x * BC.y - BA.y * BC.x;
        if (crossProduct < 0) {
            angle = 360 - angle;
        }
        return angle;
    }
    function calcDistance(a, b) {
        const x1 = a.x;
        const y1 = a.y;
        const x2 = b.x;
        const y2 = b.y;
        const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        return distance;
    }
    function loadValue(...args) {
        return args.find(arg => arg !== undefined);
    }

    class ExRect {
        constructor(target, opt, tOpt) {
            this.getConnectionPoints = () => {
                let a = [];
                let bounds = this.getBounds(this.padding + this.margin);
                a.push(bounds.t, bounds.b, bounds.l, bounds.r);
                return a;
            };
            this.getValidPoints = (bound) => {
                this.setValidSide(bound);
                let a = [];
                let bounds = this.getBounds(this.margin);
                let bounds2 = this.getBounds(this.padding + this.margin);
                if (this.side != undefined) {
                    a.push({
                        'linkPoint': bounds[this.side],
                        'padding': bounds2[this.side],
                        'side': this.side,
                        'anglePoint': bounds[this.side]
                    });
                    return a;
                }
                for (const s of this.validSide) {
                    let anglePoint = bounds[s];
                    switch (s) {
                        case 't':
                            anglePoint.y = bounds[s].y + 1;
                            break;
                        case 'b':
                            anglePoint.y = bounds[s].y - 1;
                            break;
                        case 'l':
                            anglePoint.x = bounds[s].x + 1;
                            break;
                        case 'r':
                            anglePoint.x = bounds[s].x - 1;
                            break;
                    }
                    a.push({
                        'linkPoint': bounds[s],
                        'padding': bounds2[s],
                        'side': s,
                        'anglePoint': anglePoint
                    });
                }
                return a;
            };
            this.getBounds = (spread) => {
                const bounds = this.target.getLayoutBounds(this.boundType, 'local');
                const { width, height, x, y } = bounds;
                let percent = this.percent || 0.5;
                spread = spread || 0;
                bounds.x = x - spread;
                bounds.y = y - spread;
                bounds.width = width + spread * 2;
                bounds.height = height + spread * 2;
                let t = {
                    x: x + percent * width,
                    y: y - spread,
                };
                let b = {
                    x: x + (1 - percent) * width,
                    y: y + height + spread,
                };
                let l = {
                    x: x - spread,
                    y: y + (1 - percent) * height,
                };
                let r = {
                    x: x + width + spread,
                    y: y + percent * height,
                };
                return { t, b, l, r, bounds };
            };
            this.padding = loadValue(tOpt === null || tOpt === void 0 ? void 0 : tOpt.padding, opt === null || opt === void 0 ? void 0 : opt.padding, 8);
            this.margin = loadValue(tOpt === null || tOpt === void 0 ? void 0 : tOpt.margin, opt === null || opt === void 0 ? void 0 : opt.margin, 0);
            this.side = tOpt === null || tOpt === void 0 ? void 0 : tOpt.side;
            this._autoSide = 'b';
            this.boundType = (opt === null || opt === void 0 ? void 0 : opt.boundType) || 'stroke';
            this.arrowType = (tOpt === null || tOpt === void 0 ? void 0 : tOpt.arrow) || 'none';
            this.target = target;
            this.percent = loadValue(tOpt === null || tOpt === void 0 ? void 0 : tOpt.percent, 0.5);
        }
        checkInSide(p, bound) {
            let x1 = bound.x;
            let x2 = bound.x + bound.width;
            let y1 = bound.y;
            let y2 = bound.y + bound.height;
            let isX = p.x >= x1 && p.x <= x2;
            let isY = p.y >= y1 && p.y <= y2;
            return !(isX && isY);
        }
        setValidSide(bound) {
            let myBound = this.getBounds(this.padding + this.margin);
            let obj = [];
            this.checkInSide(myBound.t, bound) && obj.push('t');
            this.checkInSide(myBound.b, bound) && obj.push('b');
            this.checkInSide(myBound.l, bound) && obj.push('l');
            this.checkInSide(myBound.r, bound) && obj.push('r');
            this.validSide = obj;
        }
    }

    class ExStandard {
        constructor(target, opt, tOpt) {
            this.getConnectionPoints = () => {
                let a = [];
                let bounds = this.getBounds(this.padding + this.margin);
                a.push(bounds.t, bounds.b, bounds.l, bounds.r);
                return a;
            };
            this.getValidPoints = (bound) => {
                this.setValidSide(bound);
                let a = [];
                let bounds = this.getBounds(this.margin);
                let bounds2 = this.getBounds(this.padding + this.margin);
                if (this.side != undefined) {
                    a.push({
                        'linkPoint': bounds[this.side],
                        'padding': bounds2[this.side],
                        'side': this.side,
                        'anglePoint': bounds[this.side]
                    });
                    return a;
                }
                for (const s of this.validSide) {
                    let anglePoint = bounds[s];
                    switch (s) {
                        case 't':
                            anglePoint.y = bounds[s].y + 1;
                            break;
                        case 'b':
                            anglePoint.y = bounds[s].y - 1;
                            break;
                        case 'l':
                            anglePoint.x = bounds[s].x + 1;
                            break;
                        case 'r':
                            anglePoint.x = bounds[s].x - 1;
                            break;
                    }
                    a.push({
                        'linkPoint': bounds[s],
                        'padding': bounds2[s],
                        'side': s,
                        'anglePoint': anglePoint
                    });
                }
                return a;
            };
            this.getBounds = (spread) => {
                const bounds = this.target.getLayoutBounds(this.boundType, 'local');
                const { width, height, x, y } = bounds;
                let percent = this.percent || 0.5;
                spread = spread || 0;
                bounds.x = x - spread;
                bounds.y = y - spread;
                bounds.width = width + spread * 2;
                bounds.height = height + spread * 2;
                let t = {
                    x: x + percent * width,
                    y: y - spread,
                };
                let b = {
                    x: x + (1 - percent) * width,
                    y: y + height + spread,
                };
                let l = {
                    x: x - spread,
                    y: y + (1 - percent) * height,
                };
                let r = {
                    x: x + width + spread,
                    y: y + percent * height,
                };
                return { t, b, l, r, bounds };
            };
            this.padding = loadValue(tOpt === null || tOpt === void 0 ? void 0 : tOpt.padding, opt === null || opt === void 0 ? void 0 : opt.padding, 8);
            this.margin = loadValue(tOpt === null || tOpt === void 0 ? void 0 : tOpt.margin, opt === null || opt === void 0 ? void 0 : opt.margin, 0);
            this.side = tOpt === null || tOpt === void 0 ? void 0 : tOpt.side;
            this._autoSide = 'b';
            this.boundType = (opt === null || opt === void 0 ? void 0 : opt.boundType) || 'stroke';
            this.arrowType = (tOpt === null || tOpt === void 0 ? void 0 : tOpt.arrow) || 'none';
            this.target = target;
            this.percent = loadValue(tOpt === null || tOpt === void 0 ? void 0 : tOpt.percent, 0.5);
        }
        checkInSide(p, bound) {
            let x1 = bound.x;
            let x2 = bound.x + bound.width;
            let y1 = bound.y;
            let y2 = bound.y + bound.height;
            let isX = p.x >= x1 && p.x <= x2;
            let isY = p.y >= y1 && p.y <= y2;
            return !(isX && isY);
        }
        setValidSide(bound) {
            let myBound = this.getBounds(this.padding + this.margin);
            let obj = [];
            this.checkInSide(myBound.t, bound) && obj.push('t');
            this.checkInSide(myBound.b, bound) && obj.push('b');
            this.checkInSide(myBound.l, bound) && obj.push('l');
            this.checkInSide(myBound.r, bound) && obj.push('r');
            this.validSide = obj;
        }
    }

    class TargetObj {
        constructor(target, opt, tOpt) {
            this.target = target;
            var instance;
            switch (target.tag) {
                case 'Rect':
                    instance = new ExRect(target, opt, tOpt);
                    break;
                case 'Ellipse':
                    instance = new ExStandard(target, opt, tOpt);
                default:
                    instance = new ExStandard(target, opt, tOpt);
                    break;
            }
            this.padding = instance.padding || 8;
            this.margin = instance.margin || 0;
            this.boundType = instance.boundType;
            this.arrowType = instance.arrowType;
            this.connPoints = instance.getConnectionPoints();
            this.getBounds = instance.getBounds;
            this.updateConnPoints = () => {
                this.connPoints = instance.getConnectionPoints();
                return this.connPoints;
            };
            this.updateValidPoints = (targetObj) => {
                var bound = targetObj.target.getLayoutBounds(targetObj.boundType, 'local');
                var space = this.padding + this.margin;
                var spreadBound = new core.Bounds(bound).spread(space);
                this.validPoints = instance.getValidPoints({
                    width: spreadBound.width,
                    height: spreadBound.height,
                    x: spreadBound.x,
                    y: spreadBound.y,
                    rotation: bound.rotation,
                    scaleX: bound.scaleX,
                    scaleY: bound.scaleY,
                    skewX: bound.skewX,
                    skewY: bound.skewY
                });
                return this.validPoints;
            };
        }
    }

    class LeaferXQnConnector extends arrow.Arrow {
        constructor(target1, target2, opt) {
            super();
            this.path = "";
            this.setDirection = (r1, r2) => {
                const center1 = {
                    x: r1.x + r1.width / 2,
                    y: r1.y + r1.height / 2
                };
                const center2 = {
                    x: r2.x + r2.width / 2,
                    y: r2.y + r2.height / 2
                };
                const dx = center2.x - center1.x;
                const dy = center2.y - center1.y;
                var vertical = '';
                var horizontal = '';
                if (dy > 0) {
                    vertical = 'b';
                }
                else if (dy < 0) {
                    vertical = 't';
                }
                if (dx > 0) {
                    horizontal = 'r';
                }
                else if (dx < 0) {
                    horizontal = 'l';
                }
                return (vertical + horizontal);
            };
            this.obj1 = new TargetObj(target1, opt, opt === null || opt === void 0 ? void 0 : opt.opt1);
            this.obj2 = new TargetObj(target2, opt, opt === null || opt === void 0 ? void 0 : opt.opt2);
            this.opt = opt;
            this.type = (opt === null || opt === void 0 ? void 0 : opt.type) || 'default';
            this.strokeWidth = 3;
            this.stroke = 'rgb(50,89,34)';
            this.direction = this.setDirection(target1, target2);
            const that = this;
            target1.on(core.MoveEvent.DRAG, function (e) {
                if (e.type === core.MoveEvent.DRAG) {
                    that._draw();
                }
            });
            target2.on(core.MoveEvent.DRAG, function (e) {
                if (e.type === core.MoveEvent.DRAG) {
                    that._draw();
                }
            });
            this._draw();
            this._draw();
            return new Proxy(this, {
                set: (target, property, newValue, receiver) => QnConnectorProxy(target, property, newValue, receiver)
            });
        }
        drawPath(s, e) {
            var _a, _b, _c, _d;
            let s1 = `M ${s.linkPoint.x} ${s.linkPoint.y}`;
            let s2 = ` L ${s.padding.x} ${s.padding.y}`;
            if (((_a = s.pathPoint) === null || _a === void 0 ? void 0 : _a.x) && ((_b = s.pathPoint) === null || _b === void 0 ? void 0 : _b.y)) {
                s2 += ` L ${s.pathPoint.x} ${s.pathPoint.y}`;
            }
            let e2 = '';
            if (((_c = e.pathPoint) === null || _c === void 0 ? void 0 : _c.x) && ((_d = e.pathPoint) === null || _d === void 0 ? void 0 : _d.y)) {
                e2 = ` L ${e.pathPoint.x} ${e.pathPoint.y}`;
            }
            e2 += ` L ${e.padding.x} ${e.padding.y}`;
            let e1 = ` L ${e.linkPoint.x} ${e.linkPoint.y}`;
            return `${s1}${s2}${e2}${e1}`;
        }
        checkInSide(p, bound) {
            let x1 = bound.x;
            let x2 = bound.x + bound.width;
            let y1 = bound.y;
            let y2 = bound.y + bound.height;
            let isX = p.x >= x1 && p.x <= x2;
            let isY = p.y >= y1 && p.y <= y2;
            return !(isX && isY);
        }
        setValidSide() {
            let bound1 = this.obj1.getBounds(this.obj1.padding + this.obj1.margin);
            let bound2 = this.obj2.getBounds(this.obj2.padding + this.obj2.margin);
            let obj1 = [];
            let obj2 = [];
            this.checkInSide(bound1.t, bound2.bounds) && obj1.push('t');
            this.checkInSide(bound1.b, bound2.bounds) && obj1.push('b');
            this.checkInSide(bound1.l, bound2.bounds) && obj1.push('l');
            this.checkInSide(bound1.r, bound2.bounds) && obj1.push('r');
            this.checkInSide(bound2.t, bound1.bounds) && obj2.push('t');
            this.checkInSide(bound2.b, bound1.bounds) && obj2.push('b');
            this.checkInSide(bound2.l, bound1.bounds) && obj2.push('l');
            this.checkInSide(bound2.r, bound1.bounds) && obj2.push('r');
            this.validSide = {
                obj1,
                obj2,
            };
        }
        _draw() {
            var _a;
            this.renderCount = 0;
            this.setValidSide();
            var pdPoints1 = this.obj1.updateValidPoints(this.obj2);
            var pdPoints2 = this.obj2.updateValidPoints(this.obj1);
            if (pdPoints1.length == 0 || pdPoints2.length == 0) {
                this.path = 'M 0 0 Z';
                return;
            }
            var distance = 0;
            var point1, point2;
            for (const p1 of pdPoints1) {
                for (const p2 of pdPoints2) {
                    let d2 = calcDistance(p1.padding, p2.padding);
                    if (distance == 0 || distance > d2) {
                        distance = d2;
                        point1 = p1;
                        point2 = p2;
                    }
                }
            }
            point1.angle = calcAngle(point1.anglePoint, point1.padding, point2.padding);
            point2.angle = calcAngle(point2.anglePoint, point2.padding, point1.padding);
            const getLen = (a, b) => {
                if (a > b) {
                    return a - b;
                }
                else {
                    return b - a;
                }
            };
            let validAngle1 = point1.angle < 90 || point1.angle > 270;
            let validAngle2 = point2.angle < 90 || point2.angle > 270;
            if (validAngle1 || validAngle2) {
                let horizontal = getLen(point1.padding.x, point2.padding.x);
                let vertical = getLen(point1.padding.y, point2.padding.y);
                if (horizontal < vertical) {
                    if (point1.side == point2.side) {
                        if (validAngle1) {
                            point2.pathPoint = {
                                y: point2.padding.y,
                                x: point2.padding.x + (point2.padding.x > point1.padding.x ? -horizontal : horizontal),
                            };
                        }
                        else {
                            point1.pathPoint = {
                                y: point1.padding.y,
                                x: point1.padding.x + (point1.padding.x > point2.padding.x ? -horizontal : horizontal),
                            };
                        }
                    }
                    else {
                        if (['b', 't'].indexOf(point1.side) > -1) {
                            point1.pathPoint = {
                                y: point1.padding.y,
                                x: point1.padding.x + (point1.padding.x > point2.padding.x ? -horizontal : horizontal),
                            };
                        }
                        else {
                            point2.pathPoint = {
                                y: point2.padding.y,
                                x: point2.padding.x + (point2.padding.x > point1.padding.x ? -horizontal : horizontal),
                            };
                        }
                    }
                }
                else {
                    if (point1.side == point2.side) {
                        if (validAngle1) {
                            point2.pathPoint = {
                                x: point2.padding.x,
                                y: point2.padding.y + (point2.padding.y > point1.padding.y ? -vertical : vertical),
                            };
                        }
                        else {
                            point1.pathPoint = {
                                x: point1.padding.x,
                                y: point1.padding.y + (point1.padding.y > point2.padding.y ? -vertical : vertical),
                            };
                        }
                    }
                    else {
                        if (['r', 'l'].indexOf(point1.side) > -1) {
                            point1.pathPoint = {
                                x: point1.padding.x,
                                y: point1.padding.y + (point1.padding.y > point2.padding.y ? -vertical : vertical),
                            };
                        }
                        else {
                            point2.pathPoint = {
                                x: point2.padding.x,
                                y: point2.padding.y + (point2.padding.y > point1.padding.y ? -vertical : vertical),
                            };
                        }
                    }
                }
            }
            this.path = this.drawPath(point1, point2);
            if (typeof ((_a = this.opt) === null || _a === void 0 ? void 0 : _a.onDraw) == 'function') {
                this.path = this.opt.onDraw({
                    s: point1,
                    e: point2,
                    path: this.path
                });
            }
            this.startArrow = this.obj1.arrowType;
            this.endArrow = this.obj2.arrowType;
        }
    }

    exports.LeaferXQnConnector = LeaferXQnConnector;

    return exports;

})({}, LeaferUI, LeaferIN.arrow);

var LeaferUI = (function (exports) {
    'use strict';

    const Platform = {
        toURL(text, fileType) {
            let url = encodeURIComponent(text);
            if (fileType === 'text')
                url = 'data:text/plain;charset=utf-8,' + url;
            else if (fileType === 'svg')
                url = 'data:image/svg+xml,' + url;
            return url;
        },
        image: {
            hitCanvasSize: 100,
            maxCacheSize: 2560 * 1600,
            maxPatternSize: 4096 * 2160,
            crossOrigin: 'anonymous',
            getRealURL(url) {
                const { prefix, suffix } = Platform.image;
                if (suffix && !url.startsWith('data:') && !url.startsWith('blob:'))
                    url += (url.includes("?") ? "&" : "?") + suffix;
                if (prefix && url[0] === '/')
                    url = prefix + url;
                return url;
            }
        }
    };

    const Creator = {};

    const IncrementId = {
        RUNTIME: 'runtime',
        LEAF: 'leaf',
        TASK: 'task',
        CNAVAS: 'canvas',
        IMAGE: 'image',
        types: {},
        create(typeName) {
            const { types } = I$2;
            if (types[typeName]) {
                return types[typeName]++;
            }
            else {
                types[typeName] = 1;
                return 0;
            }
        }
    };
    const I$2 = IncrementId;

    const { round, pow: pow$1, PI: PI$4 } = Math;
    const MathHelper = {
        within(value, min, max) {
            if (typeof min === 'object')
                max = min.max, min = min.min;
            if (min !== undefined && value < min)
                value = min;
            if (max !== undefined && value > max)
                value = max;
            return value;
        },
        fourNumber(num, maxValue) {
            let data;
            if (num instanceof Array) {
                switch (num.length) {
                    case 4:
                        data = maxValue === undefined ? num : [...num];
                        break;
                    case 2:
                        data = [num[0], num[1], num[0], num[1]];
                        break;
                    case 3:
                        data = [num[0], num[1], num[2], num[1]];
                        break;
                    case 1:
                        num = num[0];
                        break;
                    default:
                        num = 0;
                }
            }
            if (!data)
                data = [num, num, num, num];
            if (maxValue)
                for (let i = 0; i < 4; i++)
                    if (data[i] > maxValue)
                        data[i] = maxValue;
            return data;
        },
        formatRotation(rotation, unsign) {
            rotation %= 360;
            if (unsign) {
                if (rotation < 0)
                    rotation += 360;
            }
            else {
                if (rotation > 180)
                    rotation -= 360;
                if (rotation < -180)
                    rotation += 360;
            }
            return MathHelper.float(rotation);
        },
        getGapRotation(addRotation, gap, oldRotation = 0) {
            let rotation = addRotation + oldRotation;
            if (gap > 1) {
                const r = Math.abs(rotation % gap);
                if (r < 1 || r > gap - 1)
                    rotation = Math.round(rotation / gap) * gap;
            }
            return rotation - oldRotation;
        },
        float(num, maxLength) {
            const a = maxLength ? pow$1(10, maxLength) : 1000000000000;
            num = round(num * a) / a;
            return num === -0 ? 0 : num;
        },
        getScaleData(scale, size, originSize, scaleData) {
            if (!scaleData)
                scaleData = {};
            if (size) {
                scaleData.scaleX = (typeof size === 'number' ? size : size.width) / originSize.width;
                scaleData.scaleY = (typeof size === 'number' ? size : size.height) / originSize.height;
            }
            else if (scale)
                MathHelper.assignScale(scaleData, scale);
            return scaleData;
        },
        assignScale(scaleData, scale) {
            if (typeof scale === 'number') {
                scaleData.scaleX = scaleData.scaleY = scale;
            }
            else {
                scaleData.scaleX = scale.x;
                scaleData.scaleY = scale.y;
            }
        }
    };
    const OneRadian = PI$4 / 180;
    const PI2 = PI$4 * 2;
    const PI_2 = PI$4 / 2;
    function getPointData() { return { x: 0, y: 0 }; }
    function getBoundsData() { return { x: 0, y: 0, width: 0, height: 0 }; }
    function getMatrixData() { return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }; }

    const { sin: sin$5, cos: cos$5, acos, sqrt: sqrt$3 } = Math;
    const { float: float$1 } = MathHelper;
    const tempPoint$4 = {};
    function getWorld() {
        return Object.assign(Object.assign(Object.assign({}, getMatrixData()), getBoundsData()), { scaleX: 1, scaleY: 1, rotation: 0, skewX: 0, skewY: 0 });
    }
    const MatrixHelper = {
        defaultMatrix: getMatrixData(),
        defaultWorld: getWorld(),
        tempMatrix: {},
        set(t, a = 1, b = 0, c = 0, d = 1, e = 0, f = 0) {
            t.a = a;
            t.b = b;
            t.c = c;
            t.d = d;
            t.e = e;
            t.f = f;
        },
        get: getMatrixData,
        getWorld,
        copy(t, matrix) {
            t.a = matrix.a;
            t.b = matrix.b;
            t.c = matrix.c;
            t.d = matrix.d;
            t.e = matrix.e;
            t.f = matrix.f;
        },
        translate(t, x, y) {
            t.e += x;
            t.f += y;
        },
        translateInner(t, x, y, hasOrigin) {
            t.e += t.a * x + t.c * y;
            t.f += t.b * x + t.d * y;
            if (hasOrigin)
                t.e -= x, t.f -= y;
        },
        scale(t, scaleX, scaleY = scaleX) {
            t.a *= scaleX;
            t.b *= scaleX;
            t.c *= scaleY;
            t.d *= scaleY;
        },
        scaleOfOuter(t, origin, scaleX, scaleY) {
            M$6.toInnerPoint(t, origin, tempPoint$4);
            M$6.scaleOfInner(t, tempPoint$4, scaleX, scaleY);
        },
        scaleOfInner(t, origin, scaleX, scaleY = scaleX) {
            M$6.translateInner(t, origin.x, origin.y);
            M$6.scale(t, scaleX, scaleY);
            M$6.translateInner(t, -origin.x, -origin.y);
        },
        rotate(t, rotation) {
            const { a, b, c, d } = t;
            rotation *= OneRadian;
            const cosR = cos$5(rotation);
            const sinR = sin$5(rotation);
            t.a = a * cosR - b * sinR;
            t.b = a * sinR + b * cosR;
            t.c = c * cosR - d * sinR;
            t.d = c * sinR + d * cosR;
        },
        rotateOfOuter(t, origin, rotation) {
            M$6.toInnerPoint(t, origin, tempPoint$4);
            M$6.rotateOfInner(t, tempPoint$4, rotation);
        },
        rotateOfInner(t, origin, rotation) {
            M$6.translateInner(t, origin.x, origin.y);
            M$6.rotate(t, rotation);
            M$6.translateInner(t, -origin.x, -origin.y);
        },
        skew(t, skewX, skewY) {
            const { a, b, c, d } = t;
            if (skewY) {
                skewY *= OneRadian;
                t.a = a + c * skewY;
                t.b = b + d * skewY;
            }
            if (skewX) {
                skewX *= OneRadian;
                t.c = c + a * skewX;
                t.d = d + b * skewX;
            }
        },
        skewOfOuter(t, origin, skewX, skewY) {
            M$6.toInnerPoint(t, origin, tempPoint$4);
            M$6.skewOfInner(t, tempPoint$4, skewX, skewY);
        },
        skewOfInner(t, origin, skewX, skewY = 0) {
            M$6.translateInner(t, origin.x, origin.y);
            M$6.skew(t, skewX, skewY);
            M$6.translateInner(t, -origin.x, -origin.y);
        },
        multiply(t, child) {
            const { a, b, c, d, e, f } = t;
            t.a = child.a * a + child.b * c;
            t.b = child.a * b + child.b * d;
            t.c = child.c * a + child.d * c;
            t.d = child.c * b + child.d * d;
            t.e = child.e * a + child.f * c + e;
            t.f = child.e * b + child.f * d + f;
        },
        multiplyParent(t, parent, to, abcdChanged, childScaleData, scrollData) {
            let { e, f } = t;
            if (scrollData)
                e += scrollData.scrollX, f += scrollData.scrollY;
            to || (to = t);
            if (abcdChanged === undefined)
                abcdChanged = t.a !== 1 || t.b || t.c || t.d !== 1;
            if (abcdChanged) {
                const { a, b, c, d } = t;
                to.a = a * parent.a + b * parent.c;
                to.b = a * parent.b + b * parent.d;
                to.c = c * parent.a + d * parent.c;
                to.d = c * parent.b + d * parent.d;
                if (childScaleData) {
                    to.scaleX = parent.scaleX * childScaleData.scaleX;
                    to.scaleY = parent.scaleY * childScaleData.scaleY;
                }
            }
            else {
                to.a = parent.a;
                to.b = parent.b;
                to.c = parent.c;
                to.d = parent.d;
                if (childScaleData) {
                    to.scaleX = parent.scaleX;
                    to.scaleY = parent.scaleY;
                }
            }
            to.e = e * parent.a + f * parent.c + parent.e;
            to.f = e * parent.b + f * parent.d + parent.f;
        },
        divide(t, child) {
            M$6.multiply(t, M$6.tempInvert(child));
        },
        divideParent(t, parent) {
            M$6.multiplyParent(t, M$6.tempInvert(parent));
        },
        tempInvert(t) {
            const { tempMatrix } = M$6;
            M$6.copy(tempMatrix, t);
            M$6.invert(tempMatrix);
            return tempMatrix;
        },
        invert(t) {
            const { a, b, c, d, e, f } = t;
            if (!b && !c) {
                if (a === 1 && d === 1) {
                    t.e = -e;
                    t.f = -f;
                }
                else {
                    const s = 1 / (a * d);
                    t.a = d * s;
                    t.d = a * s;
                    t.e = -e * d * s;
                    t.f = -f * a * s;
                }
            }
            else {
                const s = 1 / (a * d - b * c);
                t.a = d * s;
                t.b = -b * s;
                t.c = -c * s;
                t.d = a * s;
                t.e = -(e * d - f * c) * s;
                t.f = -(f * a - e * b) * s;
            }
        },
        toOuterPoint(t, inner, to, distance) {
            const { x, y } = inner;
            to || (to = inner);
            to.x = x * t.a + y * t.c;
            to.y = x * t.b + y * t.d;
            if (!distance) {
                to.x += t.e;
                to.y += t.f;
            }
        },
        toInnerPoint(t, outer, to, distance) {
            const { a, b, c, d } = t;
            const s = 1 / (a * d - b * c);
            const { x, y } = outer;
            to || (to = outer);
            to.x = (x * d - y * c) * s;
            to.y = (y * a - x * b) * s;
            if (!distance) {
                const { e, f } = t;
                to.x -= (e * d - f * c) * s;
                to.y -= (f * a - e * b) * s;
            }
        },
        setLayout(t, layout, origin, around, bcChanged) {
            const { x, y, scaleX, scaleY } = layout;
            if (bcChanged === undefined)
                bcChanged = layout.rotation || layout.skewX || layout.skewY;
            if (bcChanged) {
                const { rotation, skewX, skewY } = layout;
                const r = rotation * OneRadian;
                const cosR = cos$5(r);
                const sinR = sin$5(r);
                if (skewX || skewY) {
                    const sx = skewX * OneRadian;
                    const sy = skewY * OneRadian;
                    t.a = (cosR + sy * -sinR) * scaleX;
                    t.b = (sinR + sy * cosR) * scaleX;
                    t.c = (-sinR + sx * cosR) * scaleY;
                    t.d = (cosR + sx * sinR) * scaleY;
                }
                else {
                    t.a = cosR * scaleX;
                    t.b = sinR * scaleX;
                    t.c = -sinR * scaleY;
                    t.d = cosR * scaleY;
                }
            }
            else {
                t.a = scaleX;
                t.b = 0;
                t.c = 0;
                t.d = scaleY;
            }
            t.e = x;
            t.f = y;
            if (origin = origin || around)
                M$6.translateInner(t, -origin.x, -origin.y, !around);
        },
        getLayout(t, origin, around, firstSkewY) {
            const { a, b, c, d, e, f } = t;
            let x = e, y = f, scaleX, scaleY, rotation, skewX, skewY;
            if (b || c) {
                const s = a * d - b * c;
                if (c && !firstSkewY) {
                    scaleX = sqrt$3(a * a + b * b);
                    scaleY = s / scaleX;
                    const cosR = a / scaleX;
                    rotation = b > 0 ? acos(cosR) : -acos(cosR);
                }
                else {
                    scaleY = sqrt$3(c * c + d * d);
                    scaleX = s / scaleY;
                    const cosR = c / scaleY;
                    rotation = PI_2 - (d > 0 ? acos(-cosR) : -acos(cosR));
                }
                const cosR = float$1(cos$5(rotation));
                const sinR = sin$5(rotation);
                scaleX = float$1(scaleX), scaleY = float$1(scaleY);
                skewX = cosR ? float$1((c / scaleY + sinR) / cosR / OneRadian, 9) : 0;
                skewY = cosR ? float$1((b / scaleX - sinR) / cosR / OneRadian, 9) : 0;
                rotation = float$1(rotation / OneRadian);
            }
            else {
                scaleX = a;
                scaleY = d;
                rotation = skewX = skewY = 0;
            }
            if (origin = around || origin) {
                x += origin.x * a + origin.y * c;
                y += origin.x * b + origin.y * d;
                if (!around)
                    x -= origin.x, y -= origin.y;
            }
            return { x, y, scaleX, scaleY, rotation, skewX, skewY };
        },
        withScale(t, scaleX, scaleY = scaleX) {
            const world = t;
            if (!scaleX || !scaleY) {
                const { a, b, c, d } = t;
                if (b || c) {
                    scaleX = sqrt$3(a * a + b * b);
                    scaleY = (a * d - b * c) / scaleX;
                }
                else {
                    scaleX = a;
                    scaleY = d;
                }
            }
            world.scaleX = scaleX;
            world.scaleY = scaleY;
            return world;
        },
        reset(t) {
            M$6.set(t);
        }
    };
    const M$6 = MatrixHelper;

    const { toInnerPoint: toInnerPoint$2, toOuterPoint: toOuterPoint$3 } = MatrixHelper;
    const { sin: sin$4, cos: cos$4, abs: abs$4, sqrt: sqrt$2, atan2: atan2$2, min: min$1, PI: PI$3 } = Math;
    const PointHelper = {
        defaultPoint: getPointData(),
        tempPoint: {},
        tempRadiusPoint: {},
        set(t, x = 0, y = 0) {
            t.x = x;
            t.y = y;
        },
        setRadius(t, x, y) {
            t.radiusX = x;
            t.radiusY = y === undefined ? x : y;
        },
        copy(t, point) {
            t.x = point.x;
            t.y = point.y;
        },
        copyFrom(t, x, y) {
            t.x = x;
            t.y = y;
        },
        move(t, x, y) {
            t.x += x;
            t.y += y;
        },
        scale(t, scaleX, scaleY = scaleX) {
            if (t.x)
                t.x *= scaleX;
            if (t.y)
                t.y *= scaleY;
        },
        scaleOf(t, origin, scaleX, scaleY = scaleX) {
            t.x += (t.x - origin.x) * (scaleX - 1);
            t.y += (t.y - origin.y) * (scaleY - 1);
        },
        rotate(t, rotation, origin) {
            if (!origin)
                origin = P$5.defaultPoint;
            rotation *= OneRadian;
            const cosR = cos$4(rotation);
            const sinR = sin$4(rotation);
            const rx = t.x - origin.x;
            const ry = t.y - origin.y;
            t.x = origin.x + rx * cosR - ry * sinR;
            t.y = origin.y + rx * sinR + ry * cosR;
        },
        tempToInnerOf(t, matrix) {
            const { tempPoint: temp } = P$5;
            copy$b(temp, t);
            toInnerPoint$2(matrix, temp, temp);
            return temp;
        },
        tempToOuterOf(t, matrix) {
            const { tempPoint: temp } = P$5;
            copy$b(temp, t);
            toOuterPoint$3(matrix, temp, temp);
            return temp;
        },
        tempToInnerRadiusPointOf(t, matrix) {
            const { tempRadiusPoint: temp } = P$5;
            copy$b(temp, t);
            P$5.toInnerRadiusPointOf(t, matrix, temp);
            return temp;
        },
        toInnerRadiusPointOf(t, matrix, to) {
            to || (to = t);
            toInnerPoint$2(matrix, t, to);
            to.radiusX = Math.abs(t.radiusX / matrix.scaleX);
            to.radiusY = Math.abs(t.radiusY / matrix.scaleY);
        },
        toInnerOf(t, matrix, to) {
            toInnerPoint$2(matrix, t, to);
        },
        toOuterOf(t, matrix, to) {
            toOuterPoint$3(matrix, t, to);
        },
        getCenter(t, to) {
            return { x: t.x + (to.x - t.x) / 2, y: t.y + (to.y - t.y) / 2 };
        },
        getCenterX(x1, x2) {
            return x1 + (x2 - x1) / 2;
        },
        getCenterY(y1, y2) {
            return y1 + (y2 - y1) / 2;
        },
        getDistance(t, point) {
            return getDistanceFrom(t.x, t.y, point.x, point.y);
        },
        getDistanceFrom(x1, y1, x2, y2) {
            const x = abs$4(x2 - x1);
            const y = abs$4(y2 - y1);
            return sqrt$2(x * x + y * y);
        },
        getMinDistanceFrom(x1, y1, x2, y2, x3, y3) {
            return min$1(getDistanceFrom(x1, y1, x2, y2), getDistanceFrom(x2, y2, x3, y3));
        },
        getAngle(t, to) {
            return getAtan2(t, to) / OneRadian;
        },
        getRotation(t, origin, to, toOrigin) {
            if (!toOrigin)
                toOrigin = origin;
            return P$5.getRadianFrom(t.x, t.y, origin.x, origin.y, to.x, to.y, toOrigin.x, toOrigin.y) / OneRadian;
        },
        getRadianFrom(fromX, fromY, originX, originY, toX, toY, toOriginX, toOriginY) {
            if (toOriginX === undefined)
                toOriginX = originX, toOriginY = originY;
            let fromAngle = atan2$2(fromY - originY, fromX - originX);
            let toAngle = atan2$2(toY - toOriginY, toX - toOriginX);
            const radian = toAngle - fromAngle;
            return radian < -PI$3 ? radian + PI2 : radian;
        },
        getAtan2(t, to) {
            return atan2$2(to.y - t.y, to.x - t.x);
        },
        getDistancePoint(t, to, distance, changeTo) {
            const r = getAtan2(t, to);
            to = changeTo ? to : {};
            to.x = t.x + cos$4(r) * distance;
            to.y = t.y + sin$4(r) * distance;
            return to;
        },
        toNumberPoints(originPoints) {
            let points = originPoints;
            if (typeof originPoints[0] === 'object')
                points = [], originPoints.forEach(p => points.push(p.x, p.y));
            return points;
        },
        reset(t) {
            P$5.reset(t);
        }
    };
    const P$5 = PointHelper;
    const { getDistanceFrom, copy: copy$b, getAtan2 } = P$5;

    class Point {
        constructor(x, y) {
            this.set(x, y);
        }
        set(x, y) {
            typeof x === 'object' ? PointHelper.copy(this, x) : PointHelper.set(this, x, y);
            return this;
        }
        get() {
            const { x, y } = this;
            return { x, y };
        }
        clone() {
            return new Point(this);
        }
        move(x, y) {
            PointHelper.move(this, x, y);
            return this;
        }
        scale(scaleX, scaleY) {
            PointHelper.scale(this, scaleX, scaleY);
            return this;
        }
        scaleOf(origin, scaleX, scaleY) {
            PointHelper.scaleOf(this, origin, scaleX, scaleY);
            return this;
        }
        rotate(rotation, origin) {
            PointHelper.rotate(this, rotation, origin);
            return this;
        }
        rotateOf(origin, rotation) {
            PointHelper.rotate(this, rotation, origin);
            return this;
        }
        getRotation(origin, to, toOrigin) {
            return PointHelper.getRotation(this, origin, to, toOrigin);
        }
        toInnerOf(matrix, to) {
            PointHelper.toInnerOf(this, matrix, to);
            return this;
        }
        toOuterOf(matrix, to) {
            PointHelper.toOuterOf(this, matrix, to);
            return this;
        }
        getCenter(to) {
            return new Point(PointHelper.getCenter(this, to));
        }
        getDistance(to) {
            return PointHelper.getDistance(this, to);
        }
        getDistancePoint(to, distance, changeTo) {
            return new Point(PointHelper.getDistancePoint(this, to, distance, changeTo));
        }
        getAngle(to) {
            return PointHelper.getAngle(this, to);
        }
        getAtan2(to) {
            return PointHelper.getAtan2(this, to);
        }
        reset() {
            PointHelper.reset(this);
            return this;
        }
    }
    const tempPoint$3 = new Point();

    class Matrix {
        constructor(a, b, c, d, e, f) {
            this.set(a, b, c, d, e, f);
        }
        set(a, b, c, d, e, f) {
            typeof a === 'object' ? MatrixHelper.copy(this, a) : MatrixHelper.set(this, a, b, c, d, e, f);
            return this;
        }
        setWith(dataWithScale) {
            MatrixHelper.copy(this, dataWithScale);
            this.scaleX = dataWithScale.scaleX;
            this.scaleY = dataWithScale.scaleY;
            return this;
        }
        get() {
            const { a, b, c, d, e, f } = this;
            return { a, b, c, d, e, f };
        }
        clone() {
            return new Matrix(this);
        }
        translate(x, y) {
            MatrixHelper.translate(this, x, y);
            return this;
        }
        translateInner(x, y) {
            MatrixHelper.translateInner(this, x, y);
            return this;
        }
        scale(x, y) {
            MatrixHelper.scale(this, x, y);
            return this;
        }
        scaleWith(x, y) {
            MatrixHelper.scale(this, x, y);
            this.scaleX *= x;
            this.scaleY *= y || x;
            return this;
        }
        scaleOfOuter(origin, x, y) {
            MatrixHelper.scaleOfOuter(this, origin, x, y);
            return this;
        }
        scaleOfInner(origin, x, y) {
            MatrixHelper.scaleOfInner(this, origin, x, y);
            return this;
        }
        rotate(angle) {
            MatrixHelper.rotate(this, angle);
            return this;
        }
        rotateOfOuter(origin, angle) {
            MatrixHelper.rotateOfOuter(this, origin, angle);
            return this;
        }
        rotateOfInner(origin, angle) {
            MatrixHelper.rotateOfInner(this, origin, angle);
            return this;
        }
        skew(x, y) {
            MatrixHelper.skew(this, x, y);
            return this;
        }
        skewOfOuter(origin, x, y) {
            MatrixHelper.skewOfOuter(this, origin, x, y);
            return this;
        }
        skewOfInner(origin, x, y) {
            MatrixHelper.skewOfInner(this, origin, x, y);
            return this;
        }
        multiply(child) {
            MatrixHelper.multiply(this, child);
            return this;
        }
        multiplyParent(parent) {
            MatrixHelper.multiplyParent(this, parent);
            return this;
        }
        divide(child) {
            MatrixHelper.divide(this, child);
            return this;
        }
        divideParent(parent) {
            MatrixHelper.divideParent(this, parent);
            return this;
        }
        invert() {
            MatrixHelper.invert(this);
            return this;
        }
        invertWith() {
            MatrixHelper.invert(this);
            this.scaleX = 1 / this.scaleX;
            this.scaleY = 1 / this.scaleY;
            return this;
        }
        toOuterPoint(inner, to, distance) {
            MatrixHelper.toOuterPoint(this, inner, to, distance);
        }
        toInnerPoint(outer, to, distance) {
            MatrixHelper.toInnerPoint(this, outer, to, distance);
        }
        setLayout(data, origin, around) {
            MatrixHelper.setLayout(this, data, origin, around);
            return this;
        }
        getLayout(origin, around, firstSkewY) {
            return MatrixHelper.getLayout(this, origin, around, firstSkewY);
        }
        withScale(scaleX, scaleY) {
            return MatrixHelper.withScale(this, scaleX, scaleY);
        }
        reset() {
            MatrixHelper.reset(this);
        }
    }
    const tempMatrix = new Matrix();

    const TwoPointBoundsHelper = {
        tempPointBounds: {},
        setPoint(t, minX, minY) {
            t.minX = t.maxX = minX;
            t.minY = t.maxY = minY;
        },
        addPoint(t, x, y) {
            t.minX = x < t.minX ? x : t.minX;
            t.minY = y < t.minY ? y : t.minY;
            t.maxX = x > t.maxX ? x : t.maxX;
            t.maxY = y > t.maxY ? y : t.maxY;
        },
        addBounds(t, x, y, width, height) {
            addPoint$4(t, x, y);
            addPoint$4(t, x + width, y + height);
        },
        copy(t, pb) {
            t.minX = pb.minX;
            t.minY = pb.minY;
            t.maxX = pb.maxX;
            t.maxY = pb.maxY;
        },
        addPointBounds(t, pb) {
            t.minX = pb.minX < t.minX ? pb.minX : t.minX;
            t.minY = pb.minY < t.minY ? pb.minY : t.minY;
            t.maxX = pb.maxX > t.maxX ? pb.maxX : t.maxX;
            t.maxY = pb.maxY > t.maxY ? pb.maxY : t.maxY;
        },
        toBounds(t, setBounds) {
            setBounds.x = t.minX;
            setBounds.y = t.minY;
            setBounds.width = t.maxX - t.minX;
            setBounds.height = t.maxY - t.minY;
        }
    };
    const { addPoint: addPoint$4 } = TwoPointBoundsHelper;

    const { tempPointBounds: tempPointBounds$1, setPoint: setPoint$3, addPoint: addPoint$3, toBounds: toBounds$4 } = TwoPointBoundsHelper;
    const { toOuterPoint: toOuterPoint$2 } = MatrixHelper;
    const { float, fourNumber } = MathHelper;
    const { floor, ceil: ceil$2 } = Math;
    let right$1, bottom$1, boundsRight, boundsBottom;
    const point = {};
    const toPoint$5 = {};
    const BoundsHelper = {
        tempBounds: {},
        set(t, x = 0, y = 0, width = 0, height = 0) {
            t.x = x;
            t.y = y;
            t.width = width;
            t.height = height;
        },
        copy(t, bounds) {
            t.x = bounds.x;
            t.y = bounds.y;
            t.width = bounds.width;
            t.height = bounds.height;
        },
        copyAndSpread(t, bounds, spread, isShrink, side) {
            const { x, y, width, height } = bounds;
            if (spread instanceof Array) {
                const four = fourNumber(spread);
                isShrink
                    ? B.set(t, x + four[3], y + four[0], width - four[1] - four[3], height - four[2] - four[0])
                    : B.set(t, x - four[3], y - four[0], width + four[1] + four[3], height + four[2] + four[0]);
            }
            else {
                if (isShrink)
                    spread = -spread;
                B.set(t, x - spread, y - spread, width + spread * 2, height + spread * 2);
            }
            if (side) {
                if (side === 'width')
                    t.y = y, t.height = height;
                else
                    t.x = x, t.width = width;
            }
        },
        minX(t) { return t.width > 0 ? t.x : t.x + t.width; },
        minY(t) { return t.height > 0 ? t.y : t.y + t.height; },
        maxX(t) { return t.width > 0 ? t.x + t.width : t.x; },
        maxY(t) { return t.height > 0 ? t.y + t.height : t.y; },
        move(t, x, y) {
            t.x += x;
            t.y += y;
        },
        getByMove(t, x, y) {
            t = Object.assign({}, t);
            B.move(t, x, y);
            return t;
        },
        toOffsetOutBounds(t, to, parent) {
            if (!to) {
                to = t;
            }
            else {
                copy$a(to, t);
            }
            if (parent) {
                to.offsetX = -(B.maxX(parent) - t.x);
                to.offsetY = -(B.maxY(parent) - t.y);
            }
            else {
                to.offsetX = t.x + t.width;
                to.offsetY = t.y + t.height;
            }
            B.move(to, -to.offsetX, -to.offsetY);
        },
        scale(t, scaleX, scaleY = scaleX) {
            PointHelper.scale(t, scaleX, scaleY);
            t.width *= scaleX;
            t.height *= scaleY;
        },
        scaleOf(t, origin, scaleX, scaleY = scaleX) {
            PointHelper.scaleOf(t, origin, scaleX, scaleY);
            t.width *= scaleX;
            t.height *= scaleY;
        },
        tempToOuterOf(t, matrix) {
            B.copy(B.tempBounds, t);
            B.toOuterOf(B.tempBounds, matrix);
            return B.tempBounds;
        },
        getOuterOf(t, matrix) {
            t = Object.assign({}, t);
            B.toOuterOf(t, matrix);
            return t;
        },
        toOuterOf(t, matrix, to) {
            to || (to = t);
            if (matrix.b === 0 && matrix.c === 0) {
                const { a, d } = matrix;
                if (a > 0) {
                    to.width = t.width * a;
                    to.x = matrix.e + t.x * a;
                }
                else {
                    to.width = t.width * -a;
                    to.x = matrix.e + t.x * a - to.width;
                }
                if (d > 0) {
                    to.height = t.height * d;
                    to.y = matrix.f + t.y * d;
                }
                else {
                    to.height = t.height * -d;
                    to.y = matrix.f + t.y * d - to.height;
                }
            }
            else {
                point.x = t.x;
                point.y = t.y;
                toOuterPoint$2(matrix, point, toPoint$5);
                setPoint$3(tempPointBounds$1, toPoint$5.x, toPoint$5.y);
                point.x = t.x + t.width;
                toOuterPoint$2(matrix, point, toPoint$5);
                addPoint$3(tempPointBounds$1, toPoint$5.x, toPoint$5.y);
                point.y = t.y + t.height;
                toOuterPoint$2(matrix, point, toPoint$5);
                addPoint$3(tempPointBounds$1, toPoint$5.x, toPoint$5.y);
                point.x = t.x;
                toOuterPoint$2(matrix, point, toPoint$5);
                addPoint$3(tempPointBounds$1, toPoint$5.x, toPoint$5.y);
                toBounds$4(tempPointBounds$1, to);
            }
        },
        toInnerOf(t, matrix, to) {
            to || (to = t);
            B.move(to, -matrix.e, -matrix.f);
            B.scale(to, 1 / matrix.a, 1 / matrix.d);
        },
        getFitMatrix(t, put, baseScale = 1) {
            const scale = Math.min(baseScale, Math.min(t.width / put.width, t.height / put.height));
            return new Matrix(scale, 0, 0, scale, -put.x * scale, -put.y * scale);
        },
        getSpread(t, spread, side) {
            const n = {};
            B.copyAndSpread(n, t, spread, false, side);
            return n;
        },
        spread(t, spread, side) {
            B.copyAndSpread(t, t, spread, false, side);
        },
        shrink(t, shrink, side) {
            B.copyAndSpread(t, t, shrink, true, side);
        },
        ceil(t) {
            const { x, y } = t;
            t.x = floor(t.x);
            t.y = floor(t.y);
            t.width = x > t.x ? ceil$2(t.width + x - t.x) : ceil$2(t.width);
            t.height = y > t.y ? ceil$2(t.height + y - t.y) : ceil$2(t.height);
        },
        unsign(t) {
            if (t.width < 0) {
                t.x += t.width;
                t.width = -t.width;
            }
            if (t.height < 0) {
                t.y += t.height;
                t.height = -t.height;
            }
        },
        float(t, maxLength) {
            t.x = float(t.x, maxLength);
            t.y = float(t.y, maxLength);
            t.width = float(t.width, maxLength);
            t.height = float(t.height, maxLength);
        },
        add(t, bounds, isPoint) {
            right$1 = t.x + t.width;
            bottom$1 = t.y + t.height;
            boundsRight = bounds.x;
            boundsBottom = bounds.y;
            if (!isPoint) {
                boundsRight += bounds.width;
                boundsBottom += bounds.height;
            }
            right$1 = right$1 > boundsRight ? right$1 : boundsRight;
            bottom$1 = bottom$1 > boundsBottom ? bottom$1 : boundsBottom;
            t.x = t.x < bounds.x ? t.x : bounds.x;
            t.y = t.y < bounds.y ? t.y : bounds.y;
            t.width = right$1 - t.x;
            t.height = bottom$1 - t.y;
        },
        addList(t, list) {
            B.setListWithFn(t, list, undefined, true);
        },
        setList(t, list, addMode = false) {
            B.setListWithFn(t, list, undefined, addMode);
        },
        addListWithFn(t, list, boundsDataFn) {
            B.setListWithFn(t, list, boundsDataFn, true);
        },
        setListWithFn(t, list, boundsDataFn, addMode = false) {
            let bounds, first = true;
            for (let i = 0, len = list.length; i < len; i++) {
                bounds = boundsDataFn ? boundsDataFn(list[i]) : list[i];
                if (bounds && (bounds.width || bounds.height)) {
                    if (first) {
                        first = false;
                        if (!addMode)
                            copy$a(t, bounds);
                    }
                    else {
                        add$1(t, bounds);
                    }
                }
            }
            if (first)
                B.reset(t);
        },
        setPoints(t, points) {
            points.forEach((point, index) => index === 0 ? setPoint$3(tempPointBounds$1, point.x, point.y) : addPoint$3(tempPointBounds$1, point.x, point.y));
            toBounds$4(tempPointBounds$1, t);
        },
        setPoint(t, point) {
            B.set(t, point.x, point.y);
        },
        addPoint(t, point) {
            add$1(t, point, true);
        },
        getPoints(t) {
            const { x, y, width, height } = t;
            return [
                { x, y },
                { x: x + width, y },
                { x: x + width, y: y + height },
                { x, y: y + height }
            ];
        },
        hitRadiusPoint(t, point, pointMatrix) {
            if (pointMatrix)
                point = PointHelper.tempToInnerRadiusPointOf(point, pointMatrix);
            return (point.x >= t.x - point.radiusX && point.x <= t.x + t.width + point.radiusX) && (point.y >= t.y - point.radiusY && point.y <= t.y + t.height + point.radiusY);
        },
        hitPoint(t, point, pointMatrix) {
            if (pointMatrix)
                point = PointHelper.tempToInnerOf(point, pointMatrix);
            return (point.x >= t.x && point.x <= t.x + t.width) && (point.y >= t.y && point.y <= t.y + t.height);
        },
        hit(t, other, otherMatrix) {
            if (otherMatrix)
                other = B.tempToOuterOf(other, otherMatrix);
            return !((t.y + t.height < other.y) || (other.y + other.height < t.y) || (t.x + t.width < other.x) || (other.x + other.width < t.x));
        },
        includes(t, other, otherMatrix) {
            if (otherMatrix)
                other = B.tempToOuterOf(other, otherMatrix);
            return (t.x <= other.x) && (t.y <= other.y) && (t.x + t.width >= other.x + other.width) && (t.y + t.height >= other.y + other.height);
        },
        getIntersectData(t, other, otherMatrix) {
            if (otherMatrix)
                other = B.tempToOuterOf(other, otherMatrix);
            if (!B.hit(t, other))
                return getBoundsData();
            let { x, y, width, height } = other;
            right$1 = x + width;
            bottom$1 = y + height;
            boundsRight = t.x + t.width;
            boundsBottom = t.y + t.height;
            x = x > t.x ? x : t.x;
            y = y > t.y ? y : t.y;
            right$1 = right$1 < boundsRight ? right$1 : boundsRight;
            bottom$1 = bottom$1 < boundsBottom ? bottom$1 : boundsBottom;
            width = right$1 - x;
            height = bottom$1 - y;
            return { x, y, width, height };
        },
        intersect(t, other, otherMatrix) {
            B.copy(t, B.getIntersectData(t, other, otherMatrix));
        },
        isSame(t, bounds) {
            return t.x === bounds.x && t.y === bounds.y && t.width === bounds.width && t.height === bounds.height;
        },
        isEmpty(t) {
            return t.x === 0 && t.y === 0 && t.width === 0 && t.height === 0;
        },
        reset(t) {
            B.set(t);
        }
    };
    const B = BoundsHelper;
    const { add: add$1, copy: copy$a } = B;

    class Bounds {
        get minX() { return BoundsHelper.minX(this); }
        get minY() { return BoundsHelper.minY(this); }
        get maxX() { return BoundsHelper.maxX(this); }
        get maxY() { return BoundsHelper.maxY(this); }
        constructor(x, y, width, height) {
            this.set(x, y, width, height);
        }
        set(x, y, width, height) {
            typeof x === 'object' ? BoundsHelper.copy(this, x) : BoundsHelper.set(this, x, y, width, height);
            return this;
        }
        get() {
            const { x, y, width, height } = this;
            return { x, y, width, height };
        }
        clone() {
            return new Bounds(this);
        }
        move(x, y) {
            BoundsHelper.move(this, x, y);
            return this;
        }
        scale(scaleX, scaleY) {
            BoundsHelper.scale(this, scaleX, scaleY);
            return this;
        }
        scaleOf(origin, scaleX, scaleY) {
            BoundsHelper.scaleOf(this, origin, scaleX, scaleY);
            return this;
        }
        toOuterOf(matrix, to) {
            BoundsHelper.toOuterOf(this, matrix, to);
            return this;
        }
        toInnerOf(matrix, to) {
            BoundsHelper.toInnerOf(this, matrix, to);
            return this;
        }
        getFitMatrix(put, baseScale) {
            return BoundsHelper.getFitMatrix(this, put, baseScale);
        }
        spread(fourNumber, side) {
            BoundsHelper.spread(this, fourNumber, side);
            return this;
        }
        shrink(fourNumber, side) {
            BoundsHelper.shrink(this, fourNumber, side);
            return this;
        }
        ceil() {
            BoundsHelper.ceil(this);
            return this;
        }
        unsign() {
            BoundsHelper.unsign(this);
            return this;
        }
        float(maxLength) {
            BoundsHelper.float(this, maxLength);
            return this;
        }
        add(bounds) {
            BoundsHelper.add(this, bounds);
            return this;
        }
        addList(boundsList) {
            BoundsHelper.setList(this, boundsList, true);
            return this;
        }
        setList(boundsList) {
            BoundsHelper.setList(this, boundsList);
            return this;
        }
        addListWithFn(list, boundsDataFn) {
            BoundsHelper.setListWithFn(this, list, boundsDataFn, true);
            return this;
        }
        setListWithFn(list, boundsDataFn) {
            BoundsHelper.setListWithFn(this, list, boundsDataFn);
            return this;
        }
        setPoint(point) {
            BoundsHelper.setPoint(this, point);
            return this;
        }
        setPoints(points) {
            BoundsHelper.setPoints(this, points);
            return this;
        }
        addPoint(point) {
            BoundsHelper.addPoint(this, point);
            return this;
        }
        getPoints() {
            return BoundsHelper.getPoints(this);
        }
        hitPoint(point, pointMatrix) {
            return BoundsHelper.hitPoint(this, point, pointMatrix);
        }
        hitRadiusPoint(point, pointMatrix) {
            return BoundsHelper.hitRadiusPoint(this, point, pointMatrix);
        }
        hit(bounds, boundsMatrix) {
            return BoundsHelper.hit(this, bounds, boundsMatrix);
        }
        includes(bounds, boundsMatrix) {
            return BoundsHelper.includes(this, bounds, boundsMatrix);
        }
        intersect(bounds, boundsMatrix) {
            BoundsHelper.intersect(this, bounds, boundsMatrix);
            return this;
        }
        getIntersect(bounds, boundsMatrix) {
            return new Bounds(BoundsHelper.getIntersectData(this, bounds, boundsMatrix));
        }
        isSame(bounds) {
            return BoundsHelper.isSame(this, bounds);
        }
        isEmpty() {
            return BoundsHelper.isEmpty(this);
        }
        reset() {
            BoundsHelper.reset(this);
        }
    }
    const tempBounds$1 = new Bounds();

    class AutoBounds {
        constructor(top, right, bottom, left, width, height) {
            typeof top === 'object' ? this.copy(top) : this.set(top, right, bottom, left, width, height);
        }
        set(top = 0, right = 0, bottom = 0, left = 0, width = 0, height = 0) {
            this.top = top;
            this.right = right;
            this.bottom = bottom;
            this.left = left;
            this.width = width;
            this.height = height;
        }
        copy(autoSize) {
            const { top, right, bottom, left, width, height } = autoSize;
            this.set(top, right, bottom, left, width, height);
        }
        getBoundsFrom(parent) {
            const { top, right, bottom, left, width, height } = this;
            return new Bounds(left, top, width ? width : parent.width - left - right, height ? height : parent.height - top - bottom);
        }
    }

    exports.Direction4 = void 0;
    (function (Direction4) {
        Direction4[Direction4["top"] = 0] = "top";
        Direction4[Direction4["right"] = 1] = "right";
        Direction4[Direction4["bottom"] = 2] = "bottom";
        Direction4[Direction4["left"] = 3] = "left";
    })(exports.Direction4 || (exports.Direction4 = {}));
    exports.Direction9 = void 0;
    (function (Direction9) {
        Direction9[Direction9["topLeft"] = 0] = "topLeft";
        Direction9[Direction9["top"] = 1] = "top";
        Direction9[Direction9["topRight"] = 2] = "topRight";
        Direction9[Direction9["right"] = 3] = "right";
        Direction9[Direction9["bottomRight"] = 4] = "bottomRight";
        Direction9[Direction9["bottom"] = 5] = "bottom";
        Direction9[Direction9["bottomLeft"] = 6] = "bottomLeft";
        Direction9[Direction9["left"] = 7] = "left";
        Direction9[Direction9["center"] = 8] = "center";
        Direction9[Direction9["top-left"] = 0] = "top-left";
        Direction9[Direction9["top-right"] = 2] = "top-right";
        Direction9[Direction9["bottom-right"] = 4] = "bottom-right";
        Direction9[Direction9["bottom-left"] = 6] = "bottom-left";
    })(exports.Direction9 || (exports.Direction9 = {}));

    const directionData = [
        { x: 0, y: 0 },
        { x: 0.5, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 0.5 },
        { x: 1, y: 1 },
        { x: 0.5, y: 1 },
        { x: 0, y: 1 },
        { x: 0, y: 0.5 },
        { x: 0.5, y: 0.5 }
    ];
    directionData.forEach(item => item.type = 'percent');
    const AroundHelper = {
        directionData,
        tempPoint: {},
        get: get$4,
        toPoint(around, bounds, to, onlySize, pointBounds) {
            const point = get$4(around);
            to.x = point.x;
            to.y = point.y;
            if (point.type === 'percent') {
                to.x *= bounds.width;
                to.y *= bounds.height;
                if (pointBounds) {
                    to.x -= pointBounds.x;
                    to.y -= pointBounds.y;
                    if (point.x)
                        to.x -= (point.x === 1) ? pointBounds.width : (point.x === 0.5 ? point.x * pointBounds.width : 0);
                    if (point.y)
                        to.y -= (point.y === 1) ? pointBounds.height : (point.y === 0.5 ? point.y * pointBounds.height : 0);
                }
            }
            if (!onlySize) {
                to.x += bounds.x;
                to.y += bounds.y;
            }
        }
    };
    function get$4(around) {
        return typeof around === 'string' ? directionData[exports.Direction9[around]] : around;
    }

    const { toPoint: toPoint$4 } = AroundHelper;
    const AlignHelper = {
        toPoint(align, contentBounds, bounds, to, onlySize) {
            toPoint$4(align, bounds, to, onlySize, contentBounds);
        }
    };

    const StringNumberMap = {
        '0': 1,
        '1': 1,
        '2': 1,
        '3': 1,
        '4': 1,
        '5': 1,
        '6': 1,
        '7': 1,
        '8': 1,
        '9': 1,
        '.': 1,
        'e': 1,
        'E': 1
    };

    class Debug {
        constructor(name) {
            this.repeatMap = {};
            this.name = name;
        }
        static get(name) {
            return new Debug(name);
        }
        static set filter(name) {
            this.filterList = getNameList(name);
        }
        static set exclude(name) {
            this.excludeList = getNameList(name);
        }
        log(...messages) {
            if (D$4.enable) {
                if (D$4.filterList.length && D$4.filterList.every(name => name !== this.name))
                    return;
                if (D$4.excludeList.length && D$4.excludeList.some(name => name === this.name))
                    return;
                console.log('%c' + this.name, 'color:#21ae62', ...messages);
            }
        }
        tip(...messages) {
            if (D$4.enable)
                this.warn(...messages);
        }
        warn(...messages) {
            if (D$4.showWarn)
                console.warn(this.name, ...messages);
        }
        repeat(name, ...messages) {
            if (!this.repeatMap[name]) {
                this.warn('repeat:' + name, ...messages);
                this.repeatMap[name] = true;
            }
        }
        error(...messages) {
            try {
                throw new Error();
            }
            catch (e) {
                console.error(this.name, ...messages, e);
            }
        }
    }
    Debug.filterList = [];
    Debug.excludeList = [];
    Debug.showWarn = true;
    function getNameList(name) {
        if (!name)
            name = [];
        else if (typeof name === 'string')
            name = [name];
        return name;
    }
    const D$4 = Debug;

    const debug$g = Debug.get('RunTime');
    const Run = {
        currentId: 0,
        currentName: '',
        idMap: {},
        nameMap: {},
        nameToIdMap: {},
        start(name, microsecond) {
            const id = IncrementId.create(IncrementId.RUNTIME);
            R.currentId = R.idMap[id] = microsecond ? performance.now() : Date.now();
            R.currentName = R.nameMap[id] = name;
            R.nameToIdMap[name] = id;
            return id;
        },
        end(id, microsecond) {
            const time = R.idMap[id], name = R.nameMap[id];
            const duration = microsecond ? (performance.now() - time) / 1000 : Date.now() - time;
            R.idMap[id] = R.nameMap[id] = R.nameToIdMap[name] = undefined;
            debug$g.log(name, duration, 'ms');
        },
        endOfName(name, microsecond) {
            const id = R.nameToIdMap[name];
            if (id !== undefined)
                R.end(id, microsecond);
        }
    };
    const R = Run;

    function needPlugin(name) {
        console.error('need plugin: @leafer-in/' + name);
    }

    const debug$f = Debug.get('UICreator');
    const UICreator = {
        list: {},
        register(UI) {
            const { __tag: tag } = UI.prototype;
            if (list$2[tag]) {
                debug$f.repeat(tag);
            }
            else {
                list$2[tag] = UI;
            }
        },
        get(tag, data, x, y, width, height) {
            const ui = new list$2[tag](data);
            if (x !== undefined) {
                ui.x = x;
                if (y)
                    ui.y = y;
                if (width)
                    ui.width = width;
                if (height)
                    ui.height = height;
            }
            return ui;
        }
    };
    const { list: list$2 } = UICreator;

    const debug$e = Debug.get('EventCreator');
    const EventCreator = {
        nameList: {},
        register(Event) {
            let name;
            Object.keys(Event).forEach(key => {
                name = Event[key];
                if (typeof name === 'string')
                    nameList[name] ? debug$e.repeat(name) : nameList[name] = Event;
            });
        },
        changeName(oldName, newName) {
            const Event = nameList[oldName];
            if (Event) {
                const constName = Object.keys(Event).find(key => Event[key] === oldName);
                if (constName) {
                    Event[constName] = newName;
                    nameList[newName] = Event;
                }
            }
        },
        has(type) {
            return !!this.nameList[type];
        },
        get(type, ...params) {
            return new nameList[type](...params);
        }
    };
    const { nameList } = EventCreator;

    class CanvasManager {
        constructor() {
            this.list = [];
        }
        add(canvas) {
            canvas.manager = this;
            this.list.push(canvas);
        }
        get(size) {
            let old;
            const { list } = this;
            for (let i = 0, len = list.length; i < len; i++) {
                old = list[i];
                if (old.recycled && old.isSameSize(size)) {
                    old.recycled = false;
                    old.manager || (old.manager = this);
                    return old;
                }
            }
            const canvas = Creator.canvas(size);
            this.add(canvas);
            return canvas;
        }
        recycle(old) {
            old.recycled = true;
        }
        clearRecycled() {
            let canvas;
            const filter = [];
            for (let i = 0, len = this.list.length; i < len; i++) {
                canvas = this.list[i];
                canvas.recycled ? canvas.destroy() : filter.push(canvas);
            }
            this.list = filter;
        }
        clear() {
            this.list.forEach(item => { item.destroy(); });
            this.list.length = 0;
        }
        destroy() {
            this.clear();
        }
    }

    const DataHelper = {
        default(t, defaultData) {
            assign(defaultData, t);
            assign(t, defaultData);
            return t;
        },
        assign(t, merge) {
            let value;
            Object.keys(merge).forEach(key => {
                var _a;
                value = merge[key];
                if ((value === null || value === void 0 ? void 0 : value.constructor) === Object) {
                    (((_a = t[key]) === null || _a === void 0 ? void 0 : _a.constructor) === Object) ? assign(t[key], merge[key]) : t[key] = merge[key];
                }
                else {
                    t[key] = merge[key];
                }
            });
        },
        copyAttrs(t, from, include) {
            include.forEach(key => {
                if (from[key] !== undefined)
                    t[key] = from[key];
            });
            return t;
        },
        clone(data) {
            return JSON.parse(JSON.stringify(data));
        },
        toMap(list) {
            const map = {};
            for (let i = 0, len = list.length; i < len; i++)
                map[list[i]] = true;
            return map;
        }
    };
    const { assign } = DataHelper;

    class LeafData {
        get __useNaturalRatio() { return true; }
        get __isLinePath() {
            const { path } = this;
            return path && path.length === 6 && path[0] === 1;
        }
        get __blendMode() {
            if (this.eraser && this.eraser !== 'path')
                return 'destination-out';
            const { blendMode } = this;
            return blendMode === 'pass-through' ? null : blendMode;
        }
        constructor(leaf) {
            this.__leaf = leaf;
        }
        __get(name) {
            if (this.__input) {
                const value = this.__input[name];
                if (value !== undefined)
                    return value;
            }
            return this[name];
        }
        __getData() {
            const data = { tag: this.__leaf.tag }, { __input } = this;
            let inputValue;
            for (let key in this) {
                if (key[0] !== '_') {
                    inputValue = __input ? __input[key] : undefined;
                    data[key] = (inputValue === undefined) ? this[key] : inputValue;
                }
            }
            return data;
        }
        __setInput(name, value) {
            this.__input || (this.__input = {});
            this.__input[name] = value;
        }
        __getInput(name) {
            if (this.__input) {
                const value = this.__input[name];
                if (value !== undefined)
                    return value;
            }
            if (name === 'path' && !this.__pathInputed)
                return;
            return this['_' + name];
        }
        __removeInput(name) {
            if (this.__input && this.__input[name] !== undefined)
                this.__input[name] = undefined;
        }
        __getInputData(names, options) {
            const data = {};
            if (names) {
                if (names instanceof Array) {
                    for (let name of names)
                        data[name] = this.__getInput(name);
                }
                else {
                    for (let name in names)
                        data[name] = this.__getInput(name);
                }
            }
            else {
                let value, inputValue, { __input } = this;
                data.tag = this.__leaf.tag;
                for (let key in this) {
                    if (key[0] !== '_') {
                        value = this['_' + key];
                        if (value !== undefined) {
                            if (key === 'path' && !this.__pathInputed)
                                continue;
                            inputValue = __input ? __input[key] : undefined;
                            data[key] = (inputValue === undefined) ? value : inputValue;
                        }
                    }
                }
            }
            if (options) {
                if (options.matrix) {
                    const { a, b, c, d, e, f } = this.__leaf.__localMatrix;
                    data.matrix = { a, b, c, d, e, f };
                }
            }
            return data;
        }
        __setMiddle(name, value) {
            this.__middle || (this.__middle = {});
            this.__middle[name] = value;
        }
        __getMiddle(name) {
            return this.__middle && this.__middle[name];
        }
        __checkSingle() {
            const t = this;
            if (t.blendMode === 'pass-through') {
                const leaf = this.__leaf;
                if ((t.opacity < 1 && leaf.isBranch) || leaf.__hasEraser || t.eraser) {
                    t.__single = true;
                }
                else if (t.__single) {
                    t.__single = false;
                }
            }
            else {
                t.__single = true;
            }
        }
        __removeNaturalSize() {
            this.__naturalWidth = this.__naturalHeight = undefined;
        }
        destroy() {
            this.__input = this.__middle = null;
        }
    }

    exports.Answer = void 0;
    (function (Answer) {
        Answer[Answer["No"] = 0] = "No";
        Answer[Answer["Yes"] = 1] = "Yes";
        Answer[Answer["NoAndSkip"] = 2] = "NoAndSkip";
        Answer[Answer["YesAndSkip"] = 3] = "YesAndSkip";
    })(exports.Answer || (exports.Answer = {}));
    const emptyData = {};
    function isNull(value) {
        return value === undefined || value === null;
    }

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

    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
    };

    function contextAttr(realName) {
        return (target, key) => {
            if (!realName)
                realName = key;
            Object.defineProperty(target, key, {
                get() { return this.context[realName]; },
                set(value) { this.context[realName] = value; }
            });
        };
    }
    const contextMethodNameList = [];
    function contextMethod() {
        return (_target, key) => {
            contextMethodNameList.push(key);
        };
    }
    const emptyArray = [];
    class Canvas {
        set blendMode(value) {
            if (value === 'normal')
                value = 'source-over';
            this.context.globalCompositeOperation = value;
        }
        get blendMode() {
            return this.context.globalCompositeOperation;
        }
        set dashPattern(value) {
            this.context.setLineDash(value || emptyArray);
        }
        get dashPattern() {
            return this.context.getLineDash();
        }
        __bindContext() {
            let method;
            contextMethodNameList.forEach(name => {
                method = this.context[name];
                if (method)
                    this[name] = method.bind(this.context);
            });
            this.textBaseline = "alphabetic";
        }
        setTransform(_a, _b, _c, _d, _e, _f) { }
        resetTransform() { }
        getTransform() { return void 0; }
        save() { }
        restore() { }
        transform(a, b, c, d, e, f) {
            if (typeof a === 'object') {
                this.context.transform(a.a, a.b, a.c, a.d, a.e, a.f);
            }
            else {
                this.context.transform(a, b, c, d, e, f);
            }
        }
        translate(_x, _y) { }
        scale(_x, _y) { }
        rotate(_angle) { }
        fill(_path2d, _rule) { }
        stroke(_path2d) { }
        clip(_path2d, _rule) { }
        fillRect(_x, _y, _width, _height) { }
        strokeRect(_x, _y, _width, _height) { }
        clearRect(_x, _y, _width, _height) { }
        drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh) {
            switch (arguments.length) {
                case 9:
                    if (sx < 0) {
                        const d = (-sx / sw) * dw;
                        sw += sx;
                        sx = 0;
                        dx += d;
                        dw -= d;
                    }
                    if (sy < 0) {
                        const d = (-sy / sh) * dh;
                        sh += sy;
                        sy = 0;
                        dy += d;
                        dh -= d;
                    }
                    this.context.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
                    break;
                case 5:
                    this.context.drawImage(image, sx, sy, sw, sh);
                    break;
                case 3:
                    this.context.drawImage(image, sx, sy);
            }
        }
        beginPath() { }
        moveTo(_x, _y) { }
        lineTo(_x, _y) { }
        bezierCurveTo(_cp1x, _cp1y, _cp2x, _cp2y, _x, _y) { }
        quadraticCurveTo(_cpx, _cpy, _x, _y) { }
        closePath() { }
        arc(_x, _y, _radius, _startAngle, _endAngle, _anticlockwise) { }
        arcTo(_x1, _y1, _x2, _y2, _radius) { }
        ellipse(_x, _y, _radiusX, _radiusY, _rotation, _startAngle, _endAngle, _anticlockwise) { }
        rect(_x, _y, _width, _height) { }
        roundRect(_x, _y, _width, _height, _radius) { }
        createConicGradient(_startAngle, _x, _y) { return void 0; }
        createLinearGradient(_x0, _y0, _x1, _y1) { return void 0; }
        createPattern(_image, _repetition) { return void 0; }
        createRadialGradient(_x0, _y0, _r0, _x1, _y1, _r1) { return void 0; }
        fillText(_text, _x, _y, _maxWidth) { }
        measureText(_text) { return void 0; }
        strokeText(_text, _x, _y, _maxWidth) { }
        destroy() {
            this.context = null;
        }
    }
    __decorate([
        contextAttr('imageSmoothingEnabled')
    ], Canvas.prototype, "smooth", void 0);
    __decorate([
        contextAttr('imageSmoothingQuality')
    ], Canvas.prototype, "smoothLevel", void 0);
    __decorate([
        contextAttr('globalAlpha')
    ], Canvas.prototype, "opacity", void 0);
    __decorate([
        contextAttr()
    ], Canvas.prototype, "fillStyle", void 0);
    __decorate([
        contextAttr()
    ], Canvas.prototype, "strokeStyle", void 0);
    __decorate([
        contextAttr('lineWidth')
    ], Canvas.prototype, "strokeWidth", void 0);
    __decorate([
        contextAttr('lineCap')
    ], Canvas.prototype, "strokeCap", void 0);
    __decorate([
        contextAttr('lineJoin')
    ], Canvas.prototype, "strokeJoin", void 0);
    __decorate([
        contextAttr('lineDashOffset')
    ], Canvas.prototype, "dashOffset", void 0);
    __decorate([
        contextAttr()
    ], Canvas.prototype, "miterLimit", void 0);
    __decorate([
        contextAttr()
    ], Canvas.prototype, "shadowBlur", void 0);
    __decorate([
        contextAttr()
    ], Canvas.prototype, "shadowColor", void 0);
    __decorate([
        contextAttr()
    ], Canvas.prototype, "shadowOffsetX", void 0);
    __decorate([
        contextAttr()
    ], Canvas.prototype, "shadowOffsetY", void 0);
    __decorate([
        contextAttr()
    ], Canvas.prototype, "filter", void 0);
    __decorate([
        contextAttr()
    ], Canvas.prototype, "font", void 0);
    __decorate([
        contextAttr()
    ], Canvas.prototype, "fontKerning", void 0);
    __decorate([
        contextAttr()
    ], Canvas.prototype, "fontStretch", void 0);
    __decorate([
        contextAttr()
    ], Canvas.prototype, "fontVariantCaps", void 0);
    __decorate([
        contextAttr()
    ], Canvas.prototype, "textAlign", void 0);
    __decorate([
        contextAttr()
    ], Canvas.prototype, "textBaseline", void 0);
    __decorate([
        contextAttr()
    ], Canvas.prototype, "textRendering", void 0);
    __decorate([
        contextAttr()
    ], Canvas.prototype, "wordSpacing", void 0);
    __decorate([
        contextAttr()
    ], Canvas.prototype, "letterSpacing", void 0);
    __decorate([
        contextAttr()
    ], Canvas.prototype, "direction", void 0);
    __decorate([
        contextMethod()
    ], Canvas.prototype, "setTransform", null);
    __decorate([
        contextMethod()
    ], Canvas.prototype, "resetTransform", null);
    __decorate([
        contextMethod()
    ], Canvas.prototype, "getTransform", null);
    __decorate([
        contextMethod()
    ], Canvas.prototype, "save", null);
    __decorate([
        contextMethod()
    ], Canvas.prototype, "restore", null);
    __decorate([
        contextMethod()
    ], Canvas.prototype, "translate", null);
    __decorate([
        contextMethod()
    ], Canvas.prototype, "scale", null);
    __decorate([
        contextMethod()
    ], Canvas.prototype, "rotate", null);
    __decorate([
        contextMethod()
    ], Canvas.prototype, "fill", null);
    __decorate([
        contextMethod()
    ], Canvas.prototype, "stroke", null);
    __decorate([
        contextMethod()
    ], Canvas.prototype, "clip", null);
    __decorate([
        contextMethod()
    ], Canvas.prototype, "fillRect", null);
    __decorate([
        contextMethod()
    ], Canvas.prototype, "strokeRect", null);
    __decorate([
        contextMethod()
    ], Canvas.prototype, "clearRect", null);
    __decorate([
        contextMethod()
    ], Canvas.prototype, "beginPath", null);
    __decorate([
        contextMethod()
    ], Canvas.prototype, "moveTo", null);
    __decorate([
        contextMethod()
    ], Canvas.prototype, "lineTo", null);
    __decorate([
        contextMethod()
    ], Canvas.prototype, "bezierCurveTo", null);
    __decorate([
        contextMethod()
    ], Canvas.prototype, "quadraticCurveTo", null);
    __decorate([
        contextMethod()
    ], Canvas.prototype, "closePath", null);
    __decorate([
        contextMethod()
    ], Canvas.prototype, "arc", null);
    __decorate([
        contextMethod()
    ], Canvas.prototype, "arcTo", null);
    __decorate([
        contextMethod()
    ], Canvas.prototype, "ellipse", null);
    __decorate([
        contextMethod()
    ], Canvas.prototype, "rect", null);
    __decorate([
        contextMethod()
    ], Canvas.prototype, "roundRect", null);
    __decorate([
        contextMethod()
    ], Canvas.prototype, "createConicGradient", null);
    __decorate([
        contextMethod()
    ], Canvas.prototype, "createLinearGradient", null);
    __decorate([
        contextMethod()
    ], Canvas.prototype, "createPattern", null);
    __decorate([
        contextMethod()
    ], Canvas.prototype, "createRadialGradient", null);
    __decorate([
        contextMethod()
    ], Canvas.prototype, "fillText", null);
    __decorate([
        contextMethod()
    ], Canvas.prototype, "measureText", null);
    __decorate([
        contextMethod()
    ], Canvas.prototype, "strokeText", null);

    const { copy: copy$9 } = MatrixHelper;
    const minSize = { width: 1, height: 1, pixelRatio: 1 };
    const canvasSizeAttrs = ['width', 'height', 'pixelRatio'];
    class LeaferCanvasBase extends Canvas {
        get width() { return this.size.width; }
        get height() { return this.size.height; }
        get pixelRatio() { return this.size.pixelRatio; }
        get pixelWidth() { return this.width * this.pixelRatio; }
        get pixelHeight() { return this.height * this.pixelRatio; }
        get allowBackgroundColor() { return this.view && this.parentView; }
        constructor(config, manager) {
            super();
            this.size = {};
            this.worldTransform = {};
            if (!config)
                config = minSize;
            if (!config.pixelRatio)
                config.pixelRatio = Platform.devicePixelRatio;
            this.manager = manager;
            this.innerId = IncrementId.create(IncrementId.CNAVAS);
            const { width, height, pixelRatio } = config;
            this.autoLayout = !width || !height;
            this.size.pixelRatio = pixelRatio;
            this.config = config;
            this.init();
        }
        init() { }
        __createContext() {
            const { view } = this;
            const { contextSettings } = this.config;
            this.context = contextSettings ? view.getContext('2d', contextSettings) : view.getContext('2d');
            this.__bindContext();
        }
        export(_filename, _options) { return undefined; }
        toBlob(_type, _quality) { return undefined; }
        toDataURL(_type, _quality) { return undefined; }
        saveAs(_filename, _quality) { return undefined; }
        resize(size) {
            if (this.isSameSize(size))
                return;
            let takeCanvas;
            if (this.context && !this.unreal && this.width) {
                takeCanvas = this.getSameCanvas();
                takeCanvas.copyWorld(this);
            }
            DataHelper.copyAttrs(this.size, size, canvasSizeAttrs);
            this.size.pixelRatio || (this.size.pixelRatio = 1);
            this.bounds = new Bounds(0, 0, this.width, this.height);
            if (this.context && !this.unreal) {
                this.updateViewSize();
                this.smooth = this.config.smooth;
            }
            this.updateClientBounds();
            if (this.context && !this.unreal && takeCanvas) {
                this.clearWorld(takeCanvas.bounds);
                this.copyWorld(takeCanvas);
                takeCanvas.recycle();
            }
        }
        updateViewSize() { }
        updateClientBounds() { }
        getClientBounds(update) {
            if (update)
                this.updateClientBounds();
            return this.clientBounds || this.bounds;
        }
        startAutoLayout(_autoBounds, _listener) { }
        stopAutoLayout() { }
        setCursor(_cursor) { }
        setWorld(matrix, parentMatrix) {
            const { pixelRatio } = this;
            const w = this.worldTransform;
            if (parentMatrix) {
                const { a, b, c, d, e, f } = parentMatrix;
                this.setTransform(w.a = ((matrix.a * a) + (matrix.b * c)) * pixelRatio, w.b = ((matrix.a * b) + (matrix.b * d)) * pixelRatio, w.c = ((matrix.c * a) + (matrix.d * c)) * pixelRatio, w.d = ((matrix.c * b) + (matrix.d * d)) * pixelRatio, w.e = (((matrix.e * a) + (matrix.f * c) + e)) * pixelRatio, w.f = (((matrix.e * b) + (matrix.f * d) + f)) * pixelRatio);
            }
            else {
                this.setTransform(w.a = matrix.a * pixelRatio, w.b = matrix.b * pixelRatio, w.c = matrix.c * pixelRatio, w.d = matrix.d * pixelRatio, w.e = matrix.e * pixelRatio, w.f = matrix.f * pixelRatio);
            }
        }
        useWorldTransform(worldTransform) {
            if (worldTransform)
                this.worldTransform = worldTransform;
            const w = this.worldTransform;
            if (w)
                this.setTransform(w.a, w.b, w.c, w.d, w.e, w.f);
        }
        setStroke(color, strokeWidth, options) {
            if (strokeWidth)
                this.strokeWidth = strokeWidth;
            if (color)
                this.strokeStyle = color;
            if (options)
                this.setStrokeOptions(options);
        }
        setStrokeOptions(options) {
            this.strokeCap = options.strokeCap === 'none' ? 'butt' : options.strokeCap;
            this.strokeJoin = options.strokeJoin;
            this.dashPattern = options.dashPattern;
            this.dashOffset = options.dashOffset;
            this.miterLimit = options.miterLimit;
        }
        saveBlendMode(blendMode) {
            this.savedBlendMode = this.blendMode;
            this.blendMode = blendMode;
        }
        restoreBlendMode() {
            this.blendMode = this.savedBlendMode;
        }
        hitFill(_point, _fillRule) { return true; }
        hitStroke(_point, _strokeWidth) { return true; }
        hitPixel(_radiusPoint, _offset, _scale = 1) { return true; }
        setWorldShadow(x, y, blur, color) {
            const { pixelRatio } = this;
            this.shadowOffsetX = x * pixelRatio;
            this.shadowOffsetY = y * pixelRatio;
            this.shadowBlur = blur * pixelRatio;
            this.shadowColor = color || 'black';
        }
        setWorldBlur(blur) {
            const { pixelRatio } = this;
            this.filter = `blur(${blur * pixelRatio}px)`;
        }
        copyWorld(canvas, from, to, blendMode) {
            if (blendMode)
                this.blendMode = blendMode;
            if (from) {
                const { pixelRatio } = this;
                if (!to)
                    to = from;
                this.drawImage(canvas.view, from.x * pixelRatio, from.y * pixelRatio, from.width * pixelRatio, from.height * pixelRatio, to.x * pixelRatio, to.y * pixelRatio, to.width * pixelRatio, to.height * pixelRatio);
            }
            else {
                this.drawImage(canvas.view, 0, 0);
            }
            if (blendMode)
                this.blendMode = 'source-over';
        }
        copyWorldToInner(canvas, fromWorld, toInnerBounds, blendMode) {
            if (blendMode)
                this.blendMode = blendMode;
            if (fromWorld.b || fromWorld.c) {
                this.save();
                this.resetTransform();
                this.copyWorld(canvas, fromWorld, BoundsHelper.tempToOuterOf(toInnerBounds, fromWorld));
                this.restore();
            }
            else {
                const { pixelRatio } = this;
                this.drawImage(canvas.view, fromWorld.x * pixelRatio, fromWorld.y * pixelRatio, fromWorld.width * pixelRatio, fromWorld.height * pixelRatio, toInnerBounds.x, toInnerBounds.y, toInnerBounds.width, toInnerBounds.height);
            }
            if (blendMode)
                this.blendMode = 'source-over';
        }
        copyWorldByReset(canvas, from, to, blendMode, onlyResetTransform) {
            this.resetTransform();
            this.copyWorld(canvas, from, to, blendMode);
            if (!onlyResetTransform)
                this.useWorldTransform();
        }
        useMask(maskCanvas, fromBounds, toBounds) {
            this.copyWorld(maskCanvas, fromBounds, toBounds, 'destination-in');
        }
        useEraser(eraserCanvas, fromBounds, toBounds) {
            this.copyWorld(eraserCanvas, fromBounds, toBounds, 'destination-out');
        }
        fillWorld(bounds, color, blendMode) {
            if (blendMode)
                this.blendMode = blendMode;
            this.fillStyle = color;
            tempBounds$1.set(bounds).scale(this.pixelRatio);
            this.fillRect(tempBounds$1.x, tempBounds$1.y, tempBounds$1.width, tempBounds$1.height);
            if (blendMode)
                this.blendMode = 'source-over';
        }
        strokeWorld(bounds, color, blendMode) {
            if (blendMode)
                this.blendMode = blendMode;
            this.strokeStyle = color;
            tempBounds$1.set(bounds).scale(this.pixelRatio);
            this.strokeRect(tempBounds$1.x, tempBounds$1.y, tempBounds$1.width, tempBounds$1.height);
            if (blendMode)
                this.blendMode = 'source-over';
        }
        clearWorld(bounds, ceilPixel) {
            tempBounds$1.set(bounds).scale(this.pixelRatio);
            if (ceilPixel)
                tempBounds$1.ceil();
            this.clearRect(tempBounds$1.x, tempBounds$1.y, tempBounds$1.width, tempBounds$1.height);
        }
        clipWorld(bounds, ceilPixel) {
            this.beginPath();
            tempBounds$1.set(bounds).scale(this.pixelRatio);
            if (ceilPixel)
                tempBounds$1.ceil();
            this.rect(tempBounds$1.x, tempBounds$1.y, tempBounds$1.width, tempBounds$1.height);
            this.clip();
        }
        clear() {
            const { pixelRatio } = this;
            this.clearRect(0, 0, this.width * pixelRatio + 2, this.height * pixelRatio + 2);
        }
        isSameSize(size) {
            return this.width === size.width && this.height === size.height && this.pixelRatio === size.pixelRatio;
        }
        getSameCanvas(useSameWorldTransform, useSameSmooth) {
            const canvas = this.manager ? this.manager.get(this.size) : Creator.canvas(Object.assign({}, this.size));
            canvas.save();
            if (useSameWorldTransform)
                copy$9(canvas.worldTransform, this.worldTransform), canvas.useWorldTransform();
            if (useSameSmooth)
                canvas.smooth = this.smooth;
            return canvas;
        }
        recycle(clearBounds) {
            if (!this.recycled) {
                this.restore();
                clearBounds ? this.clearWorld(clearBounds, true) : this.clear();
                this.manager ? this.manager.recycle(this) : this.destroy();
            }
        }
        updateRender(_bounds) { }
        unrealCanvas() { }
        destroy() {
            this.manager = this.view = this.parentView = null;
        }
    }

    const PathHelper = {
        creator: {},
        parse(_pathString, _curveMode) { return undefined; },
        convertToCanvasData(_old, _curveMode) { return undefined; }
    };

    const CanvasCommandOnlyMap = {
        N: 21,
        D: 22,
        X: 23,
        G: 24,
        F: 25,
        O: 26,
        P: 27,
        U: 28
    };
    const PathCommandMap = Object.assign({ M: 1, m: 10, L: 2, l: 20, H: 3, h: 30, V: 4, v: 40, C: 5, c: 50, S: 6, s: 60, Q: 7, q: 70, T: 8, t: 80, A: 9, a: 90, Z: 11, z: 11, R: 12 }, CanvasCommandOnlyMap);
    const PathCommandLengthMap = {
        M: 3,
        m: 3,
        L: 3,
        l: 3,
        H: 2,
        h: 2,
        V: 2,
        v: 2,
        C: 7,
        c: 7,
        S: 5,
        s: 5,
        Q: 5,
        q: 5,
        T: 3,
        t: 3,
        A: 8,
        a: 8,
        Z: 1,
        z: 1,
        N: 5,
        D: 9,
        X: 6,
        G: 9,
        F: 5,
        O: 7,
        P: 4,
        U: 6
    };
    const NeedConvertToCanvasCommandMap = {
        m: 10,
        l: 20,
        H: 3,
        h: 30,
        V: 4,
        v: 40,
        c: 50,
        S: 6,
        s: 60,
        q: 70,
        T: 8,
        t: 80,
        A: 9,
        a: 90,
    };
    const NeedConvertToCurveCommandMap = Object.assign(Object.assign({}, NeedConvertToCanvasCommandMap), CanvasCommandOnlyMap);
    const P$4 = PathCommandMap;
    const PathNumberCommandMap = {};
    for (let key in P$4) {
        PathNumberCommandMap[P$4[key]] = key;
    }
    const PathNumberCommandLengthMap = {};
    for (let key in P$4) {
        PathNumberCommandLengthMap[P$4[key]] = PathCommandLengthMap[key];
    }

    const RectHelper = {
        drawRoundRect(drawer, x, y, width, height, cornerRadius) {
            const data = MathHelper.fourNumber(cornerRadius, Math.min(width / 2, height / 2));
            const right = x + width;
            const bottom = y + height;
            data[0] ? drawer.moveTo(x + data[0], y) : drawer.moveTo(x, y);
            data[1] ? drawer.arcTo(right, y, right, bottom, data[1]) : drawer.lineTo(right, y);
            data[2] ? drawer.arcTo(right, bottom, x, bottom, data[2]) : drawer.lineTo(right, bottom);
            data[3] ? drawer.arcTo(x, bottom, x, y, data[3]) : drawer.lineTo(x, bottom);
            data[0] ? drawer.arcTo(x, y, right, y, data[0]) : drawer.lineTo(x, y);
        }
    };

    const { sin: sin$3, cos: cos$3, atan2: atan2$1, ceil: ceil$1, abs: abs$3, PI: PI$2, sqrt: sqrt$1, pow } = Math;
    const { setPoint: setPoint$2, addPoint: addPoint$2 } = TwoPointBoundsHelper;
    const { set, toNumberPoints } = PointHelper;
    const { M: M$5, L: L$6, C: C$5, Q: Q$4, Z: Z$5 } = PathCommandMap;
    const tempPoint$2 = {};
    const BezierHelper = {
        points(data, originPoints, curve, close) {
            let points = toNumberPoints(originPoints);
            data.push(M$5, points[0], points[1]);
            if (curve && points.length > 5) {
                let aX, aY, bX, bY, cX, cY, c1X, c1Y, c2X, c2Y;
                let ba, cb, d, len = points.length;
                const t = curve === true ? 0.5 : curve;
                if (close) {
                    points = [points[len - 2], points[len - 1], ...points, points[0], points[1], points[2], points[3]];
                    len = points.length;
                }
                for (let i = 2; i < len - 2; i += 2) {
                    aX = points[i - 2];
                    aY = points[i - 1];
                    bX = points[i];
                    bY = points[i + 1];
                    cX = points[i + 2];
                    cY = points[i + 3];
                    ba = sqrt$1(pow(bX - aX, 2) + pow(bY - aY, 2));
                    cb = sqrt$1(pow(cX - bX, 2) + pow(cY - bY, 2));
                    d = ba + cb;
                    ba = (t * ba) / d;
                    cb = (t * cb) / d;
                    cX -= aX;
                    cY -= aY;
                    c1X = bX - ba * cX;
                    c1Y = bY - ba * cY;
                    if (i === 2) {
                        if (!close)
                            data.push(Q$4, c1X, c1Y, bX, bY);
                    }
                    else {
                        data.push(C$5, c2X, c2Y, c1X, c1Y, bX, bY);
                    }
                    c2X = bX + cb * cX;
                    c2Y = bY + cb * cY;
                }
                if (!close)
                    data.push(Q$4, c2X, c2Y, points[len - 2], points[len - 1]);
            }
            else {
                for (let i = 2, len = points.length; i < len; i += 2) {
                    data.push(L$6, points[i], points[i + 1]);
                }
            }
            if (close)
                data.push(Z$5);
        },
        rect(data, x, y, width, height) {
            PathHelper.creator.path = data;
            PathHelper.creator.moveTo(x, y).lineTo(x + width, y).lineTo(x + width, y + height).lineTo(x, y + height).lineTo(x, y);
        },
        roundRect(data, x, y, width, height, radius) {
            PathHelper.creator.path = [];
            RectHelper.drawRoundRect(PathHelper.creator, x, y, width, height, radius);
            data.push(...PathHelper.convertToCanvasData(PathHelper.creator.path, true));
        },
        arcTo(data, fromX, fromY, x1, y1, toX, toY, radius, setPointBounds, setEndPoint, setStartPoint) {
            const BAx = x1 - fromX;
            const BAy = y1 - fromY;
            const CBx = toX - x1;
            const CBy = toY - y1;
            let startRadian = atan2$1(BAy, BAx);
            let endRadian = atan2$1(CBy, CBx);
            let totalRadian = endRadian - startRadian;
            if (totalRadian < 0)
                totalRadian += PI2;
            if (totalRadian === PI$2 || (abs$3(BAx + BAy) < 1.e-12) || (abs$3(CBx + CBy) < 1.e-12)) {
                if (data)
                    data.push(L$6, x1, y1);
                if (setPointBounds) {
                    setPoint$2(setPointBounds, fromX, fromY);
                    addPoint$2(setPointBounds, x1, y1);
                }
                if (setStartPoint)
                    set(setStartPoint, fromX, fromY);
                if (setEndPoint)
                    set(setEndPoint, x1, y1);
                return;
            }
            const anticlockwise = BAx * CBy - CBx * BAy < 0;
            const sign = anticlockwise ? -1 : 1;
            const c = radius / cos$3(totalRadian / 2);
            const centerX = x1 + c * cos$3(startRadian + totalRadian / 2 + PI_2 * sign);
            const centerY = y1 + c * sin$3(startRadian + totalRadian / 2 + PI_2 * sign);
            startRadian -= PI_2 * sign;
            endRadian -= PI_2 * sign;
            return ellipse$6(data, centerX, centerY, radius, radius, 0, startRadian / OneRadian, endRadian / OneRadian, anticlockwise, setPointBounds, setEndPoint, setStartPoint);
        },
        arc(data, x, y, radius, startAngle, endAngle, anticlockwise, setPointBounds, setEndPoint, setStartPoint) {
            return ellipse$6(data, x, y, radius, radius, 0, startAngle, endAngle, anticlockwise, setPointBounds, setEndPoint, setStartPoint);
        },
        ellipse(data, cx, cy, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise, setPointBounds, setEndPoint, setStartPoint) {
            const rotationRadian = rotation * OneRadian;
            const rotationSin = sin$3(rotationRadian);
            const rotationCos = cos$3(rotationRadian);
            let startRadian = startAngle * OneRadian;
            let endRadian = endAngle * OneRadian;
            if (startRadian > PI$2)
                startRadian -= PI2;
            if (endRadian < 0)
                endRadian += PI2;
            let totalRadian = endRadian - startRadian;
            if (totalRadian < 0)
                totalRadian += PI2;
            else if (totalRadian > PI2)
                totalRadian -= PI2;
            if (anticlockwise)
                totalRadian -= PI2;
            const parts = ceil$1(abs$3(totalRadian / PI_2));
            const partRadian = totalRadian / parts;
            const partRadian4Sin = sin$3(partRadian / 4);
            const control = 8 / 3 * partRadian4Sin * partRadian4Sin / sin$3(partRadian / 2);
            endRadian = startRadian + partRadian;
            let startCos = cos$3(startRadian);
            let startSin = sin$3(startRadian);
            let endCos, endSin;
            let x, y, x1, y1, x2, y2;
            let startX = x = rotationCos * radiusX * startCos - rotationSin * radiusY * startSin;
            let startY = y = rotationSin * radiusX * startCos + rotationCos * radiusY * startSin;
            let fromX = cx + x, fromY = cy + y;
            if (data)
                data.push(data.length ? L$6 : M$5, fromX, fromY);
            if (setPointBounds)
                setPoint$2(setPointBounds, fromX, fromY);
            if (setStartPoint)
                set(setStartPoint, fromX, fromY);
            for (let i = 0; i < parts; i++) {
                endCos = cos$3(endRadian);
                endSin = sin$3(endRadian);
                x = rotationCos * radiusX * endCos - rotationSin * radiusY * endSin;
                y = rotationSin * radiusX * endCos + rotationCos * radiusY * endSin;
                x1 = cx + startX - control * (rotationCos * radiusX * startSin + rotationSin * radiusY * startCos);
                y1 = cy + startY - control * (rotationSin * radiusX * startSin - rotationCos * radiusY * startCos);
                x2 = cx + x + control * (rotationCos * radiusX * endSin + rotationSin * radiusY * endCos);
                y2 = cy + y + control * (rotationSin * radiusX * endSin - rotationCos * radiusY * endCos);
                if (data)
                    data.push(C$5, x1, y1, x2, y2, cx + x, cy + y);
                if (setPointBounds)
                    toTwoPointBounds$1(cx + startX, cy + startY, x1, y1, x2, y2, cx + x, cy + y, setPointBounds, true);
                startX = x;
                startY = y;
                startCos = endCos;
                startSin = endSin;
                startRadian = endRadian;
                endRadian += partRadian;
            }
            if (setEndPoint)
                set(setEndPoint, cx + x, cy + y);
        },
        quadraticCurveTo(data, fromX, fromY, x1, y1, toX, toY) {
            data.push(C$5, (fromX + 2 * x1) / 3, (fromY + 2 * y1) / 3, (toX + 2 * x1) / 3, (toY + 2 * y1) / 3, toX, toY);
        },
        toTwoPointBoundsByQuadraticCurve(fromX, fromY, x1, y1, toX, toY, pointBounds, addMode) {
            toTwoPointBounds$1(fromX, fromY, (fromX + 2 * x1) / 3, (fromY + 2 * y1) / 3, (toX + 2 * x1) / 3, (toY + 2 * y1) / 3, toX, toY, pointBounds, addMode);
        },
        toTwoPointBounds(fromX, fromY, x1, y1, x2, y2, toX, toY, pointBounds, addMode) {
            const tList = [];
            let a, b, c, t, t1, t2, v, sqrtV;
            let f = fromX, z1 = x1, z2 = x2, o = toX;
            for (let i = 0; i < 2; ++i) {
                if (i == 1) {
                    f = fromY, z1 = y1, z2 = y2, o = toY;
                }
                a = -3 * f + 9 * z1 - 9 * z2 + 3 * o;
                b = 6 * f - 12 * z1 + 6 * z2;
                c = 3 * z1 - 3 * f;
                if (Math.abs(a) < 1e-12) {
                    if (Math.abs(b) < 1e-12)
                        continue;
                    t = -c / b;
                    if (0 < t && t < 1)
                        tList.push(t);
                    continue;
                }
                v = b * b - 4 * c * a;
                sqrtV = Math.sqrt(v);
                if (v < 0)
                    continue;
                t1 = (-b + sqrtV) / (2 * a);
                if (0 < t1 && t1 < 1)
                    tList.push(t1);
                t2 = (-b - sqrtV) / (2 * a);
                if (0 < t2 && t2 < 1)
                    tList.push(t2);
            }
            addMode ? addPoint$2(pointBounds, fromX, fromY) : setPoint$2(pointBounds, fromX, fromY);
            addPoint$2(pointBounds, toX, toY);
            for (let i = 0, len = tList.length; i < len; i++) {
                getPointAndSet(tList[i], fromX, fromY, x1, y1, x2, y2, toX, toY, tempPoint$2);
                addPoint$2(pointBounds, tempPoint$2.x, tempPoint$2.y);
            }
        },
        getPointAndSet(t, fromX, fromY, x1, y1, x2, y2, toX, toY, setPoint) {
            const o = 1 - t, a = o * o * o, b = 3 * o * o * t, c = 3 * o * t * t, d = t * t * t;
            setPoint.x = a * fromX + b * x1 + c * x2 + d * toX;
            setPoint.y = a * fromY + b * y1 + c * y2 + d * toY;
        },
        getPoint(t, fromX, fromY, x1, y1, x2, y2, toX, toY) {
            const point = {};
            getPointAndSet(t, fromX, fromY, x1, y1, x2, y2, toX, toY, point);
            return point;
        }
    };
    const { getPointAndSet, toTwoPointBounds: toTwoPointBounds$1, ellipse: ellipse$6 } = BezierHelper;

    const { sin: sin$2, cos: cos$2, sqrt, atan2 } = Math;
    const { ellipse: ellipse$5 } = BezierHelper;
    const EllipseHelper = {
        ellipticalArc(data, fromX, fromY, radiusX, radiusY, rotation, largeFlag, sweepFlag, toX, toY, curveMode) {
            const halfX = (toX - fromX) / 2;
            const halfY = (toY - fromY) / 2;
            const rotationRadian = rotation * OneRadian;
            const rotationSin = sin$2(rotationRadian);
            const rotationCos = cos$2(rotationRadian);
            const px = -rotationCos * halfX - rotationSin * halfY;
            const py = -rotationCos * halfY + rotationSin * halfX;
            const rxSquare = radiusX * radiusX;
            const rySquare = radiusY * radiusY;
            const pySquare = py * py;
            const pxSquare = px * px;
            const a = rxSquare * rySquare - rxSquare * pySquare - rySquare * pxSquare;
            let s = 0;
            if (a < 0) {
                const t = sqrt(1 - a / (rxSquare * rySquare));
                radiusX *= t;
                radiusY *= t;
            }
            else {
                s = (largeFlag === sweepFlag ? -1 : 1) * sqrt(a / (rxSquare * pySquare + rySquare * pxSquare));
            }
            const cx = s * radiusX * py / radiusY;
            const cy = -s * radiusY * px / radiusX;
            const startRadian = atan2((py - cy) / radiusY, (px - cx) / radiusX);
            const endRadian = atan2((-py - cy) / radiusY, (-px - cx) / radiusX);
            let totalRadian = endRadian - startRadian;
            if (sweepFlag === 0 && totalRadian > 0) {
                totalRadian -= PI2;
            }
            else if (sweepFlag === 1 && totalRadian < 0) {
                totalRadian += PI2;
            }
            const centerX = fromX + halfX + rotationCos * cx - rotationSin * cy;
            const centerY = fromY + halfY + rotationSin * cx + rotationCos * cy;
            const anticlockwise = totalRadian < 0 ? 1 : 0;
            if (curveMode || Platform.ellipseToCurve) {
                ellipse$5(data, centerX, centerY, radiusX, radiusY, rotation, startRadian / OneRadian, endRadian / OneRadian, anticlockwise);
            }
            else {
                if (radiusX === radiusY && !rotation) {
                    data.push(PathCommandMap.O, centerX, centerY, radiusX, startRadian / OneRadian, endRadian / OneRadian, anticlockwise);
                }
                else {
                    data.push(PathCommandMap.G, centerX, centerY, radiusX, radiusY, rotation, startRadian / OneRadian, endRadian / OneRadian, anticlockwise);
                }
            }
        }
    };

    const { M: M$4, m, L: L$5, l, H, h, V, v, C: C$4, c, S, s, Q: Q$3, q, T, t, A, a, Z: Z$4, z, N: N$3, D: D$3, X: X$3, G: G$3, F: F$4, O: O$3, P: P$3, U: U$3 } = PathCommandMap;
    const { rect: rect$3, roundRect: roundRect$2, arcTo: arcTo$3, arc: arc$3, ellipse: ellipse$4, quadraticCurveTo: quadraticCurveTo$1 } = BezierHelper;
    const { ellipticalArc } = EllipseHelper;
    const debug$d = Debug.get('PathConvert');
    const setEndPoint$1 = {};
    const PathConvert = {
        current: { dot: 0 },
        stringify(data, floatLength) {
            let i = 0, len = data.length, count, str = '', command, lastCommand;
            while (i < len) {
                command = data[i];
                count = PathNumberCommandLengthMap[command];
                if (command === lastCommand) {
                    str += ' ';
                }
                else {
                    str += PathNumberCommandMap[command];
                }
                for (let j = 1; j < count; j++) {
                    str += MathHelper.float(data[i + j], floatLength);
                    (j === count - 1) || (str += ' ');
                }
                lastCommand = command;
                i += count;
            }
            return str;
        },
        parse(pathString, curveMode) {
            let needConvert, char, lastChar, num = '';
            const data = [];
            const convertCommand = curveMode ? NeedConvertToCurveCommandMap : NeedConvertToCanvasCommandMap;
            for (let i = 0, len = pathString.length; i < len; i++) {
                char = pathString[i];
                if (StringNumberMap[char]) {
                    if (char === '.') {
                        if (current.dot) {
                            pushData(data, num);
                            num = '';
                        }
                        current.dot++;
                    }
                    if (num === '0' && char !== '.') {
                        pushData(data, num);
                        num = '';
                    }
                    num += char;
                }
                else if (PathCommandMap[char]) {
                    if (num) {
                        pushData(data, num);
                        num = '';
                    }
                    current.name = PathCommandMap[char];
                    current.length = PathCommandLengthMap[char];
                    current.index = 0;
                    pushData(data, current.name);
                    if (!needConvert && convertCommand[char])
                        needConvert = true;
                }
                else {
                    if (char === '-' || char === '+') {
                        if (lastChar === 'e' || lastChar === 'E') {
                            num += char;
                        }
                        else {
                            if (num)
                                pushData(data, num);
                            num = char;
                        }
                    }
                    else {
                        if (num) {
                            pushData(data, num);
                            num = '';
                        }
                    }
                }
                lastChar = char;
            }
            if (num)
                pushData(data, num);
            return needConvert ? PathConvert.toCanvasData(data, curveMode) : data;
        },
        toCanvasData(old, curveMode) {
            let x = 0, y = 0, x1 = 0, y1 = 0, i = 0, len = old.length, controlX, controlY, command, lastCommand, smooth;
            const data = [];
            while (i < len) {
                command = old[i];
                switch (command) {
                    case m:
                        old[i + 1] += x;
                        old[i + 2] += y;
                    case M$4:
                        x = old[i + 1];
                        y = old[i + 2];
                        data.push(M$4, x, y);
                        i += 3;
                        break;
                    case h:
                        old[i + 1] += x;
                    case H:
                        x = old[i + 1];
                        data.push(L$5, x, y);
                        i += 2;
                        break;
                    case v:
                        old[i + 1] += y;
                    case V:
                        y = old[i + 1];
                        data.push(L$5, x, y);
                        i += 2;
                        break;
                    case l:
                        old[i + 1] += x;
                        old[i + 2] += y;
                    case L$5:
                        x = old[i + 1];
                        y = old[i + 2];
                        data.push(L$5, x, y);
                        i += 3;
                        break;
                    case s:
                        old[i + 1] += x;
                        old[i + 2] += y;
                        old[i + 3] += x;
                        old[i + 4] += y;
                        command = S;
                    case S:
                        smooth = (lastCommand === C$4) || (lastCommand === S);
                        x1 = smooth ? (x * 2 - controlX) : old[i + 1];
                        y1 = smooth ? (y * 2 - controlY) : old[i + 2];
                        controlX = old[i + 1];
                        controlY = old[i + 2];
                        x = old[i + 3];
                        y = old[i + 4];
                        data.push(C$4, x1, y1, controlX, controlY, x, y);
                        i += 5;
                        break;
                    case c:
                        old[i + 1] += x;
                        old[i + 2] += y;
                        old[i + 3] += x;
                        old[i + 4] += y;
                        old[i + 5] += x;
                        old[i + 6] += y;
                        command = C$4;
                    case C$4:
                        controlX = old[i + 3];
                        controlY = old[i + 4];
                        x = old[i + 5];
                        y = old[i + 6];
                        data.push(C$4, old[i + 1], old[i + 2], controlX, controlY, x, y);
                        i += 7;
                        break;
                    case t:
                        old[i + 1] += x;
                        old[i + 2] += y;
                        command = T;
                    case T:
                        smooth = (lastCommand === Q$3) || (lastCommand === T);
                        controlX = smooth ? (x * 2 - controlX) : old[i + 1];
                        controlY = smooth ? (y * 2 - controlY) : old[i + 2];
                        curveMode ? quadraticCurveTo$1(data, x, y, controlX, controlY, old[i + 1], old[i + 2]) : data.push(Q$3, controlX, controlY, old[i + 1], old[i + 2]);
                        x = old[i + 1];
                        y = old[i + 2];
                        i += 3;
                        break;
                    case q:
                        old[i + 1] += x;
                        old[i + 2] += y;
                        old[i + 3] += x;
                        old[i + 4] += y;
                        command = Q$3;
                    case Q$3:
                        controlX = old[i + 1];
                        controlY = old[i + 2];
                        curveMode ? quadraticCurveTo$1(data, x, y, controlX, controlY, old[i + 3], old[i + 4]) : data.push(Q$3, controlX, controlY, old[i + 3], old[i + 4]);
                        x = old[i + 3];
                        y = old[i + 4];
                        i += 5;
                        break;
                    case a:
                        old[i + 6] += x;
                        old[i + 7] += y;
                    case A:
                        ellipticalArc(data, x, y, old[i + 1], old[i + 2], old[i + 3], old[i + 4], old[i + 5], old[i + 6], old[i + 7], curveMode);
                        x = old[i + 6];
                        y = old[i + 7];
                        i += 8;
                        break;
                    case z:
                    case Z$4:
                        data.push(Z$4);
                        i++;
                        break;
                    case N$3:
                        x = old[i + 1];
                        y = old[i + 2];
                        curveMode ? rect$3(data, x, y, old[i + 3], old[i + 4]) : copyData(data, old, i, 5);
                        i += 5;
                        break;
                    case D$3:
                        x = old[i + 1];
                        y = old[i + 2];
                        curveMode ? roundRect$2(data, x, y, old[i + 3], old[i + 4], [old[i + 5], old[i + 6], old[i + 7], old[i + 8]]) : copyData(data, old, i, 9);
                        i += 9;
                        break;
                    case X$3:
                        x = old[i + 1];
                        y = old[i + 2];
                        curveMode ? roundRect$2(data, x, y, old[i + 3], old[i + 4], old[i + 5]) : copyData(data, old, i, 6);
                        i += 6;
                        break;
                    case G$3:
                        ellipse$4(curveMode ? data : copyData(data, old, i, 9), old[i + 1], old[i + 2], old[i + 3], old[i + 4], old[i + 5], old[i + 6], old[i + 7], old[i + 8], null, setEndPoint$1);
                        x = setEndPoint$1.x;
                        y = setEndPoint$1.y;
                        i += 9;
                        break;
                    case F$4:
                        curveMode ? ellipse$4(data, old[i + 1], old[i + 2], old[i + 3], old[i + 4], 0, 0, 360, false) : copyData(data, old, i, 5);
                        x = old[i + 1] + old[i + 3];
                        y = old[i + 2];
                        i += 5;
                        break;
                    case O$3:
                        arc$3(curveMode ? data : copyData(data, old, i, 7), old[i + 1], old[i + 2], old[i + 3], old[i + 4], old[i + 5], old[i + 6], null, setEndPoint$1);
                        x = setEndPoint$1.x;
                        y = setEndPoint$1.y;
                        i += 7;
                        break;
                    case P$3:
                        curveMode ? arc$3(data, old[i + 1], old[i + 2], old[i + 3], 0, 360, false) : copyData(data, old, i, 4);
                        x = old[i + 1] + old[i + 3];
                        y = old[i + 2];
                        i += 4;
                        break;
                    case U$3:
                        arcTo$3(curveMode ? data : copyData(data, old, i, 6), x, y, old[i + 1], old[i + 2], old[i + 3], old[i + 4], old[i + 5], null, setEndPoint$1);
                        x = setEndPoint$1.x;
                        y = setEndPoint$1.y;
                        i += 6;
                        break;
                    default:
                        debug$d.error(`command: ${command} [index:${i}]`, old);
                        return data;
                }
                lastCommand = command;
            }
            return data;
        },
        objectToCanvasData(list) {
            const data = [];
            list.forEach(item => {
                switch (item.name) {
                    case 'M':
                        data.push(M$4, item.x, item.y);
                        break;
                    case 'L':
                        data.push(L$5, item.x, item.y);
                        break;
                    case 'C':
                        data.push(C$4, item.x1, item.y1, item.x2, item.y2, item.x, item.y);
                        break;
                    case 'Q':
                        data.push(Q$3, item.x1, item.y1, item.x, item.y);
                        break;
                    case 'Z': data.push(Z$4);
                }
            });
            return data;
        },
        copyData(data, old, index, count) {
            for (let i = index, end = index + count; i < end; i++) {
                data.push(old[i]);
            }
        },
        pushData(data, strNum) {
            if (current.index === current.length) {
                current.index = 1;
                data.push(current.name);
            }
            data.push(Number(strNum));
            current.index++;
            current.dot = 0;
        }
    };
    const { current, pushData, copyData } = PathConvert;

    const { M: M$3, L: L$4, C: C$3, Q: Q$2, Z: Z$3, N: N$2, D: D$2, X: X$2, G: G$2, F: F$3, O: O$2, P: P$2, U: U$2 } = PathCommandMap;
    const { getMinDistanceFrom, getRadianFrom } = PointHelper;
    const { tan, min, abs: abs$2 } = Math;
    const startPoint = {};
    const PathCommandDataHelper = {
        beginPath(data) {
            data.length = 0;
        },
        moveTo(data, x, y) {
            data.push(M$3, x, y);
        },
        lineTo(data, x, y) {
            data.push(L$4, x, y);
        },
        bezierCurveTo(data, x1, y1, x2, y2, x, y) {
            data.push(C$3, x1, y1, x2, y2, x, y);
        },
        quadraticCurveTo(data, x1, y1, x, y) {
            data.push(Q$2, x1, y1, x, y);
        },
        closePath(data) {
            data.push(Z$3);
        },
        rect(data, x, y, width, height) {
            data.push(N$2, x, y, width, height);
        },
        roundRect(data, x, y, width, height, cornerRadius) {
            if (typeof cornerRadius === 'number') {
                data.push(X$2, x, y, width, height, cornerRadius);
            }
            else {
                const fourCorners = MathHelper.fourNumber(cornerRadius);
                if (fourCorners) {
                    data.push(D$2, x, y, width, height, ...fourCorners);
                }
                else {
                    data.push(N$2, x, y, width, height);
                }
            }
        },
        ellipse(data, x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise) {
            if (rotation === undefined) {
                data.push(F$3, x, y, radiusX, radiusY);
            }
            else {
                if (startAngle === undefined)
                    startAngle = 0;
                if (endAngle === undefined)
                    endAngle = 360;
                data.push(G$2, x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise ? 1 : 0);
            }
        },
        arc(data, x, y, radius, startAngle, endAngle, anticlockwise) {
            if (startAngle === undefined) {
                data.push(P$2, x, y, radius);
            }
            else {
                if (endAngle === undefined)
                    endAngle = 360;
                data.push(O$2, x, y, radius, startAngle, endAngle, anticlockwise ? 1 : 0);
            }
        },
        arcTo(data, x1, y1, x2, y2, radius, lastX, lastY) {
            if (lastX !== undefined) {
                const maxRadius = tan(getRadianFrom(lastX, lastY, x1, y1, x2, y2) / 2) * (getMinDistanceFrom(lastX, lastY, x1, y1, x2, y2) / 2);
                data.push(U$2, x1, y1, x2, y2, min(radius, abs$2(maxRadius)));
            }
            else {
                data.push(U$2, x1, y1, x2, y2, radius);
            }
        },
        drawEllipse(data, x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise) {
            BezierHelper.ellipse(null, x, y, radiusX, radiusY, rotation === undefined ? 0 : rotation, startAngle === undefined ? 0 : startAngle, endAngle === undefined ? 360 : endAngle, anticlockwise, null, null, startPoint);
            data.push(M$3, startPoint.x, startPoint.y);
            ellipse$3(data, x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise);
        },
        drawArc(data, x, y, radius, startAngle, endAngle, anticlockwise) {
            BezierHelper.arc(null, x, y, radius, startAngle === undefined ? 0 : startAngle, endAngle === undefined ? 360 : endAngle, anticlockwise, null, null, startPoint);
            data.push(M$3, startPoint.x, startPoint.y);
            arc$2(data, x, y, radius, startAngle, endAngle, anticlockwise);
        },
        drawPoints(data, points, curve, close) {
            BezierHelper.points(data, points, curve, close);
        }
    };
    const { ellipse: ellipse$3, arc: arc$2 } = PathCommandDataHelper;

    const { moveTo: moveTo$4, lineTo: lineTo$3, quadraticCurveTo, bezierCurveTo, closePath: closePath$3, beginPath, rect: rect$2, roundRect: roundRect$1, ellipse: ellipse$2, arc: arc$1, arcTo: arcTo$2, drawEllipse, drawArc, drawPoints: drawPoints$2 } = PathCommandDataHelper;
    class PathCreator {
        set path(value) { this.__path = value; }
        get path() { return this.__path; }
        constructor(path) {
            this.set(path);
        }
        set(path) {
            if (path) {
                this.__path = typeof path === 'string' ? PathHelper.parse(path) : path;
            }
            else {
                this.__path = [];
            }
            return this;
        }
        beginPath() {
            beginPath(this.__path);
            this.paint();
            return this;
        }
        moveTo(x, y) {
            moveTo$4(this.__path, x, y);
            this.paint();
            return this;
        }
        lineTo(x, y) {
            lineTo$3(this.__path, x, y);
            this.paint();
            return this;
        }
        bezierCurveTo(x1, y1, x2, y2, x, y) {
            bezierCurveTo(this.__path, x1, y1, x2, y2, x, y);
            this.paint();
            return this;
        }
        quadraticCurveTo(x1, y1, x, y) {
            quadraticCurveTo(this.__path, x1, y1, x, y);
            this.paint();
            return this;
        }
        closePath() {
            closePath$3(this.__path);
            this.paint();
            return this;
        }
        rect(x, y, width, height) {
            rect$2(this.__path, x, y, width, height);
            this.paint();
            return this;
        }
        roundRect(x, y, width, height, cornerRadius) {
            roundRect$1(this.__path, x, y, width, height, cornerRadius);
            this.paint();
            return this;
        }
        ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise) {
            ellipse$2(this.__path, x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise);
            this.paint();
            return this;
        }
        arc(x, y, radius, startAngle, endAngle, anticlockwise) {
            arc$1(this.__path, x, y, radius, startAngle, endAngle, anticlockwise);
            this.paint();
            return this;
        }
        arcTo(x1, y1, x2, y2, radius) {
            arcTo$2(this.__path, x1, y1, x2, y2, radius);
            this.paint();
            return this;
        }
        drawEllipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise) {
            drawEllipse(this.__path, x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise);
            this.paint();
            return this;
        }
        drawArc(x, y, radius, startAngle, endAngle, anticlockwise) {
            drawArc(this.__path, x, y, radius, startAngle, endAngle, anticlockwise);
            this.paint();
            return this;
        }
        drawPoints(points, curve, close) {
            drawPoints$2(this.__path, points, curve, close);
            this.paint();
            return this;
        }
        clearPath() {
            return this.beginPath();
        }
        paint() { }
    }

    const { M: M$2, L: L$3, C: C$2, Q: Q$1, Z: Z$2, N: N$1, D: D$1, X: X$1, G: G$1, F: F$2, O: O$1, P: P$1, U: U$1 } = PathCommandMap;
    const debug$c = Debug.get('PathDrawer');
    const PathDrawer = {
        drawPathByData(drawer, data) {
            if (!data)
                return;
            let command;
            let i = 0, len = data.length;
            while (i < len) {
                command = data[i];
                switch (command) {
                    case M$2:
                        drawer.moveTo(data[i + 1], data[i + 2]);
                        i += 3;
                        break;
                    case L$3:
                        drawer.lineTo(data[i + 1], data[i + 2]);
                        i += 3;
                        break;
                    case C$2:
                        drawer.bezierCurveTo(data[i + 1], data[i + 2], data[i + 3], data[i + 4], data[i + 5], data[i + 6]);
                        i += 7;
                        break;
                    case Q$1:
                        drawer.quadraticCurveTo(data[i + 1], data[i + 2], data[i + 3], data[i + 4]);
                        i += 5;
                        break;
                    case Z$2:
                        drawer.closePath();
                        i += 1;
                        break;
                    case N$1:
                        drawer.rect(data[i + 1], data[i + 2], data[i + 3], data[i + 4]);
                        i += 5;
                        break;
                    case D$1:
                        drawer.roundRect(data[i + 1], data[i + 2], data[i + 3], data[i + 4], [data[i + 5], data[i + 6], data[i + 7], data[i + 8]]);
                        i += 9;
                        break;
                    case X$1:
                        drawer.roundRect(data[i + 1], data[i + 2], data[i + 3], data[i + 4], data[i + 5]);
                        i += 6;
                        break;
                    case G$1:
                        drawer.ellipse(data[i + 1], data[i + 2], data[i + 3], data[i + 4], data[i + 5] * OneRadian, data[i + 6] * OneRadian, data[i + 7] * OneRadian, data[i + 8]);
                        i += 9;
                        break;
                    case F$2:
                        drawer.ellipse(data[i + 1], data[i + 2], data[i + 3], data[i + 4], 0, 0, PI2, false);
                        i += 5;
                        break;
                    case O$1:
                        drawer.arc(data[i + 1], data[i + 2], data[i + 3], data[i + 4] * OneRadian, data[i + 5] * OneRadian, data[i + 6]);
                        i += 7;
                        break;
                    case P$1:
                        drawer.arc(data[i + 1], data[i + 2], data[i + 3], 0, PI2, false);
                        i += 4;
                        break;
                    case U$1:
                        drawer.arcTo(data[i + 1], data[i + 2], data[i + 3], data[i + 4], data[i + 5]);
                        i += 6;
                        break;
                    default:
                        debug$c.error(`command: ${command} [index:${i}]`, data);
                        return;
                }
            }
        }
    };

    const { M: M$1, L: L$2, C: C$1, Q, Z: Z$1, N, D, X, G, F: F$1, O, P, U } = PathCommandMap;
    const { toTwoPointBounds, toTwoPointBoundsByQuadraticCurve, arcTo: arcTo$1, arc, ellipse: ellipse$1 } = BezierHelper;
    const { addPointBounds, copy: copy$8, addPoint: addPoint$1, setPoint: setPoint$1, addBounds, toBounds: toBounds$3 } = TwoPointBoundsHelper;
    const debug$b = Debug.get('PathBounds');
    let radius, radiusX, radiusY;
    const tempPointBounds = {};
    const setPointBounds = {};
    const setEndPoint = {};
    const PathBounds = {
        toBounds(data, setBounds) {
            PathBounds.toTwoPointBounds(data, setPointBounds);
            toBounds$3(setPointBounds, setBounds);
        },
        toTwoPointBounds(data, setPointBounds) {
            if (!data || !data.length)
                return setPoint$1(setPointBounds, 0, 0);
            let i = 0, x = 0, y = 0, x1, y1, toX, toY, command;
            const len = data.length;
            while (i < len) {
                command = data[i];
                if (i === 0) {
                    if (command === Z$1 || command === C$1 || command === Q) {
                        setPoint$1(setPointBounds, x, y);
                    }
                    else {
                        setPoint$1(setPointBounds, data[i + 1], data[i + 2]);
                    }
                }
                switch (command) {
                    case M$1:
                    case L$2:
                        x = data[i + 1];
                        y = data[i + 2];
                        addPoint$1(setPointBounds, x, y);
                        i += 3;
                        break;
                    case C$1:
                        toX = data[i + 5];
                        toY = data[i + 6];
                        toTwoPointBounds(x, y, data[i + 1], data[i + 2], data[i + 3], data[i + 4], toX, toY, tempPointBounds);
                        addPointBounds(setPointBounds, tempPointBounds);
                        x = toX;
                        y = toY;
                        i += 7;
                        break;
                    case Q:
                        x1 = data[i + 1];
                        y1 = data[i + 2];
                        toX = data[i + 3];
                        toY = data[i + 4];
                        toTwoPointBoundsByQuadraticCurve(x, y, x1, y1, toX, toY, tempPointBounds);
                        addPointBounds(setPointBounds, tempPointBounds);
                        x = toX;
                        y = toY;
                        i += 5;
                        break;
                    case Z$1:
                        i += 1;
                        break;
                    case N:
                        x = data[i + 1];
                        y = data[i + 2];
                        addBounds(setPointBounds, x, y, data[i + 3], data[i + 4]);
                        i += 5;
                        break;
                    case D:
                    case X:
                        x = data[i + 1];
                        y = data[i + 2];
                        addBounds(setPointBounds, x, y, data[i + 3], data[i + 4]);
                        i += (command === D ? 9 : 6);
                        break;
                    case G:
                        ellipse$1(null, data[i + 1], data[i + 2], data[i + 3], data[i + 4], data[i + 5], data[i + 6], data[i + 7], data[i + 8], tempPointBounds, setEndPoint);
                        i === 0 ? copy$8(setPointBounds, tempPointBounds) : addPointBounds(setPointBounds, tempPointBounds);
                        x = setEndPoint.x;
                        y = setEndPoint.y;
                        i += 9;
                        break;
                    case F$1:
                        x = data[i + 1];
                        y = data[i + 2];
                        radiusX = data[i + 3];
                        radiusY = data[i + 4];
                        addBounds(setPointBounds, x - radiusX, y - radiusY, radiusX * 2, radiusY * 2);
                        x += radiusX;
                        i += 5;
                        break;
                    case O:
                        arc(null, data[i + 1], data[i + 2], data[i + 3], data[i + 4], data[i + 5], data[i + 6], tempPointBounds, setEndPoint);
                        i === 0 ? copy$8(setPointBounds, tempPointBounds) : addPointBounds(setPointBounds, tempPointBounds);
                        x = setEndPoint.x;
                        y = setEndPoint.y;
                        i += 7;
                        break;
                    case P:
                        x = data[i + 1];
                        y = data[i + 2];
                        radius = data[i + 3];
                        addBounds(setPointBounds, x - radius, y - radius, radius * 2, radius * 2);
                        x += radius;
                        i += 4;
                        break;
                    case U:
                        arcTo$1(null, x, y, data[i + 1], data[i + 2], data[i + 3], data[i + 4], data[i + 5], tempPointBounds, setEndPoint);
                        i === 0 ? copy$8(setPointBounds, tempPointBounds) : addPointBounds(setPointBounds, tempPointBounds);
                        x = setEndPoint.x;
                        y = setEndPoint.y;
                        i += 6;
                        break;
                    default:
                        debug$b.error(`command: ${command} [index:${i}]`, data);
                        return;
                }
            }
        }
    };

    const { M, L: L$1, C, Z } = PathCommandMap;
    const { getCenterX, getCenterY } = PointHelper;
    const { arcTo } = PathCommandDataHelper;
    const PathCorner = {
        smooth(data, cornerRadius, _cornerSmoothing) {
            let command;
            let i = 0, x = 0, y = 0, startX = 0, startY = 0, secondX = 0, secondY = 0, lastX = 0, lastY = 0;
            const len = data.length;
            const smooth = [];
            while (i < len) {
                command = data[i];
                switch (command) {
                    case M:
                        startX = lastX = data[i + 1];
                        startY = lastY = data[i + 2];
                        i += 3;
                        if (data[i] === L$1) {
                            secondX = data[i + 1];
                            secondY = data[i + 2];
                            smooth.push(M, getCenterX(startX, secondX), getCenterY(startY, secondY));
                        }
                        else {
                            smooth.push(M, startX, startY);
                        }
                        break;
                    case L$1:
                        x = data[i + 1];
                        y = data[i + 2];
                        i += 3;
                        switch (data[i]) {
                            case L$1:
                                arcTo(smooth, x, y, data[i + 1], data[i + 2], cornerRadius, lastX, lastY);
                                break;
                            case Z:
                                arcTo(smooth, x, y, startX, startY, cornerRadius, lastX, lastY);
                                break;
                            default:
                                smooth.push(L$1, x, y);
                        }
                        lastX = x;
                        lastY = y;
                        break;
                    case C:
                        smooth.push(C, data[i + 1], data[i + 2], data[i + 3], data[i + 4], data[i + 5], data[i + 6]);
                        i += 7;
                        break;
                    case Z:
                        arcTo(smooth, startX, startY, secondX, secondY, cornerRadius, lastX, lastY);
                        smooth.push(Z);
                        i += 1;
                        break;
                }
            }
            if (command !== Z) {
                smooth[1] = startX;
                smooth[2] = startY;
            }
            return smooth;
        }
    };

    PathHelper.creator = new PathCreator();
    PathHelper.parse = PathConvert.parse;
    PathHelper.convertToCanvasData = PathConvert.toCanvasData;
    const pen = new PathCreator();

    const { drawRoundRect } = RectHelper;
    function roundRect(drawer) {
        if (drawer && !drawer.roundRect) {
            drawer.roundRect = function (x, y, width, height, cornerRadius) {
                drawRoundRect(this, x, y, width, height, cornerRadius);
            };
        }
    }

    function canvasPatch(drawer) {
        roundRect(drawer);
    }

    const FileHelper = {
        opacityTypes: ['png', 'webp', 'svg'],
        upperCaseTypeMap: {},
        mineType(type) {
            if (!type || type.startsWith('image'))
                return type;
            if (type === 'jpg')
                type = 'jpeg';
            return 'image/' + type;
        },
        fileType(filename) {
            const l = filename.split('.');
            return l[l.length - 1];
        },
        isOpaqueImage(filename) {
            const type = F.fileType(filename);
            return ['jpg', 'jpeg'].some(item => item === type);
        },
        getExportOptions(options) {
            switch (typeof options) {
                case 'object': return options;
                case 'number': return { quality: options };
                case 'boolean': return { blob: options };
                default: return {};
            }
        }
    };
    const F = FileHelper;
    F.opacityTypes.forEach(type => F.upperCaseTypeMap[type] = type.toUpperCase());

    const debug$a = Debug.get('TaskProcessor');
    class TaskItem {
        constructor(task) {
            this.parallel = true;
            this.time = 1;
            this.id = IncrementId.create(IncrementId.TASK);
            this.task = task;
        }
        run() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    if (this.task && !this.isComplete && this.parent.running)
                        yield this.task();
                }
                catch (error) {
                    debug$a.error(error);
                }
            });
        }
        complete() {
            this.isComplete = true;
            this.parent = null;
            this.task = null;
        }
        cancel() {
            this.isCancel = true;
            this.complete();
        }
    }

    class TaskProcessor {
        get total() { return this.list.length + this.delayNumber; }
        get finishedIndex() {
            return this.isComplete ? 0 : this.index + this.parallelSuccessNumber;
        }
        get remain() {
            return this.isComplete ? this.total : this.total - this.finishedIndex;
        }
        get percent() {
            const { total } = this;
            let totalTime = 0, runTime = 0;
            for (let i = 0; i < total; i++) {
                if (i <= this.finishedIndex) {
                    runTime += this.list[i].time;
                    if (i === this.finishedIndex)
                        totalTime = runTime;
                }
                else {
                    totalTime += this.list[i].time;
                }
            }
            return this.isComplete ? 1 : (runTime / totalTime);
        }
        constructor(config) {
            this.config = { parallel: 6 };
            this.list = [];
            this.running = false;
            this.isComplete = true;
            this.index = 0;
            this.delayNumber = 0;
            if (config)
                DataHelper.assign(this.config, config);
            this.empty();
        }
        add(taskCallback, options) {
            let start, parallel, time, delay;
            const task = new TaskItem(taskCallback);
            task.parent = this;
            if (typeof options === 'number') {
                delay = options;
            }
            else if (options) {
                parallel = options.parallel;
                start = options.start;
                time = options.time;
                delay = options.delay;
            }
            if (time)
                task.time = time;
            if (parallel === false)
                task.parallel = false;
            if (delay === undefined) {
                this.push(task, start);
            }
            else {
                this.delayNumber++;
                setTimeout(() => {
                    if (this.delayNumber) {
                        this.delayNumber--;
                        this.push(task, start);
                    }
                }, delay);
            }
            this.isComplete = false;
            return task;
        }
        push(task, start) {
            this.list.push(task);
            if (start !== false && !this.timer) {
                this.timer = setTimeout(() => this.start());
            }
        }
        empty() {
            this.index = 0;
            this.parallelSuccessNumber = 0;
            this.list = [];
            this.parallelList = [];
            this.delayNumber = 0;
        }
        start() {
            if (!this.running) {
                this.running = true;
                this.isComplete = false;
                this.run();
            }
        }
        pause() {
            clearTimeout(this.timer);
            this.timer = null;
            this.running = false;
        }
        resume() {
            this.start();
        }
        skip() {
            this.index++;
            this.resume();
        }
        stop() {
            this.isComplete = true;
            this.list.forEach(task => { if (!task.isComplete)
                task.cancel(); });
            this.pause();
            this.empty();
        }
        run() {
            if (!this.running)
                return;
            this.setParallelList();
            if (this.parallelList.length > 1) {
                this.runParallelTasks();
            }
            else {
                this.remain ? this.runTask() : this.onComplete();
            }
        }
        runTask() {
            const task = this.list[this.index];
            if (!task) {
                this.nextTask();
                return;
            }
            task.run().then(() => {
                this.onTask(task);
                this.index++;
                this.nextTask();
            }).catch(error => {
                this.onError(error);
            });
        }
        runParallelTasks() {
            this.parallelList.forEach(task => this.runParallelTask(task));
        }
        runParallelTask(task) {
            task.run().then(() => {
                this.onTask(task);
                this.fillParallelTask();
            }).catch(error => {
                this.onParallelError(error);
            });
        }
        nextTask() {
            if (this.total === this.finishedIndex) {
                this.onComplete();
            }
            else {
                this.timer = setTimeout(() => this.run());
            }
        }
        setParallelList() {
            let task;
            this.parallelList = [];
            this.parallelSuccessNumber = 0;
            let end = this.index + this.config.parallel;
            if (end > this.list.length)
                end = this.list.length;
            for (let i = this.index; i < end; i++) {
                task = this.list[i];
                if (task.parallel) {
                    this.parallelList.push(task);
                }
                else {
                    break;
                }
            }
        }
        fillParallelTask() {
            let task;
            const parallelList = this.parallelList;
            this.parallelSuccessNumber++;
            parallelList.pop();
            const parallelWaitNumber = parallelList.length;
            const nextIndex = this.finishedIndex + parallelWaitNumber;
            if (parallelList.length) {
                if (!this.running)
                    return;
                if (nextIndex < this.total) {
                    task = this.list[nextIndex];
                    if (task && task.parallel) {
                        parallelList.push(task);
                        this.runParallelTask(task);
                    }
                }
            }
            else {
                this.index += this.parallelSuccessNumber;
                this.parallelSuccessNumber = 0;
                this.nextTask();
            }
        }
        onComplete() {
            this.stop();
            if (this.config.onComplete)
                this.config.onComplete();
        }
        onTask(task) {
            task.complete();
            if (this.config.onTask)
                this.config.onTask();
        }
        onParallelError(error) {
            this.parallelList.forEach(task => {
                task.parallel = false;
            });
            this.parallelList.length = 0;
            this.parallelSuccessNumber = 0;
            this.onError(error);
        }
        onError(error) {
            this.pause();
            if (this.config.onError)
                this.config.onError(error);
        }
        destroy() {
            this.stop();
        }
    }

    const ImageManager = {
        map: {},
        recycledList: [],
        tasker: new TaskProcessor(),
        patternTasker: new TaskProcessor(),
        get isComplete() { return I$1.tasker.isComplete; },
        get(config) {
            let image = I$1.map[config.url];
            if (!image) {
                image = Creator.image(config);
                I$1.map[config.url] = image;
            }
            image.use++;
            return image;
        },
        recycle(image) {
            image.use--;
            setTimeout(() => { if (!image.use)
                I$1.recycledList.push(image); });
        },
        clearRecycled() {
            const list = I$1.recycledList;
            if (list.length > 100) {
                list.forEach(image => {
                    if (!image.use && image.url) {
                        delete I$1.map[image.url];
                        image.destroy();
                    }
                });
                list.length = 0;
            }
        },
        hasOpacityPixel(config) {
            return FileHelper.opacityTypes.some(item => I$1.isFormat(item, config));
        },
        isFormat(format, config) {
            if (config.format === format)
                return true;
            const { url } = config;
            if (url.startsWith('data:')) {
                if (url.startsWith('data:' + FileHelper.mineType(format)))
                    return true;
            }
            else {
                if (url.includes('.' + format) || url.includes('.' + FileHelper.upperCaseTypeMap[format]))
                    return true;
                else if (format === 'png' && !url.includes('.'))
                    return true;
            }
            return false;
        },
        destroy() {
            I$1.map = {};
            I$1.recycledList = [];
        }
    };
    const I$1 = ImageManager;

    const { IMAGE, create: create$1 } = IncrementId;
    class LeaferImage {
        get url() { return this.config.url; }
        get completed() { return this.ready || !!this.error; }
        constructor(config) {
            this.use = 0;
            this.waitComplete = [];
            this.innerId = create$1(IMAGE);
            this.config = config || { url: '' };
            this.isSVG = ImageManager.isFormat('svg', config);
            this.hasOpacityPixel = ImageManager.hasOpacityPixel(config);
        }
        load(onSuccess, onError) {
            if (!this.loading) {
                this.loading = true;
                ImageManager.tasker.add(() => __awaiter(this, void 0, void 0, function* () {
                    return yield Platform.origin.loadImage(this.url).then((img) => {
                        this.ready = true;
                        this.width = img.naturalWidth || img.width;
                        this.height = img.naturalHeight || img.height;
                        this.view = img;
                        this.onComplete(true);
                    }).catch((e) => {
                        this.error = e;
                        this.onComplete(false);
                    });
                }));
            }
            this.waitComplete.push(onSuccess, onError);
            return this.waitComplete.length - 2;
        }
        unload(index, stopEvent) {
            const l = this.waitComplete;
            if (stopEvent) {
                const error = l[index + 1];
                if (error)
                    error({ type: 'stop' });
            }
            l[index] = l[index + 1] = undefined;
        }
        onComplete(isSuccess) {
            let odd;
            this.waitComplete.forEach((item, index) => {
                odd = index % 2;
                if (item) {
                    if (isSuccess) {
                        if (!odd)
                            item(this);
                    }
                    else {
                        if (odd)
                            item(this.error);
                    }
                }
            });
            this.waitComplete.length = 0;
            this.loading = false;
        }
        getCanvas(width, height, opacity, _filters) {
            width || (width = this.width);
            height || (height = this.height);
            if (this.cache) {
                let { params, data } = this.cache;
                for (let i in params) {
                    if (params[i] !== arguments[i]) {
                        data = null;
                        break;
                    }
                }
                if (data)
                    return data;
            }
            const canvas = Platform.origin.createCanvas(width, height);
            const ctx = canvas.getContext('2d');
            if (opacity)
                ctx.globalAlpha = opacity;
            ctx.drawImage(this.view, 0, 0, width, height);
            this.cache = this.use > 1 ? { data: canvas, params: arguments } : null;
            return canvas;
        }
        getPattern(canvas, repeat, transform, paint) {
            const pattern = Platform.canvas.createPattern(canvas, repeat);
            try {
                if (transform && pattern.setTransform) {
                    pattern.setTransform(transform);
                    transform = null;
                }
            }
            catch (_a) { }
            if (paint)
                paint.transform = transform;
            return pattern;
        }
        destroy() {
            this.config = { url: '' };
            this.cache = null;
            this.waitComplete.length = 0;
        }
    }

    function defineKey(target, key, descriptor, noConfigurable) {
        if (!noConfigurable)
            descriptor.configurable = descriptor.enumerable = true;
        Object.defineProperty(target, key, descriptor);
    }
    function getDescriptor(object, name) {
        return Object.getOwnPropertyDescriptor(object, name);
    }
    function getNames(object) {
        return Object.getOwnPropertyNames(object);
    }

    function decorateLeafAttr(defaultValue, descriptorFn) {
        return (target, key) => defineLeafAttr(target, key, defaultValue, descriptorFn && descriptorFn(key));
    }
    function attr(partDescriptor) {
        return partDescriptor;
    }
    function defineLeafAttr(target, key, defaultValue, partDescriptor) {
        const defaultDescriptor = {
            get() { return this.__getAttr(key); },
            set(value) { this.__setAttr(key, value); }
        };
        defineKey(target, key, Object.assign(defaultDescriptor, partDescriptor || {}));
        defineDataProcessor(target, key, defaultValue);
    }
    function dataType(defaultValue) {
        return decorateLeafAttr(defaultValue);
    }
    function positionType(defaultValue, checkFiniteNumber) {
        return decorateLeafAttr(defaultValue, (key) => attr({
            set(value) {
                this.__setAttr(key, value, checkFiniteNumber) && (this.__layout.matrixChanged || this.__layout.matrixChange());
            }
        }));
    }
    function autoLayoutType(defaultValue) {
        return decorateLeafAttr(defaultValue, (key) => attr({
            set(value) {
                if (this.__setAttr(key, value)) {
                    this.__layout.matrixChanged || this.__layout.matrixChange();
                    this.__hasAutoLayout = !!(this.origin || this.around || this.flow);
                    if (!this.__local)
                        this.__layout.createLocal();
                }
            }
        }));
    }
    function scaleType(defaultValue, checkFiniteNumber) {
        return decorateLeafAttr(defaultValue, (key) => attr({
            set(value) {
                this.__setAttr(key, value, checkFiniteNumber) && (this.__layout.scaleChanged || this.__layout.scaleChange());
            }
        }));
    }
    function rotationType(defaultValue, checkFiniteNumber) {
        return decorateLeafAttr(defaultValue, (key) => attr({
            set(value) {
                this.__setAttr(key, value, checkFiniteNumber) && (this.__layout.rotationChanged || this.__layout.rotationChange());
            }
        }));
    }
    function boundsType(defaultValue, checkFiniteNumber) {
        return decorateLeafAttr(defaultValue, (key) => attr({
            set(value) {
                this.__setAttr(key, value, checkFiniteNumber) && doBoundsType(this);
            }
        }));
    }
    function naturalBoundsType(defaultValue) {
        return decorateLeafAttr(defaultValue, (key) => attr({
            set(value) {
                this.__setAttr(key, value) && (doBoundsType(this), this.__.__removeNaturalSize());
            }
        }));
    }
    function doBoundsType(leaf) {
        leaf.__layout.boxChanged || leaf.__layout.boxChange();
        if (leaf.__hasAutoLayout)
            leaf.__layout.matrixChanged || leaf.__layout.matrixChange();
    }
    function pathInputType(defaultValue) {
        return decorateLeafAttr(defaultValue, (key) => attr({
            set(value) {
                const data = this.__;
                if (data.__pathInputed !== 2)
                    data.__pathInputed = value ? 1 : 0;
                if (!value)
                    data.__pathForRender = undefined;
                this.__setAttr(key, value);
                doBoundsType(this);
            }
        }));
    }
    const pathType = boundsType;
    function affectStrokeBoundsType(defaultValue) {
        return decorateLeafAttr(defaultValue, (key) => attr({
            set(value) {
                this.__setAttr(key, value) && doStrokeType(this);
            }
        }));
    }
    function doStrokeType(leaf) {
        leaf.__layout.strokeChanged || leaf.__layout.strokeChange();
        if (leaf.__.__useArrow)
            doBoundsType(leaf);
    }
    const strokeType = affectStrokeBoundsType;
    function affectRenderBoundsType(defaultValue) {
        return decorateLeafAttr(defaultValue, (key) => attr({
            set(value) {
                this.__setAttr(key, value);
                this.__layout.renderChanged || this.__layout.renderChange();
            }
        }));
    }
    function surfaceType(defaultValue) {
        return decorateLeafAttr(defaultValue, (key) => attr({
            set(value) {
                this.__setAttr(key, value) && (this.__layout.surfaceChanged || this.__layout.surfaceChange());
            }
        }));
    }
    function opacityType(defaultValue) {
        return decorateLeafAttr(defaultValue, (key) => attr({
            set(value) {
                this.__setAttr(key, value) && (this.__layout.opacityChanged || this.__layout.opacityChange());
            }
        }));
    }
    function visibleType(defaultValue) {
        return decorateLeafAttr(defaultValue, (key) => attr({
            set(value) {
                const oldValue = this.visible;
                if (oldValue === true && value === 0) {
                    if (this.animationOut)
                        return this.__runAnimation('out', () => doVisible(this, key, value, oldValue));
                }
                else if (oldValue === 0 && value === true) {
                    if (this.animation)
                        this.__runAnimation('in');
                }
                doVisible(this, key, value, oldValue);
            }
        }));
    }
    function doVisible(leaf, key, value, oldValue) {
        if (leaf.__setAttr(key, value)) {
            leaf.__layout.opacityChanged || leaf.__layout.opacityChange();
            if (oldValue === 0 || value === 0)
                doBoundsType(leaf);
        }
    }
    function sortType(defaultValue) {
        return decorateLeafAttr(defaultValue, (key) => attr({
            set(value) {
                if (this.__setAttr(key, value)) {
                    this.__layout.surfaceChanged || this.__layout.surfaceChange();
                    this.waitParent(() => { this.parent.__layout.childrenSortChange(); });
                }
            }
        }));
    }
    function maskType(defaultValue) {
        return decorateLeafAttr(defaultValue, (key) => attr({
            set(value) {
                if (this.__setAttr(key, value)) {
                    this.__layout.boxChanged || this.__layout.boxChange();
                    this.waitParent(() => { this.parent.__updateMask(value); });
                }
            }
        }));
    }
    function eraserType(defaultValue) {
        return decorateLeafAttr(defaultValue, (key) => attr({
            set(value) {
                this.__setAttr(key, value) && this.waitParent(() => { this.parent.__updateEraser(value); });
            }
        }));
    }
    function hitType(defaultValue) {
        return decorateLeafAttr(defaultValue, (key) => attr({
            set(value) {
                if (this.__setAttr(key, value)) {
                    this.__layout.hitCanvasChanged = true;
                    if (Debug.showHitView) {
                        this.__layout.surfaceChanged || this.__layout.surfaceChange();
                    }
                    if (this.leafer)
                        this.leafer.updateCursor();
                }
            }
        }));
    }
    function cursorType(defaultValue) {
        return decorateLeafAttr(defaultValue, (key) => attr({
            set(value) {
                this.__setAttr(key, value);
                if (this.leafer)
                    this.leafer.updateCursor();
            }
        }));
    }
    function dataProcessor(processor) {
        return (target, _key) => {
            defineKey(target, '__DataProcessor', {
                get() { return processor; }
            });
        };
    }
    function layoutProcessor(processor) {
        return (target, _key) => {
            defineKey(target, '__LayoutProcessor', {
                get() { return processor; }
            });
        };
    }
    function getSetMethodName(key) {
        return 'set' + key.charAt(0).toUpperCase() + key.slice(1);
    }
    function defineDataProcessor(target, key, defaultValue) {
        const data = target.__DataProcessor.prototype;
        const computedKey = '_' + key;
        const setMethodName = getSetMethodName(key);
        const property = {
            get() {
                const v = this[computedKey];
                return v === undefined ? defaultValue : v;
            },
            set(value) {
                this[computedKey] = value;
            }
        };
        if (defaultValue === undefined) {
            property.get = function () { return this[computedKey]; };
        }
        else if (typeof defaultValue === 'object') {
            const { clone } = DataHelper;
            property.get = function () {
                let v = this[computedKey];
                if (v === undefined)
                    this[computedKey] = v = clone(defaultValue);
                return v;
            };
        }
        if (key === 'width') {
            property.get = function () {
                const v = this[computedKey];
                if (v === undefined) {
                    const t = this;
                    return t._height && t.__naturalWidth && t.__useNaturalRatio ? t._height * t.__naturalWidth / t.__naturalHeight : t.__naturalWidth || defaultValue;
                }
                else {
                    return v;
                }
            };
        }
        else if (key === 'height') {
            property.get = function () {
                const v = this[computedKey];
                if (v === undefined) {
                    const t = this;
                    return t._width && t.__naturalHeight && t.__useNaturalRatio ? t._width * t.__naturalHeight / t.__naturalWidth : t.__naturalHeight || defaultValue;
                }
                else {
                    return v;
                }
            };
        }
        let descriptor, find = data;
        while (!descriptor && find) {
            descriptor = getDescriptor(find, key);
            find = find.__proto__;
        }
        if (descriptor && descriptor.set)
            property.set = descriptor.set;
        if (data[setMethodName]) {
            property.set = data[setMethodName];
            delete data[setMethodName];
        }
        defineKey(data, key, property);
    }

    const debug$9 = new Debug('rewrite');
    const list$1 = [];
    const excludeNames = ['destroy', 'constructor'];
    function rewrite(method) {
        return (target, key) => {
            list$1.push({ name: target.constructor.name + '.' + key, run: () => { target[key] = method; } });
        };
    }
    function rewriteAble() {
        return (_target) => {
            doRewrite();
        };
    }
    function doRewrite(error) {
        if (list$1.length) {
            list$1.forEach(item => {
                if (error)
                    debug$9.error(item.name, '需在Class上装饰@rewriteAble()');
                item.run();
            });
            list$1.length = 0;
        }
    }
    setTimeout(() => doRewrite(true));
    function useModule(module, exclude) {
        return (target) => {
            const names = module.prototype ? getNames(module.prototype) : Object.keys(module);
            names.forEach(name => {
                if (!excludeNames.includes(name) && (!exclude || !exclude.includes(name))) {
                    if (module.prototype) {
                        const d = getDescriptor(module.prototype, name);
                        if (d.writable)
                            target.prototype[name] = module.prototype[name];
                    }
                    else {
                        target.prototype[name] = module[name];
                    }
                }
            });
        };
    }

    function registerUI() {
        return (target) => {
            UICreator.register(target);
        };
    }
    function registerUIEvent() {
        return (target) => {
            EventCreator.register(target);
        };
    }

    const { copy: copy$7, toInnerPoint: toInnerPoint$1, toOuterPoint: toOuterPoint$1, scaleOfOuter: scaleOfOuter$2, rotateOfOuter: rotateOfOuter$2, skewOfOuter, multiplyParent: multiplyParent$2, divideParent, getLayout } = MatrixHelper;
    const matrix$1 = {};
    const LeafHelper = {
        updateAllMatrix(leaf, checkAutoLayout, waitAutoLayout) {
            if (checkAutoLayout && leaf.__hasAutoLayout && leaf.__layout.matrixChanged)
                waitAutoLayout = true;
            updateMatrix$2(leaf, checkAutoLayout, waitAutoLayout);
            if (leaf.isBranch) {
                const { children } = leaf;
                for (let i = 0, len = children.length; i < len; i++) {
                    updateAllMatrix$3(children[i], checkAutoLayout, waitAutoLayout);
                }
            }
        },
        updateMatrix(leaf, checkAutoLayout, waitAutoLayout) {
            const layout = leaf.__layout;
            if (checkAutoLayout) {
                if (waitAutoLayout) {
                    layout.waitAutoLayout = true;
                    if (leaf.__hasAutoLayout)
                        layout.matrixChanged = false;
                }
            }
            else if (layout.waitAutoLayout) {
                layout.waitAutoLayout = false;
            }
            if (layout.matrixChanged)
                leaf.__updateLocalMatrix();
            if (!layout.waitAutoLayout)
                leaf.__updateWorldMatrix();
        },
        updateBounds(leaf) {
            const layout = leaf.__layout;
            if (layout.boundsChanged)
                leaf.__updateLocalBounds();
            if (!layout.waitAutoLayout)
                leaf.__updateWorldBounds();
        },
        updateAllWorldOpacity(leaf) {
            leaf.__updateWorldOpacity();
            if (leaf.isBranch) {
                const { children } = leaf;
                for (let i = 0, len = children.length; i < len; i++) {
                    updateAllWorldOpacity$1(children[i]);
                }
            }
        },
        updateAllChange(leaf) {
            updateAllWorldOpacity$1(leaf);
            leaf.__updateChange();
            if (leaf.isBranch) {
                const { children } = leaf;
                for (let i = 0, len = children.length; i < len; i++) {
                    updateAllChange$1(children[i]);
                }
            }
        },
        worldHittable(t) {
            while (t) {
                if (!t.__.hittable)
                    return false;
                t = t.parent;
            }
            return true;
        },
        moveWorld(t, x, y = 0, isInnerPoint) {
            const local = typeof x === 'object' ? Object.assign({}, x) : { x, y };
            isInnerPoint ? toOuterPoint$1(t.localTransform, local, local, true) : (t.parent && toInnerPoint$1(t.parent.worldTransform, local, local, true));
            L.moveLocal(t, local.x, local.y);
        },
        moveLocal(t, x, y = 0) {
            if (typeof x === 'object') {
                t.x += x.x;
                t.y += x.y;
            }
            else {
                t.x += x;
                t.y += y;
            }
        },
        zoomOfWorld(t, origin, scaleX, scaleY, resize) {
            L.zoomOfLocal(t, getTempLocal(t, origin), scaleX, scaleY, resize);
        },
        zoomOfLocal(t, origin, scaleX, scaleY = scaleX, resize) {
            copy$7(matrix$1, t.__localMatrix);
            scaleOfOuter$2(matrix$1, origin, scaleX, scaleY);
            if (t.origin || t.around) {
                L.setTransform(t, matrix$1, resize);
            }
            else {
                moveByMatrix(t, matrix$1);
                t.scaleResize(scaleX, scaleY, resize !== true);
            }
        },
        rotateOfWorld(t, origin, angle) {
            L.rotateOfLocal(t, getTempLocal(t, origin), angle);
        },
        rotateOfLocal(t, origin, angle) {
            copy$7(matrix$1, t.__localMatrix);
            rotateOfOuter$2(matrix$1, origin, angle);
            if (t.origin || t.around) {
                L.setTransform(t, matrix$1);
            }
            else {
                moveByMatrix(t, matrix$1);
                t.rotation = MathHelper.formatRotation(t.rotation + angle);
            }
        },
        skewOfWorld(t, origin, skewX, skewY, resize) {
            L.skewOfLocal(t, getTempLocal(t, origin), skewX, skewY, resize);
        },
        skewOfLocal(t, origin, skewX, skewY = 0, resize) {
            copy$7(matrix$1, t.__localMatrix);
            skewOfOuter(matrix$1, origin, skewX, skewY);
            L.setTransform(t, matrix$1, resize);
        },
        transformWorld(t, transform, resize) {
            copy$7(matrix$1, t.worldTransform);
            multiplyParent$2(matrix$1, transform);
            if (t.parent)
                divideParent(matrix$1, t.parent.worldTransform);
            L.setTransform(t, matrix$1, resize);
        },
        transform(t, transform, resize) {
            copy$7(matrix$1, t.localTransform);
            multiplyParent$2(matrix$1, transform);
            L.setTransform(t, matrix$1, resize);
        },
        setTransform(t, transform, resize) {
            const layout = getLayout(transform, t.origin && L.getInnerOrigin(t, t.origin), t.around && L.getInnerOrigin(t, t.around));
            if (resize) {
                const scaleX = layout.scaleX / t.scaleX;
                const scaleY = layout.scaleY / t.scaleY;
                delete layout.scaleX;
                delete layout.scaleY;
                t.set(layout);
                t.scaleResize(scaleX, scaleY, resize !== true);
            }
            else {
                t.set(layout);
            }
        },
        getFlipTransform(t, axis) {
            const m = getMatrixData();
            const sign = axis === 'x' ? 1 : -1;
            scaleOfOuter$2(m, L.getLocalOrigin(t, 'center'), -1 * sign, 1 * sign);
            return m;
        },
        getLocalOrigin(t, origin) {
            return PointHelper.tempToOuterOf(L.getInnerOrigin(t, origin), t.localTransform);
        },
        getInnerOrigin(t, origin) {
            const innerOrigin = {};
            AroundHelper.toPoint(origin, t.boxBounds, innerOrigin);
            return innerOrigin;
        },
        getRelativeWorld(t, relative, temp) {
            copy$7(matrix$1, t.worldTransform);
            divideParent(matrix$1, relative.worldTransform);
            return temp ? matrix$1 : Object.assign({}, matrix$1);
        },
        drop(t, parent, index, resize) {
            t.setTransform(L.getRelativeWorld(t, parent, true), resize);
            parent.add(t, index);
        },
        hasParent(p, parent) {
            if (!parent)
                return false;
            while (p) {
                if (parent === p)
                    return true;
                p = p.parent;
            }
        }
    };
    const L = LeafHelper;
    const { updateAllMatrix: updateAllMatrix$3, updateMatrix: updateMatrix$2, updateAllWorldOpacity: updateAllWorldOpacity$1, updateAllChange: updateAllChange$1 } = L;
    function moveByMatrix(t, matrix) {
        const { e, f } = t.__localMatrix;
        t.x += matrix.e - e;
        t.y += matrix.f - f;
    }
    function getTempLocal(t, world) {
        t.__layout.update();
        return t.parent ? PointHelper.tempToInnerOf(world, t.parent.__world) : world;
    }

    const LeafBoundsHelper = {
        worldBounds(target) {
            return target.__world;
        },
        localBoxBounds(target) {
            return target.__.eraser || target.__.visible === 0 ? null : (target.__local || target.__layout);
        },
        localStrokeBounds(target) {
            return target.__.eraser || target.__.visible === 0 ? null : target.__layout.localStrokeBounds;
        },
        localRenderBounds(target) {
            return target.__.eraser || target.__.visible === 0 ? null : target.__layout.localRenderBounds;
        },
        maskLocalBoxBounds(target) {
            return target.__.mask ? target.__localBoxBounds : null;
        },
        maskLocalStrokeBounds(target) {
            return target.__.mask ? target.__layout.localStrokeBounds : null;
        },
        maskLocalRenderBounds(target) {
            return target.__.mask ? target.__layout.localRenderBounds : null;
        },
        excludeRenderBounds(child, options) {
            if (options.bounds && !options.bounds.hit(child.__world, options.matrix))
                return true;
            if (options.hideBounds && options.hideBounds.includes(child.__world, options.matrix))
                return true;
            return false;
        }
    };

    const { updateBounds: updateBounds$2 } = LeafHelper;
    const BranchHelper = {
        sort(a, b) {
            return (a.__.zIndex === b.__.zIndex) ? (a.__tempNumber - b.__tempNumber) : (a.__.zIndex - b.__.zIndex);
        },
        pushAllChildBranch(branch, leafList) {
            branch.__tempNumber = 1;
            if (branch.__.__childBranchNumber) {
                const { children } = branch;
                for (let i = 0, len = children.length; i < len; i++) {
                    branch = children[i];
                    if (branch.isBranch) {
                        branch.__tempNumber = 1;
                        leafList.add(branch);
                        pushAllChildBranch$1(branch, leafList);
                    }
                }
            }
        },
        pushAllParent(leaf, leafList) {
            const { keys } = leafList;
            if (keys) {
                while (leaf.parent) {
                    if (keys[leaf.parent.innerId] === undefined) {
                        leafList.add(leaf.parent);
                        leaf = leaf.parent;
                    }
                    else {
                        break;
                    }
                }
            }
            else {
                while (leaf.parent) {
                    leafList.add(leaf.parent);
                    leaf = leaf.parent;
                }
            }
        },
        pushAllBranchStack(branch, pushList) {
            let start = pushList.length;
            const { children } = branch;
            for (let i = 0, len = children.length; i < len; i++) {
                if (children[i].isBranch) {
                    pushList.push(children[i]);
                }
            }
            for (let i = start, len = pushList.length; i < len; i++) {
                pushAllBranchStack(pushList[i], pushList);
            }
        },
        updateBounds(branch, exclude) {
            const branchStack = [branch];
            pushAllBranchStack(branch, branchStack);
            updateBoundsByBranchStack(branchStack, exclude);
        },
        updateBoundsByBranchStack(branchStack, exclude) {
            let branch, children;
            for (let i = branchStack.length - 1; i > -1; i--) {
                branch = branchStack[i];
                children = branch.children;
                for (let j = 0, len = children.length; j < len; j++) {
                    updateBounds$2(children[j]);
                }
                if (exclude && exclude === branch)
                    continue;
                updateBounds$2(branch);
            }
        }
    };
    const { pushAllChildBranch: pushAllChildBranch$1, pushAllBranchStack, updateBoundsByBranchStack } = BranchHelper;

    const WaitHelper = {
        run(wait) {
            if (wait && wait.length) {
                const len = wait.length;
                for (let i = 0; i < len; i++) {
                    wait[i]();
                }
                wait.length === len ? wait.length = 0 : wait.splice(0, len);
            }
        }
    };

    const { getRelativeWorld: getRelativeWorld$1 } = LeafHelper;
    const { toOuterOf: toOuterOf$2, getPoints, copy: copy$6 } = BoundsHelper;
    const localContent = '_localContentBounds';
    const worldContent = '_worldContentBounds', worldBox = '_worldBoxBounds', worldStroke = '_worldStrokeBounds';
    class LeafLayout {
        get contentBounds() { return this._contentBounds || this.boxBounds; }
        set contentBounds(bounds) { this._contentBounds = bounds; }
        get strokeBounds() { return this._strokeBounds || this.boxBounds; }
        get renderBounds() { return this._renderBounds || this.boxBounds; }
        get localContentBounds() { toOuterOf$2(this.contentBounds, this.leaf.__localMatrix, this[localContent] || (this[localContent] = {})); return this[localContent]; }
        get localStrokeBounds() { return this._localStrokeBounds || this; }
        get localRenderBounds() { return this._localRenderBounds || this; }
        get worldContentBounds() { toOuterOf$2(this.contentBounds, this.leaf.__world, this[worldContent] || (this[worldContent] = {})); return this[worldContent]; }
        get worldBoxBounds() { toOuterOf$2(this.boxBounds, this.leaf.__world, this[worldBox] || (this[worldBox] = {})); return this[worldBox]; }
        get worldStrokeBounds() { toOuterOf$2(this.strokeBounds, this.leaf.__world, this[worldStroke] || (this[worldStroke] = {})); return this[worldStroke]; }
        get a() { return 1; }
        get b() { return 0; }
        get c() { return 0; }
        get d() { return 1; }
        get e() { return this.leaf.__.x; }
        get f() { return this.leaf.__.y; }
        get x() { return this.e + this.boxBounds.x; }
        get y() { return this.f + this.boxBounds.y; }
        get width() { return this.boxBounds.width; }
        get height() { return this.boxBounds.height; }
        constructor(leaf) {
            this.leaf = leaf;
            this.boxBounds = { x: 0, y: 0, width: 0, height: 0 };
            if (this.leaf.__local)
                this._localRenderBounds = this._localStrokeBounds = this.leaf.__local;
            this.boxChange();
            this.matrixChange();
        }
        createLocal() {
            const local = this.leaf.__local = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0, x: 0, y: 0, width: 0, height: 0 };
            if (!this._localStrokeBounds)
                this._localStrokeBounds = local;
            if (!this._localRenderBounds)
                this._localRenderBounds = local;
        }
        update() {
            const { leafer } = this.leaf;
            if (leafer) {
                if (leafer.ready)
                    leafer.watcher.changed && leafer.layouter.layout();
                else
                    leafer.start();
            }
            else {
                let root = this.leaf;
                while (root.parent && !root.parent.leafer) {
                    root = root.parent;
                }
                Platform.layout(root);
            }
        }
        getTransform(relative = 'world') {
            this.update();
            const { leaf } = this;
            switch (relative) {
                case 'world':
                    return leaf.__world;
                case 'local':
                    return leaf.__localMatrix;
                case 'inner':
                    return MatrixHelper.defaultMatrix;
                case 'page':
                    relative = leaf.zoomLayer;
                default:
                    return getRelativeWorld$1(leaf, relative);
            }
        }
        getBounds(type, relative = 'world') {
            this.update();
            switch (relative) {
                case 'world':
                    return this.getWorldBounds(type);
                case 'local':
                    return this.getLocalBounds(type);
                case 'inner':
                    return this.getInnerBounds(type);
                case 'page':
                    relative = this.leaf.zoomLayer;
                default:
                    return new Bounds(this.getInnerBounds(type)).toOuterOf(this.getTransform(relative));
            }
        }
        getInnerBounds(type = 'box') {
            switch (type) {
                case 'render':
                    return this.renderBounds;
                case 'content':
                    if (this.contentBounds)
                        return this.contentBounds;
                case 'box':
                    return this.boxBounds;
                case 'stroke':
                    return this.strokeBounds;
            }
        }
        getLocalBounds(type = 'box') {
            switch (type) {
                case 'render':
                    return this.localRenderBounds;
                case 'stroke':
                    return this.localStrokeBounds;
                case 'content':
                    if (this.contentBounds)
                        return this.localContentBounds;
                case 'box':
                    return this.leaf.__localBoxBounds;
            }
        }
        getWorldBounds(type = 'box') {
            switch (type) {
                case 'render':
                    return this.leaf.__world;
                case 'stroke':
                    return this.worldStrokeBounds;
                case 'content':
                    if (this.contentBounds)
                        return this.worldContentBounds;
                case 'box':
                    return this.worldBoxBounds;
            }
        }
        getLayoutBounds(type, relative = 'world', unscale) {
            const { leaf } = this;
            let point, matrix, layoutBounds, bounds = this.getInnerBounds(type);
            switch (relative) {
                case 'world':
                    point = leaf.getWorldPoint(bounds);
                    matrix = leaf.__world;
                    break;
                case 'local':
                    const { scaleX, scaleY, rotation, skewX, skewY } = leaf.__;
                    layoutBounds = { scaleX, scaleY, rotation, skewX, skewY };
                    point = leaf.getLocalPointByInner(bounds);
                    break;
                case 'inner':
                    point = bounds;
                    matrix = MatrixHelper.defaultMatrix;
                    break;
                case 'page':
                    relative = leaf.zoomLayer;
                default:
                    point = leaf.getWorldPoint(bounds, relative);
                    matrix = getRelativeWorld$1(leaf, relative, true);
            }
            if (!layoutBounds)
                layoutBounds = MatrixHelper.getLayout(matrix);
            copy$6(layoutBounds, bounds);
            PointHelper.copy(layoutBounds, point);
            if (unscale) {
                const { scaleX, scaleY } = layoutBounds;
                const uScaleX = Math.abs(scaleX);
                const uScaleY = Math.abs(scaleY);
                if (uScaleX !== 1 || uScaleY !== 1) {
                    layoutBounds.scaleX /= uScaleX;
                    layoutBounds.scaleY /= uScaleY;
                    layoutBounds.width *= uScaleX;
                    layoutBounds.height *= uScaleY;
                }
            }
            return layoutBounds;
        }
        getLayoutPoints(type, relative = 'world') {
            const { leaf } = this;
            const points = getPoints(this.getInnerBounds(type));
            let relativeLeaf;
            switch (relative) {
                case 'world':
                    relativeLeaf = null;
                    break;
                case 'local':
                    relativeLeaf = leaf.parent;
                    break;
                case 'inner':
                    break;
                case 'page':
                    relative = leaf.zoomLayer;
                default:
                    relativeLeaf = relative;
            }
            if (relativeLeaf !== undefined)
                points.forEach(point => leaf.innerToWorld(point, null, false, relativeLeaf));
            return points;
        }
        shrinkContent() {
            const { x, y, width, height } = this.boxBounds;
            this._contentBounds = { x, y, width, height };
        }
        spreadStroke() {
            const { x, y, width, height } = this.strokeBounds;
            this._strokeBounds = { x, y, width, height };
            this._localStrokeBounds = { x, y, width, height };
            if (!this.renderSpread)
                this.spreadRenderCancel();
        }
        spreadRender() {
            const { x, y, width, height } = this.renderBounds;
            this._renderBounds = { x, y, width, height };
            this._localRenderBounds = { x, y, width, height };
        }
        shrinkContentCancel() {
            this._contentBounds = undefined;
        }
        spreadStrokeCancel() {
            const same = this.renderBounds === this.strokeBounds;
            this._strokeBounds = this.boxBounds;
            this._localStrokeBounds = this.leaf.__localBoxBounds;
            if (same)
                this.spreadRenderCancel();
        }
        spreadRenderCancel() {
            this._renderBounds = this._strokeBounds;
            this._localRenderBounds = this._localStrokeBounds;
        }
        boxChange() {
            this.boxChanged = true;
            this.localBoxChanged || this.localBoxChange();
            this.hitCanvasChanged = true;
        }
        localBoxChange() {
            this.localBoxChanged = true;
            this.boundsChanged = true;
        }
        strokeChange() {
            this.strokeChanged = true;
            this.strokeSpread || (this.strokeSpread = 1);
            this.boundsChanged = true;
            this.hitCanvasChanged = true;
        }
        renderChange() {
            this.renderChanged = true;
            this.renderSpread || (this.renderSpread = 1);
            this.boundsChanged = true;
        }
        scaleChange() {
            this.scaleChanged = true;
            this._scaleOrRotationChange();
        }
        rotationChange() {
            this.rotationChanged = true;
            this.affectRotation = true;
            this._scaleOrRotationChange();
        }
        _scaleOrRotationChange() {
            this.affectScaleOrRotation = true;
            this.matrixChange();
            if (!this.leaf.__local)
                this.createLocal();
        }
        matrixChange() {
            this.matrixChanged = true;
            this.localBoxChanged || this.localBoxChange();
        }
        surfaceChange() {
            this.surfaceChanged = true;
        }
        opacityChange() {
            this.opacityChanged = true;
            this.surfaceChanged || this.surfaceChange();
        }
        childrenSortChange() {
            if (!this.childrenSortChanged) {
                this.childrenSortChanged = true;
                this.leaf.forceUpdate('surface');
            }
        }
        destroy() { }
    }

    class Event {
        constructor(type, target) {
            this.bubbles = false;
            this.type = type;
            if (target)
                this.target = target;
        }
        stopDefault() {
            this.isStopDefault = true;
            if (this.origin)
                Platform.event.stopDefault(this.origin);
        }
        stopNow() {
            this.isStopNow = true;
            this.isStop = true;
            if (this.origin)
                Platform.event.stopNow(this.origin);
        }
        stop() {
            this.isStop = true;
            if (this.origin)
                Platform.event.stop(this.origin);
        }
    }

    class ChildEvent extends Event {
        constructor(type, child, parent) {
            super(type, child);
            this.parent = parent;
            this.child = child;
        }
    }
    ChildEvent.ADD = 'child.add';
    ChildEvent.REMOVE = 'child.remove';
    ChildEvent.CREATED = 'created';
    ChildEvent.MOUNTED = 'mounted';
    ChildEvent.UNMOUNTED = 'unmounted';
    ChildEvent.DESTROY = 'destroy';

    class PropertyEvent extends Event {
        constructor(type, target, attrName, oldValue, newValue) {
            super(type, target);
            this.attrName = attrName;
            this.oldValue = oldValue;
            this.newValue = newValue;
        }
    }
    PropertyEvent.CHANGE = 'property.change';
    PropertyEvent.LEAFER_CHANGE = 'property.leafer_change';

    class ImageEvent extends Event {
        constructor(type, data) {
            super(type);
            Object.assign(this, data);
        }
    }
    ImageEvent.LOAD = 'image.load';
    ImageEvent.LOADED = 'image.loaded';
    ImageEvent.ERROR = 'image.error';

    class ResizeEvent extends Event {
        get bigger() {
            if (!this.old)
                return true;
            const { width, height } = this.old;
            return this.width >= width && this.height >= height;
        }
        get smaller() {
            return !this.bigger;
        }
        get samePixelRatio() {
            if (!this.old)
                return true;
            return this.pixelRatio === this.old.pixelRatio;
        }
        constructor(size, oldSize) {
            if (typeof size === 'object') {
                super(ResizeEvent.RESIZE);
                Object.assign(this, size);
            }
            else {
                super(size);
            }
            this.old = oldSize;
        }
    }
    ResizeEvent.RESIZE = 'resize';

    class WatchEvent extends Event {
        constructor(type, data) {
            super(type);
            this.data = data;
        }
    }
    WatchEvent.REQUEST = 'watch.request';
    WatchEvent.DATA = 'watch.data';

    class LayoutEvent extends Event {
        constructor(type, data, times) {
            super(type);
            if (data) {
                this.data = data;
                this.times = times;
            }
        }
    }
    LayoutEvent.CHECK_UPDATE = 'layout.check_update';
    LayoutEvent.REQUEST = 'layout.request';
    LayoutEvent.START = 'layout.start';
    LayoutEvent.BEFORE = 'layout.before';
    LayoutEvent.LAYOUT = 'layout';
    LayoutEvent.AFTER = 'layout.after';
    LayoutEvent.AGAIN = 'layout.again';
    LayoutEvent.END = 'layout.end';

    class RenderEvent extends Event {
        constructor(type, times, bounds, options) {
            super(type);
            if (times)
                this.times = times;
            if (bounds) {
                this.renderBounds = bounds;
                this.renderOptions = options;
            }
        }
    }
    RenderEvent.REQUEST = 'render.request';
    RenderEvent.CHILD_START = 'render.child_start';
    RenderEvent.START = 'render.start';
    RenderEvent.BEFORE = 'render.before';
    RenderEvent.RENDER = 'render';
    RenderEvent.AFTER = 'render.after';
    RenderEvent.AGAIN = 'render.again';
    RenderEvent.END = 'render.end';
    RenderEvent.NEXT = 'render.next';

    class LeaferEvent extends Event {
    }
    LeaferEvent.START = 'leafer.start';
    LeaferEvent.BEFORE_READY = 'leafer.before_ready';
    LeaferEvent.READY = 'leafer.ready';
    LeaferEvent.AFTER_READY = 'leafer.after_ready';
    LeaferEvent.VIEW_READY = 'leafer.view_ready';
    LeaferEvent.VIEW_COMPLETED = 'leafer.view_completed';
    LeaferEvent.STOP = 'leafer.stop';
    LeaferEvent.RESTART = 'leafer.restart';
    LeaferEvent.END = 'leafer.end';

    const empty = {};
    class Eventer {
        set event(map) { this.on(map); }
        on(type, listener, options) {
            if (!listener) {
                let event, map = type;
                for (let key in map)
                    event = map[key], event instanceof Array ? this.on(key, event[0], event[1]) : this.on(key, event);
                return;
            }
            let capture, once;
            if (options) {
                if (options === 'once') {
                    once = true;
                }
                else if (typeof options === 'boolean') {
                    capture = options;
                }
                else {
                    capture = options.capture;
                    once = options.once;
                }
            }
            let events;
            const map = __getListenerMap(this, capture, true);
            const typeList = typeof type === 'string' ? type.split(' ') : type;
            const item = once ? { listener, once } : { listener };
            typeList.forEach(type => {
                if (type) {
                    events = map[type];
                    if (events) {
                        if (events.findIndex(item => item.listener === listener) === -1)
                            events.push(item);
                    }
                    else {
                        map[type] = [item];
                    }
                }
            });
        }
        off(type, listener, options) {
            if (type) {
                const typeList = typeof type === 'string' ? type.split(' ') : type;
                if (listener) {
                    let capture;
                    if (options)
                        capture = typeof options === 'boolean' ? options : (options === 'once' ? false : options.capture);
                    let events, index;
                    const map = __getListenerMap(this, capture);
                    typeList.forEach(type => {
                        if (type) {
                            events = map[type];
                            if (events) {
                                index = events.findIndex(item => item.listener === listener);
                                if (index > -1)
                                    events.splice(index, 1);
                                if (!events.length)
                                    delete map[type];
                            }
                        }
                    });
                }
                else {
                    const { __bubbleMap: b, __captureMap: c } = this;
                    typeList.forEach(type => {
                        if (b)
                            delete b[type];
                        if (c)
                            delete c[type];
                    });
                }
            }
            else {
                this.__bubbleMap = this.__captureMap = undefined;
            }
        }
        on_(type, listener, bind, options) {
            if (bind)
                listener = listener.bind(bind);
            this.on(type, listener, options);
            return { type, current: this, listener, options };
        }
        off_(id) {
            if (!id)
                return;
            const list = id instanceof Array ? id : [id];
            list.forEach(item => item.current.off(item.type, item.listener, item.options));
            list.length = 0;
        }
        once(type, listener, capture) {
            this.on(type, listener, { once: true, capture });
        }
        emit(type, event, capture) {
            if (!event && EventCreator.has(type))
                event = EventCreator.get(type, { type, target: this, current: this });
            const map = __getListenerMap(this, capture);
            const list = map[type];
            if (list) {
                let item;
                for (let i = 0, len = list.length; i < len; i++) {
                    item = list[i];
                    item.listener(event);
                    if (item.once) {
                        this.off(type, item.listener, capture);
                        i--, len--;
                    }
                    if (event && event.isStopNow)
                        break;
                }
            }
            this.syncEventer && this.syncEventer.emitEvent(event, capture);
        }
        emitEvent(event, capture) {
            event.current = this;
            this.emit(event.type, event, capture);
        }
        hasEvent(type, capture) {
            if (this.syncEventer && this.syncEventer.hasEvent(type, capture))
                return true;
            const { __bubbleMap: b, __captureMap: c } = this;
            const hasB = b && b[type], hasC = c && c[type];
            return !!(capture === undefined ? (hasB || hasC) : (capture ? hasC : hasB));
        }
        destroy() {
            this.__captureMap = this.__bubbleMap = this.syncEventer = null;
        }
    }
    function __getListenerMap(eventer, capture, create) {
        if (capture) {
            const { __captureMap: c } = eventer;
            if (c) {
                return c;
            }
            else {
                return create ? eventer.__captureMap = {} : empty;
            }
        }
        else {
            const { __bubbleMap: b } = eventer;
            if (b) {
                return b;
            }
            else {
                return create ? eventer.__bubbleMap = {} : empty;
            }
        }
    }

    const { on, on_, off, off_, once, emit: emit$2, emitEvent: emitEvent$1, hasEvent, destroy } = Eventer.prototype;
    const LeafEventer = { on, on_, off, off_, once, emit: emit$2, emitEvent: emitEvent$1, hasEvent, destroyEventer: destroy };

    const { isFinite } = Number;
    const debug$8 = Debug.get('setAttr');
    const LeafDataProxy = {
        __setAttr(name, newValue, checkFiniteNumber) {
            if (this.leaferIsCreated) {
                const oldValue = this.__.__getInput(name);
                if (checkFiniteNumber && !isFinite(newValue) && newValue !== undefined) {
                    debug$8.warn(this.innerName, name, newValue);
                    newValue = undefined;
                }
                if (typeof newValue === 'object' || oldValue !== newValue) {
                    this.__realSetAttr(name, newValue);
                    const { CHANGE } = PropertyEvent;
                    const event = new PropertyEvent(CHANGE, this, name, oldValue, newValue);
                    if (this.isLeafer) {
                        this.emitEvent(new PropertyEvent(PropertyEvent.LEAFER_CHANGE, this, name, oldValue, newValue));
                    }
                    else {
                        if (this.hasEvent(CHANGE))
                            this.emitEvent(event);
                    }
                    this.leafer.emitEvent(event);
                    return true;
                }
                else {
                    return false;
                }
            }
            else {
                this.__realSetAttr(name, newValue);
                return true;
            }
        },
        __realSetAttr(name, newValue) {
            const data = this.__;
            data[name] = newValue;
            if (this.__proxyData)
                this.setProxyAttr(name, newValue);
            if (data.normalStyle)
                this.lockNormalStyle || data.normalStyle[name] === undefined || (data.normalStyle[name] = newValue);
        },
        __getAttr(name) {
            if (this.__proxyData)
                return this.getProxyAttr(name);
            return this.__.__get(name);
        }
    };

    const { setLayout, multiplyParent: multiplyParent$1, translateInner, defaultWorld } = MatrixHelper;
    const { toPoint: toPoint$3, tempPoint: tempPoint$1 } = AroundHelper;
    const LeafMatrix = {
        __updateWorldMatrix() {
            multiplyParent$1(this.__local || this.__layout, this.parent ? this.parent.__world : defaultWorld, this.__world, !!this.__layout.affectScaleOrRotation, this.__, this.parent && this.parent.__);
        },
        __updateLocalMatrix() {
            if (this.__local) {
                const layout = this.__layout, local = this.__local, data = this.__;
                if (layout.affectScaleOrRotation) {
                    if (layout.scaleChanged || layout.rotationChanged) {
                        setLayout(local, data, null, null, layout.affectRotation);
                        layout.scaleChanged = layout.rotationChanged = false;
                    }
                }
                local.e = data.x + data.offsetX;
                local.f = data.y + data.offsetY;
                if (data.around || data.origin) {
                    toPoint$3(data.around || data.origin, layout.boxBounds, tempPoint$1);
                    translateInner(local, -tempPoint$1.x, -tempPoint$1.y, !data.around);
                }
            }
            this.__layout.matrixChanged = false;
        }
    };

    const { updateMatrix: updateMatrix$1, updateAllMatrix: updateAllMatrix$2 } = LeafHelper;
    const { updateBounds: updateBounds$1 } = BranchHelper;
    const { toOuterOf: toOuterOf$1, copyAndSpread: copyAndSpread$1, copy: copy$5 } = BoundsHelper;
    const { toBounds: toBounds$2 } = PathBounds;
    const LeafBounds = {
        __updateWorldBounds() {
            toOuterOf$1(this.__layout.renderBounds, this.__world, this.__world);
            if (this.__layout.resized) {
                this.__onUpdateSize();
                this.__layout.resized = false;
            }
        },
        __updateLocalBounds() {
            const layout = this.__layout;
            if (layout.boxChanged) {
                if (!this.__.__pathInputed)
                    this.__updatePath();
                this.__updateRenderPath();
                this.__updateBoxBounds();
                layout.resized = true;
            }
            if (layout.localBoxChanged) {
                if (this.__local)
                    this.__updateLocalBoxBounds();
                layout.localBoxChanged = false;
                if (layout.strokeSpread)
                    layout.strokeChanged = true;
                if (layout.renderSpread)
                    layout.renderChanged = true;
                if (this.parent)
                    this.parent.__layout.boxChange();
            }
            layout.boxChanged = false;
            if (layout.strokeChanged) {
                layout.strokeSpread = this.__updateStrokeSpread();
                if (layout.strokeSpread) {
                    if (layout.strokeBounds === layout.boxBounds)
                        layout.spreadStroke();
                    this.__updateStrokeBounds();
                    this.__updateLocalStrokeBounds();
                }
                else {
                    layout.spreadStrokeCancel();
                }
                layout.strokeChanged = false;
                if (layout.renderSpread || layout.strokeSpread !== layout.strokeBoxSpread)
                    layout.renderChanged = true;
                if (this.parent)
                    this.parent.__layout.strokeChange();
                layout.resized = true;
            }
            if (layout.renderChanged) {
                layout.renderSpread = this.__updateRenderSpread();
                if (layout.renderSpread) {
                    if (layout.renderBounds === layout.boxBounds || layout.renderBounds === layout.strokeBounds)
                        layout.spreadRender();
                    this.__updateRenderBounds();
                    this.__updateLocalRenderBounds();
                }
                else {
                    layout.spreadRenderCancel();
                }
                layout.renderChanged = false;
                if (this.parent)
                    this.parent.__layout.renderChange();
            }
            layout.boundsChanged = false;
        },
        __updateLocalBoxBounds() {
            if (this.__hasMotionPath)
                this.__updateMotionPath();
            if (this.__hasAutoLayout)
                this.__updateAutoLayout();
            toOuterOf$1(this.__layout.boxBounds, this.__local, this.__local);
        },
        __updateLocalStrokeBounds() {
            toOuterOf$1(this.__layout.strokeBounds, this.__localMatrix, this.__layout.localStrokeBounds);
        },
        __updateLocalRenderBounds() {
            toOuterOf$1(this.__layout.renderBounds, this.__localMatrix, this.__layout.localRenderBounds);
        },
        __updateBoxBounds() {
            const b = this.__layout.boxBounds;
            const data = this.__;
            if (data.__pathInputed) {
                toBounds$2(data.path, b);
            }
            else {
                b.x = 0;
                b.y = 0;
                b.width = data.width;
                b.height = data.height;
            }
        },
        __updateAutoLayout() {
            this.__layout.matrixChanged = true;
            if (this.isBranch) {
                if (this.leaferIsReady)
                    this.leafer.layouter.addExtra(this);
                if (this.__.flow) {
                    if (this.__layout.boxChanged)
                        this.__updateFlowLayout();
                    updateAllMatrix$2(this);
                    updateBounds$1(this, this);
                    if (this.__.__autoSide)
                        this.__updateBoxBounds(true);
                }
                else {
                    updateAllMatrix$2(this);
                    updateBounds$1(this, this);
                }
            }
            else {
                updateMatrix$1(this);
            }
        },
        __updateNaturalSize() {
            const { __: data, __layout: layout } = this;
            data.__naturalWidth = layout.boxBounds.width;
            data.__naturalHeight = layout.boxBounds.height;
        },
        __updateStrokeBounds() {
            const layout = this.__layout;
            copyAndSpread$1(layout.strokeBounds, layout.boxBounds, layout.strokeBoxSpread);
        },
        __updateRenderBounds() {
            const layout = this.__layout;
            layout.renderSpread > 0 ? copyAndSpread$1(layout.renderBounds, layout.boxBounds, layout.renderSpread) : copy$5(layout.renderBounds, layout.strokeBounds);
        }
    };

    const LeafRender = {
        __render(canvas, options) {
            if (this.__worldOpacity) {
                canvas.setWorld(this.__nowWorld = this.__getNowWorld(options));
                canvas.opacity = this.__.opacity;
                if (this.__.__single) {
                    if (this.__.eraser === 'path')
                        return this.__renderEraser(canvas, options);
                    const tempCanvas = canvas.getSameCanvas(true, true);
                    this.__draw(tempCanvas, options);
                    if (this.__worldFlipped) {
                        canvas.copyWorldByReset(tempCanvas, this.__nowWorld, null, this.__.__blendMode, true);
                    }
                    else {
                        canvas.copyWorldToInner(tempCanvas, this.__nowWorld, this.__layout.renderBounds, this.__.__blendMode);
                    }
                    tempCanvas.recycle(this.__nowWorld);
                }
                else {
                    this.__draw(canvas, options);
                }
            }
        },
        __clip(canvas, options) {
            if (this.__worldOpacity) {
                canvas.setWorld(this.__nowWorld = this.__getNowWorld(options));
                this.__drawRenderPath(canvas);
                this.windingRule ? canvas.clip(this.windingRule) : canvas.clip();
            }
        },
        __updateWorldOpacity() {
            this.__worldOpacity = this.__.visible ? (this.parent ? this.parent.__worldOpacity * this.__.opacity : this.__.opacity) : 0;
            if (this.__layout.opacityChanged)
                this.__layout.opacityChanged = false;
        }
    };

    const { excludeRenderBounds: excludeRenderBounds$1 } = LeafBoundsHelper;
    const BranchRender = {
        __updateChange() {
            const { __layout: layout } = this;
            if (layout.childrenSortChanged) {
                this.__updateSortChildren();
                layout.childrenSortChanged = false;
            }
            this.__.__checkSingle();
        },
        __render(canvas, options) {
            if (this.__worldOpacity) {
                if (this.__.__single) {
                    if (this.__.eraser === 'path')
                        return this.__renderEraser(canvas, options);
                    const tempCanvas = canvas.getSameCanvas(false, true);
                    this.__renderBranch(tempCanvas, options);
                    const nowWorld = this.__getNowWorld(options);
                    canvas.opacity = this.__.opacity;
                    canvas.copyWorldByReset(tempCanvas, nowWorld, nowWorld, this.__.__blendMode, true);
                    tempCanvas.recycle(nowWorld);
                }
                else {
                    this.__renderBranch(canvas, options);
                }
            }
        },
        __renderBranch(canvas, options) {
            if (this.__hasMask) {
                this.__renderMask(canvas, options);
            }
            else {
                const { children } = this;
                for (let i = 0, len = children.length; i < len; i++) {
                    if (excludeRenderBounds$1(children[i], options))
                        continue;
                    children[i].__render(canvas, options);
                }
            }
        },
        __clip(canvas, options) {
            if (this.__worldOpacity) {
                const { children } = this;
                for (let i = 0, len = children.length; i < len; i++) {
                    if (excludeRenderBounds$1(children[i], options))
                        continue;
                    children[i].__clip(canvas, options);
                }
            }
        }
    };

    const { LEAF, create } = IncrementId;
    const { toInnerPoint, toOuterPoint, multiplyParent } = MatrixHelper;
    const { toOuterOf } = BoundsHelper;
    const { copy: copy$4, move } = PointHelper;
    const { moveLocal, zoomOfLocal, rotateOfLocal, skewOfLocal, moveWorld, zoomOfWorld, rotateOfWorld, skewOfWorld, transform, transformWorld, setTransform, getFlipTransform, getLocalOrigin, getRelativeWorld, drop } = LeafHelper;
    exports.Leaf = class Leaf {
        get tag() { return this.__tag; }
        set tag(_value) { }
        get __tag() { return 'Leaf'; }
        get innerName() { return this.__.name || this.tag + this.innerId; }
        get __DataProcessor() { return LeafData; }
        get __LayoutProcessor() { return LeafLayout; }
        get leaferIsCreated() { return this.leafer && this.leafer.created; }
        get leaferIsReady() { return this.leafer && this.leafer.ready; }
        get isLeafer() { return false; }
        get isBranch() { return false; }
        get isBranchLeaf() { return false; }
        get __localMatrix() { return this.__local || this.__layout; }
        get __localBoxBounds() { return this.__local || this.__layout; }
        get worldTransform() { return this.__layout.getTransform('world'); }
        get localTransform() { return this.__layout.getTransform('local'); }
        get boxBounds() { return this.getBounds('box', 'inner'); }
        get renderBounds() { return this.getBounds('render', 'inner'); }
        get worldBoxBounds() { return this.getBounds('box'); }
        get worldStrokeBounds() { return this.getBounds('stroke'); }
        get worldRenderBounds() { return this.getBounds('render'); }
        get worldOpacity() { this.__layout.update(); return this.__worldOpacity; }
        get __worldFlipped() { return this.__world.scaleX < 0 || this.__world.scaleY < 0; }
        get __onlyHitMask() { return this.__hasMask && !this.__.hitChildren; }
        get __ignoreHitWorld() { return (this.__hasMask || this.__hasEraser) && this.__.hitChildren; }
        get __inLazyBounds() { const { leafer } = this; return leafer && leafer.created && leafer.lazyBounds.hit(this.__world); }
        get pathInputed() { return this.__.__pathInputed; }
        set event(map) { this.on(map); }
        constructor(data) {
            this.innerId = create(LEAF);
            this.reset(data);
            if (this.__bubbleMap)
                this.__emitLifeEvent(ChildEvent.CREATED);
        }
        reset(data) {
            if (this.leafer)
                this.leafer.forceRender(this.__world);
            this.__world = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0, x: 0, y: 0, width: 0, height: 0, scaleX: 1, scaleY: 1 };
            if (data !== null)
                this.__local = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0, x: 0, y: 0, width: 0, height: 0 };
            this.__worldOpacity = 1;
            this.__ = new this.__DataProcessor(this);
            this.__layout = new this.__LayoutProcessor(this);
            if (this.__level)
                this.resetCustom();
            if (data) {
                if (data.__)
                    data = data.toJSON();
                data.children ? this.set(data) : Object.assign(this, data);
            }
        }
        resetCustom() {
            this.__hasMask = this.__hasEraser = null;
            this.forceUpdate();
        }
        waitParent(item, bind) {
            if (bind)
                item = item.bind(bind);
            this.parent ? item() : this.on(ChildEvent.ADD, item, 'once');
        }
        waitLeafer(item, bind) {
            if (bind)
                item = item.bind(bind);
            this.leafer ? item() : this.on(ChildEvent.MOUNTED, item, 'once');
        }
        nextRender(item, bind, off) {
            this.leafer ? this.leafer.nextRender(item, bind, off) : this.waitLeafer(() => this.leafer.nextRender(item, bind, off));
        }
        removeNextRender(item) {
            this.nextRender(item, null, 'off');
        }
        __bindLeafer(leafer) {
            if (this.isLeafer && leafer !== null)
                leafer = this;
            if (this.leafer && !leafer)
                this.leafer.leafs--;
            this.leafer = leafer;
            if (leafer) {
                leafer.leafs++;
                this.__level = this.parent ? this.parent.__level + 1 : 1;
                if (this.animation)
                    this.__runAnimation('in');
                if (this.__bubbleMap)
                    this.__emitLifeEvent(ChildEvent.MOUNTED);
            }
            else {
                this.__emitLifeEvent(ChildEvent.UNMOUNTED);
            }
            if (this.isBranch) {
                const { children } = this;
                for (let i = 0, len = children.length; i < len; i++) {
                    children[i].__bindLeafer(leafer);
                }
            }
        }
        set(_data, _isTemp) { }
        get(_name) { return undefined; }
        setAttr(name, value) { this[name] = value; }
        getAttr(name) { return this[name]; }
        getComputedAttr(name) { return this.__[name]; }
        toJSON(options) {
            if (options)
                this.__layout.update();
            return this.__.__getInputData(null, options);
        }
        toString(options) {
            return JSON.stringify(this.toJSON(options));
        }
        toSVG() { return undefined; }
        __SVG(_data) { }
        toHTML() { return undefined; }
        __setAttr(_attrName, _newValue) { return true; }
        __getAttr(_attrName) { return undefined; }
        setProxyAttr(_attrName, _newValue) { }
        getProxyAttr(_attrName) { return undefined; }
        find(_condition, _options) { return undefined; }
        findTag(_tag) { return undefined; }
        findOne(_condition, _options) { return undefined; }
        findId(_id) { return undefined; }
        focus(_value) { }
        updateState() { }
        updateLayout() {
            this.__layout.update();
        }
        forceUpdate(attrName) {
            if (attrName === undefined)
                attrName = 'width';
            else if (attrName === 'surface')
                attrName = 'blendMode';
            const value = this.__.__getInput(attrName);
            this.__[attrName] = value === undefined ? null : undefined;
            this[attrName] = value;
        }
        forceRender(_bounds) {
            this.forceUpdate('surface');
        }
        __updateWorldMatrix() { }
        __updateLocalMatrix() { }
        __updateWorldBounds() { }
        __updateLocalBounds() { }
        __updateLocalBoxBounds() { }
        __updateLocalStrokeBounds() { }
        __updateLocalRenderBounds() { }
        __updateBoxBounds() { }
        __updateContentBounds() { }
        __updateStrokeBounds() { }
        __updateRenderBounds() { }
        __updateAutoLayout() { }
        __updateFlowLayout() { }
        __updateNaturalSize() { }
        __updateStrokeSpread() { return 0; }
        __updateRenderSpread() { return 0; }
        __onUpdateSize() { }
        __updateEraser(value) {
            this.__hasEraser = value ? true : this.children.some(item => item.__.eraser);
        }
        __renderEraser(canvas, options) {
            canvas.save();
            this.__clip(canvas, options);
            const { renderBounds: r } = this.__layout;
            canvas.clearRect(r.x, r.y, r.width, r.height);
            canvas.restore();
        }
        __updateMask(value) {
            this.__hasMask = value ? true : this.children.some(item => item.__.mask);
        }
        __renderMask(_canvas, _options) { }
        __getNowWorld(options) {
            if (options.matrix) {
                if (!this.__cameraWorld)
                    this.__cameraWorld = {};
                const cameraWorld = this.__cameraWorld;
                multiplyParent(this.__world, options.matrix, cameraWorld, undefined, this.__world);
                toOuterOf(this.__layout.renderBounds, cameraWorld, cameraWorld);
                return cameraWorld;
            }
            else {
                return this.__world;
            }
        }
        getTransform(relative) {
            return this.__layout.getTransform(relative || 'local');
        }
        getBounds(type, relative) {
            return this.__layout.getBounds(type, relative);
        }
        getLayoutBounds(type, relative, unscale) {
            return this.__layout.getLayoutBounds(type, relative, unscale);
        }
        getLayoutPoints(type, relative) {
            return this.__layout.getLayoutPoints(type, relative);
        }
        getWorldBounds(inner, relative, change) {
            const matrix = relative ? getRelativeWorld(this, relative) : this.worldTransform;
            const to = change ? inner : {};
            toOuterOf(inner, matrix, to);
            return to;
        }
        worldToLocal(world, to, distance, relative) {
            if (this.parent) {
                this.parent.worldToInner(world, to, distance, relative);
            }
            else {
                if (to)
                    copy$4(to, world);
            }
        }
        localToWorld(local, to, distance, relative) {
            if (this.parent) {
                this.parent.innerToWorld(local, to, distance, relative);
            }
            else {
                if (to)
                    copy$4(to, local);
            }
        }
        worldToInner(world, to, distance, relative) {
            if (relative) {
                relative.innerToWorld(world, to, distance);
                world = to ? to : world;
            }
            toInnerPoint(this.worldTransform, world, to, distance);
        }
        innerToWorld(inner, to, distance, relative) {
            toOuterPoint(this.worldTransform, inner, to, distance);
            if (relative)
                relative.worldToInner(to ? to : inner, null, distance);
        }
        getBoxPoint(world, relative, distance, change) {
            return this.getBoxPointByInner(this.getInnerPoint(world, relative, distance, change), null, null, true);
        }
        getBoxPointByInner(inner, _relative, _distance, change) {
            const point = change ? inner : Object.assign({}, inner), { x, y } = this.boxBounds;
            move(point, -x, -y);
            return point;
        }
        getInnerPoint(world, relative, distance, change) {
            const point = change ? world : {};
            this.worldToInner(world, point, distance, relative);
            return point;
        }
        getInnerPointByBox(box, _relative, _distance, change) {
            const point = change ? box : Object.assign({}, box), { x, y } = this.boxBounds;
            move(point, x, y);
            return point;
        }
        getInnerPointByLocal(local, _relative, distance, change) {
            return this.getInnerPoint(local, this.parent, distance, change);
        }
        getLocalPoint(world, relative, distance, change) {
            const point = change ? world : {};
            this.worldToLocal(world, point, distance, relative);
            return point;
        }
        getLocalPointByInner(inner, _relative, distance, change) {
            return this.getWorldPoint(inner, this.parent, distance, change);
        }
        getPagePoint(world, relative, distance, change) {
            const layer = this.leafer ? this.leafer.zoomLayer : this;
            return layer.getInnerPoint(world, relative, distance, change);
        }
        getWorldPoint(inner, relative, distance, change) {
            const point = change ? inner : {};
            this.innerToWorld(inner, point, distance, relative);
            return point;
        }
        getWorldPointByBox(box, relative, distance, change) {
            return this.getWorldPoint(this.getInnerPointByBox(box, null, null, change), relative, distance, true);
        }
        getWorldPointByLocal(local, relative, distance, change) {
            const point = change ? local : {};
            this.localToWorld(local, point, distance, relative);
            return point;
        }
        getWorldPointByPage(page, relative, distance, change) {
            const layer = this.leafer ? this.leafer.zoomLayer : this;
            return layer.getWorldPoint(page, relative, distance, change);
        }
        setTransform(matrix, resize) {
            setTransform(this, matrix, resize);
        }
        transform(matrix, resize) {
            transform(this, matrix, resize);
        }
        move(x, y) {
            moveLocal(this, x, y);
        }
        moveInner(x, y) {
            moveWorld(this, x, y, true);
        }
        scaleOf(origin, scaleX, scaleY, resize) {
            zoomOfLocal(this, getLocalOrigin(this, origin), scaleX, scaleY, resize);
        }
        rotateOf(origin, rotation) {
            rotateOfLocal(this, getLocalOrigin(this, origin), rotation);
        }
        skewOf(origin, skewX, skewY, resize) {
            skewOfLocal(this, getLocalOrigin(this, origin), skewX, skewY, resize);
        }
        transformWorld(worldTransform, resize) {
            transformWorld(this, worldTransform, resize);
        }
        moveWorld(x, y) {
            moveWorld(this, x, y);
        }
        scaleOfWorld(worldOrigin, scaleX, scaleY, resize) {
            zoomOfWorld(this, worldOrigin, scaleX, scaleY, resize);
        }
        rotateOfWorld(worldOrigin, rotation) {
            rotateOfWorld(this, worldOrigin, rotation);
        }
        skewOfWorld(worldOrigin, skewX, skewY, resize) {
            skewOfWorld(this, worldOrigin, skewX, skewY, resize);
        }
        flip(axis) {
            transform(this, getFlipTransform(this, axis));
        }
        scaleResize(scaleX, scaleY = scaleX, _noResize) {
            this.scaleX *= scaleX;
            this.scaleY *= scaleY;
        }
        __scaleResize(_scaleX, _scaleY) { }
        resizeWidth(_width) { }
        resizeHeight(_height) { }
        __hitWorld(_point) { return true; }
        __hit(_local) { return true; }
        __hitFill(_inner) { return true; }
        __hitStroke(_inner, _strokeWidth) { return true; }
        __hitPixel(_inner) { return true; }
        __drawHitPath(_canvas) { }
        __updateHitCanvas() { }
        __render(_canvas, _options) { }
        __drawFast(_canvas, _options) { }
        __draw(_canvas, _options) { }
        __clip(_canvas, _options) { }
        __renderShape(_canvas, _options, _ignoreFill, _ignoreStroke) { }
        __updateWorldOpacity() { }
        __updateChange() { }
        __drawPath(_canvas) { }
        __drawRenderPath(_canvas) { }
        __updatePath() { }
        __updateRenderPath() { }
        getMotionPathData() {
            return needPlugin('path');
        }
        getMotionPoint(_motionDistance) {
            return needPlugin('path');
        }
        getMotionTotal() {
            return 0;
        }
        __updateMotionPath() { }
        __runAnimation(_type, _complete) { }
        __updateSortChildren() { }
        add(_child, _index) { }
        remove(_child, destroy) {
            if (this.parent)
                this.parent.remove(this, destroy);
        }
        dropTo(parent, index, resize) {
            drop(this, parent, index, resize);
        }
        on(_type, _listener, _options) { }
        off(_type, _listener, _options) { }
        on_(_type, _listener, _bind, _options) { return undefined; }
        off_(_id) { }
        once(_type, _listener, _capture) { }
        emit(_type, _event, _capture) { }
        emitEvent(_event, _capture) { }
        hasEvent(_type, _capture) { return false; }
        static changeAttr(attrName, defaultValue, fn) {
            fn ? this.addAttr(attrName, defaultValue, fn) : defineDataProcessor(this.prototype, attrName, defaultValue);
        }
        static addAttr(attrName, defaultValue, fn) {
            if (!fn)
                fn = boundsType;
            fn(defaultValue)(this.prototype, attrName);
        }
        __emitLifeEvent(type) {
            if (this.hasEvent(type))
                this.emitEvent(new ChildEvent(type, this, this.parent));
        }
        destroy() {
            if (!this.destroyed) {
                if (this.parent)
                    this.remove();
                if (this.children)
                    this.clear();
                this.__emitLifeEvent(ChildEvent.DESTROY);
                this.__.destroy();
                this.__layout.destroy();
                this.destroyEventer();
                this.destroyed = true;
            }
        }
    };
    exports.Leaf = __decorate([
        useModule(LeafDataProxy),
        useModule(LeafMatrix),
        useModule(LeafBounds),
        useModule(LeafEventer),
        useModule(LeafRender)
    ], exports.Leaf);

    const { setListWithFn } = BoundsHelper;
    const { sort } = BranchHelper;
    const { localBoxBounds, localStrokeBounds, localRenderBounds, maskLocalBoxBounds, maskLocalStrokeBounds, maskLocalRenderBounds } = LeafBoundsHelper;
    exports.Branch = class Branch extends exports.Leaf {
        __updateStrokeSpread() {
            const { children } = this;
            for (let i = 0, len = children.length; i < len; i++) {
                if (children[i].__layout.strokeSpread)
                    return 1;
            }
            return 0;
        }
        __updateRenderSpread() {
            const { children } = this;
            for (let i = 0, len = children.length; i < len; i++) {
                if (children[i].__layout.renderSpread)
                    return 1;
            }
            return 0;
        }
        __updateBoxBounds() {
            setListWithFn(this.__layout.boxBounds, this.children, this.__hasMask ? maskLocalBoxBounds : localBoxBounds);
        }
        __updateStrokeBounds() {
            setListWithFn(this.__layout.strokeBounds, this.children, this.__hasMask ? maskLocalStrokeBounds : localStrokeBounds);
        }
        __updateRenderBounds() {
            setListWithFn(this.__layout.renderBounds, this.children, this.__hasMask ? maskLocalRenderBounds : localRenderBounds);
        }
        __updateSortChildren() {
            let affectSort;
            const { children } = this;
            if (children.length > 1) {
                for (let i = 0, len = children.length; i < len; i++) {
                    children[i].__tempNumber = i;
                    if (children[i].__.zIndex)
                        affectSort = true;
                }
                children.sort(sort);
                this.__layout.affectChildrenSort = affectSort;
            }
        }
        add(child, index) {
            if (child === this)
                return;
            const noIndex = index === undefined;
            if (!child.__) {
                if (child instanceof Array)
                    return child.forEach(item => { this.add(item, index); noIndex || index++; });
                else
                    child = UICreator.get(child.tag, child);
            }
            if (child.parent)
                child.parent.remove(child);
            child.parent = this;
            noIndex ? this.children.push(child) : this.children.splice(index, 0, child);
            if (child.isBranch)
                this.__.__childBranchNumber = (this.__.__childBranchNumber || 0) + 1;
            child.__layout.boxChanged || child.__layout.boxChange();
            child.__layout.matrixChanged || child.__layout.matrixChange();
            if (child.__bubbleMap)
                child.__emitLifeEvent(ChildEvent.ADD);
            if (this.leafer) {
                child.__bindLeafer(this.leafer);
                if (this.leafer.created)
                    this.__emitChildEvent(ChildEvent.ADD, child);
            }
            this.__layout.affectChildrenSort && this.__layout.childrenSortChange();
        }
        addMany(...children) { this.add(children); }
        remove(child, destroy) {
            if (child) {
                if (child.__) {
                    if (child.animationOut)
                        child.__runAnimation('out', () => this.__remove(child, destroy));
                    else
                        this.__remove(child, destroy);
                }
                else
                    this.find(child).forEach(item => this.remove(item, destroy));
            }
            else if (child === undefined) {
                super.remove(null, destroy);
            }
        }
        removeAll(destroy) {
            const { children } = this;
            if (children.length) {
                this.children = [];
                this.__preRemove();
                this.__.__childBranchNumber = 0;
                children.forEach(child => {
                    this.__realRemoveChild(child);
                    if (destroy)
                        child.destroy();
                });
            }
        }
        clear() {
            this.removeAll(true);
        }
        __remove(child, destroy) {
            const index = this.children.indexOf(child);
            if (index > -1) {
                this.children.splice(index, 1);
                if (child.isBranch)
                    this.__.__childBranchNumber = (this.__.__childBranchNumber || 1) - 1;
                this.__preRemove();
                this.__realRemoveChild(child);
                if (destroy)
                    child.destroy();
            }
        }
        __preRemove() {
            if (this.__hasMask)
                this.__updateMask();
            if (this.__hasEraser)
                this.__updateEraser();
            this.__layout.boxChange();
            this.__layout.affectChildrenSort && this.__layout.childrenSortChange();
        }
        __realRemoveChild(child) {
            child.__emitLifeEvent(ChildEvent.REMOVE);
            child.parent = null;
            if (this.leafer) {
                child.__bindLeafer(null);
                if (this.leafer.created) {
                    this.__emitChildEvent(ChildEvent.REMOVE, child);
                    if (this.leafer.hitCanvasManager)
                        this.leafer.hitCanvasManager.clear();
                }
            }
        }
        __emitChildEvent(type, child) {
            const event = new ChildEvent(type, child, this);
            if (this.hasEvent(type) && !this.isLeafer)
                this.emitEvent(event);
            this.leafer.emitEvent(event);
        }
    };
    exports.Branch = __decorate([
        useModule(BranchRender)
    ], exports.Branch);

    class LeafList {
        get length() { return this.list.length; }
        constructor(item) {
            this.reset();
            if (item)
                item instanceof Array ? this.addList(item) : this.add(item);
        }
        has(leaf) {
            return leaf && this.keys[leaf.innerId] !== undefined;
        }
        indexAt(index) {
            return this.list[index];
        }
        indexOf(leaf) {
            const index = this.keys[leaf.innerId];
            return index === undefined ? -1 : index;
        }
        add(leaf) {
            const { list, keys } = this;
            if (keys[leaf.innerId] === undefined) {
                list.push(leaf);
                keys[leaf.innerId] = list.length - 1;
            }
        }
        addAt(leaf, index = 0) {
            const { keys } = this;
            if (keys[leaf.innerId] === undefined) {
                const { list } = this;
                for (let i = index, len = list.length; i < len; i++)
                    keys[list[i].innerId]++;
                if (index === 0) {
                    list.unshift(leaf);
                }
                else {
                    if (index > list.length)
                        index = list.length;
                    list.splice(index, 0, leaf);
                }
                keys[leaf.innerId] = index;
            }
        }
        addList(list) {
            for (let i = 0; i < list.length; i++)
                this.add(list[i]);
        }
        remove(leaf) {
            const { list } = this;
            let findIndex;
            for (let i = 0, len = list.length; i < len; i++) {
                if (findIndex !== undefined) {
                    this.keys[list[i].innerId] = i - 1;
                }
                else if (list[i].innerId === leaf.innerId) {
                    findIndex = i;
                    delete this.keys[leaf.innerId];
                }
            }
            if (findIndex !== undefined)
                list.splice(findIndex, 1);
        }
        sort(reverse) {
            const { list } = this;
            if (reverse) {
                list.sort((a, b) => b.__level - a.__level);
            }
            else {
                list.sort((a, b) => a.__level - b.__level);
            }
        }
        forEach(itemCallback) {
            this.list.forEach(itemCallback);
        }
        clone() {
            const list = new LeafList();
            list.list = [...this.list];
            list.keys = Object.assign({}, this.keys);
            return list;
        }
        update() {
            this.keys = {};
            const { list, keys } = this;
            for (let i = 0, len = list.length; i < len; i++)
                keys[list[i].innerId] = i;
        }
        reset() {
            this.list = [];
            this.keys = {};
        }
        destroy() {
            this.reset();
        }
    }

    class LeafLevelList {
        get length() { return this._length; }
        constructor(item) {
            this._length = 0;
            this.reset();
            if (item)
                item instanceof Array ? this.addList(item) : this.add(item);
        }
        has(leaf) {
            return this.keys[leaf.innerId] !== undefined;
        }
        without(leaf) {
            return this.keys[leaf.innerId] === undefined;
        }
        sort(reverse) {
            const { levels } = this;
            if (reverse) {
                levels.sort((a, b) => b - a);
            }
            else {
                levels.sort((a, b) => a - b);
            }
        }
        addList(list) {
            list.forEach(leaf => { this.add(leaf); });
        }
        add(leaf) {
            const { keys, levelMap } = this;
            if (!keys[leaf.innerId]) {
                keys[leaf.innerId] = 1;
                if (!levelMap[leaf.__level]) {
                    levelMap[leaf.__level] = [leaf];
                    this.levels.push(leaf.__level);
                }
                else {
                    levelMap[leaf.__level].push(leaf);
                }
                this._length++;
            }
        }
        forEach(itemCallback) {
            let list;
            this.levels.forEach(level => {
                list = this.levelMap[level];
                for (let i = 0, len = list.length; i < len; i++) {
                    itemCallback(list[i]);
                }
            });
        }
        reset() {
            this.levelMap = {};
            this.keys = {};
            this.levels = [];
            this._length = 0;
        }
        destroy() {
            this.levelMap = null;
        }
    }

    const version = "1.0.9";

    const debug$7 = Debug.get('LeaferCanvas');
    class LeaferCanvas extends LeaferCanvasBase {
        set zIndex(zIndex) {
            const { style } = this.view;
            style.zIndex = zIndex;
            this.setAbsolute(this.view);
        }
        set childIndex(index) {
            const { view, parentView } = this;
            if (view && parentView) {
                const beforeNode = parentView.children[index];
                if (beforeNode) {
                    this.setAbsolute(beforeNode);
                    parentView.insertBefore(view, beforeNode);
                }
                else {
                    parentView.appendChild(beforeNode);
                }
            }
        }
        init() {
            const { config } = this;
            const view = config.view || config.canvas;
            view ? this.__createViewFrom(view) : this.__createView();
            const { style } = this.view;
            style.display || (style.display = 'block');
            this.parentView = this.view.parentElement;
            if (this.parentView) {
                const pStyle = this.parentView.style;
                pStyle.webkitUserSelect = pStyle.userSelect = 'none';
            }
            if (Platform.syncDomFont && !this.parentView) {
                style.display = 'none';
                document.body.appendChild(this.view);
            }
            this.__createContext();
            if (!this.autoLayout)
                this.resize(config);
        }
        set backgroundColor(color) { this.view.style.backgroundColor = color; }
        get backgroundColor() { return this.view.style.backgroundColor; }
        set hittable(hittable) { this.view.style.pointerEvents = hittable ? 'auto' : 'none'; }
        get hittable() { return this.view.style.pointerEvents !== 'none'; }
        __createView() {
            this.view = document.createElement('canvas');
        }
        __createViewFrom(inputView) {
            let find = (typeof inputView === 'string') ? document.getElementById(inputView) : inputView;
            if (find) {
                if (find instanceof HTMLCanvasElement) {
                    this.view = find;
                }
                else {
                    let parent = find;
                    if (find === window || find === document) {
                        const div = document.createElement('div');
                        const { style } = div;
                        style.position = 'absolute';
                        style.top = style.bottom = style.left = style.right = '0px';
                        document.body.appendChild(div);
                        parent = div;
                    }
                    this.__createView();
                    const view = this.view;
                    if (parent.hasChildNodes()) {
                        this.setAbsolute(view);
                        parent.style.position || (parent.style.position = 'relative');
                    }
                    parent.appendChild(view);
                }
            }
            else {
                debug$7.error(`no id: ${inputView}`);
                this.__createView();
            }
        }
        setAbsolute(view) {
            const { style } = view;
            style.position = 'absolute';
            style.top = style.left = '0px';
        }
        updateViewSize() {
            const { width, height, pixelRatio } = this;
            const { style } = this.view;
            style.width = width + 'px';
            style.height = height + 'px';
            this.view.width = Math.ceil(width * pixelRatio);
            this.view.height = Math.ceil(height * pixelRatio);
        }
        updateClientBounds() {
            this.clientBounds = this.view.getBoundingClientRect();
        }
        startAutoLayout(autoBounds, listener) {
            this.resizeListener = listener;
            if (autoBounds) {
                this.autoBounds = autoBounds;
                try {
                    this.resizeObserver = new ResizeObserver((entries) => {
                        this.updateClientBounds();
                        for (const entry of entries)
                            this.checkAutoBounds(entry.contentRect);
                    });
                    const parent = this.parentView;
                    if (parent) {
                        this.resizeObserver.observe(parent);
                        this.checkAutoBounds(parent.getBoundingClientRect());
                    }
                    else {
                        this.checkAutoBounds(this.view);
                        debug$7.warn('no parent');
                    }
                }
                catch (_a) {
                    this.imitateResizeObserver();
                }
            }
            else {
                window.addEventListener('resize', () => {
                    const pixelRatio = Platform.devicePixelRatio;
                    if (this.pixelRatio !== pixelRatio) {
                        const { width, height } = this;
                        this.emitResize({ width, height, pixelRatio });
                    }
                });
            }
        }
        imitateResizeObserver() {
            if (this.autoLayout) {
                if (this.parentView)
                    this.checkAutoBounds(this.parentView.getBoundingClientRect());
                Platform.requestRender(this.imitateResizeObserver.bind(this));
            }
        }
        checkAutoBounds(parentSize) {
            const view = this.view;
            const { x, y, width, height } = this.autoBounds.getBoundsFrom(parentSize);
            const size = { width, height, pixelRatio: Platform.devicePixelRatio };
            if (!this.isSameSize(size)) {
                const { style } = view;
                style.marginLeft = x + 'px';
                style.marginTop = y + 'px';
                this.emitResize(size);
            }
        }
        stopAutoLayout() {
            this.autoLayout = false;
            this.resizeListener = null;
            if (this.resizeObserver) {
                this.resizeObserver.disconnect();
                this.resizeObserver = null;
            }
        }
        emitResize(size) {
            const oldSize = {};
            DataHelper.copyAttrs(oldSize, this, canvasSizeAttrs);
            this.resize(size);
            if (this.resizeListener && this.width !== undefined)
                this.resizeListener(new ResizeEvent(size, oldSize));
        }
        unrealCanvas() {
            if (!this.unreal && this.parentView) {
                const view = this.view;
                if (view)
                    view.remove();
                this.view = this.parentView;
                this.unreal = true;
            }
        }
        destroy() {
            if (this.view) {
                this.stopAutoLayout();
                if (!this.unreal) {
                    const view = this.view;
                    if (view.parentElement)
                        view.remove();
                }
                super.destroy();
            }
        }
    }

    canvasPatch(CanvasRenderingContext2D.prototype);
    canvasPatch(Path2D.prototype);

    const { mineType, fileType } = FileHelper;
    Object.assign(Creator, {
        canvas: (options, manager) => new LeaferCanvas(options, manager),
        image: (options) => new LeaferImage(options)
    });
    function useCanvas(_canvasType, _power) {
        Platform.origin = {
            createCanvas(width, height) {
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                return canvas;
            },
            canvasToDataURL: (canvas, type, quality) => canvas.toDataURL(mineType(type), quality),
            canvasToBolb: (canvas, type, quality) => new Promise((resolve) => canvas.toBlob(resolve, mineType(type), quality)),
            canvasSaveAs: (canvas, filename, quality) => {
                const url = canvas.toDataURL(mineType(fileType(filename)), quality);
                return Platform.origin.download(url, filename);
            },
            download(url, filename) {
                return new Promise((resolve) => {
                    let el = document.createElement('a');
                    el.href = url;
                    el.download = filename;
                    document.body.appendChild(el);
                    el.click();
                    document.body.removeChild(el);
                    resolve();
                });
            },
            loadImage(src) {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    const { crossOrigin } = Platform.image;
                    if (crossOrigin) {
                        img.setAttribute('crossOrigin', crossOrigin);
                        img.crossOrigin = crossOrigin;
                    }
                    img.onload = () => { resolve(img); };
                    img.onerror = (e) => { reject(e); };
                    img.src = Platform.image.getRealURL(src);
                });
            }
        };
        Platform.event = {
            stopDefault(origin) { origin.preventDefault(); },
            stopNow(origin) { origin.stopImmediatePropagation(); },
            stop(origin) { origin.stopPropagation(); }
        };
        Platform.canvas = Creator.canvas();
        Platform.conicGradientSupport = !!Platform.canvas.context.createConicGradient;
    }
    Platform.name = 'web';
    Platform.isMobile = 'ontouchstart' in window;
    Platform.requestRender = function (render) { window.requestAnimationFrame(render); };
    defineKey(Platform, 'devicePixelRatio', { get() { return Math.max(1, devicePixelRatio); } });
    const { userAgent } = navigator;
    if (userAgent.indexOf("Firefox") > -1) {
        Platform.conicGradientRotate90 = true;
        Platform.intWheelDeltaY = true;
        Platform.syncDomFont = true;
    }
    else if (userAgent.indexOf("Safari") > -1 && userAgent.indexOf("Chrome") === -1) {
        Platform.fullImageShadow = true;
    }
    if (userAgent.indexOf('Windows') > -1) {
        Platform.os = 'Windows';
        Platform.intWheelDeltaY = true;
    }
    else if (userAgent.indexOf('Mac') > -1) {
        Platform.os = 'Mac';
    }
    else if (userAgent.indexOf('Linux') > -1) {
        Platform.os = 'Linux';
    }

    class Watcher {
        get childrenChanged() { return this.hasAdd || this.hasRemove || this.hasVisible; }
        get updatedList() {
            if (this.hasRemove) {
                const updatedList = new LeafList();
                this.__updatedList.list.forEach(item => { if (item.leafer)
                    updatedList.add(item); });
                return updatedList;
            }
            else {
                return this.__updatedList;
            }
        }
        constructor(target, userConfig) {
            this.totalTimes = 0;
            this.config = {};
            this.__updatedList = new LeafList();
            this.target = target;
            if (userConfig)
                this.config = DataHelper.default(userConfig, this.config);
            this.__listenEvents();
        }
        start() {
            if (this.disabled)
                return;
            this.running = true;
        }
        stop() {
            this.running = false;
        }
        disable() {
            this.stop();
            this.__removeListenEvents();
            this.disabled = true;
        }
        update() {
            this.changed = true;
            if (this.running)
                this.target.emit(RenderEvent.REQUEST);
        }
        __onAttrChange(event) {
            this.__updatedList.add(event.target);
            this.update();
        }
        __onChildEvent(event) {
            if (event.type === ChildEvent.ADD) {
                this.hasAdd = true;
                this.__pushChild(event.child);
            }
            else {
                this.hasRemove = true;
                this.__updatedList.add(event.parent);
            }
            this.update();
        }
        __pushChild(child) {
            this.__updatedList.add(child);
            if (child.isBranch)
                this.__loopChildren(child);
        }
        __loopChildren(parent) {
            const { children } = parent;
            for (let i = 0, len = children.length; i < len; i++)
                this.__pushChild(children[i]);
        }
        __onRquestData() {
            this.target.emitEvent(new WatchEvent(WatchEvent.DATA, { updatedList: this.updatedList }));
            this.__updatedList = new LeafList();
            this.totalTimes++;
            this.changed = false;
            this.hasVisible = false;
            this.hasRemove = false;
            this.hasAdd = false;
        }
        __listenEvents() {
            const { target } = this;
            this.__eventIds = [
                target.on_(PropertyEvent.CHANGE, this.__onAttrChange, this),
                target.on_([ChildEvent.ADD, ChildEvent.REMOVE], this.__onChildEvent, this),
                target.on_(WatchEvent.REQUEST, this.__onRquestData, this)
            ];
        }
        __removeListenEvents() {
            this.target.off_(this.__eventIds);
        }
        destroy() {
            if (this.target) {
                this.stop();
                this.__removeListenEvents();
                this.target = null;
                this.__updatedList = null;
            }
        }
    }

    const { updateAllMatrix: updateAllMatrix$1, updateBounds: updateOneBounds, updateAllWorldOpacity } = LeafHelper;
    const { pushAllChildBranch, pushAllParent } = BranchHelper;
    function updateMatrix(updateList, levelList) {
        let layout;
        updateList.list.forEach(leaf => {
            layout = leaf.__layout;
            if (levelList.without(leaf) && !layout.proxyZoom) {
                if (layout.matrixChanged) {
                    updateAllMatrix$1(leaf, true);
                    levelList.add(leaf);
                    if (leaf.isBranch)
                        pushAllChildBranch(leaf, levelList);
                    pushAllParent(leaf, levelList);
                }
                else if (layout.boundsChanged) {
                    levelList.add(leaf);
                    if (leaf.isBranch)
                        leaf.__tempNumber = 0;
                    pushAllParent(leaf, levelList);
                }
            }
        });
    }
    function updateBounds(boundsList) {
        let list, branch, children;
        boundsList.sort(true);
        boundsList.levels.forEach(level => {
            list = boundsList.levelMap[level];
            for (let i = 0, len = list.length; i < len; i++) {
                branch = list[i];
                if (branch.isBranch && branch.__tempNumber) {
                    children = branch.children;
                    for (let j = 0, jLen = children.length; j < jLen; j++) {
                        if (!children[j].isBranch) {
                            updateOneBounds(children[j]);
                        }
                    }
                }
                updateOneBounds(branch);
            }
        });
    }
    function updateChange(updateList) {
        let layout;
        updateList.list.forEach(leaf => {
            layout = leaf.__layout;
            if (layout.opacityChanged)
                updateAllWorldOpacity(leaf);
            if (layout.stateStyleChanged)
                setTimeout(() => layout.stateStyleChanged && leaf.updateState());
            leaf.__updateChange();
        });
    }

    const { worldBounds } = LeafBoundsHelper;
    const bigBounds = { x: 0, y: 0, width: 100000, height: 100000 };
    class LayoutBlockData {
        constructor(list) {
            this.updatedBounds = new Bounds();
            this.beforeBounds = new Bounds();
            this.afterBounds = new Bounds();
            if (list instanceof Array)
                list = new LeafList(list);
            this.updatedList = list;
        }
        setBefore() {
            this.beforeBounds.setListWithFn(this.updatedList.list, worldBounds);
        }
        setAfter() {
            const { list } = this.updatedList;
            if (list.some(leaf => leaf.noBounds)) {
                this.afterBounds.set(bigBounds);
            }
            else {
                this.afterBounds.setListWithFn(list, worldBounds);
            }
            this.updatedBounds.setList([this.beforeBounds, this.afterBounds]);
        }
        merge(data) {
            this.updatedList.addList(data.updatedList.list);
            this.beforeBounds.add(data.beforeBounds);
            this.afterBounds.add(data.afterBounds);
            this.updatedBounds.add(data.updatedBounds);
        }
        destroy() {
            this.updatedList = null;
        }
    }

    const { updateAllMatrix, updateAllChange } = LeafHelper;
    const debug$6 = Debug.get('Layouter');
    class Layouter {
        constructor(target, userConfig) {
            this.totalTimes = 0;
            this.config = {};
            this.__levelList = new LeafLevelList();
            this.target = target;
            if (userConfig)
                this.config = DataHelper.default(userConfig, this.config);
            this.__listenEvents();
        }
        start() {
            if (this.disabled)
                return;
            this.running = true;
        }
        stop() {
            this.running = false;
        }
        disable() {
            this.stop();
            this.__removeListenEvents();
            this.disabled = true;
        }
        layout() {
            if (!this.running)
                return;
            const { target } = this;
            this.times = 0;
            try {
                target.emit(LayoutEvent.START);
                this.layoutOnce();
                target.emitEvent(new LayoutEvent(LayoutEvent.END, this.layoutedBlocks, this.times));
            }
            catch (e) {
                debug$6.error(e);
            }
            this.layoutedBlocks = null;
        }
        layoutAgain() {
            if (this.layouting) {
                this.waitAgain = true;
            }
            else {
                this.layoutOnce();
            }
        }
        layoutOnce() {
            if (this.layouting)
                return debug$6.warn('layouting');
            if (this.times > 3)
                return debug$6.warn('layout max times');
            this.times++;
            this.totalTimes++;
            this.layouting = true;
            this.target.emit(WatchEvent.REQUEST);
            if (this.totalTimes > 1) {
                this.partLayout();
            }
            else {
                this.fullLayout();
            }
            this.layouting = false;
            if (this.waitAgain) {
                this.waitAgain = false;
                this.layoutOnce();
            }
        }
        partLayout() {
            var _a;
            if (!((_a = this.__updatedList) === null || _a === void 0 ? void 0 : _a.length))
                return;
            const t = Run.start('PartLayout');
            const { target, __updatedList: updateList } = this;
            const { BEFORE, LAYOUT, AFTER } = LayoutEvent;
            const blocks = this.getBlocks(updateList);
            blocks.forEach(item => item.setBefore());
            target.emitEvent(new LayoutEvent(BEFORE, blocks, this.times));
            this.extraBlock = null;
            updateList.sort();
            updateMatrix(updateList, this.__levelList);
            updateBounds(this.__levelList);
            updateChange(updateList);
            if (this.extraBlock)
                blocks.push(this.extraBlock);
            blocks.forEach(item => item.setAfter());
            target.emitEvent(new LayoutEvent(LAYOUT, blocks, this.times));
            target.emitEvent(new LayoutEvent(AFTER, blocks, this.times));
            this.addBlocks(blocks);
            this.__levelList.reset();
            this.__updatedList = null;
            Run.end(t);
        }
        fullLayout() {
            const t = Run.start('FullLayout');
            const { target } = this;
            const { BEFORE, LAYOUT, AFTER } = LayoutEvent;
            const blocks = this.getBlocks(new LeafList(target));
            target.emitEvent(new LayoutEvent(BEFORE, blocks, this.times));
            Layouter.fullLayout(target);
            blocks.forEach(item => { item.setAfter(); });
            target.emitEvent(new LayoutEvent(LAYOUT, blocks, this.times));
            target.emitEvent(new LayoutEvent(AFTER, blocks, this.times));
            this.addBlocks(blocks);
            Run.end(t);
        }
        static fullLayout(target) {
            updateAllMatrix(target, true);
            if (target.isBranch) {
                BranchHelper.updateBounds(target);
            }
            else {
                LeafHelper.updateBounds(target);
            }
            updateAllChange(target);
        }
        addExtra(leaf) {
            if (!this.__updatedList.has(leaf)) {
                const { updatedList, beforeBounds } = this.extraBlock || (this.extraBlock = new LayoutBlockData([]));
                updatedList.length ? beforeBounds.add(leaf.__world) : beforeBounds.set(leaf.__world);
                updatedList.add(leaf);
            }
        }
        createBlock(data) {
            return new LayoutBlockData(data);
        }
        getBlocks(list) {
            return [this.createBlock(list)];
        }
        addBlocks(current) {
            this.layoutedBlocks ? this.layoutedBlocks.push(...current) : this.layoutedBlocks = current;
        }
        __onReceiveWatchData(event) {
            this.__updatedList = event.data.updatedList;
        }
        __listenEvents() {
            const { target } = this;
            this.__eventIds = [
                target.on_(LayoutEvent.REQUEST, this.layout, this),
                target.on_(LayoutEvent.AGAIN, this.layoutAgain, this),
                target.on_(WatchEvent.DATA, this.__onReceiveWatchData, this)
            ];
        }
        __removeListenEvents() {
            this.target.off_(this.__eventIds);
        }
        destroy() {
            if (this.target) {
                this.stop();
                this.__removeListenEvents();
                this.target = this.config = null;
            }
        }
    }

    const debug$5 = Debug.get('Renderer');
    class Renderer {
        get needFill() { return !!(!this.canvas.allowBackgroundColor && this.config.fill); }
        constructor(target, canvas, userConfig) {
            this.FPS = 60;
            this.totalTimes = 0;
            this.times = 0;
            this.config = {
                usePartRender: true,
                maxFPS: 60
            };
            this.target = target;
            this.canvas = canvas;
            if (userConfig)
                this.config = DataHelper.default(userConfig, this.config);
            this.__listenEvents();
            this.__requestRender();
        }
        start() {
            this.running = true;
        }
        stop() {
            this.running = false;
        }
        update() {
            this.changed = true;
        }
        requestLayout() {
            this.target.emit(LayoutEvent.REQUEST);
        }
        render(callback) {
            if (!(this.running && this.canvas.view)) {
                this.changed = true;
                return;
            }
            const { target } = this;
            this.times = 0;
            this.totalBounds = new Bounds();
            debug$5.log(target.innerName, '--->');
            try {
                target.app.emit(RenderEvent.CHILD_START, target);
                this.emitRender(RenderEvent.START);
                this.renderOnce(callback);
                this.emitRender(RenderEvent.END, this.totalBounds);
                ImageManager.clearRecycled();
            }
            catch (e) {
                this.rendering = false;
                debug$5.error(e);
            }
            debug$5.log('-------------|');
        }
        renderAgain() {
            if (this.rendering) {
                this.waitAgain = true;
            }
            else {
                this.renderOnce();
            }
        }
        renderOnce(callback) {
            if (this.rendering)
                return debug$5.warn('rendering');
            if (this.times > 3)
                return debug$5.warn('render max times');
            this.times++;
            this.totalTimes++;
            this.rendering = true;
            this.changed = false;
            this.renderBounds = new Bounds();
            this.renderOptions = {};
            if (callback) {
                this.emitRender(RenderEvent.BEFORE);
                callback();
            }
            else {
                this.requestLayout();
                if (this.ignore) {
                    this.ignore = this.rendering = false;
                    return;
                }
                this.emitRender(RenderEvent.BEFORE);
                if (this.config.usePartRender && this.totalTimes > 1) {
                    this.partRender();
                }
                else {
                    this.fullRender();
                }
            }
            this.emitRender(RenderEvent.RENDER, this.renderBounds, this.renderOptions);
            this.emitRender(RenderEvent.AFTER, this.renderBounds, this.renderOptions);
            this.updateBlocks = null;
            this.rendering = false;
            if (this.waitAgain) {
                this.waitAgain = false;
                this.renderOnce();
            }
        }
        partRender() {
            const { canvas, updateBlocks: list } = this;
            if (!list)
                return debug$5.warn('PartRender: need update attr');
            this.mergeBlocks();
            list.forEach(block => { if (canvas.bounds.hit(block) && !block.isEmpty())
                this.clipRender(block); });
        }
        clipRender(block) {
            const t = Run.start('PartRender');
            const { canvas } = this;
            const bounds = block.getIntersect(canvas.bounds);
            const includes = block.includes(this.target.__world);
            const realBounds = new Bounds(bounds);
            canvas.save();
            if (includes && !Debug.showRepaint) {
                canvas.clear();
            }
            else {
                bounds.spread(10 + 1 / this.canvas.pixelRatio).ceil();
                canvas.clearWorld(bounds, true);
                canvas.clipWorld(bounds, true);
            }
            this.__render(bounds, includes, realBounds);
            canvas.restore();
            Run.end(t);
        }
        fullRender() {
            const t = Run.start('FullRender');
            const { canvas } = this;
            canvas.save();
            canvas.clear();
            this.__render(canvas.bounds, true);
            canvas.restore();
            Run.end(t);
        }
        __render(bounds, includes, realBounds) {
            const options = bounds.includes(this.target.__world) ? { includes } : { bounds, includes };
            if (this.needFill)
                this.canvas.fillWorld(bounds, this.config.fill);
            if (Debug.showRepaint)
                this.canvas.strokeWorld(bounds, 'red');
            this.target.__render(this.canvas, options);
            this.renderBounds = realBounds = realBounds || bounds;
            this.renderOptions = options;
            this.totalBounds.isEmpty() ? this.totalBounds = realBounds : this.totalBounds.add(realBounds);
            if (Debug.showHitView)
                this.renderHitView(options);
            if (Debug.showBoundsView)
                this.renderBoundsView(options);
            this.canvas.updateRender(realBounds);
        }
        renderHitView(_options) { }
        renderBoundsView(_options) { }
        addBlock(block) {
            if (!this.updateBlocks)
                this.updateBlocks = [];
            this.updateBlocks.push(block);
        }
        mergeBlocks() {
            const { updateBlocks: list } = this;
            if (list) {
                const bounds = new Bounds();
                bounds.setList(list);
                list.length = 0;
                list.push(bounds);
            }
        }
        __requestRender() {
            const startTime = Date.now();
            Platform.requestRender(() => {
                this.FPS = Math.min(60, Math.ceil(1000 / (Date.now() - startTime)));
                if (this.running) {
                    if (this.changed && this.canvas.view)
                        this.render();
                    this.target.emit(RenderEvent.NEXT);
                }
                if (this.target)
                    this.__requestRender();
            });
        }
        __onResize(e) {
            if (this.canvas.unreal)
                return;
            if (e.bigger || !e.samePixelRatio) {
                const { width, height } = e.old;
                const bounds = new Bounds(0, 0, width, height);
                if (!bounds.includes(this.target.__world) || this.needFill || !e.samePixelRatio) {
                    this.addBlock(this.canvas.bounds);
                    this.target.forceUpdate('surface');
                    return;
                }
            }
            this.addBlock(new Bounds(0, 0, 1, 1));
            this.changed = true;
        }
        __onLayoutEnd(event) {
            if (event.data)
                event.data.map(item => {
                    let empty;
                    if (item.updatedList)
                        item.updatedList.list.some(leaf => {
                            empty = (!leaf.__world.width || !leaf.__world.height);
                            if (empty) {
                                if (!leaf.isLeafer)
                                    debug$5.tip(leaf.innerName, ': empty');
                                empty = (!leaf.isBranch || leaf.isBranchLeaf);
                            }
                            return empty;
                        });
                    this.addBlock(empty ? this.canvas.bounds : item.updatedBounds);
                });
        }
        emitRender(type, bounds, options) {
            this.target.emitEvent(new RenderEvent(type, this.times, bounds, options));
        }
        __listenEvents() {
            const { target } = this;
            this.__eventIds = [
                target.on_(RenderEvent.REQUEST, this.update, this),
                target.on_(LayoutEvent.END, this.__onLayoutEnd, this),
                target.on_(RenderEvent.AGAIN, this.renderAgain, this),
                target.on_(ResizeEvent.RESIZE, this.__onResize, this)
            ];
        }
        __removeListenEvents() {
            this.target.off_(this.__eventIds);
        }
        destroy() {
            if (this.target) {
                this.stop();
                this.__removeListenEvents();
                this.target = this.canvas = this.config = null;
            }
        }
    }

    const { hitRadiusPoint } = BoundsHelper;
    class Picker {
        constructor(target, selector) {
            this.target = target;
            this.selector = selector;
        }
        getByPoint(hitPoint, hitRadius, options) {
            if (!hitRadius)
                hitRadius = 0;
            if (!options)
                options = {};
            const through = options.through || false;
            const ignoreHittable = options.ignoreHittable || false;
            const target = options.target || this.target;
            this.exclude = options.exclude || null;
            this.point = { x: hitPoint.x, y: hitPoint.y, radiusX: hitRadius, radiusY: hitRadius };
            this.findList = new LeafList(options.findList);
            if (!options.findList)
                this.hitBranch(target);
            const { list } = this.findList;
            const leaf = this.getBestMatchLeaf(list, options.bottomList, ignoreHittable);
            const path = ignoreHittable ? this.getPath(leaf) : this.getHitablePath(leaf);
            this.clear();
            return through ? { path, target: leaf, throughPath: list.length ? this.getThroughPath(list) : path } : { path, target: leaf };
        }
        getBestMatchLeaf(list, bottomList, ignoreHittable) {
            if (list.length) {
                let find;
                this.findList = new LeafList();
                const { x, y } = this.point;
                const point = { x, y, radiusX: 0, radiusY: 0 };
                for (let i = 0, len = list.length; i < len; i++) {
                    find = list[i];
                    if (ignoreHittable || LeafHelper.worldHittable(find)) {
                        this.hitChild(find, point);
                        if (this.findList.length)
                            return this.findList.list[0];
                    }
                }
            }
            if (bottomList) {
                for (let i = 0, len = bottomList.length; i < len; i++) {
                    this.hitChild(bottomList[i].target, this.point, bottomList[i].proxy);
                    if (this.findList.length)
                        return this.findList.list[0];
                }
            }
            return list[0];
        }
        getPath(leaf) {
            const path = new LeafList();
            while (leaf) {
                path.add(leaf);
                leaf = leaf.parent;
            }
            if (this.target)
                path.add(this.target);
            return path;
        }
        getHitablePath(leaf) {
            const path = this.getPath(leaf && leaf.hittable ? leaf : null);
            let item, hittablePath = new LeafList();
            for (let i = path.list.length - 1; i > -1; i--) {
                item = path.list[i];
                if (!item.__.hittable)
                    break;
                hittablePath.addAt(item, 0);
                if (!item.__.hitChildren)
                    break;
            }
            return hittablePath;
        }
        getThroughPath(list) {
            const throughPath = new LeafList();
            const pathList = [];
            for (let i = list.length - 1; i > -1; i--) {
                pathList.push(this.getPath(list[i]));
            }
            let path, nextPath, leaf;
            for (let i = 0, len = pathList.length; i < len; i++) {
                path = pathList[i], nextPath = pathList[i + 1];
                for (let j = 0, jLen = path.length; j < jLen; j++) {
                    leaf = path.list[j];
                    if (nextPath && nextPath.has(leaf))
                        break;
                    throughPath.add(leaf);
                }
            }
            return throughPath;
        }
        hitBranch(branch) {
            this.eachFind(branch.children, branch.__onlyHitMask);
        }
        eachFind(children, hitMask) {
            let child, hit;
            const { point } = this, len = children.length;
            for (let i = len - 1; i > -1; i--) {
                child = children[i];
                if (!child.__.visible || (hitMask && !child.__.mask))
                    continue;
                hit = child.__.hitRadius ? true : hitRadiusPoint(child.__world, point);
                if (child.isBranch) {
                    if (hit || child.__ignoreHitWorld) {
                        this.eachFind(child.children, child.__onlyHitMask);
                        if (child.isBranchLeaf)
                            this.hitChild(child, point);
                    }
                }
                else {
                    if (hit)
                        this.hitChild(child, point);
                }
            }
        }
        hitChild(child, point, proxy) {
            if (this.exclude && this.exclude.has(child))
                return;
            if (child.__hitWorld(point)) {
                const { parent } = child;
                if (parent && parent.__hasMask && !child.__.mask && !parent.children.some(item => item.__.mask && item.__hitWorld(point)))
                    return;
                this.findList.add(proxy || child);
            }
        }
        clear() {
            this.point = null;
            this.findList = null;
            this.exclude = null;
        }
        destroy() {
            this.clear();
        }
    }

    const { Yes, NoAndSkip, YesAndSkip } = exports.Answer;
    const idCondition = {}, classNameCondition = {}, tagCondition = {};
    class Selector {
        constructor(target, userConfig) {
            this.config = {};
            this.innerIdMap = {};
            this.idMap = {};
            this.methods = {
                id: (leaf, name) => leaf.id === name ? (this.target && (this.idMap[name] = leaf), 1) : 0,
                innerId: (leaf, innerId) => leaf.innerId === innerId ? (this.target && (this.innerIdMap[innerId] = leaf), 1) : 0,
                className: (leaf, name) => leaf.className === name ? 1 : 0,
                tag: (leaf, name) => leaf.__tag === name ? 1 : 0,
                tags: (leaf, nameMap) => nameMap[leaf.__tag] ? 1 : 0
            };
            this.target = target;
            if (userConfig)
                this.config = DataHelper.default(userConfig, this.config);
            this.picker = new Picker(target, this);
            if (target)
                this.__listenEvents();
        }
        getBy(condition, branch, one, options) {
            switch (typeof condition) {
                case 'number':
                    const leaf = this.getByInnerId(condition, branch);
                    return one ? leaf : (leaf ? [leaf] : []);
                case 'string':
                    switch (condition[0]) {
                        case '#':
                            idCondition.id = condition.substring(1), condition = idCondition;
                            break;
                        case '.':
                            classNameCondition.className = condition.substring(1), condition = classNameCondition;
                            break;
                        default:
                            tagCondition.tag = condition, condition = tagCondition;
                    }
                case 'object':
                    if (condition.id !== undefined) {
                        const leaf = this.getById(condition.id, branch);
                        return one ? leaf : (leaf ? [leaf] : []);
                    }
                    else if (condition.tag) {
                        const { tag } = condition, isArray = tag instanceof Array;
                        return this.getByMethod(isArray ? this.methods.tags : this.methods.tag, branch, one, isArray ? DataHelper.toMap(tag) : tag);
                    }
                    else {
                        return this.getByMethod(this.methods.className, branch, one, condition.className);
                    }
                case 'function':
                    return this.getByMethod(condition, branch, one, options);
            }
        }
        getByPoint(hitPoint, hitRadius, options) {
            if (Platform.name === 'node' && this.target)
                this.target.emit(LayoutEvent.CHECK_UPDATE);
            return this.picker.getByPoint(hitPoint, hitRadius, options);
        }
        getByInnerId(innerId, branch) {
            const cache = this.innerIdMap[innerId];
            if (cache)
                return cache;
            this.eachFind(this.toChildren(branch), this.methods.innerId, null, innerId);
            return this.findLeaf;
        }
        getById(id, branch) {
            const cache = this.idMap[id];
            if (cache && LeafHelper.hasParent(cache, branch || this.target))
                return cache;
            this.eachFind(this.toChildren(branch), this.methods.id, null, id);
            return this.findLeaf;
        }
        getByClassName(className, branch) {
            return this.getByMethod(this.methods.className, branch, false, className);
        }
        getByTag(tag, branch) {
            return this.getByMethod(this.methods.tag, branch, false, tag);
        }
        getByMethod(method, branch, one, options) {
            const list = one ? null : [];
            this.eachFind(this.toChildren(branch), method, list, options);
            return list || this.findLeaf;
        }
        eachFind(children, method, list, options) {
            let child, result;
            for (let i = 0, len = children.length; i < len; i++) {
                child = children[i];
                result = method(child, options);
                if (result === Yes || result === YesAndSkip) {
                    if (list) {
                        list.push(child);
                    }
                    else {
                        this.findLeaf = child;
                        return;
                    }
                }
                if (child.isBranch && result < NoAndSkip)
                    this.eachFind(child.children, method, list, options);
            }
        }
        toChildren(branch) {
            this.findLeaf = null;
            return [branch || this.target];
        }
        __onRemoveChild(event) {
            const { id, innerId } = event.child;
            if (this.idMap[id])
                delete this.idMap[id];
            if (this.innerIdMap[innerId])
                delete this.innerIdMap[innerId];
        }
        __checkIdChange(event) {
            if (event.attrName === 'id') {
                const id = event.oldValue;
                if (this.idMap[id])
                    delete this.idMap[id];
            }
        }
        __listenEvents() {
            this.__eventIds = [
                this.target.on_(ChildEvent.REMOVE, this.__onRemoveChild, this),
                this.target.on_(PropertyEvent.CHANGE, this.__checkIdChange, this)
            ];
        }
        __removeListenEvents() {
            this.target.off_(this.__eventIds);
            this.__eventIds.length = 0;
        }
        destroy() {
            if (this.__eventIds.length) {
                this.__removeListenEvents();
                this.picker.destroy();
                this.findLeaf = null;
                this.innerIdMap = {};
                this.idMap = {};
            }
        }
    }

    Object.assign(Creator, {
        watcher: (target, options) => new Watcher(target, options),
        layouter: (target, options) => new Layouter(target, options),
        renderer: (target, canvas, options) => new Renderer(target, canvas, options),
        selector: (target, options) => new Selector(target, options)
    });
    Platform.layout = Layouter.fullLayout;

    function effectType(defaultValue) {
        return decorateLeafAttr(defaultValue, (key) => attr({
            set(value) {
                this.__setAttr(key, value);
                if (value)
                    this.__.__useEffect = true;
                this.__layout.renderChanged || this.__layout.renderChange();
            }
        }));
    }
    function resizeType(defaultValue) {
        return decorateLeafAttr(defaultValue, (key) => attr({
            set(value) {
                this.__setAttr(key, value);
                this.__layout.boxChanged || this.__layout.boxChange();
                this.__updateSize();
            }
        }));
    }
    function zoomLayerType() {
        return (target, key) => {
            const privateKey = '_' + key;
            defineKey(target, key, {
                set(value) { if (this.isLeafer)
                    this[privateKey] = value; },
                get() {
                    return this.isApp
                        ? this.tree.zoomLayer
                        : (this.isLeafer ? (this[privateKey] || this) : this.leafer && this.leafer.zoomLayer);
                }
            });
        };
    }

    const TextConvert = {};
    const ColorConvert = {};
    const UnitConvert = {
        number(value, percentRefer) {
            if (typeof value === 'object')
                return value.type === 'percent' ? value.value * percentRefer : value.value;
            return value;
        }
    };
    const PathArrow = {};
    const Paint = {};
    const PaintImage = {};
    const PaintGradient = {};
    const Effect = {};
    const Export = {};
    const State = {
        setStyleName(_leaf, _styleName, _value) { return needPlugin('state'); },
        set(_leaf, _stateName) { return needPlugin('state'); }
    };
    const Transition = {
        list: {},
        register(attrName, fn) { Transition.list[attrName] = fn; },
        get(attrName) { return Transition.list[attrName]; }
    };

    const { parse, objectToCanvasData } = PathConvert;
    const emptyPaint = {};
    const debug$4 = Debug.get('UIData');
    class UIData extends LeafData {
        get scale() { const { scaleX, scaleY } = this; return scaleX !== scaleY ? { x: scaleX, y: scaleY } : scaleX; }
        get __strokeWidth() {
            const { strokeWidth, strokeWidthFixed } = this;
            if (strokeWidthFixed) {
                const ui = this.__leaf;
                let { scaleX } = ui.__nowWorld || ui.__world;
                if (scaleX < 0)
                    scaleX = -scaleX;
                return scaleX > 1 ? strokeWidth / scaleX : strokeWidth;
            }
            else
                return strokeWidth;
        }
        get __hasStroke() { return this.stroke && this.strokeWidth; }
        get __clipAfterFill() { return (this.cornerRadius || this.__pathInputed); }
        get __autoWidth() { return !this._width; }
        get __autoHeight() { return !this._height; }
        get __autoSide() { return !this._width || !this._height; }
        get __autoSize() { return !this._width && !this._height; }
        setVisible(value) {
            this._visible = value;
            const { leafer } = this.__leaf;
            if (leafer)
                leafer.watcher.hasVisible = true;
        }
        setWidth(value) {
            if (value < 0) {
                this._width = -value;
                this.__leaf.scaleX *= -1;
                debug$4.warn('width < 0, instead -scaleX ', this);
            }
            else
                this._width = value;
        }
        setHeight(value) {
            if (value < 0) {
                this._height = -value;
                this.__leaf.scaleY *= -1;
                debug$4.warn('height < 0, instead -scaleY', this);
            }
            else
                this._height = value;
        }
        setFill(value) {
            if (this.__naturalWidth)
                this.__removeNaturalSize();
            if (typeof value === 'string' || !value) {
                if (this.__isFills) {
                    this.__removeInput('fill');
                    PaintImage.recycleImage('fill', this);
                    this.__isFills = false;
                    if (this.__pixelFill)
                        this.__pixelFill = false;
                }
                this._fill = value;
            }
            else if (typeof value === 'object') {
                this.__setInput('fill', value);
                this.__leaf.__layout.boxChanged || this.__leaf.__layout.boxChange();
                this.__isFills = true;
                this._fill || (this._fill = emptyPaint);
            }
        }
        setStroke(value) {
            if (typeof value === 'string' || !value) {
                if (this.__isStrokes) {
                    this.__removeInput('stroke');
                    PaintImage.recycleImage('stroke', this);
                    this.__isStrokes = false;
                    if (this.__pixelStroke)
                        this.__pixelStroke = false;
                }
                this._stroke = value;
            }
            else if (typeof value === 'object') {
                this.__setInput('stroke', value);
                this.__leaf.__layout.boxChanged || this.__leaf.__layout.boxChange();
                this.__isStrokes = true;
                this._stroke || (this._stroke = emptyPaint);
            }
        }
        setPath(value) {
            const isString = typeof value === 'string';
            if (isString || (value && typeof value[0] === 'object')) {
                this.__setInput('path', value);
                this._path = isString ? parse(value) : objectToCanvasData(value);
            }
            else {
                if (this.__input)
                    this.__removeInput('path');
                this._path = value;
            }
        }
        setShadow(value) {
            this.__setInput('shadow', value);
            if (value instanceof Array) {
                if (value.some((item) => item.visible === false))
                    value = value.filter((item) => item.visible !== false);
                this._shadow = value.length ? value : null;
            }
            else
                this._shadow = value && value.visible !== false ? [value] : null;
        }
        setInnerShadow(value) {
            this.__setInput('innerShadow', value);
            if (value instanceof Array) {
                if (value.some((item) => item.visible === false))
                    value = value.filter((item) => item.visible !== false);
                this._innerShadow = value.length ? value : null;
            }
            else
                this._innerShadow = value && value.visible !== false ? [value] : null;
        }
        __computePaint() {
            const { fill, stroke } = this.__input;
            if (fill)
                Paint.compute('fill', this.__leaf);
            if (stroke)
                Paint.compute('stroke', this.__leaf);
            this.__needComputePaint = false;
        }
    }

    class GroupData extends UIData {
    }

    class BoxData extends GroupData {
        get __boxStroke() { return !this.__pathInputed; }
        get __drawAfterFill() { return this.overflow === 'hide' && this.__clipAfterFill && this.__leaf.children.length; }
        get __clipAfterFill() { return this.__leaf.isOverflow || super.__clipAfterFill; }
    }

    class LeaferData extends GroupData {
        __getInputData(names, options) {
            const data = super.__getInputData(names, options);
            canvasSizeAttrs.forEach(key => delete data[key]);
            return data;
        }
    }

    class FrameData extends BoxData {
    }

    class LineData extends UIData {
    }

    class RectData extends UIData {
        get __boxStroke() { return !this.__pathInputed; }
    }

    class EllipseData extends UIData {
        get __boxStroke() { return !this.__pathInputed; }
    }

    class PolygonData extends UIData {
    }

    class StarData extends UIData {
    }

    class PathData extends UIData {
        get __pathInputed() { return 2; }
    }

    class PenData extends GroupData {
    }

    const fontWeightMap = {
        'thin': 100,
        'extra-light': 200,
        'light': 300,
        'normal': 400,
        'medium': 500,
        'semi-bold': 600,
        'bold': 700,
        'extra-bold': 800,
        'black': 900
    };
    class TextData extends UIData {
        get __useNaturalRatio() { return false; }
        setFontWeight(value) {
            if (typeof value === 'string') {
                this.__setInput('fontWeight', value);
                this._fontWeight = fontWeightMap[value] || 400;
            }
            else {
                if (this.__input)
                    this.__removeInput('fontWeight');
                this._fontWeight = value;
            }
        }
    }

    class ImageData extends RectData {
        setUrl(value) {
            this.__setImageFill(value);
            this._url = value;
        }
        __setImageFill(value) {
            if (this.__leaf.image)
                this.__leaf.image = null;
            this.fill = value ? { type: 'image', mode: 'stretch', url: value } : undefined;
        }
        __getData() {
            const data = super.__getData();
            delete data.fill;
            return data;
        }
        __getInputData(names, options) {
            const data = super.__getInputData(names, options);
            delete data.fill;
            return data;
        }
    }

    class CanvasData extends RectData {
        get __isCanvas() { return true; }
        get __drawAfterFill() { return true; }
        __getInputData(names, options) {
            const data = super.__getInputData(names, options);
            data.url = this.__leaf.canvas.toDataURL('image/png');
            return data;
        }
    }

    const UIBounds = {
        __updateStrokeSpread() {
            let width = 0, boxWidth = 0;
            const data = this.__, { strokeAlign, strokeWidth } = data;
            if ((data.stroke || data.hitStroke === 'all') && strokeWidth && strokeAlign !== 'inside') {
                boxWidth = width = strokeAlign === 'center' ? strokeWidth / 2 : strokeWidth;
                if (!data.__boxStroke) {
                    const miterLimitAddWidth = data.__isLinePath ? 0 : 10 * width;
                    const storkeCapAddWidth = data.strokeCap === 'none' ? 0 : strokeWidth;
                    width += Math.max(miterLimitAddWidth, storkeCapAddWidth);
                }
            }
            if (data.__useArrow)
                width += strokeWidth * 5;
            this.__layout.strokeBoxSpread = boxWidth;
            return width;
        },
        __updateRenderSpread() {
            let width = 0;
            const { shadow, innerShadow, blur, backgroundBlur } = this.__;
            if (shadow)
                shadow.forEach(item => width = Math.max(width, Math.max(Math.abs(item.y), Math.abs(item.x)) + (item.spread > 0 ? item.spread : 0) + item.blur * 1.5));
            if (blur)
                width = Math.max(width, blur);
            let shapeWidth = width = Math.ceil(width);
            if (innerShadow)
                innerShadow.forEach(item => shapeWidth = Math.max(shapeWidth, Math.max(Math.abs(item.y), Math.abs(item.x)) + (item.spread < 0 ? -item.spread : 0) + item.blur * 1.5));
            if (backgroundBlur)
                shapeWidth = Math.max(shapeWidth, backgroundBlur);
            this.__layout.renderShapeSpread = shapeWidth;
            return width + (this.__layout.strokeSpread || 0);
        }
    };

    const UIRender = {
        __updateChange() {
            const data = this.__;
            if (data.__useEffect) {
                const { shadow, innerShadow, blur, backgroundBlur } = this.__;
                data.__useEffect = !!(shadow || innerShadow || blur || backgroundBlur);
            }
            data.__checkSingle();
            const complex = data.__isFills || data.__isStrokes || data.cornerRadius || data.__useEffect;
            if (complex) {
                data.__complex = true;
            }
            else {
                data.__complex && (data.__complex = false);
            }
        },
        __drawFast(canvas, options) {
            drawFast(this, canvas, options);
        },
        __draw(canvas, options) {
            const data = this.__;
            if (data.__complex) {
                if (data.__needComputePaint)
                    data.__computePaint();
                const { fill, stroke, __drawAfterFill } = data;
                this.__drawRenderPath(canvas);
                if (data.__useEffect) {
                    const shape = Paint.shape(this, canvas, options);
                    this.__nowWorld = this.__getNowWorld(options);
                    const { shadow, innerShadow } = data;
                    if (shadow)
                        Effect.shadow(this, canvas, shape);
                    if (fill)
                        data.__isFills ? Paint.fills(fill, this, canvas) : Paint.fill(fill, this, canvas);
                    if (__drawAfterFill)
                        this.__drawAfterFill(canvas, options);
                    if (innerShadow)
                        Effect.innerShadow(this, canvas, shape);
                    if (stroke)
                        data.__isStrokes ? Paint.strokes(stroke, this, canvas) : Paint.stroke(stroke, this, canvas);
                    if (shape.worldCanvas)
                        shape.worldCanvas.recycle();
                    shape.canvas.recycle();
                }
                else {
                    if (fill)
                        data.__isFills ? Paint.fills(fill, this, canvas) : Paint.fill(fill, this, canvas);
                    if (__drawAfterFill)
                        this.__drawAfterFill(canvas, options);
                    if (stroke)
                        data.__isStrokes ? Paint.strokes(stroke, this, canvas) : Paint.stroke(stroke, this, canvas);
                }
            }
            else {
                if (data.__pathInputed) {
                    drawFast(this, canvas, options);
                }
                else {
                    this.__drawFast(canvas, options);
                }
            }
        },
        __renderShape(canvas, options, ignoreFill, ignoreStroke) {
            if (this.__worldOpacity) {
                canvas.setWorld(this.__nowWorld = this.__getNowWorld(options));
                const { fill, stroke } = this.__;
                this.__drawRenderPath(canvas);
                if (fill && !ignoreFill)
                    this.__.__pixelFill ? Paint.fills(fill, this, canvas) : Paint.fill('#000000', this, canvas);
                if (this.__.__isCanvas)
                    this.__drawAfterFill(canvas, options);
                if (stroke && !ignoreStroke)
                    this.__.__pixelStroke ? Paint.strokes(stroke, this, canvas) : Paint.stroke('#000000', this, canvas);
            }
        },
        __drawAfterFill(canvas, options) {
            if (this.__.__clipAfterFill) {
                canvas.save();
                this.windingRule ? canvas.clip(this.windingRule) : canvas.clip();
                this.__drawContent(canvas, options);
                canvas.restore();
            }
            else
                this.__drawContent(canvas, options);
        }
    };
    function drawFast(ui, canvas, options) {
        const { fill, stroke, __drawAfterFill } = ui.__;
        ui.__drawRenderPath(canvas);
        if (fill)
            Paint.fill(fill, ui, canvas);
        if (__drawAfterFill)
            ui.__drawAfterFill(canvas, options);
        if (stroke)
            Paint.stroke(stroke, ui, canvas);
    }

    const RectRender = {
        __drawFast(canvas, options) {
            let { width, height, fill, stroke, __drawAfterFill } = this.__;
            if (fill) {
                canvas.fillStyle = fill;
                canvas.fillRect(0, 0, width, height);
            }
            if (__drawAfterFill)
                this.__drawAfterFill(canvas, options);
            if (stroke) {
                const { strokeAlign, __strokeWidth } = this.__;
                if (!__strokeWidth)
                    return;
                canvas.setStroke(stroke, __strokeWidth, this.__);
                const half = __strokeWidth / 2;
                switch (strokeAlign) {
                    case 'center':
                        canvas.strokeRect(0, 0, width, height);
                        break;
                    case 'inside':
                        width -= __strokeWidth, height -= __strokeWidth;
                        if (width < 0 || height < 0) {
                            canvas.save();
                            this.__clip(canvas, options);
                            canvas.strokeRect(half, half, width, height);
                            canvas.restore();
                        }
                        else
                            canvas.strokeRect(half, half, width, height);
                        break;
                    case 'outside':
                        canvas.strokeRect(-half, -half, width + __strokeWidth, height + __strokeWidth);
                        break;
                }
            }
        }
    };

    var UI_1;
    exports.UI = UI_1 = class UI extends exports.Leaf {
        get app() { return this.leafer && this.leafer.app; }
        get isFrame() { return false; }
        set scale(value) { MathHelper.assignScale(this, value); }
        get scale() { return this.__.scale; }
        get pen() {
            const { path } = this.__;
            pen.set(this.path = path || []);
            if (!path)
                this.__drawPathByBox(pen);
            return pen;
        }
        get editConfig() { return undefined; }
        get editOuter() { return ''; }
        get editInner() { return ''; }
        constructor(data) {
            super(data);
        }
        reset(_data) { }
        set(data, isTemp) {
            if (isTemp) {
                this.lockNormalStyle = true;
                Object.assign(this, data);
                this.lockNormalStyle = false;
            }
            else
                Object.assign(this, data);
        }
        get(name) {
            return typeof name === 'string' ? this.__.__getInput(name) : this.__.__getInputData(name);
        }
        createProxyData() { return undefined; }
        find(_condition, _options) { return undefined; }
        findTag(tag) { return this.find({ tag }); }
        findOne(_condition, _options) { return undefined; }
        findId(id) { return this.findOne({ id }); }
        getPath(curve, pathForRender) {
            this.__layout.update();
            let path = pathForRender ? this.__.__pathForRender : this.__.path;
            if (!path)
                pen.set(path = []), this.__drawPathByBox(pen);
            return curve ? PathConvert.toCanvasData(path, true) : path;
        }
        getPathString(curve, pathForRender, floatLength) {
            return PathConvert.stringify(this.getPath(curve, pathForRender), floatLength);
        }
        load() {
            this.__.__computePaint();
        }
        __onUpdateSize() {
            if (this.__.__input) {
                const data = this.__;
                (data.lazy && !this.__inLazyBounds && !Export.running) ? data.__needComputePaint = true : data.__computePaint();
            }
        }
        __updateRenderPath() {
            if (this.__.path) {
                const data = this.__;
                data.__pathForRender = data.cornerRadius ? PathCorner.smooth(data.path, data.cornerRadius, data.cornerSmoothing) : data.path;
                if (data.__useArrow)
                    PathArrow.addArrows(this, !data.cornerRadius);
            }
        }
        __drawRenderPath(canvas) {
            canvas.beginPath();
            this.__drawPathByData(canvas, this.__.__pathForRender);
        }
        __drawPath(canvas) {
            canvas.beginPath();
            this.__drawPathByData(canvas, this.__.path);
        }
        __drawPathByData(drawer, data) {
            data ? PathDrawer.drawPathByData(drawer, data) : this.__drawPathByBox(drawer);
        }
        __drawPathByBox(drawer) {
            const { x, y, width, height } = this.__layout.boxBounds;
            if (this.__.cornerRadius) {
                const { cornerRadius } = this.__;
                drawer.roundRect(x, y, width, height, typeof cornerRadius === 'number' ? [cornerRadius] : cornerRadius);
            }
            else
                drawer.rect(x, y, width, height);
        }
        animate(_keyframe, _options, _type, _isTemp) {
            return needPlugin('animate');
        }
        killAnimate(_type) { }
        export(filename, options) {
            return Export.export(this, filename, options);
        }
        clone(data) {
            const json = this.toJSON();
            if (data)
                Object.assign(json, data);
            return UI_1.one(json);
        }
        static one(data, x, y, width, height) {
            return UICreator.get(data.tag || this.prototype.__tag, data, x, y, width, height);
        }
        static registerUI() {
            registerUI()(this);
        }
        static registerData(data) {
            dataProcessor(data)(this.prototype);
        }
        static setEditConfig(_config) { }
        static setEditOuter(_toolName) { }
        static setEditInner(_editorName) { }
        destroy() {
            this.fill = this.stroke = null;
            if (this.__animate)
                this.killAnimate();
            super.destroy();
        }
    };
    __decorate([
        dataProcessor(UIData)
    ], exports.UI.prototype, "__", void 0);
    __decorate([
        zoomLayerType()
    ], exports.UI.prototype, "zoomLayer", void 0);
    __decorate([
        dataType('')
    ], exports.UI.prototype, "id", void 0);
    __decorate([
        dataType('')
    ], exports.UI.prototype, "name", void 0);
    __decorate([
        dataType('')
    ], exports.UI.prototype, "className", void 0);
    __decorate([
        surfaceType('pass-through')
    ], exports.UI.prototype, "blendMode", void 0);
    __decorate([
        opacityType(1)
    ], exports.UI.prototype, "opacity", void 0);
    __decorate([
        visibleType(true)
    ], exports.UI.prototype, "visible", void 0);
    __decorate([
        surfaceType(false)
    ], exports.UI.prototype, "locked", void 0);
    __decorate([
        sortType(0)
    ], exports.UI.prototype, "zIndex", void 0);
    __decorate([
        maskType(false)
    ], exports.UI.prototype, "mask", void 0);
    __decorate([
        eraserType(false)
    ], exports.UI.prototype, "eraser", void 0);
    __decorate([
        positionType(0, true)
    ], exports.UI.prototype, "x", void 0);
    __decorate([
        positionType(0, true)
    ], exports.UI.prototype, "y", void 0);
    __decorate([
        boundsType(100, true)
    ], exports.UI.prototype, "width", void 0);
    __decorate([
        boundsType(100, true)
    ], exports.UI.prototype, "height", void 0);
    __decorate([
        scaleType(1, true)
    ], exports.UI.prototype, "scaleX", void 0);
    __decorate([
        scaleType(1, true)
    ], exports.UI.prototype, "scaleY", void 0);
    __decorate([
        rotationType(0, true)
    ], exports.UI.prototype, "rotation", void 0);
    __decorate([
        rotationType(0, true)
    ], exports.UI.prototype, "skewX", void 0);
    __decorate([
        rotationType(0, true)
    ], exports.UI.prototype, "skewY", void 0);
    __decorate([
        positionType(0, true)
    ], exports.UI.prototype, "offsetX", void 0);
    __decorate([
        positionType(0, true)
    ], exports.UI.prototype, "offsetY", void 0);
    __decorate([
        positionType(0, true)
    ], exports.UI.prototype, "scrollX", void 0);
    __decorate([
        positionType(0, true)
    ], exports.UI.prototype, "scrollY", void 0);
    __decorate([
        autoLayoutType()
    ], exports.UI.prototype, "origin", void 0);
    __decorate([
        autoLayoutType()
    ], exports.UI.prototype, "around", void 0);
    __decorate([
        dataType(false)
    ], exports.UI.prototype, "lazy", void 0);
    __decorate([
        naturalBoundsType(1)
    ], exports.UI.prototype, "pixelRatio", void 0);
    __decorate([
        pathInputType()
    ], exports.UI.prototype, "path", void 0);
    __decorate([
        pathType()
    ], exports.UI.prototype, "windingRule", void 0);
    __decorate([
        pathType(true)
    ], exports.UI.prototype, "closed", void 0);
    __decorate([
        boundsType(0)
    ], exports.UI.prototype, "padding", void 0);
    __decorate([
        dataType(false)
    ], exports.UI.prototype, "draggable", void 0);
    __decorate([
        dataType()
    ], exports.UI.prototype, "dragBounds", void 0);
    __decorate([
        dataType(false)
    ], exports.UI.prototype, "editable", void 0);
    __decorate([
        hitType(true)
    ], exports.UI.prototype, "hittable", void 0);
    __decorate([
        hitType('path')
    ], exports.UI.prototype, "hitFill", void 0);
    __decorate([
        strokeType('path')
    ], exports.UI.prototype, "hitStroke", void 0);
    __decorate([
        hitType(false)
    ], exports.UI.prototype, "hitBox", void 0);
    __decorate([
        hitType(true)
    ], exports.UI.prototype, "hitChildren", void 0);
    __decorate([
        hitType(true)
    ], exports.UI.prototype, "hitSelf", void 0);
    __decorate([
        hitType()
    ], exports.UI.prototype, "hitRadius", void 0);
    __decorate([
        cursorType('')
    ], exports.UI.prototype, "cursor", void 0);
    __decorate([
        surfaceType()
    ], exports.UI.prototype, "fill", void 0);
    __decorate([
        strokeType()
    ], exports.UI.prototype, "stroke", void 0);
    __decorate([
        strokeType('inside')
    ], exports.UI.prototype, "strokeAlign", void 0);
    __decorate([
        strokeType(1)
    ], exports.UI.prototype, "strokeWidth", void 0);
    __decorate([
        strokeType(false)
    ], exports.UI.prototype, "strokeWidthFixed", void 0);
    __decorate([
        strokeType('none')
    ], exports.UI.prototype, "strokeCap", void 0);
    __decorate([
        strokeType('miter')
    ], exports.UI.prototype, "strokeJoin", void 0);
    __decorate([
        strokeType()
    ], exports.UI.prototype, "dashPattern", void 0);
    __decorate([
        strokeType()
    ], exports.UI.prototype, "dashOffset", void 0);
    __decorate([
        strokeType(10)
    ], exports.UI.prototype, "miterLimit", void 0);
    __decorate([
        pathType(0)
    ], exports.UI.prototype, "cornerRadius", void 0);
    __decorate([
        pathType()
    ], exports.UI.prototype, "cornerSmoothing", void 0);
    __decorate([
        effectType()
    ], exports.UI.prototype, "shadow", void 0);
    __decorate([
        effectType()
    ], exports.UI.prototype, "innerShadow", void 0);
    __decorate([
        effectType()
    ], exports.UI.prototype, "blur", void 0);
    __decorate([
        effectType()
    ], exports.UI.prototype, "backgroundBlur", void 0);
    __decorate([
        effectType()
    ], exports.UI.prototype, "grayscale", void 0);
    __decorate([
        dataType({})
    ], exports.UI.prototype, "data", void 0);
    __decorate([
        rewrite(exports.Leaf.prototype.reset)
    ], exports.UI.prototype, "reset", null);
    exports.UI = UI_1 = __decorate([
        useModule(UIBounds),
        useModule(UIRender),
        rewriteAble()
    ], exports.UI);

    exports.Group = class Group extends exports.UI {
        get __tag() { return 'Group'; }
        get isBranch() { return true; }
        constructor(data) {
            super(data);
        }
        reset(data) {
            this.__setBranch();
            super.reset(data);
        }
        __setBranch() {
            if (!this.children)
                this.children = [];
        }
        set(data, isTemp) {
            if (data.children) {
                const { children } = data;
                delete data.children;
                this.children ? this.clear() : this.__setBranch();
                super.set(data, isTemp);
                children.forEach(child => this.add(child));
                data.children = children;
            }
            else
                super.set(data, isTemp);
        }
        toJSON(options) {
            const data = super.toJSON(options);
            data.children = this.children.map(child => child.toJSON(options));
            return data;
        }
        pick(_hitPoint, _options) { return undefined; }
        addAt(child, index) {
            this.add(child, index);
        }
        addAfter(child, after) {
            this.add(child, this.children.indexOf(after) + 1);
        }
        addBefore(child, before) {
            this.add(child, this.children.indexOf(before));
        }
        add(_child, _index) { }
        addMany(..._children) { }
        remove(_child, _destroy) { }
        removeAll(_destroy) { }
        clear() { }
    };
    __decorate([
        dataProcessor(GroupData)
    ], exports.Group.prototype, "__", void 0);
    exports.Group = __decorate([
        useModule(exports.Branch),
        registerUI()
    ], exports.Group);

    var Leafer_1;
    const debug$3 = Debug.get('Leafer');
    exports.Leafer = Leafer_1 = class Leafer extends exports.Group {
        get __tag() { return 'Leafer'; }
        get isApp() { return false; }
        get app() { return this.parent || this; }
        get isLeafer() { return true; }
        get imageReady() { return this.viewReady && ImageManager.isComplete; }
        get layoutLocked() { return !this.layouter.running; }
        get FPS() { return this.renderer ? this.renderer.FPS : 60; }
        get cursorPoint() { return (this.interaction && this.interaction.hoverData) || { x: this.width / 2, y: this.height / 2 }; }
        get clientBounds() { return this.canvas && this.canvas.getClientBounds(); }
        constructor(userConfig, data) {
            super(data);
            this.config = {
                type: 'design',
                start: true,
                hittable: true,
                smooth: true,
                lazySpeard: 100,
                zoom: {
                    min: 0.01,
                    max: 256
                },
                move: {
                    holdSpaceKey: true,
                    holdMiddleKey: true,
                    autoDistance: 2
                }
            };
            this.leafs = 0;
            this.__eventIds = [];
            this.__controllers = [];
            this.__readyWait = [];
            this.__viewReadyWait = [];
            this.__viewCompletedWait = [];
            this.__nextRenderWait = [];
            this.userConfig = userConfig;
            if (userConfig && (userConfig.view || userConfig.width))
                this.init(userConfig);
            Leafer_1.list.add(this);
        }
        init(userConfig, parentApp) {
            if (this.canvas)
                return;
            this.__setLeafer(this);
            if (userConfig)
                DataHelper.assign(this.config, userConfig);
            let start;
            const { config } = this;
            this.initType(config.type);
            const canvas = this.canvas = Creator.canvas(config);
            this.__controllers.push(this.renderer = Creator.renderer(this, canvas, config), this.watcher = Creator.watcher(this, config), this.layouter = Creator.layouter(this, config));
            if (this.isApp)
                this.__setApp();
            this.__checkAutoLayout(config, parentApp);
            this.view = canvas.view;
            if (parentApp) {
                this.__bindApp(parentApp);
                start = parentApp.running;
            }
            else {
                this.selector = Creator.selector(this);
                this.interaction = Creator.interaction(this, canvas, this.selector, config);
                if (this.interaction) {
                    this.__controllers.unshift(this.interaction);
                    this.hitCanvasManager = Creator.hitCanvasManager();
                }
                this.canvasManager = new CanvasManager();
                start = config.start;
            }
            this.hittable = config.hittable;
            this.fill = config.fill;
            this.canvasManager.add(canvas);
            this.__listenEvents();
            if (start)
                this.__startTimer = setTimeout(this.start.bind(this));
            WaitHelper.run(this.__initWait);
            this.onInit();
        }
        onInit() { }
        initType(_type) { }
        set(data) {
            this.waitInit(() => { super.set(data); });
        }
        start() {
            clearTimeout(this.__startTimer);
            if (!this.running && this.canvas) {
                this.running = true;
                this.ready ? this.emitLeafer(LeaferEvent.RESTART) : this.emitLeafer(LeaferEvent.START);
                this.__controllers.forEach(item => item.start());
                if (!this.isApp)
                    this.renderer.render();
            }
        }
        stop() {
            clearTimeout(this.__startTimer);
            if (this.running && this.canvas) {
                this.__controllers.forEach(item => item.stop());
                this.running = false;
                this.emitLeafer(LeaferEvent.STOP);
            }
        }
        unlockLayout() {
            this.layouter.start();
            this.updateLayout();
        }
        lockLayout() {
            this.updateLayout();
            this.layouter.stop();
        }
        resize(size) {
            const data = DataHelper.copyAttrs({}, size, canvasSizeAttrs);
            Object.keys(data).forEach(key => this[key] = data[key]);
        }
        forceRender(bounds) {
            this.renderer.addBlock(bounds ? new Bounds(bounds) : this.canvas.bounds);
            if (this.viewReady)
                this.renderer.update();
        }
        updateCursor(cursor) {
            const i = this.interaction;
            if (i)
                cursor ? i.setCursor(cursor) : i.updateCursor();
        }
        updateLazyBounds() {
            this.lazyBounds = this.canvas.bounds.clone().spread(this.config.lazySpeard);
        }
        __doResize(size) {
            const { canvas } = this;
            if (!canvas || canvas.isSameSize(size))
                return;
            const old = DataHelper.copyAttrs({}, this.canvas, canvasSizeAttrs);
            canvas.resize(size);
            this.updateLazyBounds();
            this.__onResize(new ResizeEvent(size, old));
        }
        __onResize(event) {
            this.emitEvent(event);
            DataHelper.copyAttrs(this.__, event, canvasSizeAttrs);
            if (!event.width || !event.height)
                debug$3.warn('w = 0 or h = 0');
            setTimeout(() => { if (this.canvasManager)
                this.canvasManager.clearRecycled(); }, 0);
        }
        __setApp() { }
        __bindApp(app) {
            this.selector = app.selector;
            this.interaction = app.interaction;
            this.canvasManager = app.canvasManager;
            this.hitCanvasManager = app.hitCanvasManager;
        }
        __setLeafer(leafer) {
            this.leafer = leafer;
            this.__level = 1;
        }
        __checkAutoLayout(config, parentApp) {
            if (!parentApp) {
                if (!config.width || !config.height)
                    this.autoLayout = new AutoBounds(config);
                this.canvas.startAutoLayout(this.autoLayout, this.__onResize.bind(this));
            }
        }
        __setAttr(attrName, newValue) {
            if (this.canvas) {
                if (canvasSizeAttrs.includes(attrName)) {
                    if (!newValue)
                        debug$3.warn(attrName + ' is 0');
                    this.__changeCanvasSize(attrName, newValue);
                }
                else if (attrName === 'fill') {
                    this.__changeFill(newValue);
                }
                else if (attrName === 'hittable') {
                    if (!this.parent)
                        this.canvas.hittable = newValue;
                }
                else if (attrName === 'zIndex') {
                    this.canvas.zIndex = newValue;
                    setTimeout(() => this.parent && this.parent.__updateSortChildren());
                }
            }
            return super.__setAttr(attrName, newValue);
        }
        __getAttr(attrName) {
            if (this.canvas && canvasSizeAttrs.includes(attrName))
                return this.canvas[attrName];
            return super.__getAttr(attrName);
        }
        __changeCanvasSize(attrName, newValue) {
            const data = DataHelper.copyAttrs({}, this.canvas, canvasSizeAttrs);
            data[attrName] = this.config[attrName] = newValue;
            if (newValue)
                this.canvas.stopAutoLayout();
            this.__doResize(data);
        }
        __changeFill(newValue) {
            this.config.fill = newValue;
            if (this.canvas.allowBackgroundColor)
                this.canvas.backgroundColor = newValue;
            else
                this.forceRender();
        }
        __onCreated() {
            this.created = true;
        }
        __onReady() {
            if (this.ready)
                return;
            this.ready = true;
            this.emitLeafer(LeaferEvent.BEFORE_READY);
            this.emitLeafer(LeaferEvent.READY);
            this.emitLeafer(LeaferEvent.AFTER_READY);
            WaitHelper.run(this.__readyWait);
        }
        __onViewReady() {
            if (this.viewReady)
                return;
            this.viewReady = true;
            this.emitLeafer(LeaferEvent.VIEW_READY);
            WaitHelper.run(this.__viewReadyWait);
        }
        __onNextRender() {
            if (this.viewReady) {
                WaitHelper.run(this.__nextRenderWait);
                const { imageReady } = this;
                if (imageReady && !this.viewCompleted)
                    this.__checkViewCompleted();
                if (!imageReady)
                    this.viewCompleted = false;
            }
        }
        __checkViewCompleted(emit = true) {
            this.nextRender(() => {
                if (this.imageReady) {
                    if (emit)
                        this.emitLeafer(LeaferEvent.VIEW_COMPLETED);
                    WaitHelper.run(this.__viewCompletedWait);
                    this.viewCompleted = true;
                }
            });
        }
        __onWatchData() {
            if (this.watcher.childrenChanged && this.interaction) {
                this.nextRender(() => this.interaction.updateCursor());
            }
        }
        waitInit(item, bind) {
            if (bind)
                item = item.bind(bind);
            if (!this.__initWait)
                this.__initWait = [];
            this.canvas ? item() : this.__initWait.push(item);
        }
        waitReady(item, bind) {
            if (bind)
                item = item.bind(bind);
            this.ready ? item() : this.__readyWait.push(item);
        }
        waitViewReady(item, bind) {
            if (bind)
                item = item.bind(bind);
            this.viewReady ? item() : this.__viewReadyWait.push(item);
        }
        waitViewCompleted(item, bind) {
            if (bind)
                item = item.bind(bind);
            this.__viewCompletedWait.push(item);
            if (this.viewCompleted)
                this.__checkViewCompleted(false);
            else if (!this.running)
                this.start();
        }
        nextRender(item, bind, off) {
            if (bind)
                item = item.bind(bind);
            const list = this.__nextRenderWait;
            if (off) {
                for (let i = 0; i < list.length; i++) {
                    if (list[i] === item) {
                        list.splice(i, 1);
                        break;
                    }
                }
            }
            else
                list.push(item);
        }
        zoom(_zoomType, _padding, _fixedScale) {
            return needPlugin('view');
        }
        getValidMove(moveX, moveY) { return { x: moveX, y: moveY }; }
        getValidScale(changeScale) { return changeScale; }
        getWorldPointByClient(clientPoint, updateClient) {
            return this.interaction && this.interaction.getLocal(clientPoint, updateClient);
        }
        getPagePointByClient(clientPoint, updateClient) {
            return this.getPagePoint(this.getWorldPointByClient(clientPoint, updateClient));
        }
        updateClientBounds() {
            this.canvas && this.canvas.updateClientBounds();
        }
        receiveEvent(_event) { }
        __checkUpdateLayout() {
            this.__layout.update();
        }
        emitLeafer(type) {
            this.emitEvent(new LeaferEvent(type, this));
        }
        __listenEvents() {
            const runId = Run.start('FirstCreate ' + this.innerName);
            this.once(LeaferEvent.START, () => Run.end(runId));
            this.once(LayoutEvent.START, () => this.updateLazyBounds());
            this.once(LayoutEvent.END, () => this.__onReady());
            this.once(RenderEvent.START, () => this.__onCreated());
            this.once(RenderEvent.END, () => this.__onViewReady());
            this.__eventIds.push(this.on_(WatchEvent.DATA, this.__onWatchData, this), this.on_(RenderEvent.NEXT, this.__onNextRender, this), this.on_(LayoutEvent.CHECK_UPDATE, this.__checkUpdateLayout, this));
        }
        __removeListenEvents() {
            this.off_(this.__eventIds);
            this.__eventIds.length = 0;
        }
        destroy(sync) {
            const doDestory = () => {
                if (!this.destroyed) {
                    Leafer_1.list.remove(this);
                    try {
                        this.stop();
                        this.emitEvent(new LeaferEvent(LeaferEvent.END, this));
                        this.__removeListenEvents();
                        this.__controllers.forEach(item => !(this.parent && item === this.interaction) && item.destroy());
                        this.__controllers.length = 0;
                        if (!this.parent) {
                            if (this.selector)
                                this.selector.destroy();
                            if (this.hitCanvasManager)
                                this.hitCanvasManager.destroy();
                            this.canvasManager.destroy();
                        }
                        this.canvas.destroy();
                        this.config.view = this.view = null;
                        if (this.userConfig)
                            this.userConfig.view = null;
                        super.destroy();
                        setTimeout(() => { ImageManager.clearRecycled(); }, 100);
                    }
                    catch (e) {
                        debug$3.error(e);
                    }
                }
            };
            sync ? doDestory() : setTimeout(doDestory);
        }
    };
    exports.Leafer.list = new LeafList();
    __decorate([
        dataProcessor(LeaferData)
    ], exports.Leafer.prototype, "__", void 0);
    __decorate([
        boundsType()
    ], exports.Leafer.prototype, "pixelRatio", void 0);
    exports.Leafer = Leafer_1 = __decorate([
        registerUI()
    ], exports.Leafer);

    exports.Rect = class Rect extends exports.UI {
        get __tag() { return 'Rect'; }
        constructor(data) {
            super(data);
        }
    };
    __decorate([
        dataProcessor(RectData)
    ], exports.Rect.prototype, "__", void 0);
    exports.Rect = __decorate([
        useModule(RectRender),
        rewriteAble(),
        registerUI()
    ], exports.Rect);

    const { copy: copy$3, add, includes: includes$1 } = BoundsHelper;
    const rect$1 = exports.Rect.prototype, group$1 = exports.Group.prototype;
    const childrenRenderBounds = {};
    exports.Box = class Box extends exports.Group {
        get __tag() { return 'Box'; }
        get isBranchLeaf() { return true; }
        constructor(data) {
            super(data);
            this.__layout.renderChanged || this.__layout.renderChange();
        }
        __updateStrokeSpread() { return 0; }
        __updateRectRenderSpread() { return 0; }
        __updateRenderSpread() { return this.__updateRectRenderSpread() || -1; }
        __updateRectBoxBounds() { }
        __updateBoxBounds(_secondLayout) {
            const data = this.__;
            if (this.children.length) {
                if (data.__autoSide) {
                    super.__updateBoxBounds();
                    const { boxBounds } = this.__layout;
                    if (!data.__autoSize) {
                        if (data.__autoWidth) {
                            boxBounds.width += boxBounds.x, boxBounds.x = 0;
                            boxBounds.height = data.height, boxBounds.y = 0;
                        }
                        else {
                            boxBounds.height += boxBounds.y, boxBounds.y = 0;
                            boxBounds.width = data.width, boxBounds.x = 0;
                        }
                    }
                    this.__updateNaturalSize();
                }
                else
                    this.__updateRectBoxBounds();
            }
            else
                this.__updateRectBoxBounds();
        }
        __updateStrokeBounds() { }
        __updateRenderBounds() {
            let isOverflow;
            const { renderBounds } = this.__layout;
            if (this.children.length) {
                super.__updateRenderBounds();
                copy$3(childrenRenderBounds, renderBounds);
                this.__updateRectRenderBounds();
                isOverflow = !includes$1(renderBounds, childrenRenderBounds);
                if (isOverflow && this.__.overflow !== 'hide')
                    add(renderBounds, childrenRenderBounds);
            }
            else
                this.__updateRectRenderBounds();
            !this.isOverflow !== !isOverflow && (this.isOverflow = isOverflow);
        }
        __updateRectRenderBounds() { }
        __updateRectChange() { }
        __updateChange() {
            super.__updateChange();
            this.__updateRectChange();
        }
        __renderRect(_canvas, _options) { }
        __renderGroup(_canvas, _options) { }
        __render(canvas, options) {
            if (this.__.__drawAfterFill) {
                this.__renderRect(canvas, options);
            }
            else {
                this.__renderRect(canvas, options);
                if (this.children.length)
                    this.__renderGroup(canvas, options);
            }
        }
        __drawContent(canvas, options) {
            this.__renderGroup(canvas, options);
            if (this.__.__hasStroke) {
                canvas.setWorld(this.__nowWorld);
                this.__drawRenderPath(canvas);
            }
        }
    };
    __decorate([
        dataProcessor(BoxData)
    ], exports.Box.prototype, "__", void 0);
    __decorate([
        dataType(false)
    ], exports.Box.prototype, "resizeChildren", void 0);
    __decorate([
        dataType(false)
    ], exports.Box.prototype, "textBox", void 0);
    __decorate([
        affectRenderBoundsType('show')
    ], exports.Box.prototype, "overflow", void 0);
    __decorate([
        rewrite(rect$1.__updateStrokeSpread)
    ], exports.Box.prototype, "__updateStrokeSpread", null);
    __decorate([
        rewrite(rect$1.__updateRenderSpread)
    ], exports.Box.prototype, "__updateRectRenderSpread", null);
    __decorate([
        rewrite(rect$1.__updateBoxBounds)
    ], exports.Box.prototype, "__updateRectBoxBounds", null);
    __decorate([
        rewrite(rect$1.__updateStrokeBounds)
    ], exports.Box.prototype, "__updateStrokeBounds", null);
    __decorate([
        rewrite(rect$1.__updateRenderBounds)
    ], exports.Box.prototype, "__updateRectRenderBounds", null);
    __decorate([
        rewrite(rect$1.__updateChange)
    ], exports.Box.prototype, "__updateRectChange", null);
    __decorate([
        rewrite(rect$1.__render)
    ], exports.Box.prototype, "__renderRect", null);
    __decorate([
        rewrite(group$1.__render)
    ], exports.Box.prototype, "__renderGroup", null);
    exports.Box = __decorate([
        rewriteAble(),
        registerUI()
    ], exports.Box);

    exports.Frame = class Frame extends exports.Box {
        get __tag() { return 'Frame'; }
        get isFrame() { return true; }
        constructor(data) {
            super(data);
        }
    };
    __decorate([
        dataProcessor(FrameData)
    ], exports.Frame.prototype, "__", void 0);
    __decorate([
        surfaceType('#FFFFFF')
    ], exports.Frame.prototype, "fill", void 0);
    __decorate([
        affectRenderBoundsType('hide')
    ], exports.Frame.prototype, "overflow", void 0);
    exports.Frame = __decorate([
        registerUI()
    ], exports.Frame);

    const { moveTo: moveTo$3, closePath: closePath$2, ellipse } = PathCommandDataHelper;
    exports.Ellipse = class Ellipse extends exports.UI {
        get __tag() { return 'Ellipse'; }
        constructor(data) {
            super(data);
        }
        __updatePath() {
            const { width, height, innerRadius, startAngle, endAngle } = this.__;
            const rx = width / 2, ry = height / 2;
            const path = this.__.path = [];
            if (innerRadius) {
                if (startAngle || endAngle) {
                    if (innerRadius < 1)
                        ellipse(path, rx, ry, rx * innerRadius, ry * innerRadius, 0, startAngle, endAngle, false);
                    ellipse(path, rx, ry, rx, ry, 0, endAngle, startAngle, true);
                    if (innerRadius < 1)
                        closePath$2(path);
                }
                else {
                    if (innerRadius < 1) {
                        ellipse(path, rx, ry, rx * innerRadius, ry * innerRadius);
                        moveTo$3(path, width, ry);
                    }
                    ellipse(path, rx, ry, rx, ry, 0, 360, 0, true);
                }
                if (Platform.ellipseToCurve)
                    this.__.path = this.getPath(true);
            }
            else {
                if (startAngle || endAngle) {
                    moveTo$3(path, rx, ry);
                    ellipse(path, rx, ry, rx, ry, 0, startAngle, endAngle, false);
                    closePath$2(path);
                }
                else {
                    ellipse(path, rx, ry, rx, ry);
                }
            }
        }
    };
    __decorate([
        dataProcessor(EllipseData)
    ], exports.Ellipse.prototype, "__", void 0);
    __decorate([
        pathType(0)
    ], exports.Ellipse.prototype, "innerRadius", void 0);
    __decorate([
        pathType(0)
    ], exports.Ellipse.prototype, "startAngle", void 0);
    __decorate([
        pathType(0)
    ], exports.Ellipse.prototype, "endAngle", void 0);
    exports.Ellipse = __decorate([
        registerUI()
    ], exports.Ellipse);

    const { moveTo: moveTo$2, lineTo: lineTo$2, drawPoints: drawPoints$1 } = PathCommandDataHelper;
    const { rotate: rotate$1, getAngle: getAngle$1, getDistance: getDistance$2, defaultPoint } = PointHelper;
    const { toBounds: toBounds$1 } = PathBounds;
    exports.Line = class Line extends exports.UI {
        get __tag() { return 'Line'; }
        get toPoint() {
            const { width, rotation } = this.__;
            const to = getPointData();
            if (width)
                to.x = width;
            if (rotation)
                rotate$1(to, rotation);
            return to;
        }
        set toPoint(value) {
            this.width = getDistance$2(defaultPoint, value);
            this.rotation = getAngle$1(defaultPoint, value);
            if (this.height)
                this.height = 0;
        }
        constructor(data) {
            super(data);
        }
        __updatePath() {
            const data = this.__;
            const path = data.path = [];
            if (data.points) {
                drawPoints$1(path, data.points, false, data.closed);
            }
            else {
                moveTo$2(path, 0, 0);
                lineTo$2(path, this.width, 0);
            }
        }
        __updateRenderPath() {
            const data = this.__;
            if (!this.pathInputed && data.points && data.curve) {
                drawPoints$1(data.__pathForRender = [], data.points, data.curve, data.closed);
                if (data.__useArrow)
                    PathArrow.addArrows(this, false);
            }
            else
                super.__updateRenderPath();
        }
        __updateBoxBounds() {
            if (this.points) {
                toBounds$1(this.__.__pathForRender, this.__layout.boxBounds);
            }
            else
                super.__updateBoxBounds();
        }
    };
    __decorate([
        dataProcessor(LineData)
    ], exports.Line.prototype, "__", void 0);
    __decorate([
        affectStrokeBoundsType('center')
    ], exports.Line.prototype, "strokeAlign", void 0);
    __decorate([
        boundsType(0)
    ], exports.Line.prototype, "height", void 0);
    __decorate([
        pathType()
    ], exports.Line.prototype, "points", void 0);
    __decorate([
        pathType(0)
    ], exports.Line.prototype, "curve", void 0);
    __decorate([
        pathType(false)
    ], exports.Line.prototype, "closed", void 0);
    exports.Line = __decorate([
        registerUI()
    ], exports.Line);

    const { sin: sin$1, cos: cos$1, PI: PI$1 } = Math;
    const { moveTo: moveTo$1, lineTo: lineTo$1, closePath: closePath$1, drawPoints } = PathCommandDataHelper;
    const line = exports.Line.prototype;
    exports.Polygon = class Polygon extends exports.UI {
        get __tag() { return 'Polygon'; }
        constructor(data) {
            super(data);
        }
        __updatePath() {
            const path = this.__.path = [];
            if (this.__.points) {
                drawPoints(path, this.__.points, false, true);
            }
            else {
                const { width, height, sides } = this.__;
                const rx = width / 2, ry = height / 2;
                moveTo$1(path, rx, 0);
                for (let i = 1; i < sides; i++) {
                    lineTo$1(path, rx + rx * sin$1((i * 2 * PI$1) / sides), ry - ry * cos$1((i * 2 * PI$1) / sides));
                }
            }
            closePath$1(path);
        }
        __updateRenderPath() { }
        __updateBoxBounds() { }
    };
    __decorate([
        dataProcessor(PolygonData)
    ], exports.Polygon.prototype, "__", void 0);
    __decorate([
        pathType(3)
    ], exports.Polygon.prototype, "sides", void 0);
    __decorate([
        pathType()
    ], exports.Polygon.prototype, "points", void 0);
    __decorate([
        pathType(0)
    ], exports.Polygon.prototype, "curve", void 0);
    __decorate([
        rewrite(line.__updateRenderPath)
    ], exports.Polygon.prototype, "__updateRenderPath", null);
    __decorate([
        rewrite(line.__updateBoxBounds)
    ], exports.Polygon.prototype, "__updateBoxBounds", null);
    exports.Polygon = __decorate([
        rewriteAble(),
        registerUI()
    ], exports.Polygon);

    const { sin, cos, PI } = Math;
    const { moveTo, lineTo, closePath } = PathCommandDataHelper;
    exports.Star = class Star extends exports.UI {
        get __tag() { return 'Star'; }
        constructor(data) {
            super(data);
        }
        __updatePath() {
            const { width, height, corners, innerRadius } = this.__;
            const rx = width / 2, ry = height / 2;
            const path = this.__.path = [];
            moveTo(path, rx, 0);
            for (let i = 1; i < corners * 2; i++) {
                lineTo(path, rx + (i % 2 === 0 ? rx : rx * innerRadius) * sin((i * PI) / corners), ry - (i % 2 === 0 ? ry : ry * innerRadius) * cos((i * PI) / corners));
            }
            closePath(path);
        }
    };
    __decorate([
        dataProcessor(StarData)
    ], exports.Star.prototype, "__", void 0);
    __decorate([
        pathType(5)
    ], exports.Star.prototype, "corners", void 0);
    __decorate([
        pathType(0.382)
    ], exports.Star.prototype, "innerRadius", void 0);
    exports.Star = __decorate([
        registerUI()
    ], exports.Star);

    exports.Image = class Image extends exports.Rect {
        get __tag() { return 'Image'; }
        get ready() { return this.image ? this.image.ready : false; }
        constructor(data) {
            super(data);
            this.on(ImageEvent.LOADED, (e) => {
                if (e.attrName === 'fill' && e.attrValue.url === this.url)
                    this.image = e.image;
            });
        }
        destroy() {
            this.image = null;
            super.destroy();
        }
    };
    __decorate([
        dataProcessor(ImageData)
    ], exports.Image.prototype, "__", void 0);
    __decorate([
        boundsType('')
    ], exports.Image.prototype, "url", void 0);
    exports.Image = __decorate([
        registerUI()
    ], exports.Image);
    const MyImage = exports.Image;

    exports.Canvas = class Canvas extends exports.Rect {
        get __tag() { return 'Canvas'; }
        get ready() { return !this.url; }
        constructor(data) {
            super(data);
            this.canvas = Creator.canvas(this.__);
            this.context = this.canvas.context;
            if (data && data.url)
                this.drawImage(data.url);
        }
        drawImage(url) {
            new LeaferImage({ url }).load((image) => {
                this.context.drawImage(image.view, 0, 0);
                this.url = undefined;
                this.paint();
                this.emitEvent(new ImageEvent(ImageEvent.LOADED, { image }));
            });
        }
        draw(ui, offset, scale, rotation) {
            const matrix = new Matrix(ui.worldTransform).invert();
            const m = new Matrix();
            if (offset)
                m.translate(offset.x, offset.y);
            if (scale)
                typeof scale === 'number' ? m.scale(scale) : m.scale(scale.x, scale.y);
            if (rotation)
                m.rotate(rotation);
            matrix.multiplyParent(m);
            ui.__render(this.canvas, { matrix: matrix.withScale() });
            this.paint();
        }
        paint() {
            this.forceRender();
        }
        __drawContent(canvas, _options) {
            const { width, height } = this.__, { view } = this.canvas;
            canvas.drawImage(view, 0, 0, view.width, view.height, 0, 0, width, height);
        }
        __updateSize() {
            const { canvas } = this;
            if (canvas) {
                const { smooth } = this.__;
                if (canvas.smooth !== smooth)
                    canvas.smooth = smooth;
                canvas.resize(this.__);
            }
        }
        destroy() {
            if (this.canvas) {
                this.canvas.destroy();
                this.canvas = this.context = null;
            }
            super.destroy();
        }
    };
    __decorate([
        dataProcessor(CanvasData)
    ], exports.Canvas.prototype, "__", void 0);
    __decorate([
        resizeType(100)
    ], exports.Canvas.prototype, "width", void 0);
    __decorate([
        resizeType(100)
    ], exports.Canvas.prototype, "height", void 0);
    __decorate([
        resizeType(1)
    ], exports.Canvas.prototype, "pixelRatio", void 0);
    __decorate([
        resizeType(true)
    ], exports.Canvas.prototype, "smooth", void 0);
    __decorate([
        resizeType()
    ], exports.Canvas.prototype, "contextSettings", void 0);
    exports.Canvas = __decorate([
        registerUI()
    ], exports.Canvas);

    const { copyAndSpread, includes, isSame: isSame$1, spread, setList } = BoundsHelper;
    exports.Text = class Text extends exports.UI {
        get __tag() { return 'Text'; }
        get textDrawData() {
            this.__layout.update();
            return this.__.__textDrawData;
        }
        constructor(data) {
            super(data);
        }
        __drawHitPath(canvas) {
            const { __lineHeight, fontSize, __baseLine, __textDrawData: data } = this.__;
            canvas.beginPath();
            if (this.__.__letterSpacing < 0) {
                this.__drawPathByData(canvas);
            }
            else {
                data.rows.forEach(row => canvas.rect(row.x, row.y - __baseLine, row.width, __lineHeight < fontSize ? fontSize : __lineHeight));
            }
        }
        __drawPathByData(drawer, _data) {
            const { x, y, width, height } = this.__layout.boxBounds;
            drawer.rect(x, y, width, height);
        }
        __drawRenderPath(canvas) {
            canvas.font = this.__.__font;
        }
        __updateTextDrawData() {
            const data = this.__;
            const { lineHeight, letterSpacing, fontFamily, fontSize, fontWeight, italic, textCase, textOverflow, padding } = data;
            data.__lineHeight = UnitConvert.number(lineHeight, fontSize);
            data.__letterSpacing = UnitConvert.number(letterSpacing, fontSize);
            data.__padding = padding ? MathHelper.fourNumber(padding) : undefined;
            data.__baseLine = data.__lineHeight - (data.__lineHeight - fontSize * 0.7) / 2;
            data.__font = `${italic ? 'italic ' : ''}${textCase === 'small-caps' ? 'small-caps ' : ''}${fontWeight !== 'normal' ? fontWeight + ' ' : ''}${fontSize}px ${fontFamily}`;
            data.__clipText = textOverflow !== 'show' && !data.__autoSize;
            data.__textDrawData = TextConvert.getDrawData(data.text, this.__);
        }
        __updateBoxBounds() {
            const data = this.__;
            const layout = this.__layout;
            const { fontSize, italic, padding, __autoWidth: autoWidth, __autoHeight: autoHeight } = data;
            this.__updateTextDrawData();
            const { bounds } = data.__textDrawData;
            const b = layout.boxBounds;
            if (data.__lineHeight < fontSize)
                spread(bounds, fontSize / 2);
            if (autoWidth || autoHeight) {
                b.x = autoWidth ? bounds.x : 0;
                b.y = autoHeight ? bounds.y : 0;
                b.width = autoWidth ? bounds.width : data.width;
                b.height = autoHeight ? bounds.height : data.height;
                if (padding) {
                    const [top, right, bottom, left] = data.__padding;
                    if (autoWidth)
                        b.x -= left, b.width += (right + left);
                    if (autoHeight)
                        b.y -= top, b.height += (bottom + top);
                }
                this.__updateNaturalSize();
            }
            else
                super.__updateBoxBounds();
            if (italic)
                b.width += fontSize * 0.16;
            const contentBounds = includes(b, bounds) ? b : bounds;
            if (!isSame$1(contentBounds, layout.contentBounds)) {
                layout.contentBounds = contentBounds;
                layout.renderChanged = true;
                setList(data.__textBoxBounds = {}, [b, bounds]);
            }
            else
                data.__textBoxBounds = contentBounds;
        }
        __updateRenderSpread() {
            let width = super.__updateRenderSpread();
            if (!width)
                width = this.__layout.boxBounds === this.__layout.contentBounds ? 0 : 1;
            return width;
        }
        __updateRenderBounds() {
            copyAndSpread(this.__layout.renderBounds, this.__.__textBoxBounds, this.__layout.renderSpread);
        }
    };
    __decorate([
        dataProcessor(TextData)
    ], exports.Text.prototype, "__", void 0);
    __decorate([
        boundsType(0)
    ], exports.Text.prototype, "width", void 0);
    __decorate([
        boundsType(0)
    ], exports.Text.prototype, "height", void 0);
    __decorate([
        dataType(false)
    ], exports.Text.prototype, "resizeFontSize", void 0);
    __decorate([
        surfaceType('#000000')
    ], exports.Text.prototype, "fill", void 0);
    __decorate([
        affectStrokeBoundsType('outside')
    ], exports.Text.prototype, "strokeAlign", void 0);
    __decorate([
        hitType('all')
    ], exports.Text.prototype, "hitFill", void 0);
    __decorate([
        boundsType('')
    ], exports.Text.prototype, "text", void 0);
    __decorate([
        boundsType('L')
    ], exports.Text.prototype, "fontFamily", void 0);
    __decorate([
        boundsType(12)
    ], exports.Text.prototype, "fontSize", void 0);
    __decorate([
        boundsType('normal')
    ], exports.Text.prototype, "fontWeight", void 0);
    __decorate([
        boundsType(false)
    ], exports.Text.prototype, "italic", void 0);
    __decorate([
        boundsType('none')
    ], exports.Text.prototype, "textCase", void 0);
    __decorate([
        boundsType('none')
    ], exports.Text.prototype, "textDecoration", void 0);
    __decorate([
        boundsType(0)
    ], exports.Text.prototype, "letterSpacing", void 0);
    __decorate([
        boundsType({ type: 'percent', value: 1.5 })
    ], exports.Text.prototype, "lineHeight", void 0);
    __decorate([
        boundsType(0)
    ], exports.Text.prototype, "paraIndent", void 0);
    __decorate([
        boundsType(0)
    ], exports.Text.prototype, "paraSpacing", void 0);
    __decorate([
        boundsType('left')
    ], exports.Text.prototype, "textAlign", void 0);
    __decorate([
        boundsType('top')
    ], exports.Text.prototype, "verticalAlign", void 0);
    __decorate([
        boundsType(true)
    ], exports.Text.prototype, "autoSizeAlign", void 0);
    __decorate([
        boundsType('normal')
    ], exports.Text.prototype, "textWrap", void 0);
    __decorate([
        boundsType('show')
    ], exports.Text.prototype, "textOverflow", void 0);
    exports.Text = __decorate([
        registerUI()
    ], exports.Text);

    exports.Path = class Path extends exports.UI {
        get __tag() { return 'Path'; }
        constructor(data) {
            super(data);
        }
    };
    __decorate([
        dataProcessor(PathData)
    ], exports.Path.prototype, "__", void 0);
    __decorate([
        affectStrokeBoundsType('center')
    ], exports.Path.prototype, "strokeAlign", void 0);
    exports.Path = __decorate([
        registerUI()
    ], exports.Path);

    exports.Pen = class Pen extends exports.Group {
        get __tag() { return 'Pen'; }
        constructor(data) {
            super(data);
        }
        setStyle(data) {
            const path = this.pathElement = new exports.Path(data);
            this.pathStyle = data;
            this.__path = path.path || (path.path = []);
            this.add(path);
            return this;
        }
        beginPath() { return this; }
        moveTo(_x, _y) { return this; }
        lineTo(_x, _y) { return this; }
        bezierCurveTo(_x1, _y1, _x2, _y2, _x, _y) { return this; }
        quadraticCurveTo(_x1, _y1, _x, _y) { return this; }
        closePath() { return this; }
        rect(_x, _y, _width, _height) { return this; }
        roundRect(_x, _y, _width, _height, _cornerRadius) { return this; }
        ellipse(_x, _y, _radiusX, _radiusY, _rotation, _startAngle, _endAngle, _anticlockwise) { return this; }
        arc(_x, _y, _radius, _startAngle, _endAngle, _anticlockwise) { return this; }
        arcTo(_x1, _y1, _x2, _y2, _radius) { return this; }
        drawEllipse(_x, _y, _radiusX, _radiusY, _rotation, _startAngle, _endAngle, _anticlockwise) { return this; }
        drawArc(_x, _y, _radius, _startAngle, _endAngle, _anticlockwise) { return this; }
        drawPoints(_points, _curve, _close) { return this; }
        clearPath() { return this; }
        paint() {
            if (!this.pathElement.__layout.boxChanged)
                this.pathElement.forceUpdate('path');
        }
    };
    __decorate([
        dataProcessor(PenData)
    ], exports.Pen.prototype, "__", void 0);
    __decorate([
        penPathType()
    ], exports.Pen.prototype, "path", void 0);
    exports.Pen = __decorate([
        useModule(PathCreator, ['set', 'path', 'paint']),
        registerUI()
    ], exports.Pen);
    function penPathType() {
        return (target, key) => {
            defineKey(target, key, {
                get() { return this.__path; }
            });
        };
    }

    exports.App = class App extends exports.Leafer {
        get __tag() { return 'App'; }
        get isApp() { return true; }
        constructor(userConfig, data) {
            super(userConfig, data);
        }
        init(userConfig, parentApp) {
            super.init(userConfig, parentApp);
            if (userConfig) {
                const { ground, tree, sky, editor } = userConfig;
                if (ground)
                    this.ground = this.addLeafer(ground);
                if (tree || editor)
                    this.tree = this.addLeafer(tree);
                if (sky || editor)
                    this.sky = this.addLeafer(sky || { type: 'draw', usePartRender: false });
                if (editor)
                    this.sky.add(this.editor = Creator.editor(editor));
            }
        }
        __setApp() {
            const { canvas } = this;
            const { realCanvas, view } = this.config;
            if (realCanvas || view === this.canvas.view || !canvas.parentView)
                this.realCanvas = true;
            else
                canvas.unrealCanvas();
            this.leafer = this;
            this.watcher.disable();
            this.layouter.disable();
            this.__eventIds.push(this.on_(PropertyEvent.CHANGE, this.__onPropertyChange, this));
        }
        start() {
            super.start();
            this.children.forEach(leafer => leafer.start());
        }
        stop() {
            this.children.forEach(leafer => leafer.stop());
            super.stop();
        }
        unlockLayout() {
            super.unlockLayout();
            this.children.forEach(leafer => leafer.unlockLayout());
        }
        lockLayout() {
            super.lockLayout();
            this.children.forEach(leafer => leafer.lockLayout());
        }
        forceRender(bounds) {
            this.children.forEach(leafer => leafer.forceRender(bounds));
        }
        addLeafer(merge) {
            const leafer = new exports.Leafer(merge);
            this.add(leafer);
            return leafer;
        }
        add(leafer, index) {
            if (!leafer.view) {
                if (this.realCanvas && !this.canvas.bounds) {
                    setTimeout(() => this.add(leafer, index), 10);
                    return;
                }
                leafer.init(this.__getChildConfig(leafer.userConfig), this);
            }
            super.add(leafer, index);
            if (index !== undefined)
                leafer.canvas.childIndex = index;
            this.__listenChildEvents(leafer);
        }
        __onPropertyChange() {
            if (Debug.showHitView)
                this.children.forEach(leafer => leafer.forceUpdate('surface'));
        }
        __onCreated() {
            this.created = this.children.every(child => child.created);
        }
        __onReady() {
            if (this.children.every(child => child.ready))
                super.__onReady();
        }
        __onViewReady() {
            if (this.children.every(child => child.viewReady))
                super.__onViewReady();
        }
        __onChildRenderEnd(e) {
            this.renderer.addBlock(e.renderBounds);
            if (this.viewReady)
                this.renderer.update();
        }
        __render(canvas, options) {
            if (canvas.context) {
                const m = options.matrix;
                if (m)
                    canvas.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);
                this.children.forEach(leafer => canvas.copyWorld(leafer.canvas));
            }
        }
        __onResize(event) {
            this.children.forEach(leafer => leafer.resize(event));
            super.__onResize(event);
        }
        __checkUpdateLayout() {
            this.children.forEach(leafer => leafer.__layout.update());
        }
        __getChildConfig(userConfig) {
            let config = Object.assign({}, this.config);
            config.hittable = config.realCanvas = undefined;
            if (userConfig)
                DataHelper.assign(config, userConfig);
            if (this.autoLayout)
                DataHelper.copyAttrs(config, this, canvasSizeAttrs);
            config.view = this.realCanvas ? undefined : this.view;
            config.fill = undefined;
            return config;
        }
        __listenChildEvents(leafer) {
            leafer.once(LayoutEvent.END, () => this.__onReady());
            leafer.once(RenderEvent.START, () => this.__onCreated());
            leafer.once(RenderEvent.END, () => this.__onViewReady());
            if (this.realCanvas)
                this.__eventIds.push(leafer.on_(RenderEvent.END, this.__onChildRenderEnd, this));
        }
    };
    exports.App = __decorate([
        registerUI()
    ], exports.App);

    const downKeyMap = {};
    const Keyboard = {
        isHoldSpaceKey() {
            return Keyboard.isHold('Space');
        },
        isHold(code) {
            return downKeyMap[code];
        },
        setDownCode(code) {
            if (!downKeyMap[code])
                downKeyMap[code] = true;
        },
        setUpCode(code) {
            downKeyMap[code] = false;
        }
    };

    const PointerButton = {
        LEFT: 1,
        RIGHT: 2,
        MIDDLE: 4,
        defaultLeft(event) { if (!event.buttons)
            event.buttons = 1; },
        left(event) { return event.buttons === 1; },
        right(event) { return event.buttons === 2; },
        middle(event) { return event.buttons === 4; }
    };

    class UIEvent extends Event {
        get spaceKey() { return Keyboard.isHoldSpaceKey(); }
        get left() { return PointerButton.left(this); }
        get right() { return PointerButton.right(this); }
        get middle() { return PointerButton.middle(this); }
        constructor(params) {
            super(params.type);
            this.bubbles = true;
            Object.assign(this, params);
        }
        getBoxPoint(relative) {
            if (!relative)
                relative = this.current;
            return relative.getBoxPoint(this);
        }
        getInnerPoint(relative) {
            if (!relative)
                relative = this.current;
            return relative.getInnerPoint(this);
        }
        getLocalPoint(relative) {
            if (!relative)
                relative = this.current;
            return relative.getLocalPoint(this);
        }
        getPagePoint() {
            return this.current.getPagePoint(this);
        }
        getInner(relative) { return this.getInnerPoint(relative); }
        getLocal(relative) { return this.getLocalPoint(relative); }
        getPage() { return this.getPagePoint(); }
        static changeName(oldName, newName) {
            EventCreator.changeName(oldName, newName);
        }
    }

    exports.PointerEvent = class PointerEvent extends UIEvent {
    };
    exports.PointerEvent.POINTER = 'pointer';
    exports.PointerEvent.BEFORE_DOWN = 'pointer.before_down';
    exports.PointerEvent.BEFORE_MOVE = 'pointer.before_move';
    exports.PointerEvent.BEFORE_UP = 'pointer.before_up';
    exports.PointerEvent.DOWN = 'pointer.down';
    exports.PointerEvent.MOVE = 'pointer.move';
    exports.PointerEvent.UP = 'pointer.up';
    exports.PointerEvent.OVER = 'pointer.over';
    exports.PointerEvent.OUT = 'pointer.out';
    exports.PointerEvent.ENTER = 'pointer.enter';
    exports.PointerEvent.LEAVE = 'pointer.leave';
    exports.PointerEvent.TAP = 'tap';
    exports.PointerEvent.DOUBLE_TAP = 'double_tap';
    exports.PointerEvent.CLICK = 'click';
    exports.PointerEvent.DOUBLE_CLICK = 'double_click';
    exports.PointerEvent.LONG_PRESS = 'long_press';
    exports.PointerEvent.LONG_TAP = 'long_tap';
    exports.PointerEvent.MENU = 'pointer.menu';
    exports.PointerEvent.MENU_TAP = 'pointer.menu_tap';
    exports.PointerEvent = __decorate([
        registerUIEvent()
    ], exports.PointerEvent);
    const MyPointerEvent = exports.PointerEvent;

    const tempMove = {};
    exports.DragEvent = class DragEvent extends exports.PointerEvent {
        static setList(data) {
            this.list = data instanceof LeafList ? data : new LeafList(data);
        }
        static setData(data) {
            this.data = data;
        }
        static getValidMove(leaf, start, total) {
            const { draggable, dragBounds, x, y } = leaf;
            const move = leaf.getLocalPoint(total, null, true);
            move.x += start.x - x;
            move.y += start.y - y;
            if (dragBounds)
                this.getMoveInDragBounds(leaf.__local, dragBounds === 'parent' ? leaf.parent.boxBounds : dragBounds, move, true);
            if (draggable === 'x')
                move.y = 0;
            if (draggable === 'y')
                move.x = 0;
            return move;
        }
        static getMoveInDragBounds(childBox, dragBounds, move, change) {
            const x = childBox.x + move.x, y = childBox.y + move.y;
            const right = x + childBox.width, bottom = y + childBox.height;
            const boundsRight = dragBounds.x + dragBounds.width, boundsBottom = dragBounds.y + dragBounds.height;
            if (!change)
                move = Object.assign({}, move);
            if (BoundsHelper.includes(childBox, dragBounds)) {
                if (x > dragBounds.x)
                    move.x += dragBounds.x - x;
                else if (right < boundsRight)
                    move.x += boundsRight - right;
                if (y > dragBounds.y)
                    move.y += dragBounds.y - y;
                else if (bottom < boundsBottom)
                    move.y += boundsBottom - bottom;
            }
            else {
                if (x < dragBounds.x)
                    move.x += dragBounds.x - x;
                else if (right > boundsRight)
                    move.x += boundsRight - right;
                if (y < dragBounds.y)
                    move.y += dragBounds.y - y;
                else if (bottom > boundsBottom)
                    move.y += boundsBottom - bottom;
            }
            return move;
        }
        getPageMove(total) {
            this.assignMove(total);
            return this.current.getPagePoint(tempMove, null, true);
        }
        getInnerMove(relative, total) {
            if (!relative)
                relative = this.current;
            this.assignMove(total);
            return relative.getInnerPoint(tempMove, null, true);
        }
        getLocalMove(relative, total) {
            if (!relative)
                relative = this.current;
            this.assignMove(total);
            return relative.getLocalPoint(tempMove, null, true);
        }
        getPageTotal() {
            return this.getPageMove(true);
        }
        getInnerTotal(relative) {
            return this.getInnerMove(relative, true);
        }
        getLocalTotal(relative) {
            return this.getLocalMove(relative, true);
        }
        getPageBounds() {
            const total = this.getPageTotal();
            const start = this.getPagePoint();
            const bounds = {};
            BoundsHelper.set(bounds, start.x - total.x, start.y - total.y, total.x, total.y);
            BoundsHelper.unsign(bounds);
            return bounds;
        }
        assignMove(total) {
            tempMove.x = total ? this.totalX : this.moveX;
            tempMove.y = total ? this.totalY : this.moveY;
        }
    };
    exports.DragEvent.BEFORE_DRAG = 'drag.before_drag';
    exports.DragEvent.START = 'drag.start';
    exports.DragEvent.DRAG = 'drag';
    exports.DragEvent.END = 'drag.end';
    exports.DragEvent.OVER = 'drag.over';
    exports.DragEvent.OUT = 'drag.out';
    exports.DragEvent.ENTER = 'drag.enter';
    exports.DragEvent.LEAVE = 'drag.leave';
    exports.DragEvent = __decorate([
        registerUIEvent()
    ], exports.DragEvent);
    const MyDragEvent = exports.DragEvent;

    exports.DropEvent = class DropEvent extends exports.PointerEvent {
        static setList(data) {
            exports.DragEvent.setList(data);
        }
        static setData(data) {
            exports.DragEvent.setData(data);
        }
    };
    exports.DropEvent.DROP = 'drop';
    exports.DropEvent = __decorate([
        registerUIEvent()
    ], exports.DropEvent);

    exports.MoveEvent = class MoveEvent extends exports.DragEvent {
    };
    exports.MoveEvent.BEFORE_MOVE = 'move.before_move';
    exports.MoveEvent.START = 'move.start';
    exports.MoveEvent.MOVE = 'move';
    exports.MoveEvent.END = 'move.end';
    exports.MoveEvent = __decorate([
        registerUIEvent()
    ], exports.MoveEvent);

    exports.RotateEvent = class RotateEvent extends UIEvent {
    };
    exports.RotateEvent.BEFORE_ROTATE = 'rotate.before_rotate';
    exports.RotateEvent.START = 'rotate.start';
    exports.RotateEvent.ROTATE = 'rotate';
    exports.RotateEvent.END = 'rotate.end';
    exports.RotateEvent = __decorate([
        registerUIEvent()
    ], exports.RotateEvent);

    exports.SwipeEvent = class SwipeEvent extends exports.DragEvent {
    };
    exports.SwipeEvent.SWIPE = 'swipe';
    exports.SwipeEvent.LEFT = 'swipe.left';
    exports.SwipeEvent.RIGHT = 'swipe.right';
    exports.SwipeEvent.UP = 'swipe.up';
    exports.SwipeEvent.DOWN = 'swipe.down';
    exports.SwipeEvent = __decorate([
        registerUIEvent()
    ], exports.SwipeEvent);

    exports.ZoomEvent = class ZoomEvent extends UIEvent {
    };
    exports.ZoomEvent.BEFORE_ZOOM = 'zoom.before_zoom';
    exports.ZoomEvent.START = 'zoom.start';
    exports.ZoomEvent.ZOOM = 'zoom';
    exports.ZoomEvent.END = 'zoom.end';
    exports.ZoomEvent = __decorate([
        registerUIEvent()
    ], exports.ZoomEvent);

    exports.KeyEvent = class KeyEvent extends UIEvent {
    };
    exports.KeyEvent.DOWN = 'key.down';
    exports.KeyEvent.HOLD = 'key.hold';
    exports.KeyEvent.UP = 'key.up';
    exports.KeyEvent = __decorate([
        registerUIEvent()
    ], exports.KeyEvent);

    function addInteractionWindow(leafer) {
        if (leafer.isApp)
            return;
        leafer.__eventIds.push(leafer.on_(exports.MoveEvent.BEFORE_MOVE, (e) => {
            leafer.zoomLayer.move(leafer.getValidMove(e.moveX, e.moveY));
        }), leafer.on_(exports.ZoomEvent.BEFORE_ZOOM, (e) => {
            const { zoomLayer } = leafer;
            const changeScale = leafer.getValidScale(e.scale);
            if (changeScale !== 1) {
                PointHelper.scaleOf(zoomLayer, e, changeScale);
                zoomLayer.scale = zoomLayer.__.scaleX * changeScale;
            }
        }));
    }

    function document$1(leafer) {
        addInteractionWindow(leafer);
        const { move, zoom } = leafer.config;
        move.scroll = 'limit';
        zoom.min = 1;
    }

    function block(leafer) {
        const { config } = leafer;
        (config.wheel || (config.wheel = {})).preventDefault = false;
        (config.touch || (config.touch = {})).preventDefault = 'auto';
    }

    const debug$2 = Debug.get('LeaferTypeCreator');
    const LeaferTypeCreator = {
        list: {},
        register(name, fn) {
            list[name] ? debug$2.repeat(name) : list[name] = fn;
        },
        run(name, leafer) {
            const fn = list[name];
            fn && fn(leafer);
        }
    };
    const { list, register } = LeaferTypeCreator;
    register('design', addInteractionWindow);
    register('document', document$1);
    register('block', block);

    const leafer = exports.Leafer.prototype;
    leafer.initType = function (type) {
        LeaferTypeCreator.run(type, this);
    };
    leafer.getValidMove = function (moveX, moveY) {
        const { scroll, disabled } = this.app.config.move;
        if (scroll) {
            Math.abs(moveX) > Math.abs(moveY) ? moveY = 0 : moveX = 0;
            if (scroll === 'limit') {
                const { x, y, width, height } = new Bounds(this.__world).addPoint(this.zoomLayer);
                const right = x + width - this.width, bottom = y + height - this.height;
                if (x >= 0 && right <= 0)
                    moveX = 0;
                else if (moveX > 0) {
                    if (x + moveX > 0)
                        moveX = -x;
                }
                else if (moveX < 0 && right + moveX < 0)
                    moveX = -right;
                if (y >= 0 && bottom <= 0)
                    moveY = 0;
                else if (moveY > 0) {
                    if (y + moveY > 0)
                        moveY = -y;
                }
                else if (moveY < 0 && bottom + moveY < 0)
                    moveY = -bottom;
            }
        }
        return { x: disabled ? 0 : moveX, y: disabled ? 0 : moveY };
    };
    leafer.getValidScale = function (changeScale) {
        const { scaleX } = this.zoomLayer.__, { min, max, disabled } = this.app.config.zoom, absScale = Math.abs(scaleX * changeScale);
        if (absScale < min)
            changeScale = min / scaleX;
        else if (absScale > max)
            changeScale = max / scaleX;
        return disabled ? 1 : changeScale;
    };

    class Transformer {
        get transforming() { return !!(this.moveData || this.zoomData || this.rotateData); }
        constructor(interaction) {
            this.interaction = interaction;
        }
        move(data) {
            const { interaction } = this;
            if (!data.moveType)
                data.moveType = 'move';
            if (!this.moveData) {
                const { path } = interaction.selector.getByPoint(data, interaction.hitRadius);
                data.path = path;
                this.moveData = Object.assign(Object.assign({}, data), { moveX: 0, moveY: 0 });
                interaction.cancelHover();
                interaction.emit(exports.MoveEvent.START, this.moveData);
            }
            data.path = this.moveData.path;
            interaction.emit(exports.MoveEvent.BEFORE_MOVE, data);
            interaction.emit(exports.MoveEvent.MOVE, data);
            this.transformEndWait();
        }
        zoom(data) {
            const { interaction } = this;
            if (!this.zoomData) {
                const { path } = interaction.selector.getByPoint(data, interaction.hitRadius);
                data.path = path;
                this.zoomData = Object.assign(Object.assign({}, data), { scale: 1 });
                interaction.cancelHover();
                interaction.emit(exports.ZoomEvent.START, this.zoomData);
            }
            data.path = this.zoomData.path;
            interaction.emit(exports.ZoomEvent.BEFORE_ZOOM, data);
            interaction.emit(exports.ZoomEvent.ZOOM, data);
            this.transformEndWait();
        }
        rotate(data) {
            const { interaction } = this;
            if (!this.rotateData) {
                const { path } = interaction.selector.getByPoint(data, interaction.hitRadius);
                data.path = path;
                this.rotateData = Object.assign(Object.assign({}, data), { rotation: 0 });
                interaction.cancelHover();
                interaction.emit(exports.RotateEvent.START, this.rotateData);
            }
            data.path = this.rotateData.path;
            interaction.emit(exports.RotateEvent.BEFORE_ROTATE, data);
            interaction.emit(exports.RotateEvent.ROTATE, data);
            this.transformEndWait();
        }
        transformEndWait() {
            clearTimeout(this.transformTimer);
            this.transformTimer = setTimeout(() => {
                this.transformEnd();
            }, this.interaction.config.pointer.transformTime);
        }
        transformEnd() {
            this.moveEnd();
            this.zoomEnd();
            this.rotateEnd();
        }
        moveEnd() {
            if (this.moveData) {
                this.interaction.emit(exports.MoveEvent.END, this.moveData);
                this.moveData = null;
            }
        }
        zoomEnd() {
            if (this.zoomData) {
                this.interaction.emit(exports.ZoomEvent.END, this.zoomData);
                this.zoomData = null;
            }
        }
        rotateEnd() {
            if (this.rotateData) {
                this.interaction.emit(exports.RotateEvent.END, this.rotateData);
                this.rotateData = null;
            }
        }
        destroy() {
            this.zoomData = this.moveData = this.rotateData = null;
        }
    }

    const InteractionHelper = {
        getMoveEventData(center, move, event) {
            return Object.assign(Object.assign({}, event), { x: center.x, y: center.y, moveX: move.x, moveY: move.y });
        },
        getRotateEventData(center, angle, event) {
            return Object.assign(Object.assign({}, event), { x: center.x, y: center.y, rotation: angle });
        },
        getZoomEventData(center, scale, event) {
            return Object.assign(Object.assign({}, event), { x: center.x, y: center.y, scale });
        },
        getDragEventData(startPoint, lastPoint, event) {
            return Object.assign(Object.assign({}, event), { x: event.x, y: event.y, moveX: event.x - lastPoint.x, moveY: event.y - lastPoint.y, totalX: event.x - startPoint.x, totalY: event.y - startPoint.y });
        },
        getDropEventData(event, list, data) {
            return Object.assign(Object.assign({}, event), { list,
                data });
        },
        getSwipeDirection(angle) {
            if (angle < -45 && angle > -135) {
                return exports.SwipeEvent.UP;
            }
            else if (angle > 45 && angle < 135) {
                return exports.SwipeEvent.DOWN;
            }
            else if (angle <= 45 && angle >= -45) {
                return exports.SwipeEvent.RIGHT;
            }
            else {
                return exports.SwipeEvent.LEFT;
            }
        },
        getSwipeEventData(startPoint, lastDragData, event) {
            return Object.assign(Object.assign({}, event), { moveX: lastDragData.moveX, moveY: lastDragData.moveY, totalX: event.x - startPoint.x, totalY: event.y - startPoint.y, type: I.getSwipeDirection(PointHelper.getAngle(startPoint, event)) });
        },
        getBase(e) {
            const pointerUpButtons = e.button === 1 ? 4 : e.button;
            return {
                altKey: e.altKey,
                ctrlKey: e.ctrlKey,
                shiftKey: e.shiftKey,
                metaKey: e.metaKey,
                buttons: e.buttons === undefined ? 1 : (e.buttons === 0 ? pointerUpButtons : e.buttons),
                origin: e
            };
        },
        pathHasEventType(path, type) {
            const { list } = path;
            for (let i = 0, len = list.length; i < len; i++) {
                if (list[i].hasEvent(type))
                    return true;
            }
            return false;
        },
        filterPathByEventType(path, type) {
            const find = new LeafList();
            const { list } = path;
            for (let i = 0, len = list.length; i < len; i++) {
                if (list[i].hasEvent(type))
                    find.add(list[i]);
            }
            return find;
        },
        pathCanDrag(path) {
            return path && path.list.some(item => item.draggable || item.editable || (!item.isLeafer && item.hasEvent(exports.DragEvent.DRAG)));
        },
        pathHasOutside(path) {
            return path && path.list.some(item => item.isOutside);
        },
    };
    const I = InteractionHelper;

    const emptyList = new LeafList();
    const { getDragEventData, getDropEventData, getSwipeEventData } = InteractionHelper;
    class Dragger {
        constructor(interaction) {
            this.interaction = interaction;
        }
        setDragData(data) {
            if (this.animateWait)
                this.dragEndReal();
            this.downData = this.interaction.downData;
            this.dragData = getDragEventData(data, data, data);
            this.canAnimate = this.canDragOut = true;
        }
        getList(realDraggable, hover) {
            const { proxy } = this.interaction.selector;
            const hasProxyList = proxy && proxy.list.length, dragList = exports.DragEvent.list || this.draggableList || emptyList;
            return this.dragging && (hasProxyList ? (realDraggable ? emptyList : new LeafList(hover ? [...proxy.list, ...proxy.dragHoverExclude] : proxy.list)) : dragList);
        }
        checkDrag(data, canDrag) {
            const { interaction } = this;
            if (this.moving && data.buttons < 1) {
                this.canAnimate = false;
                interaction.pointerCancel();
                return;
            }
            if (!this.moving && canDrag) {
                if (this.moving = interaction.canMove(this.downData) || interaction.isHoldRightKey || interaction.isMobileDragEmpty) {
                    this.dragData.moveType = 'drag';
                    interaction.emit(exports.MoveEvent.START, this.dragData);
                }
            }
            if (!this.moving) {
                this.dragStart(data, canDrag);
            }
            this.drag(data);
        }
        dragStart(data, canDrag) {
            if (!this.dragging) {
                this.dragging = canDrag && PointerButton.left(data);
                if (this.dragging) {
                    this.interaction.emit(exports.DragEvent.START, this.dragData);
                    this.getDraggableList(this.dragData.path);
                    this.setDragStartPoints(this.realDraggableList = this.getList(true));
                }
            }
        }
        setDragStartPoints(list) {
            this.dragStartPoints = {};
            list.forEach(leaf => this.dragStartPoints[leaf.innerId] = { x: leaf.x, y: leaf.y });
        }
        getDraggableList(path) {
            let leaf;
            for (let i = 0, len = path.length; i < len; i++) {
                leaf = path.list[i];
                if ((leaf.draggable || leaf.editable) && leaf.hitSelf && !leaf.locked) {
                    this.draggableList = new LeafList(leaf);
                    break;
                }
            }
        }
        drag(data) {
            const { interaction, dragData, downData } = this;
            const { path, throughPath } = downData;
            this.dragData = getDragEventData(downData, dragData, data);
            if (throughPath)
                this.dragData.throughPath = throughPath;
            this.dragData.path = path;
            if (this.moving) {
                this.dragData.moveType = 'drag';
                interaction.emit(exports.MoveEvent.BEFORE_MOVE, this.dragData);
                interaction.emit(exports.MoveEvent.MOVE, this.dragData);
            }
            else if (this.dragging) {
                this.dragReal();
                interaction.emit(exports.DragEvent.BEFORE_DRAG, this.dragData);
                interaction.emit(exports.DragEvent.DRAG, this.dragData);
            }
        }
        dragReal() {
            const { running } = this.interaction;
            const list = this.realDraggableList;
            if (list.length && running) {
                const { totalX, totalY } = this.dragData;
                list.forEach(leaf => leaf.draggable && leaf.move(exports.DragEvent.getValidMove(leaf, this.dragStartPoints[leaf.innerId], { x: totalX, y: totalY })));
            }
        }
        dragOverOrOut(data) {
            const { interaction } = this;
            const { dragOverPath } = this;
            const { path } = data;
            this.dragOverPath = path;
            if (dragOverPath) {
                if (path.indexAt(0) !== dragOverPath.indexAt(0)) {
                    interaction.emit(exports.DragEvent.OUT, data, dragOverPath);
                    interaction.emit(exports.DragEvent.OVER, data, path);
                }
            }
            else
                interaction.emit(exports.DragEvent.OVER, data, path);
        }
        dragEnterOrLeave(data) {
            const { interaction } = this;
            const { dragEnterPath } = this;
            const { path } = data;
            interaction.emit(exports.DragEvent.LEAVE, data, dragEnterPath, path);
            interaction.emit(exports.DragEvent.ENTER, data, path, dragEnterPath);
            this.dragEnterPath = path;
        }
        dragEnd(data, speed) {
            if (!this.dragging && !this.moving)
                return;
            const { moveX, moveY } = this.dragData;
            if (this.interaction.config.move.dragAnimate && this.canAnimate && this.moving && (Math.abs(moveX) > 1 || Math.abs(moveY) > 1)) {
                data = Object.assign({}, data);
                speed = (speed || (data.pointerType === 'touch' ? 2 : 1)) * 0.9;
                PointHelper.move(data, moveX * speed, moveY * speed);
                this.drag(data);
                this.animate(() => { this.dragEnd(data, 1); });
            }
            else
                this.dragEndReal(data);
        }
        dragEndReal(data) {
            const { interaction, downData, dragData } = this;
            if (!data)
                data = dragData;
            const { path, throughPath } = downData;
            const endDragData = getDragEventData(downData, data, data);
            if (throughPath)
                endDragData.throughPath = throughPath;
            endDragData.path = path;
            if (this.moving) {
                this.moving = false;
                endDragData.moveType = 'drag';
                interaction.emit(exports.MoveEvent.END, endDragData);
            }
            if (this.dragging) {
                const dropList = this.getList();
                this.dragging = false;
                interaction.emit(exports.DragEvent.END, endDragData);
                this.swipe(data, downData, dragData, endDragData);
                this.drop(data, dropList, this.dragEnterPath);
            }
            this.autoMoveCancel();
            this.dragReset();
            this.animate(null, 'off');
        }
        animate(func, off) {
            const animateWait = func || this.animateWait;
            if (animateWait)
                this.interaction.target.nextRender(animateWait, null, off);
            this.animateWait = func;
        }
        swipe(data, downData, dragData, endDragData) {
            const { interaction } = this;
            if (PointHelper.getDistance(downData, data) > interaction.config.pointer.swipeDistance) {
                const swipeData = getSwipeEventData(downData, dragData, endDragData);
                this.interaction.emit(swipeData.type, swipeData);
            }
        }
        drop(data, dropList, dragEnterPath) {
            const dropData = getDropEventData(data, dropList, exports.DragEvent.data);
            dropData.path = dragEnterPath;
            this.interaction.emit(exports.DropEvent.DROP, dropData);
            this.interaction.emit(exports.DragEvent.LEAVE, data, dragEnterPath);
        }
        dragReset() {
            exports.DragEvent.list = exports.DragEvent.data = this.draggableList = this.dragData = this.downData = this.dragOverPath = this.dragEnterPath = null;
        }
        checkDragOut(data) {
            const { interaction } = this;
            this.autoMoveCancel();
            if (this.dragging && !interaction.shrinkCanvasBounds.hitPoint(data))
                this.autoMoveOnDragOut(data);
        }
        autoMoveOnDragOut(data) {
            const { interaction, downData, canDragOut } = this;
            const { autoDistance, dragOut } = interaction.config.move;
            if (!dragOut || !canDragOut || !autoDistance)
                return;
            const bounds = interaction.shrinkCanvasBounds;
            const { x, y } = bounds;
            const right = BoundsHelper.maxX(bounds);
            const bottom = BoundsHelper.maxY(bounds);
            const moveX = data.x < x ? autoDistance : (right < data.x ? -autoDistance : 0);
            const moveY = data.y < y ? autoDistance : (bottom < data.y ? -autoDistance : 0);
            let totalX = 0, totalY = 0;
            this.autoMoveTimer = setInterval(() => {
                totalX += moveX;
                totalY += moveY;
                PointHelper.move(downData, moveX, moveY);
                PointHelper.move(this.dragData, moveX, moveY);
                interaction.move(Object.assign(Object.assign({}, data), { moveX, moveY, totalX, totalY, moveType: 'drag' }));
                interaction.pointerMoveReal(data);
            }, 10);
        }
        autoMoveCancel() {
            if (this.autoMoveTimer) {
                clearInterval(this.autoMoveTimer);
                this.autoMoveTimer = 0;
            }
        }
        destroy() {
            this.dragReset();
        }
    }

    const debug$1 = Debug.get('emit');
    function emit$1(type, data, path, excludePath) {
        if (!path && !data.path)
            return;
        let leaf;
        data.type = type;
        if (path) {
            data = Object.assign(Object.assign({}, data), { path });
        }
        else {
            path = data.path;
        }
        data.target = path.indexAt(0);
        try {
            for (let i = path.length - 1; i > -1; i--) {
                leaf = path.list[i];
                if (emitEvent(leaf, type, data, true, excludePath))
                    return;
                if (leaf.isApp)
                    emitAppChildren(leaf, type, data, true, excludePath);
            }
            for (let i = 0, len = path.length; i < len; i++) {
                leaf = path.list[i];
                if (leaf.isApp)
                    emitAppChildren(leaf, type, data, false, excludePath);
                if (emitEvent(leaf, type, data, false, excludePath))
                    return;
            }
        }
        catch (e) {
            debug$1.error(e);
        }
    }
    const allowTypes = ['move', 'zoom', 'rotate', 'key'];
    function emitAppChildren(leaf, type, data, capture, excludePath) {
        if (allowTypes.some(name => type.startsWith(name)) && leaf.__.hitChildren && !exclude(leaf, excludePath)) {
            let child;
            for (let i = 0, len = leaf.children.length; i < len; i++) {
                child = leaf.children[i];
                if (!data.path.has(child) && child.__.hittable)
                    emitEvent(child, type, data, capture, excludePath);
            }
        }
    }
    function emitEvent(leaf, type, data, capture, excludePath) {
        if (leaf.destroyed)
            return false;
        if (leaf.__.hitSelf && !exclude(leaf, excludePath)) {
            if (State.updateEventStyle && !capture)
                State.updateEventStyle(leaf, type);
            if (leaf.hasEvent(type, capture)) {
                data.phase = capture ? 1 : ((leaf === data.target) ? 2 : 3);
                const event = EventCreator.get(type, data);
                leaf.emitEvent(event, capture);
                if (event.isStop)
                    return true;
            }
        }
        return false;
    }
    function exclude(leaf, excludePath) {
        return excludePath && excludePath.has(leaf);
    }

    const MultiTouchHelper = {
        getData(list) {
            const a = list[0];
            const b = list[1];
            const lastCenter = PointHelper.getCenter(a.from, b.from);
            const center = PointHelper.getCenter(a.to, b.to);
            const move = { x: center.x - lastCenter.x, y: center.y - lastCenter.y };
            const lastDistance = PointHelper.getDistance(a.from, b.from);
            const distance = PointHelper.getDistance(a.to, b.to);
            const scale = distance / lastDistance;
            const angle = PointHelper.getRotation(a.from, b.from, a.to, b.to);
            return { move, scale, angle, center };
        }
    };

    const config = {
        wheel: {
            zoomSpeed: 0.5,
            moveSpeed: 0.5,
            rotateSpeed: 0.5,
            delta: { x: 80 / 4, y: 8.0 },
            preventDefault: true
        },
        pointer: {
            hitRadius: 5,
            tapTime: 120,
            longPressTime: 800,
            transformTime: 500,
            hover: true,
            dragHover: true,
            dragDistance: 2,
            swipeDistance: 20,
            preventDefaultMenu: true
        },
        touch: {
            preventDefault: true
        },
        multiTouch: {},
        cursor: true,
        keyEvent: true
    };

    const { pathHasEventType, getMoveEventData: getMoveEventData$1, getZoomEventData: getZoomEventData$1, getRotateEventData: getRotateEventData$1, pathCanDrag: pathCanDrag$1, pathHasOutside } = InteractionHelper;
    class InteractionBase {
        get dragging() { return this.dragger.dragging; }
        get transforming() { return this.transformer.transforming; }
        get moveMode() { return this.m.drag === true || this.isHoldSpaceKey || this.isHoldMiddleKey || (this.isHoldRightKey && this.dragger.moving) || this.isDragEmpty; }
        get canHover() { return this.p.hover && !this.config.mobile; }
        get isDragEmpty() { return this.m.dragEmpty && this.isRootPath(this.hoverData) && (!this.downData || this.isRootPath(this.downData)); }
        get isMobileDragEmpty() { return this.m.dragEmpty && !this.canHover && this.downData && this.isTreePath(this.downData); }
        get isHoldMiddleKey() { return this.m.holdMiddleKey && this.downData && PointerButton.middle(this.downData); }
        get isHoldRightKey() { return this.m.holdRightKey && this.downData && PointerButton.right(this.downData); }
        get isHoldSpaceKey() { return this.m.holdSpaceKey && Keyboard.isHoldSpaceKey(); }
        get m() { return this.config.move; }
        get p() { return this.config.pointer; }
        get hitRadius() { return this.p.hitRadius; }
        constructor(target, canvas, selector, userConfig) {
            this.config = DataHelper.clone(config);
            this.tapCount = 0;
            this.downKeyMap = {};
            this.target = target;
            this.canvas = canvas;
            this.selector = selector;
            this.defaultPath = new LeafList(target);
            this.transformer = new Transformer(this);
            this.dragger = new Dragger(this);
            if (userConfig)
                this.config = DataHelper.default(userConfig, this.config);
            this.__listenEvents();
        }
        start() {
            this.running = true;
        }
        stop() {
            this.running = false;
        }
        receive(_event) { }
        pointerDown(data, useDefaultPath) {
            if (!data)
                data = this.hoverData;
            if (!data)
                return;
            PointerButton.defaultLeft(data);
            this.updateDownData(data);
            this.checkPath(data, useDefaultPath);
            this.downTime = Date.now();
            this.emit(exports.PointerEvent.BEFORE_DOWN, data);
            this.emit(exports.PointerEvent.DOWN, data);
            if (PointerButton.left(data)) {
                this.tapWait();
                this.longPressWait(data);
            }
            this.waitRightTap = PointerButton.right(data);
            this.dragger.setDragData(data);
            if (!this.isHoldRightKey)
                this.updateCursor(data);
        }
        pointerMove(data) {
            if (!data)
                data = this.hoverData;
            if (!data)
                return;
            const { downData } = this;
            if (downData)
                PointerButton.defaultLeft(data);
            const hit = this.canvas.bounds.hitPoint(data);
            if (hit || downData) {
                this.pointerMoveReal(data);
                if (downData)
                    this.dragger.checkDragOut(data);
            }
        }
        pointerMoveReal(data) {
            const { dragHover, dragDistance } = this.p;
            this.emit(exports.PointerEvent.BEFORE_MOVE, data, this.defaultPath);
            if (this.downData) {
                const canDrag = PointHelper.getDistance(this.downData, data) > dragDistance;
                if (canDrag) {
                    if (this.waitTap)
                        this.pointerWaitCancel();
                    this.waitRightTap = false;
                }
                this.dragger.checkDrag(data, canDrag);
            }
            if (!this.dragger.moving) {
                this.updateHoverData(data);
                this.checkPath(data);
                this.emit(exports.PointerEvent.MOVE, data);
                if (!(this.dragging && !dragHover))
                    this.pointerHover(data);
                if (this.dragger.dragging) {
                    this.dragger.dragOverOrOut(data);
                    this.dragger.dragEnterOrLeave(data);
                }
            }
            this.updateCursor(this.downData || data);
        }
        pointerUp(data) {
            const { downData } = this;
            if (!data)
                data = downData;
            if (!downData)
                return;
            PointerButton.defaultLeft(data);
            data.multiTouch = downData.multiTouch;
            this.findPath(data);
            const upData = Object.assign(Object.assign({}, data), { path: data.path.clone() });
            data.path.addList(downData.path.list);
            this.checkPath(data);
            this.downData = null;
            this.emit(exports.PointerEvent.BEFORE_UP, data);
            this.emit(exports.PointerEvent.UP, data);
            this.touchLeave(data);
            if (!data.isCancel) {
                this.tap(data);
                this.menuTap(data);
            }
            this.dragger.dragEnd(data);
            this.updateCursor(upData);
        }
        pointerCancel() {
            const data = Object.assign({}, this.dragger.dragData);
            data.isCancel = true;
            this.pointerUp(data);
        }
        multiTouch(data, list) {
            if (this.config.multiTouch.disabled)
                return;
            const { move, angle, scale, center } = MultiTouchHelper.getData(list);
            this.rotate(getRotateEventData$1(center, angle, data));
            this.zoom(getZoomEventData$1(center, scale, data));
            this.move(getMoveEventData$1(center, move, data));
        }
        menu(data) {
            this.findPath(data);
            this.emit(exports.PointerEvent.MENU, data);
            this.waitMenuTap = true;
            if (!this.downData && this.waitRightTap)
                this.menuTap(data);
        }
        menuTap(data) {
            if (this.waitRightTap && this.waitMenuTap) {
                this.emit(exports.PointerEvent.MENU_TAP, data);
                this.waitRightTap = this.waitMenuTap = false;
            }
        }
        move(data) {
            this.transformer.move(data);
        }
        zoom(data) {
            this.transformer.zoom(data);
        }
        rotate(data) {
            this.transformer.rotate(data);
        }
        transformEnd() {
            this.transformer.transformEnd();
        }
        keyDown(data) {
            if (!this.config.keyEvent)
                return;
            const { code } = data;
            if (!this.downKeyMap[code]) {
                this.downKeyMap[code] = true;
                Keyboard.setDownCode(code);
                this.emit(exports.KeyEvent.HOLD, data, this.defaultPath);
                if (this.moveMode) {
                    this.cancelHover();
                    this.updateCursor();
                }
            }
            this.emit(exports.KeyEvent.DOWN, data, this.defaultPath);
        }
        keyUp(data) {
            if (!this.config.keyEvent)
                return;
            const { code } = data;
            this.downKeyMap[code] = false;
            Keyboard.setUpCode(code);
            this.emit(exports.KeyEvent.UP, data, this.defaultPath);
            if (this.cursor === 'grab')
                this.updateCursor();
        }
        pointerHover(data) {
            if (this.canHover) {
                this.pointerOverOrOut(data);
                this.pointerEnterOrLeave(data);
            }
        }
        pointerOverOrOut(data) {
            const { path } = data;
            const { overPath } = this;
            this.overPath = path;
            if (overPath) {
                if (path.indexAt(0) !== overPath.indexAt(0)) {
                    this.emit(exports.PointerEvent.OUT, data, overPath);
                    this.emit(exports.PointerEvent.OVER, data, path);
                }
            }
            else {
                this.emit(exports.PointerEvent.OVER, data, path);
            }
        }
        pointerEnterOrLeave(data) {
            let { path } = data;
            if (this.downData && !this.moveMode) {
                path = path.clone();
                this.downData.path.forEach(leaf => path.add(leaf));
            }
            const { enterPath } = this;
            this.enterPath = path;
            this.emit(exports.PointerEvent.LEAVE, data, enterPath, path);
            this.emit(exports.PointerEvent.ENTER, data, path, enterPath);
        }
        touchLeave(data) {
            if (data.pointerType === 'touch') {
                if (this.enterPath) {
                    this.emit(exports.PointerEvent.LEAVE, data);
                    if (this.dragger.dragging)
                        this.emit(exports.DropEvent.LEAVE, data);
                }
            }
        }
        tap(data) {
            const { pointer } = this.config;
            const hasLong = this.longTap(data);
            if (!pointer.tapMore && hasLong)
                return;
            if (!this.waitTap)
                return;
            if (pointer.tapMore)
                this.emitTap(data);
            const useTime = Date.now() - this.downTime;
            const hasDouble = [exports.PointerEvent.DOUBLE_TAP, exports.PointerEvent.DOUBLE_CLICK].some(type => pathHasEventType(data.path, type));
            if (useTime < pointer.tapTime + 50 && hasDouble) {
                this.tapCount++;
                if (this.tapCount === 2) {
                    this.tapWaitCancel();
                    this.emitDoubleTap(data);
                }
                else {
                    clearTimeout(this.tapTimer);
                    this.tapTimer = setTimeout(() => {
                        if (!pointer.tapMore) {
                            this.tapWaitCancel();
                            this.emitTap(data);
                        }
                    }, pointer.tapTime);
                }
            }
            else {
                if (!pointer.tapMore) {
                    this.tapWaitCancel();
                    this.emitTap(data);
                }
            }
        }
        findPath(data, options) {
            const { hitRadius, through } = this.p;
            const { bottomList } = this;
            const find = this.selector.getByPoint(data, hitRadius, Object.assign({ bottomList, name: data.type }, (options || { through })));
            if (find.throughPath)
                data.throughPath = find.throughPath;
            data.path = find.path;
            return find.path;
        }
        isRootPath(data) {
            return data && data.path.list[0].isLeafer;
        }
        isTreePath(data) {
            const app = this.target.app;
            if (!app || !app.isApp)
                return false;
            return app.editor && (!data.path.has(app.editor) && data.path.has(app.tree) && !data.target.syncEventer);
        }
        checkPath(data, useDefaultPath) {
            if (useDefaultPath || (this.moveMode && !pathHasOutside(data.path)))
                data.path = this.defaultPath;
        }
        canMove(data) {
            return data && (this.moveMode || (this.m.drag === 'auto' && !pathCanDrag$1(data.path))) && !pathHasOutside(data.path);
        }
        isDrag(leaf) {
            return this.dragger.getList().has(leaf);
        }
        isPress(leaf) {
            return this.downData && this.downData.path.has(leaf);
        }
        isHover(leaf) {
            return this.enterPath && this.enterPath.has(leaf);
        }
        isFocus(leaf) {
            return this.focusData === leaf;
        }
        cancelHover() {
            const { hoverData } = this;
            if (hoverData) {
                hoverData.path = this.defaultPath;
                this.pointerHover(hoverData);
            }
        }
        updateDownData(data, options, merge) {
            const { downData } = this;
            if (!data && downData)
                data = downData;
            if (!data)
                return;
            this.findPath(data, options);
            if (merge && downData)
                data.path.addList(downData.path.list);
            this.downData = data;
        }
        updateHoverData(data) {
            if (!data)
                data = this.hoverData;
            if (!data)
                return;
            this.findPath(data, { exclude: this.dragger.getList(false, true), name: exports.PointerEvent.MOVE });
            this.hoverData = data;
        }
        updateCursor(data) {
            if (!this.config.cursor || !this.canHover)
                return;
            if (!data) {
                this.updateHoverData();
                data = this.downData || this.hoverData;
            }
            if (this.dragger.moving) {
                return this.setCursor('grabbing');
            }
            else if (this.canMove(data)) {
                return this.setCursor(this.downData ? 'grabbing' : 'grab');
            }
            else if (!data)
                return;
            let leaf, cursor;
            const { path } = data;
            for (let i = 0, len = path.length; i < len; i++) {
                leaf = path.list[i];
                cursor = (leaf.syncEventer && leaf.syncEventer.cursor) || leaf.cursor;
                if (cursor)
                    break;
            }
            this.setCursor(cursor);
        }
        setCursor(cursor) {
            this.cursor = cursor;
        }
        getLocal(clientPoint, updateClient) {
            const clientBounds = this.canvas.getClientBounds(updateClient);
            return { x: clientPoint.clientX - clientBounds.x, y: clientPoint.clientY - clientBounds.y };
        }
        emitTap(data) {
            this.emit(exports.PointerEvent.TAP, data);
            this.emit(exports.PointerEvent.CLICK, data);
        }
        emitDoubleTap(data) {
            this.emit(exports.PointerEvent.DOUBLE_TAP, data);
            this.emit(exports.PointerEvent.DOUBLE_CLICK, data);
        }
        pointerWaitCancel() {
            this.tapWaitCancel();
            this.longPressWaitCancel();
        }
        tapWait() {
            clearTimeout(this.tapTimer);
            this.waitTap = true;
        }
        tapWaitCancel() {
            clearTimeout(this.tapTimer);
            this.waitTap = false;
            this.tapCount = 0;
        }
        longPressWait(data) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = setTimeout(() => {
                this.longPressed = true;
                this.emit(exports.PointerEvent.LONG_PRESS, data);
            }, this.p.longPressTime);
        }
        longTap(data) {
            let hasLong;
            if (this.longPressed) {
                this.emit(exports.PointerEvent.LONG_TAP, data);
                if (pathHasEventType(data.path, exports.PointerEvent.LONG_TAP) || pathHasEventType(data.path, exports.PointerEvent.LONG_PRESS))
                    hasLong = true;
            }
            this.longPressWaitCancel();
            return hasLong;
        }
        longPressWaitCancel() {
            clearTimeout(this.longPressTimer);
            this.longPressed = false;
        }
        __onResize() {
            this.shrinkCanvasBounds = new Bounds(this.canvas.bounds);
            this.shrinkCanvasBounds.spread(-2);
        }
        __listenEvents() {
            const { target } = this;
            this.__eventIds = [target.on_(ResizeEvent.RESIZE, this.__onResize, this)];
            target.once(LeaferEvent.READY, () => this.__onResize());
        }
        __removeListenEvents() {
            this.target.off_(this.__eventIds);
            this.__eventIds.length = 0;
        }
        emit(type, data, path, excludePath) {
            if (this.running)
                emit$1(type, data, path, excludePath);
        }
        destroy() {
            if (this.__eventIds.length) {
                this.stop();
                this.__removeListenEvents();
                this.dragger.destroy();
                this.transformer.destroy();
                this.downData = this.overPath = this.enterPath = null;
            }
        }
    }

    class Cursor {
        static set(name, value) {
            this.custom[name] = value;
        }
        static get(name) {
            return this.custom[name];
        }
    }
    Cursor.custom = {};

    class HitCanvasManager extends CanvasManager {
        constructor() {
            super(...arguments);
            this.maxTotal = 1000;
            this.pathList = new LeafList();
            this.pixelList = new LeafList();
        }
        getPixelType(leaf, config) {
            this.__autoClear();
            this.pixelList.add(leaf);
            return Creator.hitCanvas(config);
        }
        getPathType(leaf) {
            this.__autoClear();
            this.pathList.add(leaf);
            return Creator.hitCanvas();
        }
        clearImageType() {
            this.__clearLeafList(this.pixelList);
        }
        clearPathType() {
            this.__clearLeafList(this.pathList);
        }
        __clearLeafList(leafList) {
            if (leafList.length) {
                leafList.forEach(leaf => {
                    if (leaf.__hitCanvas) {
                        leaf.__hitCanvas.destroy();
                        leaf.__hitCanvas = null;
                    }
                });
                leafList.reset();
            }
        }
        __autoClear() {
            if (this.pathList.length + this.pixelList.length > this.maxTotal)
                this.clear();
        }
        clear() {
            this.clearPathType();
            this.clearImageType();
        }
    }

    const { toInnerRadiusPointOf, copy: copy$2, setRadius } = PointHelper;
    const inner = {};
    const leaf = exports.Leaf.prototype;
    leaf.__hitWorld = function (point) {
        if (!this.__.hitSelf)
            return false;
        if (this.__.hitRadius) {
            copy$2(inner, point), point = inner;
            setRadius(point, this.__.hitRadius);
        }
        toInnerRadiusPointOf(point, this.__world, inner);
        const { width, height } = this.__world;
        const isSmall = width < 10 && height < 10;
        if (this.__.hitBox || isSmall) {
            if (BoundsHelper.hitRadiusPoint(this.__layout.boxBounds, inner))
                return true;
            if (isSmall)
                return false;
        }
        if (this.__layout.hitCanvasChanged || !this.__hitCanvas) {
            this.__updateHitCanvas();
            if (!this.__layout.boundsChanged)
                this.__layout.hitCanvasChanged = false;
        }
        return this.__hit(inner);
    };
    leaf.__hitFill = function (inner) { var _a; return (_a = this.__hitCanvas) === null || _a === void 0 ? void 0 : _a.hitFill(inner, this.__.windingRule); };
    leaf.__hitStroke = function (inner, strokeWidth) { var _a; return (_a = this.__hitCanvas) === null || _a === void 0 ? void 0 : _a.hitStroke(inner, strokeWidth); };
    leaf.__hitPixel = function (inner) { var _a; return (_a = this.__hitCanvas) === null || _a === void 0 ? void 0 : _a.hitPixel(inner, this.__layout.renderBounds, this.__hitCanvas.hitScale); };
    leaf.__drawHitPath = function (canvas) { if (canvas)
        this.__drawRenderPath(canvas); };

    const matrix = new Matrix();
    const ui$2 = exports.UI.prototype;
    ui$2.__updateHitCanvas = function () {
        const data = this.__, { hitCanvasManager } = this.leafer;
        const isHitPixelFill = (data.__pixelFill || data.__isCanvas) && data.hitFill === 'pixel';
        const isHitPixelStroke = data.__pixelStroke && data.hitStroke === 'pixel';
        const isHitPixel = isHitPixelFill || isHitPixelStroke;
        if (!this.__hitCanvas)
            this.__hitCanvas = isHitPixel ? hitCanvasManager.getPixelType(this, { contextSettings: { willReadFrequently: true } }) : hitCanvasManager.getPathType(this);
        const h = this.__hitCanvas;
        if (isHitPixel) {
            const { renderBounds } = this.__layout;
            const size = Platform.image.hitCanvasSize;
            const scale = h.hitScale = tempBounds$1.set(0, 0, size, size).getFitMatrix(renderBounds).a;
            const { x, y, width, height } = tempBounds$1.set(renderBounds).scale(scale);
            h.resize({ width, height, pixelRatio: 1 });
            h.clear();
            ImageManager.patternLocked = true;
            this.__renderShape(h, { matrix: matrix.setWith(this.__world).scaleWith(1 / scale).invertWith().translate(-x, -y) }, !isHitPixelFill, !isHitPixelStroke);
            ImageManager.patternLocked = false;
            h.resetTransform();
            data.__isHitPixel = true;
        }
        else {
            data.__isHitPixel && (data.__isHitPixel = false);
        }
        this.__drawHitPath(h);
        h.setStrokeOptions(data);
    };
    ui$2.__hit = function (inner) {
        if (Platform.name === 'miniapp')
            this.__drawHitPath(this.__hitCanvas);
        const data = this.__;
        if (data.__isHitPixel && this.__hitPixel(inner))
            return true;
        const { hitFill } = data;
        const needHitFillPath = ((data.fill || data.__isCanvas) && (hitFill === 'path' || (hitFill === 'pixel' && !(data.__pixelFill || data.__isCanvas)))) || hitFill === 'all';
        if (needHitFillPath && this.__hitFill(inner))
            return true;
        const { hitStroke, __strokeWidth } = data;
        const needHitStrokePath = (data.stroke && (hitStroke === 'path' || (hitStroke === 'pixel' && !data.__pixelStroke))) || hitStroke === 'all';
        if (!needHitFillPath && !needHitStrokePath)
            return false;
        const radiusWidth = inner.radiusX * 2;
        let hitWidth = radiusWidth;
        if (needHitStrokePath) {
            switch (data.strokeAlign) {
                case 'inside':
                    hitWidth += __strokeWidth * 2;
                    if (!needHitFillPath && this.__hitFill(inner) && this.__hitStroke(inner, hitWidth))
                        return true;
                    hitWidth = radiusWidth;
                    break;
                case 'center':
                    hitWidth += __strokeWidth;
                    break;
                case 'outside':
                    hitWidth += __strokeWidth * 2;
                    if (!needHitFillPath) {
                        if (!this.__hitFill(inner) && this.__hitStroke(inner, hitWidth))
                            return true;
                        hitWidth = radiusWidth;
                    }
                    break;
            }
        }
        return hitWidth ? this.__hitStroke(inner, hitWidth) : false;
    };

    const ui$1 = exports.UI.prototype, rect = exports.Rect.prototype, box$1 = exports.Box.prototype;
    rect.__updateHitCanvas = box$1.__updateHitCanvas = function () {
        if (this.stroke || this.cornerRadius || ((this.fill || this.__.__isCanvas) && this.hitFill === 'pixel') || this.hitStroke === 'all')
            ui$1.__updateHitCanvas.call(this);
        else if (this.__hitCanvas)
            this.__hitCanvas = null;
    };
    rect.__hitFill = box$1.__hitFill = function (inner) {
        return this.__hitCanvas ? ui$1.__hitFill.call(this, inner) : BoundsHelper.hitRadiusPoint(this.__layout.boxBounds, inner);
    };

    const ui = exports.UI.prototype, group = exports.Group.prototype;
    function getSelector(ui) {
        return ui.leafer ? ui.leafer.selector : (Platform.selector || (Platform.selector = Creator.selector()));
    }
    ui.find = function (condition, options) {
        return getSelector(this).getBy(condition, this, false, options);
    };
    ui.findOne = function (condition, options) {
        return getSelector(this).getBy(condition, this, true, options);
    };
    group.pick = function (hitPoint, options) {
        this.__layout.update();
        if (!options)
            options = {};
        return getSelector(this).getByPoint(hitPoint, options.hitRadius || 0, Object.assign(Object.assign({}, options), { target: this }));
    };

    const canvas$1 = LeaferCanvasBase.prototype;
    canvas$1.hitFill = function (point, fillRule) {
        return fillRule ? this.context.isPointInPath(point.x, point.y, fillRule) : this.context.isPointInPath(point.x, point.y);
    };
    canvas$1.hitStroke = function (point, strokeWidth) {
        this.strokeWidth = strokeWidth;
        return this.context.isPointInStroke(point.x, point.y);
    };
    canvas$1.hitPixel = function (radiusPoint, offset, scale = 1) {
        let { x, y, radiusX, radiusY } = radiusPoint;
        if (offset)
            x -= offset.x, y -= offset.y;
        tempBounds$1.set(x - radiusX, y - radiusY, radiusX * 2, radiusY * 2).scale(scale).ceil();
        const { data } = this.context.getImageData(tempBounds$1.x, tempBounds$1.y, tempBounds$1.width || 1, tempBounds$1.height || 1);
        for (let i = 0, len = data.length; i < len; i += 4) {
            if (data[i + 3] > 0)
                return true;
        }
        return data[3] > 0;
    };

    const PointerEventHelper = {
        convert(e, local) {
            const base = InteractionHelper.getBase(e);
            const data = Object.assign(Object.assign({}, base), { x: local.x, y: local.y, width: e.width, height: e.height, pointerType: e.pointerType, pressure: e.pressure });
            if (data.pointerType === 'pen') {
                data.tangentialPressure = e.tangentialPressure;
                data.tiltX = e.tiltX;
                data.tiltY = e.tiltY;
                data.twist = e.twist;
            }
            return data;
        },
        convertMouse(e, local) {
            const base = InteractionHelper.getBase(e);
            return Object.assign(Object.assign({}, base), { x: local.x, y: local.y, width: 1, height: 1, pointerType: 'mouse', pressure: 0.5 });
        },
        convertTouch(e, local) {
            const touch = PointerEventHelper.getTouch(e);
            const base = InteractionHelper.getBase(e);
            return Object.assign(Object.assign({}, base), { x: local.x, y: local.y, width: 1, height: 1, pointerType: 'touch', multiTouch: e.touches.length > 1, pressure: touch.force });
        },
        getTouch(e) {
            return e.targetTouches[0] || e.changedTouches[0];
        }
    };

    const WheelEventHelper = {
        getMove(e, config) {
            let { moveSpeed } = config;
            let { deltaX, deltaY } = e;
            if (e.shiftKey && !deltaX) {
                deltaX = deltaY;
                deltaY = 0;
            }
            if (deltaX > 50)
                deltaX = Math.max(50, deltaX / 3);
            if (deltaY > 50)
                deltaY = Math.max(50, deltaY / 3);
            return { x: -deltaX * moveSpeed * 2, y: -deltaY * moveSpeed * 2 };
        },
        getScale(e, config) {
            let zoom;
            let scale = 1;
            let { zoomMode, zoomSpeed } = config;
            const delta = e.deltaY || e.deltaX;
            if (zoomMode) {
                zoom = (zoomMode === 'mouse') ? true : (!e.deltaX && (Platform.intWheelDeltaY ? Math.abs(delta) > 17 : Math.ceil(delta) !== delta));
                if (e.shiftKey || e.metaKey || e.ctrlKey)
                    zoom = true;
            }
            else {
                zoom = !e.shiftKey && (e.metaKey || e.ctrlKey);
            }
            if (zoom) {
                zoomSpeed = MathHelper.within(zoomSpeed, 0, 1);
                const min = e.deltaY ? config.delta.y : config.delta.x;
                scale = 1 - delta / (min * 4) * zoomSpeed;
                if (scale < 0.5)
                    scale = 0.5;
                if (scale >= 1.5)
                    scale = 1.5;
            }
            return scale;
        }
    };

    const KeyEventHelper = {
        convert(e) {
            const base = InteractionHelper.getBase(e);
            const data = Object.assign(Object.assign({}, base), { code: e.code, key: e.key });
            return data;
        }
    };

    const { getMoveEventData, getZoomEventData, getRotateEventData, pathCanDrag } = InteractionHelper;
    class Interaction extends InteractionBase {
        __listenEvents() {
            super.__listenEvents();
            const view = this.view = this.canvas.view;
            this.viewEvents = {
                'pointerdown': this.onPointerDown,
                'mousedown': this.onMouseDown,
                'touchstart': this.onTouchStart,
                'contextmenu': this.onContextMenu,
                'wheel': this.onWheel,
                'gesturestart': this.onGesturestart,
                'gesturechange': this.onGesturechange,
                'gestureend': this.onGestureend
            };
            this.windowEvents = {
                'pointermove': this.onPointerMove,
                'pointerup': this.onPointerUp,
                'pointercancel': this.onPointerCancel,
                'mousemove': this.onMouseMove,
                'mouseup': this.onMouseUp,
                'touchmove': this.onTouchMove,
                'touchend': this.onTouchEnd,
                'touchcancel': this.onTouchCancel,
                'keydown': this.onKeyDown,
                'keyup': this.onKeyUp,
                'scroll': this.onScroll
            };
            const { viewEvents, windowEvents } = this;
            for (let name in viewEvents) {
                viewEvents[name] = viewEvents[name].bind(this);
                view.addEventListener(name, viewEvents[name]);
            }
            for (let name in windowEvents) {
                windowEvents[name] = windowEvents[name].bind(this);
                window.addEventListener(name, windowEvents[name]);
            }
        }
        __removeListenEvents() {
            super.__removeListenEvents();
            const { viewEvents, windowEvents } = this;
            for (let name in viewEvents) {
                this.view.removeEventListener(name, viewEvents[name]);
                this.viewEvents = {};
            }
            for (let name in windowEvents) {
                window.removeEventListener(name, windowEvents[name]);
                this.windowEvents = {};
            }
        }
        getTouches(touches) {
            const list = [];
            for (let i = 0, len = touches.length; i < len; i++) {
                list.push(touches[i]);
            }
            return list;
        }
        preventDefaultPointer(e) {
            const { pointer } = this.config;
            if (pointer.preventDefault)
                e.preventDefault();
        }
        preventDefaultWheel(e) {
            const { wheel } = this.config;
            if (wheel.preventDefault)
                e.preventDefault();
        }
        preventWindowPointer(e) {
            return !this.downData && e.target !== this.view;
        }
        onKeyDown(e) {
            this.keyDown(KeyEventHelper.convert(e));
        }
        onKeyUp(e) {
            this.keyUp(KeyEventHelper.convert(e));
        }
        onContextMenu(e) {
            if (this.config.pointer.preventDefaultMenu)
                e.preventDefault();
            this.menu(PointerEventHelper.convert(e, this.getLocal(e)));
        }
        onScroll() {
            this.canvas.updateClientBounds();
        }
        onPointerDown(e) {
            this.preventDefaultPointer(e);
            if (this.config.pointer.touch || this.useMultiTouch)
                return;
            this.usePointer || (this.usePointer = true);
            this.pointerDown(PointerEventHelper.convert(e, this.getLocal(e)));
        }
        onPointerMove(e) {
            if (this.config.pointer.touch || this.useMultiTouch || this.preventWindowPointer(e))
                return;
            this.usePointer || (this.usePointer = true);
            this.pointerMove(PointerEventHelper.convert(e, this.getLocal(e, true)));
        }
        onPointerUp(e) {
            if (this.downData)
                this.preventDefaultPointer(e);
            if (this.config.pointer.touch || this.useMultiTouch || this.preventWindowPointer(e))
                return;
            this.pointerUp(PointerEventHelper.convert(e, this.getLocal(e)));
        }
        onPointerCancel() {
            if (this.useMultiTouch)
                return;
            this.pointerCancel();
        }
        onMouseDown(e) {
            this.preventDefaultPointer(e);
            if (this.useTouch || this.usePointer)
                return;
            this.pointerDown(PointerEventHelper.convertMouse(e, this.getLocal(e)));
        }
        onMouseMove(e) {
            if (this.useTouch || this.usePointer || this.preventWindowPointer(e))
                return;
            this.pointerMove(PointerEventHelper.convertMouse(e, this.getLocal(e, true)));
        }
        onMouseUp(e) {
            if (this.downData)
                this.preventDefaultPointer(e);
            if (this.useTouch || this.usePointer || this.preventWindowPointer(e))
                return;
            this.pointerUp(PointerEventHelper.convertMouse(e, this.getLocal(e)));
        }
        onMouseCancel() {
            if (this.useTouch || this.usePointer)
                return;
            this.pointerCancel();
        }
        onTouchStart(e) {
            const touch = PointerEventHelper.getTouch(e);
            const local = this.getLocal(touch, true);
            const { preventDefault } = this.config.touch;
            if (preventDefault === true || (preventDefault === 'auto' && pathCanDrag(this.findPath(local))))
                e.preventDefault();
            this.multiTouchStart(e);
            if (this.usePointer)
                return;
            if (this.touchTimer) {
                window.clearTimeout(this.touchTimer);
                this.touchTimer = 0;
            }
            this.useTouch = true;
            this.pointerDown(PointerEventHelper.convertTouch(e, local));
        }
        onTouchMove(e) {
            this.multiTouchMove(e);
            if (this.usePointer || this.preventWindowPointer(e))
                return;
            const touch = PointerEventHelper.getTouch(e);
            this.pointerMove(PointerEventHelper.convertTouch(e, this.getLocal(touch)));
        }
        onTouchEnd(e) {
            this.multiTouchEnd();
            if (this.usePointer || this.preventWindowPointer(e))
                return;
            if (this.touchTimer)
                clearTimeout(this.touchTimer);
            this.touchTimer = setTimeout(() => {
                this.useTouch = false;
            }, 500);
            const touch = PointerEventHelper.getTouch(e);
            this.pointerUp(PointerEventHelper.convertTouch(e, this.getLocal(touch)));
        }
        onTouchCancel() {
            if (this.usePointer)
                return;
            this.pointerCancel();
        }
        multiTouchStart(e) {
            this.useMultiTouch = (e.touches.length > 1);
            this.touches = this.useMultiTouch ? this.getTouches(e.touches) : undefined;
            if (this.useMultiTouch)
                this.pointerCancel();
        }
        multiTouchMove(e) {
            if (!this.useMultiTouch)
                return;
            if (e.touches.length > 1) {
                const touches = this.getTouches(e.touches);
                const list = this.getKeepTouchList(this.touches, touches);
                if (list.length > 1) {
                    this.multiTouch(InteractionHelper.getBase(e), list);
                    this.touches = touches;
                }
            }
        }
        multiTouchEnd() {
            this.touches = null;
            this.useMultiTouch = false;
            this.transformEnd();
        }
        getKeepTouchList(old, touches) {
            let to;
            const list = [];
            old.forEach(from => {
                to = touches.find(touch => touch.identifier === from.identifier);
                if (to)
                    list.push({ from: this.getLocal(from), to: this.getLocal(to) });
            });
            return list;
        }
        getLocalTouchs(points) {
            return points.map(point => this.getLocal(point));
        }
        onWheel(e) {
            this.preventDefaultWheel(e);
            const { wheel } = this.config;
            if (wheel.disabled)
                return;
            const scale = wheel.getScale ? wheel.getScale(e, wheel) : WheelEventHelper.getScale(e, wheel);
            const local = this.getLocal(e);
            const eventBase = InteractionHelper.getBase(e);
            scale !== 1 ? this.zoom(getZoomEventData(local, scale, eventBase)) : this.move(getMoveEventData(local, wheel.getMove ? wheel.getMove(e, wheel) : WheelEventHelper.getMove(e, wheel), eventBase));
        }
        onGesturestart(e) {
            if (this.useMultiTouch)
                return;
            this.preventDefaultWheel(e);
            this.lastGestureScale = 1;
            this.lastGestureRotation = 0;
        }
        onGesturechange(e) {
            if (this.useMultiTouch)
                return;
            this.preventDefaultWheel(e);
            const local = this.getLocal(e);
            const eventBase = InteractionHelper.getBase(e);
            const changeScale = e.scale / this.lastGestureScale;
            const changeAngle = e.rotation - this.lastGestureRotation;
            let { rotateSpeed } = this.config.wheel;
            rotateSpeed = MathHelper.within(rotateSpeed, 0, 1);
            this.zoom(getZoomEventData(local, changeScale * changeScale, eventBase));
            this.rotate(getRotateEventData(local, changeAngle / Math.PI * 180 * (rotateSpeed / 4 + 0.1), eventBase));
            this.lastGestureScale = e.scale;
            this.lastGestureRotation = e.rotation;
        }
        onGestureend(e) {
            if (this.useMultiTouch)
                return;
            this.preventDefaultWheel(e);
            this.transformEnd();
        }
        setCursor(cursor) {
            super.setCursor(cursor);
            const list = [];
            this.eachCursor(cursor, list);
            if (typeof list[list.length - 1] === 'object')
                list.push('default');
            this.canvas.view.style.cursor = list.map(item => (typeof item === 'object') ? `url(${item.url}) ${item.x || 0} ${item.y || 0}` : item).join(',');
        }
        eachCursor(cursor, list, level = 0) {
            level++;
            if (cursor instanceof Array) {
                cursor.forEach(item => this.eachCursor(item, list, level));
            }
            else {
                const custom = typeof cursor === 'string' && Cursor.get(cursor);
                if (custom && level < 2) {
                    this.eachCursor(custom, list, level);
                }
                else {
                    list.push(cursor);
                }
            }
        }
        destroy() {
            if (this.view) {
                super.destroy();
                this.view = null;
                this.touches = null;
            }
        }
    }

    function fillText(ui, canvas) {
        let row;
        const { rows, decorationY, decorationHeight } = ui.__.__textDrawData;
        for (let i = 0, len = rows.length; i < len; i++) {
            row = rows[i];
            if (row.text)
                canvas.fillText(row.text, row.x, row.y);
            else if (row.data)
                row.data.forEach(charData => { canvas.fillText(charData.char, charData.x, row.y); });
            if (decorationY)
                canvas.fillRect(row.x, row.y + decorationY, row.width, decorationHeight);
        }
    }

    function fill(fill, ui, canvas) {
        canvas.fillStyle = fill;
        ui.__.__font ? fillText(ui, canvas) : (ui.__.windingRule ? canvas.fill(ui.__.windingRule) : canvas.fill());
    }
    function fills(fills, ui, canvas) {
        let item;
        const { windingRule, __font } = ui.__;
        for (let i = 0, len = fills.length; i < len; i++) {
            item = fills[i];
            if (item.image && PaintImage.checkImage(ui, canvas, item, !__font))
                continue;
            if (item.style) {
                canvas.fillStyle = item.style;
                if (item.transform) {
                    canvas.save();
                    canvas.transform(item.transform);
                    if (item.blendMode)
                        canvas.blendMode = item.blendMode;
                    __font ? fillText(ui, canvas) : (windingRule ? canvas.fill(windingRule) : canvas.fill());
                    canvas.restore();
                }
                else {
                    if (item.blendMode) {
                        canvas.saveBlendMode(item.blendMode);
                        __font ? fillText(ui, canvas) : (windingRule ? canvas.fill(windingRule) : canvas.fill());
                        canvas.restoreBlendMode();
                    }
                    else {
                        __font ? fillText(ui, canvas) : (windingRule ? canvas.fill(windingRule) : canvas.fill());
                    }
                }
            }
        }
    }

    function strokeText(stroke, ui, canvas) {
        const { strokeAlign } = ui.__;
        const isStrokes = typeof stroke !== 'string';
        switch (strokeAlign) {
            case 'center':
                canvas.setStroke(isStrokes ? undefined : stroke, ui.__.strokeWidth, ui.__);
                isStrokes ? drawStrokesStyle(stroke, true, ui, canvas) : drawTextStroke(ui, canvas);
                break;
            case 'inside':
                drawAlignStroke('inside', stroke, isStrokes, ui, canvas);
                break;
            case 'outside':
                drawAlignStroke('outside', stroke, isStrokes, ui, canvas);
                break;
        }
    }
    function drawAlignStroke(align, stroke, isStrokes, ui, canvas) {
        const { __strokeWidth, __font } = ui.__;
        const out = canvas.getSameCanvas(true, true);
        out.setStroke(isStrokes ? undefined : stroke, __strokeWidth * 2, ui.__);
        out.font = __font;
        isStrokes ? drawStrokesStyle(stroke, true, ui, out) : drawTextStroke(ui, out);
        out.blendMode = align === 'outside' ? 'destination-out' : 'destination-in';
        fillText(ui, out);
        out.blendMode = 'normal';
        if (ui.__worldFlipped)
            canvas.copyWorldByReset(out, ui.__nowWorld);
        else
            canvas.copyWorldToInner(out, ui.__nowWorld, ui.__layout.renderBounds);
        out.recycle(ui.__nowWorld);
    }
    function drawTextStroke(ui, canvas) {
        let row;
        const { rows, decorationY, decorationHeight } = ui.__.__textDrawData;
        for (let i = 0, len = rows.length; i < len; i++) {
            row = rows[i];
            if (row.text)
                canvas.strokeText(row.text, row.x, row.y);
            else if (row.data)
                row.data.forEach(charData => { canvas.strokeText(charData.char, charData.x, row.y); });
            if (decorationY)
                canvas.strokeRect(row.x, row.y + decorationY, row.width, decorationHeight);
        }
    }
    function drawStrokesStyle(strokes, isText, ui, canvas) {
        let item;
        for (let i = 0, len = strokes.length; i < len; i++) {
            item = strokes[i];
            if (item.image && PaintImage.checkImage(ui, canvas, item, false))
                continue;
            if (item.style) {
                canvas.strokeStyle = item.style;
                if (item.blendMode) {
                    canvas.saveBlendMode(item.blendMode);
                    isText ? drawTextStroke(ui, canvas) : canvas.stroke();
                    canvas.restoreBlendMode();
                }
                else {
                    isText ? drawTextStroke(ui, canvas) : canvas.stroke();
                }
            }
        }
    }

    function stroke(stroke, ui, canvas) {
        const options = ui.__;
        const { __strokeWidth, strokeAlign, __font } = options;
        if (!__strokeWidth)
            return;
        if (__font) {
            strokeText(stroke, ui, canvas);
        }
        else {
            switch (strokeAlign) {
                case 'center':
                    canvas.setStroke(stroke, __strokeWidth, options);
                    canvas.stroke();
                    break;
                case 'inside':
                    canvas.save();
                    canvas.setStroke(stroke, __strokeWidth * 2, options);
                    options.windingRule ? canvas.clip(options.windingRule) : canvas.clip();
                    canvas.stroke();
                    canvas.restore();
                    break;
                case 'outside':
                    const out = canvas.getSameCanvas(true, true);
                    out.setStroke(stroke, __strokeWidth * 2, options);
                    ui.__drawRenderPath(out);
                    out.stroke();
                    options.windingRule ? out.clip(options.windingRule) : out.clip();
                    out.clearWorld(ui.__layout.renderBounds);
                    if (ui.__worldFlipped)
                        canvas.copyWorldByReset(out, ui.__nowWorld);
                    else
                        canvas.copyWorldToInner(out, ui.__nowWorld, ui.__layout.renderBounds);
                    out.recycle(ui.__nowWorld);
                    break;
            }
        }
    }
    function strokes(strokes, ui, canvas) {
        const options = ui.__;
        const { __strokeWidth, strokeAlign, __font } = options;
        if (!__strokeWidth)
            return;
        if (__font) {
            strokeText(strokes, ui, canvas);
        }
        else {
            switch (strokeAlign) {
                case 'center':
                    canvas.setStroke(undefined, __strokeWidth, options);
                    drawStrokesStyle(strokes, false, ui, canvas);
                    break;
                case 'inside':
                    canvas.save();
                    canvas.setStroke(undefined, __strokeWidth * 2, options);
                    options.windingRule ? canvas.clip(options.windingRule) : canvas.clip();
                    drawStrokesStyle(strokes, false, ui, canvas);
                    canvas.restore();
                    break;
                case 'outside':
                    const { renderBounds } = ui.__layout;
                    const out = canvas.getSameCanvas(true, true);
                    ui.__drawRenderPath(out);
                    out.setStroke(undefined, __strokeWidth * 2, options);
                    drawStrokesStyle(strokes, false, ui, out);
                    options.windingRule ? out.clip(options.windingRule) : out.clip();
                    out.clearWorld(renderBounds);
                    if (ui.__worldFlipped)
                        canvas.copyWorldByReset(out, ui.__nowWorld);
                    else
                        canvas.copyWorldToInner(out, ui.__nowWorld, renderBounds);
                    out.recycle(ui.__nowWorld);
                    break;
            }
        }
    }

    const { getSpread, getOuterOf, getByMove, getIntersectData } = BoundsHelper;
    function shape(ui, current, options) {
        const canvas = current.getSameCanvas();
        const nowWorld = ui.__nowWorld;
        let bounds, fitMatrix, shapeBounds, worldCanvas;
        let { scaleX, scaleY } = nowWorld;
        if (scaleX < 0)
            scaleX = -scaleX;
        if (scaleY < 0)
            scaleY = -scaleY;
        if (current.bounds.includes(nowWorld)) {
            worldCanvas = canvas;
            bounds = shapeBounds = nowWorld;
        }
        else {
            const { renderShapeSpread: spread } = ui.__layout;
            const worldClipBounds = getIntersectData(spread ? getSpread(current.bounds, scaleX === scaleY ? spread * scaleX : [spread * scaleY, spread * scaleX]) : current.bounds, nowWorld);
            fitMatrix = current.bounds.getFitMatrix(worldClipBounds);
            let { a: fitScaleX, d: fitScaleY } = fitMatrix;
            if (fitMatrix.a < 1) {
                worldCanvas = current.getSameCanvas();
                ui.__renderShape(worldCanvas, options);
                scaleX *= fitScaleX;
                scaleY *= fitScaleY;
            }
            shapeBounds = getOuterOf(nowWorld, fitMatrix);
            bounds = getByMove(shapeBounds, -fitMatrix.e, -fitMatrix.f);
            if (options.matrix) {
                const { matrix } = options;
                fitMatrix.multiply(matrix);
                fitScaleX *= matrix.scaleX;
                fitScaleY *= matrix.scaleY;
            }
            options = Object.assign(Object.assign({}, options), { matrix: fitMatrix.withScale(fitScaleX, fitScaleY) });
        }
        ui.__renderShape(canvas, options);
        return {
            canvas, matrix: fitMatrix, bounds,
            worldCanvas, shapeBounds, scaleX, scaleY
        };
    }

    let recycleMap;
    function compute(attrName, ui) {
        const data = ui.__, leafPaints = [];
        let paints = data.__input[attrName], hasOpacityPixel;
        if (!(paints instanceof Array))
            paints = [paints];
        recycleMap = PaintImage.recycleImage(attrName, data);
        for (let i = 0, len = paints.length, item; i < len; i++) {
            item = getLeafPaint(attrName, paints[i], ui);
            if (item)
                leafPaints.push(item);
        }
        data['_' + attrName] = leafPaints.length ? leafPaints : undefined;
        if (leafPaints.length && leafPaints[0].image)
            hasOpacityPixel = leafPaints[0].image.hasOpacityPixel;
        attrName === 'fill' ? data.__pixelFill = hasOpacityPixel : data.__pixelStroke = hasOpacityPixel;
    }
    function getLeafPaint(attrName, paint, ui) {
        if (typeof paint !== 'object' || paint.visible === false || paint.opacity === 0)
            return undefined;
        const { boxBounds } = ui.__layout;
        switch (paint.type) {
            case 'solid':
                let { type, blendMode, color, opacity } = paint;
                return { type, blendMode, style: ColorConvert.string(color, opacity) };
            case 'image':
                return PaintImage.image(ui, attrName, paint, boxBounds, !recycleMap || !recycleMap[paint.url]);
            case 'linear':
                return PaintGradient.linearGradient(paint, boxBounds);
            case 'radial':
                return PaintGradient.radialGradient(paint, boxBounds);
            case 'angular':
                return PaintGradient.conicGradient(paint, boxBounds);
            default:
                return paint.r !== undefined ? { type: 'solid', style: ColorConvert.string(paint) } : undefined;
        }
    }

    const PaintModule = {
        compute,
        fill,
        fills,
        fillText,
        stroke,
        strokes,
        strokeText,
        drawTextStroke,
        shape
    };

    let origin = {};
    const { get: get$3, rotateOfOuter: rotateOfOuter$1, translate: translate$1, scaleOfOuter: scaleOfOuter$1, scale: scaleHelper, rotate } = MatrixHelper;
    function fillOrFitMode(data, box, x, y, scaleX, scaleY, rotation) {
        const transform = get$3();
        translate$1(transform, box.x + x, box.y + y);
        scaleHelper(transform, scaleX, scaleY);
        if (rotation)
            rotateOfOuter$1(transform, { x: box.x + box.width / 2, y: box.y + box.height / 2 }, rotation);
        data.transform = transform;
    }
    function clipMode(data, box, x, y, scaleX, scaleY, rotation) {
        const transform = get$3();
        translate$1(transform, box.x + x, box.y + y);
        if (scaleX)
            scaleHelper(transform, scaleX, scaleY);
        if (rotation)
            rotate(transform, rotation);
        data.transform = transform;
    }
    function repeatMode(data, box, width, height, x, y, scaleX, scaleY, rotation, align) {
        const transform = get$3();
        if (rotation) {
            if (align === 'center') {
                rotateOfOuter$1(transform, { x: width / 2, y: height / 2 }, rotation);
            }
            else {
                rotate(transform, rotation);
                switch (rotation) {
                    case 90:
                        translate$1(transform, height, 0);
                        break;
                    case 180:
                        translate$1(transform, width, height);
                        break;
                    case 270:
                        translate$1(transform, 0, width);
                        break;
                }
            }
        }
        origin.x = box.x + x;
        origin.y = box.y + y;
        translate$1(transform, origin.x, origin.y);
        if (scaleX)
            scaleOfOuter$1(transform, origin, scaleX, scaleY);
        data.transform = transform;
    }

    const { get: get$2, translate } = MatrixHelper;
    const tempBox = new Bounds();
    const tempPoint = {};
    const tempScaleData = {};
    function createData(leafPaint, image, paint, box) {
        const { blendMode, sync } = paint;
        if (blendMode)
            leafPaint.blendMode = blendMode;
        if (sync)
            leafPaint.sync = sync;
        leafPaint.data = getPatternData(paint, box, image);
    }
    function getPatternData(paint, box, image) {
        let { width, height } = image;
        if (paint.padding)
            box = tempBox.set(box).shrink(paint.padding);
        if (paint.mode === 'strench')
            paint.mode = 'stretch';
        const { opacity, mode, align, offset, scale, size, rotation, repeat } = paint;
        const sameBox = box.width === width && box.height === height;
        const data = { mode };
        const swapSize = align !== 'center' && (rotation || 0) % 180 === 90;
        const swapWidth = swapSize ? height : width, swapHeight = swapSize ? width : height;
        let x = 0, y = 0, scaleX, scaleY;
        if (!mode || mode === 'cover' || mode === 'fit') {
            if (!sameBox || rotation) {
                const sw = box.width / swapWidth, sh = box.height / swapHeight;
                scaleX = scaleY = mode === 'fit' ? Math.min(sw, sh) : Math.max(sw, sh);
                x += (box.width - width * scaleX) / 2, y += (box.height - height * scaleY) / 2;
            }
        }
        else if (scale || size) {
            MathHelper.getScaleData(scale, size, image, tempScaleData);
            scaleX = tempScaleData.scaleX;
            scaleY = tempScaleData.scaleY;
        }
        if (align) {
            const imageBounds = { x, y, width: swapWidth, height: swapHeight };
            if (scaleX)
                imageBounds.width *= scaleX, imageBounds.height *= scaleY;
            AlignHelper.toPoint(align, imageBounds, box, tempPoint, true);
            x += tempPoint.x, y += tempPoint.y;
        }
        if (offset)
            x += offset.x, y += offset.y;
        switch (mode) {
            case 'stretch':
                if (!sameBox)
                    width = box.width, height = box.height;
                break;
            case 'normal':
            case 'clip':
                if (x || y || scaleX || rotation)
                    clipMode(data, box, x, y, scaleX, scaleY, rotation);
                break;
            case 'repeat':
                if (!sameBox || scaleX || rotation)
                    repeatMode(data, box, width, height, x, y, scaleX, scaleY, rotation, align);
                if (!repeat)
                    data.repeat = 'repeat';
                break;
            case 'fit':
            case 'cover':
            default:
                if (scaleX)
                    fillOrFitMode(data, box, x, y, scaleX, scaleY, rotation);
        }
        if (!data.transform) {
            if (box.x || box.y) {
                data.transform = get$2();
                translate(data.transform, box.x, box.y);
            }
        }
        if (scaleX && mode !== 'stretch') {
            data.scaleX = scaleX;
            data.scaleY = scaleY;
        }
        data.width = width;
        data.height = height;
        if (opacity)
            data.opacity = opacity;
        if (repeat)
            data.repeat = typeof repeat === 'string' ? (repeat === 'x' ? 'repeat-x' : 'repeat-y') : 'repeat';
        return data;
    }

    let cache, box = new Bounds();
    const { isSame } = BoundsHelper;
    function image(ui, attrName, paint, boxBounds, firstUse) {
        let leafPaint, event;
        const image = ImageManager.get(paint);
        if (cache && paint === cache.paint && isSame(boxBounds, cache.boxBounds)) {
            leafPaint = cache.leafPaint;
        }
        else {
            leafPaint = { type: paint.type, image };
            cache = image.use > 1 ? { leafPaint, paint, boxBounds: box.set(boxBounds) } : null;
        }
        if (firstUse || image.loading)
            event = { image, attrName, attrValue: paint };
        if (image.ready) {
            checkSizeAndCreateData(ui, attrName, paint, image, leafPaint, boxBounds);
            if (firstUse) {
                onLoad(ui, event);
                onLoadSuccess(ui, event);
            }
        }
        else if (image.error) {
            if (firstUse)
                onLoadError(ui, event, image.error);
        }
        else {
            if (firstUse) {
                ignoreRender(ui, true);
                onLoad(ui, event);
            }
            leafPaint.loadId = image.load(() => {
                ignoreRender(ui, false);
                if (!ui.destroyed) {
                    if (checkSizeAndCreateData(ui, attrName, paint, image, leafPaint, boxBounds)) {
                        if (image.hasOpacityPixel)
                            ui.__layout.hitCanvasChanged = true;
                        ui.forceUpdate('surface');
                    }
                    onLoadSuccess(ui, event);
                }
                leafPaint.loadId = null;
            }, (error) => {
                ignoreRender(ui, false);
                onLoadError(ui, event, error);
                leafPaint.loadId = null;
            });
        }
        return leafPaint;
    }
    function checkSizeAndCreateData(ui, attrName, paint, image, leafPaint, boxBounds) {
        if (attrName === 'fill' && !ui.__.__naturalWidth) {
            const data = ui.__;
            data.__naturalWidth = image.width / data.pixelRatio;
            data.__naturalHeight = image.height / data.pixelRatio;
            if (data.__autoSide) {
                ui.forceUpdate('width');
                if (ui.__proxyData) {
                    ui.setProxyAttr('width', data.width);
                    ui.setProxyAttr('height', data.height);
                }
                return false;
            }
        }
        if (!leafPaint.data)
            createData(leafPaint, image, paint, boxBounds);
        return true;
    }
    function onLoad(ui, event) {
        emit(ui, ImageEvent.LOAD, event);
    }
    function onLoadSuccess(ui, event) {
        emit(ui, ImageEvent.LOADED, event);
    }
    function onLoadError(ui, event, error) {
        event.error = error;
        ui.forceUpdate('surface');
        emit(ui, ImageEvent.ERROR, event);
    }
    function emit(ui, type, data) {
        if (ui.hasEvent(type))
            ui.emitEvent(new ImageEvent(type, data));
    }
    function ignoreRender(ui, value) {
        const { leafer } = ui;
        if (leafer && leafer.viewReady)
            leafer.renderer.ignore = value;
    }

    const { get: get$1, scale, copy: copy$1 } = MatrixHelper;
    const { ceil, abs: abs$1 } = Math;
    function createPattern(ui, paint, pixelRatio) {
        let { scaleX, scaleY } = ImageManager.patternLocked ? ui.__world : ui.__nowWorld;
        const id = scaleX + '-' + scaleY + '-' + pixelRatio;
        if (paint.patternId !== id && !ui.destroyed) {
            scaleX = abs$1(scaleX);
            scaleY = abs$1(scaleY);
            const { image, data } = paint;
            let imageScale, imageMatrix, { width, height, scaleX: sx, scaleY: sy, opacity, transform, repeat } = data;
            if (sx) {
                imageMatrix = get$1();
                copy$1(imageMatrix, transform);
                scale(imageMatrix, 1 / sx, 1 / sy);
                scaleX *= sx;
                scaleY *= sy;
            }
            scaleX *= pixelRatio;
            scaleY *= pixelRatio;
            width *= scaleX;
            height *= scaleY;
            const size = width * height;
            if (!repeat) {
                if (size > Platform.image.maxCacheSize)
                    return false;
            }
            let maxSize = Platform.image.maxPatternSize;
            if (!image.isSVG) {
                const imageSize = image.width * image.height;
                if (maxSize > imageSize)
                    maxSize = imageSize;
            }
            if (size > maxSize)
                imageScale = Math.sqrt(size / maxSize);
            if (imageScale) {
                scaleX /= imageScale;
                scaleY /= imageScale;
                width /= imageScale;
                height /= imageScale;
            }
            if (sx) {
                scaleX /= sx;
                scaleY /= sy;
            }
            if (transform || scaleX !== 1 || scaleY !== 1) {
                if (!imageMatrix) {
                    imageMatrix = get$1();
                    if (transform)
                        copy$1(imageMatrix, transform);
                }
                scale(imageMatrix, 1 / scaleX, 1 / scaleY);
            }
            const canvas = image.getCanvas(ceil(width) || 1, ceil(height) || 1, opacity);
            const pattern = image.getPattern(canvas, repeat || (Platform.origin.noRepeat || 'no-repeat'), imageMatrix, paint);
            paint.style = pattern;
            paint.patternId = id;
            return true;
        }
        else {
            return false;
        }
    }

    const { abs } = Math;
    function checkImage(ui, canvas, paint, allowPaint) {
        const { scaleX, scaleY } = ImageManager.patternLocked ? ui.__world : ui.__nowWorld;
        const { pixelRatio } = canvas;
        if (!paint.data || (paint.patternId === scaleX + '-' + scaleY + '-' + pixelRatio && !Export.running)) {
            return false;
        }
        else {
            const { data } = paint;
            if (allowPaint) {
                if (!data.repeat) {
                    let { width, height } = data;
                    width *= abs(scaleX) * pixelRatio;
                    height *= abs(scaleY) * pixelRatio;
                    if (data.scaleX) {
                        width *= data.scaleX;
                        height *= data.scaleY;
                    }
                    allowPaint = (width * height > Platform.image.maxCacheSize) || Export.running;
                }
                else {
                    allowPaint = false;
                }
            }
            if (allowPaint) {
                canvas.save();
                ui.windingRule ? canvas.clip(ui.windingRule) : canvas.clip();
                if (paint.blendMode)
                    canvas.blendMode = paint.blendMode;
                if (data.opacity)
                    canvas.opacity *= data.opacity;
                if (data.transform)
                    canvas.transform(data.transform);
                canvas.drawImage(paint.image.view, 0, 0, data.width, data.height);
                canvas.restore();
                return true;
            }
            else {
                if (!paint.style || paint.sync || Export.running) {
                    createPattern(ui, paint, pixelRatio);
                }
                else {
                    if (!paint.patternTask) {
                        paint.patternTask = ImageManager.patternTasker.add(() => __awaiter(this, void 0, void 0, function* () {
                            paint.patternTask = null;
                            if (canvas.bounds.hit(ui.__nowWorld))
                                createPattern(ui, paint, pixelRatio);
                            ui.forceUpdate('surface');
                        }), 300);
                    }
                }
                return false;
            }
        }
    }

    function recycleImage(attrName, data) {
        const paints = data['_' + attrName];
        if (paints instanceof Array) {
            let image, recycleMap, input, url;
            for (let i = 0, len = paints.length; i < len; i++) {
                image = paints[i].image;
                url = image && image.url;
                if (url) {
                    if (!recycleMap)
                        recycleMap = {};
                    recycleMap[url] = true;
                    ImageManager.recycle(image);
                    if (image.loading) {
                        if (!input) {
                            input = (data.__input && data.__input[attrName]) || [];
                            if (!(input instanceof Array))
                                input = [input];
                        }
                        image.unload(paints[i].loadId, !input.some((item) => item.url === url));
                    }
                }
            }
            return recycleMap;
        }
        return null;
    }

    const PaintImageModule = {
        image,
        checkImage,
        createPattern,
        recycleImage,
        createData,
        getPatternData,
        fillOrFitMode,
        clipMode,
        repeatMode
    };

    const { toPoint: toPoint$2 } = AroundHelper;
    const realFrom$2 = {};
    const realTo$2 = {};
    function linearGradient(paint, box) {
        let { from, to, type, blendMode, opacity } = paint;
        toPoint$2(from || 'top', box, realFrom$2);
        toPoint$2(to || 'bottom', box, realTo$2);
        const style = Platform.canvas.createLinearGradient(realFrom$2.x, realFrom$2.y, realTo$2.x, realTo$2.y);
        applyStops(style, paint.stops, opacity);
        const data = { type, style };
        if (blendMode)
            data.blendMode = blendMode;
        return data;
    }
    function applyStops(gradient, stops, opacity) {
        if (stops) {
            let stop;
            for (let i = 0, len = stops.length; i < len; i++) {
                stop = stops[i];
                if (typeof stop === 'string') {
                    gradient.addColorStop(i / (len - 1), ColorConvert.string(stop, opacity));
                }
                else {
                    gradient.addColorStop(stop.offset, ColorConvert.string(stop.color, opacity));
                }
            }
        }
    }

    const { getAngle, getDistance: getDistance$1 } = PointHelper;
    const { get, rotateOfOuter, scaleOfOuter } = MatrixHelper;
    const { toPoint: toPoint$1 } = AroundHelper;
    const realFrom$1 = {};
    const realTo$1 = {};
    function radialGradient(paint, box) {
        let { from, to, type, opacity, blendMode, stretch } = paint;
        toPoint$1(from || 'center', box, realFrom$1);
        toPoint$1(to || 'bottom', box, realTo$1);
        const style = Platform.canvas.createRadialGradient(realFrom$1.x, realFrom$1.y, 0, realFrom$1.x, realFrom$1.y, getDistance$1(realFrom$1, realTo$1));
        applyStops(style, paint.stops, opacity);
        const data = { type, style };
        const transform = getTransform(box, realFrom$1, realTo$1, stretch, true);
        if (transform)
            data.transform = transform;
        if (blendMode)
            data.blendMode = blendMode;
        return data;
    }
    function getTransform(box, from, to, stretch, rotate90) {
        let transform;
        const { width, height } = box;
        if (width !== height || stretch) {
            const angle = getAngle(from, to);
            transform = get();
            if (rotate90) {
                scaleOfOuter(transform, from, width / height * (stretch || 1), 1);
                rotateOfOuter(transform, from, angle + 90);
            }
            else {
                scaleOfOuter(transform, from, 1, width / height * (stretch || 1));
                rotateOfOuter(transform, from, angle);
            }
        }
        return transform;
    }

    const { getDistance } = PointHelper;
    const { toPoint } = AroundHelper;
    const realFrom = {};
    const realTo = {};
    function conicGradient(paint, box) {
        let { from, to, type, opacity, blendMode, stretch } = paint;
        toPoint(from || 'center', box, realFrom);
        toPoint(to || 'bottom', box, realTo);
        const style = Platform.conicGradientSupport ? Platform.canvas.createConicGradient(0, realFrom.x, realFrom.y) : Platform.canvas.createRadialGradient(realFrom.x, realFrom.y, 0, realFrom.x, realFrom.y, getDistance(realFrom, realTo));
        applyStops(style, paint.stops, opacity);
        const data = { type, style };
        const transform = getTransform(box, realFrom, realTo, stretch || 1, Platform.conicGradientRotate90);
        if (transform)
            data.transform = transform;
        if (blendMode)
            data.blendMode = blendMode;
        return data;
    }

    const PaintGradientModule = {
        linearGradient,
        radialGradient,
        conicGradient,
        getTransform
    };

    const { copy, toOffsetOutBounds: toOffsetOutBounds$1 } = BoundsHelper;
    const tempBounds = {};
    const offsetOutBounds$1 = {};
    function shadow(ui, current, shape) {
        let copyBounds, spreadScale;
        const { __nowWorld: nowWorld, __layout } = ui;
        const { shadow } = ui.__;
        const { worldCanvas, bounds, shapeBounds, scaleX, scaleY } = shape;
        const other = current.getSameCanvas();
        const end = shadow.length - 1;
        toOffsetOutBounds$1(bounds, offsetOutBounds$1);
        shadow.forEach((item, index) => {
            other.setWorldShadow((offsetOutBounds$1.offsetX + item.x * scaleX), (offsetOutBounds$1.offsetY + item.y * scaleY), item.blur * scaleX, item.color);
            spreadScale = item.spread ? 1 + item.spread * 2 / (__layout.boxBounds.width + (__layout.strokeBoxSpread || 0) * 2) : 0;
            drawWorldShadow(other, offsetOutBounds$1, spreadScale, shape);
            copyBounds = bounds;
            if (item.box) {
                other.restore();
                other.save();
                if (worldCanvas) {
                    other.copyWorld(other, bounds, nowWorld, 'copy');
                    copyBounds = nowWorld;
                }
                worldCanvas ? other.copyWorld(worldCanvas, nowWorld, nowWorld, 'destination-out') : other.copyWorld(shape.canvas, shapeBounds, bounds, 'destination-out');
            }
            if (ui.__worldFlipped) {
                current.copyWorldByReset(other, copyBounds, nowWorld, item.blendMode);
            }
            else {
                current.copyWorldToInner(other, copyBounds, __layout.renderBounds, item.blendMode);
            }
            if (end && index < end)
                other.clearWorld(copyBounds, true);
        });
        other.recycle(copyBounds);
    }
    function drawWorldShadow(canvas, outBounds, spreadScale, shape) {
        const { bounds, shapeBounds } = shape;
        if (Platform.fullImageShadow) {
            copy(tempBounds, canvas.bounds);
            tempBounds.x += (outBounds.x - shapeBounds.x);
            tempBounds.y += (outBounds.y - shapeBounds.y);
            if (spreadScale) {
                const { matrix } = shape;
                tempBounds.x -= (bounds.x + (matrix ? matrix.e : 0) + bounds.width / 2) * (spreadScale - 1);
                tempBounds.y -= (bounds.y + (matrix ? matrix.f : 0) + bounds.height / 2) * (spreadScale - 1);
                tempBounds.width *= spreadScale;
                tempBounds.height *= spreadScale;
            }
            canvas.copyWorld(shape.canvas, canvas.bounds, tempBounds);
        }
        else {
            if (spreadScale) {
                copy(tempBounds, outBounds);
                tempBounds.x -= (outBounds.width / 2) * (spreadScale - 1);
                tempBounds.y -= (outBounds.height / 2) * (spreadScale - 1);
                tempBounds.width *= spreadScale;
                tempBounds.height *= spreadScale;
            }
            canvas.copyWorld(shape.canvas, shapeBounds, spreadScale ? tempBounds : outBounds);
        }
    }

    const { toOffsetOutBounds } = BoundsHelper;
    const offsetOutBounds = {};
    function innerShadow(ui, current, shape) {
        let copyBounds, spreadScale;
        const { __nowWorld: nowWorld, __layout: __layout } = ui;
        const { innerShadow } = ui.__;
        const { worldCanvas, bounds, shapeBounds, scaleX, scaleY } = shape;
        const other = current.getSameCanvas();
        const end = innerShadow.length - 1;
        toOffsetOutBounds(bounds, offsetOutBounds);
        innerShadow.forEach((item, index) => {
            other.save();
            other.setWorldShadow((offsetOutBounds.offsetX + item.x * scaleX), (offsetOutBounds.offsetY + item.y * scaleY), item.blur * scaleX);
            spreadScale = item.spread ? 1 - item.spread * 2 / (__layout.boxBounds.width + (__layout.strokeBoxSpread || 0) * 2) : 0;
            drawWorldShadow(other, offsetOutBounds, spreadScale, shape);
            other.restore();
            if (worldCanvas) {
                other.copyWorld(other, bounds, nowWorld, 'copy');
                other.copyWorld(worldCanvas, nowWorld, nowWorld, 'source-out');
                copyBounds = nowWorld;
            }
            else {
                other.copyWorld(shape.canvas, shapeBounds, bounds, 'source-out');
                copyBounds = bounds;
            }
            other.fillWorld(copyBounds, item.color, 'source-in');
            if (ui.__worldFlipped) {
                current.copyWorldByReset(other, copyBounds, nowWorld, item.blendMode);
            }
            else {
                current.copyWorldToInner(other, copyBounds, __layout.renderBounds, item.blendMode);
            }
            if (end && index < end)
                other.clearWorld(copyBounds, true);
        });
        other.recycle(copyBounds);
    }

    function blur(ui, current, origin) {
        const { blur } = ui.__;
        origin.setWorldBlur(blur * ui.__nowWorld.a);
        origin.copyWorldToInner(current, ui.__nowWorld, ui.__layout.renderBounds);
        origin.filter = 'none';
    }

    function backgroundBlur(_ui, _current, _shape) {
    }

    const EffectModule = {
        shadow,
        innerShadow,
        blur,
        backgroundBlur
    };

    const { excludeRenderBounds } = LeafBoundsHelper;
    exports.Group.prototype.__renderMask = function (canvas, options) {
        let child, maskCanvas, contentCanvas, maskOpacity, currentMask;
        const { children } = this;
        for (let i = 0, len = children.length; i < len; i++) {
            child = children[i];
            if (child.__.mask) {
                if (currentMask) {
                    maskEnd(this, currentMask, canvas, contentCanvas, maskCanvas, maskOpacity);
                    maskCanvas = contentCanvas = null;
                }
                if (child.__.mask === 'path') {
                    if (child.opacity < 1) {
                        currentMask = 'opacity-path';
                        maskOpacity = child.opacity;
                        if (!contentCanvas)
                            contentCanvas = getCanvas(canvas);
                    }
                    else {
                        currentMask = 'path';
                        canvas.save();
                    }
                    child.__clip(contentCanvas || canvas, options);
                }
                else {
                    currentMask = 'alpha';
                    if (!maskCanvas)
                        maskCanvas = getCanvas(canvas);
                    if (!contentCanvas)
                        contentCanvas = getCanvas(canvas);
                    child.__render(maskCanvas, options);
                }
                if (child.__.mask !== 'clipping')
                    continue;
            }
            if (excludeRenderBounds(child, options))
                continue;
            child.__render(contentCanvas || canvas, options);
        }
        maskEnd(this, currentMask, canvas, contentCanvas, maskCanvas, maskOpacity);
    };
    function maskEnd(leaf, maskMode, canvas, contentCanvas, maskCanvas, maskOpacity) {
        switch (maskMode) {
            case 'alpha':
                usePixelMask(leaf, canvas, contentCanvas, maskCanvas);
                break;
            case 'opacity-path':
                copyContent(leaf, canvas, contentCanvas, maskOpacity);
                break;
            case 'path':
                canvas.restore();
        }
    }
    function getCanvas(canvas) {
        return canvas.getSameCanvas(false, true);
    }
    function usePixelMask(leaf, canvas, content, mask) {
        const realBounds = leaf.__nowWorld;
        content.resetTransform();
        content.opacity = 1;
        content.useMask(mask, realBounds);
        mask.recycle(realBounds);
        copyContent(leaf, canvas, content, 1);
    }
    function copyContent(leaf, canvas, content, maskOpacity) {
        const realBounds = leaf.__nowWorld;
        canvas.resetTransform();
        canvas.opacity = maskOpacity;
        canvas.copyWorld(content, realBounds);
        content.recycle(realBounds);
    }

    const money = '¥￥＄€£￡¢￠';
    const letter = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz';
    const langBefore = '《（「〈『〖【〔｛┌＜‘“＝' + money;
    const langAfter = '》）」〉』〗】〕｝┐＞’”！？，、。：；‰';
    const langSymbol = '≮≯≈≠＝…';
    const langBreak$1 = '—／～｜┆·';
    const beforeChar = '{[(<\'"' + langBefore;
    const afterChar = '>)]}%!?,.:;\'"' + langAfter;
    const symbolChar = afterChar + '_#~&*+\\=|' + langSymbol;
    const breakChar = '- ' + langBreak$1;
    const cjkRangeList = [
        [0x4E00, 0x9FFF],
        [0x3400, 0x4DBF],
        [0x20000, 0x2A6DF],
        [0x2A700, 0x2B73F],
        [0x2B740, 0x2B81F],
        [0x2B820, 0x2CEAF],
        [0x2CEB0, 0x2EBEF],
        [0x30000, 0x3134F],
        [0x31350, 0x323AF],
        [0x2E80, 0x2EFF],
        [0x2F00, 0x2FDF],
        [0x2FF0, 0x2FFF],
        [0x3000, 0x303F],
        [0x31C0, 0x31EF],
        [0x3200, 0x32FF],
        [0x3300, 0x33FF],
        [0xF900, 0xFAFF],
        [0xFE30, 0xFE4F],
        [0x1F200, 0x1F2FF],
        [0x2F800, 0x2FA1F],
    ];
    const cjkReg = new RegExp(cjkRangeList.map(([start, end]) => `[\\u${start.toString(16)}-\\u${end.toString(16)}]`).join('|'));
    function mapChar(str) {
        const map = {};
        str.split('').forEach(char => map[char] = true);
        return map;
    }
    const letterMap = mapChar(letter);
    const beforeMap = mapChar(beforeChar);
    const afterMap = mapChar(afterChar);
    const symbolMap = mapChar(symbolChar);
    const breakMap = mapChar(breakChar);
    var CharType;
    (function (CharType) {
        CharType[CharType["Letter"] = 0] = "Letter";
        CharType[CharType["Single"] = 1] = "Single";
        CharType[CharType["Before"] = 2] = "Before";
        CharType[CharType["After"] = 3] = "After";
        CharType[CharType["Symbol"] = 4] = "Symbol";
        CharType[CharType["Break"] = 5] = "Break";
    })(CharType || (CharType = {}));
    const { Letter: Letter$1, Single: Single$1, Before: Before$1, After: After$1, Symbol: Symbol$1, Break: Break$1 } = CharType;
    function getCharType(char) {
        if (letterMap[char]) {
            return Letter$1;
        }
        else if (breakMap[char]) {
            return Break$1;
        }
        else if (beforeMap[char]) {
            return Before$1;
        }
        else if (afterMap[char]) {
            return After$1;
        }
        else if (symbolMap[char]) {
            return Symbol$1;
        }
        else if (cjkReg.test(char)) {
            return Single$1;
        }
        else {
            return Letter$1;
        }
    }

    const TextRowHelper = {
        trimRight(row) {
            const { words } = row;
            let trimRight = 0, len = words.length, char;
            for (let i = len - 1; i > -1; i--) {
                char = words[i].data[0];
                if (char.char === ' ') {
                    trimRight++;
                    row.width -= char.width;
                }
                else {
                    break;
                }
            }
            if (trimRight)
                words.splice(len - trimRight, trimRight);
        }
    };

    function getTextCase(char, textCase, firstChar) {
        switch (textCase) {
            case 'title':
                return firstChar ? char.toUpperCase() : char;
            case 'upper':
                return char.toUpperCase();
            case 'lower':
                return char.toLowerCase();
            default:
                return char;
        }
    }

    const { trimRight } = TextRowHelper;
    const { Letter, Single, Before, After, Symbol, Break } = CharType;
    let word, row, wordWidth, rowWidth, realWidth;
    let char, charWidth, startCharSize, charSize, charType, lastCharType, langBreak, afterBreak, paraStart;
    let textDrawData, rows = [], bounds, findMaxWidth;
    function createRows(drawData, content, style) {
        textDrawData = drawData;
        rows = drawData.rows;
        bounds = drawData.bounds;
        findMaxWidth = !bounds.width && !style.autoSizeAlign;
        const { __letterSpacing, paraIndent, textCase } = style;
        const { canvas } = Platform;
        const { width, height } = bounds;
        const charMode = width || height || __letterSpacing || (textCase !== 'none');
        if (charMode) {
            const wrap = style.textWrap !== 'none';
            const breakAll = style.textWrap === 'break';
            paraStart = true;
            lastCharType = null;
            startCharSize = charWidth = charSize = wordWidth = rowWidth = 0;
            word = { data: [] }, row = { words: [] };
            for (let i = 0, len = content.length; i < len; i++) {
                char = content[i];
                if (char === '\n') {
                    if (wordWidth)
                        addWord();
                    row.paraEnd = true;
                    addRow();
                    paraStart = true;
                }
                else {
                    charType = getCharType(char);
                    if (charType === Letter && textCase !== 'none')
                        char = getTextCase(char, textCase, !wordWidth);
                    charWidth = canvas.measureText(char).width;
                    if (__letterSpacing) {
                        if (__letterSpacing < 0)
                            charSize = charWidth;
                        charWidth += __letterSpacing;
                    }
                    langBreak = (charType === Single && (lastCharType === Single || lastCharType === Letter)) || (lastCharType === Single && charType !== After);
                    afterBreak = ((charType === Before || charType === Single) && (lastCharType === Symbol || lastCharType === After));
                    realWidth = paraStart && paraIndent ? width - paraIndent : width;
                    if (wrap && (width && rowWidth + wordWidth + charWidth > realWidth)) {
                        if (breakAll) {
                            if (wordWidth)
                                addWord();
                            if (rowWidth)
                                addRow();
                        }
                        else {
                            if (!afterBreak)
                                afterBreak = charType === Letter && lastCharType == After;
                            if (langBreak || afterBreak || charType === Break || charType === Before || charType === Single || (wordWidth + charWidth > realWidth)) {
                                if (wordWidth)
                                    addWord();
                                if (rowWidth)
                                    addRow();
                            }
                            else {
                                if (rowWidth)
                                    addRow();
                            }
                        }
                    }
                    if (char === ' ' && paraStart !== true && (rowWidth + wordWidth) === 0) ;
                    else {
                        if (charType === Break) {
                            if (char === ' ' && wordWidth)
                                addWord();
                            addChar(char, charWidth);
                            addWord();
                        }
                        else if (langBreak || afterBreak) {
                            if (wordWidth)
                                addWord();
                            addChar(char, charWidth);
                        }
                        else {
                            addChar(char, charWidth);
                        }
                    }
                    lastCharType = charType;
                }
            }
            if (wordWidth)
                addWord();
            if (rowWidth)
                addRow();
            rows.length > 0 && (rows[rows.length - 1].paraEnd = true);
        }
        else {
            content.split('\n').forEach(content => {
                textDrawData.paraNumber++;
                rowWidth = canvas.measureText(content).width;
                rows.push({ x: paraIndent || 0, text: content, width: rowWidth, paraStart: true });
                if (findMaxWidth)
                    setMaxWidth();
            });
        }
    }
    function addChar(char, width) {
        if (charSize && !startCharSize)
            startCharSize = charSize;
        word.data.push({ char, width });
        wordWidth += width;
    }
    function addWord() {
        rowWidth += wordWidth;
        word.width = wordWidth;
        row.words.push(word);
        word = { data: [] };
        wordWidth = 0;
    }
    function addRow() {
        if (paraStart) {
            textDrawData.paraNumber++;
            row.paraStart = true;
            paraStart = false;
        }
        if (charSize) {
            row.startCharSize = startCharSize;
            row.endCharSize = charSize;
            startCharSize = 0;
        }
        row.width = rowWidth;
        if (bounds.width)
            trimRight(row);
        else if (findMaxWidth)
            setMaxWidth();
        rows.push(row);
        row = { words: [] };
        rowWidth = 0;
    }
    function setMaxWidth() {
        if (rowWidth > (textDrawData.maxWidth || 0))
            textDrawData.maxWidth = rowWidth;
    }

    const CharMode = 0;
    const WordMode = 1;
    const TextMode = 2;
    function layoutChar(drawData, style, width, _height) {
        const { rows } = drawData;
        const { textAlign, paraIndent, letterSpacing } = style;
        let charX, addWordWidth, indentWidth, mode, wordChar;
        rows.forEach(row => {
            if (row.words) {
                indentWidth = paraIndent && row.paraStart ? paraIndent : 0;
                addWordWidth = (width && textAlign === 'justify' && row.words.length > 1) ? (width - row.width - indentWidth) / (row.words.length - 1) : 0;
                mode = (letterSpacing || row.isOverflow) ? CharMode : (addWordWidth > 0.01 ? WordMode : TextMode);
                if (row.isOverflow && !letterSpacing)
                    row.textMode = true;
                if (mode === TextMode) {
                    row.x += indentWidth;
                    toTextChar$1(row);
                }
                else {
                    row.x += indentWidth;
                    charX = row.x;
                    row.data = [];
                    row.words.forEach(word => {
                        if (mode === WordMode) {
                            wordChar = { char: '', x: charX };
                            charX = toWordChar(word.data, charX, wordChar);
                            if (row.isOverflow || wordChar.char !== ' ')
                                row.data.push(wordChar);
                        }
                        else {
                            charX = toChar(word.data, charX, row.data, row.isOverflow);
                        }
                        if (!row.paraEnd && addWordWidth) {
                            charX += addWordWidth;
                            row.width += addWordWidth;
                        }
                    });
                }
                row.words = null;
            }
        });
    }
    function toTextChar$1(row) {
        row.text = '';
        row.words.forEach(word => {
            word.data.forEach(char => {
                row.text += char.char;
            });
        });
    }
    function toWordChar(data, charX, wordChar) {
        data.forEach(char => {
            wordChar.char += char.char;
            charX += char.width;
        });
        return charX;
    }
    function toChar(data, charX, rowData, isOverflow) {
        data.forEach(char => {
            if (isOverflow || char.char !== ' ') {
                char.x = charX;
                rowData.push(char);
            }
            charX += char.width;
        });
        return charX;
    }

    function layoutText(drawData, style) {
        const { rows, bounds } = drawData;
        const { __lineHeight, __baseLine, __letterSpacing, __clipText, textAlign, verticalAlign, paraSpacing, autoSizeAlign } = style;
        let { x, y, width, height } = bounds, realHeight = __lineHeight * rows.length + (paraSpacing ? paraSpacing * (drawData.paraNumber - 1) : 0);
        let starY = __baseLine;
        if (__clipText && realHeight > height) {
            realHeight = Math.max(height, __lineHeight);
            drawData.overflow = rows.length;
        }
        else if (height || autoSizeAlign) {
            switch (verticalAlign) {
                case 'middle':
                    y += (height - realHeight) / 2;
                    break;
                case 'bottom': y += (height - realHeight);
            }
        }
        starY += y;
        let row, rowX, rowWidth, layoutWidth = (width || autoSizeAlign) ? width : drawData.maxWidth;
        for (let i = 0, len = rows.length; i < len; i++) {
            row = rows[i];
            row.x = x;
            if (row.width < width || (row.width > width && !__clipText)) {
                switch (textAlign) {
                    case 'center':
                        row.x += (layoutWidth - row.width) / 2;
                        break;
                    case 'right': row.x += layoutWidth - row.width;
                }
            }
            if (row.paraStart && paraSpacing && i > 0)
                starY += paraSpacing;
            row.y = starY;
            starY += __lineHeight;
            if (drawData.overflow > i && starY > realHeight) {
                row.isOverflow = true;
                drawData.overflow = i + 1;
            }
            rowX = row.x;
            rowWidth = row.width;
            if (__letterSpacing < 0) {
                if (row.width < 0) {
                    rowWidth = -row.width + style.fontSize + __letterSpacing;
                    rowX -= rowWidth;
                    rowWidth += style.fontSize;
                }
                else {
                    rowWidth -= __letterSpacing;
                }
            }
            if (rowX < bounds.x)
                bounds.x = rowX;
            if (rowWidth > bounds.width)
                bounds.width = rowWidth;
            if (__clipText && width && width < rowWidth) {
                row.isOverflow = true;
                if (!drawData.overflow)
                    drawData.overflow = rows.length;
            }
        }
        bounds.y = y;
        bounds.height = realHeight;
    }

    function clipText(drawData, style, x, width) {
        if (!width)
            return;
        const { rows, overflow } = drawData;
        let { textOverflow } = style;
        rows.splice(overflow);
        if (textOverflow && textOverflow !== 'show') {
            if (textOverflow === 'hide')
                textOverflow = '';
            else if (textOverflow === 'ellipsis')
                textOverflow = '...';
            let char, charRight;
            const ellipsisWidth = textOverflow ? Platform.canvas.measureText(textOverflow).width : 0;
            const right = x + width - ellipsisWidth;
            const list = style.textWrap === 'none' ? rows : [rows[overflow - 1]];
            list.forEach(row => {
                if (row.isOverflow && row.data) {
                    let end = row.data.length - 1;
                    for (let i = end; i > -1; i--) {
                        char = row.data[i];
                        charRight = char.x + char.width;
                        if (i === end && charRight < right) {
                            break;
                        }
                        else if (charRight < right && char.char !== ' ') {
                            row.data.splice(i + 1);
                            row.width -= char.width;
                            break;
                        }
                        row.width -= char.width;
                    }
                    row.width += ellipsisWidth;
                    row.data.push({ char: textOverflow, x: charRight });
                    if (row.textMode)
                        toTextChar(row);
                }
            });
        }
    }
    function toTextChar(row) {
        row.text = '';
        row.data.forEach(char => {
            row.text += char.char;
        });
        row.data = null;
    }

    function decorationText(drawData, style) {
        const { fontSize } = style;
        drawData.decorationHeight = fontSize / 11;
        switch (style.textDecoration) {
            case 'under':
                drawData.decorationY = fontSize * 0.15;
                break;
            case 'delete':
                drawData.decorationY = -fontSize * 0.35;
        }
    }

    const { top, right, bottom, left } = exports.Direction4;
    function getDrawData(content, style) {
        if (typeof content !== 'string')
            content = String(content);
        let x = 0, y = 0;
        let width = style.__getInput('width') || 0;
        let height = style.__getInput('height') || 0;
        const { textDecoration, __font, __padding: padding } = style;
        if (padding) {
            if (width)
                x = padding[left], width -= (padding[right] + padding[left]);
            else if (!style.autoSizeAlign)
                x = padding[left];
            if (height)
                y = padding[top], height -= (padding[top] + padding[bottom]);
            else if (!style.autoSizeAlign)
                y = padding[top];
        }
        const drawData = {
            bounds: { x, y, width, height },
            rows: [],
            paraNumber: 0,
            font: Platform.canvas.font = __font
        };
        createRows(drawData, content, style);
        if (padding)
            padAutoText(padding, drawData, style, width, height);
        layoutText(drawData, style);
        layoutChar(drawData, style, width);
        if (drawData.overflow)
            clipText(drawData, style, x, width);
        if (textDecoration !== 'none')
            decorationText(drawData, style);
        return drawData;
    }
    function padAutoText(padding, drawData, style, width, height) {
        if (!width && style.autoSizeAlign) {
            switch (style.textAlign) {
                case 'left':
                    offsetText(drawData, 'x', padding[left]);
                    break;
                case 'right': offsetText(drawData, 'x', -padding[right]);
            }
        }
        if (!height && style.autoSizeAlign) {
            switch (style.verticalAlign) {
                case 'top':
                    offsetText(drawData, 'y', padding[top]);
                    break;
                case 'bottom': offsetText(drawData, 'y', -padding[bottom]);
            }
        }
    }
    function offsetText(drawData, attrName, value) {
        const { bounds, rows } = drawData;
        bounds[attrName] += value;
        for (let i = 0; i < rows.length; i++)
            rows[i][attrName] += value;
    }

    const TextConvertModule = {
        getDrawData
    };

    function string(color, opacity) {
        const doOpacity = typeof opacity === 'number' && opacity !== 1;
        if (typeof color === 'string') {
            if (doOpacity && ColorConvert.object)
                color = ColorConvert.object(color);
            else
                return color;
        }
        let a = color.a === undefined ? 1 : color.a;
        if (doOpacity)
            a *= opacity;
        const rgb = color.r + ',' + color.g + ',' + color.b;
        return a === 1 ? 'rgb(' + rgb + ')' : 'rgba(' + rgb + ',' + a + ')';
    }

    const ColorConvertModule = {
        string
    };

    const { setPoint, addPoint, toBounds } = TwoPointBoundsHelper;
    function getTrimBounds(canvas) {
        const { width, height } = canvas.view;
        const { data } = canvas.context.getImageData(0, 0, width, height);
        let x, y, pointBounds, index = 0;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] !== 0) {
                x = index % width;
                y = (index - x) / width;
                pointBounds ? addPoint(pointBounds, x, y) : setPoint(pointBounds = {}, x, y);
            }
            index++;
        }
        const bounds = new Bounds();
        toBounds(pointBounds, bounds);
        return bounds.scale(1 / canvas.pixelRatio).ceil();
    }

    const ExportModule = {
        export(leaf, filename, options) {
            this.running = true;
            const fileType = FileHelper.fileType(filename);
            const isDownload = filename.includes('.');
            options = FileHelper.getExportOptions(options);
            return addTask((success) => new Promise((resolve) => {
                const over = (result) => {
                    success(result);
                    resolve();
                    this.running = false;
                };
                const { toURL } = Platform;
                const { download } = Platform.origin;
                if (fileType === 'json') {
                    isDownload && download(toURL(JSON.stringify(leaf.toJSON(options.json)), 'text'), filename);
                    return over({ data: isDownload ? true : leaf.toJSON(options.json) });
                }
                if (fileType === 'svg') {
                    isDownload && download(toURL(leaf.toSVG(), 'svg'), filename);
                    return over({ data: isDownload ? true : leaf.toSVG() });
                }
                const { leafer } = leaf;
                if (leafer) {
                    checkLazy(leaf);
                    leafer.waitViewCompleted(() => __awaiter(this, void 0, void 0, function* () {
                        let renderBounds, trimBounds, scaleX = 1, scaleY = 1;
                        const { worldTransform, isLeafer, isFrame } = leaf;
                        const { slice, trim, onCanvas } = options;
                        const smooth = options.smooth === undefined ? leafer.config.smooth : options.smooth;
                        const contextSettings = options.contextSettings || leafer.config.contextSettings;
                        const screenshot = options.screenshot || leaf.isApp;
                        const fill = (isLeafer && screenshot) ? (options.fill === undefined ? leaf.fill : options.fill) : options.fill;
                        const needFill = FileHelper.isOpaqueImage(filename) || fill, matrix = new Matrix();
                        if (screenshot) {
                            renderBounds = screenshot === true ? (isLeafer ? leafer.canvas.bounds : leaf.worldRenderBounds) : screenshot;
                        }
                        else {
                            let relative = options.relative || (isLeafer ? 'inner' : 'local');
                            scaleX = worldTransform.scaleX;
                            scaleY = worldTransform.scaleY;
                            switch (relative) {
                                case 'inner':
                                    matrix.set(worldTransform);
                                    break;
                                case 'local':
                                    matrix.set(worldTransform).divide(leaf.localTransform);
                                    scaleX /= leaf.scaleX;
                                    scaleY /= leaf.scaleY;
                                    break;
                                case 'world':
                                    scaleX = 1;
                                    scaleY = 1;
                                    break;
                                case 'page':
                                    relative = leaf.leafer;
                                default:
                                    matrix.set(worldTransform).divide(leaf.getTransform(relative));
                                    const l = relative.worldTransform;
                                    scaleX /= scaleX / l.scaleX;
                                    scaleY /= scaleY / l.scaleY;
                            }
                            renderBounds = leaf.getBounds('render', relative);
                        }
                        const scaleData = { scaleX: 1, scaleY: 1 };
                        MathHelper.getScaleData(options.scale, options.size, renderBounds, scaleData);
                        let pixelRatio = options.pixelRatio || 1;
                        if (leaf.isApp) {
                            scaleData.scaleX *= pixelRatio;
                            scaleData.scaleY *= pixelRatio;
                            pixelRatio = leaf.app.pixelRatio;
                        }
                        const { x, y, width, height } = new Bounds(renderBounds).scale(scaleData.scaleX, scaleData.scaleY);
                        const renderOptions = { matrix: matrix.scale(1 / scaleData.scaleX, 1 / scaleData.scaleY).invert().translate(-x, -y).withScale(1 / scaleX * scaleData.scaleX, 1 / scaleY * scaleData.scaleY) };
                        let canvas = Creator.canvas({ width: Math.round(width), height: Math.round(height), pixelRatio, smooth, contextSettings });
                        let sliceLeaf;
                        if (slice) {
                            sliceLeaf = leaf;
                            sliceLeaf.__worldOpacity = 0;
                            leaf = leafer;
                            renderOptions.bounds = canvas.bounds;
                        }
                        canvas.save();
                        if (isFrame && fill !== undefined) {
                            const oldFill = leaf.get('fill');
                            leaf.fill = '';
                            leaf.__render(canvas, renderOptions);
                            leaf.fill = oldFill;
                        }
                        else {
                            leaf.__render(canvas, renderOptions);
                        }
                        canvas.restore();
                        if (sliceLeaf)
                            sliceLeaf.__updateWorldOpacity();
                        if (trim) {
                            trimBounds = getTrimBounds(canvas);
                            const old = canvas, { width, height } = trimBounds;
                            const config = { x: 0, y: 0, width, height, pixelRatio };
                            canvas = Creator.canvas(config);
                            canvas.copyWorld(old, trimBounds, config);
                        }
                        if (needFill)
                            canvas.fillWorld(canvas.bounds, fill || '#FFFFFF', 'destination-over');
                        if (onCanvas)
                            onCanvas(canvas);
                        const data = filename === 'canvas' ? canvas : yield canvas.export(filename, options);
                        over({ data, width: canvas.pixelWidth, height: canvas.pixelHeight, renderBounds, trimBounds });
                    }));
                }
                else {
                    over({ data: false });
                }
            }));
        }
    };
    let tasker;
    function addTask(task) {
        if (!tasker)
            tasker = new TaskProcessor();
        return new Promise((resolve) => {
            tasker.add(() => __awaiter(this, void 0, void 0, function* () { return yield task(resolve); }), { parallel: false });
        });
    }
    function checkLazy(leaf) {
        if (leaf.__.__needComputePaint)
            leaf.__.__computePaint();
        if (leaf.isBranch)
            leaf.children.forEach(child => checkLazy(child));
    }

    const canvas = LeaferCanvasBase.prototype;
    const debug = Debug.get('@leafer-ui/export');
    canvas.export = function (filename, options) {
        const { quality, blob } = FileHelper.getExportOptions(options);
        if (filename.includes('.'))
            return this.saveAs(filename, quality);
        else if (blob)
            return this.toBlob(filename, quality);
        else
            return this.toDataURL(filename, quality);
    };
    canvas.toBlob = function (type, quality) {
        return new Promise((resolve) => {
            Platform.origin.canvasToBolb(this.view, type, quality).then((blob) => {
                resolve(blob);
            }).catch((e) => {
                debug.error(e);
                resolve(null);
            });
        });
    };
    canvas.toDataURL = function (type, quality) {
        return Platform.origin.canvasToDataURL(this.view, type, quality);
    };
    canvas.saveAs = function (filename, quality) {
        return new Promise((resolve) => {
            Platform.origin.canvasSaveAs(this.view, filename, quality).then(() => {
                resolve(true);
            }).catch((e) => {
                debug.error(e);
                resolve(false);
            });
        });
    };

    Object.assign(TextConvert, TextConvertModule);
    Object.assign(ColorConvert, ColorConvertModule);
    Object.assign(Paint, PaintModule);
    Object.assign(PaintImage, PaintImageModule);
    Object.assign(PaintGradient, PaintGradientModule);
    Object.assign(Effect, EffectModule);
    Object.assign(Export, ExportModule);

    Object.assign(Creator, {
        interaction: (target, canvas, selector, options) => new Interaction(target, canvas, selector, options),
        hitCanvas: (options, manager) => new LeaferCanvas(options, manager),
        hitCanvasManager: () => new HitCanvasManager()
    });
    useCanvas();

    exports.AlignHelper = AlignHelper;
    exports.AroundHelper = AroundHelper;
    exports.AutoBounds = AutoBounds;
    exports.BezierHelper = BezierHelper;
    exports.Bounds = Bounds;
    exports.BoundsHelper = BoundsHelper;
    exports.BoxData = BoxData;
    exports.BranchHelper = BranchHelper;
    exports.BranchRender = BranchRender;
    exports.CanvasData = CanvasData;
    exports.CanvasManager = CanvasManager;
    exports.ChildEvent = ChildEvent;
    exports.ColorConvert = ColorConvert;
    exports.Creator = Creator;
    exports.Cursor = Cursor;
    exports.DataHelper = DataHelper;
    exports.Debug = Debug;
    exports.Effect = Effect;
    exports.EllipseData = EllipseData;
    exports.EllipseHelper = EllipseHelper;
    exports.Event = Event;
    exports.EventCreator = EventCreator;
    exports.Eventer = Eventer;
    exports.Export = Export;
    exports.FileHelper = FileHelper;
    exports.FrameData = FrameData;
    exports.GroupData = GroupData;
    exports.HitCanvasManager = HitCanvasManager;
    exports.ImageData = ImageData;
    exports.ImageEvent = ImageEvent;
    exports.ImageManager = ImageManager;
    exports.IncrementId = IncrementId;
    exports.Interaction = Interaction;
    exports.InteractionBase = InteractionBase;
    exports.InteractionHelper = InteractionHelper;
    exports.Keyboard = Keyboard;
    exports.LayoutEvent = LayoutEvent;
    exports.Layouter = Layouter;
    exports.LeafBounds = LeafBounds;
    exports.LeafBoundsHelper = LeafBoundsHelper;
    exports.LeafData = LeafData;
    exports.LeafDataProxy = LeafDataProxy;
    exports.LeafEventer = LeafEventer;
    exports.LeafHelper = LeafHelper;
    exports.LeafLayout = LeafLayout;
    exports.LeafLevelList = LeafLevelList;
    exports.LeafList = LeafList;
    exports.LeafMatrix = LeafMatrix;
    exports.LeafRender = LeafRender;
    exports.LeaferCanvas = LeaferCanvas;
    exports.LeaferCanvasBase = LeaferCanvasBase;
    exports.LeaferData = LeaferData;
    exports.LeaferEvent = LeaferEvent;
    exports.LeaferImage = LeaferImage;
    exports.LeaferTypeCreator = LeaferTypeCreator;
    exports.LineData = LineData;
    exports.MathHelper = MathHelper;
    exports.Matrix = Matrix;
    exports.MatrixHelper = MatrixHelper;
    exports.MultiTouchHelper = MultiTouchHelper;
    exports.MyDragEvent = MyDragEvent;
    exports.MyImage = MyImage;
    exports.MyPointerEvent = MyPointerEvent;
    exports.NeedConvertToCanvasCommandMap = NeedConvertToCanvasCommandMap;
    exports.OneRadian = OneRadian;
    exports.PI2 = PI2;
    exports.PI_2 = PI_2;
    exports.Paint = Paint;
    exports.PaintGradient = PaintGradient;
    exports.PaintImage = PaintImage;
    exports.PathArrow = PathArrow;
    exports.PathBounds = PathBounds;
    exports.PathCommandDataHelper = PathCommandDataHelper;
    exports.PathCommandMap = PathCommandMap;
    exports.PathConvert = PathConvert;
    exports.PathCorner = PathCorner;
    exports.PathCreator = PathCreator;
    exports.PathData = PathData;
    exports.PathDrawer = PathDrawer;
    exports.PathHelper = PathHelper;
    exports.PathNumberCommandLengthMap = PathNumberCommandLengthMap;
    exports.PathNumberCommandMap = PathNumberCommandMap;
    exports.PenData = PenData;
    exports.Platform = Platform;
    exports.Point = Point;
    exports.PointHelper = PointHelper;
    exports.PointerButton = PointerButton;
    exports.PolygonData = PolygonData;
    exports.PropertyEvent = PropertyEvent;
    exports.RectData = RectData;
    exports.RectHelper = RectHelper;
    exports.RectRender = RectRender;
    exports.RenderEvent = RenderEvent;
    exports.Renderer = Renderer;
    exports.ResizeEvent = ResizeEvent;
    exports.Run = Run;
    exports.Selector = Selector;
    exports.StarData = StarData;
    exports.State = State;
    exports.StringNumberMap = StringNumberMap;
    exports.TaskItem = TaskItem;
    exports.TaskProcessor = TaskProcessor;
    exports.TextConvert = TextConvert;
    exports.TextData = TextData;
    exports.Transition = Transition;
    exports.TwoPointBoundsHelper = TwoPointBoundsHelper;
    exports.UIBounds = UIBounds;
    exports.UICreator = UICreator;
    exports.UIData = UIData;
    exports.UIEvent = UIEvent;
    exports.UIRender = UIRender;
    exports.UnitConvert = UnitConvert;
    exports.WaitHelper = WaitHelper;
    exports.WatchEvent = WatchEvent;
    exports.Watcher = Watcher;
    exports.addInteractionWindow = addInteractionWindow;
    exports.affectRenderBoundsType = affectRenderBoundsType;
    exports.affectStrokeBoundsType = affectStrokeBoundsType;
    exports.attr = attr;
    exports.autoLayoutType = autoLayoutType;
    exports.boundsType = boundsType;
    exports.canvasPatch = canvasPatch;
    exports.canvasSizeAttrs = canvasSizeAttrs;
    exports.cursorType = cursorType;
    exports.dataProcessor = dataProcessor;
    exports.dataType = dataType;
    exports.decorateLeafAttr = decorateLeafAttr;
    exports.defineDataProcessor = defineDataProcessor;
    exports.defineKey = defineKey;
    exports.defineLeafAttr = defineLeafAttr;
    exports.doBoundsType = doBoundsType;
    exports.doStrokeType = doStrokeType;
    exports.effectType = effectType;
    exports.emptyData = emptyData;
    exports.eraserType = eraserType;
    exports.getBoundsData = getBoundsData;
    exports.getDescriptor = getDescriptor;
    exports.getMatrixData = getMatrixData;
    exports.getPointData = getPointData;
    exports.hitType = hitType;
    exports.isNull = isNull;
    exports.layoutProcessor = layoutProcessor;
    exports.maskType = maskType;
    exports.naturalBoundsType = naturalBoundsType;
    exports.needPlugin = needPlugin;
    exports.opacityType = opacityType;
    exports.pathInputType = pathInputType;
    exports.pathType = pathType;
    exports.pen = pen;
    exports.positionType = positionType;
    exports.registerUI = registerUI;
    exports.registerUIEvent = registerUIEvent;
    exports.resizeType = resizeType;
    exports.rewrite = rewrite;
    exports.rewriteAble = rewriteAble;
    exports.rotationType = rotationType;
    exports.scaleType = scaleType;
    exports.sortType = sortType;
    exports.strokeType = strokeType;
    exports.surfaceType = surfaceType;
    exports.tempBounds = tempBounds$1;
    exports.tempMatrix = tempMatrix;
    exports.tempPoint = tempPoint$3;
    exports.useCanvas = useCanvas;
    exports.useModule = useModule;
    exports.version = version;
    exports.visibleType = visibleType;
    exports.zoomLayerType = zoomLayerType;

    return exports;

})({});

this.LeaferIN = this.LeaferIN || {};
this.LeaferIN.editor = (function (exports, draw, core) {
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

    const matrix$1 = draw.MatrixHelper.get();
    const { topLeft: topLeft$1, top: top$1, topRight: topRight$1, right: right$2, bottom: bottom$1, left: left$2 } = draw.Direction9;
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
                case top$1:
                case bottom$1:
                    fontScale = scaleY;
                    layout.affectScaleOrRotation ? leaf.moveInner(-width / 2, 0) : leaf.x -= width / 2;
                    break;
                case left$2:
                case right$2:
                    layout.affectScaleOrRotation ? leaf.moveInner(0, -height / 2) : leaf.y -= height / 2;
                    break;
                case topLeft$1:
                case topRight$1:
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
            matrix$1.a = scaleX;
            matrix$1.d = scaleY;
            children[i].transform(matrix$1, true);
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

    function toList(value) {
        return value ? (value instanceof Array ? value : [value]) : [];
    }
    class EditorEvent extends draw.Event {
        get list() { return toList(this.value); }
        get oldList() { return toList(this.oldValue); }
        constructor(type, data) {
            super(type);
            if (data)
                Object.assign(this, data);
        }
    }
    EditorEvent.SELECT = 'editor.select';
    EditorEvent.HOVER = 'editor.hover';

    class EditorMoveEvent extends EditorEvent {
        constructor(type, data) {
            super(type, data);
        }
    }
    EditorMoveEvent.MOVE = 'editor.move';

    class EditorScaleEvent extends EditorEvent {
        constructor(type, data) {
            super(type, data);
        }
    }
    EditorScaleEvent.SCALE = 'editor.scale';

    class EditorRotateEvent extends EditorEvent {
        constructor(type, data) {
            super(type, data);
        }
    }
    EditorRotateEvent.ROTATE = 'editor.rotate';

    class EditorSkewEvent extends EditorEvent {
        constructor(type, data) {
            super(type, data);
        }
    }
    EditorSkewEvent.SKEW = 'editor.skew';

    function targetAttr(fn) {
        return (target, key) => {
            const privateKey = '_' + key;
            draw.defineKey(target, key, {
                get() { return this[privateKey]; },
                set(value) {
                    const old = this[privateKey];
                    if (old !== value)
                        this[privateKey] = value, fn(this, old);
                }
            });
        };
    }

    const matrix = draw.MatrixHelper.get();
    const { abs } = Math;
    const { copy: copy$1, scale } = draw.MatrixHelper;
    class Stroker extends draw.UI {
        constructor() {
            super();
            this.list = [];
            this.hittable = false;
            this.strokeAlign = 'center';
        }
        setTarget(target, style) {
            this.set(style);
            this.target = target;
        }
        __draw(canvas, options) {
            const { list } = this;
            if (list.length) {
                let leaf;
                const data = this.__, { stroke, strokeWidth, fill } = data, { bounds } = options;
                for (let i = 0; i < list.length; i++) {
                    leaf = list[i];
                    const { worldTransform, worldRenderBounds } = leaf;
                    if (bounds && bounds.hit(worldRenderBounds, options.matrix)) {
                        const aScaleX = abs(worldTransform.scaleX), aScaleY = abs(worldTransform.scaleY);
                        if (aScaleX !== aScaleY) {
                            copy$1(matrix, worldTransform);
                            scale(matrix, 1 / aScaleX, 1 / aScaleY);
                            canvas.setWorld(matrix, options.matrix);
                            canvas.beginPath();
                            data.strokeWidth = strokeWidth;
                            const { x, y, width, height } = leaf.__layout.boxBounds;
                            canvas.rect(x * aScaleX, y * aScaleY, width * aScaleX, height * aScaleY);
                        }
                        else {
                            canvas.setWorld(worldTransform, options.matrix);
                            canvas.beginPath();
                            if (leaf.__.__useArrow)
                                leaf.__drawPath(canvas);
                            else
                                leaf.__.__pathForRender ? leaf.__drawRenderPath(canvas) : leaf.__drawPathByBox(canvas);
                            data.strokeWidth = strokeWidth / abs(worldTransform.scaleX);
                        }
                        if (stroke)
                            typeof stroke === 'string' ? draw.Paint.stroke(stroke, this, canvas) : draw.Paint.strokes(stroke, this, canvas);
                        if (fill)
                            typeof fill === 'string' ? draw.Paint.fill(fill, this, canvas) : draw.Paint.fills(fill, this, canvas);
                    }
                }
                data.strokeWidth = strokeWidth;
            }
        }
        destroy() {
            this.target = null;
            super.destroy();
        }
    }
    __decorate([
        targetAttr(onTarget$1)
    ], Stroker.prototype, "target", void 0);
    function onTarget$1(stroker) {
        const value = stroker.target;
        stroker.list = value ? (value instanceof Array ? value : [value]) : [];
        stroker.forceUpdate();
    }

    class SelectArea extends draw.Group {
        constructor(data) {
            super(data);
            this.strokeArea = new draw.Rect({ strokeAlign: 'center' });
            this.fillArea = new draw.Rect();
            this.visible = this.hittable = false;
            this.addMany(this.fillArea, this.strokeArea);
        }
        setStyle(style, userStyle) {
            const { visible, stroke, strokeWidth } = style;
            this.visible = visible;
            this.strokeArea.reset(Object.assign({ stroke, strokeWidth }, (userStyle || {})));
            this.fillArea.reset({ visible: userStyle ? false : true, fill: stroke, opacity: 0.2 });
        }
        setBounds(bounds) {
            this.strokeArea.set(bounds);
            this.fillArea.set(bounds);
        }
    }

    const { No, Yes, NoAndSkip, YesAndSkip } = draw.Answer;
    const EditSelectHelper = {
        findOne(path) {
            return path.list.find((leaf) => leaf.editable);
        },
        findBounds(leaf, bounds) {
            if (leaf.__.hittable && leaf.__.visible && !leaf.__.locked && bounds.hit(leaf.__world)) {
                if (leaf.__.editable) {
                    if (leaf.isBranch && !leaf.__.hitChildren) {
                        return leaf.__.hitSelf ? YesAndSkip : NoAndSkip;
                    }
                    else if (leaf.isFrame) {
                        return bounds.includes(leaf.__layout.boxBounds, leaf.__world) ? YesAndSkip : No;
                    }
                    else {
                        if (bounds.hit(leaf.__layout.boxBounds, leaf.__world) && leaf.__.hitSelf)
                            return Yes;
                    }
                }
                return No;
            }
            else {
                return leaf.isBranch ? NoAndSkip : No;
            }
        }
    };

    const { findOne } = EditSelectHelper;
    class EditSelect extends draw.Group {
        get dragging() { return !!this.originList; }
        get running() { const { editor } = this; return this.hittable && editor.visible && editor.hittable && editor.mergeConfig.selector; }
        get isMoveMode() { return this.app && this.app.interaction.moveMode; }
        constructor(editor) {
            super();
            this.hoverStroker = new Stroker();
            this.targetStroker = new Stroker();
            this.bounds = new draw.Bounds();
            this.selectArea = new SelectArea();
            this.__eventIds = [];
            this.editor = editor;
            this.addMany(this.targetStroker, this.hoverStroker, this.selectArea);
            this.__listenEvents();
        }
        onHover() {
            const { editor } = this;
            if (this.running && !this.dragging && !editor.dragging) {
                const { stroke, strokeWidth, hover, hoverStyle } = editor.mergeConfig;
                this.hoverStroker.setTarget(hover ? this.editor.hoverTarget : null, Object.assign({ stroke, strokeWidth }, (hoverStyle || {})));
            }
            else {
                this.hoverStroker.target = null;
            }
        }
        onSelect() {
            if (this.running) {
                const { mergeConfig: config, list } = this.editor;
                const { stroke, strokeWidth } = config;
                this.targetStroker.setTarget(list, { stroke, strokeWidth: Math.max(1, strokeWidth / 2) });
                this.hoverStroker.target = null;
            }
        }
        update() {
            if (this.targetStroker.target)
                this.targetStroker.forceUpdate();
        }
        onPointerMove(e) {
            const { app, editor } = this;
            if (this.running && !this.isMoveMode && app.interaction.canHover && !app.interaction.dragging) {
                const find = this.findUI(e);
                editor.hoverTarget = editor.hasItem(find) ? null : find;
            }
            if (this.isMoveMode) {
                editor.hoverTarget = null;
            }
        }
        onBeforeDown(e) {
            if (e.multiTouch)
                return;
            const { select } = this.editor.mergeConfig;
            if (select === 'press') {
                if (this.app.config.mobile) {
                    this.waitSelect = () => this.checkAndSelect(e);
                }
                else {
                    this.checkAndSelect(e);
                }
            }
        }
        onTap(e) {
            if (e.multiTouch)
                return;
            const { editor } = this;
            const { select } = editor.mergeConfig;
            if (select === 'tap')
                this.checkAndSelect(e);
            else if (this.waitSelect)
                this.waitSelect();
            if (this.needRemoveItem) {
                editor.removeItem(this.needRemoveItem);
            }
            else if (this.isMoveMode) {
                editor.target = null;
            }
        }
        checkAndSelect(e) {
            this.needRemoveItem = null;
            if (this.allowSelect(e)) {
                const { editor } = this;
                const find = this.findUI(e);
                if (find) {
                    if (this.isMultipleSelect(e)) {
                        if (editor.hasItem(find))
                            this.needRemoveItem = find;
                        else
                            editor.addItem(find);
                    }
                    else {
                        editor.target = find;
                    }
                }
                else if (this.allow(e.target)) {
                    if (!e.shiftKey)
                        editor.target = null;
                }
            }
        }
        onDragStart(e) {
            if (e.multiTouch)
                return;
            if (this.waitSelect)
                this.waitSelect();
            if (this.allowDrag(e)) {
                const { editor } = this;
                const { stroke, area } = editor.mergeConfig;
                const { x, y } = e.getInnerPoint(this);
                this.bounds.set(x, y);
                this.selectArea.setStyle({ visible: true, stroke, x, y }, area);
                this.selectArea.setBounds(this.bounds.get());
                this.originList = editor.leafList.clone();
            }
        }
        onDrag(e) {
            if (e.multiTouch)
                return;
            if (this.editor.dragging)
                return this.onDragEnd(e);
            if (this.dragging) {
                const { editor } = this;
                const total = e.getInnerTotal(this);
                const dragBounds = this.bounds.clone().unsign();
                const list = new draw.LeafList(editor.app.find(EditSelectHelper.findBounds, dragBounds));
                this.bounds.width = total.x;
                this.bounds.height = total.y;
                this.selectArea.setBounds(dragBounds.get());
                if (list.length) {
                    const selectList = [];
                    this.originList.forEach(item => { if (!list.has(item))
                        selectList.push(item); });
                    list.forEach(item => { if (!this.originList.has(item))
                        selectList.push(item); });
                    if (selectList.length !== editor.list.length || editor.list.some((child, index) => child !== selectList[index])) {
                        editor.target = selectList;
                    }
                }
                else {
                    editor.target = this.originList.list;
                }
            }
        }
        onDragEnd(e) {
            if (e.multiTouch)
                return;
            if (this.dragging)
                this.originList = null, this.selectArea.visible = false;
        }
        onAutoMove(e) {
            if (this.dragging) {
                const { x, y } = e.getLocalMove(this);
                this.bounds.x += x;
                this.bounds.y += y;
            }
        }
        allow(target) {
            return target.leafer !== this.editor.leafer;
        }
        allowDrag(e) {
            if (this.running && this.editor.mergeConfig.boxSelect && !e.target.draggable) {
                return (!this.editor.editing && this.allow(e.target)) || (e.shiftKey && !findOne(e.path));
            }
            else {
                return false;
            }
        }
        allowSelect(e) {
            return this.running && !this.isMoveMode && !e.middle;
        }
        findDeepOne(e) {
            const options = { exclude: new draw.LeafList(this.editor.editBox.rect) };
            return findOne(e.target.leafer.interaction.findPath(e, options));
        }
        findUI(e) {
            return this.isMultipleSelect(e) ? this.findDeepOne(e) : findOne(e.path);
        }
        isMultipleSelect(e) {
            return e.shiftKey || this.editor.mergeConfig.continuousSelect;
        }
        __listenEvents() {
            const { editor } = this;
            editor.waitLeafer(() => {
                const { app } = editor;
                app.selector.proxy = editor;
                this.__eventIds = [
                    editor.on_(EditorEvent.HOVER, this.onHover, this),
                    editor.on_(EditorEvent.SELECT, this.onSelect, this),
                    app.on_(core.PointerEvent.MOVE, this.onPointerMove, this),
                    app.on_(core.PointerEvent.BEFORE_DOWN, this.onBeforeDown, this),
                    app.on_(core.PointerEvent.TAP, this.onTap, this),
                    app.on_(core.DragEvent.START, this.onDragStart, this, true),
                    app.on_(core.DragEvent.DRAG, this.onDrag, this),
                    app.on_(core.DragEvent.END, this.onDragEnd, this),
                    app.on_(core.MoveEvent.MOVE, this.onAutoMove, this),
                    app.on_([core.ZoomEvent.ZOOM, core.MoveEvent.MOVE], () => { this.editor.hoverTarget = null; }),
                ];
            });
        }
        __removeListenEvents() {
            if (this.__eventIds) {
                this.off_(this.__eventIds);
                this.__eventIds.length = 0;
            }
        }
        destroy() {
            this.editor = this.originList = this.needRemoveItem = null;
            this.__removeListenEvents();
            super.destroy();
        }
    }

    const { topLeft, top, topRight, right: right$1, bottomRight, bottom, bottomLeft, left: left$1 } = draw.Direction9;
    const { toPoint } = draw.AroundHelper;
    const { within } = draw.MathHelper;
    const EditDataHelper = {
        getScaleData(element, startBounds, direction, totalMove, lockRatio, around, flipable, scaleMode) {
            let align, origin = {}, scaleX = 1, scaleY = 1;
            const { boxBounds, widthRange, heightRange } = element;
            const { width, height } = startBounds;
            if (around) {
                totalMove.x *= 2;
                totalMove.y *= 2;
            }
            const originChangedScaleX = element.scaleX / startBounds.scaleX;
            const originChangedScaleY = element.scaleY / startBounds.scaleY;
            const signX = originChangedScaleX < 0 ? -1 : 1;
            const signY = originChangedScaleY < 0 ? -1 : 1;
            const changedScaleX = scaleMode ? originChangedScaleX : signX * boxBounds.width / width;
            const changedScaleY = scaleMode ? originChangedScaleY : signY * boxBounds.height / height;
            totalMove.x *= scaleMode ? originChangedScaleX : signX;
            totalMove.y *= scaleMode ? originChangedScaleY : signY;
            if (Math.abs(totalMove.x) === width)
                totalMove.x += 0.1;
            if (Math.abs(totalMove.y) === height)
                totalMove.y += 0.1;
            const topScale = (-totalMove.y + height) / height;
            const rightScale = (totalMove.x + width) / width;
            const bottomScale = (totalMove.y + height) / height;
            const leftScale = (-totalMove.x + width) / width;
            switch (direction) {
                case top:
                    scaleY = topScale;
                    align = 'bottom';
                    break;
                case right$1:
                    scaleX = rightScale;
                    align = 'left';
                    break;
                case bottom:
                    scaleY = bottomScale;
                    align = 'top';
                    break;
                case left$1:
                    scaleX = leftScale;
                    align = 'right';
                    break;
                case topLeft:
                    scaleY = topScale;
                    scaleX = leftScale;
                    align = 'bottom-right';
                    break;
                case topRight:
                    scaleY = topScale;
                    scaleX = rightScale;
                    align = 'bottom-left';
                    break;
                case bottomRight:
                    scaleY = bottomScale;
                    scaleX = rightScale;
                    align = 'top-left';
                    break;
                case bottomLeft:
                    scaleY = bottomScale;
                    scaleX = leftScale;
                    align = 'top-right';
            }
            if (lockRatio) {
                const unlockSide = lockRatio === 'corner' && direction % 2;
                if (!unlockSide) {
                    let scale;
                    switch (direction) {
                        case top:
                        case bottom:
                            scale = scaleY;
                            break;
                        case left$1:
                        case right$1:
                            scale = scaleX;
                            break;
                        default:
                            scale = Math.sqrt(Math.abs(scaleX * scaleY));
                    }
                    scaleX = scaleX < 0 ? -scale : scale;
                    scaleY = scaleY < 0 ? -scale : scale;
                }
            }
            scaleX /= changedScaleX;
            scaleY /= changedScaleY;
            if (!flipable) {
                const { worldTransform } = element;
                if (scaleX < 0)
                    scaleX = 1 / boxBounds.width / worldTransform.scaleX;
                if (scaleY < 0)
                    scaleY = 1 / boxBounds.height / worldTransform.scaleY;
            }
            if (widthRange) {
                const nowWidth = boxBounds.width * element.scaleX;
                scaleX = within(nowWidth * scaleX, widthRange) / nowWidth;
            }
            if (heightRange) {
                const nowHeight = boxBounds.height * element.scaleY;
                scaleY = within(nowHeight * scaleY, heightRange) / nowHeight;
            }
            toPoint(around || align, boxBounds, origin, true);
            return { origin, scaleX, scaleY, direction, lockRatio, around };
        },
        getRotateData(bounds, direction, current, last, around) {
            let align, origin = {};
            switch (direction) {
                case topLeft:
                    align = 'bottom-right';
                    break;
                case topRight:
                    align = 'bottom-left';
                    break;
                case bottomRight:
                    align = 'top-left';
                    break;
                case bottomLeft:
                    align = 'top-right';
                    break;
                default:
                    align = 'center';
            }
            toPoint(around || align, bounds, origin, true);
            return { origin, rotation: draw.PointHelper.getRotation(last, origin, current) };
        },
        getSkewData(bounds, direction, move, around) {
            let align, origin = {}, skewX = 0, skewY = 0;
            let last;
            switch (direction) {
                case top:
                    last = { x: 0.5, y: 0 };
                    align = 'bottom';
                    skewX = 1;
                    break;
                case bottom:
                    last = { x: 0.5, y: 1 };
                    align = 'top';
                    skewX = 1;
                    break;
                case left$1:
                    last = { x: 0, y: 0.5 };
                    align = 'right';
                    skewY = 1;
                    break;
                case right$1:
                    last = { x: 1, y: 0.5 };
                    align = 'left';
                    skewY = 1;
            }
            const { width, height } = bounds;
            last.x = last.x * width;
            last.y = last.y * height;
            toPoint(around || align, bounds, origin, true);
            const rotation = draw.PointHelper.getRotation(last, origin, { x: last.x + (skewX ? move.x : 0), y: last.y + (skewY ? move.y : 0) });
            skewX ? skewX = -rotation : skewY = rotation;
            return { origin, skewX, skewY };
        },
        getAround(around, altKey) {
            return (altKey && !around) ? 'center' : around;
        },
        getRotateDirection(direction, rotation, totalDirection = 8) {
            direction = (direction + Math.round(rotation / (360 / totalDirection))) % totalDirection;
            if (direction < 0)
                direction += totalDirection;
            return direction;
        },
        getFlipDirection(direction, flipedX, flipedY) {
            if (flipedX) {
                switch (direction) {
                    case left$1:
                        direction = right$1;
                        break;
                    case topLeft:
                        direction = topRight;
                        break;
                    case bottomLeft:
                        direction = bottomRight;
                        break;
                    case right$1:
                        direction = left$1;
                        break;
                    case topRight:
                        direction = topLeft;
                        break;
                    case bottomRight:
                        direction = bottomLeft;
                        break;
                }
            }
            if (flipedY) {
                switch (direction) {
                    case top:
                        direction = bottom;
                        break;
                    case topLeft:
                        direction = bottomLeft;
                        break;
                    case topRight:
                        direction = bottomRight;
                        break;
                    case bottom:
                        direction = top;
                        break;
                    case bottomLeft:
                        direction = topLeft;
                        break;
                    case bottomRight:
                        direction = topRight;
                        break;
                }
            }
            return direction;
        }
    };

    const cacheCursors = {};
    function updateCursor(editor, e) {
        const { editBox } = editor, point = editBox.enterPoint;
        if (!point || !editor.editing || !editBox.visible)
            return;
        if (point.name === 'circle')
            return;
        if (point.pointType === 'button') {
            if (!point.cursor)
                point.cursor = 'pointer';
            return;
        }
        let { rotation } = editBox;
        const { resizeCursor, rotateCursor, skewCursor, resizeable, rotateable, skewable } = editor.mergeConfig;
        const { pointType } = point, { flippedX, flippedY } = editBox;
        let showResize = pointType === 'resize';
        if (showResize && rotateable && (e.metaKey || e.ctrlKey || !resizeable))
            showResize = false;
        const showSkew = skewable && !showResize && point.name === 'resize-line';
        const cursor = showSkew ? skewCursor : (showResize ? resizeCursor : rotateCursor);
        rotation += (EditDataHelper.getFlipDirection(point.direction, flippedX, flippedY) + 1) * 45;
        rotation = Math.round(draw.MathHelper.formatRotation(rotation, true) / 2) * 2;
        const { url, x, y } = cursor;
        const key = url + rotation;
        if (cacheCursors[key]) {
            point.cursor = cacheCursors[key];
        }
        else {
            cacheCursors[key] = point.cursor = { url: toDataURL(url, rotation), x, y };
        }
    }
    function updateMoveCursor(editor) {
        const { moveCursor, moveable } = editor.mergeConfig;
        editor.editBox.rect.cursor = moveable ? moveCursor : undefined;
    }
    function toDataURL(svg, rotation) {
        return '"data:image/svg+xml,' + encodeURIComponent(svg.replace('{{rotation}}', rotation.toString())) + '"';
    }

    class EditPoint extends draw.Box {
    }

    const fourDirection = ['top', 'right', 'bottom', 'left'];
    class EditBox extends draw.Group {
        get flipped() { return this.flippedX || this.flippedY; }
        get flippedX() { return this.scaleX < 0; }
        get flippedY() { return this.scaleY < 0; }
        get flippedOne() { return this.scaleX * this.scaleY < 0; }
        constructor(editor) {
            super();
            this.view = new draw.Group();
            this.rect = new draw.Box({ name: 'rect', hitFill: 'all', hitStroke: 'none', strokeAlign: 'center', hitRadius: 5 });
            this.circle = new EditPoint({ name: 'circle', strokeAlign: 'center', around: 'center', cursor: 'crosshair', hitRadius: 5 });
            this.buttons = new draw.Group({ around: 'center', hitSelf: false });
            this.resizePoints = [];
            this.rotatePoints = [];
            this.resizeLines = [];
            this.__eventIds = [];
            this.editor = editor;
            this.visible = false;
            this.create();
            this.__listenEvents();
        }
        create() {
            let rotatePoint, resizeLine, resizePoint;
            const { view, resizePoints, rotatePoints, resizeLines, rect, circle, buttons } = this;
            const arounds = ['bottom-right', 'bottom', 'bottom-left', 'left', 'top-left', 'top', 'top-right', 'right'];
            for (let i = 0; i < 8; i++) {
                rotatePoint = new EditPoint({ name: 'rotate-point', around: arounds[i], width: 15, height: 15, hitFill: "all" });
                rotatePoints.push(rotatePoint);
                this.listenPointEvents(rotatePoint, 'rotate', i);
                if (i % 2) {
                    resizeLine = new EditPoint({ name: 'resize-line', around: 'center', width: 10, height: 10, hitFill: "all" });
                    resizeLines.push(resizeLine);
                    this.listenPointEvents(resizeLine, 'resize', i);
                }
                resizePoint = new EditPoint({ name: 'resize-point', hitRadius: 5 });
                resizePoints.push(resizePoint);
                this.listenPointEvents(resizePoint, 'resize', i);
            }
            this.listenPointEvents(circle, 'rotate', 2);
            view.addMany(...rotatePoints, rect, circle, buttons, ...resizeLines, ...resizePoints);
            this.add(view);
        }
        load() {
            const { mergeConfig, element, single } = this.editor;
            const { rect, circle, resizePoints } = this;
            const { stroke, strokeWidth } = mergeConfig;
            const pointsStyle = this.getPointsStyle();
            const middlePointsStyle = this.getMiddlePointsStyle();
            let resizeP;
            for (let i = 0; i < 8; i++) {
                resizeP = resizePoints[i];
                resizeP.set(this.getPointStyle((i % 2) ? middlePointsStyle[((i - 1) / 2) % middlePointsStyle.length] : pointsStyle[(i / 2) % pointsStyle.length]));
                if (!(i % 2))
                    resizeP.rotation = (i / 2) * 90;
            }
            circle.set(this.getPointStyle(mergeConfig.circle || mergeConfig.rotatePoint || pointsStyle[0]));
            rect.set(Object.assign({ stroke, strokeWidth }, (mergeConfig.rect || {})));
            rect.hittable = !single;
            rect.syncEventer = single && this.editor;
            if (single) {
                element.syncEventer = rect;
                this.app.interaction.bottomList = [{ target: rect, proxy: element }];
            }
        }
        update(bounds) {
            this.visible = !this.editor.element.locked;
            if (this.view.worldOpacity) {
                const { mergeConfig } = this.editor;
                const { width, height } = bounds;
                const { rect, circle, buttons, resizePoints, rotatePoints, resizeLines } = this;
                const { middlePoint, resizeable, rotateable, hideOnSmall } = mergeConfig;
                const smallSize = typeof hideOnSmall === 'number' ? hideOnSmall : 10;
                const showPoints = !(hideOnSmall && width < smallSize && height < smallSize);
                let point = {}, rotateP, resizeP, resizeL;
                for (let i = 0; i < 8; i++) {
                    draw.AroundHelper.toPoint(draw.AroundHelper.directionData[i], bounds, point);
                    resizeP = resizePoints[i];
                    rotateP = rotatePoints[i];
                    resizeL = resizeLines[Math.floor(i / 2)];
                    resizeP.set(point);
                    rotateP.set(point);
                    resizeL.set(point);
                    resizeP.visible = resizeL.visible = showPoints && !!(resizeable || rotateable);
                    rotateP.visible = showPoints && rotateable && resizeable && !mergeConfig.rotatePoint;
                    if (i % 2) {
                        resizeP.visible = rotateP.visible = showPoints && !!middlePoint;
                        if (((i + 1) / 2) % 2) {
                            resizeL.width = width;
                            if (resizeP.width > width - 30)
                                resizeP.visible = false;
                        }
                        else {
                            resizeL.height = height;
                            resizeP.rotation = 90;
                            if (resizeP.width > height - 30)
                                resizeP.visible = false;
                        }
                    }
                }
                circle.visible = showPoints && rotateable && !!(mergeConfig.circle || mergeConfig.rotatePoint);
                if (circle.visible)
                    this.layoutCircle(mergeConfig);
                if (rect.path)
                    rect.path = null;
                rect.set(Object.assign(Object.assign({}, bounds), { visible: true }));
                buttons.visible = showPoints && buttons.children.length > 0;
                if (buttons.visible)
                    this.layoutButtons(mergeConfig);
            }
        }
        layoutCircle(config) {
            const { circleDirection, circleMargin, buttonsMargin, buttonsDirection, middlePoint } = config;
            const direction = fourDirection.indexOf(circleDirection || ((this.buttons.children.length && buttonsDirection === 'bottom') ? 'top' : 'bottom'));
            this.setButtonPosition(this.circle, direction, circleMargin || buttonsMargin, !!middlePoint);
        }
        layoutButtons(config) {
            const { buttons } = this;
            const { buttonsDirection, buttonsFixed, buttonsMargin, middlePoint } = config;
            const { flippedX, flippedY } = this;
            let index = fourDirection.indexOf(buttonsDirection);
            if ((index % 2 && flippedX) || ((index + 1) % 2 && flippedY)) {
                if (buttonsFixed)
                    index = (index + 2) % 4;
            }
            const direction = buttonsFixed ? EditDataHelper.getRotateDirection(index, this.flippedOne ? this.rotation : -this.rotation, 4) : index;
            this.setButtonPosition(buttons, direction, buttonsMargin, !!middlePoint);
            if (buttonsFixed)
                buttons.rotation = (direction - index) * 90;
            buttons.scaleX = flippedX ? -1 : 1;
            buttons.scaleY = flippedY ? -1 : 1;
        }
        setButtonPosition(buttons, direction, buttonsMargin, useMiddlePoint) {
            const point = this.resizePoints[direction * 2 + 1];
            const useX = direction % 2;
            const sign = (!direction || direction === 3) ? -1 : 1;
            const useWidth = direction % 2;
            const margin = (buttonsMargin + (useWidth ? ((useMiddlePoint ? point.width : 0) + buttons.boxBounds.width) : ((useMiddlePoint ? point.height : 0) + buttons.boxBounds.height)) / 2) * sign;
            if (useX) {
                buttons.x = point.x + margin;
                buttons.y = point.y;
            }
            else {
                buttons.x = point.x;
                buttons.y = point.y + margin;
            }
        }
        unload() {
            this.visible = false;
        }
        getPointStyle(userStyle) {
            const { stroke, strokeWidth, pointFill, pointSize, pointRadius } = this.editor.mergeConfig;
            const defaultStyle = { fill: pointFill, stroke, strokeWidth, around: 'center', strokeAlign: 'center', width: pointSize, height: pointSize, cornerRadius: pointRadius };
            return userStyle ? Object.assign(defaultStyle, userStyle) : defaultStyle;
        }
        getPointsStyle() {
            const { point } = this.editor.mergeConfig;
            return point instanceof Array ? point : [point];
        }
        getMiddlePointsStyle() {
            const { middlePoint } = this.editor.mergeConfig;
            return middlePoint instanceof Array ? middlePoint : (middlePoint ? [middlePoint] : this.getPointsStyle());
        }
        onSelect(e) {
            if (e.oldList.length === 1) {
                e.oldList[0].syncEventer = null;
                if (this.app)
                    this.app.interaction.bottomList = null;
            }
        }
        onDragStart(e) {
            this.dragging = true;
            const { editor } = this;
            if (e.current.name === 'rect') {
                this.moving = true;
                editor.dragStartPoint = { x: editor.element.x, y: editor.element.y };
                editor.opacity = editor.mergeConfig.hideOnMove ? 0 : 1;
            }
            else if (e.current.pointType === 'resize') {
                editor.dragStartBounds = Object.assign({}, editor.element.getLayoutBounds('box', 'local'));
                editor.resizeDirection = e.current.direction;
            }
        }
        onDragEnd(e) {
            this.dragging = false;
            this.moving = false;
            if (e.current.name === 'rect')
                this.editor.opacity = 1;
            this.editor.resizeDirection = undefined;
        }
        onDrag(e) {
            const { editor } = this;
            const point = this.enterPoint = e.current;
            if (point.pointType === 'rotate' || e.metaKey || e.ctrlKey || !editor.mergeConfig.resizeable) {
                if (editor.mergeConfig.rotateable)
                    editor.onRotate(e);
            }
            else if (point.pointType === 'resize') {
                editor.onScale(e);
            }
            updateCursor(editor, e);
        }
        onArrow(e) {
            if (this.editor.editing && this.editor.mergeConfig.keyEvent) {
                const move = { x: 0, y: 0 };
                const distance = e.shiftKey ? 10 : 1;
                switch (e.code) {
                    case 'ArrowDown':
                        move.y = distance;
                        break;
                    case 'ArrowUp':
                        move.y = -distance;
                        break;
                    case 'ArrowLeft':
                        move.x = -distance;
                        break;
                    case 'ArrowRight':
                        move.x = distance;
                }
                this.editor.move(move);
            }
        }
        onDoubleTap(e) {
            if (this.editor.mergeConfig.openInner === 'double')
                this.openInner(e);
        }
        onLongPress(e) {
            if (this.editor.mergeConfig.openInner === 'long')
                this.openInner(e);
        }
        openInner(e) {
            const { editor } = this;
            if (editor.single) {
                const { element } = editor;
                if (element.isBranch) {
                    if (element.textBox) {
                        const find = element.children.find(item => item.editable && item instanceof draw.Text);
                        if (find)
                            return editor.openInnerEditor(find);
                    }
                    editor.openGroup(element);
                    editor.target = editor.selector.findDeepOne(e);
                }
                else {
                    editor.openInnerEditor();
                }
            }
        }
        listenPointEvents(point, type, direction) {
            const { editor } = this;
            point.direction = direction;
            point.pointType = type;
            point.on_(core.DragEvent.START, this.onDragStart, this);
            point.on_(core.DragEvent.DRAG, this.onDrag, this);
            point.on_(core.DragEvent.END, this.onDragEnd, this);
            point.on_(core.PointerEvent.LEAVE, () => this.enterPoint = null);
            if (point.name !== 'circle')
                point.on_(core.PointerEvent.ENTER, (e) => { this.enterPoint = point, updateCursor(editor, e); });
        }
        __listenEvents() {
            const { rect, editor } = this;
            this.__eventIds = [
                editor.on_(EditorEvent.SELECT, this.onSelect, this),
                rect.on_(core.DragEvent.START, this.onDragStart, this),
                rect.on_(core.DragEvent.DRAG, editor.onMove, editor),
                rect.on_(core.DragEvent.END, this.onDragEnd, this),
                rect.on_(core.PointerEvent.ENTER, () => updateMoveCursor(editor)),
                rect.on_(core.PointerEvent.DOUBLE_TAP, this.onDoubleTap, this),
                rect.on_(core.PointerEvent.LONG_PRESS, this.onLongPress, this)
            ];
        }
        __removeListenEvents() {
            this.off_(this.__eventIds);
            this.__eventIds.length = 0;
        }
        destroy() {
            this.editor = null;
            this.__removeListenEvents();
            super.destroy();
        }
    }

    class EditMask extends draw.UI {
        constructor(editor) {
            super();
            this.editor = editor;
            this.hittable = false;
        }
        __draw(canvas, options) {
            const { editor } = this;
            const { mask } = editor.mergeConfig;
            if (mask && editor.list.length) {
                const { rect } = editor.editBox;
                const { width, height } = rect.__;
                canvas.resetTransform();
                canvas.fillWorld(canvas.bounds, mask === true ? 'rgba(0,0,0,0.8)' : mask);
                canvas.setWorld(rect.__world, options.matrix);
                canvas.clearRect(0, 0, width, height);
            }
        }
        destroy() {
            this.editor = null;
            super.destroy();
        }
    }

    const filterStyle = `
<feOffset dy="1"/>
<feGaussianBlur stdDeviation="1.5"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0"/>
<feBlend mode="normal" in="SourceGraphic" result="shape"/>`;
    const resizeSVG = `
<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
<g filter="url(#f)">
<g transform="rotate({{rotation}},12,12)">
<path d="M7.5 8.0H8.5V5.9L6.8 7.2L7.5 8.0ZM3 11.4L2.3 10.6L1.3 11.4L2.3 12.2L3 11.4ZM7.5 10.4H6.5V11.4H7.5V10.4ZM16.5 10.4V11.4H17.5V10.4H16.5ZM16.5 8.0L17.1 7.2L15.5 5.9V8.0H16.5ZM21 11.4L21.6 12.2L22.6 11.4L21.6 10.6L21 11.4ZM16.5 14.9H15.5V16.9L17.1 15.7L16.5 14.9ZM16.5 12.4H17.5V11.4H16.5V12.4ZM7.5 12.4V11.4H6.5V12.4H7.5ZM7.5 14.9L6.8 15.7L8.5 16.9V14.9H7.5ZM6.8 7.2L2.3 10.6L3.6 12.2L8.1 8.7L6.8 7.2ZM8.5 10.4V8.0H6.5V10.4H8.5ZM16.5 9.4H7.5V11.4H16.5V9.4ZM17.5 10.4V8.0H15.5V10.4H17.5ZM15.8 8.7L20.3 12.2L21.6 10.6L17.1 7.2L15.8 8.7ZM20.3 10.6L15.8 14.1L17.1 15.7L21.6 12.2L20.3 10.6ZM17.5 14.9V12.4H15.5V14.9H17.5ZM7.5 13.4H16.5V11.4H7.5V13.4ZM8.5 14.9V12.4H6.5V14.9H8.5ZM2.3 12.2L6.8 15.7L8.1 14.1L3.6 10.6L2.3 12.2Z" fill="white"/>
<path fill-rule="evenodd" d="M3 11.4L7.5 8.0V10.4H16.5V8.0L21 11.4L16.5 14.9V12.4H7.5V14.9L3 11.4Z" fill="black"/>
</g>
</g>
<defs>
<filter id="f" x="-1.6" y="3.9" width="27.2" height="16.9" filterUnits="userSpaceOnUse">
${filterStyle}
</filter>
</defs>
</svg>
`;
    const rotateSVG = `
<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
<g filter="url(#f)">
<g transform="rotate(135,12,12),rotate({{rotation}},12,12)">
<path d="M20.4 8H21.4L20.8 7.1L17.3 2.6L17 2.1L16.6 2.6L13.1 7.1L12.5 8H13.5H15.4C14.9 11.8 11.8 14.9 8 15.4V13.5V12.5L7.1 13.1L2.6 16.6L2.1 17L2.6 17.3L7.1 20.8L8 21.4V20.4V18.4C13.5 17.9 17.9 13.5 18.4 8H20.4Z" stroke="white"/>
<path fill-rule="evenodd" d="M17 3L20.4 7.5H17.9C17.7 13.1 13.1 17.7 7.5 17.9V20.4L3 17L7.5 13.5V15.9C12.0 15.7 15.7 12.0 15.9 7.5H13.5L17 3Z" fill="black"/>
</g>
</g>
<defs>
<filter id="f" x="-1.6" y="-0.6" width="27.1" height="27.1" filterUnits="userSpaceOnUse">
${filterStyle}
</filter>
</defs>
</svg>
`;
    const skewSVG = `
<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
<g filter="url(#f)">
<g transform="rotate(90,12,12),rotate({{rotation}},12,12)">
<path d="M21 10.4L21 11.4L23.8 11.4L21.6 9.6L21 10.4ZM17 10.4V11.4L17 11.4L17 10.4ZM15.5 6L16.1 5.2L14.5 3.9V6H15.5ZM15.5 8.4V9.4H16.5V8.4H15.5ZM6 8.4V7.4H5V8.4H6ZM6 10.4H5V11.4H6V10.4ZM7 14.4V13.4L7 13.4L7 14.4ZM3 14.4L3 13.4L0.1 13.4L2.3 15.2L3 14.4ZM8.5 18.9L7.8 19.7L9.5 21.0V18.9H8.5ZM8.5 16.4V15.4H7.5V16.4H8.5ZM19 16.4V17.4H20V16.4H19ZM19 14.4H20V13.4H19V14.4ZM21 9.4L17 9.4L17 11.4L21 11.4L21 9.4ZM14.8 6.7L20.3 11.2L21.6 9.6L16.1 5.2L14.8 6.7ZM16.5 8.4V6H14.5V8.4H16.5ZM6 9.4H15.5V7.4H6V9.4ZM7 10.4V8.4H5V10.4H7ZM15.5 9.4H6V11.4H15.5V9.4ZM17 9.4H15.5V11.4H17V9.4ZM7 15.4H8.5V13.4H7V15.4ZM3 15.4L7 15.4L7 13.4L3 13.4L3 15.4ZM9.1 18.1L3.6 13.6L2.3 15.2L7.8 19.7L9.1 18.1ZM7.5 16.4V18.9H9.5V16.4H7.5ZM19 15.4H8.5V17.4H19V15.4ZM18 14.4V16.4H20V14.4H18ZM8.5 15.4H19V13.4H8.5V15.4Z" fill="white"/>
<path fill-rule="evenodd" d="M17 10.4L21 10.4L15.5 6V8.4H6V10.4H15.5H17ZM8.5 14.4H7L3 14.4L8.5 18.9V16.4H19V14.4H8.5Z" fill="black"/>
</g>
</g>
<defs>
<filter x="-2.8" y="1.9" width="29.6" height="23.1" filterUnits="userSpaceOnUse" >
${filterStyle}
</filter>
</defs>
</svg>
`;

    const config = {
        editSize: 'size',
        keyEvent: true,
        stroke: '#836DFF',
        strokeWidth: 2,
        pointFill: '#FFFFFF',
        pointSize: 10,
        pointRadius: 16,
        rotateGap: 45,
        buttonsDirection: 'bottom',
        buttonsMargin: 12,
        hideOnSmall: true,
        moveCursor: 'move',
        resizeCursor: { url: resizeSVG, x: 12, y: 12 },
        rotateCursor: { url: rotateSVG, x: 12, y: 12 },
        skewCursor: { url: skewSVG, x: 12, y: 12 },
        selector: true,
        hover: true,
        select: 'press',
        openInner: 'double',
        boxSelect: true,
        moveable: true,
        resizeable: true,
        flipable: true,
        rotateable: true,
        skewable: true
    };

    const bounds = new draw.Bounds();
    function simulate(editor) {
        const { simulateTarget, list } = editor;
        const { zoomLayer } = list[0].leafer.zoomLayer;
        simulateTarget.safeChange(() => simulateTarget.reset(bounds.setListWithFn(list, (leaf) => leaf.getBounds('box', 'page')).get()));
        zoomLayer.add(simulateTarget);
    }

    function onTarget(editor, oldValue) {
        const { target } = editor;
        if (target) {
            editor.leafList = target instanceof draw.LeafList ? target : new draw.LeafList(target instanceof Array ? target : target);
        }
        else {
            editor.simulateTarget.remove();
            editor.leafList.reset();
            editor.closeInnerEditor();
        }
        editor.emitEvent(new EditorEvent(EditorEvent.SELECT, { editor, value: target, oldValue }));
        editor.checkOpenedGroups();
        if (editor.editing) {
            editor.waitLeafer(() => {
                if (editor.multiple)
                    simulate(editor);
                updateMoveCursor(editor);
                editor.updateEditTool();
                editor.update();
                editor.listenTargetEvents();
            });
        }
        else {
            editor.updateEditTool();
            editor.removeTargetEvents();
        }
    }
    function onHover(editor, oldValue) {
        editor.emitEvent(new EditorEvent(EditorEvent.HOVER, { editor, value: editor.hoverTarget, oldValue }));
    }

    const order = (a, b) => a.parent.children.indexOf(a) - b.parent.children.indexOf(b);
    const reverseOrder = (a, b) => b.parent.children.indexOf(b) - a.parent.children.indexOf(a);
    const EditorHelper = {
        group(list, element, userGroup) {
            list.sort(reverseOrder);
            const { app, parent } = list[0];
            let group;
            if (userGroup && userGroup.add) {
                group = userGroup;
            }
            else {
                group = new draw.Group(userGroup);
            }
            parent.addAt(group, parent.children.indexOf(list[0]));
            list.sort(order);
            const matrx = new draw.Matrix(element.worldTransform);
            matrx.divideParent(parent.worldTransform);
            group.setTransform(matrx);
            group.editable = true;
            group.hitChildren = false;
            app.lockLayout();
            list.forEach(child => child.dropTo(group));
            app.unlockLayout();
            return group;
        },
        ungroup(list) {
            const { app } = list[0];
            const ungroupList = [];
            app.lockLayout();
            list.forEach(leaf => {
                if (leaf.isBranch && !leaf.isBranchLeaf) {
                    const { parent, children } = leaf;
                    while (children.length) {
                        ungroupList.push(children[0]);
                        children[0].dropTo(parent, parent.children.indexOf(leaf));
                    }
                    leaf.remove();
                }
                else {
                    ungroupList.push(leaf);
                }
            });
            app.unlockLayout();
            return ungroupList;
        },
        toTop(list) {
            list.sort(order);
            list.forEach(leaf => {
                if (leaf.parent)
                    leaf.parent.add(leaf);
            });
        },
        toBottom(list) {
            list.sort(reverseOrder);
            list.forEach(leaf => {
                if (leaf.parent)
                    leaf.parent.addAt(leaf, 0);
            });
        }
    };

    const debug = draw.Debug.get('EditToolCreator');
    function registerEditTool() {
        return (target) => {
            EditToolCreator.register(target);
        };
    }
    const registerInnerEditor = registerEditTool;
    const EditToolCreator = {
        list: {},
        register(EditTool) {
            const { tag } = EditTool.prototype;
            list[tag] ? debug.repeat(tag) : (list[tag] = EditTool);
        },
        get(tag, editor) {
            return new list[tag](editor);
        }
    };
    const { list } = EditToolCreator;

    class InnerEditorEvent extends EditorEvent {
        constructor(type, data) {
            super(type, data);
        }
    }
    InnerEditorEvent.BEFORE_OPEN = 'innerEditor.before_open';
    InnerEditorEvent.OPEN = 'innerEditor.open';
    InnerEditorEvent.BEFORE_CLOSE = 'innerEditor.before_close';
    InnerEditorEvent.CLOSE = 'innerEditor.close';

    class EditorGroupEvent extends EditorEvent {
        constructor(type, data) {
            super(type, data);
        }
    }
    EditorGroupEvent.GROUP = 'editor.group';
    EditorGroupEvent.BEFORE_UNGROUP = 'editor.before_ungroup';
    EditorGroupEvent.UNGROUP = 'editor.ungroup';
    EditorGroupEvent.OPEN = 'editor.open_group';
    EditorGroupEvent.CLOSE = 'editor.close_group';

    const { updateMatrix } = draw.LeafHelper;
    const checkMap = { x: 1, y: 1, scaleX: 1, scaleY: 1, rotation: 1, skewX: 1, skewY: 1 }, origin = 'top-left';
    class SimulateElement extends draw.Rect {
        get __tag() { return 'SimulateElement'; }
        constructor(editor) {
            super();
            this.checkChange = true;
            this.canChange = true;
            this.visible = this.hittable = false;
            this.on(draw.PropertyEvent.CHANGE, (event) => {
                if (this.checkChange && checkMap[event.attrName]) {
                    const { attrName, newValue, oldValue } = event;
                    const addValue = attrName[0] === 's' ? (newValue || 1) / (oldValue || 1) : (newValue || 0) - (oldValue || 0);
                    this.canChange = false;
                    const data = this.__;
                    data[attrName] = oldValue;
                    updateMatrix(this.parent);
                    updateMatrix(this);
                    const oldMatrix = new draw.Matrix(this.__world);
                    data[attrName] = newValue;
                    this.__layout.rotationChange();
                    updateMatrix(this);
                    this.changedTransform = new draw.Matrix(this.__world).divide(oldMatrix);
                    switch (attrName) {
                        case 'x':
                            editor.move(addValue, 0);
                            break;
                        case 'y':
                            editor.move(0, addValue);
                            break;
                        case 'rotation':
                            editor.rotateOf(origin, addValue);
                            break;
                        case 'scaleX':
                            editor.scaleOf(origin, addValue, 1);
                            break;
                        case 'scaleY':
                            editor.scaleOf(origin, 1, addValue);
                            break;
                        case 'skewX':
                            editor.skewOf(origin, addValue, 0);
                            break;
                        case 'skewY':
                            editor.skewOf(origin, 0, addValue);
                    }
                    this.canChange = true;
                }
            });
        }
        safeChange(changeFn) {
            if (this.canChange) {
                this.checkChange = false;
                changeFn();
                this.checkChange = true;
            }
        }
    }

    class Editor extends draw.Group {
        get mergeConfig() {
            const { element, config } = this;
            return this.single && element.editConfig ? Object.assign(Object.assign({}, config), element.editConfig) : config;
        }
        get list() { return this.leafList.list; }
        get dragHoverExclude() { return [this.editBox.rect]; }
        get editing() { return !!this.list.length; }
        get groupOpening() { return !!this.openedGroupList.length; }
        get multiple() { return this.list.length > 1; }
        get single() { return this.list.length === 1; }
        get dragging() { return this.editBox.dragging; }
        get moving() { return this.editBox.moving; }
        get element() { return this.multiple ? this.simulateTarget : this.list[0]; }
        get buttons() { return this.editBox.buttons; }
        constructor(userConfig, data) {
            super(data);
            this.config = draw.DataHelper.clone(config);
            this.leafList = new draw.LeafList();
            this.openedGroupList = new draw.LeafList();
            this.simulateTarget = new SimulateElement(this);
            this.editBox = new EditBox(this);
            this.editToolList = {};
            this.selector = new EditSelect(this);
            this.editMask = new EditMask(this);
            this.targetEventIds = [];
            if (userConfig)
                this.config = draw.DataHelper.default(userConfig, this.config);
            this.addMany(this.editMask, this.selector, this.editBox);
        }
        select(target) {
            this.target = target;
        }
        cancel() {
            this.target = null;
        }
        hasItem(item) {
            return this.leafList.has(item);
        }
        addItem(item) {
            if (!this.hasItem(item) && !item.locked)
                this.leafList.add(item), this.target = this.leafList.list;
        }
        removeItem(item) {
            if (this.hasItem(item))
                this.leafList.remove(item), this.target = this.leafList.list;
        }
        shiftItem(item) {
            this.hasItem(item) ? this.removeItem(item) : this.addItem(item);
        }
        update() {
            if (this.editing) {
                if (this.innerEditing)
                    this.innerEditor.update();
                this.editTool.update();
                this.selector.update();
            }
        }
        updateEditBox() {
            if (this.multiple)
                simulate(this);
            this.update();
        }
        updateEditTool() {
            const tool = this.editTool;
            if (tool) {
                this.editBox.unload();
                tool.unload();
                this.editTool = null;
            }
            if (this.editing) {
                const tag = this.single ? this.list[0].editOuter : 'EditTool';
                this.editTool = this.editToolList[tag] = this.editToolList[tag] || EditToolCreator.get(tag, this);
                this.editBox.load();
                this.editTool.load();
            }
        }
        getEditSize(_ui) {
            return this.mergeConfig.editSize;
        }
        onMove(e) {
            if (e instanceof core.MoveEvent) {
                if (e.moveType !== 'drag') {
                    const { moveable, resizeable } = this.mergeConfig;
                    const move = e.getLocalMove(this.element);
                    if (moveable === 'move')
                        e.stop(), this.move(move.x, move.y);
                    else if (resizeable === 'zoom')
                        e.stop();
                }
            }
            else {
                const total = { x: e.totalX, y: e.totalY };
                if (e.shiftKey) {
                    if (Math.abs(total.x) > Math.abs(total.y))
                        total.y = 0;
                    else
                        total.x = 0;
                }
                this.move(core.DragEvent.getValidMove(this.element, this.dragStartPoint, total));
            }
        }
        onScale(e) {
            const { element } = this;
            let { around, lockRatio, resizeable, flipable, editSize } = this.mergeConfig;
            if (e instanceof core.ZoomEvent) {
                if (resizeable === 'zoom')
                    e.stop(), this.scaleOf(element.getBoxPoint(e), e.scale, e.scale);
            }
            else {
                const { direction } = e.current;
                if (e.shiftKey || element.lockRatio)
                    lockRatio = true;
                const data = EditDataHelper.getScaleData(element, this.dragStartBounds, direction, e.getInnerTotal(element), lockRatio, EditDataHelper.getAround(around, e.altKey), flipable, this.multiple || editSize === 'scale');
                if (this.editTool.onScaleWithDrag) {
                    data.drag = e;
                    this.scaleWithDrag(data);
                }
                else {
                    this.scaleOf(data.origin, data.scaleX, data.scaleY);
                }
            }
        }
        onRotate(e) {
            const { skewable, rotateable, around, rotateGap } = this.mergeConfig;
            const { direction, name } = e.current;
            if (skewable && name === 'resize-line')
                return this.onSkew(e);
            const { element } = this;
            let origin, rotation;
            if (e instanceof core.RotateEvent) {
                if (rotateable === 'rotate')
                    e.stop(), rotation = e.rotation, origin = element.getBoxPoint(e);
                else
                    return;
            }
            else {
                const last = { x: e.x - e.moveX, y: e.y - e.moveY };
                const data = EditDataHelper.getRotateData(element.boxBounds, direction, e.getBoxPoint(element), element.getBoxPoint(last), e.shiftKey ? null : (element.around || element.origin || around || 'center'));
                rotation = data.rotation;
                origin = data.origin;
            }
            rotation = draw.MathHelper.getGapRotation(rotation, rotateGap, element.rotation);
            if (!rotation)
                return;
            if (element.scaleX * element.scaleY < 0)
                rotation = -rotation;
            this.rotateOf(origin, draw.MathHelper.float(rotation, 2));
        }
        onSkew(e) {
            const { element } = this;
            const { around } = this.mergeConfig;
            const { origin, skewX, skewY } = EditDataHelper.getSkewData(element.boxBounds, e.current.direction, e.getInnerMove(element), EditDataHelper.getAround(around, e.altKey));
            if (!skewX && !skewY)
                return;
            this.skewOf(origin, skewX, skewY);
        }
        move(x, y = 0) {
            if (!this.checkTransform('moveable'))
                return;
            const { element } = this;
            const world = element.getWorldPointByLocal(typeof x === 'object' ? Object.assign({}, x) : { x, y }, null, true);
            if (this.multiple)
                element.safeChange(() => element.move(x, y));
            const event = new EditorMoveEvent(EditorMoveEvent.MOVE, { target: element, editor: this, moveX: world.x, moveY: world.y });
            this.editTool.onMove(event);
            this.emitEvent(event);
        }
        scaleWithDrag(data) {
            if (!this.checkTransform('resizeable'))
                return;
            const { element } = this;
            const event = new EditorScaleEvent(EditorScaleEvent.SCALE, Object.assign(Object.assign({}, data), { target: element, editor: this, worldOrigin: element.getWorldPoint(data.origin) }));
            this.editTool.onScaleWithDrag(event);
            this.emitEvent(event);
        }
        scaleOf(origin, scaleX, scaleY = scaleX, _resize) {
            if (!this.checkTransform('resizeable'))
                return;
            const { element } = this;
            const worldOrigin = this.getWorldOrigin(origin);
            const transform = this.multiple && this.getChangedTransform(() => element.safeChange(() => element.scaleOf(origin, scaleX, scaleY)));
            const event = new EditorScaleEvent(EditorScaleEvent.SCALE, { target: element, editor: this, worldOrigin, scaleX, scaleY, transform });
            this.editTool.onScale(event);
            this.emitEvent(event);
        }
        flip(axis) {
            if (!this.checkTransform('resizeable'))
                return;
            const { element } = this;
            const worldOrigin = this.getWorldOrigin('center');
            const transform = this.multiple ? this.getChangedTransform(() => element.safeChange(() => element.flip(axis))) : new draw.Matrix(draw.LeafHelper.getFlipTransform(element, axis));
            const event = new EditorScaleEvent(EditorScaleEvent.SCALE, { target: element, editor: this, worldOrigin, scaleX: axis === 'x' ? -1 : 1, scaleY: axis === 'y' ? -1 : 1, transform });
            this.editTool.onScale(event);
            this.emitEvent(event);
        }
        rotateOf(origin, rotation) {
            if (!this.checkTransform('rotateable'))
                return;
            const { element } = this;
            const worldOrigin = this.getWorldOrigin(origin);
            const transform = this.multiple && this.getChangedTransform(() => element.safeChange(() => element.rotateOf(origin, rotation)));
            const event = new EditorRotateEvent(EditorRotateEvent.ROTATE, { target: element, editor: this, worldOrigin, rotation, transform });
            this.editTool.onRotate(event);
            this.emitEvent(event);
        }
        skewOf(origin, skewX, skewY = 0, _resize) {
            if (!this.checkTransform('skewable'))
                return;
            const { element } = this;
            const worldOrigin = this.getWorldOrigin(origin);
            const transform = this.multiple && this.getChangedTransform(() => element.safeChange(() => element.skewOf(origin, skewX, skewY)));
            const event = new EditorSkewEvent(EditorSkewEvent.SKEW, { target: element, editor: this, worldOrigin, skewX, skewY, transform });
            this.editTool.onSkew(event);
            this.emitEvent(event);
        }
        checkTransform(type) { return this.element && !this.element.locked && this.mergeConfig[type]; }
        getWorldOrigin(origin) {
            return this.element.getWorldPoint(draw.LeafHelper.getInnerOrigin(this.element, origin));
        }
        getChangedTransform(func) {
            const { element } = this;
            if (this.multiple && !element.canChange)
                return element.changedTransform;
            const oldMatrix = new draw.Matrix(element.worldTransform);
            func();
            return new draw.Matrix(element.worldTransform).divide(oldMatrix);
        }
        group(userGroup) {
            if (this.multiple) {
                this.target = EditorHelper.group(this.list, this.element, userGroup);
                this.emitGroupEvent(EditorGroupEvent.GROUP, this.target);
            }
            return this.target;
        }
        ungroup() {
            const { list } = this;
            if (list.length) {
                list.forEach(item => item.isBranch && this.emitGroupEvent(EditorGroupEvent.BEFORE_UNGROUP, item));
                this.target = EditorHelper.ungroup(list);
                list.forEach(item => item.isBranch && this.emitGroupEvent(EditorGroupEvent.UNGROUP, item));
            }
            return this.list;
        }
        openGroup(group) {
            this.openedGroupList.add(group);
            group.hitChildren = true;
            this.emitGroupEvent(EditorGroupEvent.OPEN, group);
        }
        closeGroup(group) {
            this.openedGroupList.remove(group);
            group.hitChildren = false;
            this.emitGroupEvent(EditorGroupEvent.CLOSE, group);
        }
        checkOpenedGroups() {
            const opened = this.openedGroupList;
            if (opened.length) {
                let { list } = opened;
                if (this.editing)
                    list = [], opened.forEach(item => this.list.every(leaf => !draw.LeafHelper.hasParent(leaf, item)) && list.push(item));
                list.forEach(item => this.closeGroup(item));
            }
            if (this.editing && !this.selector.dragging)
                this.checkDeepSelect();
        }
        checkDeepSelect() {
            let parent, { list } = this;
            for (let i = 0; i < list.length; i++) {
                parent = list[i].parent;
                while (parent && !parent.hitChildren) {
                    this.openGroup(parent);
                    parent = parent.parent;
                }
            }
        }
        emitGroupEvent(type, group) {
            const event = new EditorGroupEvent(type, { editTarget: group });
            this.emitEvent(event);
            group.emitEvent(event);
        }
        openInnerEditor(target, select) {
            if (target && select)
                this.target = target;
            if (this.single) {
                const editTarget = target || this.element;
                const tag = editTarget.editInner;
                if (tag && EditToolCreator.list[tag]) {
                    this.editTool.unload();
                    this.innerEditing = true;
                    this.innerEditor = this.editToolList[tag] || EditToolCreator.get(tag, this);
                    this.innerEditor.editTarget = editTarget;
                    this.emitInnerEvent(InnerEditorEvent.BEFORE_OPEN);
                    this.innerEditor.load();
                    this.emitInnerEvent(InnerEditorEvent.OPEN);
                }
            }
        }
        closeInnerEditor() {
            if (this.innerEditing) {
                this.innerEditing = false;
                this.emitInnerEvent(InnerEditorEvent.BEFORE_CLOSE);
                this.innerEditor.unload();
                this.emitInnerEvent(InnerEditorEvent.CLOSE);
                this.editTool.load();
                this.innerEditor = null;
            }
        }
        emitInnerEvent(type) {
            const { innerEditor } = this;
            const { editTarget } = innerEditor;
            const event = new InnerEditorEvent(type, { editTarget, innerEditor });
            this.emitEvent(event);
            editTarget.emitEvent(event);
        }
        lock() {
            this.list.forEach(leaf => leaf.locked = true);
            this.update();
        }
        unlock() {
            this.list.forEach(leaf => leaf.locked = false);
            this.update();
        }
        toTop() {
            if (this.list.length) {
                EditorHelper.toTop(this.list);
                this.leafList.update();
            }
        }
        toBottom() {
            if (this.list.length) {
                EditorHelper.toBottom(this.list);
                this.leafList.update();
            }
        }
        listenTargetEvents() {
            if (!this.targetEventIds.length) {
                const { app, leafer } = this;
                this.targetEventIds = [
                    leafer.on_(draw.RenderEvent.START, this.update, this),
                    app.on_(draw.RenderEvent.CHILD_START, this.forceRender, this),
                    app.on_(core.MoveEvent.BEFORE_MOVE, this.onMove, this, true),
                    app.on_(core.ZoomEvent.BEFORE_ZOOM, this.onScale, this, true),
                    app.on_(core.RotateEvent.BEFORE_ROTATE, this.onRotate, this, true),
                    app.on_([core.KeyEvent.HOLD, core.KeyEvent.UP], (e) => { updateCursor(this, e); }),
                    app.on_(core.KeyEvent.DOWN, this.editBox.onArrow, this.editBox)
                ];
            }
        }
        removeTargetEvents() {
            const { targetEventIds } = this;
            if (targetEventIds.length) {
                this.off_(targetEventIds);
                targetEventIds.length = 0;
            }
        }
        destroy() {
            if (!this.destroyed) {
                this.target = this.hoverTarget = null;
                Object.values(this.editToolList).forEach(item => item.destroy());
                this.simulateTarget.destroy();
                this.editToolList = {};
                this.simulateTarget = this.editTool = this.innerEditor = null;
                super.destroy();
            }
        }
    }
    __decorate([
        targetAttr(onHover)
    ], Editor.prototype, "hoverTarget", void 0);
    __decorate([
        targetAttr(onTarget)
    ], Editor.prototype, "target", void 0);

    class InnerEditor {
        static registerInnerEditor() {
            EditToolCreator.register(this);
        }
        get tag() { return 'InnerEditor'; }
        get editBox() { return this.editor.editBox; }
        constructor(editor) {
            this.editor = editor;
            this.create();
        }
        onCreate() { }
        create() {
            this.view = new draw.Group();
            this.onCreate();
        }
        onLoad() { }
        load() {
            const { editor } = this;
            if (editor) {
                if (editor.app)
                    editor.selector.hittable = editor.app.tree.hitChildren = false;
                this.onLoad();
            }
        }
        onUpdate() { }
        update() { this.onUpdate(); }
        onUnload() { }
        unload() {
            const { editor } = this;
            if (editor) {
                if (editor.app)
                    editor.selector.hittable = editor.app.tree.hitChildren = true;
                this.onUnload();
            }
        }
        onDestroy() { }
        destroy() {
            this.onDestroy();
            if (this.editor) {
                if (this.view)
                    this.view.destroy();
                if (this.eventIds)
                    this.editor.off_(this.eventIds);
                this.editor = this.view = this.eventIds = null;
            }
        }
    }

    exports.EditTool = class EditTool extends InnerEditor {
        static registerEditTool() {
            EditToolCreator.register(this);
        }
        get tag() { return 'EditTool'; }
        onMove(e) {
            const { moveX, moveY, editor } = e;
            const { app, list } = editor;
            app.lockLayout();
            list.forEach(target => {
                target.moveWorld(moveX, moveY);
            });
            app.unlockLayout();
        }
        onScale(e) {
            const { scaleX, scaleY, transform, worldOrigin, editor } = e;
            const { app, list } = editor;
            app.lockLayout();
            list.forEach(target => {
                const resize = editor.getEditSize(target) !== 'scale';
                if (transform) {
                    target.transformWorld(transform, resize);
                }
                else {
                    target.scaleOfWorld(worldOrigin, scaleX, scaleY, resize);
                }
            });
            app.unlockLayout();
        }
        onRotate(e) {
            const { rotation, transform, worldOrigin, editor } = e;
            const { app, list } = editor;
            app.lockLayout();
            list.forEach(target => {
                const resize = editor.getEditSize(target) !== 'scale';
                if (transform) {
                    target.transformWorld(transform, resize);
                }
                else {
                    target.rotateOfWorld(worldOrigin, rotation);
                }
            });
            app.unlockLayout();
        }
        onSkew(e) {
            const { skewX, skewY, transform, worldOrigin, editor } = e;
            const { app, list } = editor;
            app.lockLayout();
            list.forEach(target => {
                const resize = editor.getEditSize(target) !== 'scale';
                if (transform) {
                    target.transformWorld(transform, resize);
                }
                else {
                    target.skewOfWorld(worldOrigin, skewX, skewY, resize);
                }
            });
            app.unlockLayout();
        }
        load() {
            this.editBox.view.visible = true;
            this.onLoad();
        }
        update() {
            const { editor, editBox } = this;
            const { x, y, scaleX, scaleY, rotation, skewX, skewY, width, height } = editor.element.getLayoutBounds('box', editor, true);
            editBox.set({ x, y, scaleX, scaleY, rotation, skewX, skewY });
            editBox.update({ x: 0, y: 0, width, height });
            this.onUpdate();
        }
        unload() {
            this.editBox.view.visible = false;
            this.onUnload();
        }
    };
    exports.EditTool = __decorate([
        registerEditTool()
    ], exports.EditTool);

    const { left, right } = draw.Direction9;
    const { move, copy, toNumberPoints } = draw.PointHelper;
    exports.LineEditTool = class LineEditTool extends exports.EditTool {
        constructor() {
            super(...arguments);
            this.scaleOfEvent = true;
        }
        get tag() { return 'LineEditTool'; }
        onScaleWithDrag(e) {
            const { drag, direction, lockRatio, around } = e;
            const line = e.target;
            const isDragFrom = direction === left;
            if (line.pathInputed) {
                const { path } = line.__;
                const { from, to } = this.getFromToByPath(path);
                this.dragPoint(from, to, isDragFrom, around, this.getInnerMove(line, drag, lockRatio));
                path[1] = from.x, path[2] = from.y;
                path[4] = to.x, path[5] = to.y;
                line.path = path;
            }
            else if (line.points) {
                const { points } = line;
                const { from, to } = this.getFromToByPoints(points);
                this.dragPoint(from, to, isDragFrom, around, this.getInnerMove(line, drag, lockRatio));
                points[0] = from.x, points[1] = from.y;
                points[2] = to.x, points[3] = to.y;
                line.points = points;
            }
            else {
                const from = draw.getPointData();
                const { toPoint } = line;
                line.rotation = 0;
                this.dragPoint(from, toPoint, isDragFrom, around, this.getInnerMove(line, drag, lockRatio));
                line.getLocalPointByInner(from, null, null, true);
                line.getLocalPointByInner(toPoint, null, null, true);
                line.x = from.x;
                line.y = from.y;
                line.getInnerPointByLocal(toPoint, null, null, true);
                line.toPoint = toPoint;
            }
        }
        getInnerMove(ui, event, lockRatio) {
            const movePoint = event.getInnerMove(ui);
            if (lockRatio)
                Math.abs(movePoint.x) > Math.abs(movePoint.y) ? movePoint.y = 0 : movePoint.x = 0;
            return movePoint;
        }
        getFromToByPath(path) {
            return {
                from: { x: path[1], y: path[2] },
                to: { x: path[4], y: path[5] }
            };
        }
        getFromToByPoints(originPoints) {
            const points = toNumberPoints(originPoints);
            return {
                from: { x: points[0], y: points[1] },
                to: { x: points[2], y: points[3] }
            };
        }
        dragPoint(fromPoint, toPoint, isDragFrom, around, movePoint) {
            const { x, y } = movePoint;
            if (isDragFrom) {
                move(fromPoint, x, y);
                if (around)
                    move(toPoint, -x, -y);
            }
            else {
                if (around)
                    move(fromPoint, -x, -y);
                move(toPoint, x, y);
            }
        }
        onSkew(_e) {
        }
        onUpdate() {
            const { editBox } = this, { rotatePoints, resizeLines, resizePoints, rect } = editBox;
            const line = this.editor.element;
            let fromTo, leftOrRight;
            if (line.pathInputed)
                fromTo = this.getFromToByPath(line.__.path);
            else if (line.points)
                fromTo = this.getFromToByPoints(line.__.points);
            if (fromTo) {
                const { from, to } = fromTo;
                line.innerToWorld(from, from, false, editBox);
                line.innerToWorld(to, to, false, editBox);
                rect.pen.clearPath().moveTo(from.x, from.y).lineTo(to.x, to.y);
                copy(resizePoints[7], from);
                copy(rotatePoints[7], from);
                copy(resizePoints[3], to);
                copy(rotatePoints[3], to);
            }
            for (let i = 0; i < 8; i++) {
                if (i < 4)
                    resizeLines[i].visible = false;
                leftOrRight = i === left || i === right;
                resizePoints[i].visible = leftOrRight;
                rotatePoints[i].visible = fromTo ? false : leftOrRight;
            }
        }
    };
    exports.LineEditTool = __decorate([
        registerEditTool()
    ], exports.LineEditTool);

    draw.Creator.editor = function (options) { return new Editor(options); };
    draw.defineKey(draw.UI.prototype, 'editOuter', {
        get() { return this.__.__isLinePath ? 'LineEditTool' : 'EditTool'; }
    });
    draw.defineKey(draw.UI.prototype, 'editInner', {
        get() { return 'PathEditor'; }
    });
    draw.defineKey(draw.Text.prototype, 'editInner', {
        get() { return 'TextEditor'; }
    });
    draw.UI.setEditConfig = function (config) {
        draw.defineKey(this.prototype, 'editConfig', {
            get() { return typeof config === 'function' ? config(this) : config; }
        });
    };
    draw.UI.setEditOuter = function (toolName) {
        draw.defineKey(this.prototype, 'editOuter', {
            get() { return typeof toolName === 'string' ? toolName : toolName(this); }
        });
    };
    draw.UI.setEditInner = function (editorName) {
        draw.defineKey(this.prototype, 'editInner', {
            get() { return typeof editorName === 'string' ? editorName : editorName(this); }
        });
    };

    exports.EditBox = EditBox;
    exports.EditDataHelper = EditDataHelper;
    exports.EditPoint = EditPoint;
    exports.EditSelect = EditSelect;
    exports.EditSelectHelper = EditSelectHelper;
    exports.EditToolCreator = EditToolCreator;
    exports.Editor = Editor;
    exports.EditorEvent = EditorEvent;
    exports.EditorGroupEvent = EditorGroupEvent;
    exports.EditorHelper = EditorHelper;
    exports.EditorMoveEvent = EditorMoveEvent;
    exports.EditorRotateEvent = EditorRotateEvent;
    exports.EditorScaleEvent = EditorScaleEvent;
    exports.EditorSkewEvent = EditorSkewEvent;
    exports.InnerEditor = InnerEditor;
    exports.InnerEditorEvent = InnerEditorEvent;
    exports.PathScaler = PathScaler;
    exports.SelectArea = SelectArea;
    exports.Stroker = Stroker;
    exports.registerEditTool = registerEditTool;
    exports.registerInnerEditor = registerInnerEditor;
    exports.scaleResize = scaleResize;
    exports.scaleResizeFontSize = scaleResizeFontSize;
    exports.scaleResizeGroup = scaleResizeGroup;
    exports.scaleResizePath = scaleResizePath;
    exports.scaleResizePoints = scaleResizePoints;

    return exports;

})({}, LeaferUI, LeaferUI);

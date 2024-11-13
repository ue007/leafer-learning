this.LeaferIN = this.LeaferIN || {};
this.LeaferIN.scroll = (function (exports, draw, core) {
    'use strict';

    class ScrollBar extends draw.Group {
        get isOutside() { return true; }
        constructor(target, userConfig) {
            super();
            this.config = {
                theme: 'light',
                padding: 0,
                minSize: 10
            };
            if (target.isApp) {
                target.sky.add(this);
                target = target.tree;
            }
            this.target = target;
            if (userConfig)
                draw.DataHelper.assign(this.config, userConfig);
            this.changeTheme(this.config.theme);
            this.waitLeafer(this.__listenEvents, this);
        }
        changeTheme(theme) {
            let style;
            if (typeof theme === 'string') {
                style = { fill: 'black', stroke: 'rgba(255,255,255,0.8)' };
                if (theme === 'dark') {
                    style.fill = 'white';
                    style.stroke = 'rgba(0,0,0,0.2)';
                }
            }
            else {
                style = theme;
            }
            if (!this.scrollXBar)
                this.addMany(this.scrollXBar = new draw.Box(), this.scrollYBar = new draw.Box());
            style = Object.assign({ strokeAlign: 'center', opacity: 0.5, width: 6, cornerRadius: 3, hoverStyle: { opacity: 0.6 }, pressStyle: { opacity: 0.7 } }, style);
            if (!style.height)
                style.height = style.width;
            this.scrollXBar.set(Object.assign(Object.assign({}, style), { visible: false }));
            this.scrollYBar.set(Object.assign(Object.assign({}, style), { visible: false }));
            if (this.leafer)
                this.update();
        }
        update(check) {
            if (this.dragScrolling)
                return;
            const { minSize, padding } = this.config;
            const { zoomLayer, canvas } = this.target.leafer;
            const { worldRenderBounds } = zoomLayer;
            if (check && this.scrollBounds && this.scrollBounds.isSame(worldRenderBounds))
                return;
            this.scrollBounds = new draw.Bounds(worldRenderBounds);
            const bounds = canvas.bounds.clone().shrink(padding);
            const totalBounds = bounds.clone().add(worldRenderBounds);
            const ratioX = this.ratioX = bounds.width / totalBounds.width;
            const ratioY = this.ratioY = bounds.height / totalBounds.height;
            const scrollRatioX = (bounds.x - totalBounds.x) / totalBounds.width;
            const scrollRatioY = (bounds.y - totalBounds.y) / totalBounds.height;
            const showScrollXBar = ratioX < 1;
            const showScrollYBar = ratioY < 1;
            const { scrollXBar, scrollYBar } = this;
            const { x, y, width, height } = bounds.shrink([2, showScrollYBar ? scrollYBar.width + 6 : 2, showScrollXBar ? scrollXBar.height + 6 : 2, 2]);
            scrollXBar.set({
                x: x + width * scrollRatioX,
                y: y + height + 2,
                width: Math.max(width * ratioX, minSize),
                visible: showScrollXBar
            });
            scrollYBar.set({
                x: x + width + 2,
                y: y + height * scrollRatioY,
                height: Math.max(height * ratioY, minSize),
                visible: showScrollYBar
            });
        }
        onDrag(e) {
            this.dragScrolling = true;
            this.__dragOut = this.app.config.move.dragOut;
            this.app.config.move.dragOut = false;
            const scrollX = e.current === this.scrollXBar;
            const move = this.target.leafer.getValidMove(scrollX ? -e.moveX / this.ratioX : 0, scrollX ? 0 : -e.moveY / this.ratioY);
            this.target.moveWorld(move.x, move.y);
            e.current.moveWorld(move.x && -move.x * this.ratioX, move.y && -move.y * this.ratioY);
        }
        onDragEnd() {
            this.dragScrolling = false;
            this.app.config.move.dragOut = this.__dragOut;
        }
        __listenEvents() {
            const { scrollXBar, scrollYBar } = this;
            this.__eventIds = [
                scrollXBar.on_(core.DragEvent.DRAG, this.onDrag, this),
                scrollYBar.on_(core.DragEvent.DRAG, this.onDrag, this),
                scrollXBar.on_(core.DragEvent.END, this.onDragEnd, this),
                scrollYBar.on_(core.DragEvent.END, this.onDragEnd, this),
                this.target.on_(draw.RenderEvent.BEFORE, () => this.update(true)),
                this.target.leafer.on_(draw.ResizeEvent.RESIZE, () => this.update())
            ];
        }
        __removeListenEvents() {
            this.off_(this.__eventIds);
        }
        destroy() {
            if (!this.destroyed) {
                this.__removeListenEvents();
                this.target = this.config = null;
                super.destroy();
            }
        }
    }

    exports.ScrollBar = ScrollBar;

    return exports;

})({}, LeaferUI, LeaferUI);

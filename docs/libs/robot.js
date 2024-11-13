this.LeaferIN = this.LeaferIN || {};
this.LeaferIN.Robot = (function (exports, draw) {
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

    class RobotData extends draw.UIData {
        get __drawAfterFill() { return true; }
        setRobot(value) {
            this._robot = value;
            this.__leaf.__updateRobot();
        }
        setAction(value) {
            this._action = value;
            this.__leaf.__updateAction();
        }
    }

    exports.Robot = class Robot extends draw.UI {
        get __tag() { return 'Robot'; }
        get nowFrame() { return this.robotFrames && this.robotFrames[this.now]; }
        constructor(data) {
            super(data);
        }
        play() {
            this.running = true;
        }
        pause() {
            this.running = false;
        }
        stop() {
            this.pause();
        }
        __updateRobot() {
            const { robot } = this;
            this.robotFrames = [];
            if (!robot)
                return;
            let start = 0;
            if (robot instanceof Array)
                robot.forEach(frame => this.__loadRobot(frame, start, start += frame.total || 1));
            else
                this.__loadRobot(robot, 0, robot.total);
        }
        __updateAction() {
            const action = this.actions[this.action];
            this.stop();
            if (this.__timer)
                clearTimeout(this.__timer);
            if (action === undefined)
                return;
            if (typeof action === 'number') {
                this.now = action;
            }
            else if (action instanceof Array) {
                const { length } = action;
                if (length > 1) {
                    const start = this.now = action[0], end = action[action.length - 1];
                    this.play();
                    this.__runAction(start, end);
                }
                else if (length)
                    this.now = action[0];
            }
        }
        __loadRobot(frame, start, end) {
            for (let i = start; i < end; i++)
                this.robotFrames.push(undefined);
            const image = draw.ImageManager.get(frame);
            if (image.ready)
                this.__createFrames(image, frame, start, end);
            else
                image.load(() => this.__createFrames(image, frame, start, end));
        }
        __createFrames(image, frame, start, end) {
            const { offset, size, total } = frame;
            const { width, height } = size && (typeof size === 'number' ? { width: size, height: size } : size) || (total > 1 ? this : image);
            let x = offset ? offset.x : 0, y = offset ? offset.y : 0;
            for (let i = start; i < end; i++) {
                this.robotFrames[i] = { view: image.view, x, y, width, height };
                if (x + width >= image.width)
                    x = 0, y += height;
                else
                    x += width;
            }
            this.__updateRobotBounds();
            this.forceRender();
            this.emitEvent(new draw.ImageEvent(draw.ImageEvent.LOADED, { image }));
        }
        __runAction(start, end) {
            this.__timer = setTimeout(() => {
                if (this.running) {
                    if (this.now === end)
                        this.now = start;
                    else
                        this.now++;
                    this.__updateRobotBounds();
                }
                this.__runAction(start, end);
            }, 1000 / this.FPS);
        }
        __updateRobotBounds() {
            const { nowFrame } = this;
            if (nowFrame) {
                const data = this.__;
                const width = nowFrame.width / data.pixelRatio;
                const height = nowFrame.height / data.pixelRatio;
                if (data.width !== width || data.height !== height)
                    this.forceUpdate('width');
                data.__naturalWidth = width;
                data.__naturalHeight = height;
            }
        }
        __drawContent(canvas, _options) {
            const { nowFrame } = this, { width, height } = this.__;
            if (nowFrame)
                canvas.drawImage(nowFrame.view, nowFrame.x, nowFrame.y, nowFrame.width, nowFrame.height, 0, 0, width, height);
        }
        destroy() {
            if (this.robotFrames)
                this.robotFrames = null;
            super.destroy();
        }
    };
    __decorate([
        draw.dataProcessor(RobotData)
    ], exports.Robot.prototype, "__", void 0);
    __decorate([
        draw.boundsType()
    ], exports.Robot.prototype, "robot", void 0);
    __decorate([
        draw.dataType()
    ], exports.Robot.prototype, "actions", void 0);
    __decorate([
        draw.dataType('')
    ], exports.Robot.prototype, "action", void 0);
    __decorate([
        draw.surfaceType(0)
    ], exports.Robot.prototype, "now", void 0);
    __decorate([
        draw.dataType(12)
    ], exports.Robot.prototype, "FPS", void 0);
    __decorate([
        draw.dataType(true)
    ], exports.Robot.prototype, "loop", void 0);
    exports.Robot = __decorate([
        draw.registerUI()
    ], exports.Robot);

    exports.RobotData = RobotData;

    return exports;

})({}, LeaferUI);

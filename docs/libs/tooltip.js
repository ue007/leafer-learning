this.LeaferX = this.LeaferX || {};
this.LeaferX.tooltip = (function (exports, core) {
    'use strict';

    const PLUGIN_NAME = 'leafer-x-tooltip';
    const ATTRS_NAME = 'data-lxt-id';
    function assert(condition, msg) {
        if (condition) {
            throw new Error(`[${PLUGIN_NAME}]: ${msg}`);
        }
    }
    function addStyle(element, cssStyles) {
        requestAnimationFrame(() => {
            Object.entries(cssStyles).forEach(([property, value]) => {
                element.style[property] = value;
            });
        });
    }
    function randomStr(length = 8) {
        return Math.random().toString(36).slice(2, length + 2);
    }
    function allowNodeType(includeTypes, type) {
        if (!Array.isArray(includeTypes))
            return true;
        if (includeTypes.length === 0)
            return true;
        return includeTypes.includes(type);
    }
    function denyNodeType(excludeTypes, type) {
        if (!Array.isArray(excludeTypes))
            return false;
        if (excludeTypes.length === 0)
            return false;
        return excludeTypes.includes(type);
    }
    function getTooltip(dataId) {
        return document.querySelector(`[${ATTRS_NAME}=${dataId}]`);
    }
    function camelCaseToDash(str) {
        return str.replace(/([A-Z])/g, '-$1').toLowerCase();
    }
    function createCssClass(selector, useRules, userStyleElement) {
        let styleElement = userStyleElement;
        if (!styleElement && !(userStyleElement instanceof HTMLStyleElement)) {
            styleElement = document.createElement('style');
            styleElement.setAttribute(PLUGIN_NAME, '');
            document.head.appendChild(styleElement);
        }
        let rules = typeof useRules === 'string' ? useRules : '';
        if (typeof useRules === 'object') {
            Object.keys(useRules).forEach((prop) => {
                rules += `${camelCaseToDash(prop)}: ${useRules[prop]};`;
            });
        }
        if (styleElement.sheet) {
            styleElement.sheet.insertRule(`${selector} { ${rules} }`, 0);
        }
        else {
            styleElement.appendChild(document.createTextNode(rules));
        }
        return styleElement;
    }

    class TooltipPlugin {
        constructor(app, config) {
            this.calculateTooltipPosition = (event, tooltipElem) => {
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;
                const pageXOffset = window.scrollX;
                const pageYOffset = window.scrollY;
                const mouseX = event.clientX + pageXOffset;
                const mouseY = event.clientY + pageYOffset;
                const tooltipWidth = tooltipElem.offsetWidth;
                const tooltipHeight = tooltipElem.offsetHeight;
                const emptySpace = 6;
                let x = mouseX + emptySpace;
                let y = mouseY + emptySpace;
                if (x + tooltipWidth > windowWidth + pageXOffset) {
                    x = mouseX - tooltipWidth - emptySpace;
                }
                if (y + tooltipHeight > windowHeight + pageYOffset) {
                    y = mouseY - tooltipHeight - emptySpace;
                }
                return { x, y };
            };
            this.app = app;
            this.config = config;
            this.domId = `lxt--${randomStr(8)}`;
            this.bindEventIds = [];
            this.initEvent();
            this.initCssClass();
            this.initCreateTooltip();
            this._moveTooltip = (event) => this.moveTooltip(event);
        }
        initEvent() {
            const pointEventId = this.app.on_(core.PointerEvent.MOVE, this.leaferPointMove, this);
            const vieReadId = this.app.on_(core.LeaferEvent.VIEW_READY, this.viewReadyEvent, this);
            this.bindEventIds.push(pointEventId, vieReadId);
        }
        leaferPointMove(event) {
            const node = event.target;
            if (!node || node.isLeafer) {
                this.hideTooltip();
                return;
            }
            const isAllowType = allowNodeType(this.config.includeTypes, node.tag);
            const isDenyType = denyNodeType(this.config.excludeTypes, node.tag);
            const isShouldBegin = this.config.shouldBegin ? this.config.shouldBegin(event) : true;
            if (!isAllowType || isDenyType || !isShouldBegin) {
                this.hideTooltip();
                return;
            }
            this.mouseoverNode = node;
        }
        viewReadyEvent() {
            var _a;
            if (!(this.app.view instanceof HTMLElement))
                return;
            assert(!((_a = this.app.view) === null || _a === void 0 ? void 0 : _a.addEventListener), 'leafer.view 加载失败！');
            this.app.view.addEventListener('mousemove', this._moveTooltip);
        }
        initCssClass() {
            if (this.styleSheetElement)
                return;
            const styleSheetElement = document.querySelector(`.${PLUGIN_NAME}`);
            if (styleSheetElement) {
                this.styleSheetElement = styleSheetElement;
                return;
            }
            this.styleSheetElement = createCssClass(`.${PLUGIN_NAME}`, {
                padding: '8px 10px',
                backgroundColor: '#fff',
                borderRadius: '2px',
                boxShadow: '0 0 4px #e2e2e2'
            });
        }
        initCreateTooltip() {
            let container = getTooltip(this.domId);
            const isExists = container !== null;
            if (!isExists) {
                container = document.createElement('div');
            }
            container.setAttribute(ATTRS_NAME, this.domId);
            container.style.display = 'none';
            if (this.config.className) {
                container.className = this.config.className;
            }
            else if (!isExists) {
                container.className = PLUGIN_NAME;
            }
            if (!isExists) {
                document.body.appendChild(container);
            }
            return container;
        }
        hideTooltip() {
            this.mouseoverNode = null;
            const tooltipDOM = getTooltip(this.domId);
            if (tooltipDOM) {
                tooltipDOM.style.display = 'none';
            }
        }
        getTooltipContent() {
            const argumentType = typeof this.config.getContent;
            assert(argumentType !== 'function', `getContent 为必传参数，且必须是一个函数，当前为：${argumentType} 类型`);
            const content = this.config.getContent(this.mouseoverNode);
            assert(!content, `getContent 返回值不能为空`);
            return content;
        }
        moveTooltip(event) {
            if (!this.mouseoverNode)
                return;
            let tooltipContainer = getTooltip(this.domId);
            if (!tooltipContainer) {
                tooltipContainer = this.initCreateTooltip();
            }
            tooltipContainer.innerHTML = this.getTooltipContent();
            const { x, y } = this.calculateTooltipPosition(event, tooltipContainer);
            addStyle(tooltipContainer, {
                display: 'block',
                position: 'absolute',
                left: `${x}px`,
                top: `${y}px`
            });
        }
        getDomId() {
            return this.domId;
        }
        createStyleRule(selector, useRules) {
            createCssClass(`${selector}[${ATTRS_NAME}=${this.domId}]`, useRules, this.styleSheetElement);
        }
        removeStyleRule(selector) {
            const styleSheet = this.styleSheetElement.sheet;
            if (!styleSheet)
                return;
            const index = this.findStyleRuleIndex(selector);
            if (index === -1)
                return;
            styleSheet.deleteRule(index);
        }
        findStyleRuleIndex(selector) {
            const styleSheet = this.styleSheetElement.sheet;
            if (!styleSheet)
                return -1;
            const rules = styleSheet.cssRules;
            const fullSelector = `${selector}[${ATTRS_NAME}=${this.domId}]`;
            for (let i = 0; i < rules.length; i++) {
                const rule = rules[i];
                if (rule.selectorText === fullSelector)
                    return i;
            }
            return -1;
        }
        addClass(className) {
            const container = getTooltip(this.domId);
            if (container) {
                if (Array.isArray(className)) {
                    className.forEach((item) => container.classList.add(item));
                }
                else {
                    container.classList.add(className);
                }
            }
        }
        removeClass(className) {
            const container = getTooltip(this.domId);
            if (container) {
                if (Array.isArray(className)) {
                    className.forEach((item) => container.classList.remove(item));
                }
                else {
                    container.classList.remove(className);
                }
            }
        }
        destroy() {
            this.app.off_(this.bindEventIds);
            this.bindEventIds.length = 0;
            if (this.app.view instanceof HTMLElement) {
                this.app.view.removeEventListener('mousemove', this._moveTooltip);
            }
            const tooltipDOM = getTooltip(this.domId);
            if (tooltipDOM && tooltipDOM.parentNode) {
                tooltipDOM.parentNode.removeChild(tooltipDOM);
            }
        }
    }

    exports.TooltipPlugin = TooltipPlugin;

    return exports;

})({}, LeaferUI);

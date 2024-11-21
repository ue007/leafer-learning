this.LeaferIN = this.LeaferIN || {};
this.LeaferIN.state = (function (exports, draw, core) {
    'use strict';

    function stateType(defaultValue, styleName) {
        return draw.decorateLeafAttr(defaultValue, (key) => draw.attr({
            set(value) {
                this.__setAttr(key, value);
                this.waitLeafer(() => styleName ? draw.State.setStyleName(this, styleName, value) : draw.State.set(this, value));
            }
        }));
    }
    function stateStyleType(defaultValue) {
        return draw.decorateLeafAttr(defaultValue, (key) => draw.attr({
            set(value) {
                this.__setAttr(key, value);
                this.__layout.stateStyleChanged = true;
            }
        }));
    }

    function findParentButton(leaf, button) {
        if (button && button !== true)
            return button;
        if (!leaf.button) {
            let { parent } = leaf;
            for (let i = 0; i < 2; i++) {
                if (parent) {
                    if (parent.button)
                        return parent;
                    parent = parent.parent;
                }
            }
        }
        return null;
    }

    function setStyle(leaf, style) {
        if (typeof style !== 'object')
            style = undefined;
        updateStyle(leaf, style, 'in');
    }
    function unsetStyle(leaf, style) {
        const { normalStyle } = leaf;
        if (typeof style !== 'object')
            style = undefined;
        if (normalStyle) {
            if (!style)
                style = normalStyle;
            updateStyle(leaf, style, 'out');
        }
    }
    const emprtyStyle = {};
    function updateStyle(leaf, style, type) {
        const { normalStyle } = leaf;
        if (!style)
            style = emprtyStyle;
        if (style.scale) {
            core.MathHelper.assignScale(style, style.scale);
            delete style.scale;
        }
        if (style === emprtyStyle || !core.State.canAnimate)
            type = null;
        let transition = type ? getTransition(type, style, leaf) : false;
        const fromStyle = transition ? getFromStyle(leaf, style) : undefined;
        leaf.killAnimate('transition');
        if (normalStyle)
            leaf.set(normalStyle, true);
        const statesStyle = getStyle(leaf);
        if (statesStyle) {
            const { animation } = statesStyle;
            if (animation) {
                const animate = leaf.animate(animation, undefined, 'animation', true);
                Object.assign(statesStyle, animate.endingStyle);
                if (type !== 'in' || style.animation !== animation)
                    animate.kill();
                else
                    transition = false;
                delete statesStyle.animation;
            }
            leaf.normalStyle = filterStyle(statesStyle, leaf);
            leaf.set(statesStyle, true);
        }
        else {
            leaf.normalStyle = undefined;
        }
        if (transition) {
            const toStyle = filterStyle(fromStyle, leaf);
            leaf.set(fromStyle, true);
            leaf.animate([fromStyle, toStyle], transition, 'transition', true);
        }
        leaf.__layout.stateStyleChanged = false;
    }
    function getStyle(leaf) {
        let exist;
        const style = {}, { state } = leaf, button = findParentButton(leaf);
        const stateStyle = state && leaf.states[state];
        if (stateStyle && core.State.isState(state, leaf, button))
            exist = assign(style, stateStyle);
        const selectedStyle = style.selectedStyle || leaf.selectedStyle;
        if (selectedStyle && core.State.isSelected(leaf, button))
            exist = assign(style, selectedStyle);
        if (core.State.isDisabled(leaf, button)) {
            const disabledStyle = style.disabledStyle || leaf.disabledStyle;
            if (disabledStyle)
                exist = assign(style, disabledStyle);
        }
        else {
            const focusStyle = style.focusStyle || leaf.focusStyle;
            if (focusStyle && core.State.isFocus(leaf, button))
                exist = assign(style, focusStyle);
            const hoverStyle = style.hoverStyle || leaf.hoverStyle;
            if (hoverStyle && core.State.isHover(leaf, button))
                exist = assign(style, hoverStyle);
            const pressStyle = style.pressStyle || leaf.pressStyle;
            if (pressStyle && core.State.isPress(leaf, button))
                exist = assign(style, pressStyle);
        }
        return exist ? style : undefined;
    }
    function filterStyle(style, data, addStyle, useAnimateExcludes) {
        const to = addStyle ? style : {}, forStyle = addStyle || style;
        for (let key in forStyle) {
            if (useAnimateExcludes) {
                if (!core.State.animateExcludes[key])
                    to[key] = data[key];
            }
            else
                to[key] = data[key];
        }
        return to;
    }
    function filterAnimateStyle(style, data, addStyle) {
        return filterStyle(style, data, addStyle, true);
    }
    function getFromStyle(leaf, style) {
        const fromStyle = filterAnimateStyle(style, leaf), animate = leaf.animate();
        if (animate)
            filterAnimateStyle(fromStyle, leaf, animate.fromStyle);
        return fromStyle;
    }
    function getTransition(type, style, data) {
        let name = type === 'in' ? 'transition' : 'transitionOut';
        if (type === 'out' && core.isNull(data[name]) && core.isNull(style[name]))
            name = 'transition';
        return core.isNull(style[name]) ? data[name] : style[name];
    }
    function assign(style, stateStyle) {
        Object.assign(style, stateStyle);
        return true;
    }

    function setPointerState(leaf, stateName) {
        const style = leaf[stateName];
        if (style)
            setStyle(leaf, style);
        if (leaf.button)
            setChildrenState(leaf.children, stateName);
    }
    function setState(leaf, stateName, stateStyle) {
        if (!stateStyle)
            stateStyle = leaf.states[stateName];
        setStyle(leaf, stateStyle);
        if (leaf.button)
            setChildrenState(leaf.children, null, stateName);
    }
    function setChildrenState(children, stateType, state) {
        if (!children)
            return;
        let leaf, update;
        for (let i = 0, len = children.length; i < len; i++) {
            leaf = children[i];
            if (stateType) {
                update = true;
                switch (stateType) {
                    case 'hoverStyle':
                        if (core.State.isHover(leaf))
                            update = false;
                        break;
                    case 'pressStyle':
                        if (core.State.isPress(leaf))
                            update = false;
                        break;
                    case 'focusStyle':
                        if (core.State.isFocus(leaf))
                            update = false;
                }
                if (update)
                    setPointerState(leaf, stateType);
            }
            else if (state)
                setState(leaf, state);
            if (leaf.isBranch)
                setChildrenState(leaf.children, stateType, state);
        }
    }

    function unsetPointerState(leaf, stateName) {
        const style = leaf[stateName];
        if (style)
            unsetStyle(leaf, style);
        if (leaf.button)
            unsetChildrenState(leaf.children, stateName);
    }
    function unsetState(leaf, stateName, stateStyle) {
        unsetStyle(leaf, stateStyle);
        if (leaf.button)
            unsetChildrenState(leaf.children, null, stateName);
    }
    function unsetChildrenState(children, stateType, state) {
        if (!children)
            return;
        let leaf;
        for (let i = 0, len = children.length; i < len; i++) {
            leaf = children[i];
            if (stateType)
                unsetPointerState(leaf, stateType);
            else if (state)
                unsetState(leaf, state);
            if (leaf.isBranch)
                unsetChildrenState(leaf.children, stateType, state);
        }
    }

    function updateEventStyle(leaf, eventType) {
        switch (eventType) {
            case core.PointerEvent.ENTER:
                setPointerState(leaf, 'hoverStyle');
                break;
            case core.PointerEvent.LEAVE:
                unsetPointerState(leaf, 'hoverStyle');
                break;
            case core.PointerEvent.DOWN:
                setPointerState(leaf, 'pressStyle');
                break;
            case core.PointerEvent.UP:
                unsetPointerState(leaf, 'pressStyle');
                break;
        }
    }

    function checkPointerState(fnName, leaf, button) {
        let find;
        const interaction = leaf.leafer ? leaf.leafer.interaction : null;
        if (interaction) {
            find = interaction[fnName](leaf);
            if (!find && button) {
                const parentButton = findParentButton(leaf, button);
                if (parentButton)
                    find = interaction[fnName](parentButton);
            }
        }
        return find;
    }
    function checkFixedState(attrName, leaf, button) {
        let find = leaf[attrName];
        if (!find && button) {
            const parentButton = findParentButton(leaf, button);
            if (parentButton)
                find = parentButton[attrName];
        }
        return find;
    }
    function checkState(stateName, leaf, button) {
        let find = leaf.states[stateName];
        if (!find && button) {
            const parentButton = findParentButton(leaf, button);
            if (parentButton)
                find = parentButton.states[stateName];
        }
        return !!find;
    }

    core.State.animateExcludes = {
        animation: 1,
        animationOut: 1,
        transition: 1,
        transitionOut: 1,
        states: 1,
        state: 1,
        normalStyle: 1,
        hoverStyle: 1,
        pressStyle: 1,
        focusStyle: 1,
        selectedStyle: 1,
        disabledStyle: 1
    };
    core.State.isState = function (state, leaf, button) { return checkState(state, leaf, button); };
    core.State.isSelected = function (leaf, button) { return checkFixedState('selected', leaf, button); };
    core.State.isDisabled = function (leaf, button) { return checkFixedState('disabled', leaf, button); };
    core.State.isFocus = function (leaf, button) { return checkPointerState('isFocus', leaf, button); };
    core.State.isHover = function (leaf, button) { return checkPointerState('isHover', leaf, button); };
    core.State.isPress = function (leaf, button) { return checkPointerState('isPress', leaf, button); };
    core.State.isDrag = function (leaf, button) { return checkPointerState('isDrag', leaf, button); };
    core.State.setStyleName = function (leaf, stateType, value) { value ? setState(leaf, stateType, leaf[stateType]) : unsetState(leaf, stateType, leaf[stateType]); };
    core.State.set = function (leaf, stateName) { const style = leaf.states[stateName]; style ? setState(leaf, stateName, style) : unsetState(leaf, stateName, style); };
    core.State.getStyle = getStyle;
    core.State.updateStyle = updateStyle;
    core.State.updateEventStyle = updateEventStyle;
    const ui = core.UI.prototype;
    stateType(false, 'selectedStyle')(ui, 'selected');
    stateType(false, 'disabledStyle')(ui, 'disabled');
    stateStyleType({})(ui, 'states');
    stateType('')(ui, 'state');
    core.dataType()(ui, 'normalStyle');
    stateStyleType()(ui, 'hoverStyle');
    stateStyleType()(ui, 'pressStyle');
    stateStyleType()(ui, 'focusStyle');
    stateStyleType()(ui, 'selectedStyle');
    stateStyleType()(ui, 'disabledStyle');
    core.dataType(false)(ui, 'button');
    ui.focus = function (value = true) {
        this.waitLeafer(() => {
            let { focusData } = this.app.interaction;
            if (value) {
                if (focusData)
                    focusData.focus(false);
                focusData = this;
            }
            else
                focusData = null;
            this.app.interaction.focusData = focusData;
            value ? setPointerState(this, 'focusStyle') : unsetPointerState(this, 'focusStyle');
        });
    };
    ui.updateState = function () {
        core.State.updateStyle(this, undefined, 'in');
    };

    exports.stateStyleType = stateStyleType;
    exports.stateType = stateType;

    return exports;

})({}, LeaferUI, LeaferUI);

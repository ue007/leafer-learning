(function (draw) {
    'use strict';

    function getZoomScale(scaleX, type) {
        let scale = 1;
        const out = type === 'out', absScale = Math.abs(scaleX);
        if (absScale > 1) {
            while (out ? scale < absScale : scale <= absScale)
                scale *= 2;
            if (out)
                scale /= 2;
        }
        else {
            while (out ? scale >= absScale : scale > absScale)
                scale /= 2;
            if (!out)
                scale *= 2;
        }
        return scale / scaleX;
    }
    function getFixBounds(bounds, scaleBounds) {
        let { x, y, width, height } = bounds;
        let fix;
        if (!height)
            height = width * (scaleBounds.height / scaleBounds.width), fix = true;
        if (!width)
            width = height * (scaleBounds.width / scaleBounds.height), fix = true;
        return fix ? { x, y, width, height } : bounds;
    }

    draw.Leafer.prototype.zoom = function (zoomType, padding, fixed) {
        const { zoomLayer } = this;
        const limitBounds = this.canvas.bounds.clone().shrink(padding ? padding : 30), bounds = new draw.Bounds();
        const center = { x: limitBounds.x + limitBounds.width / 2, y: limitBounds.y + limitBounds.height / 2 };
        let changeScale;
        const { scaleX } = this.__;
        if (typeof zoomType === 'string') {
            switch (zoomType) {
                case 'in':
                    changeScale = getZoomScale(scaleX, 'in');
                    break;
                case 'out':
                    changeScale = getZoomScale(scaleX, 'out');
                    break;
                case 'fit':
                    zoomType = this.boxBounds;
                    break;
                case 'fit-width':
                    zoomType = new draw.Bounds(this.boxBounds);
                    zoomType.height = 0;
                    break;
                case 'fit-height':
                    zoomType = new draw.Bounds(this.boxBounds);
                    zoomType.width = 0;
                    break;
            }
        }
        else if (typeof zoomType === 'number') {
            changeScale = zoomType / scaleX;
        }
        if (changeScale) {
            if (changeScale !== 1)
                zoomLayer.scaleOfWorld(center, this.getValidScale(changeScale));
        }
        else if (typeof zoomType === 'object') {
            const isArray = zoomType instanceof Array;
            if (isArray || zoomType.tag) {
                const list = isArray ? zoomType : [zoomType];
                bounds.setListWithFn(list, draw.LeafBoundsHelper.worldBounds);
            }
            else {
                const innerBounds = getFixBounds(zoomType, limitBounds);
                bounds.set(zoomLayer.getWorldBounds(innerBounds));
            }
            const { x, y, width, height } = bounds;
            let moveX = limitBounds.x - x, moveY = limitBounds.y - y;
            if (fixed) {
                moveX += Math.max((limitBounds.width - width) / 2, 0);
                moveY += Math.max((limitBounds.height - height) / 2, 0);
            }
            else {
                const fitScale = this.getValidScale(Math.min(limitBounds.width / width, limitBounds.height / height));
                moveX += (limitBounds.width - width * fitScale) / 2;
                moveY += (limitBounds.height - height * fitScale) / 2;
                zoomLayer.scaleOfWorld(bounds, fitScale);
                bounds.scaleOf(bounds, fitScale);
            }
            zoomLayer.move(moveX, moveY);
            return bounds.move(moveX, moveY);
        }
        return zoomLayer.worldBoxBounds;
    };

})(LeaferUI);

import BaseItem from './BaseItem.js';

function PantryItem(name, category, qty, expiration) {
    BaseItem.call(this, name, category)
    this.qty = qty;
    this.expiration = expiration;

    this.isExpired = function () {
        return new Date() > this.expiration;
    }

    this.daysUntilExpired = function () {
        const today = new Date();
        return Math.round((this.expiration - today) / (1000 * 60 * 60 * 24));
    }

    this.isExpiringSoon = function (thresholdDays = 3) {
        const days = this.daysUntilExpired();
        return days >= 0 && days <= thresholdDays;
    }

    this.increaseQty = function () {
        this.qty = Math.min(100, this.qty + 10);
    }

    this.decreaseQty = function () {
        this.qty = Math.max(0, this.qty - 10);
    }

    this.canIncrease = function () {
        return this.qty < 100;
    }

    this.canDecrease = function () {
        return this.qty > 0;
    }
}

PantryItem.prototype = Object.create(BaseItem.prototype);
PantryItem.prototype.constructor = PantryItem;

export default PantryItem;
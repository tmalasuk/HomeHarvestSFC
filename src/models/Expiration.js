export const UNITS = ['day(s)', 'week(s)', 'month(s)', 'year(s)']

class Expiration {
    constructor(durationValue, unitIndex, fixedDate = null) {
        this.durationValue = durationValue
        this.unitIndex = unitIndex
        this._fixedDate = fixedDate ? new Date(fixedDate) : null
    }

    // PantryItems use a fixed date so expiration never drifts.
    // ShoppingItems compute from today + duration.
    toDate() {
        if (this._fixedDate) return new Date(this._fixedDate)
        return Expiration.compute(this.durationValue, this.unitIndex)
    }

    // Build a duration-based Expiration (ShoppingItem — "lasts X weeks")
    static create(durationValue, unitIndex) {
        return new Expiration(durationValue, unitIndex)
    }

    // Build a fixed-date Expiration (PantryItem — locked at purchase time)
    static fromDate(date) {
        const { value, unitIndex } = Expiration.toComponents(date)
        return new Expiration(value, unitIndex, date)
    }

    // Compute a future Date from a duration value and unit index
    static compute(durationValue, unitIndex) {
        const expiration = new Date()
        switch (UNITS[unitIndex]) {
            case 'day(s)':   expiration.setDate(expiration.getDate() + durationValue); break
            case 'week(s)':  expiration.setDate(expiration.getDate() + durationValue * 7); break
            case 'month(s)': expiration.setMonth(expiration.getMonth() + durationValue); break
            case 'year(s)':  expiration.setFullYear(expiration.getFullYear() + durationValue); break
        }
        return expiration
    }

    // Days remaining until a given date (normalized to midnight)
    static daysUntil(date) {
        const todayMid = new Date(new Date().setHours(0, 0, 0, 0))
        const expMid = new Date(new Date(date).setHours(0, 0, 0, 0))
        return Math.round((expMid - todayMid) / (1000 * 60 * 60 * 24))
    }

    // Maps days remaining to a 0-100 urgency percent for progress bars
    static toPercent(date) {
        const daysLeft = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24))
        if (daysLeft <= 0) return 100
        if (daysLeft < 2)  return 80
        if (daysLeft < 3)  return 70
        if (daysLeft < 4)  return 60
        if (daysLeft < 5)  return 50
        if (daysLeft < 6)  return 40
        if (daysLeft < 7)  return 30
        if (daysLeft < 8)  return 20
        if (daysLeft < 9)  return 10
        return 0
    }

    // Decompose a Date into the most readable duration value + unit index
    static toComponents(date) {
        const diffDays = Expiration.daysUntil(date)
        if (diffDays <= 0)          return { value: 1, unitIndex: 0 }
        if (diffDays % 365 === 0)   return { value: diffDays / 365, unitIndex: 3 }
        if (diffDays % 30 === 0)    return { value: diffDays / 30,  unitIndex: 2 }
        if (diffDays % 7 === 0)     return { value: diffDays / 7,   unitIndex: 1 }
        return { value: diffDays, unitIndex: 0 }
    }
}

export default Expiration

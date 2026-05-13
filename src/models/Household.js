class Household {
    constructor(id, name) {
        this.id = id
        this.name = name
        this.members = []
        this.invites = []
        this.locations = []
        this.zipCode = ''
        this.preferences = {
            autoGenShoppingList: false,
        }
    }

    // Creates a new Household with a UUID
    static create(name) {
        return new Household(crypto.randomUUID(), name)
    }

}

export default Household

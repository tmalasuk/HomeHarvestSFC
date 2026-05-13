class User {
    constructor(id, name, email, householdId = null) {
        this.id = id
        this.name = name
        this.email = email
        this.householdId = householdId
        this.preferences = {
            theme: 'light',
            dietaryRestrictions: []
        }
    }

    // Creates a new User with a UUID and no household assignment
    static create(name, email) {
        return new User(crypto.randomUUID(), name, email)
    }

}

export default User

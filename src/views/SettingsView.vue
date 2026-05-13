<script>
import AuthService from '../services/AuthService.js'
import UserService from '../services/UserService.js'
import HouseholdService from '../services/HouseholdService.js'

const DIETARY_OPTIONS = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut-Free', 'Halal', 'Kosher', 'Pescatarian']
const DEFAULT_LOCATIONS = ['Pantry', 'Fridge', 'Freezer', 'Spice Cabinet', 'Dry Storage', 'Basement Fridge', 'Garage Freezer', 'Wine Cellar']

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme)
}

export default {
    name: 'SettingsView',

    emits: ['close', 'preferences-updated'],

    data() {
        return {
            section: 'preferences',

            currentUser: null,
            householdId: null,
            ownerId: null,
            loading: true,

            // My Preferences
            prefs: {
                theme: 'light',
                dietaryRestrictions: [],
                defaultView: 'pantry',
                notifications: { expiringSoon: true, lowStock: true },
            },

            // Household
            householdName: '',
            householdNameSaving: false,
            householdNameSaved: false,
            members: [],
            invites: [],
            locations: [],
            householdPrefs: {
                autoGenShoppingList: false,
                lowStockThreshold: 30,
                expiringSoonThreshold: 3,
            },

            zipCode: '',
            zipCodeSaving: false,
            locationStatus: null,  // null | 'detecting' | 'success' | 'denied' | 'unavailable'

            inviteEmail: '',
            inviteSending: false,
            inviteError: null,
            inviteSuccess: null,
            copiedToken: null,

            newLocation: '',

            leavingHousehold: false,

            prefsSaveTimer: null,
            householdPrefsSaveTimer: null,

            dietaryOptions: DIETARY_OPTIONS,
            locationSuggestions: DEFAULT_LOCATIONS,
        }
    },

    computed: {
        userName() {
            return this.currentUser?.displayName || this.currentUser?.email?.split('@')[0] || ''
        },
        isOwner() {
            return this.currentUser?.uid === this.ownerId
        },
        filteredSuggestions() {
            if (!this.newLocation.trim()) return []
            const q = this.newLocation.trim().toLowerCase()
            return this.locationSuggestions.filter(s =>
                s.toLowerCase().includes(q) && !this.locations.includes(s)
            )
        },
    },

    methods: {
        // ── Load ──────────────────────────────────────────────────

        // Subscribes to auth state, loads user preferences and household data
        async loadData() {
            this.loading = true
            this._authUnsub = AuthService.onAuthChange(async user => {
                this.currentUser = user
                if (!user) { this.$router.push('/login'); return }

                const [userDoc] = await Promise.all([UserService.getUserDoc(user.uid)])
                if (!userDoc) return

                this.householdId = userDoc.householdId

                // Merge saved preferences with defaults so new fields are always present
                this.prefs = {
                    theme: 'light',
                    dietaryRestrictions: [],
                    defaultView: 'pantry',
                    notifications: { expiringSoon: true, lowStock: true },
                    ...userDoc.preferences,
                    notifications: {
                        expiringSoon: true,
                        lowStock: true,
                        ...(userDoc.preferences?.notifications ?? {}),
                    },
                }
                applyTheme(this.prefs.theme)

                if (this.householdId) {
                    try {
                        await this.loadHousehold()
                    } catch (err) {
                        console.error('loadHousehold:', err)
                    }
                }
                this.loading = false
            })
        },

        // Fetches and applies household data including members, invites, and locations
        async loadHousehold() {
            const hh = await HouseholdService.get(this.householdId)
            if (!hh) return

            this.ownerId = hh.ownerId ?? hh.members?.[0] ?? null
            this.householdName = hh.name ?? ''
            this.invites = hh.invites ?? []
            this.locations = hh.locations ?? []
            this.householdPrefs = {
                autoGenShoppingList: false,
                lowStockThreshold: 30,
                expiringSoonThreshold: 3,
                ...hh.preferences,
            }
            this.zipCode = hh.zipCode ?? ''

            if (hh.members?.length) {
                this.members = await HouseholdService.getMemberDocs(hh.members)
            }
        },

        // ── User Preferences ──────────────────────────────────────

        // Applies a theme and queues a preferences save
        setTheme(theme) {
            this.prefs.theme = theme
            applyTheme(theme)
            this.schedulePreferencesSave()
        },

        // Toggles a dietary restriction on or off and queues a preferences save
        toggleDietary(restriction) {
            const idx = this.prefs.dietaryRestrictions.indexOf(restriction)
            if (idx === -1) {
                this.prefs.dietaryRestrictions.push(restriction)
            } else {
                this.prefs.dietaryRestrictions.splice(idx, 1)
            }
            this.schedulePreferencesSave()
        },

        // Sets the default view preference and queues a preferences save
        setDefaultView(view) {
            this.prefs.defaultView = view
            this.schedulePreferencesSave()
        },

        // Debounces a preferences save by 600ms
        schedulePreferencesSave() {
            clearTimeout(this.prefsSaveTimer)
            this.prefsSaveTimer = setTimeout(() => this.savePreferences(), 600)
        },

        // Persists the current preferences to Firestore and emits a preferences-updated event
        async savePreferences() {
            if (!this.currentUser) return
            await UserService.updatePreferences(this.currentUser.uid, this.prefs).catch(console.error)
            this.$emit('preferences-updated', this.prefs)
        },

        // ── Household Name ─────────────────────────────────────────

        // Saves the household name to Firestore with a brief confirmation flash
        async saveHouseholdName() {
            if (!this.householdId || !this.householdName.trim()) return
            this.householdNameSaving = true
            await HouseholdService.update(this.householdId, { name: this.householdName.trim() }).catch(console.error)
            this.householdNameSaving = false
            this.householdNameSaved = true
            setTimeout(() => { this.householdNameSaved = false }, 2000)
        },

        // ── Household Preferences ─────────────────────────────────

        // Debounces a household preferences save by 600ms
        scheduleHouseholdPrefsSave() {
            clearTimeout(this.householdPrefsSaveTimer)
            this.householdPrefsSaveTimer = setTimeout(() => this.saveHouseholdPrefs(), 600)
        },

        // Persists household preferences to Firestore
        async saveHouseholdPrefs() {
            if (!this.householdId) return
            await HouseholdService.update(this.householdId, { preferences: this.householdPrefs }).catch(console.error)
        },

        // ── Members & Invites ─────────────────────────────────────

        // Validates and sends a household invite to the given email
        async sendInvite() {
            if (!this.inviteEmail.trim() || !this.householdId) return
            if (this.inviteEmail.trim().toLowerCase() === this.currentUser?.email?.toLowerCase()) {
                this.inviteError = 'You cannot invite yourself.'
                return
            }
            if (this.members.some(m => m.email?.toLowerCase() === this.inviteEmail.trim().toLowerCase())) {
                this.inviteError = 'That person is already a member of this household.'
                return
            }
            this.inviteSending = true
            this.inviteError = null
            this.inviteSuccess = null
            try {
                const invite = await HouseholdService.addInvite(this.householdId, this.inviteEmail.trim())
                this.invites.push(invite)
                this.inviteSuccess = `Invite created for ${this.inviteEmail.trim()}.`
                this.inviteEmail = ''
            } catch (e) {
                this.inviteError = 'Failed to create invite. Please try again.'
            } finally {
                this.inviteSending = false
            }
        },

        // Revokes an invite by token from Firestore and removes it from local state
        async revokeInvite(token) {
            await HouseholdService.revokeInvite(this.householdId, token).catch(console.error)
            this.invites = this.invites.filter(i => i.token !== token)
        },

        // Removes a household member from Firestore and from local state
        async removeMember(userId) {
            await HouseholdService.removeMember(this.householdId, userId).catch(console.error)
            this.members = this.members.filter(m => m.id !== userId)
        },

        // Returns a full shareable invite URL for the given token
        inviteLink(token) {
            return `${window.location.origin}${window.location.pathname}#/join?token=${token}`
        },

        // Copies the invite link to the clipboard with a brief confirmation flash
        async copyInviteLink(token) {
            await navigator.clipboard.writeText(this.inviteLink(token))
            this.copiedToken = token
            setTimeout(() => { this.copiedToken = null }, 2000)
        },

        // ── Storage Locations ─────────────────────────────────────

        // Adds a new storage location to the list and persists to Firestore
        addLocation() {
            const name = this.newLocation.trim()
            if (!name || this.locations.includes(name)) return
            this.locations.push(name)
            this.newLocation = ''
            this.persistLocations()
        },

        // Fills the location input with a suggestion and immediately submits it
        pickLocationSuggestion(suggestion) {
            this.newLocation = suggestion
            this.addLocation()
        },

        // Removes a storage location by name and persists the change to Firestore
        removeLocation(name) {
            this.locations = this.locations.filter(l => l !== name)
            this.persistLocations()
        },

        // Writes the current locations array to the household Firestore document
        persistLocations() {
            if (!this.householdId) return
            HouseholdService.update(this.householdId, { locations: this.locations }).catch(console.error)
        },

        // ── Location ──────────────────────────────────────────────

        // Uses the Geolocation API to auto-detect and save the household zip code
        async detectLocation() {
            if (!navigator.geolocation) {
                this.locationStatus = 'unavailable'
                return
            }
            this.locationStatus = 'detecting'
            navigator.geolocation.getCurrentPosition(
                async pos => {
                    try {
                        const { latitude, longitude } = pos.coords
                        const res = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
                            { headers: { 'Accept-Language': 'en' } }
                        )
                        const data = await res.json()
                        this.zipCode = data.address?.postcode ?? ''
                        this.locationStatus = 'success'
                        await this.saveZipCode()
                    } catch {
                        this.locationStatus = 'success'
                    }
                },
                () => { this.locationStatus = 'denied' }
            )
        },

        // Persists the current zip code to the household Firestore document
        async saveZipCode() {
            if (!this.householdId) return
            this.zipCodeSaving = true
            await HouseholdService.update(this.householdId, { zipCode: this.zipCode }).catch(console.error)
            this.zipCodeSaving = false
        },

        // ── Misc ──────────────────────────────────────────────────

        // Returns up to two uppercase initials from a full name
        initials(name) {
            if (!name) return '?'
            return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
        },

        // Confirms and removes the current user from their household
        async leaveHousehold() {
            const msg = this.isOwner && this.members.length > 1
                ? 'You are the owner — leaving will transfer ownership to another member. Continue?'
                : this.isOwner
                    ? 'You are the only member. Leaving will delete this household. Continue?'
                    : 'Leave this household? You will be placed in a new one.'
            if (!confirm(msg)) return
            this.leavingHousehold = true
            try {
                await HouseholdService.leaveHousehold(this.currentUser.uid)
                this.$emit('close')
                this.$router.push('/')
            } catch (e) {
                alert('Failed to leave household. Please try again.')
            } finally {
                this.leavingHousehold = false
            }
        },

        // Signs out the current user and redirects to /login
        async handleSignOut() {
            await AuthService.logout()
            this.$router.push('/login')
        },
    },

    mounted() {
        this.loadData()
    },

    beforeUnmount() {
        if (this._authUnsub) this._authUnsub()
        clearTimeout(this.prefsSaveTimer)
        clearTimeout(this.householdPrefsSaveTimer)
    },
}
</script>

<template>
    <div class="settings-panel">

        <!-- Close bar -->
        <div class="settings-close-bar">
            <button class="settings-close-btn" @click="$emit('close')" aria-label="Close settings">
                <i class="bi bi-x-lg"></i>
            </button>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="settings-loading">
            <div class="spinner"></div>
        </div>

        <div v-else class="settings-layout">

            <!-- Sidebar -->
            <aside class="settings-sidebar">
                <p class="sidebar-label">SETTINGS</p>
                <button class="sidebar-btn" :class="{ active: section === 'preferences' }"
                    @click="section = 'preferences'">
                    My Preferences
                </button>
                <button class="sidebar-btn" :class="{ active: section === 'household' }"
                    @click="section = 'household'">
                    Household
                </button>
            </aside>

            <!-- Main content -->
            <section class="settings-content">

                <!-- ── My Preferences ── -->
                <div v-if="section === 'preferences'" class="content-panel">
                    <div class="panel-heading">
                        <h2>My Preferences</h2>
                        <p>These settings apply only to your account.</p>
                    </div>

                    <div class="divider"></div>

                    <!-- Appearance -->
                    <div class="pref-group">
                        <label class="pref-label">APPEARANCE</label>
                        <div class="appearance-row">
                            <button class="appearance-btn" :class="{ active: prefs.theme === 'light' }"
                                @click="setTheme('light')">
                                <i class="bi bi-sun"></i>
                                <span>Light</span>
                            </button>
                            <button class="appearance-btn" :class="{ active: prefs.theme === 'dark' }"
                                @click="setTheme('dark')">
                                <i class="bi bi-moon"></i>
                                <span>Dark</span>
                            </button>
                        </div>
                    </div>

                    <div class="divider"></div>

                    <!-- Dietary restrictions -->
                    <div class="pref-group">
                        <label class="pref-label">DIETARY PREFERENCES
                            <span class="pref-optional">optional</span>
                        </label>
                        <p class="pref-desc">Used to filter recipe suggestions and flag incompatible ingredients.</p>
                        <div class="chip-row">
                            <button v-for="r in dietaryOptions" :key="r" class="chip"
                                :class="{ active: prefs.dietaryRestrictions.includes(r) }"
                                @click="toggleDietary(r)">
                                <i v-if="prefs.dietaryRestrictions.includes(r)" class="bi bi-check"></i>
                                {{ r }}
                            </button>
                        </div>
                    </div>

                    <div class="divider"></div>

                    <!-- Default View -->
                    <div class="pref-group">
                        <label class="pref-label">DEFAULT VIEW</label>
                        <p class="pref-desc">Which tab opens when you first log in.</p>
                        <div class="view-pills">
                            <button class="view-pill" :class="{ active: prefs.defaultView === 'pantry' }"
                                @click="setDefaultView('pantry')">Pantry</button>
                            <button class="view-pill" :class="{ active: prefs.defaultView === 'grocery' }"
                                @click="setDefaultView('grocery')">Grocery List</button>
                            <button class="view-pill" :class="{ active: prefs.defaultView === 'recipes' }"
                                @click="setDefaultView('recipes')">Recipes</button>
                        </div>
                    </div>

                    <div class="divider"></div>

                    <!-- Notifications -->
                    <div class="pref-group">
                        <label class="pref-label">NOTIFICATIONS</label>
                        <div class="notification-row">
                            <div class="notification-text">
                                <strong>Expiring soon alerts</strong>
                                <p>Notify me when items are close to their expiration date.</p>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" v-model="prefs.notifications.expiringSoon"
                                    @change="schedulePreferencesSave">
                                <span class="toggle-track-pill"></span>
                            </label>
                        </div>
                        <div class="notification-row">
                            <div class="notification-text">
                                <strong>Low stock alerts</strong>
                                <p>Notify me when pantry items are running low.</p>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" v-model="prefs.notifications.lowStock"
                                    @change="schedulePreferencesSave">
                                <span class="toggle-track-pill"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- ── Household Settings ── -->
                <div v-if="section === 'household'" class="content-panel">
                    <div class="panel-heading">
                        <h2>Household Settings</h2>
                        <p>Changes here affect everyone in your household.</p>
                    </div>

                    <div class="divider"></div>

                    <!-- Household Name -->
                    <div class="pref-group">
                        <label class="pref-label">HOUSEHOLD NAME</label>
                        <div class="name-save-row">
                            <input class="text-input" v-model="householdName" placeholder="Household name"
                                :disabled="!isOwner"
                                @keyup.enter="isOwner && saveHouseholdName()" />
                            <button class="save-btn" @click="saveHouseholdName"
                                :disabled="householdNameSaving || !isOwner">
                                <span v-if="householdNameSaved"><i class="bi bi-check-lg"></i> Saved</span>
                                <span v-else-if="householdNameSaving">Saving…</span>
                                <span v-else>Save</span>
                            </button>
                        </div>
                    </div>

                    <div class="divider"></div>

                    <!-- Members -->
                    <div class="pref-group">
                        <label class="pref-label">MEMBERS</label>

                        <div v-for="member in members" :key="member.id" class="member-row">
                            <div class="member-avatar">{{ initials(member.name) }}</div>
                            <div class="member-info">
                                <strong>{{ member.name }}</strong>
                                <span>{{ member.email }}</span>
                            </div>
                            <span class="role-badge" :class="member.id === ownerId ? 'owner' : 'member'">
                                {{ member.id === ownerId ? 'OWNER' : 'MEMBER' }}
                            </span>
                            <button v-if="currentUser && member.id !== currentUser.uid && currentUser.uid === ownerId"
                                class="remove-btn" @click="removeMember(member.id)" title="Remove member">
                                <i class="bi bi-x"></i>
                            </button>
                        </div>

                        <!-- Invite -->
                        <div class="invite-row">
                            <div class="invite-input-wrap">
                                <i class="bi bi-envelope"></i>
                                <input class="invite-input" v-model="inviteEmail" placeholder="Enter email address..."
                                    type="email" @keyup.enter="sendInvite" />
                            </div>
                            <button class="save-btn" @click="sendInvite" :disabled="inviteSending || !inviteEmail.trim()">
                                {{ inviteSending ? 'Sending…' : 'Send Invite' }}
                            </button>
                        </div>
                        <p v-if="inviteSuccess" class="invite-feedback success">{{ inviteSuccess }}</p>
                        <p v-if="inviteError" class="invite-feedback error">{{ inviteError }}</p>

                        <!-- Pending invites -->
                        <div v-if="invites.length" class="pending-section">
                            <p class="pref-label" style="margin-top:12px">PENDING</p>
                            <div v-for="invite in invites" :key="invite.token" class="pending-row">
                                <i class="bi bi-envelope-open"></i>
                                <span class="pending-email">{{ invite.email }}</span>
                                <span class="pending-badge">PENDING</span>
                                <button class="copy-link-btn"
                                    @click="copyInviteLink(invite.token)"
                                    :title="inviteLink(invite.token)">
                                    <i :class="copiedToken === invite.token ? 'bi bi-check2' : 'bi bi-link-45deg'"></i>
                                    {{ copiedToken === invite.token ? 'Copied!' : 'Copy Link' }}
                                </button>
                                <button class="revoke-btn" @click="revokeInvite(invite.token)">Revoke</button>
                            </div>
                        </div>
                    </div>

                    <div class="divider"></div>

                    <!-- Location -->
                    <div class="pref-group">
                        <label class="pref-label">LOCATION
                            <span class="pref-optional">optional</span>
                        </label>
                        <p class="pref-desc">Used for local store availability and other location-aware features.</p>
                        <div class="location-detect-row">
                            <div class="input-wrap-icon">
                                <i class="bi bi-geo-alt field-icon-sm"></i>
                                <input class="text-input zip-input" v-model="zipCode"
                                    placeholder="Zip code"
                                    @change="saveZipCode" />
                            </div>
                            <button class="detect-btn" @click="detectLocation"
                                :disabled="locationStatus === 'detecting'">
                                <i v-if="locationStatus === 'detecting'" class="bi bi-arrow-repeat spin-icon"></i>
                                <i v-else class="bi bi-crosshair"></i>
                                {{ locationStatus === 'detecting' ? 'Detecting…' : 'Auto-detect' }}
                            </button>
                        </div>
                        <p v-if="locationStatus === 'success'" class="location-msg success">
                            <i class="bi bi-check-circle"></i> Location detected.
                        </p>
                        <p v-else-if="locationStatus === 'denied'" class="location-msg warn">
                            <i class="bi bi-exclamation-circle"></i> Location access was denied — enter your zip code manually.
                        </p>
                        <p v-else-if="locationStatus === 'unavailable'" class="location-msg warn">
                            <i class="bi bi-exclamation-circle"></i> Geolocation isn't available in your browser.
                        </p>
                    </div>

                    <div class="divider"></div>

                    <!-- Storage Locations -->
                    <div class="pref-group">
                        <label class="pref-label">STORAGE LOCATIONS</label>
                        <p class="pref-desc">Locations available when adding pantry items.</p>

                        <div v-if="locations.length" class="chip-row">
                            <span v-for="loc in locations" :key="loc" class="chip active location-chip">
                                {{ loc }}
                                <button class="chip-remove" @click="removeLocation(loc)">
                                    <i class="bi bi-x"></i>
                                </button>
                            </span>
                        </div>

                        <div class="location-add-wrap">
                            <div class="location-input-wrap">
                                <input class="text-input" v-model="newLocation"
                                    placeholder="Add a location…"
                                    @keyup.enter="addLocation" />
                                <ul v-if="filteredSuggestions.length" class="location-suggestions">
                                    <li v-for="s in filteredSuggestions" :key="s"
                                        @mousedown.prevent="pickLocationSuggestion(s)">{{ s }}</li>
                                </ul>
                            </div>
                            <button class="save-btn" @click="addLocation">Add</button>
                        </div>
                    </div>

                    <template v-if="isOwner">
                    <div class="divider"></div>

                    <!-- Pantry Behaviour (owner only) -->
                    <div class="pref-group">
                        <label class="pref-label">PANTRY BEHAVIOUR</label>

                        <div class="notification-row">
                            <div class="notification-text">
                                <strong>Auto-restock</strong>
                                <p>Automatically add low stock items to the shopping list.</p>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" v-model="householdPrefs.autoGenShoppingList"
                                    @change="scheduleHouseholdPrefsSave">
                                <span class="toggle-track-pill"></span>
                            </label>
                        </div>

                        <div class="threshold-row">
                            <div class="threshold-label">
                                <strong>Low stock threshold</strong>
                                <p>Items below this quantity are considered low.
                                    Currently <strong>{{ householdPrefs.lowStockThreshold }}%</strong>.</p>
                            </div>
                            <input class="threshold-slider" type="range" min="0" max="100"
                                v-model.number="householdPrefs.lowStockThreshold"
                                @input="scheduleHouseholdPrefsSave" />
                        </div>

                        <div class="threshold-row">
                            <div class="threshold-label">
                                <strong>Expiring soon threshold</strong>
                                <p>Days before expiry to flag an item.
                                    Currently <strong>{{ householdPrefs.expiringSoonThreshold }} days</strong>.</p>
                            </div>
                            <input class="threshold-slider" type="range" min="1" max="14"
                                v-model.number="householdPrefs.expiringSoonThreshold"
                                @input="scheduleHouseholdPrefsSave" />
                        </div>
                    </div>
                    </template>

                    <div class="divider"></div>

                    <!-- Leave Household -->
                    <div class="pref-group">
                        <label class="pref-label">DANGER ZONE</label>
                        <div class="leave-row">
                            <div class="leave-text">
                                <strong>Leave household</strong>
                                <p v-if="isOwner && members.length > 1">You are the owner. Leaving will transfer ownership to another member.</p>
                                <p v-else-if="isOwner">You are the only member. Leaving will delete this household.</p>
                                <p v-else>You will be removed and placed in a new household.</p>
                            </div>
                            <button class="leave-btn" @click="leaveHousehold" :disabled="leavingHousehold">
                                {{ leavingHousehold ? 'Leaving…' : 'Leave' }}
                            </button>
                        </div>
                    </div>

                </div>
            </section>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@use "@/assets/variables" as *;

// ── Panel ─────────────────────────────────────────────────────────────────────

.settings-panel {
    min-height: 100vh;
    background: var(--bg);
    color: var(--text);
    font-family: 'Inter', sans-serif;
}

// ── Close bar ─────────────────────────────────────────────────────────────────

.settings-close-bar {
    display: flex;
    justify-content: flex-end;
    padding: 0.75rem 1.25rem;
    background: var(--bg);
}

.settings-close-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 1rem;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, color 0.15s;

    &:hover { background: rgba(0,0,0,0.06); color: var(--text); }
}

// ── Loading ───────────────────────────────────────────────────────────────────

.settings-loading {
    display: flex;
    justify-content: center;
    padding: 5rem;
}

.spinner {
    width: 32px; height: 32px;
    border: 3px solid var(--border-subtle);
    border-top-color: var(--sage);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

// ── Layout ────────────────────────────────────────────────────────────────────

.settings-layout {
    max-width: 1000px;
    margin: 2.5rem auto;
    padding: 0 1.5rem;
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 1.5rem;
    align-items: start;

    @media (max-width: 680px) {
        grid-template-columns: 1fr;
    }
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

.settings-sidebar {
    background: var(--bg2);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    padding: 1rem 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.sidebar-label {
    font-size: 0.68rem;
    font-family: 'Oxygen', sans-serif;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-muted);
    padding: 0.2rem 0.75rem 0.6rem;
    margin: 0;
}

.sidebar-btn {
    background: none;
    border: none;
    text-align: left;
    padding: 0.55rem 0.75rem;
    border-radius: 8px;
    font-family: 'Inter', sans-serif;
    font-size: 0.9rem;
    color: var(--text);
    cursor: pointer;
    transition: background 0.12s;

    &:hover { background: rgba(0,0,0,0.05); }
    &.active { background: var(--sage); color: #fff; font-weight: 500; }
}

// ── Content Panel ─────────────────────────────────────────────────────────────

.settings-content {
    min-width: 0;
}

.content-panel {
    background: var(--bg2);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    overflow: hidden;
}

.panel-heading {
    padding: 1.5rem 1.75rem 1rem;

    h2 {
        margin: 0 0 0.25rem;
        font-family: 'Quicksand', sans-serif;
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--text);
    }

    p {
        margin: 0;
        font-size: 0.85rem;
        color: var(--text-muted);
    }
}

.divider {
    height: 1px;
    background: var(--border-subtle);
    margin: 0 1.75rem;
}

.pref-group {
    padding: 1.25rem 1.75rem;
}

.pref-label {
    display: block;
    font-size: 0.68rem;
    font-family: 'Oxygen', sans-serif;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 0.75rem;
}

.pref-optional {
    font-size: 0.68rem;
    text-transform: none;
    letter-spacing: 0;
    margin-left: 0.4rem;
    color: var(--text-muted);
    font-weight: 400;
}

.pref-desc {
    font-size: 0.82rem;
    color: var(--text-muted);
    margin: -0.4rem 0 0.75rem;
}

// ── Appearance ────────────────────────────────────────────────────────────────

.appearance-row {
    display: flex;
    gap: 0.75rem;
}

.appearance-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    width: 90px;
    height: 70px;
    border: 2px solid var(--border-subtle);
    border-radius: 10px;
    background: var(--bg);
    color: var(--text);
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    font-size: 0.82rem;
    transition: border-color 0.15s, background 0.15s;

    i { font-size: 1.1rem; }

    &.active {
        border-color: var(--sage);
        background: rgba(77, 102, 71, 0.1);
        color: var(--sage);
        font-weight: 600;
    }
}

// ── Chips ─────────────────────────────────────────────────────────────────────

.chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 14px;
    border: 1px solid var(--border-subtle);
    border-radius: 20px;
    background: var(--bg);
    color: var(--text);
    font-size: 0.85rem;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s, color 0.15s;
    font-family: 'Inter', sans-serif;

    &:hover { border-color: var(--sage); }

    &.active {
        background: var(--sage);
        border-color: var(--sage);
        color: #fff;
    }
}

.location-chip { cursor: default; }

.chip-remove {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    padding: 0;
    font-size: 0.85rem;
    line-height: 1;
    display: flex;
    align-items: center;
    opacity: 0.7;

    &:hover { opacity: 1; }
}

// ── Default View Pills ────────────────────────────────────────────────────────

.view-pills {
    display: flex;
    gap: 8px;
}

.view-pill {
    padding: 6px 16px;
    border: 1px solid var(--border-subtle);
    border-radius: 20px;
    background: var(--bg);
    color: var(--text);
    font-size: 0.85rem;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    transition: border-color 0.15s, background 0.15s, color 0.15s;

    &:hover { border-color: var(--sage); }

    &.active {
        background: var(--sage);
        border-color: var(--sage);
        color: #fff;
        font-weight: 500;
    }
}

// ── Toggle Switch ─────────────────────────────────────────────────────────────

.toggle-switch {
    position: relative;
    flex-shrink: 0;
    cursor: pointer;

    input { position: absolute; opacity: 0; width: 0; height: 0; }

    .toggle-track-pill {
        display: block;
        width: 44px;
        height: 24px;
        border-radius: 12px;
        background: var(--border-subtle);
        position: relative;
        transition: background 0.2s;

        &::after {
            content: '';
            position: absolute;
            top: 3px;
            left: 3px;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #fff;
            box-shadow: 0 1px 4px rgba(0,0,0,0.2);
            transition: left 0.2s;
        }
    }

    input:checked + .toggle-track-pill {
        background: var(--sage);

        &::after { left: 23px; }
    }
}

// ── Notifications ─────────────────────────────────────────────────────────────

.notification-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.6rem 0;

    & + & { border-top: 1px solid var(--border-subtle); }
}

.notification-text {
    strong { display: block; font-size: 0.9rem; color: var(--text); }
    p { margin: 2px 0 0; font-size: 0.8rem; color: var(--text-muted); }
}

// ── Household Name ────────────────────────────────────────────────────────────

.name-save-row {
    display: flex;
    gap: 0.75rem;
    align-items: center;
}

.text-input {
    flex: 1;
    padding: 0.5rem 0.85rem;
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    background: var(--bg);
    color: var(--text);
    font-family: 'Inter', sans-serif;
    font-size: 0.9rem;
    outline: none;
    transition: border-color 0.15s;

    &:focus { border-color: var(--sage); }
}

.save-btn {
    padding: 0.5rem 1.1rem;
    background: var(--sage);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-family: 'Inter', sans-serif;
    font-size: 0.88rem;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s;

    &:hover { background: var(--sage-dark, #3a5038); }
    &:disabled { opacity: 0.6; cursor: default; }
}

// ── Members ───────────────────────────────────────────────────────────────────

.member-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 0;

    & + & { border-top: 1px solid var(--border-subtle); }
}

.member-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--sage);
    color: #fff;
    font-size: 0.8rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.member-info {
    flex: 1;
    min-width: 0;

    strong { display: block; font-size: 0.9rem; }
    span { font-size: 0.8rem; color: var(--text-muted); }
}

.role-badge {
    font-size: 0.65rem;
    font-family: 'Oxygen', sans-serif;
    letter-spacing: 0.08em;
    padding: 3px 8px;
    border-radius: 4px;
    font-weight: 700;

    &.owner { background: var(--sage); color: #fff; }
    &.member { background: var(--border-subtle); color: var(--text-muted); }
}

.remove-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 1rem;
    padding: 4px;
    border-radius: 4px;
    transition: color 0.15s, background 0.15s;

    &:hover { color: var(--danger); background: rgba(176, 53, 39, 0.1); }
}

.invite-row {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    margin-top: 0.75rem;
}

.invite-input-wrap {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    padding: 0 0.85rem;
    background: var(--bg);
    transition: border-color 0.15s;

    &:focus-within { border-color: var(--sage); }

    i { color: var(--text-muted); font-size: 0.85rem; }
}

.invite-input {
    flex: 1;
    border: none;
    background: transparent;
    color: var(--text);
    font-family: 'Inter', sans-serif;
    font-size: 0.9rem;
    padding: 0.5rem 0;
    outline: none;
}

.invite-feedback {
    font-size: 0.82rem;
    margin: 0.4rem 0 0;

    &.success { color: var(--success); }
    &.error   { color: var(--danger); }
}

.pending-section { margin-top: 0.5rem; }

.pending-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.5rem 0;
    border-top: 1px solid var(--border-subtle);
    font-size: 0.88rem;

    i { color: var(--text-muted); }
}

.pending-email { flex: 1; color: var(--text-muted); }

.pending-badge {
    font-size: 0.65rem;
    font-family: 'Oxygen', sans-serif;
    letter-spacing: 0.08em;
    padding: 3px 8px;
    border-radius: 4px;
    background: rgba(200, 146, 45, 0.18);
    color: var(--warning);
    font-weight: 700;
}

.copy-link-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    background: none;
    border: 1px solid var(--border-subtle);
    border-radius: 6px;
    padding: 0.2rem 0.55rem;
    font-size: 0.75rem;
    font-family: 'Oxygen', sans-serif;
    cursor: pointer;
    color: var(--text-muted);
    white-space: nowrap;
    transition: background 0.15s, color 0.15s;

    &:hover { background: var(--surface2); color: var(--text); }
}

.revoke-btn {
    background: none;
    border: 1px solid var(--border-subtle);
    border-radius: 6px;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 0.8rem;
    padding: 3px 10px;
    transition: border-color 0.15s, color 0.15s;

    &:hover { border-color: var(--danger); color: var(--danger); }
}

// ── Location detect ───────────────────────────────────────────────────────────

.location-detect-row {
    display: flex;
    gap: 0.75rem;
    align-items: center;
}

.input-wrap-icon {
    position: relative;
    flex: 1;

    .field-icon-sm {
        position: absolute;
        left: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-muted);
        font-size: 0.85rem;
        pointer-events: none;
    }
}

.zip-input {
    padding-left: 2.2rem !important;
    max-width: 140px;
}

.detect-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 1rem;
    background: var(--bg);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    font-family: 'Inter', sans-serif;
    font-size: 0.85rem;
    color: var(--text);
    cursor: pointer;
    white-space: nowrap;
    transition: border-color 0.15s, background 0.15s;

    &:hover:not(:disabled) { border-color: var(--sage); background: rgba(77,102,71,0.06); }
    &:disabled { opacity: 0.6; cursor: default; }
}

.spin-icon { animation: spin 0.8s linear infinite; }

.location-msg {
    font-size: 0.8rem;
    margin: 0.5rem 0 0;
    display: flex;
    align-items: center;
    gap: 0.35rem;

    &.success { color: var(--success); }
    &.warn { color: var(--warning); }
}

// ── Storage Locations ─────────────────────────────────────────────────────────

.location-add-wrap {
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
    margin-top: 0.75rem;
}

.location-input-wrap {
    flex: 1;
    position: relative;
}

.location-suggestions {
    position: absolute;
    top: calc(100% + 4px);
    left: 0; right: 0;
    background: var(--bg2);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    list-style: none;
    margin: 0; padding: 4px 0;
    z-index: 100;
    box-shadow: 0 4px 16px rgba(0,0,0,0.12);

    li {
        padding: 8px 14px;
        font-size: 0.88rem;
        cursor: pointer;
        color: var(--text);

        &:hover { background: rgba(0,0,0,0.05); }
    }
}

// ── Pantry Behaviour ──────────────────────────────────────────────────────────

.threshold-row {
    padding: 0.75rem 0;
    border-top: 1px solid var(--border-subtle);
}

.threshold-label {
    strong { font-size: 0.9rem; display: block; }
    p { margin: 2px 0 0.5rem; font-size: 0.8rem; color: var(--text-muted); }
}

.threshold-slider {
    width: 100%;
    accent-color: var(--sage);
    cursor: pointer;
}

// ── Leave Household ───────────────────────────────────────────────────────────

.leave-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
}

.leave-text {
    strong { display: block; font-size: 0.9rem; color: var(--text); }
    p { margin: 2px 0 0; font-size: 0.8rem; color: var(--text-muted); }
}

.leave-btn {
    padding: 0.5rem 1.1rem;
    background: none;
    border: 1px solid var(--danger);
    color: var(--danger);
    border-radius: 8px;
    font-family: 'Inter', sans-serif;
    font-size: 0.88rem;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s, color 0.15s;
    flex-shrink: 0;

    &:hover { background: var(--danger); color: #fff; }
    &:disabled { opacity: 0.6; cursor: default; }
}
</style>

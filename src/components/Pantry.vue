<script>
import PantryTable from './PantryTable.vue';
import { getSuggestions } from '../data/ingredientCategories.js';

export default {
    name: 'Pantry',

    components: { PantryTable },

    props: {
        products: { type: Array, required: true },
        categories: { type: Array, required: true },
        units: { type: Array, required: true },
        isMobile: { type: Boolean, required: true },
        locations: { type: Array, default: () => [] },
        loading: { type: Boolean, default: false },
        visible: { type: Boolean, default: true },
    },

    emits: ['add-item', 'delete-product', 'delete-item', 'restock-change'],

    data() {
        return {
            selectedCategory: null,
            selectedMetaFilter: 'all',
            selectedLocation: null,
            searchQuery: '',
            searchOpen: false,
            pantryAddName: '',
            pantryAddSuggestions: [],
            pantryAddHighlightedIdx: -1,
            pantryAddShowSuggestions: false,
            filterOpen: false,
            currentPage: 1,
            pageSize: 10,
            pageDirection: 'forward',
            pageTransitioning: false,
            collapsed: { meta: false, location: false, categories: false },
        };
    },

    computed: {
        occupiedCategories() {
            const names = new Set(this.products.map(p => p.product.category));
            const occupied = this.categories.filter(c => names.has(c.name));
            if (this.selectedCategory && !names.has(this.selectedCategory.name)) {
                this.selectedCategory = null;
            }
            return occupied;
        },

        pantryTable() {
            let items = this.products;

            if (this.selectedCategory !== null) {
                items = items.filter(p => p.product.category === this.selectedCategory.name);
            }

            if (this.searchQuery.trim() !== '') {
                const query = this.searchQuery.toLowerCase();
                items = items.filter(p => p.product.name.toLowerCase().includes(query));
            }

            if (this.selectedMetaFilter === 'expiring-soon') {
                const cutoff = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
                items = items.filter(p => p.expiration.toDate() <= cutoff);
            } else if (this.selectedMetaFilter === 'low-qty') {
                items = items.filter(p => p.isLowQty());
            }

            if (this.selectedLocation !== null) {
                items = items.filter(p =>
                    p.location === this.selectedLocation ||
                    p.product.defaultLocation === this.selectedLocation
                );
            }

            return items.slice().sort((a, b) =>
                (b.product.addedAt ?? 0) - (a.product.addedAt ?? 0)
            )
        },

        paginatedItems() {
            const seen = new Set();
            const productOrder = [];
            for (const item of this.pantryTable) {
                if (!seen.has(item.product.id)) {
                    seen.add(item.product.id);
                    productOrder.push(item.product.id);
                }
            }
            const start = (this.currentPage - 1) * this.pageSize;
            const pageIds = new Set(productOrder.slice(start, start + this.pageSize));
            return this.pantryTable.filter(item => pageIds.has(item.product.id));
        },

        totalPages() {
            const unique = new Set(this.pantryTable.map(i => i.product.id));
            return Math.max(1, Math.ceil(unique.size / this.pageSize));
        },

        hasActiveFilters() {
            return this.selectedMetaFilter !== 'all' || this.selectedCategory !== null || this.selectedLocation !== null;
        },

        pageNumbers() {
            const total = this.totalPages;
            const cur = this.currentPage;
            if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
            const pages = [1];
            if (cur > 3) pages.push('...');
            const lo = Math.max(2, cur - 1);
            const hi = Math.min(total - 1, cur + 1);
            for (let i = lo; i <= hi; i++) pages.push(i);
            if (cur < total - 2) pages.push('...');
            pages.push(total);
            return pages;
        },
    },

    watch: {
        selectedCategory() { this.currentPage = 1; },
        selectedMetaFilter() { this.currentPage = 1; },
        searchQuery() { this.currentPage = 1; },
        selectedLocation() { this.currentPage = 1; },
        totalPages(val) {
            if (this.currentPage > val) this.currentPage = val;
        },
        loading(newVal, oldVal) {
            if (oldVal && !newVal) this.$nextTick(() => this.recalcPageSize());
        },
        isMobile() {
            this.$nextTick(() => {
                this.setPantryHeight();
                this.recalcPageSize();
            });
        },
        visible(val) {
            if (val) this.$nextTick(() => {
                this.setPantryHeight();
                this.recalcPageSize();
            });
        },
    },

    mounted() {
        this.$nextTick(() => {
            this.setPantryHeight();
            this.setupTableResizeObserver();
        });
        document.fonts.ready.then(() => this.$nextTick(() => this.setPantryHeight()));
        window.addEventListener('resize', this.handlePantryResize);
    },

    beforeUnmount() {
        this._tableResizeObserver?.disconnect();
        window.removeEventListener('resize', this.handlePantryResize);
    },

    methods: {
        // Navigates to the given page and sets the transition direction
        goToPage(n) {
            if (n === this.currentPage) return;
            this.pageDirection = n > this.currentPage ? 'forward' : 'backward';
            this.currentPage = n;
        },

        // Sets the active category filter
        selectCategory(category) {
            this.selectedCategory = category;
        },

        // Sets the active status filter (all / expiring-soon / low-qty)
        selectMetaFilter(filter) {
            this.selectedMetaFilter = filter;
        },

        // Toggles the active location filter, clearing it if already selected
        selectLocation(loc) {
            this.selectedLocation = this.selectedLocation === loc ? null : loc;
        },

        // Validates the add-item input and emits add-item to the parent
        submitPantryAdd() {
            const name = this.pantryAddName.trim();
            if (!name) return;
            this.$emit('add-item', { name, categoryOverride: this.selectedCategory });
            this.pantryAddName = '';
            this.pantryAddSuggestions = [];
            this.pantryAddShowSuggestions = false;
            this.pantryAddHighlightedIdx = -1;
            if (this.selectedMetaFilter !== 'all') this.selectedMetaFilter = 'all';
        },

        // Updates the autocomplete suggestion list as the user types
        onPantryAddInput() {
            this.pantryAddHighlightedIdx = -1;
            this.pantryAddSuggestions = getSuggestions(this.pantryAddName);
            this.pantryAddShowSuggestions = this.pantryAddSuggestions.length > 0;
        },

        // Handles keyboard navigation (Enter/ArrowUp/ArrowDown/Escape) for the autocomplete dropdown
        onPantryAddKeydown(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (this.pantryAddShowSuggestions && this.pantryAddHighlightedIdx >= 0) {
                    this.pickPantryAddSuggestion(this.pantryAddSuggestions[this.pantryAddHighlightedIdx]);
                } else {
                    this.submitPantryAdd();
                }
                return;
            }
            if (!this.pantryAddShowSuggestions) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.pantryAddHighlightedIdx = Math.min(this.pantryAddHighlightedIdx + 1, this.pantryAddSuggestions.length - 1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.pantryAddHighlightedIdx = Math.max(this.pantryAddHighlightedIdx - 1, -1);
            } else if (e.key === 'Escape') {
                this.pantryAddShowSuggestions = false;
            }
        },

        // Fills the input with the chosen suggestion and submits the add immediately
        pickPantryAddSuggestion(s) {
            this.pantryAddName = s.charAt(0).toUpperCase() + s.slice(1);
            this.pantryAddSuggestions = [];
            this.pantryAddShowSuggestions = false;
            this.pantryAddHighlightedIdx = -1;
            this.submitPantryAdd();
        },

        // Calculates and sets the pantry panel height to fill the remaining viewport
        setPantryHeight() {
            const el = this.$el;
            if (!el) return;
            el.style.height = '';
            if (this.isMobile || !this.visible) return;
            const rect = el.getBoundingClientRect();
            const available = window.innerHeight - rect.top - 20;
            if (available > 100) el.style.height = available + 'px';
        },

        // Attaches a ResizeObserver to recalculate page size whenever the panel resizes
        setupTableResizeObserver() {
            const el = this.$el;
            if (!el) return;
            this._tableResizeObserver = new ResizeObserver(() => this.recalcPageSize());
            this._tableResizeObserver.observe(el);
            this.recalcPageSize();
        },

        // Measures available height and recomputes how many table rows fit per page
        recalcPageSize() {
            if (this.isMobile) return;
            const el = this.$el;
            const wrap = this.$refs.tableWrap;
            if (!el || !wrap) return;
            const pantryH = el.clientHeight;
            if (pantryH < 100) return;

            const toolbarH = el.querySelector('.pantry-toolbar')?.offsetHeight ?? 66;
            const paginationH = el.querySelector('.pagination-bar')?.offsetHeight ?? 0;
            const countH = el.querySelector('.item-count')?.offsetHeight ?? 25;
            const headerH = wrap.querySelector('.table-header')?.offsetHeight ?? 36;

            const rowEl = wrap.querySelector('.product');
            const rowH = rowEl ? rowEl.offsetHeight : 42;
            if (rowH < 10) return;

            const usable = pantryH - toolbarH - paginationH - countH - headerH;
            const computed = Math.max(1, Math.floor(usable / rowH));
            if (computed !== this.pageSize) this.pageSize = computed;
        },

        // Recalculates panel height on window resize
        handlePantryResize() {
            this.setPantryHeight();
        },

        // Hides autocomplete suggestions after a short delay to allow click events to register first
        hidePantryAddSuggestions() {
            setTimeout(() => { this.pantryAddShowSuggestions = false; }, 120);
        },

        // Opens the search bar and focuses the search input
        openSearch() {
            this.searchOpen = true;
            this.$nextTick(() => this.$refs.searchInput?.focus());
        },

        // Clears the search query and closes the search bar
        closeSearch() {
            this.searchQuery = '';
            this.searchOpen = false;
        },

        // Closes the search bar on blur if the query is empty
        onSearchBlur() {
            if (!this.searchQuery.trim()) this.closeSearch();
        },


    },
}
</script>

<template>
    <section class="tab-pane show fade active" id="pantry" role="tabpanel" aria-labelledby="pantry-tab">
        <div class="pantry-layout">

            <!-- ── Filter Sidebar ── -->
            <aside class="filter-sidebar" v-if="!isMobile">

                <!-- Status -->
                <div class="filter-section">
                    <button class="section-header" @click="collapsed.meta = !collapsed.meta">
                        <span>Status</span>
                        <i :class="collapsed.meta ? 'bi bi-chevron-right' : 'bi bi-chevron-down'"></i>
                    </button>
                    <div v-show="!collapsed.meta" class="section-pills">
                        <button class="side-pill" :class="{ active: selectedMetaFilter === 'all' }"
                            @click="selectMetaFilter('all')">All</button>
                        <button class="side-pill" :class="{ active: selectedMetaFilter === 'expiring-soon' }"
                            @click="selectMetaFilter('expiring-soon')">Expiring Soon</button>
                        <button class="side-pill" :class="{ active: selectedMetaFilter === 'low-qty' }"
                            @click="selectMetaFilter('low-qty')">Low Stock</button>
                    </div>
                </div>

                <!-- Location -->
                <div v-if="locations.length" class="filter-section">
                    <button class="section-header" @click="collapsed.location = !collapsed.location">
                        <span>Location</span>
                        <i :class="collapsed.location ? 'bi bi-chevron-right' : 'bi bi-chevron-down'"></i>
                    </button>
                    <div v-show="!collapsed.location" class="section-pills">
                        <button class="side-pill" :class="{ active: selectedLocation === null }"
                            @click="selectLocation(null)">All</button>
                        <button v-for="loc in locations" :key="loc" class="side-pill"
                            :class="{ active: selectedLocation === loc }"
                            @click="selectLocation(loc)">{{ loc }}</button>
                    </div>
                </div>

                <!-- Category -->
                <div class="filter-section">
                    <button class="section-header" @click="collapsed.categories = !collapsed.categories">
                        <span>Category</span>
                        <i :class="collapsed.categories ? 'bi bi-chevron-right' : 'bi bi-chevron-down'"></i>
                    </button>
                    <div v-show="!collapsed.categories" class="section-pills">
                        <button class="side-pill" :class="{ active: selectedCategory === null }"
                            @click="selectCategory(null)">All</button>
                        <button v-for="cat in occupiedCategories" :key="cat.id" class="side-pill"
                            :class="{ active: selectedCategory && selectedCategory.id === cat.id }"
                            @click="selectCategory(cat)">{{ cat.name }}</button>
                    </div>
                </div>

            </aside>

            <!-- ── Main Content ── -->
            <div class="pantry-main" :class="{ 'mobile-scroll': isMobile }">

                <!-- Toolbar -->
                <div class="pantry-toolbar">
                    <div class="suggest-wrap" :class="{ open: pantryAddShowSuggestions }">
                        <input type="text" class="pantry-add-input"
                            :placeholder="selectedCategory ? 'Add to ' + selectedCategory.name + '…' : 'Add item…'"
                            v-model="pantryAddName" autocomplete="off"
                            @input="onPantryAddInput" @keydown="onPantryAddKeydown"
                            @blur="hidePantryAddSuggestions" />
                        <transition name="suggest-drop">
                            <ul class="suggest-dropdown" v-if="pantryAddShowSuggestions">
                                <li v-for="(s, i) in pantryAddSuggestions" :key="s" class="suggest-item"
                                    :class="{ active: i === pantryAddHighlightedIdx }"
                                    :style="{ animationDelay: (i * 0.05) + 's' }"
                                    @mousedown.prevent="pickPantryAddSuggestion(s)">
                                    {{ s.charAt(0).toUpperCase() + s.slice(1) }}
                                </li>
                            </ul>
                        </transition>
                    </div>
                    <button v-if="isMobile" class="mobile-filter-btn" :class="{ 'has-filters': hasActiveFilters }" @click="filterOpen = true" aria-label="Filters">
                        <i :class="hasActiveFilters ? 'bi bi-funnel-fill' : 'bi bi-funnel'"></i>
                        <span v-if="hasActiveFilters" class="filter-active-dot"></span>
                    </button>

                    <div class="toolbar-search" :class="{ 'search-open': searchOpen }">
                        <button class="search-icon-btn" @click="openSearch" title="Search pantry items">
                            <i class="bi bi-search"></i>
                        </button>
                        <input
                            ref="searchInput"
                            type="text"
                            class="search-input"
                            placeholder="Search…"
                            v-model="searchQuery"
                            @blur="onSearchBlur"
                            @keydown.escape="closeSearch"
                        >
                    </div>
                </div>

                <!-- Table -->
                <div ref="tableWrap" class="table-wrap" :class="{ 'page-turning': pageTransitioning, 'mobile-scroll': isMobile }">
                    <transition :name="'page-' + pageDirection" mode="out-in"
                        @before-leave="pageTransitioning = true"
                        @after-enter="pageTransitioning = false"
                        @enter-cancelled="pageTransitioning = false">
                        <pantry-table
                            :key="isMobile ? 'mobile-all' : currentPage"
                            :products="isMobile ? pantryTable : paginatedItems"
                            :is-mobile="isMobile"
                            :units="units"
                            :categories="categories"
                            :locations="locations"
                            :loading="loading"

                            @delete-product="$emit('delete-product', $event)"
                            @delete-item="$emit('delete-item', $event)"
                            @restock-change="$emit('restock-change')" />
                    </transition>
                </div>

                <!-- Pagination -->
                <div class="pagination-bar" v-if="totalPages > 1 && !isMobile">
                    <button class="page-btn"
                        @click="goToPage(Math.max(1, currentPage - 1))"
                        :disabled="currentPage === 1">
                        <i class="bi bi-chevron-left"></i>
                    </button>
                    <template v-for="(p, idx) in pageNumbers" :key="idx">
                        <span v-if="p === '...'" class="page-ellipsis">…</span>
                        <button v-else class="page-btn" :class="{ active: p === currentPage }"
                            @click="goToPage(p)">{{ p }}</button>
                    </template>
                    <button class="page-btn"
                        @click="goToPage(Math.min(totalPages, currentPage + 1))"
                        :disabled="currentPage === totalPages">
                        <i class="bi bi-chevron-right"></i>
                    </button>
                </div>

                <div class="item-count">
                    {{ pantryTable.length }} item{{ pantryTable.length !== 1 ? 's' : '' }}
                    <template v-if="totalPages > 1 && !isMobile"> · page {{ currentPage }} of {{ totalPages }}</template>
                </div>

            </div>
        </div>

        <!-- ── Mobile Filter Panel ── -->
        <Teleport to="body">
            <transition name="filter-fade">
                <div v-if="filterOpen" class="mobile-filter-overlay" @click="filterOpen = false"></div>
            </transition>
            <transition name="filter-drop">
                <div v-if="filterOpen" class="mobile-filter-panel">
                    <div class="filter-panel-handle"></div>
                    <div class="filter-panel-head">
                        <span class="filter-panel-title">Filters</span>
                        <button class="filter-panel-close" @click="filterOpen = false">
                            <i class="bi bi-x-lg"></i>
                        </button>
                    </div>

                    <div class="filter-panel-group">
                        <div class="filter-panel-label">Status</div>
                        <div class="filter-panel-chips">
                            <button class="filter-chip" :class="{ active: selectedMetaFilter === 'all' }" @click="selectMetaFilter('all')">All</button>
                            <button class="filter-chip" :class="{ active: selectedMetaFilter === 'expiring-soon' }" @click="selectMetaFilter('expiring-soon')">Expiring Soon</button>
                            <button class="filter-chip" :class="{ active: selectedMetaFilter === 'low-qty' }" @click="selectMetaFilter('low-qty')">Low Stock</button>
                        </div>
                    </div>

                    <div v-if="locations.length" class="filter-panel-group">
                        <div class="filter-panel-label">Location</div>
                        <div class="filter-panel-chips">
                            <button class="filter-chip" :class="{ active: selectedLocation === null }" @click="selectLocation(null)">All</button>
                            <button v-for="loc in locations" :key="loc" class="filter-chip"
                                :class="{ active: selectedLocation === loc }"
                                @click="selectLocation(loc)">{{ loc }}</button>
                        </div>
                    </div>

                    <div class="filter-panel-group">
                        <div class="filter-panel-label">Category</div>
                        <div class="filter-panel-chips">
                            <button class="filter-chip" :class="{ active: selectedCategory === null }" @click="selectCategory(null)">All</button>
                            <button v-for="cat in occupiedCategories" :key="cat.id" class="filter-chip"
                                :class="{ active: selectedCategory && selectedCategory.id === cat.id }"
                                @click="selectCategory(cat)">{{ cat.name }}</button>
                        </div>
                    </div>

                    <button class="filter-panel-done" @click="filterOpen = false">Done</button>
                </div>
            </transition>
        </Teleport>
    </section>
</template>

<style lang="scss" scoped>
@use "@/assets/variables" as *;

// ── Panel ──────────────────────────────────────────────────

#pantry {
    box-shadow: var(--box-shadow);
    margin-top: 50px;
    background-color: var(--bg);
    border-radius: 15px;
    overflow: hidden;
}

.pantry-layout {
    display: flex;
    height: 100%;
}

// ── Filter Sidebar ─────────────────────────────────────────

.filter-sidebar {
    width: 28%;
    flex-shrink: 0;
    min-height: 0;
    border-right: 1px solid var(--border-subtle);
    overflow-y: auto;
    padding: 12px 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    scrollbar-width: thin;
    scrollbar-color: var(--surface3) transparent;
}

.filter-section + .filter-section {
    border-top: 1px solid var(--border-subtle);
    padding-top: 4px;
    margin-top: 4px;
}

.section-header {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: none;
    border: none;
    padding: 7px 10px;
    border-radius: 8px;
    cursor: pointer;
    font-family: 'Oxygen', sans-serif;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-muted);
    transition: background 0.12s;

    &:hover { background: var(--surface); }

    i { font-size: 0.6rem; opacity: 0.55; }
}

.section-pills {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 2px 4px 8px;
}

.side-pill {
    background: transparent;
    border: none;
    border-radius: 8px;
    padding: 7px 12px;
    font-family: 'Oxygen', sans-serif;
    font-size: 0.88rem;
    cursor: pointer;
    color: var(--text-muted);
    text-align: left;
    transition: background 0.12s, color 0.12s;

    &:hover {
        background: var(--surface);
        color: var(--text);
    }

    &.active {
        background: var(--surface2);
        color: var(--text);
        font-weight: 600;
    }

}

// ── Main Content ───────────────────────────────────────────

.pantry-main {
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

// ── Toolbar ────────────────────────────────────────────────

.pantry-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 20px 12px;
    border-bottom: 1px solid var(--border-subtle);
    flex-shrink: 0;
}

.suggest-wrap {
    flex: 1;
    max-width: 300px;
    position: relative;
    transition: max-width 0.2s ease;

    &:focus-within { max-width: 380px; }
}

.suggest-wrap.open .pantry-add-input {
    border-top-left-radius: 20px;
    border-top-right-radius: 20px;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
}

.pantry-add-input {
    border: none;
    border-radius: 50px;
    padding: 10px 18px;
    font-family: 'Inter', sans-serif;
    font-size: 0.95rem;
    outline: none;
    width: 100%;
    transition: border-radius 0.15s ease;
    background-color: var(--search-surface);
}

.toolbar-search {
    display: flex;
    align-items: center;
    margin-left: auto;
    border-radius: 50px;
    background-color: var(--search-surface);
    overflow: hidden;
    width: 40px;
    transition: width 0.28s cubic-bezier(0.4, 0, 0.2, 1);

    &.search-open { width: 220px; }
}

.search-icon-btn {
    flex-shrink: 0;
    width: 40px;
    padding: 10px 0;
    background: none;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text-muted);
    transition: color 0.15s;

    &:hover { color: var(--text); }

    i { font-size: 0.9rem; }
}

.search-input {
    flex: 1;
    min-width: 0;
    border: none;
    background: transparent;
    padding: 0 14px 0 2px;
    font-family: 'Inter', sans-serif;
    font-size: 0.85rem;
    outline: none;
    opacity: 0;
    transition: opacity 0.15s ease 0.1s;

    .search-open & { opacity: 1; }
}

// ── Table wrap (scrolls independently) ────────────────────

.table-wrap {
    flex: 1;
    overflow: auto;
    scrollbar-gutter: stable;

    &.page-turning { overflow-x: hidden; }
}

// ── Pagination ─────────────────────────────────────────────

.pagination-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 8px 20px;
    flex-shrink: 0;
    border-top: 1px solid var(--border-subtle);
}

.page-btn {
    min-width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid var(--border-subtle);
    background: var(--bg);
    color: var(--text-muted);
    font-family: 'Oxygen', sans-serif;
    font-size: 0.85rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 8px;
    transition: background 0.12s, color 0.12s, border-color 0.12s;

    &:hover:not(:disabled) {
        background: var(--surface);
        color: var(--text);
    }

    &.active {
        background: var(--dusty-blue);
        border-color: var(--dusty-blue);
        color: #fff;
        font-weight: 600;
    }

    &:disabled {
        opacity: 0.35;
        cursor: default;
    }
}

.page-ellipsis {
    color: var(--text-muted);
    padding: 0 4px;
    font-size: 0.85rem;
    user-select: none;
}

.item-count {
    text-align: center;
    font-family: 'Oxygen', sans-serif;
    font-size: 0.7rem;
    color: var(--text-muted);
    padding: 3px 20px 8px;
    opacity: 0.6;
}

// ── Suggest dropdown ───────────────────────────────────────

.suggest-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--bg);
    border: 1px solid var(--border-subtle);
    border-top: none;
    border-bottom-left-radius: 20px;
    border-bottom-right-radius: 20px;
    list-style: none;
    margin: 0;
    padding: 4px 0 8px;
    z-index: 1100;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
    max-height: 220px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--surface3) transparent;
}

.suggest-item {
    padding: 8px 18px;
    font-family: 'Inter', sans-serif;
    font-size: 0.9rem;
    cursor: pointer;
    color: var(--text);
    animation: suggest-in 0.12s ease both;

    &:hover, &.active { background: var(--surface); }
}

@keyframes suggest-in {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
}

.suggest-drop-enter-active,
.suggest-drop-leave-active { transition: opacity 0.12s ease, transform 0.12s ease; }
.suggest-drop-enter-from   { opacity: 0; transform: translateY(-6px); }
.suggest-drop-leave-to     { opacity: 0; transform: translateY(-4px); }

// ── Mobile panel: full-bleed, no radius ───────────────────

@media (max-width: 768px) {
    #pantry {
        margin-top: 0;
        border-radius: 0;
        box-shadow: none;
        overflow: visible;
    }

    .table-wrap {
        overflow-x: hidden;
        scrollbar-gutter: auto;
    }

    .pantry-toolbar {
        position: sticky;
        top: 0;
        z-index: 10;
        background: var(--bg);
    }
}

// ── Mobile scroll (no pagination) ─────────────────────────

.pantry-main.mobile-scroll {
    overflow: visible;
    height: auto;
    flex: none;
    width: 100%;
}

.table-wrap.mobile-scroll {
    overflow: visible;
    flex: none;
    height: auto;
}

// ── Mobile filter button ───────────────────────────────────

.mobile-filter-btn {
    position: relative;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: var(--search-surface);
    color: var(--text-muted);
    cursor: pointer;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    flex-shrink: 0;
    transition: color 0.15s, background 0.15s;

    &:hover, &.has-filters { color: var(--sage); }
}

.filter-active-dot {
    position: absolute;
    top: 7px;
    right: 7px;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--sage);
    pointer-events: none;
}

// ── Mobile filter panel (rendered in <body> via Teleport) ──

.mobile-filter-overlay {
    position: fixed;
    inset: 0;
    z-index: 399;
    background: rgba(0, 0, 0, 0.35);
}

.mobile-filter-panel {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 400;
    background: var(--bg);
    border-bottom-left-radius: 24px;
    border-bottom-right-radius: 24px;
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.22);
    padding: 12px 20px 24px;
    max-height: 80vh;
    overflow-y: auto;
}

.filter-panel-handle {
    width: 36px;
    height: 4px;
    border-radius: 2px;
    background: var(--border-subtle);
    margin: 0 auto 14px;
}

.filter-panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 18px;
}

.filter-panel-title {
    font-family: 'Oxygen', sans-serif;
    font-weight: 700;
    font-size: 1rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text);
}

.filter-panel-close {
    background: none;
    border: none;
    font-size: 1rem;
    color: var(--text-muted);
    cursor: pointer;
    padding: 4px;
    line-height: 1;
    &:hover { color: var(--text); }
}

.filter-panel-group {
    margin-bottom: 18px;
}

.filter-panel-label {
    font-family: 'Oxygen', sans-serif;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 10px;
}

.filter-panel-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.filter-chip {
    border: 1.5px solid var(--border-subtle);
    border-radius: 20px;
    padding: 6px 14px;
    font-family: 'Oxygen', sans-serif;
    font-size: 0.88rem;
    background: transparent;
    color: var(--text);
    cursor: pointer;
    transition: background 0.12s, border-color 0.12s, color 0.12s;

    &:hover {
        background: var(--surface);
        border-color: var(--surface2);
    }

    &.active {
        background: var(--sage);
        border-color: var(--sage);
        color: #fff;
        font-weight: 600;
    }
}

.filter-panel-done {
    width: 100%;
    margin-top: 4px;
    padding: 13px;
    border-radius: 12px;
    border: none;
    background: var(--sage);
    color: #fff;
    font-family: 'Oxygen', sans-serif;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.15s;
    &:hover { opacity: 0.88; }
}

// ── Filter panel transitions ───────────────────────────────

@keyframes filter-bounce-up {
    0%   { transform: translateY(0); }
    22%  { transform: translateY(18px); }
    100% { transform: translateY(-110%); }
}

.filter-drop-enter-active {
    transition: transform 0.38s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.filter-drop-leave-active {
    animation: filter-bounce-up 0.38s ease-in forwards;
}
.filter-drop-enter-from {
    transform: translateY(-110%);
}

.filter-fade-enter-active,
.filter-fade-leave-active { transition: opacity 0.25s; }
.filter-fade-enter-from,
.filter-fade-leave-to     { opacity: 0; }

// ── Page-turn transitions ──────────────────────────────────

.page-forward-leave-active,
.page-forward-enter-active,
.page-backward-leave-active,
.page-backward-enter-active {
    transition: opacity 0.18s ease, transform 0.18s ease;
}

// Going forward (higher page): old exits left, new enters from right
.page-forward-leave-to   { opacity: 0; transform: translateX(-40px); }
.page-forward-enter-from { opacity: 0; transform: translateX(40px); }

// Going backward (lower page): old exits right, new enters from left
.page-backward-leave-to   { opacity: 0; transform: translateX(40px); }
.page-backward-enter-from { opacity: 0; transform: translateX(-40px); }
</style>

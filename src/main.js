import $ from 'jquery'
import 'jquery-ui-dist/jquery-ui.js'
import 'jquery-ui-dist/jquery-ui.css'
window.$ = $
window.jQuery = $

import { createApp } from 'vue'
import App from './App.vue'
import './assets/main.scss'

createApp(App).mount('#app')

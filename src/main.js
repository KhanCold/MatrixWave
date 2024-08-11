import Vue from 'vue'
import App from './App.vue'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import store from './store'

Vue.config.productionTip = false

Vue.use(ElementUI)

new Vue({
    store,
    render: h => h(App),
    beforeCreate() {
        Vue.prototype.$bus = this//安装全局事件总线
    }
}).$mount('#app')
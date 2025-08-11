import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.use(Antd)

// main.js에서 전역 에러 핸들러 설정
app.config.errorHandler = (err, instance, info) => {
  console.error('Global error:', err)

  // 라우터를 통해 에러 페이지로 이동
  router.push({
    name: 'Error',
    params: { type: '500' }
  })
}

app.mount('#app')

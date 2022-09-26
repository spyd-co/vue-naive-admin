/** 重置样式 */
import '@/styles/reset.css'
import 'uno.css'
import '@/styles/global.scss'
import 'virtual:svg-icons-register'

import { createApp } from 'vue'
import { setupRouter } from '@/router'
import { setupStore } from '@/store'
import { rey } from './api/spyd/rey'

import App from './App.vue'

async function setupApp() {
  const app = createApp(App)

  setupStore(app)

  await setupRouter(app)

  app.mount('#app')

  rey.address('http://localhost:16666/rey')
  // rey.logIn(
  //   'admin',
  //   'badrobodo',
  //   async (data) => {
  //     console.info('login successed!')
  //     console.table(data)
  //     let roleList = await rey.getRoleListOfUser(data.AccountId)
  //     console.table(roleList)
  //   },
  //   (err) => {
  //     alert(err)
  //   }
  // )
}

setupApp()

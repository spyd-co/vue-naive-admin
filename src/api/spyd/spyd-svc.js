export const spydSvc = getSvc()

import { spydTool } from './spyd-tool'
import { spydLocalData } from './spyd-localdata'

async function isUsingAppKey() {
  let userData = await spydLocalData.get('spyd.svc.user')
  return appKeyExists(userData)
}

function appKeyExists(userData) {
  return userData.user && userData.appkey && userData.appsecret
}

function getSvc() {
  async function signRequest(req) {
    let userData = await spydLocalData.get('spyd.svc.user')
    try {
      if (appKeyExists(userData)) {
        var req_ = { action: req.action }
        if (!spydTool.isEmpty(req.context)) {
          req_['context'] = req.context
        } else {
          req_['context'] = ''
        }

        req['username'] = userData.user
        req['appkey'] = userData.appkey
        req['timestamp'] = (+new Date()).toString()

        req['signature'] = spydTool.createSignatureSHA1(
          userData.appkey + userData.appsecret + req['timestamp'] + JSON.stringify(req_)
        )
      } else if (userData.user && userData.token) {
        req['username'] = userData.user
        req['token'] = userData.token
      }
    } catch (e) {
      console.log(e)
    }
  }

  async function postAsForm_(target, o) {
    let r = await fetch(target, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: spydTool.objToFormBody(o),
    })
    //console.log(r.status + ":" + target);
    return r
  }

  async function postAsForm(target, action, context, signReq) {
    if (spydTool.isEmpty(target)) throw new Error('parameter missing: target')
    if (spydTool.isEmpty(action)) throw new Error('parameter missing: action')

    let requestBody = { action: action }

    if (context) {
      requestBody.context = JSON.stringify(context)
    }

    if (signReq) {
      await signRequest(requestBody)
    }

    let url = 'https://hezup.com' + `/${target}/api?action=${target}/${action}`

    let r = await (await postAsForm_(url, requestBody)).json()

    return r.data
  }

  return {
    auth: async function (uid, pass, success, fail) {
      let r = await postAsForm('user', 'log_in', {
        username: uid,
        password: pass,
      })
      if (r.ok && r.token) {
        await spydLocalData.set('spyd.svc.user', {
          user: uid,
          token: r.token,
        })

        if (success) success(r.token)
      } else {
        if (fail) fail({ message: '登录失败', error: r.error })
        console.error('登录失败: ' + r.error)
      }
    },
    req: async function (target, action, context, config) {
      let signReq = true

      if (config && config.signRequest === false) {
        signReq = false
      }

      let r = await postAsForm(target, action, context, signReq)
      if (r.success) {
        return r.data
      } else if (r.errorcode === '5') {
        if (config.logout) {
          config.logout()
          return
        }
        console.error('token expired')
      } else if (config && config.errorHandler) {
        if (config.errorHandler) {
          config.errorHandler(r.message, r.error)
        } else {
          console.error(`${r.message} (${r.error})`)
        }
        if (r.data) {
          return r.data
        }
      } else {
        throw new Error(r.message)
      }
    },
    getUserAppList: async function () {
      return await postAsForm('user', 'get_app_list', undefined, true)
    },
    isUsingAppKey: async function () {
      return isUsingAppKey()
    },
  }
}

export const spydSvc = getSvc()

import { spydTool } from './spyd-tool'
import { spydLocalData } from './spyd-localdata'

function getSvc() {
  const _cfg = {
    server: '',
    logOut: undefined,
    tokenLocation: 'spyd.svc.user',
  }

  const _logOut = async () => {
    await spydLocalData.remove(_cfg.tokenLocation)
    if (_cfg.logOut) _cfg.logOut()
  }

  async function isUsingAppKey() {
    let userData = await spydLocalData.get(_cfg.tokenLocation)
    return appKeyExists(userData)
  }

  function appKeyExists(userData) {
    return userData.user && userData.appkey && userData.appsecret
  }

  async function signRequest(req) {
    let userData = await spydLocalData.get(_cfg.tokenLocation)
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

  async function postAsForm(target, o) {
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

  async function postReq(target, action, context, signReq) {
    if (spydTool.isEmpty(target)) throw new Error('parameter missing: target')
    if (spydTool.isEmpty(action)) throw new Error('parameter missing: action')

    let requestBody = { action: action }

    if (context) {
      requestBody.context = JSON.stringify(context)
    }

    if (signReq) {
      await signRequest(requestBody)
    }

    let url = _cfg.server
    if (!url.endsWith('/')) url += '/'
    url += `${target}/api?action=${target}/${action}`

    let resp = await postAsForm(url, requestBody)
    console.log(resp)

    if (resp.status !== 200) {
      //throw new Error(resp.status + ' - ' + resp.statusText)
      return {
        success: 0,
        error: resp.status,
        message: '请求失败',
      }
    }

    let r = await resp.json()

    return r
  }

  return {
    config: function (cfg) {
      if (cfg) {
        if (cfg.server) _cfg.server = cfg.server
        if (cfg.logOut) _cfg.logOut = cfg.logOut
        if (cfg.tokenLocation) _cfg.tokenLocation = cfg.tokenLocation
      } else {
        return {
          server: _cfg.server,
          tokenLocation: _cfg.tokenLocation,
        }
      }
    },
    auth: async function (uid, pass, success, fail) {
      let r = await this.req(
        'user',
        'log_in',
        {
          username: uid,
          password: pass,
        },
        {
          signRequest: false,
          errorHandler: (msg, err) => {
            console.log('error:' + msg + ' ( ' + err + ' )')
          },
        }
      )
      if (r.ok && r.token) {
        await spydLocalData.set(_cfg.tokenLocation, {
          user: uid,
          token: r.token,
        })

        if (success) success(r.token)
        return true
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

      const r = await postReq(target, action, context, signReq)

      if (r.success) {
        return r.data
      } else if (r.errorcode === '5') {
        console.error('unauthorized')
        await _logOut()
        //return
        throw {
          error: 'unauthorized',
          message: r.message,
        }
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
        throw {
          error: r.error,
          message: r.message,
        }
      }

      return r.data
    },
    getUserAppList: async function () {
      return await postReq('user', 'get_app_list', undefined, true)
    },
    isUsingAppKey: async function () {
      return isUsingAppKey()
    },
  }
}

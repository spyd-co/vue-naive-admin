export const spydApi = getSpydApi()

import { spydTool } from './spyd-tool'
import { spydIframe } from './spyd-iframe'
import { spydAlert } from './spyd-alert'

function getSpydApi() {
  let _token = ''
  let _address = ''
  let _loginUrl = ''

  function createRequest(api, action, params) {
    const appId = ''
    const tokenFull = _token
    let tokenPart = ''
    const reqId = 'reqid'

    if (tokenFull.length > 6) {
      tokenPart = tokenFull.substring(0, tokenFull.length - 6)
    }

    if (spydTool.isEmpty(appId)) {
      tokenPart = tokenFull
    }

    const req = {
      reqid: reqId,
      appid: appId,
      token: tokenPart,
      timestamp: (+new Date()).toString(),
      api: api,
      action: action,
      p: JSON.stringify(params),
    }

    const appKey = ''

    const str =
      req['reqid'] + req['appid'] + appKey + tokenFull + req['timestamp'] + req['api'] + req['action'] + req['p']

    //console.log(str);
    req['signature'] = spydTool.createSignatureSHA1(str)
    //console.log(req["signature"]);

    return req
  }

  function detectError(resp, errHandler) {
    const ts = new Date(resp.timestamp)
    const t = `${ts.getHours()}:${ts.getMinutes()}:${ts.getSeconds()}`

    //console.log(`${t} OK [${resp.api}]`);

    if (resp.error) {
      console.log(`${t} ERROR(${resp.error}) [${resp.api}] ${resp.message}`)

      if (resp.error === 5 || resp.error === 5001) {
        spydAlert.showAlert('身份凭证已过期，请重新登录')

        if (spydTool.inIframe()) {
          if (parent) {
            //parent.postMessage({ eventName: "token_expired", eventData: resp });
            if (spydIframe) {
              spydIframe.postEvent('token_expired', resp, { postToTop: true })
            }
          }
        } else {
          location.href = _loginUrl
        }
      } else if (resp.error === 6) {
        spydAlert.showAlert('无权限')
      } else if (resp.error === 6001) {
        spydAlert.showAlert('操作失败，需要管理员权限')
      } else if (resp.error === 6002) {
        spydAlert.showAlert('操作失败，需要所有者权限')
      } else if (resp.error === 6003) {
        spydAlert.showAlert('操作失败，需要成员权限')
      } else if (resp.error === 7) {
        spydAlert.showAlert('请求未通过校验')
      } else if (errHandler) {
        try {
          const errMsg = JSON.parse(resp.message)
          if (errMsg['ERROR']) {
            errHandler(errMsg['ERROR'], resp.error)
          } else {
            errHandler(resp.message, resp.error)
          }
        } catch (e) {
          spydAlert.showAlert(resp.message)
        }
      } else if (resp.message) {
        try {
          const errMsg = JSON.parse(resp.message)
          if (errMsg['ERROR']) {
            spydAlert.showAlert(errMsg['ERROR'])
          }
        } catch (e) {
          spydAlert.showAlert(resp.message)
        }
      }

      return true
    }

    return false
  }

  async function tryGetAddress() {
    // if (spydTool.isEmpty(_address)) {
    // }

    return !spydTool.isEmpty(_address)
  }

  return {
    token: function (tokenStr) {
      _token = tokenStr
    },
    address: function (v) {
      if (v) {
        _address = v
      } else {
        return _address
      }
    },
    loginUrl: function (v) {
      if (v) {
        _loginUrl = v
      } else {
        return _loginUrl
      }
    },
    register: async function (id, pass, code, dataHandler, errorHandler) {
      const errorHandlerWrap = (err) => {
        console.error(err)
        if (errorHandler) {
          errorHandler(err)
        }
      }

      const resp = await this.fetch(
        'v1/user/register/code',
        'post',
        {
          login_id: id,
          pass: pass,
          code: code,
        },
        errorHandlerWrap
      )

      if (resp) {
        if (dataHandler) {
          dataHandler(resp.data)
        }
      }
    },
    auth: async function (id, pass, dataHandler, errorHandler) {
      _token = ''

      const errorHandlerWrap = (err) => {
        console.error(err)
        if (errorHandler) {
          errorHandler(err)
        }
      }

      const resp = await this.fetch(
        'v1/user/login',
        'post',
        {
          id: id,
          pass: pass,
          device: '',
        },
        errorHandlerWrap
      )

      if (resp) {
        const data = resp.data
        if (data.Token) {
          _token = data.Token
        }
        if (dataHandler) {
          dataHandler(data)
        }
      }
    },
    fetch: async function (api, action, params, errorHandler) {
      if (!(await tryGetAddress())) {
        spydAlert.showAlert('rey api address not set: _address')
        return
      }

      if (params === undefined) {
        params = {}
      }

      const req = createRequest(api, action, params)

      const rawResp = await fetch(`${_address}?api=${req['api']}&act=${req['action']}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req),
      })

      const resp = await rawResp.json()

      resp.api = `${api},${action}`

      if (!detectError(resp, errorHandler)) {
        return {
          time: new Date(resp.timestamp),
          data: resp.data,
          message: resp.message,
        }
      } else {
        console.log('[ERROR] ' + `${api},${action}`)
      }
    },
  }
}

// test code

// spydApi.address("http://localhost:16666/rey")
// spydApi.auth(
//     "admin",
//     "badrobodo",
//     async data=>{
//         console.table(data)
//     },
//     err=> {
//         alert(err)
//     });

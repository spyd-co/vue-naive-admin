export const rey = getApi()

import { spydTool } from './spyd-tool'
import { spydApi } from './spyd-api'
import { spydLocalData } from './spyd-localdata'

let _localDataEntry = 'rey.userdata'
let _address = ''
let _logOutFunc = undefined

function ensureAddress() {
  if (spydTool.isEmpty(_address)) {
    throw new Error('address not set')
  }
}

async function isUsingAppKey() {
  let userData = await spydLocalData.getObj(_localDataEntry)
  return userData.user && userData.appkey && userData.appsecret
}

//检查凭据是否过期，注意：没有凭据或者凭据不完整都视为凭据过期
function isTokenExpired(userData) {
  if (userData) {
    if (userData.user && userData.token && userData.expire) {
      let ts = +new Date()
      return ts > userData.expire
    }
  }
  return true
}

async function isLoggedIn() {
  if (await isUsingAppKey()) return true

  //如果有登录凭据，则检查凭据是否失效
  let userData = await spydLocalData.getObj(_localDataEntry)
  if (!isTokenExpired(userData)) return true

  return false
}

async function getToken() {
  let userData = await spydLocalData.getObj(_localDataEntry)
  if (userData.token) {
    return userData.token
  }
  return ''
}

async function tryRefreshToken() {
  ensureAddress()
  if (await isLoggedIn()) {
    let t = await getToken()
    if (t) {
      spydApi.post('v1/user/refresh', 'post', {}, async (data) => {
        await spydLocalData.set(_localDataEntry, {
          user: data.UserName,
          token: data.Token,
        })

        console.log('refresh token: ok')
        return
      })
    }
  }
}

async function callApi(api, action, params, errorHandler) {
  ensureAddress()
  let t = await getToken()
  if (t) {
    spydApi.token(t)
  }
  return await spydApi.fetch(api, action, params, errorHandler)
}

function setLogOutFunc(f) {
  _logOutFunc = f
}

function getApi() {
  async function logOut_() {
    ensureAddress()
    if (await isLoggedIn()) {
      let t = await getToken()
      if (t) {
        spydApi.post('v1/user/logout', 'post', {}, (data) => {
          spydLocalData.remove(_localDataEntry)
          console.log('logged out')
          return
        })
      }
    }

    await spydLocalData.remove(_localDataEntry)
    console.log('logged out')

    if (_logOutFunc) _logOutFunc()
  }

  return {
    address: function (v) {
      spydApi.address(v)
      if (v) {
        _address = v
      } else {
        return _address
      }
    },
    logIn: function (uid, pass, dataHandler, errorHandler) {
      ensureAddress()
      spydApi.auth(
        uid,
        pass,
        async (data) => {
          await spydLocalData.set(_localDataEntry, {
            user: data.UserName,
            token: data.Token,
          })

          if (dataHandler) {
            dataHandler(data)
          }
        },
        (err) => {
          console.error('login failed: ' + err)
          if (errorHandler) {
            errorHandler(err)
          }
        }
      )
    },
    register: function (uid, pass, dataHandler, errorHandler) {
      ensureAddress()
      spydApi.register(uid, pass, '', dataHandler, errorHandler)
    },
    addOrg: async function (name, errorHandler) {
      let orgId = await callApi(
        'v1/org/organization/new',
        'post',
        {
          name: name,
          org_code: '',
          code: '',
        },
        errorHandler
      )
      return orgId
    },
    logOut: async function () {
      spydLocalData.remove(_localDataEntry)
      console.log('logged out')
      await logOut_()
    },
    setLogOut: function (f) {
      setLogOutFunc(f)
    },
    isUsingAppKey: function () {
      return isUsingAppKey()
    },
    isLoggedIn: function () {
      return isLoggedIn()
    },
    getUserName: async function () {
      let userData = spydLocalData.getObj(_localDataEntry)
      if (userData.user) {
        return userData.user
      } else {
        return ''
      }
    },
    getCurrOrg: async function (errorHandler) {
      try {
        let r = await callApi('v1/org/organization', 'get', { id: '' }, errorHandler)
        return r.data
      } catch (e) {
        console.error(JSON.stringify(e))
        return ''
      }
    },
    setCurrOrg: async function (id, errorHandler) {
      try {
        let r = await callApi('v1/user/organization/id', 'post', { org_id: id }, errorHandler)
        return true
      } catch (e) {
        console.error(JSON.stringify(e))
        errorHandler(e)
        return false
      }
    },
    getDefaultOrgId: async function (errorHandler) {
      try {
        let r = await callApi('v1/user/organization/default/id', 'get', {}, errorHandler)
        return r.data
      } catch (e) {
        console.error(JSON.stringify(e))
        return ''
      }
    },
    setDefaultOrgId: async function (id, errorHandler) {
      try {
        let r = await callApi('v1/user/organization/default/id', 'post', { org_id: id }, errorHandler)
        return r.data
      } catch (e) {
        console.error(JSON.stringify(e))
        return ''
      }
    },
    getRoleListOfUser: async function (id, errorHandler) {
      try {
        let id_ = ''
        if (!spydTool.isEmpty(id)) id_ = id
        let r = await callApi(
          'v1/org/role/list',
          'get',
          {
            q: 'account',
            id: id_,
          },
          errorHandler
        )
        return r.data
      } catch (e) {
        console.error(JSON.stringify(e))
        return ''
      }
    },
    api: async function (api, action, params, errorHandler) {
      return await callApi(api, action, params, errorHandler)
    },
  }
}

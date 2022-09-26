export const spydFile = getSpydFile()

import { spydTool } from './spyd-tool'

function getSpydFile() {
  let selector = (function () {
    let selectorId_ = ''
    let config_ = undefined
    let $selector_ = undefined

    let filesHandler_ = function (files) {
      console.log(files)
    }

    let handleFiles = function () {
      if ($selector_[0].files.length === 0) {
        throw new Error('no file selected')
      }

      filesHandler_($selector_[0].files)
    }
    let init = () => {
      if (selectorId_) {
        return
      }
      selectorId_ = spydTool.createUUID()
      let input = `<input name="files" id="spyd-file-${selectorId_}" type="file">`
      if (config_ && config_.multiple) {
        input = `<input name="files" id="spyd-file-${selectorId_}" type="file" multiple>`
      }
      let $form = $(`<form id="spyd-form-${selectorId_}"></form>`)
      $form.append(input)
      let box = $('<div hidden></div>')
      box.append($form)
      $('body').append(box)

      $selector_ = $(`#spyd-file-${selectorId_}`)
      $(document).on('change', `#spyd-file-${selectorId_}`, () => {
        handleFiles()
        $selector_.val('')
      })
    }
    return {
      config: (o) => {
        config_ = o
      },
      select: (filesHandler) => {
        init()
        filesHandler_ = filesHandler
        //$selector_.click();
        $(`#spyd-form-${selectorId_}`).find('input[type=file]').click()
      },
    }
  })()
  let uploader = (function () {
    let uploaderId_ = ''
    let uploadUrl_ = ''
    let postAfterSelect = true
    let config_ = undefined

    let dataHandler_ = function (data) {
      console.log(data)
    }

    let errorHandler_ = function (err) {
      alert(err)
    }

    let filesHandler_ = function (files) {
      console.log(files)
    }

    let uploadForm = function (formData) {
      $.ajax({
        type: 'POST',
        enctype: 'multipart/form-data',
        url: uploadUrl_,
        data: formData,
        processData: false,
        contentType: false,
        cache: false,
        timeout: 600000,
        success: function (resp) {
          //console.log("[DONE]" + uploadUrl_);
          console.log(resp)
          if (resp.success) {
            if (resp.data) {
              if (dataHandler_) {
                dataHandler_(resp.data)
              }
            }
          } else {
            if (resp.message) {
              console.log('[ERROR]' + resp.message)
              if (errorHandler_) {
                errorHandler_(resp.message)
              } else {
                alert(resp.message)
              }
            } else {
              alert('ERROR')
            }
          }
        },
        error: function (e) {
          //console.log("[ERROR]" + urlUpload);
          console.log(e)
        },
      })
    }

    let handleFiles = function () {
      if ($(`#spyd-file-${uploaderId_}`)[0].files.length === 0) {
        throw new Error('no file selected')
      }

      if (!postAfterSelect) {
        filesHandler_($(`#spyd-file-${uploaderId_}`)[0].files)
        return
      }

      var form = $(`#spyd-form-${uploaderId_}`)[0]
      uploadForm(new FormData(form))
    }
    let init = () => {
      if (!spydTool.isEmpty(uploaderId_)) {
        return
      }
      uploaderId_ = spydTool.createUUID()
      let input = `<input name="files" id="spyd-file-${uploaderId_}" type="file">`

      if (config_ && config_.multiple) {
        input = `<input name="files" id="spyd-file-${uploaderId_}" type="file" multiple>`
      }

      let dataItemContainer = $('<div class="container-items"></div>')

      let $form = $(`<form id="spyd-form-${uploaderId_}"></form>`)
      $form.append(input)
      $form.append(dataItemContainer)

      let uploadBox = $('<div hidden></div>')
      uploadBox.append($form)
      $('body').append(uploadBox)

      $(document).on('change', `#spyd-file-${uploaderId_}`, handleFiles)
    }
    return {
      config: (o) => {
        config_ = o
      },
      upload: (url, formData, showSelect, dataHandler, errorHandler) => {
        init()
        postAfterSelect = true
        uploadUrl_ = url
        dataHandler_ = dataHandler
        errorHandler_ = errorHandler

        let $ctnr = $(`#spyd-form-${uploaderId_}`)
        $ctnr.find('.container-items').empty()

        Object.keys(formData).forEach((k) => {
          let $input = $(`<input type="text" name="${k}">`)
          let v = formData[k]
          let vStr = typeof v === 'string' || v instanceof String ? v : JSON.stringify(v)
          $input.val(vStr)
          $ctnr.find('.container-items').append($input)
        })

        if (showSelect) {
          $(`#spyd-form-${uploaderId_}`).find('input[type=file]').click()
        } else {
          handleFiles()
        }
      },
      select: (filesHandler) => {
        init()
        postAfterSelect = false
        filesHandler_ = filesHandler
        $(`#spyd-form-${uploaderId_}`).find('input[type=file]').click()
      },
      uploadFile(url, file, formData, dataHandler, errorHandler) {
        uploadUrl_ = url
        dataHandler_ = dataHandler
        errorHandler_ = errorHandler

        var fd = new FormData()
        Object.keys(formData).forEach((k) => {
          fd.append(k, spydTool.isObject(formData[k]) ? JSON.stringify(formData[k]) : formData[k])
        })
        fd.append('files', file)
        uploadForm(fd)
      },
    }
  })()
  return {
    uploader: uploader,
    selector: selector,
  }
}

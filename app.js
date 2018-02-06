import http from './public/js/http.js';
import api from './public/js/api.js';

App({
  globalData: {
    userInfo: null,
    // 全局的sessionId
    sessionId: wx.getStorageSync('sessionId') || null,
  },
  formIdSubmit: function (e) {
    let fid = e.detail.formId;
    let fids = this.globalData.globalFormIds
    if(!fids)fids = []
    let data = fid+ '@@' + (new Date().getTime()+ 604800000) // ms
    fids.push(data)
    this.globalData.globalFormIds = fids
  },
  formIdsSave: function() {
    let fids = this.globalData.globalFormIds
    if (!fids || fids.length<=0)
      return

    http.request({
      url: api.formIdsSave,
      method: 'POST',
      data: {
        ids: fids
      }
    }).then((res) => {
      if (res.errorCode == 200 && res.data) {
        this.globalData.globalFormIds = ''
      }
    });
  }
})

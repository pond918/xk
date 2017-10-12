import http from '../../public/js/http.js';
import api from '../../public/js/api.js';

Page({
  data: {
    info: {},
    // 传入的邀请码
    code: '',
    // 是否显示弹窗
    isShowPopup: true,
    // 数据是否加载完毕
    isLoaded: false
  },
  // 获取二维码
  getData () {
    let { code } = this.data;

    wx.showLoading();
    http.request({
      url: api.shareClass,
      data: {
        code
      }
    }).then((res) => {
      wx.hideLoading();
      console.log(res);
      this.setData({
        isLoaded: true,
        info: res.data
      });
    });
  },
  // 开关弹窗
  togglePopup () {
    let { isShowPopup } = this.data;

    this.setData({
      isShowPopup: !isShowPopup
    });
  },
  // 复制邀请码
  copy (e) {
    wx.setClipboardData({
      data: e.currentTarget.dataset.code,
      success () {
        wx.showToast({
          title: '邀请码复制成功'
        })
      }
    })
  },
  // 右上角分享
  onShareAppMessage () {
    let { code, info } = this.data;

    return {
      title: `${info.teacher}老师邀你进习课`,
      path: `/pages/registry/registry?role=2&code=${code}`,
      success () {
        wx.showToast({
          title: '分享成功'
        })
      }
    }
  },
  onLoad (params) {
    this.setData({
      code: params.code
    });

    this.getData();
  }
})

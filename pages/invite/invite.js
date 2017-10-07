import http from '../../public/js/http.js';
import api from '../../public/js/api.js';

Page({
  data: {
    info: {},
    avatar: '',
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

      this.setData({
        isLoaded: true,
        info: res.data
      });
    });
  },
  // 获取用户信息，主要是获取头像
  getUserInfo () {
    wx.getUserInfo({
      success: (res) => {
        let userInfo = res.userInfo;
        let avatar = userInfo.avatarUrl;

        this.setData({
          avatar
        });
      }
    })
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
    return {
      title: '邀请码',
      success () {
        wx.showToast({
          title: '分享成功'
        })
      },
      fail () {
        wx.showToast({
          title: '分享失败',
          image: '../../icons/close-circled.png'
        })
      }
    }
  },
  onLoad (params) {
    this.setData({
      code: params.code
    });

    this.getUserInfo();
    this.getData();
  }
})

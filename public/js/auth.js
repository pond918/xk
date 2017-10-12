import api from './api.js';

// 权限类
class Auth {
  // 登录接口
  login () {
    let p = new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          if (res.code) {
            wx.request({
              url: api.login,
              data: {
                code: res.code
              },
              success: (res) => {
                // 登录成功，则设置sessionId
                if (res.data.errorCode === 200) {
                  let data = res.data.data;
                  wx.setStorageSync('sessionId', data.sessionKey);

                  // 如果已经注册，则角色信息以服务器为准，将本地角色设置为服务器返回的角色
                  if (data.role) {
                    wx.setStorageSync('role', data.role);

                    // 登录成功，设置当前页面data中的role为相对应的角色
                    let pages = getCurrentPages();
                    let currentPage = pages[pages.length - 1];

                    currentPage.setData({
                      role: data.role
                    });
                  } else {
                    reject({
                      errorCode: 403,
                      moreInfo: '对不起，您还未注册，请先注册'
                    });
                  }
                }

                resolve();
              }
            });
          } else {
            // 登录出错
            wx.showToast({
              title: '自动登录出错',
              image: '../../icons/close-circled.png'
            })

            reject(res);
          }
        }
      });
    })

    return p;
  }
}

export default Auth;
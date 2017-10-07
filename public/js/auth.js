import api from './api.js';

// 权限类，
class Auth {
  // 登录接口
  login () {
    let p = new Promise((resolve, rejcet)=>{
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
                  wx.setStorageSync('role', data.role);

                  // 登录成功，设置当前页面data中的role为相对应的角色
                  let pages = getCurrentPages();
                  let currentPage = pages[pages.length-1];
                  currentPage.setData({
                    role: data.role
                  });
                  currentPage.onLoad();
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
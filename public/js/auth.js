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
                }

                // 无论登录是否成功，都再次发起请求
                resolve();
              }
            });
          } else {
            // 登录出错
            reject(res);
          }
        }
      });
    })

    return p;
  }
}

export default Auth;
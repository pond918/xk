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
                  let pages = getCurrentPages();
                  let currentPage = pages[pages.length - 1];

                  wx.setStorageSync('sessionId', data.sessionKey);

                  // 如果已经注册，则角色信息以服务器为准，将本地角色设置为服务器返回的角色
                  if (data.role) {
                    wx.setStorageSync('role', data.role);

                    // 登录成功，设置当前页面data中的role为相对应的角色
                    currentPage.setData({
                      role: data.role
                    });
                  } else {
                    // 当本地role为-1时，表示是未登陆未注册的老师通过二维码扫描进来注册页
                    // 这时，系统自动login返回role=null，就不需要提示用户去注册，因为已经是在注册页了

                    // 默认角色以页面当前的角色为主。如果当前页的role不存在，则默认为是老师扫码进来的
                    let role = currentPage.role || -1;

                    // role > 0表示是未注册用户进入其他页面，而不是进入注册页，要提示跳转注册，走reject流程
                    if(role > 0){
                      return reject({
                        errorCode: 403,
                        moreInfo: '对不起，您还未注册，请先注册'
                      });
                    } else {
                      // role < 0表示是未注册用户进入注册页，不用提示跳转注册，但是还要走reject流程
                      return reject();
                    }
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
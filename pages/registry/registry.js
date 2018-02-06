import http from '../../public/js/http.js';
import api from '../../public/js/api.js';
import Auth from '../../public/js/auth.js';
import utils from '../../public/js/utils.js';

let auth = new Auth();

Page({
  data: {
    // 角色，1为班主任，2为家长，默认为家长
    role: 2,
    absRole: 2,
    // 当扫码进来的角色为老师时，code表示学校的代码
    // 当扫码进来的角色为家长时，code表示邀请码
    code: '',

    // 用户信息
    userInfo: '',
    // 不包括敏感信息的原始数据字符串，用于计算签名
    rawData: '',
    // 使用 sha1( rawData + sessionkey ) 得到字符串，用于校验用户信息
    signature: '',
    // 包括敏感数据在内的完整用户信息的加密数据
    encryptedData: '',
    // 加密算法的初始向量
    iv: '',

    // 年级列表
    gradeList: [],
    // 班级列表
    classList: [],
    // 姓名
    name: '',
    // 手机号
    phone: '',
    // 学号
    studentNo: '',
    // 验证码
    verifyCode: '',
    // 选择的年级序号
    gradeIndex: '',
    // 选择的班级序号
    classIndex: '',

    // 扫码是否出错
    isError: false,
    // 数据是否加载完毕
    isLoaded: false,
    // 是否正在提交数据
    isSubmit: false,
    // 用户是否同意授权数据
    isPermission: true
  },
  // 获取年级信息
  getGradeList () {
    let { code } = this.data;

    wx.showLoading();
    http.request({
      url: api.gradeList,
      data: {
        school: code
      }
    }).then((res) => {
      wx.hideLoading();

      if (res.data.length == 0) {
        wx.showToast({
          title: '年级数据为空，请联系管理员',
          image: '../../icons/close-circled.png',
          duration: 5000
        })
      }

      this.setData({
        gradeList: res.data
      });
    });
  },
  // 获取班级信息
  getClassList () {
    let { gradeList, gradeIndex } = this.data;
    let gradeId = gradeList[gradeIndex].id;

    wx.showLoading();
    http.request({
      url: api.classList,
      data: {
        gradeId
      }
    }).then((res) => {
      wx.hideLoading();
      let classList = [];

      res.data.forEach((item) => {
        if (!item.reged) {
          classList.push(item);
        }
      });

      // 无可注册班级
      if (classList.length === 0) {
        wx.showModal({
          title: '提示',
          content: '对不起，暂无可注册班级'
        })
      }

      this.setData({
        classList: classList
      });
    });
  },
  // 选择年级
  bindGradeChange (e) {
    let { gradeIndex } = this.data;

    // 年级改变，才需要请求数据
    if (gradeIndex != e.detail.value) {
      this.setData({
        gradeIndex: e.detail.value,
        classIndex: ''
      })

      this.getClassList();
    }
  },
  // 选择班级
  bindClassChange: function (e) {
    this.setData({
      classIndex: e.detail.value
    })
  },
  // 输入姓名
  inputName (e) {
    this.setData({
      name: e.detail.value
    })
  },
  // 输入学号
  inputStudentNo (e) {
    this.setData({
      studentNo: e.detail.value
    })
  },
  // 输入手机号
  inputPhone (e) {
    this.setData({
      phone: e.detail.value
    })
  },
  // 输入验证码
  inputVerifyCode (e) {
    this.setData({
      verifyCode: e.detail.value
    })
  },
  // 输入验证码
  inputInviteCode (e) {
    this.setData({
      code: e.detail.value
    })
  },
  // 发送验证码
  sendVerifyCode () {
    let { phone } = this.data;

    try {
      if (!phone) {
        throw new Error('请填写手机号');
      }

      if (phone.length !== 11) {
        throw new Error('手机号长度不足11位');
      }
    } catch (e) {
      return wx.showToast({
        title: e.message,
        image: '../../icons/close-circled.png'
      })
    }

    wx.showLoading();
    http.request({
      url: api.verifyCode,
      method: 'POST',
      data: {
        mobile: phone
      }
    }).then((res) => {
      wx.hideLoading();

      this.setData({});
    }).catch((res) => {
      wx.hideLoading();
    });
  },
  // 用户信息注册，注册成功了，在进行下一步老师／家长角色注册
  submitUserInfo () {
    let {
      rawData,
      signature,
      encryptedData,
      iv
    } = this.data;

    let q = new Promise((resolve, reject) => {
      try {
        if (!rawData) {
          throw new Error('rawData字段为空');
        }
        if (!signature) {
          throw new Error('signature字段为空');
        }
        if (!encryptedData) {
          throw new Error('encryptedData字段为空');
        }
        if (!iv) {
          throw new Error('iv字段为空');
        }
      } catch (e) {
        reject();
        return wx.showToast({
          title: e.message,
          image: '../../icons/close-circled.png'
        })
      }

      http.request({
        url: api.submitUserInfo,
        method: 'POST',
        data: {
          rawData,
          sign: signature,
          encryptedData,
          iv
        }
      }).then((res) => {
        if (res) {
          resolve();
        } else {
          wx.showToast({
            title: res.moreInfo || '微信用户信息注册失败',
            image: '../../icons/close-circled.png'
          })

          reject();
        }
      });
    });

    return q;
  },
  // 老师注册
  teacherRegistry () {
    let {
      name,
      phone,
      gradeIndex,
      classIndex,
      classList,
      isSubmit
    } = this.data;

    try {
      if (isSubmit) {
        throw new Error('正在提交中...');
      }
      if (!name) {
        throw new Error('请填写姓名');
      }
      if (!phone) {
        throw new Error('请填写手机号');
      }
      if (phone.length !== 11) {
        throw new Error('手机号长度不足11位');
      }
      if (!gradeIndex) {
        throw new Error('请选择年级');
      }
      if (!classIndex) {
        throw new Error('请选择班级');
      }
    } catch (e) {
      return wx.showToast({
        title: e.message,
        image: '../../icons/close-circled.png'
      })
    }

    this.setData({
      isSubmit: true
    })

    wx.showLoading();
    this.submitUserInfo()
      .then(() => {
        http.request({
          url: api.teacherRegistry,
          method: 'POST',
          data: {
            name,
            mobile: phone,
            classId: classList[classIndex].id
          }
        }).then((res) => {
          if (res.errorCode == 200) {
            wx.showToast({
              title: res.moreInfo || '注册成功'
            })
            wx.setStorageSync('role', 1);

            setTimeout(() => {
              wx.navigateTo({
                url: '/pages/habit_select/habit_select'
              });

              this.setData({
                isSubmit: false
              })
            }, 1500);
          } else {
            wx.showToast({
              title: res.moreInfo || '提交失败',
              image: '../../icons/close-circled.png'
            })

            // 如果用户已注册，则直接跳转到习惯页
            if (res.errorCode == 12001) {
              setTimeout(() => {
                wx.switchTab({
                  url: '/pages/habit/habit',
                  success () {
                    let pages = getCurrentPages();
                    let currentPage = pages[pages.length - 1];

                    // 如果当前页是已经访问过的状态，则刷新当前页数据
                    if (currentPage.isLoaded) {
                      currentPage.getData();
                    }
                  }
                });


                this.setData({
                  isSubmit: false
                })
              }, 1500)
            } else {
              this.setData({
                isSubmit: false
              })
            }
          }

          this.setData({
            isSubmit: false
          })
        });
      })
      .catch(() => {
      });
  },
  // 家长注册
  parentRegistry () {
    let { name, studentNo, code, isSubmit } = this.data;

    try {
      if (isSubmit) {
        throw new Error('正在提交中...');
      }
      if (!name) {
        throw new Error('请填写姓名');
      }
      if (!studentNo) {
        throw new Error('请填写学号');
      }
      if (!code) {
        throw new Error('请填写邀请码');
      }
    } catch (e) {
      return wx.showToast({
        title: e.message,
        image: '../../icons/close-circled.png'
      })
    }

    this.setData({
      isSubmit: true
    })

    wx.showLoading();
    this.submitUserInfo()
      .then(() => {
        http.request({
          url: api.parentRegistry,
          method: 'POST',
          data: {
            name,
            studentNo,
            classCode: code
          }
        }).then((res) => {
          if (res.errorCode == 200) {
            wx.showToast({
              title: res.moreInfo || '注册成功'
            })
            wx.setStorageSync('role', 2);

            setTimeout(() => {
              wx.navigateTo({
                url: `/pages/success/success?name=${res.data.name}&className=${res.data.className}`
              });

              this.setData({
                isSubmit: false
              })
            }, 1500);
          } else {
            wx.showToast({
              title: res.moreInfo || '注册失败',
              image: '../../icons/close-circled.png'
            })

            // 如果用户已注册，则直接跳转到习惯页
            if (res.errorCode == 12001) {
              setTimeout(() => {
                wx.switchTab({
                  url: '/pages/habit/habit',
                  success () {
                    // 登录成功，设置当前页面data中的role为相对应的角色
                    let pages = getCurrentPages();
                    let currentPage = pages[pages.length - 1];

                    // 如果当前页是已经访问过的状态，则刷新当前页数据
                    if (currentPage.isLoaded) {
                      currentPage.getData();
                    }
                  }
                });

                this.setData({
                  isSubmit: false
                })
              }, 1500)
            } else {
              this.setData({
                isSubmit: false
              })
            }
          }
        });
      })
      .catch(() => {
      })
  },
  // 获取角色的绝对值
  getAbsRole () {
    let { role } = this.data;

    return Math.abs(role);
  },
  // 获取用户信息，主要是获取头像
  getUserInfo () {
    let q = new Promise((resolve, reject) => {
      wx.getUserInfo({
        success: (res) => {
          let {
            userInfo,
            rawData,
            signature,
            encryptedData,
            iv
          } = res;

          this.setData({
            userInfo,
            rawData,
            signature,
            encryptedData,
            iv,
            isPermission: true
          });

          resolve();
        },
        fail: (res) => {
          this.setData({
            isPermission: false
          });

          reject();
        }
      })
    });

    return q;
  },
  onLoad (params) {
    // 预先获取角色，然后设置本地角色
    // 该login接口，如果用户已经注册了，则会自动设置本地缓存role为相应的角色，并且返回resolve
    // 如果用户未注册，则返回reject
    auth.login()
      .then(() => {
        // 如果用户已注册，则直接跳转到习惯页
        wx.showToast({
          title: '您已注册，自动跳转中...',
          image: '../../icons/close-circled.png'
        })

        setTimeout(() => {
          wx.switchTab({
            url: '/pages/habit/habit',
            success () {
              let pages = getCurrentPages();
              let currentPage = pages[pages.length - 1];

              // 如果当前页是已经访问过的状态，则刷新当前页数据
              if (currentPage.isLoaded) {
                currentPage.getData();
              }
            }
          });
        }, 1500)
      }, () => {
        // 默认角色为家长，即2
        let role = 2;
        let code = '';

        // 如果是通过扫码进来的
        if(params.scene){
          // 当扫码传入的查询字符串role为-1或者1时，表示老师
          // -1代表扫码进入本注册页的老师，无需对login返回的role=null做处理，代码在auth.js中体现；
          // 1表示其他页面的老师，如果login返回的role为null，则要提示用户去注册
          let scene = utils.parseQueryString(decodeURIComponent(params.scene));
          scene.role && (role = scene.role);
          scene.code && (code = scene.code);
        } else {
          params.role && (role = params.role);
          params.code && (code = params.code);
        }

        // 角色的绝对值
        let absRole = Math.abs(role);

        // 扫码出错
        try {
          if (absRole == 1 && !code) {
            throw new Error('老师注册时，必须传入学校code');
          }
        } catch (e) {
          this.setData({
            isError: true
          });

          return wx.showToast({
            title: e.message,
            image: '../../icons/close-circled.png'
          })
        }

        this.getUserInfo()
          .then(() => {
            let localRole = wx.getStorageSync('role');
            // 如果本地缓存中的用户role不存在，才将当前role写入本地缓存中
            if (!localRole) {
              wx.setStorageSync('role', absRole);
            }

            wx.setNavigationBarTitle({
              title: absRole == 1 ? '班主任完善个人信息' : '家长完善孩子信息'
            })

            this.setData({
              role,
              code,
              absRole,
              isLoaded: true
            });

            // 如果是班主任，则去请求年级列表数据
            if (Math.abs(role) == 1) {
              this.getGradeList();
            } else {
              wx.hideLoading();
            }
          })
          .catch(() => {
          });
      });

  }
})

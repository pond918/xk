import http from '../../public/js/http.js';
import api from '../../public/js/api.js';

Page({
  data: {
    // 角色，1为班主任，2为家长
    role: 1,
    // 当扫码进来的角色为老师时，code表示学校的代码
    // 当扫码进来的角色为家长时，code表示邀请码
    code: '',
    // 年级列表
    gradeList: [],
    // 班级列表
    classList: [],
    // 姓名
    name: '',
    // 手机号
    phone: '15960210046',
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
    isSubmit: false
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
  // 输入手机号
  inputPhone (e) {
    this.setData({
      phone: e.detail.value
    })
  },
  // 输入验证码
  inputCode (e) {
    this.setData({
      verifyCode: e.detail.value
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
  // 选择班级
  // 提交
  submit () {
    let {
      name,
      phone,
      gradeIndex,
      classIndex,
      gradeList,
      classList,
      isSubmit
    } = this.data;

    if (isSubmit) {
      return wx.showToast({
        title: '正在提交中...',
        image: '../../icons/close-circled.png'
      })
    }

    try {
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

    wx.showLoading();
    http.request({
      url: api.teacherRegistry,
      method: 'POST',
      data: {
        name,
        mobile: phone,
        classId: classList[classIndex].id
      }
    }).then((res) => {
      wx.hideLoading();

      if (res.errorCode == 200) {
        wx.showToast({
          title: res.moreInfo || '注册成功'
        })

        setTimeout(() => {
          wx.navigateTo({
            url: '/pages/habit_select/habit_select'
          });
        }, 1500);
      } else {
        wx.showToast({
          title: res.moreInfo || '提交失败',
          image: '../../icons/close-circled.png'
        })

        this.setData({
          isSubmit: false
        })
      }
    });
  },
  onLoad (params) {
    let { role, code } = params;

    // 扫码出错
    try {
      if (!role) {
        throw new Error('role字段缺失');
      }

      if (!code) {
        throw new Error('code字段缺失');
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

    wx.setNavigationBarTitle({
      title: role == 1 ? '班主任完善个人信息' : '家长完善孩子信息'
    })

    this.setData({
      role,
      code,
      isLoaded: true
    });

    // 如果是班主任，则去请求年级列表数据
    if (role == 1) {
      this.getGradeList();
    }
  }
})
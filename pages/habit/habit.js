import http from '../../public/js/http.js';
import api from '../../public/js/api.js';
import utils from '../../public/js/utils.js';

let role = wx.getStorageSync('role') || 1;

Page({
  data: {
    // 角色，1为老师，2为家长
    role: role,
    // 学生习惯列表
    habit: [],
    // 批注的是外层哪一个日期
    pIndex: '',
    // 批注的是某个日期下第几条数据
    cIndex: '',
    // 批注内容
    comment: '',
    // 弹窗开关
    popupToggle: false,
    // 数据是否加载完毕
    isLoaded: false,
    // 是否正在提交评论
    isSubmitComment: false,
    // 是否注册，默认用户已经注册
    isRegisted: true
  },
  // 根据当前角色，来请求不同的数据
  getData () {
    let { role } = this.data;
    if (role == 1) {
      this.getStudentHabit();
    } else {
      this.studentList();
    }
  },
  // 老师获取学生习惯列表
  getStudentHabit () {
    wx.showLoading();
    http.request({
      url: api.studentHabit
    }).then((res) => {
      wx.hideLoading();

      res.data.forEach((item) => {
        item.formatDate = utils.formatDate(new Date(item.date));
      });

      this.setData({
        isLoaded: true,
        habit: res.data
      });
    }).catch((res) => {
      wx.hideLoading();

      // 用户未注册，给出提示
      if (res.errorCode === 403) {
        this.setData({
          isLoaded: true,
          isRegisted: false
        });
      }
    });
  },
  // 显示、隐藏弹窗
  togglePopup (e) {
    let { popupToggle, habit } = this.data;

    // 如果是要打开弹窗，记录下这条数据的位置，提交评论时读取其id
    if (!popupToggle) {
      let { pIndex, cIndex } = e.currentTarget.dataset;
      let comments = habit[pIndex].students[cIndex].comments;

      if(comments.length > 0){
        return wx.showToast({
          title: '只能评论一条哦～',
          image: '../../icons/close-circled.png'
        })
      }

      this.setData({
        pIndex,
        cIndex,
        popupToggle: !popupToggle
      });
    } else {
      this.setData({
        popupToggle: !popupToggle
      });
    }
  },
  // 输入评论
  inputComment (e) {
    let comment = e.detail.value;

    this.setData({
      comment
    });
  },
  // 批注
  popupSubmit () {
    let { habit, comment, isSubmitComment, pIndex, cIndex } = this.data;

    try {
      // 正在提交评论
      if (isSubmitComment) {
        throw new Error('正在提交中...');
      }

      // 未填写评论
      if (comment.length === 0) {
        throw new Error('请输入评论');
      }
    } catch (e) {
      return wx.showToast({
        title: e.message,
        image: '../../icons/close-circled.png'
      })
    }

    this.setData({
      isSubmitComment: true
    });

    let id = habit[pIndex].students[cIndex].id;

    wx.showLoading();
    this.togglePopup();
    http.request({
      url: api.commentStudentHabit,
      method: 'POST',
      data: {
        id,
        comment
      }
    }).then((res) => {
      wx.hideLoading();

      if (res.errorCode == 200) {
        wx.showToast({
          title: res.moreInfo || '评论成功'
        })

        setTimeout(() => {
          this.getData();
        }, 1500);
      } else {
        wx.showToast({
          title: res.moreInfo || '提交失败',
          image: '../../icons/close-circled.png'
        })
      }

      this.setData({
        pIndex: '',
        cIndex: '',
        comment: '',
        isSubmitComment: false
      })
    });
  },
  onLoad () {
    let role = wx.getStorageSync('role') || 1;

    this.setData({
      role
    });

    this.getData();
  }
})

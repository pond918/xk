import timeTabs from '../../components/time-tabs/index.js';
import http from '../../public/js/http.js';
import api from '../../public/js/api.js';

const qiniuUploader = require("../../public/js/qiniuUploader");
let role = wx.getStorageSync('role') || null;

let app = getApp()
Page({
  formIdSubmit: app.formIdSubmit,
  data: {
    // 角色，1为老师，2为家长
    role: role,
    timeTabs: {
      // 左侧时间tab的选中序号
      timeTabsIndex: 0,
      // 右侧群组的选中序号，1表示群组，0表示学生排名，与下面的group字段值相反
      timeGroupIndex: 1,
      list: ['日', '周', '月', '学期'],
      group: ['群组>', '学生排名>'],
      tabsBb: true
    },
    dateArr: ['D', 'W', 'M', 'T'],
    // 学生排名列表
    sList: [],
    // 群组列表
    gList: [],
    // 是否注册，默认用户已经注册
    isRegisted: true
  },
  // 切换时间序号
  switchTapIndex (e) {
    timeTabs.switchTapIndex.call(this, e);

    this.getData();
  },
  // 切换群组/学生排名
  switchGroupIndex (e) {
    timeTabs.switchGroupIndex.call(this, e);

    this.getData();
  },
  // 根据当前选择的是群组、学生列表，来请求不同的数据
  getData () {
    let index = this.data.timeTabs.timeGroupIndex;
    if (index === 1) {
      this.groupScoreList();
    } else {
      this.studentList();
    }
  },
  // 学生排名
  studentList () {
    let { timeTabs, dateArr } = this.data;
    let range = dateArr[timeTabs.timeTabsIndex];

    wx.showLoading();
    http.request({
      url: api.studentList,
      data: {
        range
      }
    }).then((res) => {
      wx.hideLoading();

      this.setData({
        isLoaded: true,
        sList: res.data
      });

      // 停止下拉刷新
      setTimeout(()=>{
        wx.stopPullDownRefresh();
      }, 0)
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
  // 群组排名
  groupScoreList () {
    let { timeTabs, dateArr } = this.data;
    let range = dateArr[timeTabs.timeTabsIndex];

    wx.showLoading();
    http.request({
      url: api.groupScoreList,
      data: {
        range
      }
    }).then((res) => {
      wx.hideLoading();

      this.setData({
        isLoaded: true,
        gList: res.data
      });

      // 停止下拉刷新
      setTimeout(()=>{
        wx.stopPullDownRefresh();
      }, 0)
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
  // 新建分组
  createGroup () {
    wx.showModal({
      content: `您确实要新建分组吗？`,
      success: (res) => {
        if (res.confirm) {
          wx.showLoading();
          http.request({
            url: api.createGroup,
            method: 'POST'
          }).then((res) => {
            wx.hideLoading();

            if (res.data) {
              wx.showToast({
                title: '新建成功'
              })
              setTimeout(() => {
                this.getData();
              }, 1500)
            } else {
              wx.showToast({
                title: '新建失败',
                image: '../../icons/close-circled.png'
              })
            }
          });
        }
      }
    })
  },
  // 删除群组
  deleteGroup (e) {
    let { index } = e.currentTarget.dataset;
    let { gList } = this.data;
    let id = gList[index].id;

    wx.showModal({
      content: `确实要删除 "${gList[index].name}" 吗？`,
      success: (res) => {
        if (res.confirm) {
          let deleteGroup = gList.splice(index, 1);

          this.setData({
            gList
          })

          wx.showLoading();
          http.request({
            url: api.deleteGroup,
            method: 'POST',
            data: {
              id
            }
          }).then((res) => {
            wx.hideLoading();

            if (res.data) {
              wx.showToast({
                title: '删除成功'
              })
            } else {
              wx.showToast({
                title: '删除失败',
                image: '../../icons/close-circled.png'
              })

              gList.splice(index, 0, ...deleteGroup);
              this.setData({
                gList
              })
            }
          });
        }
      }
    })
  },
  // 下拉刷新
  onPullDownRefresh(){
    this.getData();
  },
  // 页面显示时，重新请求数据
  onShow () {
    let { isLoaded } = this.data;

    if (isLoaded) {
      this.onLoad();
    }
  },
  onLoad () {
    let role = wx.getStorageSync('role') || null;

    this.setData({
      isRegisted: true,
      role
    });

    this.getData();

    app.formIdsSave()
  }
})

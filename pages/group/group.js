import timeTabs from '../../components/time-tabs/index.js';
import http from '../../public/js/http.js';
import api from '../../public/js/api.js';

const qiniuUploader = require("../../public/js/qiniuUploader");
let role = wx.getStorageSync('role') || 1;

Page({
  data: {
    // 角色，1为老师，2为家长
    role: role,
    timeTabs: {
      // 左侧时间tab的选中序号
      timeTabsIndex: 0,
      // 右侧群组的选中序号
      timeGroupIndex: role === 1 ? 1 : 0,
      list: ['日', '周', '月', '学期'],
      group: ['群组>', '学生排名>'],
      tabsBb: true
    },
    dateArr: ['D', 'W', 'M', 'T'],
    // 学生排名列表数据
    sList: [],
    // 是否注册，默认用户已经注册
    isRegisted: true
  },
  // 切换时间序号
  switchTapIndex (e) {
    timeTabs.switchTapIndex.call(this, e);
    this.groupScoreList();
  },
  // 切换群组/学生排名
  switchGroupIndex (e) {
    timeTabs.switchGroupIndex.call(this, e);

    let index = e.currentTarget.dataset.index;
    if(index === 0){
      this.groupScoreList();
    }else{
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
  onLoad () {
    let role = wx.getStorageSync('role') || 1;
    let timeGroupIndex = (role === 1) ? 1 : 0;

    this.setData({
      role,
      'timeTabs.timeGroupIndex': timeGroupIndex
    });

    // 获取群组排名
    this.groupScoreList();
  },
  didPressChooseImage: function () {
    var that = this;
    wx.chooseImage({
      count: 1,
      success: function (res) {
        var filePath = res.tempFilePaths[0];
        qiniuUploader.upload(filePath, (res) => {
          that.setData({
            'imageURL': res.imageURL,
          });
        }, (error) => {
          console.log('error: ' + error);
        }, {
          uploadURL: 'https://up.qbox.me',
          domain: 'bzkdlkaf.bkt.clouddn.com',
          uptokenURL: 'UpTokenURL.com/uptoken',
        })
      }
    })
  }
})

import timeTabs from '../../components/time-tabs/index.js';
import http from '../../public/js/http.js';
import api from '../../public/js/api.js';

const qiniuUploader = require("../../public/js/qiniuUploader");

Page({
  data: {
    timeTabs: {
      ...timeTabs.data,
      list: ['日', '周', '月', '年'],
      group: ['群组>', '学生列表>'],
      tabsBb: true
    },
    // 列表数据
    list: [],
    // 是否注册，默认用户已经注册
    isRegisted: true
  },
  // 切换时间序号
  switchTapIndex (e) {
    timeTabs.switchTapIndex.call(this, e);
  },
  // 切换群组序号
  switchGroupIndex (e) {
    timeTabs.switchGroupIndex.call(this, e);
  },
  // 学生列表
  studentList () {
    wx.showLoading();
    http.request({
      url: api.habitList
    }).then((res) => {
      wx.hideLoading();

      this.setData({
        isLoaded: true,
        list: res.data
      });
    }).catch((res)=>{
      wx.hideLoading();

      // 用户未注册，给出提示
      if(res.errorCode === 403){
        this.setData({
          isLoaded: true,
          isRegisted: false
        });
      }
    });
  },
  onLoad () {
    this.studentList();
    // this.didPressChooseImage()
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

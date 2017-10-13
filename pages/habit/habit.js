import http from '../../public/js/http.js';
import api from '../../public/js/api.js';
import utils from '../../public/js/utils.js';

const qiniuUploader = require("../../public/js/qiniuUploader");
let role = wx.getStorageSync('role') || null;

// 总共可以上传几张图片
const UPLOAD_LENGTH = 1;

Page({
  data: {
    // 总共可以上传几张图片
    UPLOAD_LENGTH,
    // 星期
    day: ['日', '一', '二', '三', '四', '五', '六'],
    // 角色，1为老师，2为家长
    role: role,
    // 学生习惯列表
    habit: [],
    //所有的习惯详情是否开启的开关
    showInfoOn:[],

    // 当前选择的完成习惯的序号
    habitIndex: '',
    // 家长习惯 主动完成／监督完成
    own: true,
    // 待上传图片列表
    waitUploadImgs: [],
    // 已上传的图片列表
    uploadedImgs: [],
    // 上传图片弹窗开关
    uploadPopupToggle: false,
    // 剩余时间，百万毫秒
    remainMillion: 10,
    // 家长签到倒计时
    remainTime: '',
    // 倒计时Id
    countDownId: null,
    // 七牛云token
    uploadToken: '',

    // 批注的是外层哪一个日期
    pIndex: '',
    // 批注的是某个日期下第几条数据
    cIndex: '',
    // 批注内容
    comment: '',
    // 班主任批注弹窗开关
    commentPopupToggle: false,

    // 数据是否加载完毕
    isLoaded: false,
    // 是否注册，默认用户已经注册
    isRegisted: true,
    // 是否正在提交评论
    isSubmitComment: false,
    // 是否正在上传中
    isUpload: false
  },
  // 获取学生习惯列表
  getData () {
    var _this = this;
    // 还原页面状态
    this.setData({
      isSubmitComment: false,
      isUpload: false
    });

    wx.showLoading();
    http.request({
      url: api.habitList
    }).then((res) => {
      wx.hideLoading();

      let { role } = this.data;
      // 如果角色是老师
      if (role == 1) {
        res.data.forEach((item) => {
          item.formatDate = utils.formatDate(new Date(item.date));
        });

        this.setData({
          isLoaded: true,
          habit: res.data
        });
      } else {
        // 如果角色是家长
        res.data.formatDate = utils.formatDate(new Date(res.data.date), 'YYYY-MM-DD');
        res.data.formatDay = new Date(res.data.date).getDay();
        res.data.habits.forEach((item) => {
          item.formatStart = utils.formatDate(new Date(item.start));
        });

        this.setData({
          isRegisted: true,
          isLoaded: true,
          habit: res.data
        });

        //设置是否开启家长查看习惯详情的开关
        var arrr=[];
        for(var i in _this.data.habit){
          arrr.push({id:_this.data.habit[i].id,on:false})
        }
        this.setData({
          showInfoOn: arrr
        });

        this.countDown();
      }

      // 停止下拉刷新
      setTimeout(() => {
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
  // 查看习惯的详情
  showInfo:function(e){
    var _this = this,
        id = e.currentTarget.dataset.index,
        arr = _this.data.showInfoOn;
    for(var i in arr){
      if(i == id){  //当前点击项
        arr[i].on = !arr[i].on;
      }else{
        arr[i].on = false;
      }
    }
    _this.setData({
      showInfoOn:arr
    });
  },

  // 倒计时
  countDown () {
    let { habit, countDownId } = this.data;
    let deadline = habit.deadline;

    // 如果已经开启了倒计时，则先清除它
    if (countDownId) {
      clearInterval(countDownId);
    }

    if (deadline != 0) {
      this.calcRemainTime();

      let countDownId = setInterval(() => {
        this.calcRemainTime();
      }, 1000)

      this.setData({
        countDownId
      });
    }
  },
  // 计算剩余时间
  calcRemainTime () {
    let { habit } = this.data;
    let deadline = habit.deadline;

    if (deadline != 0) {
      let zeroDate = (utils.formatDate(new Date(), 'YYYY/MM/DD'));
      let zero = new Date(zeroDate + ' 00:00:00').getTime();
      let now = new Date().getTime();
      let remainMillion = zero + deadline - now;

      //计算剩余的小时
      let hours = parseInt(remainMillion / 1000 / 60 / 60 % 24, 10);
      //计算剩余的分钟
      let minutes = parseInt(remainMillion / 1000 / 60 % 60, 10);
      //计算剩余的秒数
      let seconds = parseInt(remainMillion / 1000 % 60, 10);

      hours = this.checkTime(hours);
      minutes = this.checkTime(minutes);
      seconds = this.checkTime(seconds);

      let remainTime = `${hours}时${minutes}分${seconds}秒`;

      this.setData({
        remainMillion,
        remainTime
      });
    }
  },
  // 将0-9的数字前面加上0，例1变为01
  checkTime (i) {
    if (i < 10) {
      i = "0" + i;
    }
    return i;
  },
  // 向服务器提交习惯
  submitHabit () {
    let { habitIndex, own, habit, uploadedImgs, uploadPopupToggle } = this.data;
    let item = habit.habits[habitIndex];

    if (item.photo) {
      if (uploadedImgs.length == 0) {
        return wx.showToast({
          title: '未上传任何图片',
          image: '../../icons/close-circled.png'
        });
      }
    }

    wx.showModal({
      content: `是否将习惯设为 "${own ? '主动完成' : '监督完成'}"？`,
      success: (res) => {
        if (res.confirm) {
          wx.showLoading();
          http.request({
            url: api.parentCompleteHabit,
            method: 'POST',
            data: {
              id: item.id,
              own,
              imgs: uploadedImgs
            }
          }).then((res) => {
            if (res.data) {
              // 如果上传弹窗打开，则关闭它
              if (uploadPopupToggle) {
                this.toggleUploadPopup();
              }

              // 重置上传相关的data字段
              this.resetUpload();
              wx.showToast({
                title: '设置成功'
              })

              setTimeout(() => {
                this.getData();
              }, 1500)
            } else {
              wx.showToast({
                title: '设置失败，请重试',
                image: '../../icons/close-circled.png'
              })
            }
          });
        }
      }
    })
  },
  // 主动／被动/未能完成习惯
  completeHabit (e) {
    let { index, own, fail } = e.currentTarget.dataset;
    let { habit } = this.data;
    let item = habit.habits[index];

    this.setData({
      habitIndex: index,
      own
    });

    //如果点击的是”未完成“按钮，则直接提交不用上传图片
    if(fail === true){
      this.submitFailHabit();
      return false;
    }

    // 如果需要上传图片，则打开上传弹窗
    if (item.photo) {
      this.toggleUploadPopup();
    } else {
      // 否则，直接显示完成习惯
      this.submitHabit();
    }
  },
  submitFailHabit () {
    let { habitIndex, own, habit, uploadedImgs, uploadPopupToggle } = this.data;
    let item = habit.habits[habitIndex];

    wx.showModal({
      content: `是否将习惯设为 "未完成"？`,
      success: (res) => {
        if (res.confirm) {
          wx.showLoading();
          http.request({
            url: api.parentFailHabit,
            method: 'POST',
            data: {
              id: item.id,
              own,
              imgs: uploadedImgs
            }
          }).then((res) => {
            if (res.data) {
              // 如果上传弹窗打开，则关闭它
              if (uploadPopupToggle) {
                this.toggleUploadPopup();
              }

              // 重置上传相关的data字段
              this.resetUpload();
              wx.showToast({
                title: '设置成功'
              })

              setTimeout(() => {
                this.getData();
              }, 1500)
            } else {
              wx.showToast({
                title: '设置失败，请重试',
                image: '../../icons/close-circled.png'
              })
            }
          });
        }
      }
    })
  },
  // 显示、隐藏上传图片弹窗
  toggleUploadPopup () {
    let { uploadPopupToggle } = this.data;

    this.setData({
      uploadPopupToggle: !uploadPopupToggle
    });
  },
  // 选择需要上传的图片
  chooseImgs () {
    wx.chooseImage({
      count: UPLOAD_LENGTH, // 默认9
      // 可以指定是原图还是压缩图，默认二者都有
      sizeType: ['original', 'compressed'],
      // 可以指定来源是相册还是相机，默认二者都有
      sourceType: ['album', 'camera'],
      success: (res) => {
        let { waitUploadImgs } = this.data;
        // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
        let tempFilePaths = res.tempFilePaths

        let totalLength = tempFilePaths.length + waitUploadImgs.length;
        let overLength = totalLength - UPLOAD_LENGTH;
        let remainLength = tempFilePaths.length - overLength;

        // 如果图片累计的数量超过了规定的张数，则提示
        if (overLength > 0) {
          tempFilePaths = tempFilePaths.splice(0, remainLength);

          wx.showToast({
            title: `图片最多只能上传${UPLOAD_LENGTH}张，您已选择${totalLength}张`,
            image: '../../icons/close-circled.png'
          })
        }
        waitUploadImgs.push(...tempFilePaths)

        this.setData({
          waitUploadImgs
        });
      }
    })
  },
  // 移除待上传图片
  removeUploadImg (e) {
    let { index } = e.currentTarget.dataset;
    let { waitUploadImgs, uploadedImgs } = this.data;

    waitUploadImgs.splice(index, 1);
    uploadedImgs.splice(index, 1);

    this.setData({
      waitUploadImgs,
      uploadedImgs
    });
  },
  // 获取七牛云上传token
  getUploadToken () {
    let { uploadToken } = this.data;

    let p = new Promise((resolve, reject) => {
      // 如果上传token已经获取，则直接resolve
      if (uploadToken) {
        resolve(uploadToken);
      } else {
        wx.showLoading();
        http.request({
          url: api.getUploadToken
        }).then((res) => {

          if (res.errorCode == 200) {
            this.setData({
              uploadToken: res.data
            })

            resolve(res.data);
          } else {
            wx.hideLoading();

            wx.showToast({
              title: res.moreInfo || '获取七牛云token失败，请重试',
              image: '../../icons/close-circled.png'
            })

            reject();
          }
        });
      }
    });

    return p;
  },
  // 重置上传相关的字段
  resetUpload () {
    this.setData({
      waitUploadImgs: [],
      uploadedImgs: []
    });
  },
  // 上传图片
  upload () {
    let { waitUploadImgs, isUpload } = this.data;

    try {
      if (waitUploadImgs.length == 0) {
        throw new Error('您还未选择图片');
      }

      if (isUpload) {
        throw new Error('正在上传中，请稍后');
      }
    } catch (e) {
      return wx.showToast({
        title: e.message,
        image: '../../icons/close-circled.png'
      })
    }

    this.setData({
      isUpload: true
    });

    this.getUploadToken()
      .then((uptoken) => {
        // 每一张上传图片的进度
        let promiseArr = [];

        // 循环上传每一张图片
        waitUploadImgs.forEach((imgUrl, index) => {
          let q = new Promise((resolve, reject) => {
            qiniuUploader.upload(imgUrl, (res) => {
              // 按顺序设置每一张图片的七牛云地址
              this.setData({
                [`uploadedImgs[${index}]`]: `http://${res.imageURL}`,
              });

              resolve();
            }, (error) => {
              reject(error);
            }, {
              uptoken,
              region: 'ECN',
              domain: 'oxciz4ayj.bkt.clouddn.com'
            })
          });

          promiseArr.push(q);
        });

        // 图片全部上传完毕之后，隐藏loading效果，将isUpload正在上传开关关闭
        Promise.all(promiseArr).then(() => {
          this.setData({
            isUpload: false
          });

          // 图片上传成功
          wx.showToast({
            title: '恭喜你图片上传成功',
            image: '../../icons/close-circled.png'
          })
        }, (res) => {
          wx.showToast({
            title: `上传失败，错误：${res.errMsg}`,
            image: '../../icons/close-circled.png'
          })

          this.setData({
            isUpload: false
          });
        });
      })
      .catch(() => {
      });
  },

  // 显示、隐藏老师批注弹窗
  toggleCommentPopup (e) {
    let { commentPopupToggle, habit } = this.data;

    // 如果是要打开弹窗，记录下这条数据的位置，提交评论时读取其id
    if (!commentPopupToggle) {
      let { pIndex, cIndex } = e.currentTarget.dataset;
      let comments = habit[pIndex].students[cIndex].comments;

      if (comments.length > 0) {
        return wx.showToast({
          title: '只能评论一条哦～',
          image: '../../icons/close-circled.png'
        })
      }

      this.setData({
        pIndex,
        cIndex,
        commentPopupToggle: !commentPopupToggle
      });
    } else {
      this.setData({
        commentPopupToggle: !commentPopupToggle
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
    this.toggleCommentPopup();
    http.request({
      url: api.commentStudentHabit,
      method: 'POST',
      data: {
        id,
        content: comment
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
  // 下拉刷新
  // 未注册用户进入本页面 -> 提示未注册 -> 跳转注册 -> 回到本页面时，也需要调用本方法刷新页面
  onPullDownRefresh () {
    this.getData();
  },
  // 页面隐藏时，将倒计时清除
  onHide () {
    let { countDownId } = this.data;

    if (countDownId) {
      clearInterval(countDownId);
    }
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

    wx.setNavigationBarTitle({
      title: role == 1 ? '未完成习惯的学生列表' : '学生习惯完成情况'
    })

    this.setData({
      role
    });

    this.getData();
  }
})

import timeTabs from '../../components/time-tabs/index.js';
import http from '../../public/js/http.js';
import api from '../../public/js/api.js';
import utils from '../../public/js/utils.js';

let role = wx.getStorageSync('role') || 1;

Page({
  data: {
    timeTabs: {
      // 左侧时间tab的选中序号
      timeTabsIndex: 0,
      list: ['动态', '成员'],
      group: [],
      idx: 0
    },
    // 群组的id
    groupId: '',
    // 选择的群组的序号
    groupIndex: 0,
    // 群组动态的分页
    page: 0,
    // 群组动态
    aList: [],
    // 群组列表
    gList: [],
    // 群组成员
    mList: [],
    // 是否还有下一页
    isMore: true,
    // 数据是否加载完毕
    isLoaded: false,
    // 分页是否正在请求中
    isRequest: false,
    // 是否正在提交数据
    isSubmit: false,
    // 是否正在回复中
    isReply: false
  },
  bindPickerChange (e) {
    this.setData({
      groupIndex: e.detail.value
    })
  },
  // 设置标题
  setNavigationBarTitle () {
    let index = this.data.timeTabs.timeTabsIndex;
    let title = '';

    if (index === 0) {
      title = '群组动态';
    } else if (index === 1) {
      title = '群组成员';
    }

    wx.setNavigationBarTitle({
      title
    })
  },
  // 切换时间序号
  switchTapIndex (e) {
    timeTabs.switchTapIndex.call(this, e);

    this.setNavigationBarTitle();
    this.getData();
  },
  // 获取数据
  getData () {
    let type = this.data.timeTabs.timeTabsIndex;

    if (type == 0) {
      this.getGroupActive();
    } else if (type == 1) {
      this.getGroupMember();
      this.getGroup();
    }
  },
  // 获取群组动态
  getGroupActive () {
    let { page, groupId, aList, isMore, isRequest, isLoaded } = this.data;

    // 限制重复多次请求
    if (isRequest) {
      return false;
    }

    if (!isMore) {
      return wx.showToast({
        title: '没有更多了',
        image: '../../icons/close-circled.png'
      })
    }

    this.setData({
      isRequest: true
    });

    wx.showLoading();
    http.request({
      url: api.groupActiveList,
      data: {
        page,
        id: groupId
      }
    }).then((res) => {
      wx.hideLoading();

      // 如果是第一页，则直接覆盖aList
      if (page === 0) {
        aList = res.data;
      } else {
        aList = aList.concat(res.data);
      }

      // 如果返回的数据为0，则表示没有下一页
      (res.data.length == 0) && (isMore = false);
      // 如果是第一次加载
      (!isLoaded) && (isLoaded = true);

      res.data.forEach((item) => {
        // 回复的文字
        item.replyText = '';
        // 是否显示回复框
        item.isShowReply = false;
        item.date = utils.formatDate(new Date(item.time));
      });

      page++;

      this.setData({
        page,
        aList,
        isMore,
        isLoaded,
        isRequest: false
      });
    });
  },
  // 上拉加载更多
  lower () {
    console.log(1);
    this.getGroupActive();
  },
  // 显示、隐藏回复框
  toggleReply (e) {
    let index = e.currentTarget.dataset.index;
    let { aList } = this.data;
    let isShowReply = aList[index].isShowReply;

    this.setData({
      [`aList[${index}].isShowReply`]: !isShowReply
    });
  },
  // 处理回复时输入的文字
  inputReply (e) {
    let index = e.currentTarget.dataset.index;
    let { aList } = this.data;
    let replyText = e.detail.value;

    try {
      if (replyText.length > 140) {
        replyText = replyText.substring(0, 139);
        throw new Error('评论长度不得超过140个字');
      }
    } catch (e) {
      return wx.showToast({
        title: e.message,
        image: '../../icons/close-circled.png'
      })
    }

    this.setData({
      [`aList[${index}].replyText`]: replyText
    });
  },
  // 回复
  submitReply (e) {
    let index = e.currentTarget.dataset.index;
    let { aList, isReply } = this.data;
    let id = aList[index].id;
    let replyText = aList[index].replyText;

    try {
      if (isReply) {
        throw new Error('正在回复中...');
      }
      if (!replyText) {
        throw new Error('请填写评论');
      }
      if (replyText.length > 140) {
        throw new Error('评论长度不得超过140个字');
      }
    } catch (e) {
      return wx.showToast({
        title: e.message,
        image: '../../icons/close-circled.png'
      })
    }

    this.setData({
      isReply: true
    })

    wx.showLoading();
    http.request({
      url: api.comment,
      method: 'POST',
      data: {
        id,
        content: replyText
      }
    }).then((res) => {
      wx.hideLoading();

      if (res.errorCode == 200) {
        wx.showToast({
          title: res.moreInfo || '回复成功'
        })

        setTimeout(() => {
          this.setData({
            page: 0,
            isMore: true,
            isReply: false,
            isRequest: false
          })

          this.getGroupActive();
        }, 1500);
      } else {
        wx.showToast({
          title: res.moreInfo || '回复失败',
          image: '../../icons/close-circled.png'
        })

        this.setData({
          isReply: false
        })
      }
    });
  },
  // 点赞
  thumb (e) {
    let index = e.currentTarget.dataset.index;
    let { aList } = this.data;
    let id = aList[index].id;
    let thumb = aList[index].thumb;

    wx.showLoading();
    http.request({
      url: api.thumb,
      method: 'POST',
      data: {
        id
      }
    }).then((res) => {
      wx.hideLoading();

      if (res.errorCode == 200) {
        if (res.data) {
          thumb++;
        } else {
          thumb--;
        }
        this.setData({
          [`aList[${index}].thumb`]: thumb
        });
      }
    });
  },

  // 获取群组组列表
  getGroup () {
    wx.showLoading();
    http.request({
      url: api.groupList
    }).then((res) => {
      wx.hideLoading();

      this.setData({
        gList: res.data
      });
    });
  },
  // 获取群组成员
  getGroupMember () {
    let id = this.data.groupId;

    wx.showLoading();
    http.request({
      url: api.groupMemberList,
      data: {
        id
      }
    }).then((res) => {
      wx.hideLoading();

      this.setData({
        isLoaded: true,
        mList: res.data
      });
    });
  },
  // 全选成员
  selectAllMember () {
    
  },
  onLoad (params) {
    // 顶部tabs选中的序号，0为群组动态，1为群组成员
    let type = params.type || 0;
    let groupId = params.groupId;

    if (!groupId) {
      wx.showModal({
        title: '提示',
        content: '请传入群组id',
        image: '../../icons/close-circled.png'
      })
    } else {
      this.setData({
        'timeTabs.timeTabsIndex': type,
        groupId
      });

      this.getData();
    }
  }
})

import timeTabs from '../../components/time-tabs/index.js';
import http from '../../public/js/http.js';
import api from '../../public/js/api.js';
import utils from '../../public/js/utils.js';

let role = wx.getStorageSync('role') || 1;

Page({
  data: {
    role,
    timeTabs: {
      // 左侧时间tab的选中序号
      timeTabsIndex: 0,
      list: ['动态', '成员'],
      group: [],
      idx: 0
    },
    // 群组的id
    groupId: '',
    // 数据是否加载完毕
    isLoaded: false,

    // 群组动态
    aList: [],
    // 群组列表
    gList: [],
    // 群组成员
    mList: [],

    // 群组动态的分页
    page: 0,
    // 是否还有下一页
    isMore: true,
    // 分页是否正在请求中
    isRequest: false,
    // 是否正在回复中
    isReply: false,

    // 选择移动到的群组的序号
    groupIndex: 0,
    // 是否全选组员
    isSelectAll: false,
    // 是否正在移动组员
    isMoveMember: false,
    // 是否正在邀请组员中
    isInvite: false,
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
      this.setData({
        page: 0,
        isMore: true,
        isRequest: false,
        isReply: false,
      });

      this.getGroupActive();
    } else if (type == 1) {
      this.setData({
        groupIndex: 0,
        isSelectAll: false,
        isMoveMember: false,
        isInvite: false,
      });

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
  // 获取群组组员
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

      res.data.forEach((item) => {
        item.isSelected = false;
      });

      this.setData({
        isLoaded: true,
        mList: res.data
      });
    });
  },
  // 全选组员
  selectAllMember () {
    let { mList, isSelectAll } = this.data;

    isSelectAll = !isSelectAll;

    mList.forEach((item) => {
      item.isSelected = isSelectAll;
    });

    this.setData({
      mList,
      isSelectAll
    });
  },
  // 选中组员
  selectMember (e) {
    let index = e.currentTarget.dataset.index;
    let { mList } = this.data;
    let isSelected = mList[index].isSelected;

    this.setData({
      [`mList[${index}].isSelected`]: !isSelected
    })
  },
  // 删除组员
  deleteMember (e) {
    let { index, id } = e.currentTarget.dataset;
    let { mList } = this.data;
    let deleteMember = mList.splice(index, 1);

    wx.showModal({
      content: `确实要删除 "${deleteMember[0].name}" 吗？`,
      success: (res) => {
        if (res.confirm) {
          this.setData({
            mList
          })

          wx.showLoading();
          http.request({
            url: api.deleteMember,
            method: 'POST',
            data: {
              id
            }
          }).then((res) => {
            if (res.data) {
              wx.showToast({
                title: '删除成功'
              })
            } else {
              wx.showToast({
                title: '删除失败',
                image: '../../icons/close-circled.png'
              })
              mList.splice(index, 0, ...deleteMember);
              this.setData({
                mList
              })
            }
          });
        }
      }
    })
  },
  // 移动组员到其他分组中
  moveMember () {
    let { mList, gList, groupIndex, isMoveMember } = this.data;
    // 选中的组员id
    let ids = [];
    // 目标群组id
    let groupId = gList[groupIndex].id;
    // 剩余的人员
    let remainMember = [];

    try {
      // 正在移动组员中
      if (isMoveMember) {
        throw new Error('正在移动组员中');
      }

      // 如果群组数据未返回
      if (!gList[groupIndex]) {
        throw new Error('群组数据未返回，请稍等');
      }

      // 如果选择的群组id不存在
      if (!gList[groupIndex].id) {
        throw new Error(`选择的群组id(${gList[groupIndex].id})有误`);
      }

      let selectedNum = 0;
      mList.forEach((item) => {
        if (item.isSelected) {
          ids.push(item.id);
          selectedNum++;
        } else {
          remainMember.push(item);
        }
      });

      // 如果选择的组员数量为0
      if (selectedNum === 0) {
        throw new Error('请至少选择一个组员');
      }
    } catch (e) {
      return wx.showToast({
        title: e.message,
        image: '../../icons/close-circled.png'
      })
    }

    wx.showModal({
      content: `将要移动${ids.length}位组员到 "${gList[groupIndex].name}" 中`,
      success: (res) => {
        if (res.confirm) {
          this.setData({
            isMoveMember: true
          });

          wx.showLoading();
          http.request({
            url: api.moveMember,
            method: 'POST',
            data: {
              ids,
              groupId
            }
          }).then((res) => {
            if (res.data) {
              wx.showToast({
                title: '移动成功'
              })
              this.setData({
                mList: remainMember
              });
              setTimeout(() => {
                this.getData();
              }, 1500)
            } else {
              wx.showToast({
                title: '移动失败',
                image: '../../icons/close-circled.png'
              })
              this.setData({
                isMoveMember: false
              });
            }
          });
        }
      }
    })
  },
  // 邀请组员
  inviteMember () {
    let { groupId, gList } = this.data;
    let code = '';

    if (gList.length === 0) {
      return wx.showToast({
        title: '获取群组数据中，请稍后...',
        image: '../../icons/close-circled.png'
      })
    }

    gList.some((item) => {
      if (groupId == item.id) {
        code = item.inviteCode;
        return true;
      } else {
        return false;
      }
    });

    if (code === '') {
      return wx.showToast({
        title: '邀请码获取失败',
        image: '../../icons/close-circled.png'
      })
    }

    wx.navigateTo({
      url: `/pages/invite/invite?code=${code}`
    })
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

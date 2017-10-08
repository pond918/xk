import http from '../../public/js/http.js';
import api from '../../public/js/api.js';

let role = wx.getStorageSync('role') || 1;

Page({
  data: {
    role,
    week: ['一', '二', '三', '四', '五', '六', '七'],
    selectedWeek: [],
    // 习惯列表
    list: [],
    // 已选习惯个数
    selectedNum: 0,
    // 必选习惯个数
    requiredNum: 0,
    // 分页页码
    page: 0,
    // 是否还有下一页
    isMore: true,
    // 数据是否加载完毕
    isLoaded: false,
    // 分页是否正在请求中
    isRequest: false,
    // 是否正在提交数据
    isSubmit: false,

    // 需要设置提醒时间的序号
    habitIndex: 0,
    // 是否显示提醒时间设置框
    isShowRemind: false
  },
  // 根据角色获取老师或者家长的习惯列表
  getData () {
    let { role, page, list, isMore, isRequest, isLoaded } = this.data;
    let url = (role == 1 ? api.teacherHabitList : api.parentHabitList);

    // 限制重复多次请求
    if(isRequest){
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
      url,
      data: {
        page
      }
    }).then((res) => {
      wx.hideLoading();
      page++;

      // 如果返回的数据为0，则表示没有下一页
      (res.data.length == 0) && (isMore = false);
      // 如果是第一次加载
      (!isLoaded) && (isLoaded = true);

      if(role == 1){
        res.data.forEach((item) => {
          item.isSelected = false;
          item.isRequired = false;
        });
      } else {
        res.data.forEach((item) => {
          // 二进制周数，1001表示周一和周四必选
          let weekStr = item.repeat.toString(2);
          let zeroArr = Array(7 - weekStr.length + 1).join('0');

          // 是否显示具体的分数
          item.isShowDetail = false;
          // 习惯提醒的重复周期
          item.repeatCycle = (zeroArr + weekStr).split('').reverse();
          // 选择的时间
          item.alarmTimes = '';
          // 该习惯是否选中
          item.isSelected = item.required ? true : false;
        });
      }

      list = list.concat(res.data);
      this.setData({
        page,
        list,
        isMore,
        isLoaded,
        isRequest: false
      });

      if(role == 2) {
        this.countParentHabit();
      }
    });
  },
  // 上拉加载更多
  lower () {
    this.getData();
  },
  // 计算老师已经选择的习惯个数和必选的习惯个数
  countTeacherHabit () {
    let { list } = this.data;
    let selectedNum = 0;
    let requiredNum = 0;

    list.forEach((item) => {
      if (item.isSelected) {
        selectedNum++;
        if (item.isRequired) {
          requiredNum++;
        }
      }
    });

    this.setData({
      selectedNum,
      requiredNum
    });
  },
  // 计算家长已经选择的习惯个数和必选的习惯个数
  countParentHabit () {
    let { list } = this.data;
    let selectedNum = 0;
    let requiredNum = 0;

    list.forEach((item) => {
      if (item.isSelected) {
        selectedNum++;
        if (item.required) {
          requiredNum++;
        }
      }
    });

    this.setData({
      selectedNum,
      requiredNum
    });
  },
  // 选择老师习惯列表
  selectTeacherHabit (e) {
    let index = e.currentTarget.dataset.index;
    let { list } = this.data;

    // 如果是取消选中，则要把必选置为false
    if(list[index].isSelected){
      this.setData({
        [`list[${index}].isSelected`]: !list[index].isSelected,
        [`list[${index}].isRequired`]: false
      })
    } else {
      this.setData({
        [`list[${index}].isSelected`]: !list[index].isSelected
      })
    }

    this.countTeacherHabit ();
  },
  // 选择家长习惯列表
  selectParentHabit (e) {
    let index = e.currentTarget.dataset.index;
    let { list } = this.data;

    this.setData({
      [`list[${index}].isSelected`]: !list[index].isSelected
    })

    this.countParentHabit ();
  },
  // 设置习惯是否必选
  switchChange (e) {
    let index = e.currentTarget.dataset.index;
    let { list } = this.data;

    if(!list[index].isSelected){
      wx.showToast({
        title: '请先选择该选项',
        image: '../../icons/close-circled.png'
      })
    }

    this.setData({
      [`list[${index}].isRequired`]: !list[index].isRequired
    })

    this.countTeacherHabit ();
  },
  // 提交
  submit () {
    let {
      list,
      requiredNum,
      isSubmit
    } = this.data;

    try {
      if (isSubmit) {
        throw new Error('正在提交中...');
      }
      if (requiredNum < 2) {
        throw new Error('必选的习惯不得小于2项');
      }
    } catch (e) {
      return wx.showToast({
        title: e.message,
        image: '../../icons/close-circled.png'
      })
    }

    let habitArr = [];
    let habitRequiredArr = [];

    list.forEach((item)=>{
      if(item.isSelected){
        habitArr.push(item.id);
        habitRequiredArr.push(item.isRequired);
      }
    });

    this.setData({
      isSubmit: true
    })

    wx.showLoading();
    http.request({
      url: api.teacherSubmitHabit,
      method: 'POST',
      data: {
        habitIds: habitArr,
        requireds: habitRequiredArr
      }
    }).then((res) => {
      wx.hideLoading();

      if (res.errorCode == 200) {
        wx.showToast({
          title: res.moreInfo || '提交成功'
        })

        setTimeout(() => {
          wx.navigateTo({
            url: `/pages/invite/invite?code=${res.data}`
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

  // 显示习惯详情
  showHabitDetail (e) {
    let index = e.currentTarget.dataset.index;
    let { list } = this.data;
    let isShowDetail = list[index].isShowDetail;

    this.setData({
      [`list[${index}].isShowDetail`]: !isShowDetail
    });
  },
  // 显示、隐藏提醒时间设置框
  toggleRemind (e) {
    let { list, isShowRemind } = this.data;
    isShowRemind = !isShowRemind;

    // 如果是显示设置框
    if(isShowRemind){
      let index = e.currentTarget.dataset.index;

      this.setData({
        isShowRemind,
        habitIndex: index
      });
    } else {
      this.setData({
        isShowRemind
      });
    }
  },
  // 选择时间
  bindTimeChange (e) {
    let { list, habitIndex } = this.data;

    this.setData({
      [`list[${habitIndex}].alarmTimes`]: e.detail.value
    })
  },
  // 选择星期
  selectWeek (e) {
    let index = e.currentTarget.dataset.index;
    let { list, habitIndex } = this.data;
    let num = list[habitIndex].repeatCycle[index];

    this.setData({
      [`list[${habitIndex}].repeatCycle[${index}]`]: num == '0' ? '1' : '0'
    })
  },
  // 选好了时间
  confirmWeek () {
    let { list, habitIndex } = this.data;
    let alarmTimes = list[habitIndex].alarmTimes;

    try {
      if (!alarmTimes) {
        throw new Error('请选择提醒时间');
      }
    } catch (e) {
      return wx.showToast({
        title: e.message,
        image: '../../icons/close-circled.png'
      })
    }

    this.toggleRemind();
  },
  onLoad () {
    let role = wx.getStorageSync('role') || 1;

    this.setData({
      role
    });

    this.getData();
  }
})

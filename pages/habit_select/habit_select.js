import http from '../../public/js/http.js';
import api from '../../public/js/api.js';

Page({
  data: {
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
    isSubmit: false
  },
  // 选择星期
  selectWeek (e) {
    let index = e.currentTarget.dataset.index;
    let { selectedWeek } = this.data;

    selectedWeek[index] = selectedWeek[index] ? undefined : (index + 1);

    this.setData({
      selectedWeek
    })
  },
  // 获取习惯列表
  getData () {
    let { page, list, isMore, isRequest, isLoaded } = this.data;

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
      url: api.teacherHabitList,
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

      res.data.forEach((item) => {
        item.isSelected = false;
        item.isRequired = false;
      });

      list = list.concat(res.data);

      this.setData({
        page,
        list,
        isMore,
        isLoaded,
        isRequest: false
      });
    });
  },
  // 上拉加载更多
  lower () {
    this.getData();
  },
  // 计算已经选择的习惯个数和必选的习惯个数
  countHabit () {
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
  // 选择习惯列表
  selectHabit (e) {
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

    this.countHabit ();
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

    this.countHabit ();
  },
  // 提交
  submit () {
    let {
      list,
      requiredNum,
      isSubmit
    } = this.data;

    try {
      if (requiredNum < 2) {
        throw new Error('必选的习惯不得小于2项');
      }
    } catch (e) {
      return wx.showToast({
        title: e.message,
        image: '../../icons/close-circled.png'
      })
    }

    if (isSubmit) {
      return wx.showToast({
        title: '正在提交中...',
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
  onLoad () {
    this.getData();
  }
})

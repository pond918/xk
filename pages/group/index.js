Page({
  data: {
    timeTabs: {
      list: [
        {
          name: '日'
        }, {
          name: '周'
        }, {
          name: '月'
        }, {
          name: '学期'
        }
      ],
      idx: 0,
      sub: '群组>',
      bb: true
    }
  },
  switchTap (e) {
    this.setData({
      'timeTabs.idx': e.currentTarget.dataset.index
    });
  },
  //
  getData () {

  },
  onLoad () {

  }
})

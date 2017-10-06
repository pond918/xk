const time = {
  data: {
    // 左侧时间tab的选中序号
    timeTabsIndex: 0,
    // 右侧群组的选中序号
    timeGroupIndex: 0,
  },
  // 切换时间序号
  switchTapIndex (e) {
    this.setData({
      'timeTabs.timeTabsIndex': e.currentTarget.dataset.index
    });
  },
  // 切换群组序号
  switchGroupIndex (e) {
    let index = e.currentTarget.dataset.index;
    let length = this.data.timeTabs.group.length;

    (++index > length - 1) && (index = 0);

    this.setData({
      'timeTabs.timeGroupIndex': index
    });
  },
}

export default time;

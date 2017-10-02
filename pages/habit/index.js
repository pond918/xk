Page({
  data: {
    week: ['一', '二', '三', '四', '五', '六', '七'],
    selectedWeek: [],
  },
  // 选择星期
  selectWeek (e) {
    let index = e.currentTarget.dataset.index;
    let { selectedWeek } = this.data;

    selectedWeek[index] = selectedWeek[index] ? undefined : (index + 1);
    console.log(selectedWeek);

    this.setData({
      selectedWeek
    })
  },
  //
  getData () {

  },
  onLoad () {

  }
})

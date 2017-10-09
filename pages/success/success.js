Page({
  data: {
    name: '',
    className: ''
  },
  //
  getData () {

  },
  onLoad (params) {
    let { name, className } = params;
    this.setData({
      name,
      className
    })
  }
})

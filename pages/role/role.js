Page({
  data: {

  },
  //
  getData () {

  },
  onLoad (options) {
    var scene = decodeURIComponent(options.scene);
    this.setData({
      adminId: scene.adminId || 3
    });
  }
})

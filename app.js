App({
  globalData: {
    userInfo: null,
    // 全局的sessionId
    sessionId: wx.getStorageSync('sessionId') || null
  },
})

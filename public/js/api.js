let api = {
  // 个人中心
  user: '/wx/info'
}

for (var attr in api) {
  api[attr] = 'https://www.byunfu.com/site' + api[attr];
}

export default api;
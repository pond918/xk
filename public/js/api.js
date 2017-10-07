let api = {
  imgUrl: 'http://oxciz4ayj.bkt.clouddn.com/',
  // 学生列表
  studentList: '/score/member/list',
  // 我的习惯列表
  habitList: '/p/habit/list',

  // 群组积分
  groupScoreList: '/score/group/list',
  // 群组动态
  groupActiveList: '/group/feed/list',


  // 家长习惯列表
  parentHabitList: '/p/habit/mine/list',

  // 年级列表
  gradeList: '/class/list/grade',
  // 班级列表
  classList: '/class/list/class',

  // 老师注册
  teacherRegistry: '/user/reg/t',
  // 老师选择习惯
  teacherHabitList: '/t/habit/list',
  // 老师提交习惯
  teacherSubmitHabit: '/t/habit/select',
  // 老师分享班级
  shareClass: '/share/class',
  // 班级二维码
  classTwoCode: '/t/class/qrcode',

  // 登录
  login: '/wx/login',
  // 发送验证码
  verifyCode: '/verify/mobile/send',
  // 个人中心
  user: '/wx/info'
}

let devDomain = 'https://xike.onxiao.cn/xikedd';
let testDomain = 'https://result.eolinker.com/ZQruBkm293ea403a5cdbe011f08f51807ba6055cc820467?uri=/score';

for (var attr in api) {
  api[attr] = devDomain + api[attr];
}

export default api;
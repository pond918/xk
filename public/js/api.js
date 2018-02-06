let api = {
  imgUrl: 'http://oxciz4ayj.bkt.clouddn.com/',
  // 群组积分
  groupScoreList: '/score/group/list',
  // 学生排名
  studentList: '/score/member/list',
  // 习惯列表
  habitList: '/student/habit/list',

  // 群组动态
  groupActiveList: '/group/feed/list',
  // 评论群组动态
  comment: '/group/feed/comment',
  // 点赞
  thumb: '/group/feed/thumb',
  // 群组列表
  groupList: '/t/group/list',
  // 群组成员
  groupMemberList: '/t/group/member/list',
  // 删除组员
  deleteMember: '/t/member/remove',
  // 移动组员
  moveMember: '/t/group/member/move',

  // 家长注册
  parentRegistry: '/user/reg/p',
  // 家长选择习惯
  parentSelectHabit: '/p/habit/list',
  // 家长提交习惯
  parentSubmitHabit: '/p/habit/select',
  // 家长完成习惯
  parentCompleteHabit: '/p/habit/mine/check',
  // 家长未完成习惯
  parentFailHabit: '/p/habit/mine/uncheck',
  // 获取七牛云token
  getUploadToken: '/res/qiniu/token',

  // 年级列表
  gradeList: '/class/list/grade',
  // 班级列表
  classList: '/class/list/class',

  // 老师注册
  teacherRegistry: '/user/reg/t',
  // 老师选择习惯
  teacherSelectHabit: '/t/habit/list',
  // 老师提交习惯
  teacherSubmitHabit: '/t/habit/select',
  // 老师分享班级
  shareClass: '/share/class',
  // 新建分组
  createGroup: '/t/group/create',
  // 删除群组
  deleteGroup: '/t/group/remove',
  // 评论学生习惯
  commentStudentHabit: '/t/student/habit/comment',

  // 登录
  login: '/wx/login',
  // 提交用户信息
  submitUserInfo: '/wx/user/info',
  // 发送验证码
  verifyCode: '/verify/mobile/send',
  // 个人中心
  user: '/wx/info',
  // 收集formId
  formIdsSave: '/wx/formIds'
}

let devDomain = 'https://xike.onxiao.cn/xikedd';
let testDomain = 'https://result.eolinker.com/ZQruBkm293ea403a5cdbe011f08f51807ba6055cc820467?uri=';

for (var attr in api) {
  api[attr] = devDomain + api[attr];
}

export default api;
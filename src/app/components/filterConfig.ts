export type FilterGroupItem = { key: string; label: string };
export type FilterGroup = { group: string; items: FilterGroupItem[] };

export const FILTER_GROUPS: FilterGroup[] = [
  {
    group: '通用设置',
    items: [
      { key: 'adCreateTime', label: '广告创建时间' },
      { key: 'game',         label: '游戏名称' },
      { key: 'os',           label: '系统' },
      { key: 'bizType',      label: '业务类型' },
      { key: 'mainChannel',  label: '主渠道' },
      { key: 'optimizer',    label: '优化师' },
      { key: 'subChannel',   label: '子渠道标识' },
    ],
  },
  {
    group: '投放设置',
    items: [
      { key: 'deliveryMode',  label: '投放模式' },
      { key: 'bidStrategy',   label: '竞价策略' },
      { key: 'optGoal',       label: '优化目标' },
      { key: 'deepOptGoal',   label: '深度优化目标' },
      { key: 'deepOptMethod', label: '深度优化方式' },
      { key: 'priceRange',    label: '出价范围' },
    ],
  },
  {
    group: '广告属性',
    items: [
      { key: 'accountId',         label: '账户ID' },
      { key: 'accountName',       label: '账户名称' },
      { key: 'projectId',         label: '项目ID' },
      { key: 'projectName',       label: '项目名称' },
      { key: 'adId',              label: '广告ID' },
      { key: 'adName',            label: '广告名称' },
      { key: 'mediaCreativeId',   label: '媒体素材ID' },
      { key: 'mediaCreativeName', label: '媒体素材名称' },
    ],
  },
  {
    group: '素材信息',
    items: [
      { key: 'mediaCreativeMd5',    label: '媒体素材MD5' },
      { key: 'creativeName',        label: '素材名称' },
      { key: 'excludeCreativeName', label: '排除素材名称' },
    ],
  },
];

export const ALL_FILTER_KEYS = FILTER_GROUPS.flatMap(g => g.items.map(i => i.key));

export type FilterOptionAnnotation = { col1?: string; col2?: string };
export type FilterChipConfig = {
  label: string;
  options: string[];
  optionAnnotations?: Record<string, FilterOptionAnnotation>;
};

export const FILTER_CHIP_DATA: Record<string, FilterChipConfig> = {
  adCreateTime: { label: '广告创建时间', options: [] },
  game: {
    label: '游戏名称',
    options: [
      '捕鱼大咖', '鱼乐天下', '大咖主播', '捕鱼达人', '欢乐捕鱼', '捕鱼王者',
      '街机捕鱼', '海王捕鱼', '金鲨银鲨', '飞禽走兽', '欢乐斗地主', '天天麻将',
      '升级麻将', '四川麻将', '跑胡子', '电玩城传奇', '街机三国', '捕鸟达人',
      '海底总动员', '神兽大爆发', '龙族幻想', '剑侠情缘', '梦幻西游', '问道手游',
      '神武4手游', '御龙在天', '完美世界手游', '乱世王者', '率土之滨', '三国志战略版',
      '王者荣耀', '和平精英', '原神手游', '明日方舟',
    ],
  },
  dataScope: { label: '数据口径', options: ['设备不去重', '去刷号'] },
  os:      { label: '系统',     options: ['Android', 'iOS', '鸿蒙'] },
  bizType: {
    label: '业务类型',
    options: ['效果', '视频号', '达人', '核减'],
  },
  mainChannel: {
    label: '主渠道',
    options: [
      '头条btt', '头条btoutiao', '头条bttopic', '头条btpangle',
      '快手ksa', '快手ksb', '快手ksc', '快手ksd',
      '广点通gdt01', '广点通gdt02', '广点通gdt03', '广点通gdt04',
      '微博wb01', '微博wb02', '微博wb03',
      'Bilibili_b01', 'Bilibili_b02',
      '百度bd01', '百度bd02', '百度bd03',
      'OPPO推送op01', 'OPPO推送op02',
      '华为广告hw01', '华为广告hw02',
      '小米广告mi01', '小米广告mi02',
      'vivo广告vv01', 'vivo广告vv02',
      '知乎zz01', '抖音dy01', '抖音dy02', '抖音dy03', '西瓜视频xg01',
    ],
    optionAnnotations: {
      头条btt:        { col1: '捕鱼大咖',   col2: 'Android' },
      头条btoutiao:   { col1: '捕鱼大咖',   col2: 'iOS'     },
      头条bttopic:    { col1: '鱼乐天下',   col2: 'Android' },
      头条btpangle:   { col1: '鱼乐天下',   col2: 'iOS'     },
      快手ksa:        { col1: '捕鱼大咖',   col2: 'iOS'     },
      快手ksb:        { col1: '捕鱼大咖',   col2: '鸿蒙'   },
      快手ksc:        { col1: '大咖主播',   col2: 'Android' },
      快手ksd:        { col1: '大咖主播',   col2: 'iOS'     },
      广点通gdt01:    { col1: '捕鱼大咖',   col2: 'Android' },
      广点通gdt02:    { col1: '捕鱼大咖',   col2: 'iOS'     },
      广点通gdt03:    { col1: '鱼乐天下',   col2: 'Android' },
      广点通gdt04:    { col1: '鱼乐天下',   col2: '鸿蒙'   },
      微博wb01:       { col1: '捕鱼达人',   col2: 'Android' },
      微博wb02:       { col1: '捕鱼达人',   col2: 'iOS'     },
      微博wb03:       { col1: '欢乐捕鱼',   col2: 'Android' },
      Bilibili_b01:   { col1: '鱼乐天下',   col2: 'Android' },
      Bilibili_b02:   { col1: '鱼乐天下',   col2: 'iOS'     },
      百度bd01:       { col1: '梦幻西游',   col2: 'Android' },
      百度bd02:       { col1: '梦幻西游',   col2: 'iOS'     },
      百度bd03:       { col1: '问道手游',   col2: 'Android' },
      'OPPO推送op01': { col1: '捕鱼王者',   col2: 'Android' },
      'OPPO推送op02': { col1: '街机捕鱼',   col2: 'Android' },
      华为广告hw01:   { col1: '捕鱼王者',   col2: '鸿蒙'   },
      华为广告hw02:   { col1: '街机捕鱼',   col2: '鸿蒙'   },
      小米广告mi01:   { col1: '海王捕鱼',   col2: 'Android' },
      小米广告mi02:   { col1: '金鲨银鲨',   col2: 'Android' },
      'vivo广告vv01': { col1: '捕鱼达人',   col2: 'Android' },
      'vivo广告vv02': { col1: '欢乐捕鱼',   col2: 'Android' },
      知乎zz01:       { col1: '率土之滨',   col2: 'iOS'     },
      抖音dy01:       { col1: '捕鱼大咖',   col2: 'Android' },
      抖音dy02:       { col1: '捕鱼大咖',   col2: 'iOS'     },
      抖音dy03:       { col1: '大咖主播',   col2: 'Android' },
      西瓜视频xg01:   { col1: '鱼乐天下',   col2: 'Android' },
    },
  },
  optimizer: {
    label: '优化师',
    options: [
      '张磊', '李明', '王芳', '陈刚', '赵云', '刘洋', '吴静', '郑强',
      '孙悦', '周鹏', '徐磊', '朱敏', '何刚', '马超', '林静', '黄磊',
      '杨帆', '谢婷', '宋涛', '韩冰', '曾伟', '邓超', '肖军', '唐宁',
      '冯博', '贾鑫', '蒋涛', '余静', '潘磊', '薛明', '彭超', '戴磊',
      '邵阳', '卢伟',
    ],
  },
  deliveryMode: {
    label: '投放模式',
    options: ['手动投放', '自动投放UBMax', '空'],
  },
  bidStrategy: {
    label: '竞价策略',
    options: ['稳定成本', '最优成本', 'NoBid（最大转化）', '空'],
  },
  optGoal: {
    label: '优化目标',
    options: ['激活', '注册', '付费', '空'],
  },
  deepOptGoal: {
    label: '深度优化目标',
    options: ['付费ROI', '付费ROI-7日', '空'],
  },
  deepOptMethod: {
    label: '深度优化方式',
    options: ['每次付费', 'ROI系数', '每次付费+7日ROI', '空'],
  },
};

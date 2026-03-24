export type FilterGroupItem = { key: string; label: string };
export type FilterGroup = { group: string; items: FilterGroupItem[] };

export const FILTER_GROUPS: FilterGroup[] = [
  {
    group: '通用设置',
    items: [
      { key: 'adCreateTime', label: '广告创建时间' },
      { key: 'game', label: '游戏名称' },
        { key: 'optimizer', label: '优化师' },
        { key: 'mainChannel', label: '主渠道' },
        { key: 'subChannel', label: '子渠道' },
    ],
  },
  {
    group: '广告属性',
    items: [
      { key: 'accountId', label: '账号ID/名称/标签' },
      { key: 'adId', label: '广告ID/名称' },
    ],
  },
  {
    group: '投放设置',
    items: [
      { key: 'opStatus', label: '操作状态' },
      { key: 'adStatus', label: '广告状态' },
      { key: 'optGoal', label: '优化目标' },
      { key: 'deepOptGoal', label: '深度优化目标' },
      { key: 'oneClickStatus', label: '一键起量状态' },
      { key: 'priceRange', label: '出价范围' },
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
  adCreateTime: { label: '广告创建时间', options: ['今天', '昨天', '近7天', '近30天', '本月', '上月'] },
  game: { label: '游戏名称', options: ['鱼乐', '大咖'] },
  optimizer: { label: '优化师', options: ['张磊', '李明', '王芳', '陈刚'] },
  mainChannel: {
    label: '主渠道',
    options: ['头条btt', '头条btoutiao', '快手ksa', '快手ksb', '广点通gdt01', '广点通gdt02'],
    optionAnnotations: {
      头条btt: { col1: '捕鱼大咖', col2: '安卓' },
      头条btoutiao: { col1: '捕鱼大咖', col2: 'iOS' },
      快手ksa: { col1: '捕鱼大咖', col2: 'iOS' },
      快手ksb: { col1: '捕鱼大咖', col2: '鸿蒙' },
      广点通gdt01: { col1: '捕鱼大咖', col2: '安卓' },
      广点通gdt02: { col1: '捕鱼大咖', col2: '安卓' },
    },
  },
  subChannel: { label: '子渠道', options: ['tt00zs01','tt00zs02','tt00fx01','ks_all_01','gdt_main_a01'] },
  accountId: { label: '账号ID/名称', options: ['账号A', '账号B', '账号C'] },
  adId: { label: '广告ID/名称', options: ['广告001', '广告002', '广告003'] },
  opStatus: { label: '操作状态', options: ['投放中', '已暂停', '已删除'] },
  adStatus: { label: '广告状态', options: ['审核通过', '审核未通过', '审核中'] },
  optGoal: { label: '优化目标', options: ['激活', '付费', 'ROI达成'] },
  deepOptGoal: { label: '深度优化目标', options: ['次日留存', '7日留存', '付费ROI'] },
  oneClickStatus: { label: '一键起量状态', options: ['开启', '关闭'] },
};

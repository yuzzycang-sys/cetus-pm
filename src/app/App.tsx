import React, { useState } from 'react';
import { ConfigProvider } from 'antd';
import { ExportModal } from './components/ExportModal';
import { Toaster, toast } from 'sonner';
import { Lock } from 'lucide-react';
import { TopNav } from './components/TopNav';
import { Sidebar } from './components/Sidebar';
import { ViewBar } from './components/ViewBar';
import { FilterBar } from './components/FilterBar';
import { QuickTagBar } from './components/QuickTagBar';
import type { QuickTag } from './components/QuickTagBar';
import { QuickTagModal } from './components/QuickTagModal';
import { SheetTabBar, getCustomPart, buildFullName, GRAN_LABELS } from './components/SheetTabBar';
import { LABEL_MAP } from './components/AggregateDimensionPopover';
import { TableToolBar } from './components/TableToolBar';
import { DataTable } from './components/DataTable';
import { Pagination } from './components/Pagination';
import type { ViewItem } from './components/ViewSelectorDropdown';
import type { FilterCombination } from './components/MetricFilterPopover';
import type { LocalFilters } from './components/LocalFilterPopover';
import type { ShareMode } from './components/ShareViewModal';

const F = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

// ── Permission system constants ────────────────────────────────
const CURRENT_USER = '张三';

// Maps ShareViewModal user IDs → names (for Scene 1 checks)
const SHARE_USER_NAMES: Record<string, string> = {
  u1: '张磊', u2: '李明', u3: '王芳', u4: '陈刚',
  u5: '陈路遥', u6: '刘洋', u7: '赵琳', u8: '吴晓',
  u9: '周杰', u10: '孙雅', u11: '钱文', u12: '胡波',
};

function canUserAccessTag(userName: string, tag: QuickTag): boolean {
  if (tag.vis === 'public') return true;
  if (tag.owner === userName) return true;
  if (tag.vis === 'partial' && tag.authUsers.includes(userName)) return true;
  return false;
}

type TagInfo = { id: string; label: string; owner: string; vis: string };
type PageStatus = { type: 'OK' } | { type: 'NO_PERMISSION'; missingTagsInfo: TagInfo[] };

type PendingShareAction = {
  viewId: string;
  shareMode: ShareMode;
  sharedWith: string[];
  misalignedTags: Array<{ tag: QuickTag; lackingUsers: string[] }>;
};

// ── Per-sheet state ──────────────────────────────────────────
interface SheetState {
  timeGranularity: 'day' | 'week' | 'month' | 'total';
  activeDims: string[];    // committed dims (what DataTable shows)
  pendingDims: string[];   // dims selected in toolbar but not yet queried
  hasData: boolean;
  filterCombinations: FilterCombination[];
  activeFilterId: string | null;
  dimAutoUpdate?: boolean;
}

const DEFAULT_SHEET_STATE: SheetState = {
  timeGranularity: 'day',
  activeDims: ['time', 'game', 'optimizer'],
  pendingDims: ['time', 'game', 'optimizer'],
  hasData: true,
  filterCombinations: [],
  activeFilterId: null,
};

const NEW_SHEET_STATE: SheetState = {
  timeGranularity: 'day',
  activeDims: [],
  pendingDims: [],
  hasData: false,
  filterCombinations: [],
  activeFilterId: null,
};

const INITIAL_SHEETS = ['天-sheet1', '周-sheet2', '月-sheet3', '天-sheet4'];

const INITIAL_SHEET_STATES: Record<string, SheetState> = {
  '天-sheet1': { timeGranularity: 'day',   activeDims: ['time', 'game', 'optimizer'],    pendingDims: ['time', 'game', 'optimizer'],    hasData: true, filterCombinations: [], activeFilterId: null },
  '周-sheet2': { timeGranularity: 'week',  activeDims: ['time', 'mainChannel'],           pendingDims: ['time', 'mainChannel'],           hasData: true, filterCombinations: [], activeFilterId: null },
  '月-sheet3': { timeGranularity: 'month', activeDims: ['time', 'game', 'optimizer'],    pendingDims: ['time', 'game', 'optimizer'],    hasData: true, filterCombinations: [], activeFilterId: null },
  '天-sheet4': { timeGranularity: 'day',   activeDims: ['time'],                          pendingDims: ['time'],                          hasData: true, filterCombinations: [], activeFilterId: null },
};

const INITIAL_VIEWS: ViewItem[] = [
  { id: '1', name: '乐乐·周报',          type: 'mine',   pinned: true  },
  { id: '2', name: '大盘·周投',          type: 'mine',   pinned: true  },
  { id: '3', name: '大盘·月报',          type: 'mine',   pinned: true  },
  // View 4: mine, shared with specific users, contains t1+t3 — Scene 1 + Scene 2
  { id: '4', name: '归因GAP',            type: 'mine',   pinned: false, tag_ids: ['t1', 't3'], shareMode: 'specific', sharedWith: ['u5', 'u9'] },
  // View 5: mine, publicly shared, contains t4 — Scene 1 + Scene 2
  { id: '5', name: '腾讯主包GAP',        type: 'mine',   pinned: false, tag_ids: ['t4'], shareMode: 'public' },
  // View 6 contains t5 (王五's partial tag, no authUsers) — Scene 3 hard-blocks 张三!
  { id: '6', name: '捕鱼大咖iOS当天数据', type: 'shared', owner: '陈路遥', pinned: false, tag_ids: ['t5'] },
  // View 7 references t3 + t6 (both public) — Scene 4 blocks deleting t3 or t6
  { id: '7', name: '异常监控视图',       type: 'shared', owner: '陈路遥', pinned: false, tag_ids: ['t3', 't6'] },
  { id: '8', name: '市场大盘',           type: 'public', pinned: false, tag_ids: ['t8'] },
  { id: '9', name: '渠道大盘',           type: 'public', pinned: false },
];

const INITIAL_TAGS: QuickTag[] = [
  { id: 't1',  label: '头条-安卓-激活',    color: 'blue',    active: false, owner: '张三',   updatedAt: '2026-03-24T10:20:15+08:00', mainChannels: ['大咖-头条-头条btt', '大咖-头条-头条btoutiao'], subChannels: ['tt00zs01','tt00zs02','tt00zs03','tt00fx01','tt00fx02'], vis: 'private', authUsers: [] },
  { id: 't2',  label: '头条-iOS-付费',     color: 'green',   active: false, owner: '张三',   updatedAt: '2026-03-23T18:12:42+08:00', mainChannels: ['大咖-头条-头条btt_ios'], subChannels: ['tt01ios_pay01','tt01ios_pay02'], vis: 'private', authUsers: [] },
  { id: 't3',  label: '快手-全渠道',       color: 'orange',  active: false, owner: '李四',   updatedAt: '2026-03-22T09:08:31+08:00', mainChannels: ['大咖-快手-快手ksa'], subChannels: ['ks_all_01'], vis: 'public', authUsers: [] },
  { id: 't4',  label: '头条-安卓-注册',    color: 'purple',  active: false, owner: '张三',   updatedAt: '2026-03-21T21:33:07+08:00', mainChannels: ['大咖-头条-头条btt'], subChannels: ['tt00reg01','tt00reg02','tt00reg03','tt00reg04','tt00reg05','tt00reg_test01'], vis: 'partial', authUsers: ['敖子良','孙雅','钱文','胡波'] },
  { id: 't5',  label: '广点通-主推',       color: 'cyan',    active: false, owner: '王五',   updatedAt: '2026-03-20T14:41:55+08:00', mainChannels: ['大咖-广点通-广点通gdt01'], subChannels: ['gdt_main_a01','gdt_main_b02'], vis: 'partial', authUsers: ['张三','李四'] },
  { id: 't6',  label: '头条-全量投放',     color: 'red',     active: false, owner: '李四',   updatedAt: '2026-03-19T11:05:20+08:00', mainChannels: ['乐乐-头条-头条ltt01'], subChannels: ['tt_full_launch01'], vis: 'public', authUsers: [] },
  { id: 't7',  label: '快手-安卓-ROI',     color: 'magenta', active: false, owner: '张三',   updatedAt: '2026-03-18T16:28:09+08:00', mainChannels: ['大咖-快手-快手ksa','大咖-快手-快手ksb'], subChannels: ['ks_roi_and01','ks_roi_and02','ks_roi_and03','ks_roi_opt01'], vis: 'private', authUsers: [] },
  { id: 't8',  label: '头条+快手品牌',     color: 'gold',    active: false, owner: '王五',   updatedAt: '2026-03-17T08:56:43+08:00', mainChannels: ['乐乐-头条-头条ltt01','乐乐-快手-快手lks01'], subChannels: ['tt_brand_a01','tt_brand_b02','ks_brand_c01'], vis: 'public', authUsers: [] },
  { id: 't9',  label: '广点通-iOS-付费',   color: 'blue',    active: false, owner: '陈路遥', updatedAt: '2026-03-16T09:30:00+08:00', mainChannels: ['大咖-广点通-广点通gdt02'], subChannels: ['gdt_main_c01','gdt_ios_pay01'], vis: 'public', authUsers: [] },
  { id: 't10', label: '快手-iOS-激活',     color: 'green',   active: false, owner: '李四',   updatedAt: '2026-03-15T14:22:10+08:00', mainChannels: ['大咖-快手-快手ksc'], subChannels: ['ks_ios_act01','ks_ios_act02'], vis: 'public', authUsers: [] },
  { id: 't11', label: '微博-品牌投放',     color: 'orange',  active: false, owner: '王五',   updatedAt: '2026-03-14T11:05:33+08:00', mainChannels: ['大咖-微博-微博wb01'], subChannels: ['wb_fan_01','wb_kol_01'], vis: 'public', authUsers: [] },
  { id: 't12', label: '百度-SEM-激活',     color: 'purple',  active: false, owner: '张三',   updatedAt: '2026-03-13T16:48:22+08:00', mainChannels: ['鱼乐-百度-百度bd01'], subChannels: ['bd_sem_01','bd_sem_02'], vis: 'private', authUsers: [] },
  { id: 't13', label: '头条-鸿蒙-测试',   color: 'cyan',    active: false, owner: '赵云',   updatedAt: '2026-03-12T10:15:44+08:00', mainChannels: ['大咖-头条-头条btt'], subChannels: ['tt_hm_test01','tt_hm_test02'], vis: 'partial', authUsers: ['张三','李四'] },
  { id: 't14', label: '快手-ROI优化包',   color: 'red',     active: false, owner: '陈路遥', updatedAt: '2026-03-11T08:40:55+08:00', mainChannels: ['大咖-快手-快手ksd'], subChannels: ['ks_roi_opt01','ks_roi_opt02','ks_roi_opt03'], vis: 'public', authUsers: [] },
  { id: 't15', label: '头条-安卓-留存',   color: 'magenta', active: false, owner: '李四',   updatedAt: '2026-03-10T20:33:18+08:00', mainChannels: ['大咖-头条-头条btoutiao'], subChannels: ['tt_ret_and01','tt_ret_and02'], vis: 'public', authUsers: [] },
  { id: 't16', label: 'OPPO-全渠道',      color: 'gold',    active: false, owner: '王五',   updatedAt: '2026-03-09T13:27:09+08:00', mainChannels: ['鱼乐-OPPO-OPPO推送op01'], subChannels: ['op_push_01','op_push_02'], vis: 'public', authUsers: [] },
  { id: 't17', label: '华为-安卓-付费',   color: 'blue',    active: false, owner: '张三',   updatedAt: '2026-03-08T09:12:37+08:00', mainChannels: ['大咖-华为-华为广告hw01'], subChannels: ['hw_push_01'], vis: 'private', authUsers: [] },
  { id: 't18', label: '小米-激活-主包',   color: 'green',   active: false, owner: '赵云',   updatedAt: '2026-03-07T17:55:21+08:00', mainChannels: ['捕鱼-小米-小米广告mi01'], subChannels: ['mi_push_01'], vis: 'partial', authUsers: ['王五','张三'] },
  { id: 't19', label: 'vivo-付费-新包',   color: 'orange',  active: false, owner: '陈路遥', updatedAt: '2026-03-06T11:44:02+08:00', mainChannels: ['捕鱼-vivo-vivo广告vv01'], subChannels: ['vv_push_01'], vis: 'public', authUsers: [] },
  { id: 't20', label: '抖音-信息流-ROI',  color: 'purple',  active: false, owner: '李四',   updatedAt: '2026-03-05T14:08:59+08:00', mainChannels: ['大咖-抖音-抖音dy01','大咖-抖音-抖音dy02'], subChannels: ['dy_feed_01','dy_feed_02'], vis: 'public', authUsers: [] },
  { id: 't21', label: '抖音-开屏-激活',   color: 'cyan',    active: false, owner: '王五',   updatedAt: '2026-03-04T09:30:15+08:00', mainChannels: ['大咖-抖音-抖音dy03'], subChannels: ['dy_open_01','dy_open_02'], vis: 'public', authUsers: [] },
  { id: 't22', label: '头条-付费ROI包',   color: 'red',     active: false, owner: '张三',   updatedAt: '2026-03-03T16:20:44+08:00', mainChannels: ['大咖-头条-头条bttopic'], subChannels: ['tt_roi_pay01','tt_roi_pay02','tt_roi_pay03'], vis: 'private', authUsers: [] },
  { id: 't23', label: 'B站-安卓-激活',    color: 'magenta', active: false, owner: '赵云',   updatedAt: '2026-03-02T10:05:33+08:00', mainChannels: ['鱼乐-Bilibili-Bilibili_b01'], subChannels: ['bili_and_01','bili_and_02'], vis: 'partial', authUsers: ['陈路遥','王五','张三'] },
  { id: 't24', label: 'B站-iOS-付费',     color: 'gold',    active: false, owner: '李四',   updatedAt: '2026-03-01T18:45:12+08:00', mainChannels: ['鱼乐-Bilibili-Bilibili_b02'], subChannels: ['bili_ios_01'], vis: 'public', authUsers: [] },
  { id: 't25', label: '快手-鸿蒙-激活',   color: 'blue',    active: false, owner: '陈路遥', updatedAt: '2026-02-28T08:30:27+08:00', mainChannels: ['大咖-快手-快手ksb'], subChannels: ['ks_hm_act01','ks_hm_act02'], vis: 'public', authUsers: [] },
  { id: 't26', label: '头条-P盘-测试',    color: 'green',   active: false, owner: '张三',   updatedAt: '2026-02-27T15:22:08+08:00', mainChannels: ['大咖-头条-头条btpangle'], subChannels: ['tt_pangle_01','tt_pangle_02'], vis: 'partial', authUsers: ['李四'] },
  { id: 't27', label: '微博-KOL合作',     color: 'orange',  active: false, owner: '王五',   updatedAt: '2026-02-26T11:18:40+08:00', mainChannels: ['大咖-微博-微博wb02','大咖-微博-微博wb03'], subChannels: ['wb_kol_01','wb_fan_01','wb_fan_02'], vis: 'public', authUsers: [] },
  { id: 't28', label: '广点通-视频贴片',  color: 'purple',  active: false, owner: '赵云',   updatedAt: '2026-02-25T09:55:19+08:00', mainChannels: ['大咖-广点通-广点通gdt03'], subChannels: ['gdt_main_a01','gdt_main_a02'], vis: 'public', authUsers: [] },
  { id: 't29', label: '百度-信息流-注册', color: 'cyan',    active: false, owner: '陈路遥', updatedAt: '2026-02-24T14:42:36+08:00', mainChannels: ['鱼乐-百度-百度bd02','鱼乐-百度-百度bd03'], subChannels: ['bd_info_01','bd_info_02'], vis: 'public', authUsers: [] },
  { id: 't30', label: '知乎-品牌曝光',    color: 'red',     active: false, owner: '李四',   updatedAt: '2026-02-23T10:30:55+08:00', mainChannels: ['捕鱼-知乎-知乎zz01'], subChannels: ['zz_brand_01','zz_brand_02'], vis: 'public', authUsers: [] },
  { id: 't31', label: '头条-安卓-7日ROI', color: 'magenta', active: false, owner: '张三',   updatedAt: '2026-02-22T16:08:14+08:00', mainChannels: ['大咖-头条-头条btt'], subChannels: ['tt_7roi_a01','tt_7roi_a02','tt_7roi_b01'], vis: 'private', authUsers: [] },
  { id: 't32', label: '快手-全平台汇总',  color: 'gold',    active: false, owner: '王五',   updatedAt: '2026-02-21T08:15:30+08:00', mainChannels: ['大咖-快手-快手ksa','大咖-快手-快手ksb','大咖-快手-快手ksc','大咖-快手-快手ksd'], subChannels: ['ks_all_01','ks_all_02','ks_all_03'], vis: 'public', authUsers: [] },
  { id: 't33', label: '广点通-安卓-留存', color: 'blue',    active: false, owner: '赵云',   updatedAt: '2026-02-20T13:40:22+08:00', mainChannels: ['大咖-广点通-广点通gdt04'], subChannels: ['gdt_main_b01','gdt_main_b02'], vis: 'partial', authUsers: ['张三','陈路遥'] },
  { id: 't34', label: '头条+广点通联投',  color: 'green',   active: false, owner: '陈路遥', updatedAt: '2026-02-19T09:25:47+08:00', mainChannels: ['大咖-头条-头条btt','大咖-广点通-广点通gdt01'], subChannels: ['tt00zs01','gdt_main_a01'], vis: 'public', authUsers: [] },
  { id: 't35', label: '抖音-安卓-注册',   color: 'orange',  active: false, owner: '李四',   updatedAt: '2026-02-18T17:50:09+08:00', mainChannels: ['大咖-抖音-抖音dy01'], subChannels: ['dy_feed_01','dy_open_01'], vis: 'public', authUsers: [] },
  { id: 't36', label: '小米+OPPO联投',    color: 'purple',  active: false, owner: '王五',   updatedAt: '2026-02-17T11:33:58+08:00', mainChannels: ['捕鱼-小米-小米广告mi01','捕鱼-OPPO-OPPO推送op01'], subChannels: ['mi_push_01','op_push_01'], vis: 'partial', authUsers: ['赵云','张三'] },
  { id: 't37', label: '头条-iOS-7日留存', color: 'cyan',    active: false, owner: '张三',   updatedAt: '2026-02-16T08:45:13+08:00', mainChannels: ['大咖-头条-头条btoutiao'], subChannels: ['tt_7ret_ios01','tt_7ret_ios02'], vis: 'private', authUsers: [] },
  { id: 't38', label: '快手-付费-深度优化', color: 'red',   active: false, owner: '赵云',   updatedAt: '2026-02-15T15:18:42+08:00', mainChannels: ['大咖-快手-快手ksa'], subChannels: ['ks_deep_01','ks_deep_02','ks_deep_03'], vis: 'public', authUsers: [] },
  { id: 't39', label: '广点通-iOS-激活',  color: 'magenta', active: false, owner: '陈路遥', updatedAt: '2026-02-14T10:02:29+08:00', mainChannels: ['大咖-广点通-广点通gdt02'], subChannels: ['gdt_ios_act01','gdt_ios_act02'], vis: 'public', authUsers: [] },
  { id: 't40', label: '全渠道-安卓汇总',  color: 'gold',    active: false, owner: '李四',   updatedAt: '2026-02-13T14:37:55+08:00', mainChannels: ['大咖-头条-头条btt','大咖-快手-快手ksa','大咖-广点通-广点通gdt01'], subChannels: ['tt00zs01','ks_all_01','gdt_main_a01'], vis: 'public', authUsers: [] },
  { id: 't41', label: '西瓜视频-激活',    color: 'blue',    active: false, owner: '王五',   updatedAt: '2026-02-12T09:20:16+08:00', mainChannels: ['鱼乐-西瓜-西瓜视频xg01'], subChannels: ['xg_act_01','xg_act_02'], vis: 'public', authUsers: [] },
  { id: 't42', label: '头条-次日留存包',  color: 'green',   active: false, owner: '张三',   updatedAt: '2026-02-11T16:55:31+08:00', mainChannels: ['大咖-头条-头条btt'], subChannels: ['tt_d1ret_01','tt_d1ret_02'], vis: 'private', authUsers: [] },
  { id: 't43', label: '快手-iOS-ROI',     color: 'orange',  active: false, owner: '赵云',   updatedAt: '2026-02-10T11:10:48+08:00', mainChannels: ['大咖-快手-快手ksc'], subChannels: ['ks_ios_roi01','ks_ios_roi02'], vis: 'partial', authUsers: ['李四','王五','张三'] },
  { id: 't44', label: '百度+知乎联投',    color: 'purple',  active: false, owner: '陈路遥', updatedAt: '2026-02-09T08:33:27+08:00', mainChannels: ['鱼乐-百度-百度bd01','捕鱼-知乎-知乎zz01'], subChannels: ['bd_sem_01','zz_brand_01'], vis: 'public', authUsers: [] },
  { id: 't45', label: '广点通-30日ROI',   color: 'cyan',    active: false, owner: '李四',   updatedAt: '2026-02-08T15:45:03+08:00', mainChannels: ['大咖-广点通-广点通gdt01','大咖-广点通-广点通gdt02'], subChannels: ['gdt_main_a01','gdt_main_b01','gdt_main_c01'], vis: 'public', authUsers: [] },
  { id: 't46', label: '抖音-iOS-付费',    color: 'red',     active: false, owner: '王五',   updatedAt: '2026-02-07T10:28:44+08:00', mainChannels: ['大咖-抖音-抖音dy02'], subChannels: ['dy_feed_02','dy_open_02'], vis: 'public', authUsers: [] },
  { id: 't47', label: 'vivo+华为联投',    color: 'magenta', active: false, owner: '张三',   updatedAt: '2026-02-06T14:14:19+08:00', mainChannels: ['捕鱼-vivo-vivo广告vv01','大咖-华为-华为广告hw02'], subChannels: ['vv_push_01','hw_push_01'], vis: 'partial', authUsers: ['赵云','陈路遥'] },
  { id: 't48', label: '头条-LTV优化包',   color: 'gold',    active: false, owner: '赵云',   updatedAt: '2026-02-05T09:05:37+08:00', mainChannels: ['大咖-头条-头条btt','大咖-头条-头条btoutiao'], subChannels: ['tt_ltv_01','tt_ltv_02','tt_ltv_03'], vis: 'public', authUsers: [] },
  { id: 't49', label: '快手-品牌+效果',   color: 'blue',    active: false, owner: '李四',   updatedAt: '2026-02-04T17:38:52+08:00', mainChannels: ['大咖-快手-快手ksa','大咖-快手-快手ksb'], subChannels: ['ks_brand_c01','ks_feed_01','ks_feed_02'], vis: 'public', authUsers: [] },
  { id: 't50', label: '全媒体-年度大包',  color: 'green',   active: false, owner: '陈路遥', updatedAt: '2026-02-03T08:00:00+08:00', mainChannels: ['大咖-头条-头条btt','大咖-快手-快手ksa','大咖-广点通-广点通gdt01','大咖-微博-微博wb01','大咖-抖音-抖音dy01'], subChannels: ['tt00zs01','ks_all_01','gdt_main_a01','wb_fan_01','dy_feed_01'], vis: 'public', authUsers: [] },
];

// ── Scene 1: TagPermAlignDialog ─────────────────────────────
function TagPermAlignDialog({
  misalignedTags, shareMode, onAlign, onSaveAnyway, onCancel,
}: {
  misalignedTags: Array<{ tag: QuickTag; lackingUsers: string[] }>;
  shareMode: ShareMode;
  onAlign: () => void;
  onSaveAnyway: () => void;
  onCancel: () => void;
}) {
  const visLabel = (v: string) =>
    v === 'public' ? '公开' : v === 'partial' ? '指定用户' : '私有';
  const targetLabel = shareMode === 'public' ? '「公开」' : '「指定用户」';
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(0,0,0,0.36)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: F,
    }}>
      <div style={{
        width: 500, background: '#fff', borderRadius: 10,
        boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#222' }}>共享权限不一致</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
            以下快捷标签的权限范围小于视图的共享范围 {targetLabel}，受邀用户可能无法正常使用此视图
          </div>
        </div>
        <div style={{ padding: '16px 20px', overflowY: 'auto', maxHeight: 280 }}>
          {misalignedTags.map(({ tag, lackingUsers }) => (
            <div key={tag.id} style={{
              padding: '10px 12px', marginBottom: 8, borderRadius: 6,
              background: '#fff7e6', border: '1px solid #ffd591',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 500, fontSize: 13, color: '#333' }}>「{tag.label}」</span>
                <span style={{
                  fontSize: 11, padding: '1px 6px', borderRadius: 3,
                  background: '#f0f0f0', color: '#666',
                }}>
                  当前：{visLabel(tag.vis)}
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#874d00' }}>
                以下用户无权访问此标签：{lackingUsers.join('、')}
              </div>
            </div>
          ))}
        </div>
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 8,
          padding: '12px 20px', borderTop: '1px solid #f0f0f0',
        }}>
          <button onClick={onCancel} style={{
            padding: '5px 16px', border: '1px solid #d9d9d9', borderRadius: 4,
            background: '#fff', color: '#555', fontSize: 13, cursor: 'pointer', fontFamily: F,
          }}>取消</button>
          <button onClick={onSaveAnyway} style={{
            padding: '5px 16px', border: '1px solid #d9d9d9', borderRadius: 4,
            background: '#fff', color: '#333', fontSize: 13, cursor: 'pointer', fontFamily: F,
          }}>仍然保存</button>
          <button onClick={onAlign} style={{
            padding: '5px 16px', border: 'none', borderRadius: 4,
            background: '#1890ff', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: F,
          }}>对齐权限并保存</button>
        </div>
      </div>
    </div>
  );
}

// ── Scene 3: NoPermissionView ──────────────────────────────
function NoPermissionView({ missingTagsInfo }: { missingTagsInfo: TagInfo[] }) {
  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 16, padding: '40px 20px', fontFamily: F,
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: '#fff2f0', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Lock size={28} color="#ff4d4f" />
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#141414' }}>无法加载此视图</div>
      <div style={{ fontSize: 13, color: '#8c8c8c', textAlign: 'center', maxWidth: 380 }}>
        当前视图包含您无权访问的快捷标签。请联系标签所有者开放权限，或请视图创建者调整标签配置。
      </div>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {missingTagsInfo.map(t => (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', marginBottom: 8, borderRadius: 6,
            background: '#fff2f0', border: '1px solid #ffa39e',
          }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#cf1322' }}>「{t.label}」</span>
            <span style={{ fontSize: 12, color: '#999' }}>{t.owner}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  // View state
  const [views, setViews] = useState<ViewItem[]>(INITIAL_VIEWS);
  const [selectedView, setSelectedView] = useState<string | null>(null);
  const [activePinnedTag, setActivePinnedTag] = useState<string | null>(null);

  // Filter state
  const [activeFilters, setActiveFilters] = useState<string[]>(['game', 'os', 'mainChannel', 'optimizer']);
  const [dateStart, setDateStart] = useState('2026-02-01');
  const [dateEnd, setDateEnd] = useState('2026-02-28');
  const [filterSelections, setFilterSelections] = useState<Record<string, string[]>>({});
  const [priceRange, setPriceRange] = useState({ min: '', max: '', roiMin: '', roiMax: '' });

  // Quick tags
  const [quickTags, setQuickTags] = useState<QuickTag[]>(INITIAL_TAGS);
  const [showTagModal, setShowTagModal] = useState(false);
  const [channelLocked, setChannelLocked] = useState(false);

  // Sheets — each sheet has its own state
  const [sheets, setSheets] = useState<string[]>(INITIAL_SHEETS);
  const [activeSheet, setActiveSheet] = useState<string>('天-sheet1');
  const [sheetStates, setSheetStates] = useState<Record<string, SheetState>>(INITIAL_SHEET_STATES);

  // Local filters — temporary, cleared on sheet switch
  const [localFilters, setLocalFilters] = useState<LocalFilters>({});

  // Shared UI state
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [mergeView, setMergeView] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);

  // Export modal
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);

  // ── Permission system state ──────────────────────────────
  const [pageStatus, setPageStatus] = useState<PageStatus>({ type: 'OK' });
  const [pendingShareAction, setPendingShareAction] = useState<PendingShareAction | null>(null);

  const currentSheetState = sheetStates[activeSheet] || DEFAULT_SHEET_STATE;

  const updateSheetState = (patch: Partial<SheetState>) => {
    setSheetStates(prev => ({
      ...prev,
      [activeSheet]: { ...(prev[activeSheet] || DEFAULT_SHEET_STATE), ...patch },
    }));
  };

  // Apply non-time dims as the custom part of the active sheet name
  const handleApplyDimsToName = (dims: string[]) => {
    const dimsCustom = dims.filter(d => d !== 'time').map(d => LABEL_MAP[d] ?? d).join('-');
    const gran = currentSheetState.timeGranularity;
    const newName = buildFullName(gran, dimsCustom);
    handleRenameSheet(activeSheet, newName);
  };

  // When granularity changes, auto-update the sheet name prefix
  const handleChangeGranularity = (g: 'day' | 'week' | 'month' | 'total') => {
    const oldName = activeSheet;
    const customPart = getCustomPart(oldName);
    const newBase = buildFullName(g, customPart);
    if (newBase === oldName) { updateSheetState({ timeGranularity: g }); return; }
    const newName = newBase.slice(0, 31);
    setSheets(prev => prev.map(s => s === oldName ? newName : s));
    setSheetStates(prev => {
      const state = prev[oldName] || DEFAULT_SHEET_STATE;
      const { [oldName]: _, ...rest } = prev;
      return { ...rest, [newName]: { ...state, timeGranularity: g } };
    });
    setActiveSheet(newName);
  };

  // ── handlers ─────────────────────────────────────────────────
  const pinnedViews = views.filter(v => v.pinned).map(v => v.name);

  const handleTogglePin = (id: string) =>
    setViews(prev => prev.map(v => v.id === id ? { ...v, pinned: !v.pinned } : v));

  const handleSaveNew = (name: string) => {
    // Capture currently active tag IDs when saving
    const tagIds = quickTags.filter(t => t.active).map(t => t.id);
    setViews(prev => [...prev, {
      id: String(Date.now()), name, type: 'mine', pinned: false,
      tag_ids: tagIds.length > 0 ? tagIds : undefined,
    }]);
    setSelectedView(name);
  };

  // ── Scene 3: Load view → check tag permissions ────────────
  const handleSelectView = (name: string) => {
    const view = views.find(v => v.name === name);
    if (view?.tag_ids && view.tag_ids.length > 0) {
      const missingTags: TagInfo[] = [];
      for (const tagId of view.tag_ids) {
        const tag = quickTags.find(t => t.id === tagId);
        if (tag && !canUserAccessTag(CURRENT_USER, tag)) {
          missingTags.push({ id: tag.id, label: tag.label, owner: tag.owner, vis: tag.vis });
        }
      }
      if (missingTags.length > 0) {
        // Hard block: show NO_PERMISSION empty state
        setPageStatus({ type: 'NO_PERMISSION', missingTagsInfo: missingTags });
        setSelectedView(name);
        setActivePinnedTag(null);
        // Don't activate any tags
        return;
      }
      // All accessible: activate the view's tags
      setQuickTags(prev => prev.map(t => ({
        ...t,
        active: (view.tag_ids ?? []).includes(t.id),
      })));
      const willBeActive = view.tag_ids.length > 0;
      if (willBeActive && !channelLocked) setChannelLocked(true);
      else if (!willBeActive && channelLocked) setChannelLocked(false);
    } else {
      // View has no tags: deactivate all tags
      setQuickTags(prev => prev.map(t => ({ ...t, active: false })));
      if (channelLocked) {
        setChannelLocked(false);
        toast('主/子渠道筛选恢复生效');
      }
    }
    setPageStatus({ type: 'OK' });
    setSelectedView(name);
    setActivePinnedTag(null);
    setActiveSheet(sheets[0]);
  };

  const handleClickPinnedTag = (name: string) => {
    if (activePinnedTag === name) setActivePinnedTag(null);
    else { setActivePinnedTag(name); handleSelectView(name); }
  };

  // ── Scene 1: Share view → check tag alignment ─────────────
  const handleShareView = (id: string, shareMode: ShareMode, sharedWith: string[]) => {
    if (shareMode === 'private') {
      setViews(prev => prev.map(v => v.id === id ? { ...v, shareMode, sharedWith: [] } : v));
      return;
    }

    const view = views.find(v => v.id === id);
    if (!view?.tag_ids || view.tag_ids.length === 0) {
      setViews(prev => prev.map(v => v.id === id ? { ...v, shareMode, sharedWith } : v));
      return;
    }

    // Check tag accessibility for all authorized users
    const misaligned: Array<{ tag: QuickTag; lackingUsers: string[] }> = [];
    for (const tagId of view.tag_ids) {
      const tag = quickTags.find(t => t.id === tagId);
      if (!tag) continue;
      if (tag.vis === 'public') continue; // always accessible

      if (shareMode === 'public') {
        // Tag is not public but view is being shared publicly
        misaligned.push({ tag, lackingUsers: ['（所有用户）'] });
      } else {
        // 'specific': check each sharedWith user
        const userNames = sharedWith.map(uid => SHARE_USER_NAMES[uid] ?? uid);
        const lacking = userNames.filter(uName => !canUserAccessTag(uName, tag));
        if (lacking.length > 0) {
          misaligned.push({ tag, lackingUsers: lacking });
        }
      }
    }

    if (misaligned.length > 0) {
      // Show alignment dialog instead of saving directly
      setPendingShareAction({ viewId: id, shareMode, sharedWith, misalignedTags: misaligned });
      return;
    }

    setViews(prev => prev.map(v => v.id === id ? { ...v, shareMode, sharedWith } : v));
  };

  const handleAlignAndShare = () => {
    if (!pendingShareAction) return;
    const { viewId, shareMode, sharedWith, misalignedTags } = pendingShareAction;
    const userNames = sharedWith.map(uid => SHARE_USER_NAMES[uid] ?? uid);

    // Expand tag permissions to cover the view's audience
    setQuickTags(prev => prev.map(t => {
      const m = misalignedTags.find(x => x.tag.id === t.id);
      if (!m) return t;
      if (shareMode === 'public') {
        return { ...t, vis: 'public' as const, authUsers: [] };
      } else {
        // Expand partial: add lacking users to authUsers
        const newAuth = [...t.authUsers, ...userNames.filter(u => !t.authUsers.includes(u))];
        return { ...t, vis: 'partial' as const, authUsers: newAuth };
      }
    }));

    setViews(prev => prev.map(v => v.id === viewId ? { ...v, shareMode, sharedWith } : v));
    setPendingShareAction(null);
    toast('已对齐标签权限并保存共享设置');
  };

  const handleShareAnyway = () => {
    if (!pendingShareAction) return;
    const { viewId, shareMode, sharedWith } = pendingShareAction;
    setViews(prev => prev.map(v => v.id === viewId ? { ...v, shareMode, sharedWith } : v));
    setPendingShareAction(null);
  };

  // Sheet operations
  const handleAddSheet = () => {
    const defaultGran: 'day' | 'week' | 'month' = 'day';
    let n = sheets.length + 1;
    let newName = buildFullName(defaultGran, `sheet${n}`);
    while (sheets.includes(newName)) { n++; newName = buildFullName(defaultGran, `sheet${n}`); }
    setSheets(prev => [...prev, newName]);
    setSheetStates(prev => ({ ...prev, [newName]: { ...NEW_SHEET_STATE, timeGranularity: defaultGran } }));
    setActiveSheet(newName);
  };

  const handleRenameSheet = (oldName: string, newName: string) => {
    if (!newName) return;
    const truncated = newName.slice(0, 31);
    if (truncated === oldName) return;
    setSheets(prev => prev.map(s => s === oldName ? truncated : s));
    setSheetStates(prev => {
      const next = { ...prev, [truncated]: prev[oldName] || DEFAULT_SHEET_STATE };
      delete next[oldName];
      return next;
    });
    if (activeSheet === oldName) setActiveSheet(truncated);
  };

  const handleDeleteSheet = (name: string) => {
    if (sheets.length <= 1) return;
    const next = sheets.filter(s => s !== name);
    setSheets(next);
    if (activeSheet === name) setActiveSheet(next[0]);
  };

  const handleCopySheet = (name: string) => {
    const gran = (sheetStates[name] || DEFAULT_SHEET_STATE).timeGranularity;
    const customPart = getCustomPart(name);
    let copyCustom = `${customPart}_副本`;
    let copyName = buildFullName(gran, copyCustom).slice(0, 31);
    let i = 1;
    while (sheets.includes(copyName)) {
      copyCustom = `${customPart}_副本${i}`;
      copyName = buildFullName(gran, copyCustom).slice(0, 31);
      i++;
    }
    const idx = sheets.indexOf(name);
    const next = [...sheets];
    next.splice(idx + 1, 0, copyName);
    setSheets(next);
    setSheetStates(prev => ({ ...prev, [copyName]: { ...(prev[name] || DEFAULT_SHEET_STATE) } }));
  };

  const handleSelectSheet = (name: string) => {
    setActiveSheet(name);
    setLocalFilters({});  // clear on sheet switch
  };

  // ── Filter combination handlers ───────────────────────────────
  const handleSaveFilter = (combo: FilterCombination) => {
    updateSheetState({
      filterCombinations: currentSheetState.filterCombinations.some(c => c.id === combo.id)
        ? currentSheetState.filterCombinations.map(c => c.id === combo.id ? combo : c)
        : [...currentSheetState.filterCombinations, combo],
    });
  };

  const handleDeleteFilter = (id: string) => {
    updateSheetState({
      filterCombinations: currentSheetState.filterCombinations.filter(c => c.id !== id),
      activeFilterId: currentSheetState.activeFilterId === id ? null : currentSheetState.activeFilterId,
    });
  };

  return (
    <ConfigProvider theme={{ token: { borderRadius: 6, borderRadiusSM: 6, borderRadiusLG: 6, fontSize: 13 } }}>
    <div style={{
      width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column',
      fontFamily: F, fontSize: 13, color: '#141414', background: '#fff', overflow: 'hidden',
    }}>
      <Toaster position="top-center" duration={1000} expand={true} gap={8} toastOptions={{ style: { background: 'rgba(0,0,0,0.75)', color: '#fff', borderRadius: 6, padding: '8px 16px', fontSize: 13, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', textAlign: 'center', width: 'fit-content', margin: '0 auto' } }} />
      <TopNav />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Sidebar />

        {/* ── 右侧主内容区：浅灰底色 + 白色卡片分区 ── */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
          background: '#f2f3f5',
          padding: 0, gap: 0,
        }}>

          {/* ── 卡片①：视图栏 — 吸顶，左右上无灰色边距 ── */}
          <div style={{
            background: '#fff',
            flexShrink: 0, overflow: 'visible',
            position: 'sticky', top: 0, zIndex: 10,
            borderBottom: '1px solid #f0f1f3',
          }}>
            <ViewBar
              views={views}
              selectedView={selectedView}
              onSelectView={handleSelectView}
              onTogglePin={handleTogglePin}
              onSaveNew={handleSaveNew}
              pinnedViews={pinnedViews}
              activePinnedTag={activePinnedTag}
              onClickPinnedTag={handleClickPinnedTag}
              onShareView={handleShareView}
            />
          </div>

          {/* ── 内容区：有内边距 ── */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 12, gap: 12 }}>

            {/* ── 卡片②：筛选区（筛选栏 + 快捷标签） ── */}
            <div style={{
              background: '#fff', borderRadius: 8,
              flexShrink: 0, overflow: 'visible',
            }}>
              <FilterBar
                activeFilters={activeFilters}
                onToggleFilter={key => setActiveFilters(prev =>
                  prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])}
                dateStart={dateStart}
                dateEnd={dateEnd}
                onDateChange={(s, e) => { setDateStart(s); setDateEnd(e); }}
                filterSelections={filterSelections}
                onFilterSelect={(key, sel) => setFilterSelections(prev => ({ ...prev, [key]: sel }))}
                priceRange={priceRange}
                onPriceRangeChange={(min, max, roiMin, roiMax) => setPriceRange({ min, max, roiMin, roiMax })}
                channelLocked={channelLocked}
                onChannelLockedClick={() => toast('快捷标签选中时，主/子渠道筛选不可用')}
              />
              <QuickTagBar
                tags={quickTags}
                onToggleTag={id => {
                  const prev = quickTags;
                  const next = prev.map(t => t.id === id ? { ...t, active: !t.active } : t);
                  const wasAnyActive = prev.some(t => t.active);
                  const isAnyActive = next.some(t => t.active);
                  const hasChannelFilter = (filterSelections['mainChannel']?.length > 0) || (filterSelections['subChannel']?.length > 0);

                  if (!wasAnyActive && isAnyActive) {
                    if (hasChannelFilter) toast('快捷标签选中，主/子渠道筛选暂时失效');
                    setChannelLocked(true);
                  }
                  if (wasAnyActive && !isAnyActive && channelLocked) {
                    toast('主/子渠道筛选恢复生效');
                    setChannelLocked(false);
                  }
                  if (wasAnyActive && isAnyActive && !channelLocked) {
                    if (hasChannelFilter) toast('快捷标签选中，主/子渠道筛选暂时失效');
                    setChannelLocked(true);
                  }

                  setQuickTags(next);
                }}
                onManage={() => setShowTagModal(true)}
                onReorderTags={setQuickTags}
              />
            </div>

            {/* ── 卡片③：数据区（Sheet标签 + 工具栏 + 表格 + 分页） ── */}
            <div style={{
              background: '#fff', borderRadius: 8,
              flex: 1, overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
            }}>
              <SheetTabBar
                sheets={sheets}
                activeSheet={activeSheet}
                sheetGranularities={Object.fromEntries(
                  sheets.map(s => [s, (sheetStates[s] || DEFAULT_SHEET_STATE).timeGranularity])
                )}
                onSelectSheet={handleSelectSheet}
                onRenameSheet={handleRenameSheet}
                onDeleteSheet={handleDeleteSheet}
                onCopySheet={handleCopySheet}
                onAddSheet={handleAddSheet}
                onReorderSheets={setSheets}
              />

              <TableToolBar
                timeGranularity={currentSheetState.timeGranularity}
                onChangeGranularity={handleChangeGranularity}
                activeDims={currentSheetState.pendingDims}
                onChangeDims={dims => {
                  const prev = currentSheetState.pendingDims;
                  const isReorder = dims.length === prev.length &&
                    [...dims].sort().join() === [...prev].sort().join();
                  // Reorder-only: immediately reflect in table; add/remove: pending only
                  updateSheetState(isReorder
                    ? { pendingDims: dims, activeDims: dims }
                    : { pendingDims: dims });
                }}
                onApplyDimsToName={handleApplyDimsToName}
                viewMode={viewMode}
                onChangeViewMode={setViewMode}
                mergeView={mergeView}
                onChangeMergeView={setMergeView}
                onQuery={() => {
                  const dims = currentSheetState.pendingDims;
                  updateSheetState({ activeDims: dims, hasData: dims.length > 0 });
                }}
                onExport={() => setIsExportModalVisible(true)}
                filterCombinations={currentSheetState.filterCombinations}
                activeFilterId={currentSheetState.activeFilterId}
                onSelectFilter={id => updateSheetState({ activeFilterId: id })}
                onSaveFilter={handleSaveFilter}
                onDeleteFilter={handleDeleteFilter}
                localFilters={localFilters}
                onChangeLocalFilters={setLocalFilters}
                dimAutoUpdate={currentSheetState.dimAutoUpdate ?? false}
                onChangeDimAutoUpdate={v => updateSheetState({ dimAutoUpdate: v })}
              />

              {/* ── Scene 3: NO_PERMISSION empty state ── */}
              {pageStatus.type === 'NO_PERMISSION' ? (
                <NoPermissionView missingTagsInfo={pageStatus.missingTagsInfo} />
              ) : (
                <>
                  <DataTable
                    activeDims={currentSheetState.activeDims}
                    hasData={currentSheetState.hasData}
                    mergeView={mergeView}
                    timeGranularity={currentSheetState.timeGranularity}
                    activeFilter={
                      currentSheetState.activeFilterId
                        ? currentSheetState.filterCombinations.find(c => c.id === currentSheetState.activeFilterId) ?? null
                        : null
                    }
                  />

                  <Pagination
                    total={currentSheetState.hasData ? 1247701 : 0}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={ps => { setPageSize(ps); setPage(1); }}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick tag modal (with views for Scene 2 & 4) */}
      {showTagModal && (
        <QuickTagModal
          tags={quickTags}
          views={views}
          onSave={tags => setQuickTags(tags)}
          onClose={() => setShowTagModal(false)}
        />
      )}

      <ExportModal
        key={isExportModalVisible ? activeSheet : '__closed__'}
        open={isExportModalVisible}
        onClose={() => setIsExportModalVisible(false)}
        sheets={sheets}
        activeSheet={activeSheet}
        dateStart={dateStart}
        dateEnd={dateEnd}
        activeFilters={activeFilters}
        filterSelections={filterSelections}
        priceRange={priceRange}
      />

      {/* ── Scene 1: Tag permission alignment dialog ── */}
      {pendingShareAction && (
        <TagPermAlignDialog
          misalignedTags={pendingShareAction.misalignedTags}
          shareMode={pendingShareAction.shareMode}
          onAlign={handleAlignAndShare}
          onSaveAnyway={handleShareAnyway}
          onCancel={() => setPendingShareAction(null)}
        />
      )}
    </div>
    </ConfigProvider>
  );
}

import React, { useState } from 'react';
import { Toaster, toast } from 'sonner';
import { TopNav } from './components/TopNav';
import { Sidebar } from './components/Sidebar';
import { ViewBar } from './components/ViewBar';
import { FilterBar } from './components/FilterBar';
import { QuickTagBar } from './components/QuickTagBar';
import type { QuickTag } from './components/QuickTagBar';
import { QuickTagModal } from './components/QuickTagModal';
import { SheetTabBar } from './components/SheetTabBar';
import { TableToolBar } from './components/TableToolBar';
import { DataTable } from './components/DataTable';
import { Pagination } from './components/Pagination';
import type { ViewItem } from './components/ViewSelectorDropdown';
import type { FilterCombination } from './components/MetricFilterPopover';
import type { LocalFilters } from './components/LocalFilterPopover';
import type { ShareMode } from './components/ShareViewModal';

const F = "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif";

// ── Per-sheet state ──────────────────────────────────────────
interface SheetState {
  timeGranularity: 'day' | 'week' | 'month';
  activeDims: string[];
  hasData: boolean;
  filterCombinations: FilterCombination[];
  activeFilterId: string | null;
}

const DEFAULT_SHEET_STATE: SheetState = {
  timeGranularity: 'day',
  activeDims: ['time', 'media', 'optimizer'],
  hasData: true,
  filterCombinations: [],
  activeFilterId: null,
};

const NEW_SHEET_STATE: SheetState = {
  timeGranularity: 'day',
  activeDims: [],
  hasData: false,
  filterCombinations: [],
  activeFilterId: null,
};

const INITIAL_SHEETS = ['sheet1', 'sheet2', 'sheet3', 'sheet4'];

const INITIAL_SHEET_STATES: Record<string, SheetState> = {
  sheet1: { timeGranularity: 'day',   activeDims: ['time', 'media', 'optimizer'], hasData: true, filterCombinations: [], activeFilterId: null },
  sheet2: { timeGranularity: 'week',  activeDims: ['time', 'media'],              hasData: true, filterCombinations: [], activeFilterId: null },
  sheet3: { timeGranularity: 'month', activeDims: ['time', 'game', 'optimizer'],  hasData: true, filterCombinations: [], activeFilterId: null },
  sheet4: { timeGranularity: 'day',   activeDims: ['time'],                       hasData: true, filterCombinations: [], activeFilterId: null },
};

const INITIAL_VIEWS: ViewItem[] = [
  { id: '1', name: '乐乐·周报',          type: 'mine',   pinned: true  },
  { id: '2', name: '大盘·周投',          type: 'mine',   pinned: true  },
  { id: '3', name: '大盘·月报',          type: 'mine',   pinned: true  },
  { id: '4', name: '归因GAP',            type: 'mine',   pinned: false },
  { id: '5', name: '腾讯主包GAP',        type: 'mine',   pinned: false },
  { id: '6', name: '捕鱼大咖iOS当天数据', type: 'shared', owner: '陈路遥', pinned: false },
  { id: '7', name: '异常监控视图',       type: 'shared', owner: '陈路遥', pinned: false },
  { id: '8', name: '市场大盘',           type: 'public', pinned: false },
  { id: '9', name: '渠道大盘',           type: 'public', pinned: false },
];

const INITIAL_TAGS: QuickTag[] = [
  { id: 't1', label: '头条-安卓-激活', color: 'blue', active: false, owner: '张三',
    updatedAt: '2026-03-24T10:20:15+08:00',
    mainChannels: ['大咖-头条-头条btt', '大咖-头条-头条btoutiao'],
    subChannels: ['tt00zs01', 'tt00zs02', 'tt00zs03', 'tt00fx01', 'tt00fx02'],
    vis: 'private', authUsers: [] },
    { id: 't2', label: '头条-iOS-付费', color: 'green', active: false, owner: '张三',
    updatedAt: '2026-03-23T18:12:42+08:00',
    mainChannels: ['大咖-头条-头条btt_ios'],
    subChannels: ['tt01ios_pay01', 'tt01ios_pay02'],
    vis: 'private', authUsers: [] },
  { id: 't3', label: '快手-全渠道', color: 'orange', active: false, owner: '李四',
    updatedAt: '2026-03-22T09:08:31+08:00',
    mainChannels: ['大咖-快手-快手ksa'],
    subChannels: ['ks_all_01'],
    vis: 'public', authUsers: [] },
  { id: 't4', label: '头条-安卓-注册', color: 'purple', active: false, owner: '张三',
    updatedAt: '2026-03-21T21:33:07+08:00',
    mainChannels: ['大咖-头条-头条btt'],
    subChannels: ['tt00reg01', 'tt00reg02', 'tt00reg03', 'tt00reg04', 'tt00reg05', 'tt00reg_test01'],
    vis: 'partial', authUsers: ['敖子良', '孙雅', '钱文', '胡波'] },
  { id: 't5', label: '广点通-主推', color: 'cyan', active: false, owner: '王五',
    updatedAt: '2026-03-20T14:41:55+08:00',
    mainChannels: ['大咖-广点通-广点通gdt01'],
    subChannels: ['gdt_main_a01', 'gdt_main_b02'],
    vis: 'partial', authUsers: [] },
  { id: 't6', label: '头条-全量投放', color: 'red', active: false, owner: '李四',
    updatedAt: '2026-03-19T11:05:20+08:00',
    mainChannels: ['乐乐-头条-头条ltt01'],
    subChannels: ['tt_full_launch01'],
    vis: 'public', authUsers: [] },
  { id: 't7', label: '快手-安卓-ROI', color: 'magenta', active: false, owner: '张三',
    updatedAt: '2026-03-18T16:28:09+08:00',
    mainChannels: ['大咖-快手-快手ksa', '大咖-快手-快手ksb'],
    subChannels: ['ks_roi_and01', 'ks_roi_and02', 'ks_roi_and03', 'ks_roi_opt01'],
    vis: 'private', authUsers: [] },
  { id: 't8', label: '头条+快手品牌', color: 'gold', active: false, owner: '王五',
    updatedAt: '2026-03-17T08:56:43+08:00',
    mainChannels: ['乐乐-头条-头条ltt01', '乐乐-快手-快手lks01'],
    subChannels: ['tt_brand_a01', 'tt_brand_b02', 'ks_brand_c01'],
    vis: 'public', authUsers: [] },
];

export default function App() {
  // View state
  const [views, setViews] = useState<ViewItem[]>(INITIAL_VIEWS);
  const [selectedView, setSelectedView] = useState<string | null>(null);
  const [activePinnedTag, setActivePinnedTag] = useState<string | null>(null);

  // Filter state
  const [activeFilters, setActiveFilters] = useState<string[]>(['game', 'optimizer', 'mainChannel', 'subChannel']);
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
  const [activeSheet, setActiveSheet] = useState<string>('sheet1');
  const [sheetStates, setSheetStates] = useState<Record<string, SheetState>>(INITIAL_SHEET_STATES);

  // Local filters — temporary, cleared on sheet switch
  const [localFilters, setLocalFilters] = useState<LocalFilters>({});

  // Shared UI state
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [mergeView, setMergeView] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);

  const currentSheetState = sheetStates[activeSheet] || DEFAULT_SHEET_STATE;

  const updateSheetState = (patch: Partial<SheetState>) => {
    setSheetStates(prev => ({
      ...prev,
      [activeSheet]: { ...(prev[activeSheet] || DEFAULT_SHEET_STATE), ...patch },
    }));
  };

  // ── handlers ─────────────────────────────────────────────────
  const pinnedViews = views.filter(v => v.pinned).map(v => v.name);

  const handleTogglePin = (id: string) =>
    setViews(prev => prev.map(v => v.id === id ? { ...v, pinned: !v.pinned } : v));

  const handleSaveNew = (name: string) => {
    setViews(prev => [...prev, { id: String(Date.now()), name, type: 'mine', pinned: false }]);
    setSelectedView(name);
  };

  const handleSelectView = (name: string) => { setSelectedView(name); setActivePinnedTag(null); };
  const handleClickPinnedTag = (name: string) => {
    if (activePinnedTag === name) setActivePinnedTag(null);
    else { setActivePinnedTag(name); setSelectedView(name); }
  };

  const handleShareView = (id: string, shareMode: ShareMode, sharedWith: string[]) => {
    setViews(prev => prev.map(v =>
      v.id === id ? { ...v, shareMode, sharedWith } : v
    ));
  };

  // Sheet operations
  const handleAddSheet = () => {
    let n = sheets.length + 1;
    let newName = `sheet${n}`;
    while (sheets.includes(newName)) { n++; newName = `sheet${n}`; }
    setSheets(prev => [...prev, newName]);
    setSheetStates(prev => ({ ...prev, [newName]: { ...NEW_SHEET_STATE } }));
    setActiveSheet(newName);
  };

  const handleRenameSheet = (oldName: string, newName: string) => {
    if (!newName || sheets.includes(newName)) return;
    setSheets(prev => prev.map(s => s === oldName ? newName : s));
    setSheetStates(prev => {
      const next = { ...prev, [newName]: prev[oldName] || DEFAULT_SHEET_STATE };
      delete next[oldName];
      return next;
    });
    if (activeSheet === oldName) setActiveSheet(newName);
  };

  const handleDeleteSheet = (name: string) => {
    if (sheets.length <= 1) return;
    const next = sheets.filter(s => s !== name);
    setSheets(next);
    if (activeSheet === name) setActiveSheet(next[0]);
  };

  const handleCopySheet = (name: string) => {
    let copyName = `${name}_副本`;
    let i = 1;
    while (sheets.includes(copyName)) copyName = `${name}_副本${++i}`;
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
    <div style={{
      width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column',
      fontFamily: F, fontSize: 13, color: '#1f2329', background: '#fff', overflow: 'hidden',
    }}>
      <Toaster position="top-center" duration={2000} expand={true} gap={8} toastOptions={{ style: { background: 'rgba(0,0,0,0.75)', color: '#fff', borderRadius: 6, padding: '8px 16px', fontSize: 13, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', textAlign: 'center', width: 'fit-content', margin: '0 auto' } }} />
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
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 8, gap: 8 }}>

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
                onSelectSheet={handleSelectSheet}
                onRenameSheet={handleRenameSheet}
                onDeleteSheet={handleDeleteSheet}
                onCopySheet={handleCopySheet}
                onAddSheet={handleAddSheet}
                onReorderSheets={setSheets}
              />

              <TableToolBar
                timeGranularity={currentSheetState.timeGranularity}
                onChangeGranularity={g => updateSheetState({ timeGranularity: g })}
                activeDims={currentSheetState.activeDims}
                onChangeDims={dims => updateSheetState({ activeDims: dims })}
                viewMode={viewMode}
                onChangeViewMode={setViewMode}
                mergeView={mergeView}
                onChangeMergeView={setMergeView}
                onQuery={() => {
                  if (currentSheetState.activeDims.length > 0) updateSheetState({ hasData: true });
                }}
                onExport={() => {}}
                filterCombinations={currentSheetState.filterCombinations}
                activeFilterId={currentSheetState.activeFilterId}
                onSelectFilter={id => updateSheetState({ activeFilterId: id })}
                onSaveFilter={handleSaveFilter}
                onDeleteFilter={handleDeleteFilter}
                localFilters={localFilters}
                onChangeLocalFilters={setLocalFilters}
              />

              <DataTable
                activeDims={currentSheetState.activeDims}
                hasData={currentSheetState.hasData}
                mergeView={mergeView}
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
            </div>
          </div>
        </div>
      </div>

      {/* Quick tag modal */}
      {showTagModal && (
        <QuickTagModal
          tags={quickTags}
          onSave={tags => setQuickTags(tags)}
          onClose={() => setShowTagModal(false)}
        />
      )}
    </div>
  );
}
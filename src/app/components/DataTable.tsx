import React, { useState, useEffect, useRef } from 'react';
import { Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Inbox, ChevronDown, ArrowDown, ArrowUp, PanelLeft, ChevronRight } from 'lucide-react';
import type { FilterCombination } from './MetricFilterPopover';

const F = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

type Row = {
  id: string;
  date: string; media: string; optimizer: string; game: string;
  channel: string; os: string; region: string; adtype: string;
  spend: number; newDevices: number; newDeviceCost: number;
  newPaidUsers: number; newPaidCost: number;
  ltv1: number; ltv3: number; ltv7: number; ltv15: number; ltv30: number; ltv60: number;
  roi1: number; roi2: number; roi3: number; roi7: number; roi15: number; roi30: number; roi60: number;
};

const DATA: Row[] = [
  { id: '1', date: '2026-02-01', media: '腾讯', optimizer: '张磊',  game: '鱼乐', channel: '品牌', os: 'Android', region: '华东', adtype: '图文',   spend: 52341, newDevices: 8234, newDeviceCost: 6.35, newPaidUsers: 412, newPaidCost: 127.0, ltv1: 0.12, ltv3: 0.35, ltv7: 0.89, ltv15: 1.24, ltv30: 1.56, ltv60: 2.14, roi1: 0.08, roi2: 0.14, roi3: 0.22, roi7: 0.62, roi15: 0.86, roi30: 1.09, roi60: 1.49 },
  { id: '2', date: '2026-02-01', media: '字节', optimizer: '李明',  game: '大咖', channel: '效果', os: 'iOS',     region: '华南', adtype: '视频',   spend: 38920, newDevices: 6120, newDeviceCost: 6.36, newPaidUsers: 310, newPaidCost: 125.5, ltv1: 0.11, ltv3: 0.32, ltv7: 0.84, ltv15: 1.18, ltv30: 1.51, ltv60: 2.08, roi1: 0.07, roi2: 0.13, roi3: 0.21, roi7: 0.60, roi15: 0.83, roi30: 1.06, roi60: 1.43 },
  { id: '3', date: '2026-02-01', media: '腾讯', optimizer: '王芳',  game: '鱼乐', channel: '品牌', os: 'Android', region: '华北', adtype: '图文',   spend: 29150, newDevices: 4580, newDeviceCost: 6.36, newPaidUsers: 228, newPaidCost: 127.9, ltv1: 0.13, ltv3: 0.37, ltv7: 0.91, ltv15: 1.28, ltv30: 1.59, ltv60: 2.19, roi1: 0.09, roi2: 0.15, roi3: 0.23, roi7: 0.63, roi15: 0.88, roi30: 1.11, roi60: 1.52 },
  { id: '4', date: '2026-02-01', media: '字节', optimizer: '陈刚',  game: '大咖', channel: '效果', os: 'iOS',     region: '西南', adtype: '开屏',   spend: 45670, newDevices: 7230, newDeviceCost: 6.32, newPaidUsers: 368, newPaidCost: 124.1, ltv1: 0.10, ltv3: 0.30, ltv7: 0.82, ltv15: 1.15, ltv30: 1.48, ltv60: 2.03, roi1: 0.07, roi2: 0.12, roi3: 0.20, roi7: 0.58, roi15: 0.81, roi30: 1.04, roi60: 1.40 },
  { id: '5', date: '2026-02-02', media: '腾讯', optimizer: '张磊',  game: '鱼乐', channel: '品牌', os: 'Android', region: '华东', adtype: '视频',   spend: 48920, newDevices: 7840, newDeviceCost: 6.24, newPaidUsers: 398, newPaidCost: 122.9, ltv1: 0.14, ltv3: 0.38, ltv7: 0.93, ltv15: 1.30, ltv30: 1.62, ltv60: 2.22, roi1: 0.09, roi2: 0.16, roi3: 0.24, roi7: 0.65, roi15: 0.90, roi30: 1.13, roi60: 1.54 },
  { id: '6', date: '2026-02-02', media: '字节', optimizer: '李明',  game: '大咖', channel: '效果', os: 'iOS',     region: '华南', adtype: '信息流', spend: 35680, newDevices: 5620, newDeviceCost: 6.35, newPaidUsers: 283, newPaidCost: 126.1, ltv1: 0.11, ltv3: 0.33, ltv7: 0.86, ltv15: 1.20, ltv30: 1.53, ltv60: 2.10, roi1: 0.08, roi2: 0.13, roi3: 0.21, roi7: 0.61, roi15: 0.84, roi30: 1.07, roi60: 1.44 },
  { id: '7', date: '2026-02-02', media: '腾讯', optimizer: '王芳',  game: '鱼乐', channel: '品牌', os: 'Android', region: '华北', adtype: '图文',   spend: 31240, newDevices: 4920, newDeviceCost: 6.35, newPaidUsers: 247, newPaidCost: 126.5, ltv1: 0.12, ltv3: 0.36, ltv7: 0.90, ltv15: 1.26, ltv30: 1.57, ltv60: 2.16, roi1: 0.08, roi2: 0.14, roi3: 0.22, roi7: 0.62, roi15: 0.87, roi30: 1.10, roi60: 1.50 },
  { id: '8', date: '2026-02-02', media: '字节', optimizer: '陈刚',  game: '大咖', channel: '效果', os: 'iOS',     region: '西南', adtype: '开屏',   spend: 42310, newDevices: 6680, newDeviceCost: 6.33, newPaidUsers: 340, newPaidCost: 124.4, ltv1: 0.10, ltv3: 0.31, ltv7: 0.83, ltv15: 1.16, ltv30: 1.49, ltv60: 2.05, roi1: 0.07, roi2: 0.12, roi3: 0.20, roi7: 0.59, roi15: 0.82, roi30: 1.05, roi60: 1.41 },
];

const DIM_COL_MAP: Record<string, { rowKey: keyof Row; label: string; width: number }> = {
  time:      { rowKey: 'date',      label: '时间',     width: 104 },
  media:     { rowKey: 'media',     label: '媒体',     width: 80  },
  optimizer: { rowKey: 'optimizer', label: '优化师',   width: 80  },
  game:      { rowKey: 'game',      label: '游戏',     width: 80  },
  channel:   { rowKey: 'channel',   label: '主渠道',   width: 80  },
  os:        { rowKey: 'os',        label: '系统',     width: 70  },
  region:    { rowKey: 'region',    label: '地区',     width: 70  },
  adtype:    { rowKey: 'adtype',    label: '广告类型', width: 90  },
};

type MetricCol = { key: keyof Row; label: string; width: number; tooltip: string; decimals?: number };

const METRIC_COLS: MetricCol[] = [
  { key: 'spend',         label: '消耗',         width: 90,  tooltip: '广告实际消费金额（元）' },
  { key: 'newDevices',    label: '新增设备',     width: 90,  tooltip: '新增激活设备数' },
  { key: 'newDeviceCost', label: '新增成本',     width: 90,  tooltip: '新增设备平均成本', decimals: 2 },
  { key: 'newPaidUsers',  label: '新增付费用户', width: 110, tooltip: '首次付费用户数' },
  { key: 'newPaidCost',   label: '新增付费成本', width: 110, tooltip: '新增付费用户平均成本', decimals: 1 },
  { key: 'ltv1',  label: 'LTV_1',  width: 80, tooltip: '第1日LTV',  decimals: 2 },
  { key: 'ltv3',  label: 'LTV_3',  width: 80, tooltip: '第3日LTV',  decimals: 2 },
  { key: 'ltv7',  label: 'LTV_7',  width: 80, tooltip: '第7日LTV',  decimals: 2 },
  { key: 'ltv15', label: 'LTV_15', width: 80, tooltip: '第15日LTV', decimals: 2 },
  { key: 'ltv30', label: 'LTV_30', width: 80, tooltip: '第30日LTV', decimals: 2 },
  { key: 'ltv60', label: 'LTV_60', width: 80, tooltip: '第60日LTV', decimals: 2 },
  { key: 'roi1',  label: 'ROI_1',  width: 80, tooltip: '第1日ROI',  decimals: 2 },
  { key: 'roi2',  label: 'ROI_2',  width: 80, tooltip: '第2日ROI',  decimals: 2 },
  { key: 'roi3',  label: 'ROI_3',  width: 80, tooltip: '第3日ROI',  decimals: 2 },
  { key: 'roi7',  label: 'ROI_7',  width: 80, tooltip: '第7日ROI',  decimals: 2 },
  { key: 'roi15', label: 'ROI_15', width: 80, tooltip: '第15日ROI', decimals: 2 },
  { key: 'roi30', label: 'ROI_30', width: 80, tooltip: '第30日ROI', decimals: 2 },
  { key: 'roi60', label: 'ROI_60', width: 80, tooltip: '第60日ROI', decimals: 2 },
];

const AVG_KEYS = new Set<keyof Row>([
  'ltv1','ltv3','ltv7','ltv15','ltv30','ltv60',
  'roi1','roi2','roi3','roi7','roi15','roi30','roi60',
  'newDeviceCost','newPaidCost',
]);

// Fixed sort basis options for merge view dim cols
const MERGE_SORT_BASIS: { key: 'self' | keyof Row; label: string }[] = [
  { key: 'spend',        label: '消耗' },
  { key: 'newDevices',   label: '新增设备' },
  { key: 'newPaidUsers', label: '新增PU' },
];

type DimSortRule = { basis: 'self' | keyof Row; dir: 'asc' | 'desc' };
const DEFAULT_DIM_SORT: DimSortRule = { basis: 'self', dir: 'desc' };

const fmt = (n: number, decimals = 0) =>
  n.toLocaleString('zh-CN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

// ── Time granularity helpers ───────────────────────────────────
function getPeriodKey(date: string, gran: 'day' | 'week' | 'month' | 'total'): string {
  if (gran === 'day') return date;
  if (gran === 'total') return '总计';
  const d = new Date(date);
  if (gran === 'month') {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  // Week: Monday～Sunday, format YYYYMMDD～MMDD
  const p2 = (n: number) => String(n).padStart(2, '0');
  const dow = d.getDay() || 7; // 1=Mon … 7=Sun
  const mon = new Date(d); mon.setDate(d.getDate() - dow + 1);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  const start = `${mon.getFullYear()}-${p2(mon.getMonth() + 1)}-${p2(mon.getDate())}`;
  const end   = `${p2(sun.getMonth() + 1)}-${p2(sun.getDate())}`;
  return `${start}～${end}`;
}

function aggregateRows(
  rows: Row[],
  activeDimKeys: string[],
  gran: 'day' | 'week' | 'month' | 'total',
): Row[] {
  if (gran === 'day') return rows;
  const groupMap = new Map<string, Row[]>();
  for (const row of rows) {
    const parts = activeDimKeys.map(dk => {
      if (dk === 'time') return getPeriodKey(row.date, gran);
      const dc = DIM_COL_MAP[dk];
      return dc ? String(row[dc.rowKey]) : '';
    });
    const key = parts.join('\0');
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(row);
  }
  const result: Row[] = [];
  let idx = 0;
  for (const group of groupMap.values()) {
    const rep = group[0];
    const sumSpend       = group.reduce((s, r) => s + r.spend, 0);
    const sumNewDevices  = group.reduce((s, r) => s + r.newDevices, 0);
    const sumNewPaid     = group.reduce((s, r) => s + r.newPaidUsers, 0);
    result.push({
      id: `agg_${idx++}`,
      date: activeDimKeys.includes('time') ? getPeriodKey(rep.date, gran) : rep.date,
      media: rep.media, optimizer: rep.optimizer, game: rep.game,
      channel: rep.channel, os: rep.os, region: rep.region, adtype: rep.adtype,
      spend:        sumSpend,
      newDevices:   sumNewDevices,
      newDeviceCost: sumNewDevices > 0 ? sumSpend / sumNewDevices : 0,
      newPaidUsers: sumNewPaid,
      newPaidCost:  sumNewPaid > 0 ? sumSpend / sumNewPaid : 0,
      ltv1:  group.reduce((s, r) => s + r.ltv1,  0) / group.length,
      ltv3:  group.reduce((s, r) => s + r.ltv3,  0) / group.length,
      ltv7:  group.reduce((s, r) => s + r.ltv7,  0) / group.length,
      ltv15: group.reduce((s, r) => s + r.ltv15, 0) / group.length,
      ltv30: group.reduce((s, r) => s + r.ltv30, 0) / group.length,
      ltv60: group.reduce((s, r) => s + r.ltv60, 0) / group.length,
      roi1:  group.reduce((s, r) => s + r.roi1,  0) / group.length,
      roi2:  group.reduce((s, r) => s + r.roi2,  0) / group.length,
      roi3:  group.reduce((s, r) => s + r.roi3,  0) / group.length,
      roi7:  group.reduce((s, r) => s + r.roi7,  0) / group.length,
      roi15: group.reduce((s, r) => s + r.roi15, 0) / group.length,
      roi30: group.reduce((s, r) => s + r.roi30, 0) / group.length,
      roi60: group.reduce((s, r) => s + r.roi60, 0) / group.length,
    });
  }
  return result;
}

// ── Filter evaluation ──────────────────────────────────────────
function evalRow(row: Row, combo: FilterCombination): boolean {
  if (!combo.groups.length) return true;
  return combo.groups.some(group => {
    if (!group.conditions.length) return true;
    return group.conditions.every(cond => {
      const val = row[cond.metricKey as keyof Row] as number;
      if (typeof val !== 'number') return true;
      switch (cond.operator) {
        case '>':       return val >  cond.value;
        case '<':       return val <  cond.value;
        case '>=':      return val >= cond.value;
        case '<=':      return val <= cond.value;
        case '=':       return val === cond.value;
        case 'between': return val >= cond.value && val <= cond.value2;
        default:        return true;
      }
    });
  });
}

// ── Merge-view helpers ────────────────────────────────────────
type SpanCell = { rowspan: number; render: boolean };
type DimCol = { dimKey: string; rowKey: keyof Row; label: string; width: number };

function computeMergeSpans(rows: Row[], dimKeys: (keyof Row)[]): SpanCell[][] {
  const n = rows.length;
  const m = dimKeys.length;
  if (n === 0 || m === 0) return [];
  const groupStarts: boolean[][] = rows.map(() => new Array(m).fill(false));
  for (let j = 0; j < m; j++) groupStarts[0][j] = true;
  for (let r = 1; r < n; r++) {
    for (let j = 0; j < m; j++) {
      groupStarts[r][j] =
        rows[r][dimKeys[j]] !== rows[r - 1][dimKeys[j]] ||
        (j > 0 && groupStarts[r][j - 1]);
    }
  }
  const result: SpanCell[][] = rows.map(() => new Array(m).fill(null));
  for (let j = 0; j < m; j++) {
    for (let r = 0; r < n; r++) {
      if (!groupStarts[r][j]) {
        result[r][j] = { rowspan: 0, render: false };
      } else {
        let end = r + 1;
        while (end < n && !groupStarts[end][j]) end++;
        result[r][j] = { rowspan: end - r, render: true };
      }
    }
  }
  return result;
}


// ── Column header ─────────────────────────────────────────────
type DropdownState = { colKey: string; top: number; left: number } | null;

interface ColHeaderProps {
  label: string;
  tooltip?: string;
  colKey: string;
  // detail view sort
  sortColKey?: string | null;
  sortDir?: 'asc' | 'desc' | null;
  // merge view dim: pass current rule dir so arrow always shows
  activeDir?: 'asc' | 'desc' | null;
  onOpenDropdown: (colKey: string, top: number, left: number) => void;
}

function ColHeader({ label, tooltip, colKey, sortColKey, sortDir, activeDir, onOpenDropdown }: ColHeaderProps) {
  const [hovered, setHovered] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dir = activeDir !== undefined ? activeDir : (sortColKey === colKey ? sortDir : null);
  const showArrow = !!dir && !hovered;

  const inner = (
    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
  );

  return (
    <div
      style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {tooltip ? <Tooltip title={tooltip} placement="top">{inner}</Tooltip> : inner}
      {showArrow && (
        dir === 'asc'
          ? <ArrowUp size={12} color="#1677ff" strokeWidth={2} style={{ flexShrink: 0 }} />
          : <ArrowDown size={12} color="#1677ff" strokeWidth={2} style={{ flexShrink: 0 }} />
      )}
      <button
        ref={btnRef}
        onClick={(e) => {
          e.stopPropagation();
          const rect = btnRef.current!.getBoundingClientRect();
          onOpenDropdown(colKey, rect.bottom + 6, rect.left);
        }}
        style={{
          position: 'absolute', right: 0,
          width: 18, height: 18, borderRadius: '50%',
          background: '#1677ff', border: 'none', cursor: 'pointer',
          display: hovered ? 'flex' : 'none',
          alignItems: 'center', justifyContent: 'center',
          padding: 0, flexShrink: 0,
        }}
      >
        <ChevronDown size={11} color="#fff" strokeWidth={2.5} />
      </button>
    </div>
  );
}

interface Props {
  activeDims: string[];
  hasData: boolean;
  activeFilter?: FilterCombination | null;
  mergeView?: boolean;
  timeGranularity?: 'day' | 'week' | 'month' | 'total';
}

export function DataTable({ activeDims, hasData, activeFilter, mergeView, timeGranularity = 'day' }: Props) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  // ── Detail view sort ──
  const [sortColKey, setSortColKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc' | null>(null);

  // ── Merge view dim sort rules (keyed by dimKey) ──
  const [dimSortRules, setDimSortRules] = useState<Record<string, DimSortRule>>({});

  // ── Freeze boundary ──
  const [freezeBoundary, setFreezeBoundary] = useState<
    { type: 'dim'; key: string } | { type: 'metric'; key: string } | null
  >(null);

  // ── Dropdown + submenu ──
  const [dropdown, setDropdown] = useState<DropdownState>(null);
  const [subMenu, setSubMenu] = useState<{
    basisKey: string; basisLabel: string; top: number; left: number;
  } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const subMenuRef = useRef<HTMLDivElement>(null);
  const subMenuTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up stale sort rules when dims change; reset freeze boundary
  const prevDimSetRef = useRef([...activeDims].sort().join(','));
  useEffect(() => {
    const currSet = [...activeDims].sort().join(',');
    if (currSet !== prevDimSetRef.current) {
      setDimSortRules(prev => {
        const next: Record<string, DimSortRule> = {};
        activeDims.forEach(k => { if (prev[k]) next[k] = prev[k]; });
        return next;
      });
      setFreezeBoundary(null);
      prevDimSetRef.current = currSet;
    }
  }, [activeDims]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdown) return;
    const handler = (e: MouseEvent) => {
      const inDropdown = dropdownRef.current?.contains(e.target as Node);
      const inSubMenu = subMenuRef.current?.contains(e.target as Node);
      if (!inDropdown && !inSubMenu) {
        setDropdown(null);
        setSubMenu(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdown]);

  const openSubMenu = (e: React.MouseEvent, basisKey: string, basisLabel: string) => {
    if (subMenuTimer.current) clearTimeout(subMenuTimer.current);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setSubMenu({ basisKey, basisLabel, top: rect.top, left: rect.right + 4 });
  };

  const scheduleCloseSubMenu = () => {
    subMenuTimer.current = setTimeout(() => setSubMenu(null), 120);
  };

  const cancelCloseSubMenu = () => {
    if (subMenuTimer.current) clearTimeout(subMenuTimer.current);
  };

  // Aggregate by time granularity, then apply metric filter
  const baseRows: Row[] = !hasData ? [] : aggregateRows(DATA, activeDims, timeGranularity);
  const rows: Row[] = activeFilter
    ? baseRows.filter(row => evalRow(row, activeFilter))
    : baseRows;

  // Build dim columns (time col width adapts to granularity)
  const TIME_WIDTH = timeGranularity === 'week' ? 148 : timeGranularity === 'month' ? 90 : timeGranularity === 'total' ? 72 : 104;
  const DIM_COLS: DimCol[] = activeDims
    .filter(k => !!DIM_COL_MAP[k])
    .map(k => ({ dimKey: k, ...DIM_COL_MAP[k], ...(k === 'time' ? { width: TIME_WIDTH } : {}) }));

  // Sort rows
  const displayRows = mergeView
    ? (() => {
        type CmpFn = (a: Row, b: Row) => number;
        // For each dim col: user rule if set, else implicit grouping sort (self asc)
        const cmpFns: CmpFn[] = DIM_COLS.map(col => {
          const rule = dimSortRules[col.dimKey];
          if (rule) {
            const sign = rule.dir === 'asc' ? 1 : -1;
            if (rule.basis === 'self') {
              return (a: Row, b: Row) =>
                sign * String(a[col.rowKey]).localeCompare(String(b[col.rowKey]), 'zh-CN');
            }
            // Metric basis: aggregate total per dim value, then compare
            const totals = new Map<string, number>();
            for (const row of rows) {
              const k = String(row[col.rowKey]);
              totals.set(k, (totals.get(k) ?? 0) + (row[rule.basis as keyof Row] as number));
            }
            return (a: Row, b: Row) =>
              sign * ((totals.get(String(a[col.rowKey])) ?? 0) - (totals.get(String(b[col.rowKey])) ?? 0));
          }
          // No user rule: implicit grouping sort so identical values stay consecutive
          return (a: Row, b: Row) =>
            String(a[col.rowKey]).localeCompare(String(b[col.rowKey]), 'zh-CN');
        });
        return [...rows].sort((a, b) => {
          for (const fn of cmpFns) {
            const c = fn(a, b);
            if (c !== 0) return c;
          }
          return 0;
        });
      })()
    : sortColKey && sortDir
      ? [...rows].sort((a, b) => {
          const dc = DIM_COLS.find(c => c.dimKey === sortColKey);
          if (dc) {
            const cmp = String(a[dc.rowKey]).localeCompare(String(b[dc.rowKey]), 'zh-CN');
            return sortDir === 'asc' ? cmp : -cmp;
          }
          const mc = METRIC_COLS.find(c => String(c.key) === sortColKey);
          if (mc) {
            const av = a[mc.key] as number, bv = b[mc.key] as number;
            return sortDir === 'asc' ? av - bv : bv - av;
          }
          return 0;
        })
      : rows;

  const spanInfo = mergeView
    ? computeMergeSpans(displayRows, DIM_COLS.map(c => c.rowKey))
    : null;

  if (!hasData || activeDims.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: F, color: '#bbb', gap: 12 }}>
        <Inbox size={48} color="#e0e0e0" strokeWidth={1} />
        <span style={{ fontSize: 13 }}>
          {activeDims.length === 0 ? '请先在【聚合维度】中选择维度' : '暂无数据'}
        </span>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: F, color: '#bbb', gap: 12 }}>
        <Inbox size={48} color="#e0e0e0" strokeWidth={1} />
        <span style={{ fontSize: 13 }}>当前指标筛选条件下无匹配数据</span>
        <span style={{ fontSize: 12, color: '#d9d9d9' }}>请调整筛选条件后重试</span>
      </div>
    );
  }

  const totalDimW    = DIM_COLS.reduce((s, c) => s + c.width, 0);
  const totalMetricW = METRIC_COLS.reduce((s, c) => s + c.width, 0);
  const mean = (key: keyof Row) => rows.reduce((s, r) => s + (r[key] as number), 0) / rows.length;
  const sum  = (key: keyof Row) => rows.reduce((s, r) => s + (r[key] as number), 0);

  const handleOpenDropdown = (colKey: string, top: number, left: number) => {
    setSubMenu(null);
    setDropdown(prev => prev?.colKey === colKey ? null : { colKey, top, left });
  };

  // Build dim columns
  const dimColumns: ColumnsType<Row> = DIM_COLS.map((col, i) => {
    const freezeDimIdx = freezeBoundary?.type === 'dim'
      ? DIM_COLS.findIndex(c => c.dimKey === freezeBoundary.key) : -1;
    const isDimFrozen = mergeView
      ? (freezeBoundary?.type === 'metric' || (freezeBoundary?.type === 'dim' && i <= freezeDimIdx))
      : (freezeBoundary === null || freezeBoundary.type === 'metric' || i <= freezeDimIdx);
    const isLastDim = i === DIM_COLS.length - 1;
    const isBoundary = freezeBoundary === null ? isLastDim
      : (freezeBoundary.type === 'dim' && col.dimKey === freezeBoundary.key);
    const showShadow = !mergeView && isBoundary && (freezeBoundary === null || freezeBoundary.type === 'dim');
    const shadowStyle = showShadow
      ? { boxShadow: '6px 0 8px -4px rgba(0,0,0,0.12)', clipPath: 'inset(0 -12px 0 0)' } : {};

    const rule = dimSortRules[col.dimKey] ?? DEFAULT_DIM_SORT;

    return {
      title: (
        <ColHeader
          label={col.label}
          colKey={col.dimKey}
          sortColKey={mergeView ? undefined : sortColKey}
          sortDir={mergeView ? undefined : sortDir}
          activeDir={mergeView ? (dimSortRules[col.dimKey]?.dir ?? null) : undefined}
          onOpenDropdown={handleOpenDropdown}
        />
      ),
      dataIndex: col.rowKey,
      key: col.dimKey,
      fixed: isDimFrozen ? 'left' as const : undefined,
      width: col.width,
      align: 'center' as const,
      onHeaderCell: () => ({ style: { textAlign: 'center' as const, ...shadowStyle } }),
      ...(mergeView && spanInfo
        ? {
            onCell: (_record: Row, rowIndex?: number) => {
              if (rowIndex === undefined) return {};
              const si = spanInfo[rowIndex][i];
              return { rowSpan: si.render ? si.rowspan : 0 };
            },
          }
        : {
            onCell: () => ({ style: shadowStyle }),
          }),
      render: (val: unknown) => String(val),
    };
  });

  // Build metric columns
  const metricColumns: ColumnsType<Row> = METRIC_COLS.map((col, mi) => {
    const freezeMetricIdx = freezeBoundary?.type === 'metric'
      ? METRIC_COLS.findIndex(c => String(c.key) === freezeBoundary.key) : -1;
    const isFrozen = freezeBoundary?.type === 'metric' && mi <= freezeMetricIdx;
    const isBoundary = freezeBoundary?.type === 'metric' && mi === freezeMetricIdx;
    const shadowStyle = isBoundary
      ? { boxShadow: '6px 0 8px -4px rgba(0,0,0,0.12)', clipPath: 'inset(0 -12px 0 0)' } : {};

    return {
      title: mergeView
        ? (
          // Merge view metric: hover shows blue button → freeze only
          <ColHeader
            label={col.label}
            tooltip={col.tooltip}
            colKey={String(col.key)}
            onOpenDropdown={handleOpenDropdown}
          />
        )
        : (
          <ColHeader
            label={col.label}
            tooltip={col.tooltip}
            colKey={String(col.key)}
            sortColKey={sortColKey}
            sortDir={sortDir}
            onOpenDropdown={handleOpenDropdown}
          />
        ),
      dataIndex: col.key,
      key: String(col.key),
      width: col.width,
      fixed: isFrozen ? 'left' as const : undefined,
      onHeaderCell: () => ({ style: { textAlign: 'center' as const, ...shadowStyle } }),
      onCell: () => ({ style: { textAlign: 'right' as const, ...shadowStyle } }),
      render: (val: number) => fmt(val, col.decimals ?? 0),
    };
  });

  const columns: ColumnsType<Row> = [...dimColumns, ...metricColumns];

  // Dropdown context
  const ddDimCol    = dropdown ? DIM_COLS.find(c => c.dimKey === dropdown.colKey) : null;
  const ddMetricCol = dropdown ? METRIC_COLS.find(c => String(c.key) === dropdown.colKey) : null;
  const ddDimIdx    = ddDimCol ? DIM_COLS.indexOf(ddDimCol) : -1;
  const ddMetricIdx = ddMetricCol ? METRIC_COLS.indexOf(ddMetricCol) : -1;
  const isDimDropdown = !!ddDimCol;
  const currentRule = ddDimCol ? (dimSortRules[ddDimCol.dimKey] ?? DEFAULT_DIM_SORT) : null;

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '0 16px' }}>
      <style>{`
        .cetus-table .ant-table { border-left: none !important; }
        .cetus-table .ant-table-container { border-left: none !important; }
        .cetus-table .ant-table-thead > tr > th { background: #f0f5ff !important; }
        .cetus-table .ant-table-thead > tr > th.ant-table-cell { border-right: none !important; }
        .cetus-table .ant-table-thead > tr > th.ant-table-cell::before {
          top: 50% !important; height: 1.4em !important;
          transform: translateY(-50%) !important; background-color: #d0d7e3 !important;
        }
        .cetus-table .ant-table-column-sorter { display: none !important; }
      `}</style>

      <Table<Row>
        className="cetus-table"
        dataSource={displayRows}
        rowKey="id"
        columns={columns}
        pagination={false}
        size="small"
        scroll={{ x: totalDimW + totalMetricW, y: 'calc(100vh - 280px)' }}
        sticky
        onRow={(record) => ({
          onMouseEnter: () => setHoveredRow(record.id),
          onMouseLeave: () => setHoveredRow(null),
        })}
        rowClassName={(record) => (hoveredRow === record.id ? 'ant-table-row-hover' : '')}
        summary={() => (
          <Table.Summary fixed>
            <Table.Summary.Row style={{ background: '#fafafa' }}>
              {DIM_COLS.map((col, i) => (
                <Table.Summary.Cell key={col.dimKey} index={i} align="center">
                  <span style={{ fontSize: 12, fontWeight: 400, color: '#595959' }}>{i === 0 ? '平均值' : ''}</span>
                </Table.Summary.Cell>
              ))}
              {METRIC_COLS.map((col, i) => (
                <Table.Summary.Cell key={String(col.key)} index={DIM_COLS.length + i} align="right">
                  <span style={{ fontSize: 12, fontWeight: 400, color: '#595959' }}>{fmt(mean(col.key), col.decimals ?? 0)}</span>
                </Table.Summary.Cell>
              ))}
            </Table.Summary.Row>
            <Table.Summary.Row style={{ background: '#eef2ff' }}>
              {DIM_COLS.map((col, i) => (
                <Table.Summary.Cell key={col.dimKey} index={i} align="center">
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1677ff' }}>{i === 0 ? '总计' : ''}</span>
                </Table.Summary.Cell>
              ))}
              {METRIC_COLS.map((col, i) => (
                <Table.Summary.Cell key={String(col.key)} index={DIM_COLS.length + i} align="right">
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1677ff' }}>
                    {fmt(AVG_KEYS.has(col.key) ? mean(col.key) : sum(col.key), col.decimals ?? 0)}
                  </span>
                </Table.Summary.Cell>
              ))}
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />

      {/* ── Dropdown overlay ── */}
      {dropdown && (ddDimCol || ddMetricCol) && (
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed', top: dropdown.top, left: dropdown.left,
            zIndex: 9999, background: '#fff', borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)', border: '1px solid #f0f0f0',
            padding: '4px 0', minWidth: 148, fontFamily: F,
          }}
        >
          {mergeView && isDimDropdown ? (
            /* Merge view dim col: cascading sort basis menu */
            <>
              <div style={{ padding: '4px 14px 6px', fontSize: 12, color: '#8c8c8c', userSelect: 'none' }}>
                排序依据
              </div>
              {/* Self sort option */}
              {ddDimCol && (() => {
                const isSelfActive = currentRule?.basis === 'self';
                return (
                  <div
                    onMouseEnter={e => openSubMenu(e, 'self', ddDimCol.label)}
                    onMouseLeave={scheduleCloseSubMenu}
                    style={basisItemStyle(isSelfActive)}
                  >
                    <span>{ddDimCol.label}</span>
                    <ChevronRight size={13} color={isSelfActive ? '#1677ff' : '#8c8c8c'} style={{ marginLeft: 'auto' }} />
                  </div>
                );
              })()}
              {/* Metric basis options */}
              {MERGE_SORT_BASIS.map(b => {
                const isActive = currentRule?.basis === b.key;
                return (
                  <div
                    key={b.key as string}
                    onMouseEnter={e => openSubMenu(e, b.key as string, b.label)}
                    onMouseLeave={scheduleCloseSubMenu}
                    style={basisItemStyle(isActive)}
                  >
                    <span>{b.label}</span>
                    <ChevronRight size={13} color={isActive ? '#1677ff' : '#8c8c8c'} style={{ marginLeft: 'auto' }} />
                  </div>
                );
              })}
              <div style={{ height: 1, background: '#f0f0f0', margin: '4px 0' }} />
              <button
                onClick={() => {
                  setFreezeBoundary({ type: 'dim', key: DIM_COLS[ddDimIdx].dimKey });
                  setDropdown(null);
                }}
                style={menuItemStyle(false)}
              >
                <PanelLeft size={14} color="#595959" strokeWidth={2} />
                <span>冻结至此列</span>
              </button>
            </>
          ) : mergeView && !isDimDropdown ? (
            /* Merge view metric col: freeze only */
            <button
              onClick={() => {
                setFreezeBoundary({ type: 'metric', key: String(METRIC_COLS[ddMetricIdx].key) });
                setDropdown(null);
              }}
              style={menuItemStyle(false)}
            >
              <PanelLeft size={14} color="#595959" strokeWidth={2} />
              <span>冻结至此列</span>
            </button>
          ) : (
            /* Detail view: sort + freeze */
            <>
              <button
                onClick={() => { setSortColKey(dropdown.colKey); setSortDir('desc'); setDropdown(null); }}
                style={menuItemStyle(sortColKey === dropdown.colKey && sortDir === 'desc')}
              >
                <ArrowDown size={14} color={sortColKey === dropdown.colKey && sortDir === 'desc' ? '#1677ff' : '#595959'} strokeWidth={2} />
                <span>降序排序</span>
              </button>
              <button
                onClick={() => { setSortColKey(dropdown.colKey); setSortDir('asc'); setDropdown(null); }}
                style={menuItemStyle(sortColKey === dropdown.colKey && sortDir === 'asc')}
              >
                <ArrowUp size={14} color={sortColKey === dropdown.colKey && sortDir === 'asc' ? '#1677ff' : '#595959'} strokeWidth={2} />
                <span>升序排序</span>
              </button>
              <div style={{ height: 1, background: '#f0f0f0', margin: '4px 0' }} />
              <button
                onClick={() => {
                  setFreezeBoundary(isDimDropdown
                    ? { type: 'dim', key: DIM_COLS[ddDimIdx].dimKey }
                    : { type: 'metric', key: String(METRIC_COLS[ddMetricIdx].key) });
                  setDropdown(null);
                }}
                style={menuItemStyle(false)}
              >
                <PanelLeft size={14} color="#595959" strokeWidth={2} />
                <span>冻结至此列</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Sub-menu overlay (merge view dim sort direction) ── */}
      {subMenu && dropdown && ddDimCol && (
        <div
          ref={subMenuRef}
          onMouseEnter={cancelCloseSubMenu}
          onMouseLeave={scheduleCloseSubMenu}
          style={{
            position: 'fixed', top: subMenu.top, left: subMenu.left,
            zIndex: 10000, background: '#fff', borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)', border: '1px solid #f0f0f0',
            padding: '4px 0', minWidth: 132, fontFamily: F,
          }}
        >
          {(['desc', 'asc'] as const).map(dir => {
            const isActive = currentRule?.basis === subMenu.basisKey && currentRule?.dir === dir;
            return (
              <button
                key={dir}
                onClick={() => {
                  setDimSortRules(prev => ({
                    ...prev,
                    [ddDimCol.dimKey]: { basis: subMenu.basisKey as DimSortRule['basis'], dir },
                  }));
                  setSubMenu(null);
                  setDropdown(null);
                }}
                style={menuItemStyle(isActive)}
              >
                {dir === 'desc'
                  ? <ArrowDown size={14} color={isActive ? '#1677ff' : '#595959'} strokeWidth={2} />
                  : <ArrowUp   size={14} color={isActive ? '#1677ff' : '#595959'} strokeWidth={2} />
                }
                <span>{dir === 'desc' ? '降序排列' : '升序排列'}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function menuItemStyle(active: boolean): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: 8,
    width: '100%', padding: '7px 14px',
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 13, color: active ? '#1677ff' : '#262626',
    fontWeight: active ? 500 : 400, textAlign: 'left',
  };
}

function basisItemStyle(active: boolean): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '7px 14px', cursor: 'pointer',
    fontSize: 13, color: active ? '#1677ff' : '#262626',
    fontWeight: active ? 500 : 400,
    background: 'none',
  };
}

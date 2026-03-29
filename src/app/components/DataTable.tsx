import React, { useState, useEffect, useRef } from 'react';
import { Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Inbox, ChevronDown, ArrowDown, ArrowUp, PanelLeft } from 'lucide-react';
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

// Average metrics (use mean instead of sum for 总计)
const AVG_KEYS = new Set<keyof Row>([
  'ltv1','ltv3','ltv7','ltv15','ltv30','ltv60',
  'roi1','roi2','roi3','roi7','roi15','roi30','roi60',
  'newDeviceCost','newPaidCost',
]);

const fmt = (n: number, decimals = 0) =>
  n.toLocaleString('zh-CN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

// ── Filter evaluation ──────────────────────────────────────────
function evalRow(row: Row, combo: FilterCombination): boolean {
  if (!combo.groups.length) return true;
  // Groups are OR; conditions within a group are AND
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

function computeMergeSpans(rows: Row[], dimKeys: (keyof Row)[]): SpanCell[][] {
  const n = rows.length;
  const m = dimKeys.length;
  if (n === 0 || m === 0) return [];

  // groupStarts[r][j] = true when row r begins a new visual group for col j
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

// ── Sort dropdown ─────────────────────────────────────────────
type DropdownState = {
  colKey: string;
  top: number;
  left: number;
} | null;

interface ColHeaderProps {
  label: string;
  tooltip?: string;
  colKey: string;
  sortColKey: string | null;
  sortDir: 'asc' | 'desc' | null;
  onOpenDropdown: (colKey: string, top: number, left: number) => void;
}

function ColHeader({ label, tooltip, colKey, sortColKey, sortDir, onOpenDropdown }: ColHeaderProps) {
  const [hovered, setHovered] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const isActive = sortColKey === colKey;
  const showArrow = isActive && !hovered;
  const showBtn = hovered;

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
        sortDir === 'asc'
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
          position: 'absolute',
          right: 0,
          width: 18, height: 18,
          borderRadius: '50%',
          background: '#1677ff',
          border: 'none',
          cursor: 'pointer',
          display: showBtn ? 'flex' : 'none',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          flexShrink: 0,
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
}

export function DataTable({ activeDims, hasData, activeFilter, mergeView }: Props) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [sortColKey, setSortColKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc' | null>(null);
  const [dropdown, setDropdown] = useState<DropdownState>(null);
  // Index into METRIC_COLS up to which columns are frozen left (-1 = none)
  const [frozenUpTo, setFrozenUpTo] = useState<number>(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdown) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdown(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdown]);

  // Apply metric filter
  const rows: Row[] = !hasData
    ? []
    : activeFilter
      ? DATA.filter(row => evalRow(row, activeFilter))
      : DATA;

  // Build dim columns (ordered by activeDims)
  type DimCol = { dimKey: string; rowKey: keyof Row; label: string; width: number };
  const DIM_COLS: DimCol[] = activeDims
    .filter(k => !!DIM_COL_MAP[k])
    .map(k => ({ dimKey: k, ...DIM_COL_MAP[k] }));

  // In merge view: sort by dims; in detail view: sort by sortKey/sortDir
  const displayRows = mergeView
    ? [...rows].sort((a, b) => {
        for (const col of DIM_COLS) {
          const av = String(a[col.rowKey]);
          const bv = String(b[col.rowKey]);
          if (av < bv) return -1;
          if (av > bv) return 1;
        }
        return 0;
      })
    : sortColKey && sortDir
      ? [...rows].sort((a, b) => {
          const dimCol = DIM_COLS.find(c => c.dimKey === sortColKey);
          if (dimCol) {
            const cmp = String(a[dimCol.rowKey]).localeCompare(String(b[dimCol.rowKey]), 'zh-CN');
            return sortDir === 'asc' ? cmp : -cmp;
          }
          const metricCol = METRIC_COLS.find(c => String(c.key) === sortColKey);
          if (metricCol) {
            const av = a[metricCol.key] as number;
            const bv = b[metricCol.key] as number;
            return sortDir === 'asc' ? av - bv : bv - av;
          }
          return 0;
        })
      : rows;

  const spanInfo = mergeView
    ? computeMergeSpans(displayRows, DIM_COLS.map(c => c.rowKey))
    : null;

  // Empty: no dims selected or no data
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

  // Empty: filter eliminated all rows
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

  // Summary row helpers
  const mean = (key: keyof Row) =>
    rows.reduce((s, r) => s + (r[key] as number), 0) / rows.length;
  const sum  = (key: keyof Row) =>
    rows.reduce((s, r) => s + (r[key] as number), 0);

  const handleOpenDropdown = (colKey: string, top: number, left: number) => {
    setDropdown(prev => prev?.colKey === colKey ? null : { colKey, top, left });
  };

  // Build antd columns
  const dimColumns: ColumnsType<Row> = DIM_COLS.map((col, i) => {
    const isLastDim = i === DIM_COLS.length - 1;
    const shadowStyle = isLastDim
      ? { boxShadow: '6px 0 8px -4px rgba(0,0,0,0.12)', clipPath: 'inset(0 -12px 0 0)' }
      : {};
    return {
      title: mergeView
        ? col.label
        : (
          <ColHeader
            label={col.label}
            colKey={col.dimKey}
            sortColKey={sortColKey}
            sortDir={sortDir}
            onOpenDropdown={handleOpenDropdown}
          />
        ),
      dataIndex: col.rowKey,
      key: col.dimKey,
      fixed: 'left' as const,
      width: col.width,
      align: 'center' as const,
      onHeaderCell: () => ({ style: { textAlign: 'center' as const, ...shadowStyle } }),
      ...(mergeView
        ? {
            sorter: (a: Row, b: Row) =>
              String(a[col.rowKey]).localeCompare(String(b[col.rowKey]), 'zh-CN'),
          }
        : {}),
      ...(mergeView && spanInfo
        ? {
            onCell: (_record: Row, rowIndex?: number) => {
              if (rowIndex === undefined) return {};
              const si = spanInfo[rowIndex][i];
              return { rowSpan: si.render ? si.rowspan : 0, style: shadowStyle };
            },
          }
        : {
            onCell: isLastDim ? () => ({ style: shadowStyle }) : undefined,
          }),
      render: (val: unknown) => String(val),
    };
  });

  const metricColumns: ColumnsType<Row> = METRIC_COLS.map((col, mi) => {
    const isFrozen = !mergeView && mi <= frozenUpTo;
    const isLastFrozen = !mergeView && mi === frozenUpTo;
    return {
      title: mergeView
        ? (
          <Tooltip title={col.tooltip} placement="top">
            <span style={{ cursor: 'pointer' }}>{col.label}</span>
          </Tooltip>
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
      onHeaderCell: () => ({
        style: {
          textAlign: 'center' as const,
          ...(isLastFrozen ? { boxShadow: '6px 0 8px -4px rgba(0,0,0,0.12)', clipPath: 'inset(0 -12px 0 0)' } : {}),
        },
      }),
      onCell: () => ({
        style: {
          textAlign: 'right' as const,
          ...(isLastFrozen ? { boxShadow: '6px 0 8px -4px rgba(0,0,0,0.12)', clipPath: 'inset(0 -12px 0 0)' } : {}),
        },
      }),
      ...(mergeView
        ? {
            sorter: (a: Row, b: Row) =>
              (a[col.key] as number) - (b[col.key] as number),
          }
        : {}),
      render: (val: number) => fmt(val, col.decimals ?? 0),
    };
  });

  const columns: ColumnsType<Row> = [...dimColumns, ...metricColumns];

  const activeDropdownDimCol = dropdown ? DIM_COLS.find(c => c.dimKey === dropdown.colKey) : null;
  const activeDropdownMetricCol = dropdown ? METRIC_COLS.find(c => String(c.key) === dropdown.colKey) : null;
  const activeDropdownIdx = activeDropdownMetricCol ? METRIC_COLS.indexOf(activeDropdownMetricCol) : -1;
  const isCurrentlyFrozen = activeDropdownIdx >= 0 && activeDropdownIdx <= frozenUpTo;
  const isDimDropdown = !!activeDropdownDimCol;

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '0 16px' }}>
      <style>{`
        .cetus-table .ant-table {
          border-left: none !important;
        }
        .cetus-table .ant-table-container {
          border-left: none !important;
        }
        .cetus-table .ant-table-thead > tr > th {
          background: #f0f5ff !important;
        }
        .cetus-table .ant-table-thead > tr > th.ant-table-cell {
          border-right: none !important;
        }
        .cetus-table .ant-table-thead > tr > th.ant-table-cell::before {
          top: 50% !important;
          height: 1.4em !important;
          transform: translateY(-50%) !important;
          background-color: #d0d7e3 !important;
        }
        .cetus-table .ant-table-column-sorter {
          display: none !important;
        }
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
            {/* Average row */}
            <Table.Summary.Row style={{ background: '#fafafa' }}>
              {DIM_COLS.map((col, i) => (
                <Table.Summary.Cell
                  key={col.dimKey}
                  index={i}
                  align="center"
                >
                  <span style={{ fontSize: 12, fontWeight: 400, color: '#595959' }}>
                    {i === 0 ? '平均值' : ''}
                  </span>
                </Table.Summary.Cell>
              ))}
              {METRIC_COLS.map((col, i) => (
                <Table.Summary.Cell
                  key={String(col.key)}
                  index={DIM_COLS.length + i}
                  align="right"
                >
                  <span style={{ fontSize: 12, fontWeight: 400, color: '#595959' }}>
                    {fmt(mean(col.key), col.decimals ?? 0)}
                  </span>
                </Table.Summary.Cell>
              ))}
            </Table.Summary.Row>

            {/* Total row */}
            <Table.Summary.Row style={{ background: '#eef2ff' }}>
              {DIM_COLS.map((col, i) => (
                <Table.Summary.Cell
                  key={col.dimKey}
                  index={i}
                  align="center"
                >
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1677ff' }}>
                    {i === 0 ? '总计' : ''}
                  </span>
                </Table.Summary.Cell>
              ))}
              {METRIC_COLS.map((col, i) => (
                <Table.Summary.Cell
                  key={String(col.key)}
                  index={DIM_COLS.length + i}
                  align="right"
                >
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1677ff' }}>
                    {fmt(AVG_KEYS.has(col.key) ? mean(col.key) : sum(col.key), col.decimals ?? 0)}
                  </span>
                </Table.Summary.Cell>
              ))}
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />

      {/* Sort dropdown overlay */}
      {dropdown && (activeDropdownDimCol || activeDropdownMetricCol) && (
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: dropdown.top,
            left: dropdown.left,
            zIndex: 9999,
            background: '#fff',
            borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            border: '1px solid #f0f0f0',
            padding: '4px 0',
            minWidth: 148,
            fontFamily: F,
          }}
        >
          {/* Desc */}
          <button
            onClick={() => {
              setSortColKey(dropdown.colKey);
              setSortDir('desc');
              setDropdown(null);
            }}
            style={menuItemStyle(sortColKey === dropdown.colKey && sortDir === 'desc')}
          >
            <ArrowDown size={14} color={sortColKey === dropdown.colKey && sortDir === 'desc' ? '#1677ff' : '#595959'} strokeWidth={2} />
            <span>降序排序</span>
          </button>
          {/* Asc */}
          <button
            onClick={() => {
              setSortColKey(dropdown.colKey);
              setSortDir('asc');
              setDropdown(null);
            }}
            style={menuItemStyle(sortColKey === dropdown.colKey && sortDir === 'asc')}
          >
            <ArrowUp size={14} color={sortColKey === dropdown.colKey && sortDir === 'asc' ? '#1677ff' : '#595959'} strokeWidth={2} />
            <span>升序排序</span>
          </button>
          {/* Divider */}
          <div style={{ height: 1, background: '#f0f0f0', margin: '4px 0' }} />
          {/* Freeze — dim cols are always frozen, show as active but no-op */}
          <button
            onClick={() => {
              // Dim cols are always fixed left; clicking freeze resets any metric freeze
              setFrozenUpTo(isDimDropdown ? -1 : activeDropdownIdx);
              setDropdown(null);
            }}
            style={menuItemStyle(false)}
          >
            <PanelLeft size={14} color="#595959" strokeWidth={2} />
            <span>冻结至此列</span>
          </button>
        </div>
      )}
    </div>
  );
}

function menuItemStyle(active: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '7px 14px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    color: active ? '#1677ff' : '#262626',
    fontWeight: active ? 500 : 400,
    textAlign: 'left',
  };
}

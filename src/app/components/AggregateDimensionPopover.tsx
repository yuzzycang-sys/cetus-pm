import React, { useRef, useEffect, useState } from 'react';
import { GripVertical } from 'lucide-react';
import { Checkbox, Button, Select } from 'antd';

type OrderMode = 'default' | 'custom';

export type DimOption = { key: string; label: string };

export const TIME_KEY = 'time';
const TIME_LABEL = '时间';

type DimGroup = { group: string; items: DimOption[] };

const DIM_GROUPS: DimGroup[] = [
  {
    group: '通用维度',
    items: [
      { key: 'game',        label: '游戏' },
      { key: 'os',          label: '系统' },
      { key: 'mainChannel', label: '主渠道名称' },
      { key: 'subChannel',  label: '子渠道标识' },
      { key: 'bizType',     label: '业务类型' },
      { key: 'optimizer',   label: '优化师' },
      { key: 'dept',        label: '部门' },
    ],
  },
  {
    group: '投放维度',
    items: [
      { key: 'bidStrategy',   label: '竞价策略' },
      { key: 'optGoal',       label: '优化目标' },
      { key: 'deepOptGoal',   label: '深度转化目标' },
      { key: 'deepOptMethod', label: '深度优化方式' },
      { key: 'bidTool',       label: '出价工具' },
      { key: 'deliveryMode',  label: '投放模式' },
    ],
  },
  {
    group: '广告属性',
    items: [
      { key: 'accountId',        label: '账户ID/名称' },
      { key: 'projectId',        label: '项目ID/名称' },
      { key: 'adId',             label: '广告ID/名称' },
      { key: 'mediaCreativeId',  label: '媒体素材ID/名称' },
    ],
  },
  {
    group: '素材信息',
    items: [
      { key: 'mediaCreativeMd5', label: '媒体素材MD5/名称' },
      { key: 'creativeName',     label: '素材名称' },
    ],
  },
  {
    group: '出价范围',
    items: [
      { key: 'bidKilo',     label: '出价(千元)' },
      { key: 'bidHundred',  label: '出价(百元)' },
      { key: 'bidTen',      label: '出价(十元)' },
      { key: 'bidYuan',     label: '出价(元)' },
      { key: 'bid',         label: '出价' },
      { key: 'roiCoeff001', label: 'ROI系数(0.001)' },
      { key: 'roiCoeff01',  label: 'ROI系数(0.01)' },
      { key: 'roiCoeff1',   label: 'ROI系数(0.1)' },
      { key: 'roiCoeff',    label: 'ROI系数' },
    ],
  },
];

const SELECTABLE_KEYS = DIM_GROUPS.flatMap(g => g.items.map(i => i.key));

export const LABEL_MAP: Record<string, string> = {
  [TIME_KEY]: TIME_LABEL,
  ...Object.fromEntries(DIM_GROUPS.flatMap(g => g.items.map(i => [i.key, i.label]))),
};

// Kept for external consumers
export const ALL_DIM_OPTIONS: DimOption[] = [
  { key: TIME_KEY, label: TIME_LABEL },
  ...DIM_GROUPS.flatMap(g => g.items),
];

interface Props {
  activeDims: string[];
  onChangeDims: (dims: string[]) => void;
  onClose: () => void;
  timeGranularity?: 'day' | 'week' | 'month';
  orderMode: OrderMode;
  onOrderModeChange: (mode: OrderMode) => void;
  onApplyDimsToName?: (dims: string[]) => void;
  autoUpdate: boolean;
  onAutoUpdateChange: (v: boolean) => void;
}

function ensureTime(dims: string[]): string[] {
  return dims.includes(TIME_KEY) ? dims : [TIME_KEY, ...dims];
}

function sortByDefinition(dims: string[]): string[] {
  const nonTime = SELECTABLE_KEYS.filter(k => dims.includes(k));
  return [TIME_KEY, ...nonTime];
}

// ── Main component ────────────────────────────────────────────────────────────
export function AggregateDimensionPopover({
  activeDims, onChangeDims, onClose, timeGranularity, orderMode, onOrderModeChange,
  onApplyDimsToName, autoUpdate, onAutoUpdateChange,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [localDims, setLocalDims] = useState<string[]>(() => ensureTime(activeDims));
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const applyIfAuto = (dims: string[]) => {
    if (autoUpdate) onApplyDimsToName?.(dims);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const granLabel = timeGranularity ? { day: '天', week: '周', month: '月' }[timeGranularity] : '';
  const isCustom = orderMode === 'custom';

  // ── Dim toggle ────────────────────────────────────────────────────────────
  const toggleDim = (key: string) => {
    if (key === TIME_KEY) return;
    let next: string[];
    if (localDims.includes(key)) {
      next = localDims.filter(k => k !== key);
    } else {
      next = orderMode === 'default'
        ? sortByDefinition([...localDims, key])
        : [...localDims, key];
    }
    setLocalDims(next);
    onChangeDims(next);
    applyIfAuto(next);
  };

  const handleClear = () => {
    const next = [TIME_KEY];
    setLocalDims(next);
    onChangeDims(next);
    applyIfAuto(next);
  };

  // ── Order mode ─────────────────────────────────────────────────────────────
  const handleSetMode = (mode: OrderMode) => {
    onOrderModeChange(mode);
    if (mode === 'default') {
      const sorted = sortByDefinition(localDims);
      setLocalDims(sorted);
      onChangeDims(sorted);
      applyIfAuto(sorted);
    }
  };

  // ── Drag-to-reorder in right panel ────────────────────────────────────────
  const handleDragStart = (key: string) => setDraggedKey(key);

  const handleDragOver = (e: React.DragEvent, key: string) => {
    e.preventDefault();
    if (draggedKey && draggedKey !== key) setDragOverKey(key);
  };

  const handleDrop = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    if (!draggedKey || draggedKey === targetKey) {
      setDraggedKey(null); setDragOverKey(null); return;
    }
    const next = [...localDims];
    const fromIdx = next.indexOf(draggedKey);
    const toIdx = next.indexOf(targetKey);
    next.splice(fromIdx, 1);
    next.splice(toIdx, 0, draggedKey);
    setLocalDims(next);
    onChangeDims(next);
    applyIfAuto(next);
    setDraggedKey(null); setDragOverKey(null);
  };

  const handleDragEnd = () => { setDraggedKey(null); setDragOverKey(null); };

  return (
    <div
      ref={ref}
      className="agg-dim-pop"
      style={{
        position: 'absolute', top: '100%', left: 0, zIndex: 1000,
        background: '#fff', borderRadius: 8,
        boxShadow: '0 6px 24px rgba(0,0,0,0.14)',
        marginTop: 4,
        border: '1px solid #e8e8e8',
        display: 'flex', flexDirection: 'column',
      }}
    >
      <style>{`
        .agg-dim-pop .ant-checkbox-wrapper { font-weight: 400 !important; white-space: nowrap; }
        .agg-dim-select-popup .ant-select-item { font-size: 12px !important; }
      `}</style>
      {/* ── Header ── */}
      <div style={{
        padding: '10px 16px', borderBottom: '1px solid #e8e8e8',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 16, flexShrink: 0,
      }}>
        <span style={{ fontSize: 13, fontWeight: 400, color: '#333' }}>聚合维度</span>

        {/* Order mode select */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#aaa', whiteSpace: 'nowrap' }}>维度列展示顺序</span>
          <Select
            size="small"
            value={orderMode}
            onChange={handleSetMode}
            style={{ width: 88, fontSize: 12, height: 26 }}
            popupClassName="agg-dim-select-popup"
            getPopupContainer={() => ref.current || document.body}
            options={[
              { value: 'default', label: '系统默认' },
              { value: 'custom', label: '自定义' },
            ]}
          />
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ display: 'flex', minHeight: 200 }}>

        {/* Left: grouped checkbox grid */}
        <div style={{ padding: '12px 16px 4px', width: isCustom ? 600 : 640, flexShrink: 0, maxHeight: 400, overflowY: 'auto' }}>

          {/* Selectable dim groups */}
          {DIM_GROUPS.map((group, gi) => (
            <div key={group.group} style={{ marginBottom: gi < DIM_GROUPS.length - 1 ? 12 : 0 }}>
              <div style={{ fontSize: 12, color: '#aaa', marginBottom: 8 }}>{group.group}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px 0' }}>
                {group.items.map(item => {
                  const checked = localDims.includes(item.key);
                  return (
                    <Checkbox
                      key={item.key}
                      checked={checked}
                      onChange={() => toggleDim(item.key)}
                      style={{ fontSize: 13 }}
                    >
                      {item.label}
                    </Checkbox>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Right: order panel (custom mode only) */}
        {isCustom && (
          <div style={{
            width: 160, borderLeft: '1px solid #e8e8e8',
            padding: '12px 0 4px', flexShrink: 0,
          }}>
            <div style={{ padding: '0 12px 8px', fontSize: 12, color: '#aaa' }}>
              展示顺序
            </div>

            {localDims.length === 0 ? (
              <div style={{ padding: '20px 12px', fontSize: 12, color: '#ccc', textAlign: 'center' }}>
                无已选维度
              </div>
            ) : (
              localDims.map(key => {
                const isTime = key === TIME_KEY;
                const label = LABEL_MAP[key] ?? key;
                const isDragging = draggedKey === key;
                const isOver = dragOverKey === key;
                return (
                  <div
                    key={key}
                    draggable
                    onDragStart={() => handleDragStart(key)}
                    onDragOver={e => handleDragOver(e, key)}
                    onDrop={e => handleDrop(e, key)}
                    onDragEnd={handleDragEnd}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px',
                      cursor: 'grab',
                      background: isDragging ? '#e6f4ff' : isOver ? '#f0f9ff' : 'transparent',
                      borderTop: isOver ? '2px solid #1890ff' : '2px solid transparent',
                      opacity: isDragging ? 0.55 : 1,
                      transition: 'background 0.1s',
                    }}
                  >
                    <GripVertical size={13} color="#ccc" style={{ flexShrink: 0 }} />
                    <span style={{
                      fontSize: 12, flex: 1,
                      color: isTime ? '#1890ff' : '#333',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {label}{isTime && granLabel ? `(${granLabel})` : ''}
                    </span>
                    {!isTime && (
                      <Button
                        type="text"
                        size="small"
                        danger
                        onClick={e => { e.stopPropagation(); toggleDim(key); }}
                        style={{ padding: 0, minWidth: 'unset', height: 'auto', lineHeight: 1, color: '#ccc' }}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{
        padding: '8px 16px', borderTop: '1px solid #f0f0f0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Checkbox
          checked={autoUpdate}
          onChange={e => onAutoUpdateChange(e.target.checked)}
          style={{ fontSize: 12 }}
        >
          自动更新至名称
        </Checkbox>
        <Button
          type="link"
          size="small"
          onClick={handleClear}
          style={{ fontSize: 12, padding: 0 }}
        >
          清空
        </Button>
      </div>
    </div>
  );
}

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
      { key: 'game',      label: '游戏' },
      { key: 'os',        label: '系统' },
      { key: 'channel',   label: '主渠道' },
      { key: 'region',    label: '地区' },
      { key: 'optimizer', label: '优化师' },
      { key: 'media',     label: '媒体' },
    ],
  },
  {
    group: '投放维度',
    items: [
      { key: 'adtype', label: '广告类型' },
    ],
  },
];

const SELECTABLE_KEYS = DIM_GROUPS.flatMap(g => g.items.map(i => i.key));

const LABEL_MAP: Record<string, string> = {
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
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [localDims, setLocalDims] = useState<string[]>(() => ensureTime(activeDims));
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  useEffect(() => { setLocalDims(ensureTime(activeDims)); }, [activeDims.join(',')]);

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
  };

  const handleClear = () => {
    const next = [TIME_KEY];
    setLocalDims(next);
    onChangeDims(next);
  };

  // ── Order mode ─────────────────────────────────────────────────────────────
  const handleSetMode = (mode: OrderMode) => {
    onOrderModeChange(mode);
    if (mode === 'default') {
      const sorted = sortByDefinition(localDims);
      setLocalDims(sorted);
      onChangeDims(sorted);
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
    setDraggedKey(null); setDragOverKey(null);
  };

  const handleDragEnd = () => { setDraggedKey(null); setDragOverKey(null); };

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute', top: '100%', left: 0, zIndex: 1000,
        background: '#fff', borderRadius: 8,
        boxShadow: '0 6px 24px rgba(0,0,0,0.14)',
        marginTop: 4,
        border: '1px solid #e8e8e8',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* ── Header ── */}
      <div style={{
        padding: '10px 16px', borderBottom: '1px solid #e8e8e8',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 16, flexShrink: 0,
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>聚合维度</span>

        {/* Order mode select */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#666', whiteSpace: 'nowrap' }}>维度列展示顺序</span>
          <Select
            size="small"
            value={orderMode}
            onChange={handleSetMode}
            style={{ width: 90, fontSize: 12 }}
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
        <div style={{ padding: '12px 16px 4px', width: isCustom ? 380 : 420, flexShrink: 0 }}>

          {/* Selectable dim groups */}
          {DIM_GROUPS.map((group, gi) => (
            <div key={group.group} style={{ marginBottom: gi < DIM_GROUPS.length - 1 ? 12 : 0 }}>
              <div style={{ fontSize: 12, color: '#aaa', marginBottom: 8 }}>{group.group}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px 0' }}>
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
        display: 'flex', justifyContent: 'flex-end',
      }}>
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

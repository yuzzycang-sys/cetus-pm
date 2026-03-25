import React, { useRef, useEffect, useState } from 'react';
import { Check, GripVertical, X, ChevronDown } from 'lucide-react';

const F = "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif";

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
}

function ensureTime(dims: string[]): string[] {
  return dims.includes(TIME_KEY) ? dims : [TIME_KEY, ...dims];
}

function sortByDefinition(dims: string[]): string[] {
  const nonTime = SELECTABLE_KEYS.filter(k => dims.includes(k));
  return [TIME_KEY, ...nonTime];
}

// ── Small helper: remove button with hover color ──────────────────────────────
function RemoveBtn({ onRemove }: { onRemove: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={e => { e.stopPropagation(); onRemove(); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: 'pointer', lineHeight: 0, flexShrink: 0 }}
    >
      <X size={12} color={hovered ? '#ff4d4f' : '#ccc'} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function AggregateDimensionPopover({
  activeDims, onChangeDims, onClose, timeGranularity,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [localDims, setLocalDims] = useState<string[]>(() => ensureTime(activeDims));
  const [orderMode, setOrderMode] = useState<OrderMode>('default');
  const [showModeDropdown, setShowModeDropdown] = useState(false);
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
    setOrderMode(mode);
    setShowModeDropdown(false);
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
        fontFamily: F, marginTop: 4,
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

        {/* Order mode dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#666', whiteSpace: 'nowrap' }}>维度列展示顺序</span>
          <div style={{ position: 'relative' }}>
            <div
              onClick={() => setShowModeDropdown(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '3px 8px', border: '1px solid #dee0e3', borderRadius: 4,
                cursor: 'pointer', fontSize: 12, color: '#333', background: '#fff',
                minWidth: 80, userSelect: 'none',
              }}
            >
              <span style={{ flex: 1 }}>{isCustom ? '自定义' : '系统默认'}</span>
              <ChevronDown
                size={11} color="#aaa"
                style={{ transform: showModeDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}
              />
            </div>

            {/* Dropdown backdrop */}
            {showModeDropdown && (
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 9 }}
                onClick={() => setShowModeDropdown(false)}
              />
            )}

            {showModeDropdown && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 2px)', left: 0,
                background: '#fff', border: '1px solid #e8e8e8', borderRadius: 6,
                boxShadow: '0 4px 12px rgba(0,0,0,0.10)', zIndex: 10, minWidth: 90,
                overflow: 'hidden',
              }}>
                {(['default', 'custom'] as const).map(m => {
                  const active = orderMode === m;
                  return (
                    <div
                      key={m}
                      onClick={() => handleSetMode(m)}
                      style={{
                        padding: '7px 12px', fontSize: 12, cursor: 'pointer',
                        color: active ? '#1890ff' : '#333',
                        background: active ? '#e6f4ff' : 'transparent',
                      }}
                      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = '#f5f5f5'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = active ? '#e6f4ff' : 'transparent'; }}
                    >
                      {m === 'default' ? '系统默认' : '自定义'}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ display: 'flex', minHeight: 200 }}>

        {/* Left: grouped checkbox grid */}
        <div style={{ padding: '12px 16px 4px', width: isCustom ? 380 : 420, flexShrink: 0 }}>

          {/* Time dimension: permanent */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 6 }}>时间维度</div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', borderRadius: 4,
              background: '#e6f4ff', border: '1px solid #bae0ff',
              fontSize: 12,
            }}>
              <div style={{
                width: 14, height: 14, borderRadius: 3,
                background: '#1890ff', border: '1.5px solid #1890ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Check size={9} color="#fff" strokeWidth={3} />
              </div>
              <span style={{ color: '#1890ff' }}>
                {TIME_LABEL}{granLabel ? `(${granLabel})` : ''}
              </span>
              <span style={{
                fontSize: 10, color: '#91caff', padding: '0 4px', borderRadius: 3,
                background: '#bae0ff',
              }}>常驻</span>
            </div>
          </div>

          {/* Selectable dim groups */}
          {DIM_GROUPS.map((group, gi) => (
            <div key={group.group} style={{ marginBottom: gi < DIM_GROUPS.length - 1 ? 12 : 0 }}>
              <div style={{ fontSize: 11, color: '#aaa', marginBottom: 8 }}>{group.group}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px 0' }}>
                {group.items.map(item => {
                  const checked = localDims.includes(item.key);
                  return (
                    <div
                      key={item.key}
                      onClick={() => toggleDim(item.key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 7,
                        cursor: 'pointer', padding: '3px 0',
                      }}
                    >
                      <div style={{
                        width: 15, height: 15, borderRadius: 3, flexShrink: 0,
                        border: `1.5px solid ${checked ? '#1890ff' : '#d9d9d9'}`,
                        background: checked ? '#1890ff' : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}>
                        {checked && <Check size={10} color="#fff" strokeWidth={2.5} />}
                      </div>
                      <span style={{ fontSize: 13, color: checked ? '#1890ff' : '#333' }}>
                        {item.label}
                      </span>
                    </div>
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
            <div style={{ padding: '0 12px 8px', fontSize: 11, color: '#aaa' }}>
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
                    {!isTime && <RemoveBtn onRemove={() => toggleDim(key)} />}
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
        <span
          onClick={handleClear}
          style={{ fontSize: 12, color: '#1890ff', cursor: 'pointer', userSelect: 'none' }}
          onMouseEnter={e => (e.currentTarget as HTMLSpanElement).style.color = '#40a9ff'}
          onMouseLeave={e => (e.currentTarget as HTMLSpanElement).style.color = '#1890ff'}
        >
          清空
        </span>
      </div>
    </div>
  );
}

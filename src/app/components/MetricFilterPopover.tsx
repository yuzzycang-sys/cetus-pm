import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { ChevronRight } from 'lucide-react';
import { Button, Input, InputNumber, Select, Modal } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
} from '@ant-design/icons';

// ── Public types ───────────────────────────────────────────────
export type MetricOperator = '>' | '<' | '>=' | '<=' | '=' | 'between';

export interface FilterCondition {
  id: string;
  metricKey: string;
  operator: MetricOperator;
  value: number;
  value2: number; // used only when operator === 'between'
}

// Conditions within a group are always AND; groups are always OR
export interface FilterGroup {
  id: string;
  conditions: FilterCondition[];
}

export interface FilterCombination {
  id: string;
  name: string;
  groups: FilterGroup[];
}

// ── Metric groups ──────────────────────────────────────────────
const METRIC_GROUPS = [
  {
    label: '消耗类',
    metrics: [
      { key: 'spend',         label: '消耗' },
      { key: 'newDevices',    label: '新增设备' },
      { key: 'newDeviceCost', label: '新增成本' },
      { key: 'newPaidUsers',  label: '新增付费用户' },
      { key: 'newPaidCost',   label: '新增付费成本' },
    ],
  },
  {
    label: 'LTV类',
    metrics: [
      { key: 'ltv1',  label: 'LTV_1'  },
      { key: 'ltv3',  label: 'LTV_3'  },
      { key: 'ltv7',  label: 'LTV_7'  },
      { key: 'ltv15', label: 'LTV_15' },
      { key: 'ltv30', label: 'LTV_30' },
      { key: 'ltv60', label: 'LTV_60' },
    ],
  },
  {
    label: 'ROI类',
    metrics: [
      { key: 'roi1',  label: 'ROI_1'  },
      { key: 'roi2',  label: 'ROI_2'  },
      { key: 'roi3',  label: 'ROI_3'  },
      { key: 'roi7',  label: 'ROI_7'  },
      { key: 'roi15', label: 'ROI_15' },
      { key: 'roi30', label: 'ROI_30' },
      { key: 'roi60', label: 'ROI_60' },
    ],
  },
];

// Flat map for label lookup
const ALL_METRICS = METRIC_GROUPS.flatMap(g => g.metrics);
function metricLabel(key: string) {
  return ALL_METRICS.find(m => m.key === key)?.label ?? key;
}
function metricGroupLabel(key: string) {
  return METRIC_GROUPS.find(g => g.metrics.some(m => m.key === key))?.label ?? '';
}

const OPERATORS: { key: MetricOperator; label: string }[] = [
  { key: '>',       label: '>'   },
  { key: '<',       label: '<'   },
  { key: '>=',      label: '≥'   },
  { key: '<=',      label: '≤'   },
  { key: '=',       label: '='   },
  { key: 'between', label: '区间' },
];

// ── helpers ────────────────────────────────────────────────────
function genId() { return Math.random().toString(36).slice(2, 9); }

function makeCondition(): FilterCondition {
  return { id: genId(), metricKey: 'spend', operator: '>', value: 0, value2: 0 };
}

function makeGroup(): FilterGroup {
  return { id: genId(), conditions: [makeCondition()] };
}

// ── Filter combination dropdown ────────────────────────────────
interface PopoverProps {
  combinations: FilterCombination[];
  activeId: string | null;
  anchorRect: DOMRect;
  onSelect: (id: string | null) => void;
  onEdit:   (combo: FilterCombination) => void;
  onDelete: (id: string) => void;
  onNew:    () => void;
  onClose:  () => void;
}

export function MetricFilterPopover({
  combinations, activeId, anchorRect,
  onSelect, onEdit, onDelete, onNew, onClose,
}: PopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const t = setTimeout(() => document.addEventListener('mousedown', h), 0);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', h); };
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: anchorRect.bottom + 4,
        left: anchorRect.left,
        zIndex: 2000,
        minWidth: 240,
        background: '#fff',
        borderRadius: 6,
        boxShadow: '0 4px 20px rgba(0,0,0,0.14)',
        border: '1px solid #e8e8e8',
        overflow: 'hidden',
      }}
    >
      {/* 全部（不筛选） */}
      <DropdownItem
        label="全部（不筛选）"
        active={activeId === null}
        onClick={() => { onSelect(null); onClose(); }}
      />

      {/* Combination rows */}
      {combinations.map(combo => (
        <CombinationItem
          key={combo.id}
          combo={combo}
          active={activeId === combo.id}
          onSelect={() => { onSelect(combo.id); onClose(); }}
          onEdit={() => onEdit(combo)}
          onDelete={() => onDelete(combo.id)}
        />
      ))}

      {/* New */}
      <div style={{
        borderTop: combinations.length > 0 ? '1px solid #f0f0f0' : 'none',
        padding: '4px 8px',
      }}>
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={onNew}
          block
          style={{ fontSize: 13, color: '#1890ff', borderColor: '#91caff' }}
        >
          新建组合
        </Button>
      </div>
    </div>
  );
}

function DropdownItem({ label, active, onClick }: {
  label: string; active: boolean; onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '9px 14px', fontSize: 13, cursor: 'pointer',
        color: active ? '#1890ff' : '#333',
        background: active ? '#e6f7ff' : hov ? '#f5f5f5' : 'transparent',
        borderBottom: '1px solid #f5f5f5',
      }}
    >
      <div style={{ width: 14, flexShrink: 0, lineHeight: 0 }}>
        {active && <CheckOutlined style={{ fontSize: 13, color: '#1890ff' }} />}
      </div>
      {label}
    </div>
  );
}

function CombinationItem({ combo, active, onSelect, onEdit, onDelete }: {
  combo: FilterCombination; active: boolean;
  onSelect: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center',
        background: active ? '#e6f7ff' : hov ? '#f5f5f5' : 'transparent',
        borderBottom: '1px solid #f5f5f5',
      }}
    >
      <div
        onClick={onSelect}
        style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 6,
          padding: '9px 14px', fontSize: 13, cursor: 'pointer',
          color: active ? '#1890ff' : '#333',
        }}
      >
        <div style={{ width: 14, flexShrink: 0, lineHeight: 0 }}>
          {active && <CheckOutlined style={{ fontSize: 13, color: '#1890ff' }} />}
        </div>
        <span>{combo.name}</span>
      </div>
      <div style={{ display: 'flex', gap: 2, paddingRight: 8, opacity: hov ? 1 : 0, transition: 'opacity 0.15s' }}>
        <Button
          type="text"
          size="small"
          icon={<EditOutlined />}
          onClick={e => { e.stopPropagation(); onEdit(); }}
          style={{ color: '#bbb', padding: 4 }}
        />
        <Button
          type="text"
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={e => { e.stopPropagation(); onDelete(); }}
          style={{ padding: 4 }}
        />
      </div>
    </div>
  );
}

// ── Cascading metric selector ──────────────────────────────────
function MetricCascadeSelect({ value, onChange }: {
  value: string;
  onChange: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [hoveredGroup, setHoveredGroup] = useState(
    () => metricGroupLabel(value) || METRIC_GROUPS[0].label
  );
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef   = useRef<HTMLDivElement>(null);

  // Outside click
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        !triggerRef.current?.contains(t) &&
        !panelRef.current?.contains(t)
      ) setOpen(false);
    };
    const id = setTimeout(() => document.addEventListener('mousedown', h), 0);
    return () => { clearTimeout(id); document.removeEventListener('mousedown', h); };
  }, [open]);

  // Position
  const [rect, setRect] = useState<DOMRect | null>(null);
  const handleOpen = () => {
    if (open) { setOpen(false); return; }
    if (triggerRef.current) setRect(triggerRef.current.getBoundingClientRect());
    setHoveredGroup(metricGroupLabel(value) || METRIC_GROUPS[0].label);
    setOpen(true);
  };

  const currentGroup = METRIC_GROUPS.find(g => g.label === hoveredGroup) ?? METRIC_GROUPS[0];

  return (
    <>
      <div
        ref={triggerRef}
        onClick={handleOpen}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: 148, padding: '5px 8px',
          border: `1px solid ${open ? '#1890ff' : '#d9d9d9'}`,
          borderRadius: 6, cursor: 'pointer', fontSize: 13,
          background: '#fff', flexShrink: 0, gap: 4,
          boxSizing: 'border-box',
        }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {metricLabel(value)}
        </span>
        <ChevronRight
          size={12}
          color="#aaa"
          style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}
        />
      </div>

      {open && rect && (
        <div
          ref={panelRef}
          style={{
            position: 'fixed',
            top: rect.bottom + 2,
            left: rect.left,
            zIndex: 4000,
            display: 'flex',
            background: '#fff',
            borderRadius: 6,
            boxShadow: '0 6px 24px rgba(0,0,0,0.16)',
            border: '1px solid #e8e8e8',
            overflow: 'hidden',
          }}
        >
          {/* Left: categories */}
          <div style={{ width: 96, borderRight: '1px solid #f0f0f0', padding: '4px 0' }}>
            {METRIC_GROUPS.map(g => (
              <div
                key={g.label}
                onMouseEnter={() => setHoveredGroup(g.label)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '7px 10px', fontSize: 12, cursor: 'pointer',
                  background: hoveredGroup === g.label ? '#e6f7ff' : 'transparent',
                  color: hoveredGroup === g.label ? '#1890ff' : '#555',
                  fontWeight: hoveredGroup === g.label ? 500 : 400,
                }}
              >
                <span>{g.label}</span>
                <ChevronRight size={11} color={hoveredGroup === g.label ? '#1890ff' : '#ccc'} />
              </div>
            ))}
          </div>

          {/* Right: metrics */}
          <div style={{ width: 112, padding: '4px 0' }}>
            {currentGroup.metrics.map(m => (
              <div
                key={m.key}
                onClick={() => { onChange(m.key); setOpen(false); }}
                style={{
                  padding: '7px 10px', fontSize: 12, cursor: 'pointer',
                  background: value === m.key ? '#e6f7ff' : 'transparent',
                  color: value === m.key ? '#1890ff' : '#333',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
                onMouseEnter={e => {
                  if (value !== m.key) (e.currentTarget as HTMLDivElement).style.background = '#f5f5f5';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.background = value === m.key ? '#e6f7ff' : 'transparent';
                }}
              >
                <span>{m.label}</span>
                {value === m.key && <CheckOutlined style={{ fontSize: 11, color: '#1890ff' }} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ── Edit Modal ─────────────────────────────────────────────────
interface EditModalProps {
  initial: FilterCombination | null; // null = creating new
  onSave:  (combo: FilterCombination) => void;
  onClose: () => void;
}

export function MetricFilterEditModal({ initial, onSave, onClose }: EditModalProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [groups, setGroups] = useState<FilterGroup[]>(
    initial?.groups && initial.groups.length > 0 ? initial.groups : [makeGroup()]
  );

  // ── group ops ────────────────────
  const addGroup    = () => setGroups(p => [...p, makeGroup()]);
  const removeGroup = (gid: string) => {
    if (groups.length <= 1) return;
    setGroups(p => p.filter(g => g.id !== gid));
  };

  // ── condition ops ────────────────
  const addCondition = (gid: string) =>
    setGroups(p => p.map(g =>
      g.id === gid ? { ...g, conditions: [...g.conditions, makeCondition()] } : g
    ));

  const removeCondition = (gid: string, cid: string) =>
    setGroups(p => p.map(g => {
      if (g.id !== gid || g.conditions.length <= 1) return g;
      return { ...g, conditions: g.conditions.filter(c => c.id !== cid) };
    }));

  const updateCondition = (gid: string, cid: string, patch: Partial<FilterCondition>) =>
    setGroups(p => p.map(g =>
      g.id !== gid ? g : {
        ...g,
        conditions: g.conditions.map(c => c.id === cid ? { ...c, ...patch } : c),
      }
    ));

  const canSave = name.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({ id: initial?.id ?? genId(), name: name.trim(), groups });
  };

  return (
    <Modal
      open
      title={initial ? '编辑筛选组合' : '新建筛选组合'}
      onCancel={onClose}
      width={680}
      styles={{ body: { maxHeight: '60vh', overflowY: 'auto', padding: '18px 20px' } }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onClose}>取消</Button>
          <Button
            type="primary"
            disabled={!canSave}
            onClick={handleSave}
          >
            保存
          </Button>
        </div>
      }
    >
      {/* Name */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: '#555', marginBottom: 6 }}>
          组合名称 <span style={{ color: '#ff4d4f' }}>*</span>
        </div>
        <Input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="请输入组合名称，如「高消耗ROI达标」"
          status={name.trim() ? undefined : 'error'}
          style={{ fontSize: 13 }}
        />
      </div>

      {/* Condition groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {groups.map((group, gi) => (
          <React.Fragment key={group.id}>
            {gi > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0' }}>
                <div style={{ flex: 1, height: 1, background: '#eee' }} />
                <span style={{
                  fontSize: 11, color: '#fff', background: '#fa8c16',
                  padding: '2px 10px', borderRadius: 10, fontWeight: 700, letterSpacing: 1,
                }}>OR</span>
                <div style={{ flex: 1, height: 1, background: '#eee' }} />
              </div>
            )}
            <GroupCard
              group={group}
              canRemove={groups.length > 1}
              onRemove={() => removeGroup(group.id)}
              onAddCondition={() => addCondition(group.id)}
              onUpdateCondition={(cid, patch) => updateCondition(group.id, cid, patch)}
              onRemoveCondition={cid => removeCondition(group.id, cid)}
            />
          </React.Fragment>
        ))}
      </div>

      {/* Add group */}
      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={addGroup}
        style={{
          marginTop: 14, fontSize: 13,
          color: '#1890ff', borderColor: '#91caff', background: '#f0f7ff',
        }}
      >
        添加条件组（条件组之间为 OR 关系）
      </Button>
    </Modal>
  );
}

// ── Group card ─────────────────────────────────────────────────
function GroupCard({ group, canRemove, onRemove, onAddCondition, onUpdateCondition, onRemoveCondition }: {
  group: FilterGroup;
  canRemove: boolean;
  onRemove: () => void;
  onAddCondition: () => void;
  onUpdateCondition: (cid: string, patch: Partial<FilterCondition>) => void;
  onRemoveCondition: (cid: string) => void;
}) {
  return (
    <div style={{
      border: '1px solid #e8e8e8', borderRadius: 6,
      background: '#fafafa', padding: '12px 14px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontSize: 11, color: '#1890ff', background: '#e6f7ff',
            padding: '2px 8px', borderRadius: 4, fontWeight: 600, letterSpacing: 0.5,
          }}>AND</span>
          <span style={{ fontSize: 12, color: '#aaa' }}>组内条件全部满足</span>
        </div>
        {canRemove && (
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            title="删除该条件组"
            onClick={onRemove}
            style={{ color: '#ccc', padding: 2 }}
          />
        )}
      </div>

      {/* Conditions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {group.conditions.map((cond) => (
          <ConditionRow
            key={cond.id}
            condition={cond}
            canRemove={group.conditions.length > 1}
            onChange={patch => onUpdateCondition(cond.id, patch)}
            onRemove={() => onRemoveCondition(cond.id)}
          />
        ))}
      </div>

      {/* Add condition */}
      <Button
        type="link"
        size="small"
        icon={<PlusOutlined />}
        onClick={onAddCondition}
        style={{
          marginTop: 10, paddingTop: 8,
          borderTop: '1px dashed #e8e8e8', width: '100%',
          fontSize: 12, color: '#1890ff',
          display: 'flex', alignItems: 'center',
          borderRadius: 0,
        }}
      >
        添加条件
      </Button>
    </div>
  );
}

// ── Condition row ──────────────────────────────────────────────
function ConditionRow({ condition, canRemove, onChange, onRemove }: {
  condition: FilterCondition;
  canRemove: boolean;
  onChange: (patch: Partial<FilterCondition>) => void;
  onRemove: () => void;
}) {
  const isBetween = condition.operator === 'between';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {/* Metric — cascading selector */}
      <MetricCascadeSelect
        value={condition.metricKey}
        onChange={key => onChange({ metricKey: key })}
      />

      {/* Operator */}
      <Select
        value={condition.operator}
        onChange={val => onChange({ operator: val as MetricOperator })}
        style={{ width: 72, fontSize: 13, flexShrink: 0 }}
        size="middle"
        options={OPERATORS.map(op => ({ value: op.key, label: op.label }))}
      />

      {/* Value(s) */}
      {isBetween ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <InputNumber
            value={condition.value === 0 ? undefined : condition.value}
            placeholder="0"
            onChange={v => onChange({ value: v ?? 0 })}
            style={{ width: 88, fontSize: 13, flexShrink: 0 }}
            controls={false}
          />
          <span style={{ fontSize: 12, color: '#aaa', flexShrink: 0 }}>~</span>
          <InputNumber
            value={condition.value2 === 0 ? undefined : condition.value2}
            placeholder="0"
            onChange={v => onChange({ value2: v ?? 0 })}
            style={{ width: 88, fontSize: 13, flexShrink: 0 }}
            controls={false}
          />
        </div>
      ) : (
        <InputNumber
          value={condition.value === 0 ? undefined : condition.value}
          placeholder="0"
          onChange={v => onChange({ value: v ?? 0 })}
          style={{ width: 88, fontSize: 13, flexShrink: 0 }}
          controls={false}
        />
      )}

      {/* Remove */}
      <div style={{ width: 20, flexShrink: 0 }}>
        {canRemove && (
          <Button
            type="text"
            size="small"
            danger
            onClick={onRemove}
            style={{ color: '#ccc', padding: 0, height: 'auto', lineHeight: 1 }}
            icon={<span style={{ fontSize: 14 }}>×</span>}
          />
        )}
      </div>
    </div>
  );
}

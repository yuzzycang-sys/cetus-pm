import React, { useState, useRef } from 'react';
import { Settings2, Columns3, Filter, LayoutList, LayoutGrid } from 'lucide-react';
import { AggregateDimensionPopover } from './AggregateDimensionPopover';
import { MetricFilterPopover, MetricFilterEditModal } from './MetricFilterPopover';
import { LocalFilterPopover } from './LocalFilterPopover';
import type { FilterCombination } from './MetricFilterPopover';
import type { LocalFilters } from './LocalFilterPopover';

const F = "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif";

interface Props {
  timeGranularity: 'day' | 'week' | 'month';
  onChangeGranularity: (g: 'day' | 'week' | 'month') => void;
  activeDims: string[];
  onChangeDims: (dims: string[]) => void;
  viewMode: 'list' | 'grid';
  onChangeViewMode: (m: 'list' | 'grid') => void;
  mergeView: boolean;
  onChangeMergeView: (v: boolean) => void;
  onQuery: () => void;
  onExport: () => void;
  filterCombinations: FilterCombination[];
  activeFilterId: string | null;
  onSelectFilter: (id: string | null) => void;
  onSaveFilter: (combo: FilterCombination) => void;
  onDeleteFilter: (id: string) => void;
  localFilters: LocalFilters;
  onChangeLocalFilters: (next: LocalFilters) => void;
}

export function TableToolBar({
  timeGranularity, onChangeGranularity,
  activeDims, onChangeDims,
  viewMode, onChangeViewMode,
  mergeView, onChangeMergeView,
  onQuery, onExport,
  filterCombinations, activeFilterId,
  onSelectFilter, onSaveFilter, onDeleteFilter,
  localFilters, onChangeLocalFilters,
}: Props) {
  const [showAggDim, setShowAggDim] = useState(false);
  const aggDimRef = useRef<HTMLDivElement>(null);

  const [showFilterPop, setShowFilterPop] = useState(false);
  const filterBtnRef = useRef<HTMLDivElement>(null);
  const [filterAnchorRect, setFilterAnchorRect] = useState<DOMRect | null>(null);

  const [showLocalFilter, setShowLocalFilter] = useState(false);
  const localFilterBtnRef = useRef<HTMLDivElement>(null);
  const [localFilterAnchorRect, setLocalFilterAnchorRect] = useState<DOMRect | null>(null);

  // undefined = modal closed; null = creating new; FilterCombination = editing existing
  const [editingCombo, setEditingCombo] = useState<FilterCombination | null | undefined>(undefined);

  const handleOpenFilterPop = () => {
    if (showFilterPop) { setShowFilterPop(false); return; }
    if (filterBtnRef.current) {
      setFilterAnchorRect(filterBtnRef.current.getBoundingClientRect());
    }
    setShowFilterPop(true);
  };

  const handleOpenLocalFilter = () => {
    if (showLocalFilter) { setShowLocalFilter(false); return; }
    if (localFilterBtnRef.current) {
      setLocalFilterAnchorRect(localFilterBtnRef.current.getBoundingClientRect());
    }
    setShowLocalFilter(true);
  };

  const handleNew = () => {
    setShowFilterPop(false);
    setEditingCombo(null);
  };

  const handleEdit = (combo: FilterCombination) => {
    setShowFilterPop(false);
    setEditingCombo(combo);
  };

  const handleDelete = (id: string) => {
    onDeleteFilter(id);
    if (activeFilterId === id) onSelectFilter(null);
  };

  const handleSaveCombo = (combo: FilterCombination) => {
    onSaveFilter(combo);
    setEditingCombo(undefined);
  };

  const isFilterActive = activeFilterId !== null;
  const activeComboName = isFilterActive
    ? (filterCombinations.find(c => c.id === activeFilterId)?.name ?? '')
    : '';

  const localFilterCount = Object.keys(localFilters).length;

  const GRAN_OPTS: { key: 'day' | 'week' | 'month'; label: string }[] = [
    { key: 'day',   label: '日' },
    { key: 'week',  label: '周' },
    { key: 'month', label: '月' },
  ];

  return (
    <>
      <div style={{
        height: 40, display: 'flex', alignItems: 'center',
        borderBottom: '1px solid #dee0e3', padding: '0 16px',
        background: 'transparent', flexShrink: 0, fontFamily: F,
        justifyContent: 'space-between',
      }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Time granularity */}
          <span style={{ fontSize: 12, color: '#646a73', marginRight: 4 }}>时度</span>
          <div style={{ display: 'flex', border: '1px solid #dee0e3', borderRadius: 4, overflow: 'hidden' }}>
            {GRAN_OPTS.map(opt => (
              <div
                key={opt.key}
                onClick={() => onChangeGranularity(opt.key)}
                style={{
                  padding: '4px 10px', fontSize: 12, cursor: 'pointer',
                  background: timeGranularity === opt.key ? '#3370ff' : '#fff',
                  color: timeGranularity === opt.key ? '#fff' : '#646a73',
                  borderRight: opt.key !== 'month' ? '1px solid #dee0e3' : 'none',
                }}
              >
                {opt.label}
              </div>
            ))}
          </div>

          <div style={{ width: 1, height: 16, background: '#dee0e3', margin: '0 4px' }} />

          {/* Aggregate dimension */}
          <div ref={aggDimRef} style={{ position: 'relative' }}>
            {(() => {
              const userDimCount = activeDims.filter(k => k !== 'time').length;
              return (
                <ToolbarBtn
                  icon={<Settings2 size={13} />}
                  label={userDimCount > 0 ? `聚合维度 · ${userDimCount}` : '聚合维度'}
                  onClick={() => setShowAggDim(v => !v)}
                  active={showAggDim || userDimCount > 0}
                />
              );
            })()}
            {showAggDim && (
              <AggregateDimensionPopover
                activeDims={activeDims}
                onChangeDims={onChangeDims}
                onClose={() => setShowAggDim(false)}
                timeGranularity={timeGranularity}
              />
            )}
          </div>

          {/* Custom columns */}
          <ToolbarBtn icon={<Columns3 size={13} />} label="自定义列" onClick={() => {}} />

          {/* Metric filter */}
          <div ref={filterBtnRef}>
            <ToolbarBtn
              icon={<Filter size={13} />}
              label={isFilterActive ? `指标筛选 · ${activeComboName}` : '指标筛选'}
              onClick={handleOpenFilterPop}
              active={showFilterPop || isFilterActive}
            />
          </div>

          {/* Local filter */}
          <div ref={localFilterBtnRef}>
            <ToolbarBtn
              icon={<Filter size={13} />}
              label={localFilterCount > 0 ? `局部筛选 · ${localFilterCount}` : '局部筛选'}
              onClick={handleOpenLocalFilter}
              active={showLocalFilter || localFilterCount > 0}
            />
          </div>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', border: '1px solid #dee0e3', borderRadius: 6, overflow: 'hidden' }}>
            <div
              onClick={() => onChangeMergeView(false)}
              title="普通视图"
              style={{ padding: '4px 8px', cursor: 'pointer', lineHeight: 0, background: !mergeView ? '#e8f0ff' : '#fff' }}
            >
              <LayoutList size={14} color={!mergeView ? '#3370ff' : '#8f959e'} />
            </div>
            <div
              onClick={() => onChangeMergeView(true)}
              title="聚合视图"
              style={{ padding: '4px 8px', cursor: 'pointer', lineHeight: 0, borderLeft: '1px solid #dee0e3', background: mergeView ? '#e8f0ff' : '#fff' }}
            >
              <LayoutGrid size={14} color={mergeView ? '#3370ff' : '#8f959e'} />
            </div>
          </div>

          <button
            onClick={onQuery}
            style={{ padding: '0 16px', height: 28, background: '#3370ff', color: '#fff', border: 'none', borderRadius: 4, fontSize: 13, cursor: 'pointer', fontFamily: F }}
          >
            查询
          </button>

          <button
            onClick={onExport}
            style={{ padding: '0 16px', height: 28, background: '#fff', color: '#3370ff', border: '1px solid #3370ff', borderRadius: 4, fontSize: 13, cursor: 'pointer', fontFamily: F }}
          >
            导出
          </button>
        </div>
      </div>

      {/* Metric filter dropdown */}
      {showFilterPop && filterAnchorRect && (
        <MetricFilterPopover
          combinations={filterCombinations}
          activeId={activeFilterId}
          anchorRect={filterAnchorRect}
          onSelect={id => { onSelectFilter(id); setShowFilterPop(false); }}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onNew={handleNew}
          onClose={() => setShowFilterPop(false)}
        />
      )}

      {/* Edit modal */}
      {editingCombo !== undefined && (
        <MetricFilterEditModal
          initial={editingCombo}
          onSave={handleSaveCombo}
          onClose={() => setEditingCombo(undefined)}
        />
      )}

      {/* Local filter popover */}
      {showLocalFilter && localFilterAnchorRect && (
        <LocalFilterPopover
          localFilters={localFilters}
          onChangeFilters={onChangeLocalFilters}
          anchorRect={localFilterAnchorRect}
          onClose={() => setShowLocalFilter(false)}
        />
      )}
    </>
  );
}

function ToolbarBtn({ icon, label, onClick, active }: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 13,
        color: active || hovered ? '#3370ff' : '#646a73',
        background: active ? '#e8f0ff' : hovered ? '#f5f6f7' : 'transparent',
        border: `1px solid ${active ? '#3370ff' : 'transparent'}`,
        maxWidth: 220,
      }}
    >
      {icon}
      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
    </div>
  );
}
import React, { useState, useRef } from 'react';
import { Button, Divider, Space, Segmented } from 'antd';
import { Settings2, Columns3, Filter, LayoutList, LayoutGrid } from 'lucide-react';
import { AggregateDimensionPopover } from './AggregateDimensionPopover';
import { MetricFilterPopover, MetricFilterEditModal } from './MetricFilterPopover';
import { LocalFilterPopover } from './LocalFilterPopover';
import type { FilterCombination } from './MetricFilterPopover';
import type { LocalFilters } from './LocalFilterPopover';

interface Props {
  timeGranularity: 'day' | 'week' | 'month' | 'total';
  onChangeGranularity: (g: 'day' | 'week' | 'month' | 'total') => void;
  activeDims: string[];
  onChangeDims: (dims: string[]) => void;
  onApplyDimsToName?: (dims: string[]) => void;
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
  dimAutoUpdate: boolean;
  onChangeDimAutoUpdate: (v: boolean) => void;
  queryDisabled?: boolean;
}

export function TableToolBar({
  timeGranularity, onChangeGranularity,
  activeDims, onChangeDims, onApplyDimsToName,
  viewMode, onChangeViewMode,
  mergeView, onChangeMergeView,
  onQuery, onExport,
  filterCombinations, activeFilterId,
  onSelectFilter, onSaveFilter, onDeleteFilter,
  localFilters, onChangeLocalFilters,
  dimAutoUpdate, onChangeDimAutoUpdate,
  queryDisabled,
}: Props) {
  const [showAggDim, setShowAggDim] = useState(false);
  const [aggDimOrderMode, setAggDimOrderMode] = useState<'default' | 'custom'>('default');
  const aggDimRef = useRef<HTMLDivElement>(null);

  const [showFilterPop, setShowFilterPop] = useState(false);
  const filterBtnRef = useRef<HTMLDivElement>(null);
  const [filterAnchorRect, setFilterAnchorRect] = useState<DOMRect | null>(null);

  const [showLocalFilter, setShowLocalFilter] = useState(false);
  const localFilterBtnRef = useRef<HTMLDivElement>(null);
  const [localFilterAnchorRect, setLocalFilterAnchorRect] = useState<DOMRect | null>(null);

  // undefined = modal closed; null = creating new; FilterCombination = editing existing
  const [editingCombo, setEditingCombo] = useState<FilterCombination | null | undefined>(undefined);
  // Temporary filter applied without saving as a template
  const [tempFilter, setTempFilter] = useState<FilterCombination | null>(null);

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
    onSelectFilter(combo.id);
    setTempFilter(null);
    setEditingCombo(undefined);
  };

  const handleApplyTemp = (combo: FilterCombination) => {
    setTempFilter(combo);
    onSelectFilter(null);
    setEditingCombo(undefined);
  };

  const isFilterActive = activeFilterId !== null || tempFilter !== null;
  const activeComboName = activeFilterId
    ? (filterCombinations.find(c => c.id === activeFilterId)?.name ?? '')
    : tempFilter ? '自定义' : '';

  const localFilterCount = Object.values(localFilters).filter(v => (v.values?.length ?? 0) > 0).length;

  return (
    <>
      <div style={{
        height: 40, display: 'flex', alignItems: 'center',
        padding: '0 16px',
        background: 'transparent', flexShrink: 0,
        justifyContent: 'space-between',
      }}>
        {/* Left */}
        <Space size={4} align="center">
          {/* Time granularity */}
          <span style={{ fontSize: 12, color: '#8c8c8c' }}>时度</span>
          <GranularityPicker value={timeGranularity} onChange={onChangeGranularity} />

          <Divider type="vertical" style={{ margin: '0 4px' }} />

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
                orderMode={aggDimOrderMode}
                onOrderModeChange={setAggDimOrderMode}
                onApplyDimsToName={onApplyDimsToName}
                autoUpdate={dimAutoUpdate}
                onAutoUpdateChange={onChangeDimAutoUpdate}
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
        </Space>

        {/* Right */}
        <Space size={8} align="center">
          <ViewModePicker value={mergeView ? 'merge' : 'normal'} onChange={v => onChangeMergeView(v === 'merge')} />

          <Button type="primary" size="small" onClick={onQuery} disabled={queryDisabled} style={{ padding: '0 14px', fontSize: 12, height: 28 }}>
            查 询
          </Button>

          <Button size="small" onClick={onExport} style={{ padding: '0 14px', fontSize: 12, height: 28 }}>
            导出
          </Button>
        </Space>
      </div>

      {/* Metric filter dropdown */}
      {showFilterPop && filterAnchorRect && (
        <MetricFilterPopover
          combinations={filterCombinations}
          activeId={activeFilterId}
          hasTempFilter={!!tempFilter}
          anchorRect={filterAnchorRect}
          onSelect={id => { onSelectFilter(id); setTempFilter(null); setShowFilterPop(false); }}
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
          onApply={handleApplyTemp}
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
  return (
    <Button
      type="default"
      size="small"
      onClick={onClick}
      style={{
        maxWidth: 220,
        fontSize: 12,
        height: 28,
        padding: '0 10px',
        display: 'inline-flex',
        alignItems: 'center',
        color: 'rgba(0,0,0,0.88)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: active ? '#1677ff' : 'inherit', display: 'inline-flex', alignItems: 'center' }}>
          {icon}
        </span>
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {label}
        </span>
      </span>
    </Button>
  );
}

function GranularityPicker({ value, onChange }: {
  value: 'day' | 'week' | 'month' | 'total';
  onChange: (v: 'day' | 'week' | 'month' | 'total') => void;
}) {
  return (
    <>
      <style>{`
        .gran-seg .ant-segmented-item { font-size: 12px !important; font-weight: 400 !important; color: #595959; }
        .gran-seg .ant-segmented-item-selected { color: #1677ff !important; font-weight: 400 !important; }
        .gran-seg .ant-segmented-item-label { font-size: 12px !important; min-height: unset; }
      `}</style>
      <Segmented
        size="small"
        value={value}
        onChange={v => onChange(v as 'day' | 'week' | 'month' | 'total')}
        options={[
          { label: '天', value: 'day' },
          { label: '周', value: 'week' },
          { label: '月', value: 'month' },
          { label: '总', value: 'total' },
        ]}
        className="gran-seg"
      />
    </>
  );
}

function ViewModePicker({ value, onChange }: {
  value: 'normal' | 'merge';
  onChange: (v: 'normal' | 'merge') => void;
}) {
  return (
    <>
      <style>{`
        .view-seg .ant-segmented-item { font-size: 12px !important; font-weight: 400 !important; color: #595959; }
        .view-seg .ant-segmented-item-selected { color: #1677ff !important; font-weight: 400 !important; }
        .view-seg .ant-segmented-item-label { font-size: 12px !important; min-height: unset; display: inline-flex; align-items: center; justify-content: center; }
      `}</style>
      <Segmented
        size="small"
        value={value}
        onChange={v => onChange(v as 'normal' | 'merge')}
        options={[
          { value: 'normal', title: '普通视图', icon: <LayoutList size={14} /> },
          { value: 'merge',  title: '聚合视图', icon: <LayoutGrid size={14} /> },
        ]}
        className="view-seg"
      />
    </>
  );
}


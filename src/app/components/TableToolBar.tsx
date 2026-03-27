import React, { useState, useRef } from 'react';
import { Button, Radio, Divider, Space } from 'antd';
import { Settings2, Columns3, Filter, LayoutList, LayoutGrid } from 'lucide-react';
import { AggregateDimensionPopover } from './AggregateDimensionPopover';
import { MetricFilterPopover, MetricFilterEditModal } from './MetricFilterPopover';
import { LocalFilterPopover } from './LocalFilterPopover';
import type { FilterCombination } from './MetricFilterPopover';
import type { LocalFilters } from './LocalFilterPopover';

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

  return (
    <>
      <div style={{
        height: 40, display: 'flex', alignItems: 'center',
        borderBottom: '1px solid #d9d9d9', padding: '0 16px',
        background: 'transparent', flexShrink: 0,
        justifyContent: 'space-between',
      }}>
        {/* Left */}
        <Space size={4} align="center">
          {/* Time granularity */}
          <span style={{ fontSize: 12, color: '#595959' }}>时度</span>
          <Radio.Group
            size="small"
            value={timeGranularity}
            onChange={e => onChangeGranularity(e.target.value)}
            optionType="button"
            buttonStyle="solid"
          >
            <Radio.Button value="day">日</Radio.Button>
            <Radio.Button value="week">周</Radio.Button>
            <Radio.Button value="month">月</Radio.Button>
          </Radio.Group>

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
          <Radio.Group
            size="small"
            value={mergeView ? 'merge' : 'normal'}
            onChange={e => onChangeMergeView(e.target.value === 'merge')}
            optionType="button"
          >
            <Radio.Button value="normal" title="普通视图" style={{ lineHeight: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <LayoutList size={14} />
            </Radio.Button>
            <Radio.Button value="merge" title="聚合视图" style={{ lineHeight: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <LayoutGrid size={14} />
            </Radio.Button>
          </Radio.Group>

          <Button type="primary" size="middle" onClick={onQuery} style={{ padding: '0 16px' }}>
            查询
          </Button>

          <Button size="middle" onClick={onExport} style={{ padding: '0 16px' }}>
            导出
          </Button>
        </Space>
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
  return (
    <Button
      type={active ? 'primary' : 'text'}
      ghost={active}
      size="middle"
      icon={icon}
      onClick={onClick}
      style={{
        maxWidth: 220,
        display: 'inline-flex',
        alignItems: 'center',
      }}
    >
      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {label}
      </span>
    </Button>
  );
}

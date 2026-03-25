import React, { useState, useRef } from 'react';
import { Filter, Calendar } from 'lucide-react';
import { AllFiltersPopover } from './AllFiltersPopover';
import { DateRangePicker } from './DateRangePicker';
import { PriceRangePicker } from './PriceRangePicker';
import { MultiSelectChip } from './MultiSelectChip';
import { AccountInputChip } from './AccountInputChip';
const TEXT_INPUT_KEYS = new Set(['accountId', 'adId']);
import { FILTER_CHIP_DATA } from './filterConfig';

const F = "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif";

interface Props {
  activeFilters: string[];
  onToggleFilter: (key: string) => void;
  dateStart: string;
  dateEnd: string;
  onDateChange: (start: string, end: string) => void;
  filterSelections: Record<string, string[]>;
  onFilterSelect: (key: string, selected: string[]) => void;
  priceRange?: { min: string; max: string; roiMin: string; roiMax: string };
  onPriceRangeChange?: (min: string, max: string, roiMin: string, roiMax: string) => void;
  channelLocked?: boolean;
  onChannelLockedClick?: () => void;
}

export function FilterBar({
  activeFilters, onToggleFilter,
  dateStart, dateEnd, onDateChange,
  filterSelections, onFilterSelect,
  priceRange = { min: '', max: '', roiMin: '', roiMax: '' },
  onPriceRangeChange,
  channelLocked, onChannelLockedClick,
}: Props) {
  const [showAllFilters, setShowAllFilters] = useState(false);
  const [allFilterPos, setAllFilterPos] = useState<{ left: number; top: number } | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerPos, setDatePickerPos] = useState<{ left: number; top: number } | null>(null);
  const [showPriceRange, setShowPriceRange] = useState(false);
  const [priceRangePos, setPriceRangePos] = useState<{ left: number; top: number } | null>(null);
  const [filterExcludes, setFilterExcludes] = useState<Record<string, boolean>>({});
  // 账号ID/名称 组件的 exclude 状态单独维护
  const [accountExclude, setAccountExclude] = useState(false);
  const filterBtnRef = useRef<HTMLButtonElement>(null);
  const dateBtnRef = useRef<HTMLButtonElement>(null);
  const priceBtnRef = useRef<HTMLButtonElement>(null);

  const handleOpenAllFilters = () => {
    if (!showAllFilters && filterBtnRef.current) {
      const r = filterBtnRef.current.getBoundingClientRect();
      setAllFilterPos({ left: r.left, top: r.bottom + 6 });
    }
    setShowAllFilters(v => !v);
  };

  const handleOpenDatePicker = () => {
    if (!showDatePicker && dateBtnRef.current) {
      const r = dateBtnRef.current.getBoundingClientRect();
      setDatePickerPos({ left: r.left, top: r.bottom + 6 });
    }
    setShowDatePicker(v => !v);
  };

  const handleOpenPriceRange = () => {
    if (!showPriceRange && priceBtnRef.current) {
      const r = priceBtnRef.current.getBoundingClientRect();
      setPriceRangePos({ left: r.left, top: r.bottom + 6 });
    }
    setShowPriceRange(v => !v);
  };

  const priceRangeSummary = (() => {
    const hasPrice = priceRange.min || priceRange.max;
    const hasRoi = priceRange.roiMin || priceRange.roiMax;
    const price = hasPrice ? `${priceRange.min || ''}～${priceRange.max || ''}` : '';
    const roi = hasRoi ? `${priceRange.roiMin || ''}～${priceRange.roiMax || ''}` : '';

    if (hasPrice && hasRoi) return `${price}, ${roi}`;
    if (hasPrice) return price;
    if (hasRoi) return roi;
    return '不限';
  })();

  const priceRangeActive = Boolean(priceRange.min || priceRange.max || priceRange.roiMin || priceRange.roiMax);

  return (
    <div style={{
      height: 44, display: 'flex', alignItems: 'center',
      borderBottom: 'none', padding: '0 16px',
      background: 'transparent', gap: 0, flexShrink: 0, fontFamily: F,
      overflowX: 'auto', overflowY: 'hidden',
    }}>
      {/* ── 所有筛选 ── */}
      <button
        ref={filterBtnRef}
        onClick={handleOpenAllFilters}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          border: `1px solid ${showAllFilters ? '#3370ff' : '#dee0e3'}`,
          borderRadius: 4, padding: '0 12px', height: 28,
          background: showAllFilters ? '#e8f0ff' : '#fff',
          cursor: 'pointer', fontSize: 13,
          color: showAllFilters ? '#3370ff' : '#1f2329',
          outline: 'none', flexShrink: 0, marginRight: 10,
        }}
      >
        <Filter size={13} color={showAllFilters ? '#3370ff' : '#8f959e'} />
        <span>所有筛选</span>
      </button>

      {/* ── 消耗时间（permanent，无竖线） ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginRight: 10 }}>
        <span style={{ fontSize: 13, color: '#646a73', whiteSpace: 'nowrap' }}>消耗时间</span>
        <button
          ref={dateBtnRef}
          onClick={handleOpenDatePicker}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            border: `1px solid ${showDatePicker ? '#3370ff' : '#dee0e3'}`,
            borderRadius: 4, padding: '0 10px', height: 28,
            background: '#fff', cursor: 'pointer', fontSize: 13,
            color: '#1f2329', outline: 'none', whiteSpace: 'nowrap',
          }}
        >
          <span>{dateStart}</span>
          <span style={{ color: '#bbb' }}>→</span>
          <span>{dateEnd}</span>
          <Calendar size={12} color="#aaa" />
        </button>
      </div>

      {/* ── Active filter chips（有竖分割线） ── */}
      {activeFilters.length > 0 && (
        <>
          <div style={{ width: 1, height: 20, background: '#dee0e3', flexShrink: 0, marginRight: 10 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {activeFilters.map(key => {
              const cfg = FILTER_CHIP_DATA[key];
              if (!cfg) {
                // Special case for priceRange
                if (key === 'priceRange') {
                  return (
                    <button
                      key={key}
                      ref={priceBtnRef}
                      onClick={handleOpenPriceRange}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        border: `1px solid ${priceRangeActive ? '#1890ff' : (showPriceRange ? '#3370ff' : '#dee0e3')}`,
                        borderRadius: 4, padding: '0 8px', height: 28,
                        background: priceRangeActive ? '#e6f7ff' : '#fff',
                        cursor: 'pointer', fontSize: 13,
                        whiteSpace: 'nowrap', outline: 'none',
                        transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ color: '#555' }}>出价范围:</span>
                      <span style={{
                        color: priceRangeActive ? '#1890ff' : '#bbb',
                        maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {priceRangeSummary}
                      </span>
                    </button>
                  );
                }
                return null;
              }

              const isLocked = !!channelLocked && (key === 'mainChannel' || key === 'subChannel');

              // 账号ID/名称：走专用文本输入组件
              if (key === 'accountId') {
                return (
                  <div key={key} style={{ position: 'relative', opacity: isLocked ? 0.45 : 1 }}>
                    <AccountInputChip
                      selected={filterSelections[key] || []}
                      onChange={sel => onFilterSelect(key, sel)}
                      exclude={accountExclude}
                      onExcludeChange={setAccountExclude}
                    />
                    {isLocked && (
                      <div onClick={e => { e.stopPropagation(); onChannelLockedClick?.(); }}
                        style={{ position: 'absolute', inset: 0, cursor: 'not-allowed', pointerEvents: 'auto' }} />
                    )}
                  </div>
                );
              }

              if (TEXT_INPUT_KEYS.has(key)) {
                const entityLabel = key === 'adId' ? '广告' : '账号';
                return (
                  <div key={key} style={{ position: 'relative', opacity: isLocked ? 0.45 : 1 }}>
                    <AccountInputChip
                      entityLabel={entityLabel}
                      selected={filterSelections[key] || []}
                      onChange={sel => onFilterSelect(key, sel)}
                      exclude={!!filterExcludes[key]}
                      onExcludeChange={ex =>
                        setFilterExcludes(prev => ({ ...prev, [key]: ex }))
                      }
                    />
                    {isLocked && (
                      <div onClick={e => { e.stopPropagation(); onChannelLockedClick?.(); }}
                        style={{ position: 'absolute', inset: 0, cursor: 'not-allowed', pointerEvents: 'auto' }} />
                    )}
                  </div>
                );
              }

              return (
                <div key={key} style={{ position: 'relative', opacity: isLocked ? 0.45 : 1 }}>
                  <MultiSelectChip
                    label={cfg.label}
                    options={cfg.options}
                    optionAnnotations={cfg.optionAnnotations}
                    selected={filterSelections[key] || []}
                    onChange={sel => onFilterSelect(key, sel)}
                    exclude={!!filterExcludes[key]}
                    onExcludeChange={ex =>
                      setFilterExcludes(prev => ({ ...prev, [key]: ex }))
                    }
                  />
                  {isLocked && (
                    <div onClick={e => { e.stopPropagation(); onChannelLockedClick?.(); }}
                      style={{ position: 'absolute', inset: 0, cursor: 'not-allowed', pointerEvents: 'auto' }} />
                    )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Portaled popovers (position: fixed, no clipping) ── */}
      {showAllFilters && allFilterPos && (
        <AllFiltersPopover
          activeFilters={activeFilters}
          onToggleFilter={onToggleFilter}
          onClose={() => setShowAllFilters(false)}
          fixedLeft={allFilterPos.left}
          fixedTop={allFilterPos.top}
        />
      )}

      {showDatePicker && datePickerPos && (
        <DateRangePicker
          startDate={dateStart}
          endDate={dateEnd}
          onChange={onDateChange}
          onClose={() => setShowDatePicker(false)}
          fixedLeft={datePickerPos.left}
          fixedTop={datePickerPos.top}
        />
      )}

      {showPriceRange && priceRangePos && (
        <PriceRangePicker
          priceMin={priceRange.min}
          priceMax={priceRange.max}
          roiMin={priceRange.roiMin}
          roiMax={priceRange.roiMax}
          onChange={(min, max, roiMin, roiMax) => {
            onPriceRangeChange?.(min, max, roiMin, roiMax);
            setShowPriceRange(false);
          }}
          onClose={() => setShowPriceRange(false)}
          fixedLeft={priceRangePos.left}
          fixedTop={priceRangePos.top}
        />
      )}
    </div>
  );
}
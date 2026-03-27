import React, { useState, useRef } from 'react';
import { Filter, Calendar } from 'lucide-react';
import { Button, Divider } from 'antd';
import { AllFiltersPopover } from './AllFiltersPopover';
import { DateRangePicker } from './DateRangePicker';
import { PriceRangePicker } from './PriceRangePicker';
import { MultiSelectChip } from './MultiSelectChip';
import { AccountInputChip } from './AccountInputChip';
const TEXT_INPUT_KEYS = new Set(['accountId', 'adId']);
import { FILTER_CHIP_DATA } from './filterConfig';

const F = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

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
      <Button
        ref={filterBtnRef}
        onClick={handleOpenAllFilters}
        size="small"
        type={showAllFilters ? 'primary' : 'default'}
        ghost={showAllFilters}
        icon={<Filter size={13} />}
        style={{
          display: 'inline-flex', alignItems: 'center',
          height: 28, fontSize: 13, flexShrink: 0, marginRight: 10,
        }}
      >
        所有筛选
      </Button>

      {/* ── 消耗时间（permanent，无竖线） ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginRight: 10 }}>
        <span style={{ fontSize: 13, color: '#595959', whiteSpace: 'nowrap' }}>消耗时间</span>
        <Button
          ref={dateBtnRef}
          onClick={handleOpenDatePicker}
          size="small"
          type="default"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            height: 28, fontSize: 13, whiteSpace: 'nowrap',
            borderColor: showDatePicker ? '#1677ff' : undefined,
          }}
        >
          <span>{dateStart}</span>
          <span style={{ color: '#bbb' }}>→</span>
          <span>{dateEnd}</span>
          <Calendar size={12} color="#aaa" />
        </Button>
      </div>

      {/* ── Active filter chips（有竖分割线） ── */}
      {activeFilters.length > 0 && (
        <>
          <Divider type="vertical" style={{ height: 20, marginRight: 10 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {activeFilters.map(key => {
              const cfg = FILTER_CHIP_DATA[key];
              if (!cfg) {
                // Special case for priceRange
                if (key === 'priceRange') {
                  return (
                    <Button
                      key={key}
                      ref={priceBtnRef}
                      onClick={handleOpenPriceRange}
                      size="small"
                      type="default"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        height: 28, fontSize: 13, whiteSpace: 'nowrap',
                        borderColor: priceRangeActive ? '#1890ff' : (showPriceRange ? '#1677ff' : undefined),
                        background: priceRangeActive ? '#e6f7ff' : undefined,
                      }}
                    >
                      <span style={{ color: '#555' }}>出价范围:</span>
                      <span style={{
                        color: priceRangeActive ? '#1890ff' : '#bbb',
                        maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {priceRangeSummary}
                      </span>
                    </Button>
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

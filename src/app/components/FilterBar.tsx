import React, { useState, useRef } from 'react';
import { Filter } from 'lucide-react';
import { Button, Divider } from 'antd';
import { AllFiltersPopover } from './AllFiltersPopover';
import { DateRangeTrigger } from './DateRangePicker';

const DATE_RANGE_KEYS = new Set(['adCreateTime']);
import { PriceRangePicker } from './PriceRangePicker';
import { MultiSelectChip } from './MultiSelectChip';
import { AccountInputChip } from './AccountInputChip';
import type { InputTab } from './AccountInputChip';
// Keys that render as free-text multi-input (AccountInputChip) instead of dropdown
const TEXT_INPUT_KEYS = new Set([
  'accountId', 'projectId', 'adId',
  'mediaCreativeId', 'mediaCreativeMd5', 'creativeName',
  'subChannel',
]);
const TEXT_INPUT_TABS: Record<string, InputTab[]> = {
  accountId:       [
    { key: 'id',   label: '账户ID',       placeholder: '输入账户ID，支持多个' },
    { key: 'name', label: '账户名称',     placeholder: '输入账户名称，支持多个' },
  ],
  projectId:       [
    { key: 'id',   label: '项目ID',       placeholder: '输入项目ID，支持多个' },
    { key: 'name', label: '项目名称',     placeholder: '输入项目名称，支持多个' },
  ],
  adId:            [
    { key: 'id',   label: '广告ID',       placeholder: '输入广告ID，支持多个' },
    { key: 'name', label: '广告名称',     placeholder: '输入广告名称，支持多个' },
  ],
  mediaCreativeId: [
    { key: 'id',   label: '媒体素材ID',   placeholder: '输入媒体素材ID，支持多个' },
    { key: 'name', label: '媒体素材名称', placeholder: '输入媒体素材名称，支持多个' },
  ],
  mediaCreativeMd5:[
    { key: 'md5',  label: '媒体素材MD5',  placeholder: '输入媒体素材MD5，支持多个' },
    { key: 'name', label: '媒体素材名称', placeholder: '输入媒体素材名称，支持多个' },
  ],
  creativeName:    [
    { key: 'name', label: '素材名称',     placeholder: '输入素材名称，支持多个' },
  ],
  subChannel:      [
    { key: 'id',   label: '子渠道标识',   placeholder: '输入子渠道标识，支持多个' },
  ],
};
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
  disabledFilterValues?: Record<string, string[]>;
}

export function FilterBar({
  activeFilters, onToggleFilter,
  dateStart, dateEnd, onDateChange,
  filterSelections, onFilterSelect,
  priceRange = { min: '', max: '', roiMin: '', roiMax: '' },
  onPriceRangeChange,
  channelLocked, onChannelLockedClick,
  disabledFilterValues = {},
}: Props) {
  const [showAllFilters, setShowAllFilters] = useState(false);
  const [allFilterPos, setAllFilterPos] = useState<{ left: number; top: number } | null>(null);
  const [showPriceRange, setShowPriceRange] = useState(false);
  const [priceRangePos, setPriceRangePos] = useState<{ left: number; top: number } | null>(null);
  const [filterExcludes, setFilterExcludes] = useState<Record<string, boolean>>({});
  // 账号ID/名称 组件的 exclude 状态单独维护
  const [accountExclude, setAccountExclude] = useState(false);
  const filterBtnRef = useRef<HTMLButtonElement>(null);
  const priceBtnRef = useRef<HTMLButtonElement>(null);

  const handleOpenAllFilters = () => {
    if (!showAllFilters && filterBtnRef.current) {
      const r = filterBtnRef.current.getBoundingClientRect();
      setAllFilterPos({ left: r.left, top: r.bottom + 6 });
    }
    setShowAllFilters(v => !v);
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
      display: 'flex', alignItems: 'center', flexWrap: 'wrap',
      borderBottom: 'none', padding: '10px 16px 6px',
      background: 'transparent', gap: 8, flexShrink: 0, fontFamily: F,
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
          height: 28, fontSize: 13, fontWeight: 400, flexShrink: 0,
        }}
      >
        所有筛选
      </Button>

      {/* ── 消耗时间（永久） ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <span style={{ fontSize: 13, color: '#595959', whiteSpace: 'nowrap' }}>消耗时间</span>
        <DateRangeTrigger
          start={dateStart}
          end={dateEnd}
          onChange={onDateChange}
          clearable={false}
        />
      </div>

      {/* ── 数据口径（永久，必填） ── */}
      <MultiSelectChip
        label="数据口径"
        options={FILTER_CHIP_DATA['dataScope']?.options ?? []}
        selected={filterSelections['dataScope'] || ['去刷号']}
        onChange={sel => onFilterSelect('dataScope', sel.length ? sel : ['去刷号'])}
        exclude={false}
        onExcludeChange={() => {}}
      />

      {/* ── Active filter chips（有竖分割线） ── */}
      {activeFilters.length > 0 && (
        <>
          <Divider type="vertical" style={{ height: 20 }} />
          <div style={{ display: 'contents' }}>
            {activeFilters.map(key => {
              // Special case for priceRange
              if (key === 'priceRange') {
                return (
                  <div key={key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span style={{ fontSize: 13, color: '#333', whiteSpace: 'nowrap', fontWeight: 400 }}>出价范围</span>
                    <button
                      ref={priceBtnRef}
                      onClick={handleOpenPriceRange}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        height: 28, fontSize: 13, fontWeight: 400, whiteSpace: 'nowrap',
                        border: `1px solid ${showPriceRange ? '#1677ff' : '#e0e0e0'}`,
                        borderRadius: 6, padding: '0 8px 0 10px', width: 110,
                        background: '#fff', cursor: 'pointer', outline: 'none',
                        transition: 'border-color 0.15s',
                      }}
                    >
                      <span style={{
                        flex: 1, color: priceRangeActive ? '#1677ff' : '#bbb',
                        maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {priceRangeSummary}
                      </span>
                      <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                  </div>
                );
              }

              const isLocked = !!channelLocked && (key === 'mainChannel' || key === 'subChannel');

              const cfg = FILTER_CHIP_DATA[key];

              // 广告创建时间：日期范围选择器，与消耗时间保持一致
              if (DATE_RANGE_KEYS.has(key)) {
                const sel = filterSelections[key] || [];
                return (
                  <div key={key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span style={{ fontSize: 13, color: '#333', whiteSpace: 'nowrap', fontWeight: 400 }}>{cfg?.label ?? key}</span>
                    <DateRangeTrigger
                      start={sel[0] || ''}
                      end={sel[1] || ''}
                      onChange={(s, e) => onFilterSelect(key, s || e ? [s, e] : [])}
                      clearable={false}
                    />
                  </div>
                );
              }

              if (TEXT_INPUT_KEYS.has(key)) {
                const isAccountKey = key === 'accountId';
                return (
                  <div key={key} style={{ position: 'relative', opacity: isLocked ? 0.45 : 1 }}>
                    <AccountInputChip
                      tabs={TEXT_INPUT_TABS[key]}
                      selected={filterSelections[key] || []}
                      onChange={sel => onFilterSelect(key, sel)}
                      exclude={isAccountKey ? accountExclude : !!filterExcludes[key]}
                      onExcludeChange={ex =>
                        isAccountKey
                          ? setAccountExclude(ex)
                          : setFilterExcludes(prev => ({ ...prev, [key]: ex }))
                      }
                    />
                    {isLocked && (
                      <div onClick={e => { e.stopPropagation(); onChannelLockedClick?.(); }}
                        style={{ position: 'absolute', inset: 0, cursor: 'not-allowed', pointerEvents: 'auto' }} />
                    )}
                  </div>
                );
              }

              if (!cfg) return null;

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
                    disabledValues={disabledFilterValues[key]}
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
          onClearAll={() => {
            [...activeFilters].forEach(k => onToggleFilter(k));
            setShowAllFilters(false);
          }}
          onClose={() => setShowAllFilters(false)}
          fixedLeft={allFilterPos.left}
          fixedTop={allFilterPos.top}
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

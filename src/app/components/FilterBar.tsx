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
  'accountId', 'accountName',
  'projectId', 'projectName',
  'adId', 'adName',
  'mediaCreativeId', 'mediaCreativeName',
  'mediaCreativeMd5',
  'creativeName', 'excludeCreativeName',
  'subChannel',
]);

// Keys that support fuzzy match toggle
const FUZZY_SUPPORT_KEYS = new Set([
  'accountName', 'projectName', 'adName',
  'mediaCreativeName', 'creativeName', 'excludeCreativeName',
]);

// Keys where the exclude checkbox is hidden
const HIDE_EXCLUDE_KEYS = new Set(['creativeName', 'excludeCreativeName']);

// Keys that are permanently in exclude mode
const ALWAYS_EXCLUDE_KEYS = new Set(['excludeCreativeName']);

const TEXT_INPUT_TABS: Record<string, InputTab[]> = {
  accountId:            [{ key: 'id',   label: '账户ID',       placeholder: '' }],
  accountName:          [{ key: 'name', label: '账户名称',     placeholder: '' }],
  projectId:            [{ key: 'id',   label: '项目ID',       placeholder: '' }],
  projectName:          [{ key: 'name', label: '项目名称',     placeholder: '' }],
  adId:                 [{ key: 'id',   label: '广告ID',       placeholder: '' }],
  adName:               [{ key: 'name', label: '广告名称',     placeholder: '' }],
  mediaCreativeId:      [{ key: 'id',   label: '媒体素材ID',   placeholder: '' }],
  mediaCreativeName:    [{ key: 'name', label: '媒体素材名称', placeholder: '' }],
  mediaCreativeMd5:     [{ key: 'md5',  label: '媒体素材MD5',  placeholder: '' }],
  creativeName:         [{ key: 'name', label: '素材名称',     placeholder: '' }],
  excludeCreativeName:  [{ key: 'name', label: '排除素材名称', placeholder: '' }],
  subChannel:           [{ key: 'id',   label: '子渠道标识',   placeholder: '' }],
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
  const [filterMatchModes, setFilterMatchModes] = useState<Record<string, 'exact' | 'fuzzy'>>({});
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
                const MOCK_VALID_CHANNELS = new Set([
                  'btt00zyh050','btt00zyh049','btt00zyh048','btt00zyh047','btt00zyh046',
                  'btt00zyh045','btt00zyh044','btt00zyh043','btt00zyh042','btt00zyh041',
                ]);
                const MOCK_VALID_ACCOUNT_IDS = new Set([
                  '34552834','65189120','34552860','34552853','34552852','34552846','34552839','34552837','34552835',
                  '34552875','34552871','34552870','34552869','34552868','34552867','34552864','34552861',
                  '46079679','46079674','46079669','46079660','46079653','46079644','46079636','46079573',
                  '46079968','46079955','46079779','46079710','46079704','46079688',
                  '46080023','46080018','46080012','46080001','46079991','46079985','46079980',
                  '48684925','48684891','48684886','48684871','48684852','48684835','48684807','48684791',
                  '48685223','48685216','48685071','48685035','48685021','48684999','48684986',
                  '48685297','48685292','48685290','48685283','48685268','48685231',
                  '50280480','48685782','48685670','48685659','48685649','48685630',
                  '48685319','48685313','48685308','48685301',
                  '50280554','50280543','50280532','50280530','50280523','50280519','50280513','50280492','50280491','50280490','50280485',
                  '50280665','50280656','50280649','50280640','50280630','50280620','50280565','50280560','50280547',
                  '50280745','50280744','50280714','50280708','50280703','50280692','50280686','50280673',
                  '50281558','50281550','50281542','50281497','50281481','50281470','50281406','50281400','50281395',
                  '50280762','54885327','54885318','54885315','54885281',
                  '50281630','50281623','50281615','50281602','50281591','50281584',
                  '57132765','57132763','57132749','57132748','57132747',
                  '54885377','54885354','54885340',
                  '57132811','57132810','57132806','57132804','57132803','57132801','57132799','57132769','57132767','57132766',
                  '57132837','57132835','57132833','57132830','57132828','57132818','57132817','57132815','57132813',
                  '57132854','57132852','57132851','57132850','57132849','57132848','57132847','57132841','57132840','57132839','57132838',
                  '57132870','57132869','57132868','57132866','57132865','57132857','57132855','57132853',
                  '57132888','57132885','57132882','57132881','57132880','57132879','57132878','57132877','57132876','57132875',
                  '58709471','58709403','58709342',
                  '57132895','57132894','57132889',
                  '58783350','58783335','58710194','58709986','58709948','58709675','58709499',
                  '57132897',
                  '58783561','58783537','58783511','58783481','58783428','58783405','58783374','58783365','58783356',
                  '82294554','82294550','82294545','82294541','82294538','82294535','82294529','82294525','82294520',
                  '58783731','58783713','58783672','58783653','58783632','58783615','58783607','58783584','58783574',
                  '58091979','58091970','58091959','58091941','58091933','58091919','58091908','58091901',
                  '58091642','58091616','58091610','58091596','58091591','58091566','58091538','58091504',
                  '58091398','58091389','82294558',
                  '58783945','58783941','58783928','58783858','58783848','58783824','58783779',
                  '58093084','58093070','58093062','58093048','58093036','58093031','58093013','58093001',
                  '58092530','58092384','58092337','58092331','58092311','58092270','58092250','58092230','58092222','58092195','58092186','58092121','58092014','58092004',
                  '58784141','58784132','58784124','58784116','58784105','58784100','58784091','58784088','58784080','58784070',
                  '58093279','58093268','58093248','58093239','58093229','58093213','58093209','58093196','58093188','58093177','58093173','58093155','58093147','58093137','58093112','58093104','58093092',
                  '58784220','58784188','58784184','58784162','58784160','58784152','58784148',
                  '58093472','58093464','58093456','58093450','58093432','58093421','58093418','58093414','58093408','58093400','58093397','58093391','58093381','58093375','58093370','58093366','58093363','58093360','58093354','58093349','58093320','58093286',
                  '59960582','59960550','59960514','59960484','59960454','59960409','59960299','59960269',
                  '58784225',
                  '64291989','64291988','64291985','64291981','64291977','64291975',
                  '62295323','62295303','62295300','62295290','62295241','62295239','62295238',
                  '58093590','58093580','58093566','58093555','58093549','58093538','58093493',
                  '65688305','65688295','65688273',
                  '59960698','59960652','59960618',
                  '41395173','41395145','41395118',
                  '64292139','64292135','64292087','64292085','64292077','64292072','64292064','64292056','64292050','64292043','64292038','64292034','64292028','64292025','64292017','64292011','64292007','64292005','64292000',
                  '65688440','65688406','65688401','65688391','65688368','65688349','65688339','65688319',
                  '46235749','46235720','46235715','46234821','46234279',
                  '43775809','43775760','43775739',
                  '41397102','41395874','41395852','41395846','41395844','41395841','41395490','41395480','41395460',
                ]);
                const MOCK_VALID_ACCOUNT_NAMES = new Set(['游酷盛世', '乐乐互游', '北京山岚启盛']);
                const mockValidate =
                  key === 'accountName'
                  ? async (values: string[]) => {
                      await new Promise(r => setTimeout(r, 300));
                      return {
                        valid:   values.filter(v => MOCK_VALID_ACCOUNT_NAMES.has(v)),
                        invalid: values.filter(v => !MOCK_VALID_ACCOUNT_NAMES.has(v)),
                      };
                    }
                  : key === 'accountId'
                  ? async (values: string[]) => {
                      await new Promise(r => setTimeout(r, 400));
                      return {
                        valid:   values.filter(v => MOCK_VALID_ACCOUNT_IDS.has(v)),
                        invalid: values.filter(v => !MOCK_VALID_ACCOUNT_IDS.has(v)),
                      };
                    }
                  : key === 'subChannel'
                  ? async (values: string[]) => {
                      await new Promise(r => setTimeout(r, 300));
                      return {
                        valid:   values.filter(v => MOCK_VALID_CHANNELS.has(v)),
                        invalid: values.filter(v => !MOCK_VALID_CHANNELS.has(v)),
                      };
                    }
                  : undefined;
                const alwaysExclude = ALWAYS_EXCLUDE_KEYS.has(key);
                const currentExclude = alwaysExclude ? true : !!filterExcludes[key];
                return (
                  <div key={key} style={{ position: 'relative', opacity: isLocked ? 0.45 : 1 }}>
                    <AccountInputChip
                      tabs={TEXT_INPUT_TABS[key]}
                      selected={filterSelections[key] || []}
                      onChange={sel => onFilterSelect(key, sel)}
                      exclude={currentExclude}
                      onExcludeChange={ex =>
                        !alwaysExclude && setFilterExcludes(prev => ({ ...prev, [key]: ex }))
                      }
                      onValidate={mockValidate}
                      supportFuzzy={FUZZY_SUPPORT_KEYS.has(key)}
                      matchMode={filterMatchModes[key] ?? 'exact'}
                      onMatchModeChange={mode =>
                        setFilterMatchModes(prev => ({ ...prev, [key]: mode }))
                      }
                      hideExclude={HIDE_EXCLUDE_KEYS.has(key)}
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

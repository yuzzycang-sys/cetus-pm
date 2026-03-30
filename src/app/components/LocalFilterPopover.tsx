import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button, Input, Typography, Checkbox, Segmented } from 'antd';
import { Info, Search, X, ChevronDown, ChevronUp, Check, ArrowLeft } from 'lucide-react';
import { FILTER_GROUPS, FILTER_CHIP_DATA } from './filterConfig';
import { DateRangeTrigger } from './DateRangePicker';
import { InfoCircleOutlined } from '@ant-design/icons';

const F = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

export type LocalFilterEntry = { values: string[]; exclude?: boolean };
export type LocalFilters = Record<string, LocalFilterEntry>;

type MatchMode = 'exact' | 'fuzzy';

// Keys that use text-input style panel instead of option-list panel
const TEXT_INPUT_KEYS = new Set([
  'accountId', 'projectId', 'adId', 'mediaCreativeId',
  'mediaCreativeMd5', 'creativeName', 'subChannel',
]);

type SubTypeTab = { key: string; label: string; placeholder: string };

const TEXT_INPUT_TABS: Record<string, SubTypeTab[]> = {
  accountId:        [
    { key: 'id',   label: '账户ID',     placeholder: '输入账户ID，支持多个' },
    { key: 'name', label: '账户名称',   placeholder: '输入账户名称，支持多个' },
  ],
  projectId:        [
    { key: 'id',   label: '项目ID',     placeholder: '输入项目ID，支持多个' },
    { key: 'name', label: '项目名称',   placeholder: '输入项目名称，支持多个' },
  ],
  adId:             [
    { key: 'id',   label: '广告ID',     placeholder: '输入广告ID，支持多个' },
    { key: 'name', label: '广告名称',   placeholder: '输入广告名称，支持多个' },
  ],
  mediaCreativeId:  [
    { key: 'id',   label: '媒体素材ID', placeholder: '输入媒体素材ID，支持多个' },
    { key: 'name', label: '媒体素材名称', placeholder: '输入媒体素材名称，支持多个' },
  ],
  mediaCreativeMd5: [
    { key: 'md5',  label: '媒体素材MD5', placeholder: '输入媒体素材MD5，支持多个' },
    { key: 'name', label: '媒体素材名称', placeholder: '输入媒体素材名称，支持多个' },
  ],
  creativeName:     [
    { key: 'name', label: '素材名称',   placeholder: '输入素材名称，支持多个' },
  ],
  subChannel:       [
    { key: 'id',   label: '子渠道标识', placeholder: '输入子渠道标识，支持多个' },
  ],
};

interface Props {
  localFilters: LocalFilters;
  onChangeFilters: (next: LocalFilters) => void;
  anchorRect: DOMRect;
  onClose: () => void;
}

function parseTokens(raw: string): string[] {
  return raw.split(/[\n,，\s]+/).map(s => s.trim()).filter(Boolean);
}

function KindBadge({ kind }: { kind: MatchMode }) {
  const isExact = kind === 'exact';
  return (
    <span style={{
      fontSize: 11, lineHeight: '16px', padding: '0 4px', borderRadius: 3,
      background: isExact ? '#f6ffed' : '#f9f0ff',
      color: isExact ? '#52c41a' : '#722ed1',
      border: `1px solid ${isExact ? '#b7eb8f' : '#d3adf7'}`,
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {isExact ? '精确' : '模糊'}
    </span>
  );
}

function ModeToggle({ value, onChange }: { value: MatchMode; onChange: (v: MatchMode) => void }) {
  return (
    <>
      <style>{`
        .lf-match-seg .ant-segmented-item { font-size: 12px !important; font-weight: 400 !important; color: #8c8c8c; }
        .lf-match-seg .ant-segmented-item-selected { color: #1677ff !important; font-weight: 400 !important; }
        .lf-match-seg .ant-segmented-item-label { font-size: 12px !important; }
      `}</style>
      <Segmented
        size="small"
        value={value}
        onChange={v => onChange(v as MatchMode)}
        options={[
          { label: '精确', value: 'exact' },
          { label: '模糊', value: 'fuzzy' },
        ]}
        className="lf-match-seg"
        style={{ flexShrink: 0 }}
      />
    </>
  );
}

// ── Option-list panel (for filters with predefined options) ──────────────────

interface ItemPanelProps {
  label: string;
  options: string[];
  selected: string[];
  onChangeSelected: (next: string[]) => void;
  exclude: boolean;
  onExcludeChange: (v: boolean) => void;
}

function ItemPanel({ label, options, selected, onChangeSelected, exclude, onExcludeChange }: ItemPanelProps) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'selected'>('all');
  const [mode, setMode] = useState<'list' | 'batch'>('list');
  const [batchText, setBatchText] = useState('');
  const [matchMode, setMatchMode] = useState<MatchMode>('exact');
  const [customMeta, setCustomMeta] = useState<Record<string, MatchMode>>({});

  const searchRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (mode === 'list') setTimeout(() => searchRef.current?.focus(), 50);
    if (mode === 'batch') setTimeout(() => textareaRef.current?.focus(), 50);
  }, [mode]);

  // Reset exclude when all selections cleared externally
  useEffect(() => {
    if (selected.length === 0) onExcludeChange(false);
  }, [selected.length]);

  const optionSet = useMemo(() => new Set(options), [options]);
  const isCustomValue = (v: string) => !optionSet.has(v);

  const filteredOptions = options.filter(o =>
    o.toLowerCase().includes(search.toLowerCase())
  );

  const displayList =
    tab === 'all'
      ? filteredOptions
      : selected.filter(s => s.toLowerCase().includes(search.toLowerCase()));

  const customCount = selected.filter(s => isCustomValue(s)).length;

  const toggleOption = (opt: string) => {
    if (selected.includes(opt)) {
      const next = selected.filter(s => s !== opt);
      onChangeSelected(next);
      if (customMeta[opt] !== undefined) {
        setCustomMeta(prev => { const n = { ...prev }; delete n[opt]; return n; });
      }
    } else {
      onChangeSelected([...selected, opt]);
    }
  };

  const isAllSelected =
    filteredOptions.length > 0 && filteredOptions.every(o => selected.includes(o));

  const selectAllDisabled = exclude;
  const excludeDisabled = isAllSelected && !search && !exclude;

  const handleSelectAll = () => {
    if (selectAllDisabled) return;
    if (isAllSelected) {
      const fs = new Set(filteredOptions);
      onChangeSelected(selected.filter(s => !fs.has(s)));
      setCustomMeta(prev => {
        const n = { ...prev };
        filteredOptions.forEach(o => delete n[o]);
        return n;
      });
    } else {
      onChangeSelected(Array.from(new Set([...selected, ...filteredOptions])));
    }
  };

  const handleExclude = () => {
    if (excludeDisabled) return;
    onExcludeChange(!exclude);
  };

  const handleClear = () => {
    onChangeSelected([]);
    onExcludeChange(false);
    setCustomMeta({});
  };

  // Batch mode
  const batchTokens = useMemo(() => parseTokens(batchText), [batchText]);
  const exactMatched = useMemo(() => batchTokens.filter(t => optionSet.has(t)), [batchTokens, optionSet]);
  const exactUnmatched = useMemo(() => batchTokens.filter(t => !optionSet.has(t)), [batchTokens, optionSet]);

  const handleBatchConfirm = () => {
    if (matchMode === 'exact') {
      if (exactMatched.length === 0) return;
      onChangeSelected(Array.from(new Set([...selected, ...exactMatched])));
    } else {
      if (batchTokens.length === 0) return;
      onChangeSelected(Array.from(new Set([...selected, ...batchTokens])));
      const newMeta: Record<string, MatchMode> = {};
      batchTokens.forEach(t => { newMeta[t] = 'fuzzy'; });
      setCustomMeta(prev => ({ ...prev, ...newMeta }));
    }
    setBatchText('');
    setMode('list');
    setTab('selected');
  };

  return (
    <div
      style={{
        margin: '4px 0 4px 24px',
        border: '1px solid #e8e8e8', borderRadius: 6,
        background: '#fff', overflow: 'hidden',
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* ── LIST MODE ── */}
      {mode === 'list' && (<>

        {/* Search + 批量输入 */}
        <div style={{ padding: '10px 12px 0' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            border: '1px solid #e0e0e0', borderRadius: 6,
            padding: '5px 9px', background: '#fafafa',
          }}>
            <Search size={12} color="#bbb" style={{ flexShrink: 0 }} />
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`搜索${label}…`}
              style={{
                border: 'none', outline: 'none', fontSize: 12,
                flex: 1, color: '#333', background: 'transparent', minWidth: 0,
              }}
            />
            {search
              ? <X size={12} color="#bbb" style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => setSearch('')} />
              : (
                <span
                  onClick={() => setMode('batch')}
                  style={{
                    fontSize: 12, color: '#1890ff', cursor: 'pointer',
                    whiteSpace: 'nowrap', flexShrink: 0,
                    borderLeft: '1px solid #e8e8e8', paddingLeft: 7, marginLeft: 2,
                  }}
                >
                  批量输入
                </span>
              )
            }
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0', padding: '0 12px', marginTop: 8 }}>
          {(['all', 'selected'] as const).map(t => {
            const active = tab === t;
            const tabLabel = t === 'all' ? '全部' : (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>已选 ({selected.length})</span>
                {customCount > 0 && (
                  <span style={{
                    fontSize: 11, padding: '0 4px', borderRadius: 3,
                    background: '#f5f5f5', color: '#999', border: '1px solid #e8e8e8',
                    lineHeight: '16px',
                  }}>
                    {customCount} 自定义
                  </span>
                )}
              </span>
            );
            return (
              <div
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '6px 10px 7px', fontSize: 12, cursor: 'pointer',
                  color: active ? '#1890ff' : '#666',
                  borderBottom: active ? '2px solid #1890ff' : '2px solid transparent',
                  fontWeight: active ? 500 : 400,
                  marginBottom: -1, userSelect: 'none', transition: 'color 0.15s',
                }}
              >
                {tabLabel}
              </div>
            );
          })}
        </div>

        {/* Option list */}
        <div style={{ maxHeight: 200, overflowY: 'auto', padding: '4px 0' }}>
          {displayList.length === 0 ? (
            <div style={{ padding: '16px 0', textAlign: 'center', fontSize: 12, color: '#bbb' }}>
              {tab === 'selected' ? '暂无已选项' : '无匹配选项'}
            </div>
          ) : (
            displayList.map(opt => {
              const checked = selected.includes(opt);
              const kind = customMeta[opt];
              return (
                <div
                  key={opt}
                  onClick={() => toggleOption(opt)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '7px 14px', cursor: 'pointer', fontSize: 13, color: '#333',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f5f5f5'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                >
                  <Checkbox
                    checked={checked}
                    style={{ pointerEvents: 'none', flexShrink: 0 }}
                  />
                  <span style={{ flex: 1, color: checked ? '#1890ff' : '#333' }}>{opt}</span>
                  {kind && <KindBadge kind={kind} />}
                </div>
              );
            })
          )}
        </div>

        {/* Footer: 全选 + 排除 */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 14px', borderTop: '1px solid #f0f0f0', background: '#fafafa',
        }}>
          <div
            onClick={!selectAllDisabled ? handleSelectAll : undefined}
            title={selectAllDisabled ? '排除模式下不可全选' : ''}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              cursor: selectAllDisabled ? 'not-allowed' : 'pointer',
              opacity: selectAllDisabled ? 0.38 : 1, userSelect: 'none',
            }}
          >
            <Checkbox
              checked={isAllSelected && !selectAllDisabled}
              disabled={selectAllDisabled}
              style={{ pointerEvents: 'none', flexShrink: 0 }}
            />
            <span style={{ fontSize: 12, color: '#444' }}>全选</span>
          </div>

          <div
            onClick={!excludeDisabled ? handleExclude : undefined}
            title={excludeDisabled ? '全选状态下不可使用排除' : '排除勾选的选项（NOT IN）'}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              cursor: excludeDisabled ? 'not-allowed' : 'pointer',
              opacity: excludeDisabled ? 0.38 : 1, userSelect: 'none',
            }}
          >
            <div style={{
              width: 14, height: 14, borderRadius: 3, flexShrink: 0,
              border: `1.5px solid ${exclude ? '#fa8c16' : '#d9d9d9'}`,
              background: exclude ? '#fa8c16' : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s',
            }}>
              {exclude && <Check size={10} color="#fff" strokeWidth={3} />}
            </div>
            <span style={{ fontSize: 12, color: exclude ? '#fa8c16' : '#444' }}>排除</span>
          </div>
        </div>

        {/* Clear link */}
        {selected.length > 0 && (
          <div
            onClick={handleClear}
            style={{
              padding: '7px 14px 9px', fontSize: 12, color: '#1890ff',
              cursor: 'pointer', textAlign: 'center', background: '#fff',
              borderTop: '1px solid #f5f5f5',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f0f7ff'}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = '#fff'}
          >
            清空选择
          </div>
        )}
      </>)}

      {/* ── BATCH MODE ── */}
      {mode === 'batch' && (<>

        <div style={{
          display: 'flex', alignItems: 'center',
          padding: '9px 12px 8px', borderBottom: '1px solid #f0f0f0', gap: 8,
        }}>
          <div
            onClick={() => setMode('list')}
            style={{
              display: 'flex', alignItems: 'center', gap: 3,
              cursor: 'pointer', color: '#1890ff', fontSize: 12,
              userSelect: 'none', flexShrink: 0,
            }}
          >
            <ArrowLeft size={13} color="#1890ff" />
            <span>返回</span>
          </div>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 12, color: '#999', flexShrink: 0 }}>匹配方式</span>
          <ModeToggle value={matchMode} onChange={setMatchMode} />
        </div>

        <div style={{
          padding: '5px 12px', fontSize: 12,
          color: matchMode === 'fuzzy' ? '#7c4dff' : '#999',
          background: matchMode === 'fuzzy' ? '#f3f0ff' : '#fafafa',
          borderBottom: '1px solid #f0f0f0', transition: 'all 0.15s',
        }}>
          {matchMode === 'exact'
            ? '仅追加与选项列表精确匹配的值，未命中的将被忽略'
            : '每个关键字追加后执行包含匹配（LIKE %keyword%），支持自定义值'}
        </div>

        <div style={{ padding: '10px 12px 0' }}>
          <textarea
            ref={textareaRef}
            value={batchText}
            onChange={e => setBatchText(e.target.value)}
            placeholder={'每行一个，或用逗号、空格分隔\n例：张磊, 李明\n王芳'}
            rows={5}
            style={{
              width: '100%', boxSizing: 'border-box',
              border: '1px solid #e0e0e0', borderRadius: 6,
              padding: '8px 10px', fontSize: 12, color: '#333',
              resize: 'none', outline: 'none', lineHeight: 1.7,
              fontFamily: F, background: '#fafafa',
            }}
          />
        </div>

        {matchMode === 'exact' && batchTokens.length > 0 && (
          <div style={{ padding: '7px 13px 4px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {exactMatched.length > 0 && (
              <div style={{ fontSize: 12, color: '#52c41a', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>✓ 精确匹配 {exactMatched.length} 项：</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#389e0d', maxWidth: 140 }}>
                  {exactMatched.join('、')}
                </span>
              </div>
            )}
            {exactUnmatched.length > 0 && (
              <div style={{ fontSize: 12, color: '#bbb', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center',
                  padding: '0 5px', borderRadius: 3,
                  background: '#f5f5f5', color: '#999', border: '1px solid #e8e8e8',
                  fontSize: 11, lineHeight: '16px', flexShrink: 0,
                }}>
                  已忽略 {exactUnmatched.length} 项
                </span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>
                  {exactUnmatched.join('、')}
                </span>
              </div>
            )}
            {exactMatched.length === 0 && (
              <div style={{ fontSize: 12, color: '#ff4d4f' }}>✕ 所有值均未在选项中找到，无法追加</div>
            )}
          </div>
        )}

        {matchMode === 'fuzzy' && batchTokens.length > 0 && (
          <div style={{ padding: '7px 13px 4px' }}>
            <div style={{ fontSize: 12, color: '#7c4dff', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
              <span>共 {batchTokens.length} 个关键字将以</span>
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '0 5px', borderRadius: 3,
                background: '#f9f0ff', color: '#722ed1', border: '1px solid #d3adf7',
                fontSize: 11, lineHeight: '16px',
              }}>模糊</span>
              <span>自定义值追加到已选</span>
            </div>
          </div>
        )}

        <div style={{ padding: '10px 12px 12px' }}>
          <Button
            onClick={handleBatchConfirm}
            disabled={matchMode === 'exact' ? exactMatched.length === 0 : batchTokens.length === 0}
            block
            style={{
              borderRadius: 6,
              background: (() => {
                if (matchMode === 'exact') return exactMatched.length > 0 ? '#1890ff' : '#f0f0f0';
                return batchTokens.length > 0 ? '#7c4dff' : '#f0f0f0';
              })(),
              color: (() => {
                if (matchMode === 'exact') return exactMatched.length > 0 ? '#fff' : '#bbb';
                return batchTokens.length > 0 ? '#fff' : '#bbb';
              })(),
              border: 'none',
              fontSize: 13,
            }}
          >
            {matchMode === 'exact'
              ? exactMatched.length > 0
                ? `追加 ${exactMatched.length} 个匹配项`
                : batchTokens.length > 0 ? '无可追加项（未命中）' : '请输入内容'
              : batchTokens.length > 0
                ? `确认追加 ${batchTokens.length} 个关键字（模糊匹配）`
                : '请输入内容'}
          </Button>
        </div>
      </>)}
    </div>
  );
}

// ── Price range panel (inline, matches FilterBar's PriceRangePicker) ─────────

interface PriceRangePanelProps {
  values: string[];
  onChange: (next: string[]) => void;
  onClose: () => void;
}

function PriceRangePanel({ values, onChange, onClose }: PriceRangePanelProps) {
  const [priceMin, setPriceMin] = useState(values[0] || '');
  const [priceMax, setPriceMax] = useState(values[1] || '');
  const [roiMin, setRoiMin]   = useState(values[2] || '');
  const [roiMax, setRoiMax]   = useState(values[3] || '');

  const handleConfirm = () => {
    if (priceMin || priceMax || roiMin || roiMax) {
      onChange([priceMin, priceMax, roiMin, roiMax]);
    } else {
      onChange([]);
    }
    onClose();
  };

  const handleClear = () => {
    setPriceMin(''); setPriceMax(''); setRoiMin(''); setRoiMax('');
    onChange([]);
  };

  return (
    <div
      style={{
        margin: '4px 0 4px 24px',
        border: '1px solid #e8e8e8', borderRadius: 6,
        background: '#fff', padding: '16px 16px 12px',
      }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, color: '#333', fontWeight: 500, marginBottom: 8, display: 'block' }}>出价范围</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Input size="small" placeholder="出价下限" value={priceMin} onChange={e => setPriceMin(e.target.value)} style={{ fontSize: 12, flex: 1 }} allowClear />
          <span style={{ fontSize: 12, color: '#999' }}>至</span>
          <Input size="small" placeholder="出价上限" value={priceMax} onChange={e => setPriceMax(e.target.value)} style={{ fontSize: 12, flex: 1 }} allowClear />
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, color: '#333', fontWeight: 500, marginBottom: 8, display: 'block' }}>ROI范围</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Input size="small" placeholder="ROI下限" value={roiMin} onChange={e => setRoiMin(e.target.value)} style={{ fontSize: 12, flex: 1 }} allowClear />
          <span style={{ fontSize: 12, color: '#999' }}>至</span>
          <Input size="small" placeholder="ROI上限" value={roiMax} onChange={e => setRoiMax(e.target.value)} style={{ fontSize: 12, flex: 1 }} allowClear />
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '6px 10px', background: '#f5f5f5', borderRadius: 4, marginBottom: 6 }}>
          <InfoCircleOutlined style={{ fontSize: 12, color: '#555', flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 11, color: '#666', lineHeight: 1.5 }}>出价上下限支持0-10000内的整数，闭区间</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '6px 10px', background: '#f5f5f5', borderRadius: 4 }}>
          <InfoCircleOutlined style={{ fontSize: 12, color: '#555', flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 11, color: '#666', lineHeight: 1.5 }}>ROI上下限支持0-100内的整数或小数（最多3位），闭区间</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button size="small" onClick={handleClear} style={{ fontSize: 12 }}>清空</Button>
        <Button size="small" type="primary" onClick={handleConfirm} style={{ fontSize: 12 }}>确定</Button>
      </div>
    </div>
  );
}

// ── Text-input panel (for accountId / adId etc.) ─────────────────────────────

interface TextInputPanelProps {
  tabs: SubTypeTab[];
  selected: string[];
  onChangeSelected: (next: string[]) => void;
  exclude: boolean;
  onExcludeChange: (v: boolean) => void;
}

function TextInputPanel({ tabs, selected, onChangeSelected, exclude, onExcludeChange }: TextInputPanelProps) {
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const activeTab = tabs[activeTabIdx] ?? tabs[0];
  const [matchMode, setMatchMode] = useState<MatchMode>('exact');
  const [inputText, setInputText] = useState('');
  const [valueMeta, setValueMeta] = useState<Record<string, MatchMode>>({});

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  useEffect(() => {
    if (selected.length === 0) { onExcludeChange(false); setValueMeta({}); }
  }, [selected.length]);

  const tokens = useMemo(() => parseTokens(inputText), [inputText]);
  const newTokens = useMemo(() => tokens.filter(t => !selected.includes(t)), [tokens, selected]);
  const dupCount = tokens.length - newTokens.length;
  const canConfirm = newTokens.length > 0;

  const handleConfirm = () => {
    if (!canConfirm) return;
    const merged = [...selected, ...newTokens];
    onChangeSelected(merged);
    const meta: Record<string, MatchMode> = {};
    newTokens.forEach(t => { meta[t] = matchMode; });
    setValueMeta(prev => ({ ...prev, ...meta }));
    setInputText('');
    textareaRef.current?.focus();
  };

  const handleRemove = (v: string) => {
    onChangeSelected(selected.filter(s => s !== v));
    setValueMeta(prev => { const n = { ...prev }; delete n[v]; return n; });
  };

  const handleClear = () => {
    onChangeSelected([]);
    onExcludeChange(false);
    setValueMeta({});
  };

  const handleSwitchTab = (idx: number) => {
    if (idx === activeTabIdx) return;
    setActiveTabIdx(idx);
    onChangeSelected([]);
    onExcludeChange(false);
    setValueMeta({});
    setInputText('');
  };

  return (
    <div
      style={{
        margin: '4px 0 4px 24px',
        border: '1px solid #e8e8e8', borderRadius: 6,
        background: '#fff', overflow: 'hidden',
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* Top bar: subType tabs + 精确/模糊 */}
      <div style={{
        display: 'flex', alignItems: 'center',
        borderBottom: '1px solid #f0f0f0', padding: '0 12px',
      }}>
        <div style={{ display: 'flex', flex: 1 }}>
          {tabs.length > 1 ? tabs.map((tab, idx) => {
            const active = idx === activeTabIdx;
            return (
              <div key={tab.key} onClick={() => handleSwitchTab(idx)} style={{
                padding: '8px 10px 7px', fontSize: 13, cursor: 'pointer',
                color: active ? '#1890ff' : '#555',
                borderBottom: active ? '2px solid #1890ff' : '2px solid transparent',
                fontWeight: active ? 500 : 400,
                marginBottom: -1, userSelect: 'none', transition: 'color 0.15s',
              }}>
                {tab.label}
              </div>
            );
          }) : (
            <div style={{ padding: '8px 10px 7px', fontSize: 13, color: '#333', fontWeight: 400 }}>
              {tabs[0].label}
            </div>
          )}
        </div>
        <ModeToggle value={matchMode} onChange={setMatchMode} />
      </div>

      {/* Textarea */}
      <div style={{ padding: '10px 12px 0' }}>
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder={`${activeTab.placeholder}\n每行一个，或用逗号/空格分隔`}
          rows={4}
          style={{
            width: '100%', boxSizing: 'border-box',
            border: '1px solid #e0e0e0', borderRadius: 6,
            padding: '8px 10px', fontSize: 12, color: '#333',
            resize: 'none', outline: 'none', lineHeight: 1.8,
            fontFamily: F, background: '#fafafa', transition: 'border-color 0.15s',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = '#1890ff'; }}
          onBlur={e => { e.currentTarget.style.borderColor = '#e0e0e0'; }}
        />

        {/* Parse hint */}
        <div style={{ minHeight: 20, marginTop: 4, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          {tokens.length > 0 ? (
            <>
              <span style={{ color: '#52c41a' }}>✓ {newTokens.length} 项可添加</span>
              {dupCount > 0 && <span style={{ color: '#bbb' }}>· {dupCount} 项已存在将跳过</span>}
              <KindBadge kind={matchMode} />
            </>
          ) : (
            <span style={{ color: '#ccc' }}>支持批量粘贴</span>
          )}
        </div>
      </div>

      {/* Confirm button */}
      <div style={{ padding: '6px 12px 0' }}>
        <Button
          onClick={handleConfirm}
          disabled={!canConfirm}
          block
          style={{
            borderRadius: 6,
            border: 'none',
            background: canConfirm ? (matchMode === 'fuzzy' ? '#7c4dff' : '#1890ff') : '#f0f0f0',
            color: canConfirm ? '#fff' : '#bbb',
          }}
        >
          {canConfirm
            ? `添加 ${newTokens.length} 项`
            : tokens.length > 0 ? '所有值已存在' : '请输入内容'}
        </Button>
      </div>

      {/* Added list */}
      {selected.length > 0 && (
        <>
          <div style={{
            padding: '8px 14px 4px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>已添加 {selected.length} 项</Typography.Text>
            <Typography.Link onClick={handleClear} style={{ fontSize: 12 }}>清空</Typography.Link>
          </div>

          <div style={{ maxHeight: 150, overflowY: 'auto', padding: '0 0 4px' }}>
            {selected.map(v => (
              <div
                key={v}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 14px' }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f5f5f5'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
              >
                <span style={{ flex: 1, fontSize: 12, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {v}
                </span>
                {valueMeta[v] && <KindBadge kind={valueMeta[v]} />}
                <X size={13} color="#bbb" style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => handleRemove(v)} />
              </div>
            ))}
          </div>

          {/* 排除 */}
          <div style={{
            display: 'flex', alignItems: 'center',
            padding: '7px 14px 10px',
            borderTop: '1px solid #f0f0f0', background: '#fafafa',
          }}>
            <div
              onClick={() => onExcludeChange(!exclude)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{
                width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                border: `1.5px solid ${exclude ? '#fa8c16' : '#d9d9d9'}`,
                background: exclude ? '#fa8c16' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s',
              }}>
                {exclude && <Check size={10} color="#fff" strokeWidth={3} />}
              </div>
              <span style={{ fontSize: 12, color: exclude ? '#fa8c16' : '#444' }}>排除</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main popover ─────────────────────────────────────────────────────────────

export function LocalFilterPopover({ localFilters, onChangeFilters, anchorRect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (ref.current?.contains(t)) return;
      if (t.closest('[data-date-range-portal]')) return;
      onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const top = anchorRect.bottom + 6;
  const left = anchorRect.left;

  const isActive = (key: string) => (localFilters[key]?.values?.length ?? 0) > 0;

  const handleCheckboxClick = (key: string) => {
    if (isActive(key)) {
      const next = { ...localFilters };
      delete next[key];
      onChangeFilters(next);
      if (expandedKey === key) setExpandedKey(null);
    } else {
      setExpandedKey(prev => (prev === key ? null : key));
    }
  };

  const handleRemoveValue = (key: string, value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const current = localFilters[key]?.values || [];
    const next = current.filter(v => v !== value);
    if (next.length === 0) {
      const nextFilters = { ...localFilters };
      delete nextFilters[key];
      onChangeFilters(nextFilters);
    } else {
      onChangeFilters({ ...localFilters, [key]: { ...localFilters[key], values: next } });
    }
  };

  const handleClearAll = () => {
    onChangeFilters({});
    setExpandedKey(null);
  };

  const handleChangeItemSelected = (key: string, next: string[]) => {
    if (next.length === 0) {
      const nextFilters = { ...localFilters };
      delete nextFilters[key];
      onChangeFilters(nextFilters);
    } else {
      onChangeFilters({ ...localFilters, [key]: { ...localFilters[key], values: next } });
    }
  };

  const handleChangeItemExclude = (key: string, exclude: boolean) => {
    if (!localFilters[key]) return;
    onChangeFilters({ ...localFilters, [key]: { ...localFilters[key], exclude } });
  };

  const totalActive = Object.values(localFilters).filter(v => (v.values?.length ?? 0) > 0).length;

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed', top, left, zIndex: 9999,
        width: 460, maxHeight: 580,
        background: '#fff', borderRadius: 8,
        boxShadow: '0 6px 24px rgba(0,0,0,0.14)',
        border: '1px solid #e8e8e8', fontFamily: F,
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '10px 16px', borderBottom: '1px solid #e8e8e8',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 16, flexShrink: 0,
      }}>
        <span style={{ fontSize: 13, fontWeight: 400, color: '#333' }}>局部筛选</span>
        <span style={{ fontSize: 12, color: '#aaa', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
          <Info size={12} style={{ flexShrink: 0 }} />
          仅对当前 Sheet 生效，与全局筛选冲突时以此为准
        </span>
      </div>

      {/* Filter groups */}
      <div style={{ padding: '12px 16px 4px', overflowY: 'auto', flex: 1 }}>
        {FILTER_GROUPS.map((group, gi) => (
          <div key={group.group} style={{ marginBottom: gi < FILTER_GROUPS.length - 1 ? 16 : 0 }}>
            <div style={{ fontSize: 12, color: '#aaa', marginBottom: 8 }}>{group.group}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {group.items.map(item => {
                const active = isActive(item.key);
                const expanded = expandedKey === item.key;
                const selectedValues = localFilters[item.key]?.values || [];
                const chipData = FILTER_CHIP_DATA[item.key];
                const isTextInput = TEXT_INPUT_KEYS.has(item.key);
                const itemExclude = !!localFilters[item.key]?.exclude;
                const activeColor = itemExclude ? '#fa8c16' : '#1677ff';
                const chipBg     = itemExclude ? '#fff7e6' : '#e6f4ff';
                const chipBorder  = itemExclude ? '#ffd591' : '#bae0ff';

                // adCreateTime 使用日期范围选择器，与 FilterBar 消耗时间保持一致
                if (item.key === 'adCreateTime') {
                  return (
                    <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px', borderRadius: 6 }}>
                      <div onClick={e => { e.stopPropagation(); if (active) handleCheckboxClick(item.key); }} style={{ cursor: active ? 'pointer' : 'default' }}>
                        <Checkbox checked={active} style={{ pointerEvents: 'none' }} />
                      </div>
                      <span style={{ fontSize: 13, color: active ? activeColor : '#333', whiteSpace: 'nowrap', flexShrink: 0 }}>{item.label}</span>
                      <DateRangeTrigger
                        start={selectedValues[0] || ''}
                        end={selectedValues[1] || ''}
                        onChange={(s, e) => handleChangeItemSelected(item.key, s || e ? [s, e] : [])}
                        clearable={false}
                      />
                    </div>
                  );
                }

                return (
                  <div key={item.key}>
                    {/* Row */}
                    <div
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '6px 4px', borderRadius: 6, cursor: 'pointer',
                      }}
                      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = '#fafafa'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                      onClick={() => setExpandedKey(prev => prev === item.key ? null : item.key)}
                    >
                      {/* Checkbox — only this clears the selection */}
                      <div onClick={e => { e.stopPropagation(); handleCheckboxClick(item.key); }}>
                        <Checkbox checked={active} style={{ pointerEvents: 'none' }} />
                      </div>

                      {/* Label */}
                      <span style={{ fontSize: 13, color: active ? activeColor : '#333', flexShrink: 0 }}>
                        {item.label}
                      </span>

                      {/* Selected value display */}
                      {active && selectedValues.length > 0 && item.key === 'priceRange' && (() => {
                        const [pMin, pMax, rMin, rMax] = selectedValues;
                        const hasPrice = pMin || pMax;
                        const hasRoi = rMin || rMax;
                        const priceTxt = hasPrice ? `${pMin || ''}～${pMax || ''}` : '';
                        const roiTxt = hasRoi ? `ROI ${rMin || ''}～${rMax || ''}` : '';
                        const summary = [priceTxt, roiTxt].filter(Boolean).join(', ');
                        return (
                          <span style={{ fontSize: 12, color: activeColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
                            {summary}
                          </span>
                        );
                      })()}
                      {active && selectedValues.length > 0 && item.key !== 'priceRange' && (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'nowrap', flex: 1, minWidth: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                          {selectedValues.slice(0, 2).map(v => (
                            <span
                              key={v}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 3,
                                padding: '1px 6px', background: chipBg,
                                border: `1px solid ${chipBorder}`, borderRadius: 3,
                                fontSize: 12, color: activeColor, whiteSpace: 'nowrap', flexShrink: 0,
                              }}
                            >
                              {v}
                              <X size={10} style={{ cursor: 'pointer', flexShrink: 0 }}
                                onClick={e => handleRemoveValue(item.key, v, e)} />
                            </span>
                          ))}
                          {selectedValues.length > 2 && (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center',
                              padding: '1px 6px', background: chipBg,
                              border: `1px solid ${chipBorder}`, borderRadius: 3,
                              fontSize: 12, color: activeColor, whiteSpace: 'nowrap', flexShrink: 0,
                            }}>
                              等{selectedValues.length - 2}项
                            </span>
                          )}
                        </div>
                      )}

                      {/* Expand toggle */}
                      {(chipData || isTextInput || item.key === 'priceRange') && (
                        <div style={{ color: '#bbb', flexShrink: 0, lineHeight: 0, marginLeft: 'auto' }}>
                          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </div>
                      )}
                    </div>

                    {/* Expanded panel */}
                    {expanded && item.key === 'priceRange' && (
                      <PriceRangePanel
                        values={selectedValues}
                        onChange={next => handleChangeItemSelected(item.key, next)}
                        onClose={() => setExpandedKey(null)}
                      />
                    )}
                    {expanded && item.key !== 'priceRange' && isTextInput && (
                      <TextInputPanel
                        key={item.key}
                        tabs={TEXT_INPUT_TABS[item.key] ?? [{ key: 'id', label: item.label, placeholder: `输入${item.label}` }]}
                        selected={selectedValues}
                        onChangeSelected={next => handleChangeItemSelected(item.key, next)}
                        exclude={itemExclude}
                        onExcludeChange={v => handleChangeItemExclude(item.key, v)}
                      />
                    )}
                    {expanded && item.key !== 'priceRange' && !isTextInput && chipData && (
                      <ItemPanel
                        key={item.key}
                        label={item.label}
                        options={chipData.options}
                        selected={selectedValues}
                        onChangeSelected={next => handleChangeItemSelected(item.key, next)}
                        exclude={itemExclude}
                        onExcludeChange={v => handleChangeItemExclude(item.key, v)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: '8px 16px', borderTop: '1px solid #f0f0f0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 12, color: '#8c8c8c' }}>
          {totalActive > 0 ? `已设置 ${totalActive} 个条件` : ''}
        </span>
        <Button
          type="link"
          size="small"
          onClick={handleClearAll}
          disabled={totalActive === 0}
          style={{ fontSize: 12, padding: 0, color: totalActive > 0 ? '#ff4d4f' : '#d9d9d9' }}
        >
          清空全部
        </Button>
      </div>
    </div>
  );
}

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Info, Search, X, ChevronDown, ChevronUp, Check, ArrowLeft } from 'lucide-react';
import { FILTER_GROUPS, FILTER_CHIP_DATA } from './filterConfig';

const F = "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif";

export type LocalFilters = Record<string, string[]>;

type MatchMode = 'exact' | 'fuzzy';

// Keys that use text-input style panel instead of option-list panel
const TEXT_INPUT_KEYS = new Set(['accountId', 'adId']);

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
      fontSize: 10, lineHeight: '16px', padding: '0 4px', borderRadius: 3,
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
    <div style={{
      display: 'inline-flex', border: '1px solid #d9d9d9',
      borderRadius: 4, overflow: 'hidden', fontSize: 12, flexShrink: 0,
    }}>
      {(['exact', 'fuzzy'] as const).map(m => {
        const active = value === m;
        return (
          <div key={m} onClick={() => onChange(m)} style={{
            padding: '3px 9px', cursor: 'pointer',
            background: active ? '#1890ff' : '#fff',
            color: active ? '#fff' : '#555',
            userSelect: 'none', transition: 'background 0.12s, color 0.12s',
            borderRight: m === 'exact' ? '1px solid #d9d9d9' : 'none',
          }}>
            {m === 'exact' ? '精确' : '模糊'}
          </div>
        );
      })}
    </div>
  );
}

// ── Option-list panel (for filters with predefined options) ──────────────────

interface ItemPanelProps {
  label: string;
  options: string[];
  selected: string[];
  onChangeSelected: (next: string[]) => void;
}

function ItemPanel({ label, options, selected, onChangeSelected }: ItemPanelProps) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'selected'>('all');
  const [mode, setMode] = useState<'list' | 'batch'>('list');
  const [batchText, setBatchText] = useState('');
  const [matchMode, setMatchMode] = useState<MatchMode>('exact');
  const [exclude, setExclude] = useState(false);
  const [customMeta, setCustomMeta] = useState<Record<string, MatchMode>>({});

  const searchRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (mode === 'list') setTimeout(() => searchRef.current?.focus(), 50);
    if (mode === 'batch') setTimeout(() => textareaRef.current?.focus(), 50);
  }, [mode]);

  // Reset exclude when all selections cleared externally
  useEffect(() => {
    if (selected.length === 0) setExclude(false);
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
    setExclude(v => !v);
  };

  const handleClear = () => {
    onChangeSelected([]);
    setExclude(false);
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
            border: '1px solid #e0e0e0', borderRadius: 5,
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
                    fontSize: 11, color: '#1890ff', cursor: 'pointer',
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
                    fontSize: 10, padding: '0 4px', borderRadius: 3,
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
                  <div style={{
                    width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                    border: `1.5px solid ${checked ? '#1890ff' : '#d9d9d9'}`,
                    background: checked ? '#1890ff' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.12s',
                  }}>
                    {checked && <Check size={10} color="#fff" strokeWidth={3} />}
                  </div>
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
            <div style={{
              width: 14, height: 14, borderRadius: 3, flexShrink: 0,
              border: `1.5px solid ${isAllSelected && !selectAllDisabled ? '#1890ff' : '#d9d9d9'}`,
              background: isAllSelected && !selectAllDisabled ? '#1890ff' : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s',
            }}>
              {isAllSelected && !selectAllDisabled && <Check size={10} color="#fff" strokeWidth={3} />}
            </div>
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
          <span style={{ fontSize: 11, color: '#999', flexShrink: 0 }}>匹配方式</span>
          <ModeToggle value={matchMode} onChange={setMatchMode} />
        </div>

        <div style={{
          padding: '5px 12px', fontSize: 11,
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
              border: '1px solid #e0e0e0', borderRadius: 5,
              padding: '8px 10px', fontSize: 12, color: '#333',
              resize: 'none', outline: 'none', lineHeight: 1.7,
              fontFamily: F, background: '#fafafa',
            }}
          />
        </div>

        {matchMode === 'exact' && batchTokens.length > 0 && (
          <div style={{ padding: '7px 13px 4px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {exactMatched.length > 0 && (
              <div style={{ fontSize: 11, color: '#52c41a', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>✓ 精确匹配 {exactMatched.length} 项：</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#389e0d', maxWidth: 140 }}>
                  {exactMatched.join('、')}
                </span>
              </div>
            )}
            {exactUnmatched.length > 0 && (
              <div style={{ fontSize: 11, color: '#bbb', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center',
                  padding: '0 5px', borderRadius: 3,
                  background: '#f5f5f5', color: '#999', border: '1px solid #e8e8e8',
                  fontSize: 10, lineHeight: '16px', flexShrink: 0,
                }}>
                  已忽略 {exactUnmatched.length} 项
                </span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>
                  {exactUnmatched.join('、')}
                </span>
              </div>
            )}
            {exactMatched.length === 0 && (
              <div style={{ fontSize: 11, color: '#ff4d4f' }}>✕ 所有值均未在选项中找到，无法追加</div>
            )}
          </div>
        )}

        {matchMode === 'fuzzy' && batchTokens.length > 0 && (
          <div style={{ padding: '7px 13px 4px' }}>
            <div style={{ fontSize: 11, color: '#7c4dff', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
              <span>共 {batchTokens.length} 个关键字将以</span>
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '0 5px', borderRadius: 3,
                background: '#f9f0ff', color: '#722ed1', border: '1px solid #d3adf7',
                fontSize: 10, lineHeight: '16px',
              }}>模糊</span>
              <span>自定义值追加到已选</span>
            </div>
          </div>
        )}

        <div style={{ padding: '10px 12px 12px' }}>
          <button
            onClick={handleBatchConfirm}
            disabled={matchMode === 'exact' ? exactMatched.length === 0 : batchTokens.length === 0}
            style={{
              width: '100%', padding: '7px 0', borderRadius: 5, border: 'none',
              background: (() => {
                if (matchMode === 'exact') return exactMatched.length > 0 ? '#1890ff' : '#f0f0f0';
                return batchTokens.length > 0 ? '#7c4dff' : '#f0f0f0';
              })(),
              color: (() => {
                if (matchMode === 'exact') return exactMatched.length > 0 ? '#fff' : '#bbb';
                return batchTokens.length > 0 ? '#fff' : '#bbb';
              })(),
              fontSize: 13,
              cursor: (() => {
                if (matchMode === 'exact') return exactMatched.length > 0 ? 'pointer' : 'not-allowed';
                return batchTokens.length > 0 ? 'pointer' : 'not-allowed';
              })(),
              transition: 'background 0.15s', fontFamily: F,
            }}
          >
            {matchMode === 'exact'
              ? exactMatched.length > 0
                ? `追加 ${exactMatched.length} 个匹配项`
                : batchTokens.length > 0 ? '无可追加项（未命中）' : '请输入内容'
              : batchTokens.length > 0
                ? `确认追加 ${batchTokens.length} 个关键字（模糊匹配）`
                : '请输入内容'}
          </button>
        </div>
      </>)}
    </div>
  );
}

// ── Text-input panel (for accountId / adId) ──────────────────────────────────

interface TextInputPanelProps {
  entityLabel: string; // '账号' | '广告'
  selected: string[];
  onChangeSelected: (next: string[]) => void;
}

function TextInputPanel({ entityLabel, selected, onChangeSelected }: TextInputPanelProps) {
  const [subType, setSubType] = useState<'id' | 'name'>('id');
  const [matchMode, setMatchMode] = useState<MatchMode>('exact');
  const [inputText, setInputText] = useState('');
  const [valueMeta, setValueMeta] = useState<Record<string, MatchMode>>({});
  const [exclude, setExclude] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  useEffect(() => {
    if (selected.length === 0) { setExclude(false); setValueMeta({}); }
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
    setExclude(false);
    setValueMeta({});
  };

  const handleSwitchSubType = (t: 'id' | 'name') => {
    if (t === subType) return;
    setSubType(t);
    onChangeSelected([]);
    setExclude(false);
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
          {(['id', 'name'] as const).map(t => {
            const lbl = t === 'id' ? `${entityLabel}ID` : `${entityLabel}名称`;
            const active = subType === t;
            return (
              <div key={t} onClick={() => handleSwitchSubType(t)} style={{
                padding: '8px 10px 7px', fontSize: 13, cursor: 'pointer',
                color: active ? '#1890ff' : '#555',
                borderBottom: active ? '2px solid #1890ff' : '2px solid transparent',
                fontWeight: active ? 500 : 400,
                marginBottom: -1, userSelect: 'none', transition: 'color 0.15s',
              }}>
                {lbl}
              </div>
            );
          })}
        </div>
        <ModeToggle value={matchMode} onChange={setMatchMode} />
      </div>

      {/* Textarea */}
      <div style={{ padding: '10px 12px 0' }}>
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder={
            subType === 'id'
              ? `输入${entityLabel}ID，支持多个\n每行一个，或用逗号/空格分隔`
              : `输入${entityLabel}名称，支持多个\n每行一个，或用逗号/空格分隔`
          }
          rows={4}
          style={{
            width: '100%', boxSizing: 'border-box',
            border: '1px solid #e0e0e0', borderRadius: 5,
            padding: '8px 10px', fontSize: 12, color: '#333',
            resize: 'none', outline: 'none', lineHeight: 1.8,
            fontFamily: F, background: '#fafafa', transition: 'border-color 0.15s',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = '#1890ff'; }}
          onBlur={e => { e.currentTarget.style.borderColor = '#e0e0e0'; }}
        />

        {/* Parse hint */}
        <div style={{ minHeight: 20, marginTop: 4, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
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
        <button
          onClick={handleConfirm}
          disabled={!canConfirm}
          style={{
            width: '100%', padding: '7px 0', borderRadius: 4,
            border: 'none', fontSize: 13, fontFamily: F,
            background: canConfirm ? (matchMode === 'fuzzy' ? '#7c4dff' : '#1890ff') : '#f0f0f0',
            color: canConfirm ? '#fff' : '#bbb',
            cursor: canConfirm ? 'pointer' : 'not-allowed',
            transition: 'background 0.15s',
          }}
        >
          {canConfirm
            ? `添加 ${newTokens.length} 项`
            : tokens.length > 0 ? '所有值已存在' : '请输入内容'}
        </button>
      </div>

      {/* Added list */}
      {selected.length > 0 && (
        <>
          <div style={{
            padding: '8px 14px 4px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 11, color: '#999' }}>已添加 {selected.length} 项</span>
            <span onClick={handleClear} style={{ fontSize: 11, color: '#1890ff', cursor: 'pointer', userSelect: 'none' }}>
              清空
            </span>
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
              onClick={() => setExclude(v => !v)}
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
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const top = anchorRect.bottom + 6;
  const left = anchorRect.left;

  const isActive = (key: string) => (localFilters[key]?.length ?? 0) > 0;

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
    const current = localFilters[key] || [];
    const next = current.filter(v => v !== value);
    if (next.length === 0) {
      const nextFilters = { ...localFilters };
      delete nextFilters[key];
      onChangeFilters(nextFilters);
    } else {
      onChangeFilters({ ...localFilters, [key]: next });
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
      onChangeFilters({ ...localFilters, [key]: next });
    }
  };

  const totalActive = Object.values(localFilters).filter(v => v.length > 0).length;

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed', top, left, zIndex: 9999,
        width: 460, maxHeight: 580, overflowY: 'auto',
        background: '#fff', borderRadius: 8,
        boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
        border: '1px solid #e8e8e8', fontFamily: F,
      }}
    >
      {/* Info banner */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 8,
        padding: '10px 16px', background: '#e6f4ff',
        borderBottom: '1px solid #bae0ff', borderRadius: '8px 8px 0 0',
      }}>
        <Info size={14} color="#1890ff" style={{ flexShrink: 0, marginTop: 1 }} />
        <span style={{ fontSize: 12, color: '#1677ff', lineHeight: 1.6 }}>
          局部筛选仅对当前 Sheet 生效；与全局筛选相同维度冲突时，以局部筛选为准
        </span>
      </div>

      {/* Filter groups */}
      <div style={{ padding: '12px 16px 16px' }}>
        {FILTER_GROUPS.map((group, gi) => (
          <div key={group.group} style={{ marginBottom: gi < FILTER_GROUPS.length - 1 ? 16 : 0 }}>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>{group.group}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {group.items.map(item => {
                const active = isActive(item.key);
                const expanded = expandedKey === item.key;
                const selectedValues = localFilters[item.key] || [];
                const chipData = FILTER_CHIP_DATA[item.key];
                const isTextInput = TEXT_INPUT_KEYS.has(item.key);

                return (
                  <div key={item.key}>
                    {/* Row */}
                    <div
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '5px 6px', borderRadius: 4, cursor: 'pointer',
                        background: active ? '#f0f7ff' : 'transparent',
                        border: `1px solid ${active ? '#bae0ff' : 'transparent'}`,
                        transition: 'all 0.15s',
                      }}
                      onClick={() => handleCheckboxClick(item.key)}
                    >
                      {/* Checkbox */}
                      <div style={{
                        width: 16, height: 16, borderRadius: 3, flexShrink: 0,
                        border: `1.5px solid ${active ? '#1890ff' : '#d9d9d9'}`,
                        background: active ? '#1890ff' : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}>
                        {active && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>

                      {/* Label */}
                      <span style={{ fontSize: 13, color: active ? '#1890ff' : '#333', flex: 1 }}>
                        {item.label}
                      </span>

                      {/* Selected value chips */}
                      {active && selectedValues.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flex: 2 }} onClick={e => e.stopPropagation()}>
                          {selectedValues.map(v => (
                            <span
                              key={v}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 3,
                                padding: '1px 6px', background: '#e6f7ff',
                                border: '1px solid #bae0ff', borderRadius: 3,
                                fontSize: 12, color: '#1890ff', whiteSpace: 'nowrap',
                              }}
                            >
                              {v}
                              <X size={10} style={{ cursor: 'pointer', flexShrink: 0 }}
                                onClick={e => handleRemoveValue(item.key, v, e)} />
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Expand toggle */}
                      {(chipData || isTextInput) && (
                        <div
                          onClick={e => { e.stopPropagation(); setExpandedKey(prev => prev === item.key ? null : item.key); }}
                          style={{ color: '#bbb', flexShrink: 0, lineHeight: 0 }}
                        >
                          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </div>
                      )}
                    </div>

                    {/* Expanded panel */}
                    {expanded && isTextInput && (
                      <TextInputPanel
                        key={item.key}
                        entityLabel={item.key === 'accountId' ? '账号' : '广告'}
                        selected={selectedValues}
                        onChangeSelected={next => handleChangeItemSelected(item.key, next)}
                      />
                    )}
                    {expanded && !isTextInput && chipData && (
                      <ItemPanel
                        key={item.key}
                        label={item.label}
                        options={chipData.options}
                        selected={selectedValues}
                        onChangeSelected={next => handleChangeItemSelected(item.key, next)}
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
      {totalActive > 0 && (
        <div style={{
          padding: '10px 16px', borderTop: '1px solid #f0f0f0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 12, color: '#999' }}>已设置 {totalActive} 个维度条件</span>
          <span onClick={handleClearAll} style={{ fontSize: 12, color: '#ff4d4f', cursor: 'pointer' }}>
            清空全部
          </span>
        </div>
      )}
    </div>
  );
}

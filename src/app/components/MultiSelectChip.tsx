import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button, Checkbox, Input, Segmented, Tag } from 'antd';
import { SearchOutlined, ArrowLeftOutlined } from '@ant-design/icons';

type MatchMode = 'exact' | 'fuzzy';
type CustomKind = 'exact' | 'fuzzy';

interface Props {
  label: string;
  options: string[];
  optionAnnotations?: Record<string, { col1?: string; col2?: string }>;
  selected: string[];
  onChange: (selected: string[]) => void;
  exclude: boolean;
  onExcludeChange: (exclude: boolean) => void;
}

function parseTokens(raw: string): string[] {
  return raw
    .split(/[\n,，\s]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

function CustomBadge({ kind }: { kind: CustomKind | undefined }) {
  if (!kind) return null;
  return (
    <Tag
      style={{ marginInlineEnd: 0, marginLeft: 2, flexShrink: 0, fontSize: 10, lineHeight: '16px', padding: '0 5px' }}
      color={kind === 'exact' ? 'success' : 'purple'}
    >
      {kind === 'exact' ? '精确' : '模糊'}
    </Tag>
  );
}

export function MultiSelectChip({
  label, options, optionAnnotations, selected, onChange, exclude, onExcludeChange,
}: Props) {
  const [open, setOpen]           = useState(false);
  const [search, setSearch]       = useState('');
  const [tab, setTab]             = useState<'all' | 'selected'>('all');
  const [mode, setMode]           = useState<'list' | 'batch'>('list');
  const [batchText, setBatchText] = useState('');
  const [matchMode, setMatchMode] = useState<MatchMode>('exact');
  const [dropPos, setDropPos]     = useState<{ left: number; top: number } | null>(null);

  const [customMeta, setCustomMeta] = useState<Record<string, CustomKind>>({});

  const wrapRef       = useRef<HTMLDivElement>(null);
  const dropdownRef   = useRef<HTMLDivElement>(null);
  const btnRef        = useRef<HTMLButtonElement>(null);
  const searchRef     = useRef<HTMLInputElement>(null);
  const textareaRef   = useRef<HTMLTextAreaElement>(null);
  const closeTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ignoreLeave   = useRef(false);
  const mouseInside   = useRef(false);

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const scheduleClose = () => {
    if (ignoreLeave.current) return;
    clearCloseTimer();
    closeTimer.current = setTimeout(() => {
      setOpen(false);
      resetPopover();
    }, 180);
  };

  const temporarilyIgnoreLeave = () => {
    ignoreLeave.current = true;
    window.setTimeout(() => {
      ignoreLeave.current = false;
      if (!mouseInside.current) scheduleClose();
    }, 220);
  };

  useEffect(() => {
    if (!open) return;
    return () => {
      clearCloseTimer();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (mode === 'list')  setTimeout(() => searchRef.current?.focus(), 50);
    if (mode === 'batch') setTimeout(() => textareaRef.current?.focus(), 50);
  }, [open, mode]);

  useEffect(() => {
    if (!open) return;
    const dropdownEl = dropdownRef.current;
    if (!dropdownEl) return;

    const stopPropagation = (e: Event) => {
      e.stopImmediatePropagation();
    };

    dropdownEl.addEventListener('mousedown', stopPropagation, true);
    dropdownEl.addEventListener('touchstart', stopPropagation, true);

    return () => {
      dropdownEl.removeEventListener('mousedown', stopPropagation, true);
      dropdownEl.removeEventListener('touchstart', stopPropagation, true);
    };
  }, [open, dropPos]);

  const resetPopover = () => {
    setSearch('');
    setTab('all');
    setMode('list');
  };

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setDropPos({ left: r.left, top: r.bottom + 4 });
    }
    if (open) resetPopover();
    setOpen(v => !v);
  };

  const optionSet = useMemo(() => new Set(options), [options]);
  const isCustomValue = (v: string) => !optionSet.has(v);

  const filteredOptions = options.filter(o =>
    o.toLowerCase().includes(search.toLowerCase())
  );

  const displayList =
    tab === 'all'
      ? filteredOptions
      : selected.filter(s => s.toLowerCase().includes(search.toLowerCase()));

  const toggleOption = (opt: string) => {
    temporarilyIgnoreLeave();
    clearCloseTimer();

    if (selected.includes(opt)) {
      onChange(selected.filter(s => s !== opt));
      if (customMeta[opt] !== undefined) {
        setCustomMeta(prev => {
          const next = { ...prev };
          delete next[opt];
          return next;
        });
      }
    } else {
      onChange([...selected, opt]);
    }
    setOpen(true);
  };

  const isAllSelected =
    filteredOptions.length > 0 && filteredOptions.every(o => selected.includes(o));

  const handleSelectAll = () => {
    if (exclude) return;
    temporarilyIgnoreLeave();
    clearCloseTimer();

    if (isAllSelected) {
      const fs = new Set(filteredOptions);
      onChange(selected.filter(s => !fs.has(s)));
      setCustomMeta(prev => {
        const next = { ...prev };
        filteredOptions.forEach(o => delete next[o]);
        return next;
      });
    } else {
      onChange(Array.from(new Set([...selected, ...filteredOptions])));
    }
    setOpen(true);
  };

  const handleExclude = () => {
    if (!exclude && isAllSelected && !search) return;
    temporarilyIgnoreLeave();
    clearCloseTimer();
    onExcludeChange(!exclude);
    setOpen(true);
  };

  const handleClear = () => {
    temporarilyIgnoreLeave();
    clearCloseTimer();
    onChange([]);
    onExcludeChange(false);
    setCustomMeta({});
    setOpen(true);
  };

  const batchTokens    = useMemo(() => parseTokens(batchText), [batchText]);
  const exactMatched   = useMemo(() => batchTokens.filter(t => optionSet.has(t)),  [batchTokens, optionSet]);
  const exactUnmatched = useMemo(() => batchTokens.filter(t => !optionSet.has(t)), [batchTokens, optionSet]);

  const handleBatchConfirm = () => {
    if (batchTokens.length === 0) return;
    temporarilyIgnoreLeave();
    clearCloseTimer();

    if (matchMode === 'exact') {
      if (exactMatched.length === 0) return;
      const merged = Array.from(new Set([...selected, ...exactMatched]));
      onChange(merged);
    } else {
      const merged = Array.from(new Set([...selected, ...batchTokens]));
      onChange(merged);
      const newMeta: Record<string, CustomKind> = {};
      batchTokens.forEach(t => { newMeta[t] = 'fuzzy'; });
      setCustomMeta(prev => ({ ...prev, ...newMeta }));
    }

    setBatchText('');
    setMode('list');
    setTab('selected');
    setOpen(true);
  };

  const hasSelection = selected.length > 0;

  let displayValue: string;
  if (!hasSelection) {
    displayValue = '不限';
  } else if (exclude) {
    const names = selected.slice(0, 1).join('、');
    displayValue = selected.length > 1
      ? `排除 ${names} 等${selected.length}项`
      : `排除 ${names}`;
  } else {
    const names = selected.slice(0, 2).join('、');
    displayValue = selected.length > 2
      ? `${names} 等${selected.length}项`
      : names;
  }

  const activeColor       = exclude ? '#fa8c16' : '#1890ff';
  const activeBg          = exclude ? '#fff7e6' : '#e6f7ff';
  const isActive          = hasSelection;
  const selectAllDisabled = exclude;
  const excludeDisabled   = isAllSelected && !search && !exclude;

  const customCount = selected.filter(s => isCustomValue(s)).length;
  const hasAnnotations = useMemo(
    () => options.some(o => !!optionAnnotations?.[o]?.col1 || !!optionAnnotations?.[o]?.col2),
    [options, optionAnnotations],
  );

  return (
    <div
      ref={wrapRef}
      style={{ position: 'relative', flexShrink: 0 }}
      onMouseEnter={() => { mouseInside.current = true; clearCloseTimer(); }}
      onMouseLeave={() => { mouseInside.current = false; scheduleClose(); }}
    >
      {/* ── Trigger button ── */}
      <button
        ref={btnRef}
        onMouseDown={() => { clearCloseTimer(); }}
        onClick={handleToggle}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          border: `1px solid ${(open || isActive) ? activeColor : '#d9d9d9'}`,
          borderRadius: 4, padding: '0 8px', height: 28,
          background: isActive ? activeBg : open ? '#f5f5f5' : '#fff',
          cursor: 'pointer', fontSize: 13,
          whiteSpace: 'nowrap', outline: 'none',
          transition: 'all 0.15s',
        }}
      >
        <span style={{ color: '#555' }}>{label}:</span>
        <span style={{
          color: isActive ? activeColor : '#bbb',
          maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {displayValue}
        </span>
        <svg
          width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={isActive ? activeColor : '#aaa'}
          strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* ── Dropdown ── */}
      {open && dropPos && (
        <div
          ref={dropdownRef}
          onMouseEnter={() => { mouseInside.current = true; clearCloseTimer(); }}
          onMouseLeave={() => { mouseInside.current = false; scheduleClose(); }}
          style={{
            position: 'fixed',
            left: dropPos.left,
            top: dropPos.top,
            zIndex: 9999,
            background: '#fff',
            borderRadius: 8,
            border: '1px solid #e8e8e8',
            boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
            width: 300,
            overflow: 'hidden',
          }}
        >

          {/* ════════════════ LIST MODE ════════════════ */}
          {mode === 'list' && (<>

            {/* Search bar */}
            <div style={{ padding: '10px 12px 0' }}>
              <Input
                ref={searchRef as React.Ref<any>}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="搜索选项…"
                size="middle"
                prefix={<SearchOutlined style={{ color: '#bbb', fontSize: 12 }} />}
                suffix={
                  search ? (
                    <span
                      style={{ cursor: 'pointer', color: '#bbb', fontSize: 12 }}
                      onClick={() => setSearch('')}
                    >✕</span>
                  ) : (
                    <Button
                      type="link"
                      size="small"
                      style={{ fontSize: 11, padding: 0, height: 'auto', borderLeft: '1px solid #e8e8e8', paddingLeft: 7, marginLeft: 2 }}
                      onClick={() => setMode('batch')}
                    >
                      批量输入
                    </Button>
                  )
                }
                style={{ background: '#fafafa', fontSize: 12 }}
              />
            </div>

            {/* Tabs */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid #f0f0f0',
              padding: '0 12px',
              marginTop: 8,
            }}>
              {(['all', 'selected'] as const).map(t => {
                let tabLabel: React.ReactNode;
                if (t === 'all') {
                  tabLabel = '全部';
                } else {
                  tabLabel = (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>已选 ({selected.length})</span>
                      {customCount > 0 && (
                        <Tag style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px', margin: 0 }}>
                          {customCount} 自定义
                        </Tag>
                      )}
                    </span>
                  );
                }
                const active = tab === t;
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
            <div style={{ maxHeight: 240, overflowY: 'auto', padding: '4px 0' }}>
              {displayList.length === 0 ? (
                <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 12, color: '#bbb' }}>
                  {tab === 'selected' ? '暂无已选项' : '无匹配选项'}
                </div>
              ) : (
                displayList.map(opt => {
                  const checked  = selected.includes(opt);
                  const isCustom = isCustomValue(opt);
                  const kind     = customMeta[opt];

                  return (
                    <div
                      key={opt}
                      onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggleOption(opt); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '7px 14px', cursor: 'pointer', fontSize: 13, color: '#333',
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f5f5f5'}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                    >
                      <Checkbox checked={checked} style={{ flexShrink: 0 }} />

                      <span style={{
                        flex: hasAnnotations ? '0 0 44%' : 1,
                        minWidth: 0,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        color: isCustom ? '#555' : '#333',
                      }}>
                        {opt}
                      </span>

                      {hasAnnotations && (
                        <>
                          <span style={{
                            flex: '0 0 26%',
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: '#595959',
                            fontSize: 12,
                            textAlign: 'left',
                          }}>
                            {optionAnnotations?.[opt]?.col1 ?? ''}
                          </span>
                          <span style={{
                            flex: '0 0 18%',
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: '#8c8c8c',
                            fontSize: 12,
                            textAlign: 'left',
                          }}>
                            {optionAnnotations?.[opt]?.col2 ?? ''}
                          </span>
                        </>
                      )}

                      {isCustom && <CustomBadge kind={kind} />}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer: 全选 + 排除 */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 14px',
              borderTop: '1px solid #f0f0f0',
              background: '#fafafa',
            }}>
              <div
                onClick={!selectAllDisabled ? handleSelectAll : undefined}
                title={selectAllDisabled ? '排除模式下不可全选' : ''}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  cursor: selectAllDisabled ? 'not-allowed' : 'pointer',
                  opacity: selectAllDisabled ? 0.38 : 1,
                  userSelect: 'none',
                }}
              >
                <Checkbox
                  checked={isAllSelected && !selectAllDisabled}
                  disabled={selectAllDisabled}
                  style={{ pointerEvents: 'none' }}
                />
                <span style={{ fontSize: 12, color: '#444' }}>全选</span>
              </div>

              <div
                onClick={!excludeDisabled ? handleExclude : undefined}
                title={excludeDisabled ? '全选状态下不可使用排除' : '排除勾选的选项（NOT IN）'}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  cursor: excludeDisabled ? 'not-allowed' : 'pointer',
                  opacity: excludeDisabled ? 0.38 : 1,
                  userSelect: 'none',
                }}
              >
                <Checkbox
                  checked={exclude}
                  disabled={excludeDisabled}
                  style={{ pointerEvents: 'none' }}
                />
                <span style={{ fontSize: 12, color: exclude ? '#fa8c16' : '#444' }}>排除</span>
              </div>
            </div>

            {/* Clear link */}
            {hasSelection && (
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

          {/* ════════════════ BATCH MODE ════════════════ */}
          {mode === 'batch' && (<>

            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center',
              padding: '9px 12px 8px',
              borderBottom: '1px solid #f0f0f0',
              gap: 8,
            }}>
              <Button
                type="link"
                size="small"
                icon={<ArrowLeftOutlined />}
                onClick={() => setMode('list')}
                style={{ padding: 0, height: 'auto', fontSize: 12, flexShrink: 0 }}
              >
                返回
              </Button>
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 11, color: '#999', flexShrink: 0 }}>匹配方式</span>
              <style>{`
                .match-mode-seg .ant-segmented-item { font-weight: 400 !important; color: #8c8c8c; font-size: 11px !important; }
                .match-mode-seg .ant-segmented-item-selected { font-weight: 400 !important; color: #595959 !important; font-size: 11px !important; }
                .match-mode-seg .ant-segmented-item-label { font-size: 11px !important; }
              `}</style>
              <Segmented
                size="small"
                value={matchMode}
                onChange={v => setMatchMode(v as MatchMode)}
                options={[
                  { label: '精确', value: 'exact' },
                  { label: '模糊', value: 'fuzzy' },
                ]}
                className="match-mode-seg"
                style={{ fontSize: 11 }}
              />
            </div>

            {/* Hint bar */}
            <div style={{
              padding: '5px 12px',
              fontSize: 11,
              color: matchMode === 'fuzzy' ? '#7c4dff' : '#999',
              background: matchMode === 'fuzzy' ? '#f3f0ff' : '#fafafa',
              borderBottom: '1px solid #f0f0f0',
              transition: 'all 0.15s',
            }}>
              {matchMode === 'exact'
                ? '仅追加与选项列表精确匹配的值，未命中的将被忽略'
                : '每个关键字追加后执行包含匹配（LIKE %keyword%），支持自定义值'}
            </div>

            {/* Textarea */}
            <div style={{ padding: '10px 12px 0' }}>
              <Input.TextArea
                ref={textareaRef as React.Ref<any>}
                value={batchText}
                onChange={e => setBatchText(e.target.value)}
                placeholder={'每行一个，或用逗号、空格分隔\n例：张磊, 李明\n王芳'}
                style={{
                  fontSize: 12, color: '#333',
                  resize: 'none', lineHeight: 1.7,
                  background: '#fafafa',
                  minHeight: 120,
                }}
              />
            </div>

            {/* Exact mode: match status */}
            {matchMode === 'exact' && batchTokens.length > 0 && (
              <div style={{ padding: '7px 13px 4px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {exactMatched.length > 0 && (
                  <div style={{ fontSize: 11, color: '#52c41a', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>✓ 精确匹配 {exactMatched.length} 项：</span>
                    <span style={{
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      color: '#389e0d', maxWidth: 140,
                    }}>
                      {exactMatched.join('、')}
                    </span>
                  </div>
                )}
                {exactUnmatched.length > 0 && (
                  <div style={{ fontSize: 11, color: '#bbb', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Tag style={{ fontSize: 10, lineHeight: '16px', padding: '0 5px', flexShrink: 0 }}>
                      已忽略 {exactUnmatched.length} 项
                    </Tag>
                    <span style={{
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      maxWidth: 150,
                    }}>
                      {exactUnmatched.join('、')}
                    </span>
                  </div>
                )}
                {exactMatched.length === 0 && (
                  <div style={{ fontSize: 11, color: '#ff4d4f' }}>
                    ✕ 所有值均未在选项中找到，无法追加
                  </div>
                )}
              </div>
            )}

            {/* Fuzzy mode: all tokens info */}
            {matchMode === 'fuzzy' && batchTokens.length > 0 && (
              <div style={{ padding: '7px 13px 4px' }}>
                <div style={{ fontSize: 11, color: '#7c4dff', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                  <span>共 {batchTokens.length} 个关键字将以</span>
                  <Tag color="purple" style={{ fontSize: 10, lineHeight: '16px', padding: '0 5px', margin: 0 }}>模糊</Tag>
                  <span>自定义值追加到已选</span>
                </div>
              </div>
            )}

            {/* Confirm button */}
            <div style={{ padding: '10px 12px 12px' }}>
              <Button
                block
                type="primary"
                disabled={matchMode === 'exact' ? exactMatched.length === 0 : batchTokens.length === 0}
                onClick={handleBatchConfirm}
                style={matchMode === 'fuzzy' && batchTokens.length > 0
                  ? { background: '#7c4dff', borderColor: '#7c4dff' }
                  : undefined}
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
      )}
    </div>
  );
}

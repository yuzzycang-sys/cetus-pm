import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search, X, ArrowLeft } from 'lucide-react';

const F = "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif";

type MatchMode = 'exact' | 'fuzzy';

// 自定义值的元信息：通过精确批量追加的 unmatched 值，或模糊批量追加的所有值
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

// ── Small segmented toggle ────────────────────────────────────
function ModeToggle({ value, onChange }: { value: MatchMode; onChange: (v: MatchMode) => void }) {
  return (
    <div style={{
      display: 'inline-flex',
      border: '1px solid #d9d9d9',
      borderRadius: 5,
      overflow: 'hidden',
      fontSize: 12,
      flexShrink: 0,
    }}>
      {(['exact', 'fuzzy'] as const).map(m => {
        const active = value === m;
        const label  = m === 'exact' ? '精确' : '模糊';
        return (
          <div
            key={m}
            onClick={() => onChange(m)}
            style={{
              padding: '3px 9px',
              cursor: 'pointer',
              background: active ? '#1890ff' : '#fff',
              color: active ? '#fff' : '#555',
              userSelect: 'none',
              transition: 'background 0.12s, color 0.12s',
              borderRight: m === 'exact' ? '1px solid #d9d9d9' : 'none',
            }}
          >
            {label}
          </div>
        );
      })}
    </div>
  );
}

// ── Custom value badge ────────────────────────────────────────
function CustomBadge({ kind }: { kind: CustomKind | undefined }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0, marginLeft: 2 }}>
      {/* Mode tag */}
      {kind === 'exact' && (
        <span style={{
          fontSize: 10, lineHeight: '16px',
          padding: '0 5px', borderRadius: 3,
          background: '#f6ffed', color: '#52c41a',
          border: '1px solid #b7eb8f',
          whiteSpace: 'nowrap',
        }}>
          精确
        </span>
      )}
      {kind === 'fuzzy' && (
        <span style={{
          fontSize: 10, lineHeight: '16px',
          padding: '0 5px', borderRadius: 3,
          background: '#f9f0ff', color: '#722ed1',
          border: '1px solid #d3adf7',
          whiteSpace: 'nowrap',
        }}>
          模糊
        </span>
      )}
    </div>
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

  // 自定义值元信息：key = 值文本，value = 追加方式
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
      // 若鼠标在忽略期间已离开组件，补发关闭调度
      if (!mouseInside.current) scheduleClose();
    }, 220);
  };

  // 只依赖鼠标进出关闭：选中后不立即消失，鼠标移出后才消失
  useEffect(() => {
    if (!open) return;
    return () => {
      clearCloseTimer();
    };
  }, [open]);

  // ── Auto-focus ────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    if (mode === 'list')  setTimeout(() => searchRef.current?.focus(), 50);
    if (mode === 'batch') setTimeout(() => textareaRef.current?.focus(), 50);
  }, [open, mode]);

  // Prevent dropdown clicks from reaching document outside-click handlers
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

  // ── Derived ───────────────────────────────────────────────────
  const optionSet = useMemo(() => new Set(options), [options]);

  // 判断一个选中值是否为自定义（不在预定义 options 中）
  const isCustomValue = (v: string) => !optionSet.has(v);

  // ── List mode helpers ─────────────────────────────────────────
  const filteredOptions = options.filter(o =>
    o.toLowerCase().includes(search.toLowerCase())
  );

  // 已选 tab：predefined options + custom values 都要展示
  const displayList =
    tab === 'all'
      ? filteredOptions
      : selected.filter(s => s.toLowerCase().includes(search.toLowerCase()));

  const toggleOption = (opt: string) => {
    temporarilyIgnoreLeave();
    clearCloseTimer();

    if (selected.includes(opt)) {
      // 取消勾选时同步清理 customMeta
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
    // 保持下拉展开，避免选中项导致误关闭
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
      // 全部取消时，清理这些 options 对应的 customMeta（预定义 options 不会有，但保险起见）
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

  // ── Batch mode helpers ────────────────────────────────────────
  const batchTokens    = useMemo(() => parseTokens(batchText), [batchText]);
  const exactMatched   = useMemo(() => batchTokens.filter(t => optionSet.has(t)),  [batchTokens, optionSet]);
  const exactUnmatched = useMemo(() => batchTokens.filter(t => !optionSet.has(t)), [batchTokens, optionSet]);

  const handleBatchConfirm = () => {
    if (batchTokens.length === 0) return;
    temporarilyIgnoreLeave();
    clearCloseTimer();

    if (matchMode === 'exact') {
      // 精确模式：只追加命中预定义选项的值，未命中的直接忽略
      if (exactMatched.length === 0) return;
      const merged = Array.from(new Set([...selected, ...exactMatched]));
      onChange(merged);
      // 精确模式不产生自定义值，无需写 customMeta
    } else {
      // 模糊模式：全部 tokens 均作为模糊自定义值追加
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

  // ── Trigger chip label ────────────────────────────────────────
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

  // 统计自定义值数量（用于 tab 提示）
  const customCount = selected.filter(s => isCustomValue(s)).length;
  const hasAnnotations = useMemo(
    () => options.some(o => !!optionAnnotations?.[o]?.col1 || !!optionAnnotations?.[o]?.col2),
    [options, optionAnnotations],
  );

  // ── Render ────────────────────────────────────────────────────
  return (
    <div ref={wrapRef} style={{ position: 'relative', flexShrink: 0 }}
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
          border: `1px solid ${(open || isActive) ? activeColor : '#dee0e3'}`,
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
        <ChevronDown
          size={11}
          color={isActive ? activeColor : '#aaa'}
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}
        />
      </button>

      {/* ── Dropdown ── */}
      {open && dropPos && (
        <div ref={dropdownRef}
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
          fontFamily: F,
          overflow: 'hidden',
        }}>

          {/* ════════════════ LIST MODE ════════════════ */}
          {mode === 'list' && (<>

            {/* Search bar + 批量输入 link */}
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
                  placeholder="搜索选项…"
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
            <div style={{
              display: 'flex',
              borderBottom: '1px solid #f0f0f0',
              padding: '0 12px',
              marginTop: 8,
            }}>
              {(['all', 'selected'] as const).map(t => {
                // 已选 tab：展示选中总数，括号内额外说明自定义数量
                let tabLabel: React.ReactNode;
                if (t === 'all') {
                  tabLabel = '全部';
                } else {
                  tabLabel = (
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
                  const kind     = customMeta[opt]; // 'exact' | 'fuzzy' | undefined

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
                      {/* Checkbox */}
                      <div style={{
                        width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                        border: `1.5px solid ${checked ? '#1890ff' : '#d9d9d9'}`,
                        background: checked ? '#1890ff' : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.12s',
                      }}>
                        {checked && <Check size={10} color="#fff" strokeWidth={3} />}
                      </div>

                      {/* Label */}
                      <span style={{
                        flex: hasAnnotations ? '0 0 44%' : 1,
                        minWidth: 0,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        fontStyle: 'normal',
                        color: isCustom ? '#555' : '#333',
                      }}>
                        {opt}
                      </span>

                      {/* Optional annotation columns */}
                      {hasAnnotations && (
                        <>
                          <span style={{
                            flex: '0 0 26%',
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: '#646a73',
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
                            color: '#8f959e',
                            fontSize: 12,
                            textAlign: 'left',
                          }}>
                            {optionAnnotations?.[opt]?.col2 ?? ''}
                          </span>
                        </>
                      )}

                      {/* 自定义 + 匹配方式 badges（仅在"已选"tab 中展示，或值本身就是自定义时） */}
                      {isCustom && (
                        <CustomBadge kind={kind} />
                      )}
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
                <div style={{
                  width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                  border: `1.5px solid ${isAllSelected && !selectAllDisabled ? '#1890ff' : '#d9d9d9'}`,
                  background: isAllSelected && !selectAllDisabled ? '#1890ff' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.12s',
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
                  opacity: excludeDisabled ? 0.38 : 1,
                  userSelect: 'none',
                }}
              >
                <div style={{
                  width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                  border: `1.5px solid ${exclude ? '#fa8c16' : '#d9d9d9'}`,
                  background: exclude ? '#fa8c16' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.12s',
                }}>
                  {exclude && <Check size={10} color="#fff" strokeWidth={3} />}
                </div>
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

            {/* Header: 返回 + 精确/模糊 toggle */}
            <div style={{
              display: 'flex', alignItems: 'center',
              padding: '9px 12px 8px',
              borderBottom: '1px solid #f0f0f0',
              gap: 8,
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
              <textarea
                ref={textareaRef}
                value={batchText}
                onChange={e => setBatchText(e.target.value)}
                placeholder={'每行一个，或用逗号、空格分隔\n例：张磊, 李明\n王芳'}
                rows={7}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  border: '1px solid #e0e0e0', borderRadius: 5,
                  padding: '8px 10px', fontSize: 12, color: '#333',
                  resize: 'none', outline: 'none', lineHeight: 1.7,
                  fontFamily: F, background: '#fafafa',
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
                    <span style={{
                      display: 'inline-flex', alignItems: 'center',
                      padding: '0 5px', borderRadius: 3,
                      background: '#f5f5f5', color: '#999', border: '1px solid #e8e8e8',
                      fontSize: 10, lineHeight: '16px', flexShrink: 0,
                    }}>
                      已忽略 {exactUnmatched.length} 项
                    </span>
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

            {/* Confirm button */}
            <div style={{ padding: '10px 12px 12px' }}>
              <button
                onClick={handleBatchConfirm}
                disabled={matchMode === 'exact' ? exactMatched.length === 0 : batchTokens.length === 0}
                style={{
                  width: '100%',
                  padding: '7px 0',
                  borderRadius: 5,
                  border: 'none',
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
                  transition: 'background 0.15s',
                  fontFamily: F,
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
      )}
    </div>
  );
}
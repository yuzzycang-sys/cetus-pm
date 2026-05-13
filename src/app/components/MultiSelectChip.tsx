import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button, Checkbox, Input, Tag } from 'antd';
import { SearchOutlined, ArrowLeftOutlined } from '@ant-design/icons';

interface Props {
  label: string;
  options: string[];
  optionAnnotations?: Record<string, { col1?: string; col2?: string }>;
  selected: string[];
  onChange: (selected: string[]) => void;
  exclude: boolean;
  onExcludeChange: (exclude: boolean) => void;
  disabledValues?: string[];
}

function parseTokens(raw: string): string[] {
  return raw
    .split(/[\n,，\s]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

export function MultiSelectChip({
  label, options, optionAnnotations, selected, onChange, exclude, onExcludeChange,
  disabledValues = [],
}: Props) {
  const disabledSet = useMemo(() => new Set(disabledValues), [disabledValues]);
  const [open, setOpen]           = useState(false);
  const [search, setSearch]       = useState('');
  const [tab, setTab]             = useState<'all' | 'selected'>('all');
  const [mode, setMode]           = useState<'list' | 'batch'>('list');
  const [batchText, setBatchText] = useState('');
  const [pendingItems, setPendingItems] = useState<{ value: string; valid: boolean }[]>([]);
  const [dropPos, setDropPos]     = useState<{ left: number; top: number } | null>(null);
  const [hovered, setHovered]     = useState(false);

  const wrapRef       = useRef<HTMLDivElement>(null);
  const dropdownRef   = useRef<HTMLDivElement>(null);
  const btnRef        = useRef<HTMLButtonElement>(null);
  const searchRef     = useRef<HTMLInputElement>(null);
  const tagInputRef   = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (mode === 'list')  setTimeout(() => searchRef.current?.focus(), 50);
    if (mode === 'batch') setTimeout(() => tagInputRef.current?.focus(), 50);
  }, [open, mode]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        wrapRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) return;
      setOpen(false);
      resetPopover();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const resetPopover = () => {
    setSearch('');
    setTab('all');
    setMode('list');
    setBatchText('');
    setPendingItems([]);
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
    if (selected.includes(opt)) {
      onChange(selected.filter(s => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
    setOpen(true);
  };

  const isAllSelected =
    filteredOptions.length > 0 && filteredOptions.every(o => selected.includes(o));

  const handleSelectAll = () => {
    if (exclude) return;
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
    onExcludeChange(!exclude);
    setOpen(true);
  };

  const handleClear = () => {
    onChange([]);
    onExcludeChange(false);
    setOpen(true);
  };

  const batchTokens = useMemo(() => parseTokens(batchText), [batchText]);

  // 精确模式：Enter 校验，转为 pending chips
  const commitExactValidate = () => {
    if (batchTokens.length === 0) return;
    const existingValues = new Set(pendingItems.map(p => p.value));
    const newItems = batchTokens
      .filter(t => !existingValues.has(t))
      .map(t => ({ value: t, valid: optionSet.has(t) }));
    setPendingItems(prev => [...prev, ...newItems]);
    setBatchText('');
    tagInputRef.current?.focus();
  };

  const handleBatchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); commitExactValidate(); }
  };

  const handlePendingConfirm = () => {
    const validValues = pendingItems.filter(p => p.valid).map(p => p.value);
    if (validValues.length === 0) return;
    onChange(Array.from(new Set([...selected, ...validValues])));
    setPendingItems([]);
    setMode('list');
    setTab('selected');
    setOpen(true);
  };

  const hasSelection = selected.length > 0;

  const disabledCount = selected.filter(s => disabledSet.has(s)).length;
  const enabledSelected = selected.filter(s => !disabledSet.has(s));

  let displayValue: string;
  if (!hasSelection) {
    displayValue = '不限';
  } else if (exclude) {
    const names = selected.slice(0, 1).join('、');
    displayValue = selected.length > 1
      ? `排除 ${names} 等${selected.length}项`
      : `排除 ${names}`;
  } else {
    const names = enabledSelected.slice(0, 2).join('、');
    const suffix = disabledCount > 0 ? ` (${disabledCount}项无权限)` : '';
    displayValue = enabledSelected.length > 2
      ? `${names} 等${enabledSelected.length}项${suffix}`
      : enabledSelected.length > 0
        ? `${names}${suffix}`
        : `${disabledCount}项无权限`;
  }

  const activeColor       = exclude ? '#fa8c16' : '#1890ff';
  const activeBg          = exclude ? '#fff7e6' : '#e6f7ff';
  const isActive          = hasSelection;
  const selectAllDisabled = exclude;
  const excludeDisabled   = isAllSelected && !search && !exclude;

  const customCount = selected.filter(s => isCustomValue(s) && !disabledSet.has(s)).length;
  const hasAnnotations = useMemo(
    () => options.some(o => !!optionAnnotations?.[o]?.col1 || !!optionAnnotations?.[o]?.col2),
    [options, optionAnnotations],
  );

  return (
    <div
      ref={wrapRef}
      style={{ position: 'relative', flexShrink: 0 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Trigger ── */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 180, flexShrink: 0 }}>
        <span style={{ fontSize: 13, color: '#333', whiteSpace: 'nowrap', fontWeight: 400, flexShrink: 0 }}>{label}</span>
        <button
          ref={btnRef}
          onClick={handleToggle}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 4,
            border: `1px solid ${open ? '#1677ff' : '#e0e0e0'}`,
            borderRadius: 6, padding: '0 8px 0 10px', height: 28,
            background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 400,
            outline: 'none', transition: 'border-color 0.15s', minWidth: 0,
          }}
        >
          <span style={{
            flex: 1, minWidth: 0, color: isActive ? (exclude ? '#fa8c16' : '#1677ff') : '#bbb',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            textAlign: 'left',
          }}>
            {displayValue}
          </span>
          {isActive && hovered ? (
            <span
              onClick={e => { e.stopPropagation(); handleClear(); }}
              style={{ flexShrink: 0, color: '#bbb', fontSize: 15, lineHeight: 1, display: 'flex', alignItems: 'center', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget as HTMLSpanElement).style.color = '#999'}
              onMouseLeave={e => (e.currentTarget as HTMLSpanElement).style.color = '#bbb'}
            >×</span>
          ) : (
            <svg
              width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#bbb"
              strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
              style={{ flexShrink: 0, transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          )}
        </button>
      </div>

      {/* ── Dropdown ── */}
      {open && dropPos && (
        <div
          ref={dropdownRef}
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
                      style={{ fontSize: 12, padding: 0, height: 'auto', borderLeft: '1px solid #e8e8e8', paddingLeft: 7, marginLeft: 2 }}
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
                        <Tag style={{ fontSize: 11, lineHeight: '16px', padding: '0 4px', margin: 0 }}>
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
                  const isDisabled = disabledSet.has(opt);

                  return (
                    <div
                      key={opt}
                      onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggleOption(opt); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '7px 14px', cursor: 'pointer', fontSize: 13,
                        color: isDisabled ? '#bfbfbf' : '#333',
                        opacity: isDisabled ? 0.7 : 1,
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f5f5f5'}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                    >
                      <Checkbox checked={checked} style={{ flexShrink: 0 }} />

                      <span style={{
                        flex: hasAnnotations ? '0 0 44%' : 1,
                        minWidth: 0,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        color: isDisabled ? '#bfbfbf' : isCustom ? '#555' : '#333',
                      }}>
                        {opt}
                      </span>

                      {isDisabled && (
                        <Tag color="default" style={{ marginInlineEnd: 0, fontSize: 11, lineHeight: '16px', padding: '0 5px', color: '#ff4d4f', borderColor: '#ffa39e', background: '#fff2f0' }}>
                          无权限
                        </Tag>
                      )}

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

                      {isCustom && (
                        <Tag style={{ marginInlineEnd: 0, marginLeft: 2, flexShrink: 0, fontSize: 11, lineHeight: '16px', padding: '0 5px' }} color="success">
                          精确
                        </Tag>
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
            }}>
              <Button
                type="link"
                size="small"
                icon={<ArrowLeftOutlined />}
                onClick={() => setMode('list')}
                style={{ padding: 0, height: 'auto', fontSize: 12 }}
              >
                返回
              </Button>
            </div>

            {/* 输入区：tag input */}
            <div style={{ padding: '10px 12px 0' }}>
              <div
                onClick={() => tagInputRef.current?.focus()}
                style={{
                  minHeight: 120, maxHeight: 200, overflowY: 'auto',
                  border: '1px solid #d9d9d9', borderRadius: 6,
                  background: '#fafafa', padding: '6px 8px',
                  display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start',
                  gap: 6, cursor: 'text',
                }}
              >
                {pendingItems.map(item => (
                  <span key={item.value} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                    padding: '1px 7px', borderRadius: 4, fontSize: 12,
                    background: item.valid ? '#e6f4ff' : '#f5f5f5',
                    color: item.valid ? '#1677ff' : '#bfbfbf',
                    border: `1px solid ${item.valid ? '#91caff' : '#d9d9d9'}`,
                    lineHeight: '20px', flexShrink: 0,
                  }}>
                    {item.value}
                    {!item.valid && <span style={{ fontSize: 11, color: '#bfbfbf' }}>(无效)</span>}
                    <span
                      onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setPendingItems(prev => prev.filter(p => p.value !== item.value)); }}
                      style={{ cursor: 'pointer', fontSize: 13, lineHeight: 1, color: item.valid ? '#91caff' : '#d9d9d9', marginLeft: 1 }}
                      onMouseEnter={e => (e.currentTarget as HTMLSpanElement).style.color = item.valid ? '#1677ff' : '#999'}
                      onMouseLeave={e => (e.currentTarget as HTMLSpanElement).style.color = item.valid ? '#91caff' : '#d9d9d9'}
                    >×</span>
                  </span>
                ))}
                <input
                  ref={tagInputRef}
                  value={batchText}
                  onChange={e => setBatchText(e.target.value)}
                  onKeyDown={handleBatchKeyDown}
                  placeholder={pendingItems.length === 0 ? '输入后按回车校验，支持逗号、空格分隔' : '继续输入…'}
                  style={{
                    border: 'none', outline: 'none', background: 'transparent',
                    fontSize: 12, color: '#333', lineHeight: '24px',
                    minWidth: 160, flex: 1,
                  }}
                />
              </div>
            </div>

            {/* 确认按钮 */}
            <div style={{ padding: '10px 12px 12px' }}>
              {batchTokens.length > 0 ? (
                <Button block onClick={commitExactValidate}>回车校验</Button>
              ) : pendingItems.some(p => p.valid) ? (
                <Button block type="primary" onClick={handlePendingConfirm}>
                  添加 {pendingItems.filter(p => p.valid).length} 个有效项
                </Button>
              ) : (
                <Button block disabled>
                  {pendingItems.length > 0 ? '无有效项可添加' : '请输入内容'}
                </Button>
              )}
            </div>
          </>)}

        </div>
      )}
    </div>
  );
}

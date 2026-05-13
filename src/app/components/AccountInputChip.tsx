import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button, Checkbox, Segmented, Spin } from 'antd';

type MatchMode = 'exact' | 'fuzzy';

export type InputTab = { key: string; label: string; placeholder: string };

type PendingStatus = 'validating' | 'valid' | 'invalid' | 'duplicate' | 'overflow';
type PendingItem = { value: string; status: PendingStatus };

interface Props {
  selected: string[];
  onChange: (selected: string[]) => void;
  exclude: boolean;
  onExcludeChange: (exclude: boolean) => void;
  entityLabel?: string;
  idLabel?: string;
  tabs?: InputTab[];
  /** 精确模式下校验输入值，返回有效/无效列表 */
  onValidate?: (values: string[]) => Promise<{ valid: string[]; invalid: string[] }>;
}

function parseTokens(raw: string): string[] {
  return raw.split(/[\n,，\s]+/).map(s => s.trim()).filter(Boolean);
}

export function AccountInputChip({
  selected, onChange, exclude, onExcludeChange,
  entityLabel = '账号', idLabel = 'ID', tabs: tabsProp,
  onValidate,
}: Props) {
  const [open, setOpen]               = useState(false);
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const [matchMode, setMatchMode]     = useState<MatchMode>('exact');
  const [inputText, setInputText]     = useState('');
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [dropPos, setDropPos]         = useState<{ left: number; top: number } | null>(null);
  const [hovered, setHovered]         = useState(false);
  const [valueMeta, setValueMeta]     = useState<Record<string, MatchMode>>({});

  const [inlineText, setInlineText] = useState('');
  const [tabDropOpen, setTabDropOpen] = useState(false);

  const resolvedTabs: InputTab[] = tabsProp ?? [
    { key: 'id',   label: `${entityLabel}${idLabel}`, placeholder: `输入${entityLabel}${idLabel}` },
    { key: 'name', label: `${entityLabel}名称`,       placeholder: `输入${entityLabel}名称` },
  ];
  const activeTab = resolvedTabs[activeTabIdx] ?? resolvedTabs[0];

  const wrapRef       = useRef<HTMLDivElement>(null);
  const dropdownRef   = useRef<HTMLDivElement>(null);
  const plusBtnRef    = useRef<HTMLButtonElement>(null);
  const inlineRef     = useRef<HTMLInputElement>(null);
  const tagInputRef   = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => tagInputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const inWrap = wrapRef.current?.contains(target) || dropdownRef.current?.contains(target);
      if (!inWrap) {
        if (open) { setOpen(false); setInputText(''); }
        if (tabDropOpen) setTabDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, tabDropOpen]);

  // 内联框有输入时，清空批量面板全部状态（用 useEffect 确保拿到最新 state）
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const excludeRef = useRef(exclude);
  excludeRef.current = exclude;

  useEffect(() => {
    if (inlineText.length === 0) return;
    const hasBatchState = open || selectedRef.current.length > 0 || inputText.length > 0 || pendingItems.length > 0 || excludeRef.current;
    if (!hasBatchState) return;
    setOpen(false);
    setInputText('');
    setPendingItems([]);
    onExcludeChange(false);
    onChange([]);
    setValueMeta({});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inlineText]);

  // 点击直接输入框：仅关闭批量面板（不立即清空），在用户实际输入后再清空批量面板
  const handleInlineFocus = () => {
    if (open) {
      setOpen(false);
    }
  };

  // + 按钮：打开批量面板（不立即清空 inlineText，在批量确认后清空）
  const handlePlusClick = () => {
    if (open) { setOpen(false); setInputText(''); return; }
    if (plusBtnRef.current) {
      const r = plusBtnRef.current.getBoundingClientRect();
      setDropPos({ left: r.right - 360, top: r.bottom + 4 });
    }
    setOpen(true);
  };


  // 已选项减少时，把 overflow chip 按顺序转回 valid（在容量范围内）
  useEffect(() => {
    setPendingItems(prev => {
      const overflows = prev.filter(p => p.status === 'overflow');
      if (overflows.length === 0) return prev;
      const remaining = MAX_COUNT - selected.length;
      if (remaining <= 0) return prev;
      const toRestore = new Set(overflows.slice(0, remaining).map(p => p.value));
      return prev.map(p => toRestore.has(p.value) ? { ...p, status: 'valid' as PendingStatus } : p);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected.length]);

  const tokens = useMemo(() => parseTokens(inputText), [inputText]);

  // 切换匹配模式：清空 pending chips，保留已选区
  const switchMode = (m: MatchMode) => {
    if (m === matchMode) return;
    setMatchMode(m);
    setPendingItems([]);
    setInputText('');
    tagInputRef.current?.focus();
  };

  // 切换 tab：清空 pending + 已选
  const switchTab = (idx: number) => {
    if (idx === activeTabIdx) return;
    setActiveTabIdx(idx);
    onChange([]);
    onExcludeChange(false);
    setValueMeta({});
    setInputText('');
    setPendingItems([]);
  };

  // Enter 处理
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (tokens.length === 0) return;

    const pendingValues = new Set(pendingItems.map(p => p.value));
    const selectedValues = new Set(selected);

    // 重复项（已在 pending 或已选区）直接标为无效
    const duplicates = tokens.filter(t => pendingValues.has(t) || selectedValues.has(t));
    // 去重后的新值，待校验
    const seen = new Set<string>();
    const freshTokens = tokens.filter(t => {
      if (pendingValues.has(t) || selectedValues.has(t) || seen.has(t)) return false;
      seen.add(t);
      return true;
    });

    const duplicateItems: PendingItem[] = duplicates.map(t => ({ value: t, status: 'duplicate' }));

    if (matchMode === 'exact' && onValidate && freshTokens.length > 0) {
      setPendingItems(prev => [
        ...prev,
        ...duplicateItems,
        ...freshTokens.map(t => ({ value: t, status: 'validating' as PendingStatus })),
      ]);
      setInputText('');

      try {
        const { valid, invalid } = await onValidate(freshTokens);
        const validSet = new Set(valid);
        setPendingItems(prev =>
          prev.map(p =>
            freshTokens.includes(p.value)
              ? { ...p, status: validSet.has(p.value) ? 'valid' : 'invalid' }
              : p
          )
        );
      } catch {
        setPendingItems(prev =>
          prev.map(p => freshTokens.includes(p.value) ? { ...p, status: 'invalid' } : p)
        );
      }
    } else {
      setPendingItems(prev => [
        ...prev,
        ...duplicateItems,
        ...freshTokens.map(t => ({ value: t, status: 'valid' as PendingStatus })),
      ]);
      setInputText('');
    }
    tagInputRef.current?.focus();
  };

  const MAX_COUNT = 300;

  // 确认添加：有效项进已选区，超出上限的继续留在 pending（保持 valid 状态）
  const handleConfirm = () => {
    const validItems = pendingItems.filter(p => p.status === 'valid').map(p => p.value);
    if (validItems.length === 0) return;
    const remaining = MAX_COUNT - selected.length;
    const newOnes    = validItems.filter(t => !selected.includes(t));
    const toAdd      = newOnes.slice(0, remaining);
    const keepPending = new Set(newOnes.slice(remaining));
    if (toAdd.length > 0) {
      onChange([...selected, ...toAdd]);
      const meta: Record<string, MatchMode> = {};
      toAdd.forEach(t => { meta[t] = matchMode; });
      setValueMeta(prev => ({ ...prev, ...meta }));
    }
    // 已添加的 valid 移出；超出上限的标为 overflow（橙色）
    setPendingItems(prev =>
      prev
        .filter(p => p.status !== 'valid' || keepPending.has(p.value))
        .map(p => keepPending.has(p.value) ? { ...p, status: 'overflow' as PendingStatus } : p)
    );
    setInlineText('');
    tagInputRef.current?.focus();
  };

  const handleRemove = (v: string) => {
    onChange(selected.filter(s => s !== v));
    setValueMeta(prev => { const n = { ...prev }; delete n[v]; return n; });
  };

  const handleClear = () => {
    onChange([]);
    onExcludeChange(false);
    setValueMeta({});
  };

  // 展示值
  const hasSelection = selected.length > 0;
  const subLabel = activeTab.label;
  let displayValue: string;
  if (!hasSelection) {
    displayValue = '不限';
  } else if (exclude) {
    const names = selected.slice(0, 1).join('、');
    displayValue = selected.length > 1 ? `排除 ${names} 等${selected.length}项` : `排除 ${names}`;
  } else {
    const names = selected.slice(0, 2).join('、');
    displayValue = selected.length > 2 ? `${names} 等${selected.length}项` : names;
  }

  const isValidating  = pendingItems.some(p => p.status === 'validating');
  const validCount    = pendingItems.filter(p => p.status === 'valid').length;
  const hasValidPending = validCount > 0;

  const chipStyle = (status: PendingStatus) => {
    if (status === 'valid')      return { bg: '#e6f4ff', color: '#1677ff', border: '#91caff' };
    if (status === 'invalid')    return { bg: '#f5f5f5', color: '#bfbfbf', border: '#d9d9d9' };
    if (status === 'duplicate')  return { bg: '#f5f5f5', color: '#bfbfbf', border: '#d9d9d9' };
    if (status === 'overflow')   return { bg: '#fff2e8', color: '#d46b08', border: '#ffbb96' };

    return { bg: '#fffbe6', color: '#d48806', border: '#ffe58f' }; // validating
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', flexShrink: 0 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 触发区：直接输入框 + + 按钮 */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {resolvedTabs.length === 1 && (
          <span style={{ fontSize: 13, color: '#333', whiteSpace: 'nowrap', fontWeight: 400, flexShrink: 0 }}>{subLabel}</span>
        )}
        <div style={{ display: 'flex', alignItems: 'center', height: 28 }}>
          {/* 多 tab：前置下拉选择器 + 输入框一体 */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            {resolvedTabs.length > 1 && (
              <>
                <span
                  onMouseDown={e => { e.preventDefault(); setTabDropOpen(v => !v); }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 2,
                    fontSize: 13, color: '#333', cursor: 'pointer',
                    userSelect: 'none', whiteSpace: 'nowrap', flexShrink: 0,
                    marginRight: 6,
                  }}
                >
                  {activeTab.label}
                  <span style={{ fontSize: 10, color: '#aaa' }}>▾</span>
                </span>
                {tabDropOpen && (
                  <div style={{
                    position: 'absolute', top: 30, left: 0, zIndex: 10000,
                    background: '#fff', border: '1px solid #e8e8e8',
                    borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    minWidth: 96, overflow: 'hidden',
                  }}>
                    {resolvedTabs.map((tab, idx) => (
                      <div
                        key={tab.key}
                        onMouseDown={e => { e.preventDefault(); switchTab(idx); setTabDropOpen(false); }}
                        style={{
                          padding: '7px 12px', fontSize: 13, cursor: 'pointer',
                          background: idx === activeTabIdx ? '#e6f4ff' : '#fff',
                          color: idx === activeTabIdx ? '#1677ff' : '#333',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => { if (idx !== activeTabIdx) (e.currentTarget as HTMLDivElement).style.background = '#f5f5f5'; }}
                        onMouseLeave={e => { if (idx !== activeTabIdx) (e.currentTarget as HTMLDivElement).style.background = '#fff'; }}
                      >{tab.label}</div>
                    ))}
                  </div>
                )}
              </>
            )}
            <input
              ref={inlineRef}
              value={inlineText}
              onChange={e => {
                setInlineText(e.target.value);
                setInlineState('idle');
              }}
              onFocus={handleInlineFocus}
              placeholder={activeTab.placeholder}
              style={{
                width: 160, height: 28, fontSize: 13, padding: '0 26px 0 10px',
                border: `1px solid ${exclude ? '#fa8c16' : '#e0e0e0'}`,
                borderRight: 'none',
                borderRadius: '6px 0 0 6px',
                outline: 'none', background: exclude ? '#fff7e6' : '#fff',
                color: '#333',
                transition: 'border-color 0.15s',
              }}
              onFocusCapture={e => (e.currentTarget.style.borderColor = exclude ? '#fa8c16' : '#1677ff')}
              onBlur={e => (e.currentTarget.style.borderColor = exclude ? '#fa8c16' : '#e0e0e0')}
            />
            {/* hover × 清空：有内联文字时清输入框，有已选项时清已选 */}
            {hovered && (inlineText || hasSelection) && (
              <span
                onMouseDown={e => {
                  e.preventDefault();
                  if (inlineText) setInlineText('');
                  else handleClear();
                }}
                style={{ position: 'absolute', right: 6, cursor: 'pointer', color: '#bbb', fontSize: 15, lineHeight: 1 }}
                onMouseEnter={e => (e.currentTarget as HTMLSpanElement).style.color = '#999'}
                onMouseLeave={e => (e.currentTarget as HTMLSpanElement).style.color = '#bbb'}
              >×</span>
            )}
          </div>
          {/* + 按钮 */}
          <button
            ref={plusBtnRef}
            onClick={handlePlusClick}
            title="批量输入"
            style={{
              width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${exclude ? '#fa8c16' : (open || selected.length > 0) ? '#1677ff' : '#e0e0e0'}`,
              borderRadius: '0 6px 6px 0',
              background: exclude ? '#fff7e6' : (open || selected.length > 0) ? '#e6f4ff' : '#fff',
              cursor: 'pointer', fontSize: 18, color: exclude ? '#fa8c16' : (open || selected.length > 0) ? '#1677ff' : '#999',
              outline: 'none', transition: 'all 0.15s', fontWeight: 300,
            }}
            onMouseEnter={e => { if (!open && !exclude && selected.length === 0) { (e.currentTarget as HTMLButtonElement).style.borderColor = '#1677ff'; (e.currentTarget as HTMLButtonElement).style.color = '#1677ff'; } }}
            onMouseLeave={e => { if (!open && !exclude && selected.length === 0) { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e0e0e0'; (e.currentTarget as HTMLButtonElement).style.color = '#999'; } }}
          >+</button>
        </div>
      </div>

      {/* 下拉面板 */}
      {open && dropPos && (
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed', left: dropPos.left, top: dropPos.top,
            zIndex: 9999, background: '#fff', borderRadius: 8,
            border: '1px solid #e8e8e8', boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
            width: 360,
            maxHeight: `calc(100vh - ${dropPos.top + 16}px)`,
            overflowY: 'auto',
          }}
        >
          {/* 顶栏：tab + 匹配方式 */}
          <div style={{
            display: 'flex', alignItems: 'center',
            borderBottom: '1px solid #f0f0f0', padding: '0 12px',
            position: 'sticky', top: 0, background: '#fff', zIndex: 1,
          }}>
            <div style={{ display: 'flex', flex: 1 }}>
              {resolvedTabs.length > 1 ? resolvedTabs.map((tab, idx) => {
                const active = idx === activeTabIdx;
                return (
                  <div key={tab.key} onClick={() => switchTab(idx)} style={{
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
                <div style={{ padding: '8px 10px 7px', fontSize: 13, color: '#333' }}>
                  {resolvedTabs[0].label}
                </div>
              )}
            </div>
            {/* 匹配方式切换 */}
            <style>{`
              .ac-match-seg .ant-segmented-item { font-size: 12px !important; font-weight: 400 !important; color: #8c8c8c; }
              .ac-match-seg .ant-segmented-item-selected { color: #1677ff !important; font-weight: 400 !important; }
              .ac-match-seg .ant-segmented-item-label { font-size: 12px !important; }
            `}</style>
            <Segmented
              size="small"
              value={matchMode}
              onChange={v => switchMode(v as MatchMode)}
              options={[
                { label: '精确', value: 'exact' },
                { label: '模糊', value: 'fuzzy' },
              ]}
              className="ac-match-seg"
              style={{ flexShrink: 0 }}
            />
          </div>

          {/* Tag input 区域 */}
          <div style={{ padding: '10px 12px 0' }}>
            <div style={{ position: 'relative' }}>
            {pendingItems.length > 0 && (
              <span
                onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setPendingItems([]); setInputText(''); }}
                style={{
                  position: 'absolute', right: 8, top: 6, zIndex: 1,
                  fontSize: 12, color: '#ff4d4f', cursor: 'pointer', userSelect: 'none',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLSpanElement).style.color = '#cf1322'}
                onMouseLeave={e => (e.currentTarget as HTMLSpanElement).style.color = '#ff4d4f'}
              >清空</span>
            )}
            <div
              onClick={() => tagInputRef.current?.focus()}
              style={{
                minHeight: 100, maxHeight: 180, overflowY: 'auto',
                border: '1px solid #d9d9d9', borderRadius: 6,
                background: '#fafafa', padding: '6px 8px',
                display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start',
                gap: 6, cursor: 'text',
              }}
            >
              {pendingItems.map(item => {
                const c = chipStyle(item.status);
                return (
                  <span key={item.value} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                    padding: '1px 7px', borderRadius: 4, fontSize: 12,
                    background: c.bg, color: c.color, border: `1px solid ${c.border}`,
                    lineHeight: '20px', flexShrink: 0,
                  }}>
                    {item.status === 'validating' && <Spin size="small" style={{ marginRight: 2 }} />}
                    {item.value}
                    {item.status === 'invalid'   && <span style={{ fontSize: 11, color: '#bfbfbf' }}>(无效)</span>}
                    {item.status === 'duplicate' && <span style={{ fontSize: 11, color: '#bfbfbf' }}>(重复)</span>}
                    {item.status === 'overflow'  && <span style={{ fontSize: 11, color: '#d46b08' }}>(已达上限)</span>}
                    {item.status !== 'validating' && (
                      <span
                        onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setPendingItems(prev => prev.filter(p => p.value !== item.value)); }}
                        style={{ cursor: 'pointer', fontSize: 13, lineHeight: 1, color: c.border, marginLeft: 1 }}
                        onMouseEnter={e => (e.currentTarget as HTMLSpanElement).style.color = c.color}
                        onMouseLeave={e => (e.currentTarget as HTMLSpanElement).style.color = c.border}
                      >×</span>
                    )}
                  </span>
                );
              })}
              <input
                ref={tagInputRef}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={pendingItems.length === 0
                  ? `${activeTab.placeholder}，支持逗号/空格分隔，回车${matchMode === 'exact' && onValidate ? '校验' : '确认'}`
                  : '继续输入…'}
                style={{
                  border: 'none', outline: 'none', background: 'transparent',
                  fontSize: 12, color: '#333', lineHeight: '24px',
                  minWidth: 160, flex: 1,
                }}
              />
            </div>
            </div>
          </div>

          {/* 确认按钮 */}
          <div style={{ padding: '8px 12px 0' }}>
            {selected.length >= MAX_COUNT ? (
              <Button block disabled>已达 {MAX_COUNT} 项上限</Button>
            ) : tokens.length > 0 ? (
              <Button block onClick={() => handleKeyDown({ key: 'Enter', preventDefault: () => {} } as any)}>
                {matchMode === 'exact' && onValidate ? '回车校验' : '回车确认'}
              </Button>
            ) : isValidating ? (
              <Button block disabled>校验中…</Button>
            ) : hasValidPending ? (
              <Button
                block type="primary"
                onClick={handleConfirm}
                style={matchMode === 'fuzzy' ? { background: '#7c4dff', borderColor: '#7c4dff' } : undefined}
              >
                {validCount > MAX_COUNT - selected.length
                  ? `添加前 ${MAX_COUNT - selected.length} 个有效项`
                  : `添加 ${validCount} 个有效项`}
              </Button>
            ) : pendingItems.length > 0 ? (
              <Button block disabled>无有效项可添加</Button>
            ) : (
              <Button block disabled>请输入内容</Button>
            )}
          </div>

          {/* 已选列表（始终显示） */}
          <div style={{ borderTop: '1px solid #f0f0f0', marginTop: 8 }}>
            <div style={{
              padding: '8px 14px 4px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 12, color: '#999' }}>
                已添加 {selected.length} / {MAX_COUNT} 项
              </span>
              {selected.length > 0 && (
                <Button type="link" size="small" onClick={handleClear}
                  style={{ fontSize: 12, padding: 0, height: 'auto' }}>
                  清空
                </Button>
              )}
            </div>
            {selected.length > 0 && (
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
                    {valueMeta[v] && (
                      <span style={{
                        fontSize: 11, borderRadius: 3, padding: '0 4px', flexShrink: 0,
                        ...(valueMeta[v] === 'fuzzy'
                          ? { color: '#7c4dff', background: '#f3f0ff', border: '1px solid #d3adf7' }
                          : { color: '#52c41a', background: '#f6ffed', border: '1px solid #b7eb8f' })
                      }}>
                        {valueMeta[v] === 'fuzzy' ? '模糊' : '精确'}
                      </span>
                    )}
                    <span
                      style={{ cursor: 'pointer', color: '#bbb', flexShrink: 0, fontSize: 13 }}
                      onClick={() => handleRemove(v)}
                    >✕</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 底栏：排除 */}
          <div style={{
              display: 'flex', alignItems: 'center',
              padding: '7px 14px 10px',
              borderTop: '1px solid #f0f0f0',
              background: '#fafafa',
            }}>
              <div
                onClick={() => onExcludeChange(!exclude)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' }}
              >
                <Checkbox checked={exclude} style={{ pointerEvents: 'none' }} />
                <span style={{ fontSize: 12, color: exclude ? '#fa8c16' : '#444' }}>排除</span>
              </div>
          </div>

        </div>
      )}
    </div>
  );
}

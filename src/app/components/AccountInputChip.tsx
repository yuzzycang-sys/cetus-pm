import React, { useState, useRef, useEffect } from 'react';
import { Button, Checkbox, Segmented } from 'antd';

export type InputTab = { key: string; label: string; placeholder: string };
type TempItem = { value: string; valid: boolean | 'pending' };

type MatchMode = 'exact' | 'fuzzy';

interface Props {
  selected: string[];
  onChange: (selected: string[]) => void;
  exclude: boolean;
  onExcludeChange: (exclude: boolean) => void;
  entityLabel?: string;
  idLabel?: string;
  tabs?: InputTab[];
  onValidate?: (values: string[]) => Promise<{ valid: string[]; invalid: string[] }>;
  supportFuzzy?: boolean;
  matchMode?: MatchMode;
  onMatchModeChange?: (mode: MatchMode) => void;
  hideExclude?: boolean;
}

function parseTokens(raw: string): string[] {
  return raw.split(/[\n,，\s]+/).map(s => s.trim()).filter(Boolean);
}

const MAX_COUNT = 300;

export function AccountInputChip({
  selected, onChange, exclude, onExcludeChange,
  entityLabel = '账号', idLabel = 'ID', tabs: tabsProp, onValidate,
  supportFuzzy = false, matchMode: matchModeProp, onMatchModeChange,
  hideExclude = false,
}: Props) {
  const [open, setOpen]                 = useState(false);
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const [dropPos, setDropPos]           = useState<{ left: number; top: number } | null>(null);
  const [hovered, setHovered]           = useState(false);
  const [inlineText, setInlineText]     = useState('');
  const [tabDropOpen, setTabDropOpen]   = useState(false);
  const [panelMatchMode, setPanelMatchMode] = useState<MatchMode>(matchModeProp ?? 'exact');

  // 批量面板本地状态（未确认前不影响外部 selected）
  const [tempSelected, setTempSelected] = useState<TempItem[]>([]);
  const [panelInput, setPanelInput]     = useState('');

  const resolvedTabs: InputTab[] = tabsProp ?? [
    { key: 'id',   label: `${entityLabel}${idLabel}`, placeholder: `输入${entityLabel}${idLabel}` },
    { key: 'name', label: `${entityLabel}名称`,       placeholder: `输入${entityLabel}名称` },
  ];
  const activeTab = resolvedTabs[activeTabIdx] ?? resolvedTabs[0];

  const wrapRef      = useRef<HTMLDivElement>(null);
  const dropdownRef  = useRef<HTMLDivElement>(null);
  const plusBtnRef   = useRef<HTMLButtonElement>(null);
  const inlineRef    = useRef<HTMLInputElement>(null);
  const panelInputRef = useRef<HTMLInputElement>(null);

  // 点击外部关闭面板和 Tab 下拉
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const inWrap = wrapRef.current?.contains(target) || dropdownRef.current?.contains(target);
      if (!inWrap) {
        if (open) setOpen(false);
        if (tabDropOpen) setTabDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, tabDropOpen]);

  // 内联框有输入时，清空批量面板全部状态
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const excludeRef = useRef(exclude);
  excludeRef.current = exclude;

  useEffect(() => {
    if (inlineText.length === 0) return;
    const hasBatchState = open || selectedRef.current.length > 0 || excludeRef.current;
    if (!hasBatchState) return;
    setOpen(false);
    onExcludeChange(false);
    onChange([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inlineText]);

  const handleInlineFocus = () => {
    if (open) setOpen(false);
  };

  const handlePlusClick = () => {
    if (open) { setOpen(false); return; }
    setTempSelected(selected.map(v => ({ value: v, valid: true })));
    setPanelInput('');
    if (plusBtnRef.current) {
      const r = plusBtnRef.current.getBoundingClientRect();
      setDropPos({ left: r.right - 380, top: r.bottom + 6 });
    }
    setOpen(true);
    setTimeout(() => panelInputRef.current?.focus(), 50);
  };

  const switchTab = (idx: number) => {
    if (idx === activeTabIdx) return;
    setActiveTabIdx(idx);
    onChange([]);
    onExcludeChange(false);
    setTempSelected([]);
  };

  // 面板输入框 Enter：追加 → 模糊直接加，精准调用 onValidate
  const handlePanelKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const existingValues = new Set(tempSelected.map(i => i.value));
    const tokens = parseTokens(panelInput).filter(v => !existingValues.has(v));
    if (tokens.length === 0) { setPanelInput(''); return; }
    setPanelInput('');

    if (panelMatchMode === 'fuzzy' || !onValidate) {
      setTempSelected(prev => [...prev, ...tokens.map(v => ({ value: v, valid: true }))]);
    } else {
      setTempSelected(prev => [...prev, ...tokens.map(v => ({ value: v, valid: 'pending' as const }))]);
      try {
        const result = await onValidate(tokens);
        const validSet = new Set(result.valid);
        setTempSelected(prev => prev.map(item =>
          tokens.includes(item.value) && item.valid === 'pending'
            ? { value: item.value, valid: validSet.has(item.value) }
            : item
        ));
      } catch {
        setTempSelected(prev => prev.map(item =>
          tokens.includes(item.value) && item.valid === 'pending'
            ? { value: item.value, valid: false }
            : item
        ));
      }
    }
  };

  // 确认：只提交 valid 项，回调模式
  const handleConfirm = () => {
    const validValues = tempSelected.filter(i => i.valid === true).map(i => i.value);
    onChange(validValues.slice(0, MAX_COUNT));
    onMatchModeChange?.(panelMatchMode);
    setInlineText('');
    setOpen(false);
  };

  const handleCancel = () => { setOpen(false); };

  // 复制有效项
  const handleCopy = () => {
    const validValues = tempSelected.filter(i => i.valid === true).map(i => i.value);
    navigator.clipboard.writeText(validValues.join('\n'));
  };

  // 内联框清空
  const handleClear = () => {
    onChange([]);
    onExcludeChange(false);
  };

  const hasSelection = selected.length > 0;
  const subLabel = activeTab.label;
  const plusActive = open || selected.length > 0;
  const validCount   = tempSelected.filter(i => i.valid === true).length;
  const invalidCount = tempSelected.filter(i => i.valid === false).length;

  return (
    <div ref={wrapRef} style={{ position: 'relative', flexShrink: 0, display: 'inline-flex' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 触发区 */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {resolvedTabs.length === 1 && (
          <span style={{ fontSize: 13, color: '#333', whiteSpace: 'nowrap', fontWeight: 400, flexShrink: 0 }}>{subLabel}</span>
        )}
        <div style={{ display: 'flex', alignItems: 'center', height: 28 }}>
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
              onChange={e => { setInlineText(e.target.value); }}
              onFocus={handleInlineFocus}
              placeholder={activeTab.placeholder}
              style={{
                width: 180, height: 28, fontSize: 13, padding: '0 26px 0 10px',
                border: `1px solid ${exclude ? '#fa8c16' : '#e0e0e0'}`,
                borderRight: 'none',
                borderRadius: '6px 0 0 6px',
                outline: 'none', background: exclude ? '#fff7e6' : '#fff',
                color: '#333', transition: 'border-color 0.15s',
              }}
              onFocusCapture={e => (e.currentTarget.style.borderColor = exclude ? '#fa8c16' : '#1677ff')}
              onBlur={e => (e.currentTarget.style.borderColor = exclude ? '#fa8c16' : '#e0e0e0')}
            />
            {(inlineText || hasSelection) && (
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
            title="批量录入"
            style={{
              width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${exclude ? '#fa8c16' : plusActive ? '#1677ff' : '#e0e0e0'}`,
              borderRadius: '0 6px 6px 0',
              background: exclude ? '#fff7e6' : plusActive ? '#e6f4ff' : '#fff',
              cursor: 'pointer', fontSize: 18, fontWeight: 300,
              color: exclude ? '#fa8c16' : plusActive ? '#1677ff' : '#999',
              outline: 'none', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (!open && !exclude && !selected.length) { (e.currentTarget as HTMLButtonElement).style.borderColor = '#1677ff'; (e.currentTarget as HTMLButtonElement).style.color = '#1677ff'; } }}
            onMouseLeave={e => { if (!open && !exclude && !selected.length) { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e0e0e0'; (e.currentTarget as HTMLButtonElement).style.color = '#999'; } }}
          >+</button>
        </div>
      </div>

      {/* 批量录入面板 */}
      {open && dropPos && (
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed', left: dropPos.left, top: dropPos.top,
            zIndex: 9999, background: '#fff', borderRadius: 10,
            border: '1px solid #e8e8e8', boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
            width: 380, padding: '14px 18px 14px',
          }}
        >
          {/* 标题行：tab 名称 + × */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{activeTab.label}</span>
            <span
              onMouseDown={e => { e.preventDefault(); handleCancel(); }}
              style={{ cursor: 'pointer', color: '#bbb', fontSize: 20, lineHeight: 1 }}
              onMouseEnter={e => (e.currentTarget as HTMLSpanElement).style.color = '#999'}
              onMouseLeave={e => (e.currentTarget as HTMLSpanElement).style.color = '#bbb'}
            >×</span>
          </div>

          {/* 计数+复制（左）+ 匹配模式（右）同行 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span style={{ fontSize: 12, color: '#555' }}>已选({validCount}/{MAX_COUNT})</span>
              {validCount > 0 && (
                <span
                  onMouseDown={e => { e.preventDefault(); handleCopy(); }}
                  style={{ fontSize: 12, color: '#1677ff', cursor: 'pointer' }}
                >复制</span>
              )}
            </div>
            <>
              <style>{`
                .aic-match-seg .ant-segmented-item { font-size: 12px !important; font-weight: 400 !important; color: #8c8c8c; }
                .aic-match-seg .ant-segmented-item-selected { color: #1677ff !important; font-weight: 400 !important; }
                .aic-match-seg .ant-segmented-item-label { font-size: 12px !important; }
              `}</style>
              <Segmented
                size="small"
                value={panelMatchMode}
                onChange={v => {
                  if (!supportFuzzy) return;
                  setPanelMatchMode(v as MatchMode);
                  setTempSelected([]);
                  setPanelInput('');
                }}
                options={[
                  { label: '精确', value: 'exact' },
                  ...(supportFuzzy ? [{ label: '模糊', value: 'fuzzy' }] : []),
                ]}
                className="aic-match-seg"
              />
            </>
          </div>

          {/* chip 输入区（有错误时边框变红）*/}
          <div style={{
            border: `1px solid ${invalidCount > 0 ? '#ff7875' : '#d9d9d9'}`,
            borderRadius: 6, display: 'flex', flexDirection: 'column',
            transition: 'border-color 0.2s',
          }}>
            {/* 可滚动内容区 */}
            <div
              onClick={() => panelInputRef.current?.focus()}
              style={{ padding: '8px 10px 6px', minHeight: 120, maxHeight: 200, overflowY: 'auto', cursor: 'text' }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: tempSelected.length > 0 ? 6 : 0 }}>
                {tempSelected.map((item) => {
                  const isInvalid = item.valid === false;
                  const isPending = item.valid === 'pending';
                  return (
                    <span key={item.value} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 3,
                      padding: '1px 7px', borderRadius: 3, fontSize: 12, flexShrink: 0,
                      background: isInvalid ? '#fff1f0' : '#f6ffed',
                      color: isInvalid ? '#ff4d4f' : '#52c41a',
                      border: `1px solid ${isInvalid ? '#ffa39e' : '#b7eb8f'}`,
                      opacity: isPending ? 0.5 : 1,
                    }}>
                      {item.value}{isInvalid ? `（${entityLabel}不存在或不可访问）` : ''}
                      <span
                        onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setTempSelected(prev => prev.filter(x => x.value !== item.value)); }}
                        style={{ cursor: 'pointer', fontSize: 12, lineHeight: 1, color: isInvalid ? '#ffa39e' : '#b7eb8f' }}
                        onMouseEnter={e => (e.currentTarget as HTMLSpanElement).style.color = isInvalid ? '#ff4d4f' : '#52c41a'}
                        onMouseLeave={e => (e.currentTarget as HTMLSpanElement).style.color = isInvalid ? '#ffa39e' : '#b7eb8f'}
                      >×</span>
                    </span>
                  );
                })}
              </div>
              <input
                ref={panelInputRef}
                value={panelInput}
                onChange={e => setPanelInput(e.target.value)}
                onKeyDown={handlePanelKeyDown}
                placeholder={tempSelected.length === 0 ? '支持批量录入，请使用中英文逗号、换行符、空格进行分隔，按回车进行校验' : ''}
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 12, color: '#555', width: '100%' }}
              />
            </div>
            {/* 固定底栏：左侧回车提示 / 右侧操作+计数 */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '5px 10px', borderTop: '1px solid #f0f0f0',
            }}>
              {panelInput.length > 0
                ? <span style={{ fontSize: 11, color: '#fa8c16' }}>输入完成后请按回车</span>
                : <span />
              }
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {invalidCount > 0 && (
                  <span
                    onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setTempSelected(prev => prev.filter(i => i.valid !== false)); }}
                    style={{ fontSize: 11, color: '#ff4d4f', cursor: 'pointer', userSelect: 'none' }}
                    onMouseEnter={e => (e.currentTarget as HTMLSpanElement).style.color = '#cf1322'}
                    onMouseLeave={e => (e.currentTarget as HTMLSpanElement).style.color = '#ff4d4f'}
                  >清空{invalidCount}个错误{activeTab.label}</span>
                )}
                {tempSelected.length > 0 && (
                  <span
                    onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setTempSelected([]); }}
                    style={{ fontSize: 11, color: '#1677ff', cursor: 'pointer', userSelect: 'none' }}
                    onMouseEnter={e => (e.currentTarget as HTMLSpanElement).style.color = '#4096ff'}
                    onMouseLeave={e => (e.currentTarget as HTMLSpanElement).style.color = '#1677ff'}
                  >清空全部</span>
                )}
                <span style={{ fontSize: 11, color: validCount > MAX_COUNT ? '#ff4d4f' : '#aaa' }}>
                  {validCount}/{MAX_COUNT}
                </span>
              </div>
            </div>
          </div>

          {/* 框外警告 */}
          {(invalidCount > 0 || validCount > MAX_COUNT) && (
            <div style={{ fontSize: 11, color: '#ff4d4f', marginTop: 5, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {invalidCount > 0 && <span>存在错误{activeTab.label}，请检查输入的内容</span>}
              {validCount > MAX_COUNT && <span>{activeTab.label}数量已超过最大限制（{MAX_COUNT}个），请删减多余项</span>}
            </div>
          )}

          {/* 排除（可隐藏）*/}
          {!hideExclude && (
            <div style={{ display: 'flex', alignItems: 'center', padding: '8px 0 2px' }}>
              <div
                onClick={() => onExcludeChange(!exclude)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' }}
              >
                <Checkbox checked={exclude} style={{ pointerEvents: 'none' }} />
                <span style={{ fontSize: 12, color: exclude ? '#fa8c16' : '#444' }}>排除</span>
              </div>
            </div>
          )}

          {/* 底部按钮 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
            <Button size="small" onClick={handleCancel}>取消</Button>
            <Button size="small" type="primary" disabled={invalidCount > 0 || validCount > MAX_COUNT} onClick={handleConfirm}>确定</Button>
          </div>
        </div>
      )}
    </div>
  );
}

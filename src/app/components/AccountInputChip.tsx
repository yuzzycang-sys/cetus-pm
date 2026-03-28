import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button, Checkbox, Input, Segmented, Tag } from 'antd';

type SubType   = 'id' | 'name';
type MatchMode = 'exact' | 'fuzzy';

interface Props {
  selected: string[];
  onChange: (selected: string[]) => void;
  exclude: boolean;
  onExcludeChange: (exclude: boolean) => void;
  entityLabel?: string; // default: '账号'
}

function parseTokens(raw: string): string[] {
  return raw.split(/[\n,，\s]+/).map(s => s.trim()).filter(Boolean);
}

function KindBadge({ kind }: { kind: MatchMode }) {
  return (
    <Tag
      color={kind === 'exact' ? 'success' : 'purple'}
      style={{ fontSize: 11, lineHeight: '16px', padding: '0 4px', margin: 0, flexShrink: 0, whiteSpace: 'nowrap' }}
    >
      {kind === 'exact' ? '精确' : '模糊'}
    </Tag>
  );
}

export function AccountInputChip({ selected, onChange, exclude, onExcludeChange, entityLabel = '账号' }: Props) {
  const [open, setOpen]           = useState(false);
  const [subType, setSubType]     = useState<SubType>('id');
  const [matchMode, setMatchMode] = useState<MatchMode>('exact');
  const [inputText, setInputText] = useState('');
  const [dropPos, setDropPos]     = useState<{ left: number; top: number } | null>(null);

  const [valueMeta, setValueMeta] = useState<Record<string, MatchMode>>({});

  const wrapRef     = useRef<HTMLDivElement>(null);
  const btnRef      = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const closeTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimer.current) {
        clearTimeout(closeTimer.current);
        closeTimer.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 50);
  }, [open]);

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setDropPos({ left: r.left, top: r.bottom + 4 });
    }
    if (open) setInputText('');
    setOpen(v => !v);
  };

  const tokens = useMemo(() => parseTokens(inputText), [inputText]);
  const newTokens = useMemo(() => tokens.filter(t => !selected.includes(t)), [tokens, selected]);

  const handleConfirm = () => {
    if (newTokens.length === 0) return;
    const merged = [...selected, ...newTokens];
    onChange(merged);
    const meta: Record<string, MatchMode> = {};
    newTokens.forEach(t => { meta[t] = matchMode; });
    setValueMeta(prev => ({ ...prev, ...meta }));
    setInputText('');
    textareaRef.current?.focus();
  };

  const handleRemove = (v: string) => {
    onChange(selected.filter(s => s !== v));
    setValueMeta(prev => {
      const next = { ...prev };
      delete next[v];
      return next;
    });
  };

  const handleClear = () => {
    onChange([]);
    onExcludeChange(false);
    setValueMeta({});
  };

  const subLabel = subType === 'id' ? `${entityLabel}ID` : `${entityLabel}名称`;
  const hasSelection = selected.length > 0;
  const activeColor  = exclude ? '#fa8c16' : '#1890ff';
  const activeBg     = exclude ? '#fff7e6' : '#e6f7ff';

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

  const canConfirm = newTokens.length > 0;
  const dupCount = tokens.length - newTokens.length;

  return (
    <div ref={wrapRef} style={{ position: 'relative', flexShrink: 0 }}>

      {/* 触发器 */}
      <button
        ref={btnRef}
        onClick={handleToggle}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          border: `1px solid ${(open || hasSelection) ? activeColor : '#d9d9d9'}`,
          borderRadius: 4, padding: '0 8px', height: 28,
          background: hasSelection ? activeBg : open ? '#f5f5f5' : '#fff',
          cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap',
          outline: 'none', transition: 'all 0.15s',
        }}
      >
        <span style={{ color: '#555' }}>{subLabel}:</span>
        <span style={{
          color: hasSelection ? activeColor : '#bbb',
          maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {displayValue}
        </span>
        <svg
          width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={hasSelection ? activeColor : '#aaa'}
          strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* 下拉面板 */}
      {open && dropPos && (
        <div
          onMouseDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
          onMouseLeave={() => setOpen(false)}
          style={{
            position: 'fixed', left: dropPos.left, top: dropPos.top,
            zIndex: 9999, background: '#fff', borderRadius: 8,
            border: '1px solid #e8e8e8', boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
            width: 300, overflow: 'hidden',
          }}
        >

          {/* ── 顶栏：子类型 tab + 匹配方式 ── */}
          <div style={{
            display: 'flex', alignItems: 'center',
            borderBottom: '1px solid #f0f0f0',
            padding: '0 12px',
          }}>
            {/* 子类型 tab */}
            <div style={{ display: 'flex', flex: 1 }}>
              {(['id', 'name'] as const).map(t => {
                const lbl = t === 'id' ? `${entityLabel}ID` : `${entityLabel}名称`;
                const active = subType === t;
                return (
                  <div key={t} onClick={() => {
                    if (t === subType) return;
                    setSubType(t);
                    onChange([]);
                    onExcludeChange(false);
                    setValueMeta({});
                    setInputText('');
                  }} style={{
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
            {/* 匹配方式 */}
            <Segmented
              size="small"
              value={matchMode}
              onChange={v => setMatchMode(v as MatchMode)}
              options={[
                { label: '精确', value: 'exact' },
                { label: '模糊', value: 'fuzzy' },
              ]}
              style={{ fontSize: 12, flexShrink: 0 }}
            />
          </div>

          {/* ── Textarea（主输入区） ── */}
          <div style={{ padding: '10px 12px 0' }}>
            <Input.TextArea
              ref={textareaRef as React.Ref<any>}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={
                subType === 'id'
                  ? `输入${entityLabel}ID，支持多个\n每行一个，或用逗号/空格分隔`
                  : `输入${entityLabel}名称，支持多个\n每行一个，或用逗号/空格分隔`
              }
              rows={5}
              style={{
                fontSize: 12, color: '#333',
                resize: 'none', lineHeight: 1.8,
                background: '#fafafa',
              }}
            />

            {/* 解析结果提示行 */}
            <div style={{
              minHeight: 20, marginTop: 4, marginBottom: 2,
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12,
            }}>
              {tokens.length > 0 ? (
                <>
                  <span style={{ color: '#52c41a' }}>✓ {newTokens.length} 项可添加</span>
                  {dupCount > 0 && (
                    <span style={{ color: '#bbb' }}>· {dupCount} 项已存在将跳过</span>
                  )}
                  <KindBadge kind={matchMode} />
                </>
              ) : (
                <span style={{ color: '#ccc' }}>支持批量粘贴</span>
              )}
            </div>
          </div>

          {/* ── 确认按钮 ── */}
          <div style={{ padding: '6px 12px 0' }}>
            <Button
              block
              type="primary"
              disabled={!canConfirm}
              onClick={handleConfirm}
              style={canConfirm && matchMode === 'fuzzy'
                ? { background: '#7c4dff', borderColor: '#7c4dff' }
                : undefined}
            >
              {canConfirm
                ? `添加 ${newTokens.length} 项`
                : tokens.length > 0 ? '所有值已存在' : '请输入内容'}
            </Button>
          </div>

          {/* ── 已选列表 ── */}
          {selected.length > 0 && (
            <>
              <div style={{
                padding: '8px 14px 4px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 12, color: '#999' }}>已添加 {selected.length} 项</span>
                <Button
                  type="link"
                  size="small"
                  onClick={handleClear}
                  style={{ fontSize: 12, padding: 0, height: 'auto' }}
                >
                  清空
                </Button>
              </div>

              <div style={{ maxHeight: 150, overflowY: 'auto', padding: '0 0 4px' }}>
                {selected.map(v => (
                  <div
                    key={v}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 14px' }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f5f5f5'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                  >
                    <span style={{
                      flex: 1, fontSize: 12, color: '#333',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {v}
                    </span>
                    {valueMeta[v] && <KindBadge kind={valueMeta[v]} />}
                    <Tag
                      closable
                      onClose={() => handleRemove(v)}
                      style={{ display: 'none' }}
                    />
                    <span
                      style={{ cursor: 'pointer', color: '#bbb', flexShrink: 0, fontSize: 13 }}
                      onClick={() => handleRemove(v)}
                    >✕</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── 底栏：排除 ── */}
          {selected.length > 0 && (
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
          )}

        </div>
      )}
    </div>
  );
}

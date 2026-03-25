import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

const F = "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif";

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
            padding: '2px 8px', cursor: 'pointer',
            background: active ? '#1890ff' : '#fff',
            color: active ? '#fff' : '#555',
            userSelect: 'none', transition: 'background 0.12s',
            borderRight: m === 'exact' ? '1px solid #d9d9d9' : 'none',
          }}>
            {m === 'exact' ? '精确' : '模糊'}
          </div>
        );
      })}
    </div>
  );
}

function KindBadge({ kind }: { kind: MatchMode }) {
  const isExact = kind === 'exact';
  return (
    <span style={{
      fontSize: 10, lineHeight: '16px', padding: '0 4px', borderRadius: 3,
      background: isExact ? '#f6ffed' : '#f9f0ff',
      color:      isExact ? '#52c41a'  : '#722ed1',
      border: `1px solid ${isExact ? '#b7eb8f' : '#d3adf7'}`,
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {isExact ? '精确' : '模糊'}
    </span>
  );
}

export function AccountInputChip({ selected, onChange, exclude, onExcludeChange, entityLabel = '账号' }: Props) {
  const [open, setOpen]           = useState(false);
  const [subType, setSubType]     = useState<SubType>('id');
  const [matchMode, setMatchMode] = useState<MatchMode>('exact');
  const [inputText, setInputText] = useState('');
  const [dropPos, setDropPos]     = useState<{ left: number; top: number } | null>(null);

  // 每个值对应的匹配方式
  const [valueMeta, setValueMeta] = useState<Record<string, MatchMode>>({});

  const wrapRef     = useRef<HTMLDivElement>(null);
  const btnRef      = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 只依赖鼠标进出关闭：选中后不立即消失，鼠标移出后才消失
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

  // 解析当前输入
  const tokens = useMemo(() => parseTokens(inputText), [inputText]);
  // 去掉已经在 selected 里的（避免重复添加提示混淆）
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

  // 触发器文案
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

  // 确认按钮是否可用
  const canConfirm = newTokens.length > 0;
  // 重复项数
  const dupCount = tokens.length - newTokens.length;

  return (
    <div ref={wrapRef} style={{ position: 'relative', flexShrink: 0 }}>

      {/* 触发器 */}
      <button
        ref={btnRef}
        onClick={handleToggle}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          border: `1px solid ${(open || hasSelection) ? activeColor : '#dee0e3'}`,
          borderRadius: 4, padding: '0 8px', height: 28,
          background: hasSelection ? activeBg : open ? '#f5f5f5' : '#fff',
          cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap',
          outline: 'none', transition: 'all 0.15s', fontFamily: F,
        }}
      >
        <span style={{ color: '#555' }}>{subLabel}:</span>
        <span style={{
          color: hasSelection ? activeColor : '#bbb',
          maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {displayValue}
        </span>
        <ChevronDown
          size={11} color={hasSelection ? activeColor : '#aaa'}
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}
        />
      </button>

      {/* 下拉面板 */}
      {open && dropPos && (
        <div onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()} onMouseLeave={() => setOpen(false)} style={{
          position: 'fixed', left: dropPos.left, top: dropPos.top,
          zIndex: 9999, background: '#fff', borderRadius: 8,
          border: '1px solid #e8e8e8', boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
          width: 300, fontFamily: F, overflow: 'hidden',
        }}>

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
                    // 互斥：切换类型时清空所有已选值和元信息
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
            <ModeToggle value={matchMode} onChange={setMatchMode} />
          </div>

          {/* ── Textarea（主输入区） ── */}
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
              rows={5}
              style={{
                width: '100%', boxSizing: 'border-box',
                border: '1px solid #e0e0e0', borderRadius: 5,
                padding: '8px 10px', fontSize: 12, color: '#333',
                resize: 'none', outline: 'none', lineHeight: 1.8,
                fontFamily: F, background: '#fafafa',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#1890ff'; }}
              onBlur={e  => { e.currentTarget.style.borderColor = '#e0e0e0'; }}
            />

            {/* 解析结果提示行 */}
            <div style={{
              minHeight: 20, marginTop: 4, marginBottom: 2,
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 11,
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
            <button
              onClick={handleConfirm}
              disabled={!canConfirm}
              style={{
                width: '100%', padding: '7px 0', borderRadius: 4,
                border: 'none', fontSize: 13, fontFamily: F,
                background: canConfirm
                  ? (matchMode === 'fuzzy' ? '#7c4dff' : '#1890ff')
                  : '#f0f0f0',
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

          {/* ── 已选列表 ── */}
          {selected.length > 0 && (
            <>
              <div style={{
                padding: '8px 14px 4px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 11, color: '#999' }}>已添加 {selected.length} 项</span>
                <span
                  onClick={handleClear}
                  style={{ fontSize: 11, color: '#1890ff', cursor: 'pointer', userSelect: 'none' }}
                >
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
                    <span style={{
                      flex: 1, fontSize: 12, color: '#333',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {v}
                    </span>
                    {valueMeta[v] && <KindBadge kind={valueMeta[v]} />}
                    <X
                      size={13} color="#bbb" style={{ cursor: 'pointer', flexShrink: 0 }}
                      onClick={() => handleRemove(v)}
                    />
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
          )}

        </div>
      )}
    </div>
  );
}
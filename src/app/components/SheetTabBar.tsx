import React, { useState, useRef, useEffect } from 'react';
import { Tabs, Input } from 'antd';
import { LayoutGrid } from 'lucide-react';

const F = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

interface Props {
  sheets: string[];
  activeSheet: string;
  onSelectSheet: (name: string) => void;
  onRenameSheet: (oldName: string, newName: string) => void;
  onDeleteSheet: (name: string) => void;
  onCopySheet: (name: string) => void;
  onAddSheet: () => void;
  onReorderSheets: (sheets: string[]) => void;
}

export function SheetTabBar({
  sheets, activeSheet, onSelectSheet,
  onRenameSheet, onDeleteSheet, onCopySheet, onAddSheet, onReorderSheets,
}: Props) {
  const [menuOpenSheet, setMenuOpenSheet] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [draggedSheet, setDraggedSheet] = useState<string | null>(null);
  const [dragOverSheet, setDragOverSheet] = useState<string | null>(null);

  const handleOpenMenu = (sheet: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (menuOpenSheet === sheet) {
      setMenuOpenSheet(null);
      setMenuPos(null);
    } else {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setMenuPos({ x: rect.left, y: rect.bottom + 4 });
      setMenuOpenSheet(sheet);
    }
  };

  const handleCloseMenu = () => {
    setMenuOpenSheet(null);
    setMenuPos(null);
  };

  const handleDragStart = (e: React.DragEvent, name: string) => {
    setDraggedSheet(name);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragEnd = () => { setDraggedSheet(null); setDragOverSheet(null); };
  const handleDragOver = (e: React.DragEvent, name: string) => {
    e.preventDefault();
    if (draggedSheet && draggedSheet !== name) setDragOverSheet(name);
  };
  const handleDrop = (e: React.DragEvent, targetName: string) => {
    e.preventDefault();
    if (!draggedSheet || draggedSheet === targetName) { handleDragEnd(); return; }
    const next = [...sheets];
    const fi = next.indexOf(draggedSheet);
    const ti = next.indexOf(targetName);
    next.splice(fi, 1);
    next.splice(ti, 0, draggedSheet);
    onReorderSheets(next);
    handleDragEnd();
  };

  const items = sheets.map(sheet => ({
    key: sheet,
    closable: false,
    label: (
      <TabLabel
        sheet={sheet}
        active={sheet === activeSheet}
        isOver={dragOverSheet === sheet}
        isDragging={draggedSheet === sheet}
        renaming={renaming === sheet}
        renameValue={renameValue}
        onRenameChange={setRenameValue}
        onRenameBlur={() => {
          if (renameValue.trim()) onRenameSheet(sheet, renameValue.trim());
          setRenaming(null);
        }}
        onRenameKey={e => {
          if (e.key === 'Enter') {
            if (renameValue.trim()) onRenameSheet(sheet, renameValue.trim());
            setRenaming(null);
          }
          if (e.key === 'Escape') setRenaming(null);
        }}
        onDragStart={e => handleDragStart(e, sheet)}
        onDragEnd={handleDragEnd}
        onDragOver={e => handleDragOver(e, sheet)}
        onDrop={e => handleDrop(e, sheet)}
        onOpenMenu={e => handleOpenMenu(sheet, e)}
      />
    ),
  }));

  return (
    <>
      <style>{`
        .sheet-tab-bar .ant-tabs-nav {
          margin-bottom: 0 !important;
          height: 36px;
          font-family: ${F};
        }
        .sheet-tab-bar .ant-tabs-nav::before {
          border-bottom: 1px solid #d9d9d9 !important;
        }
        .sheet-tab-bar .ant-tabs-nav-wrap {
          padding-left: 8px;
        }
        .sheet-tab-bar .ant-tabs-tab {
          padding: 0 !important;
          margin: 0 !important;
          border: none !important;
          background: transparent !important;
          border-radius: 0 !important;
          transition: none !important;
        }
        .sheet-tab-bar .ant-tabs-tab + .ant-tabs-tab {
          margin-left: 0 !important;
        }
        .sheet-tab-bar .ant-tabs-tab-active {
          background: transparent !important;
        }
        .sheet-tab-bar .ant-tabs-tab-btn {
          padding: 0 !important;
        }
        .sheet-tab-bar .ant-tabs-tab-remove {
          display: none !important;
        }
        .sheet-tab-bar .ant-tabs-nav-add {
          border: none !important;
          background: transparent !important;
          padding: 0 !important;
          width: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 4px 0 !important;
          border-radius: 4px !important;
          color: #8c8c8c;
          transition: background 0.1s, color 0.1s;
        }
        .sheet-tab-bar .ant-tabs-nav-add:hover {
          background: #f0f4ff !important;
          color: #1677ff !important;
        }
        .sheet-tab-bar .ant-tabs-ink-bar {
          display: none !important;
        }
        .sheet-tab-bar .ant-tabs-content-holder {
          display: none !important;
        }
        .sheet-tab-bar .ant-tabs-nav-list {
          align-items: stretch;
        }
      `}</style>
      <div className="sheet-tab-bar" style={{ flexShrink: 0, background: 'transparent' }}>
        <Tabs
          type="editable-card"
          activeKey={activeSheet}
          onChange={key => { if (!renaming) onSelectSheet(key); }}
          onEdit={(key, action) => {
            if (action === 'add') onAddSheet();
            if (action === 'remove') onDeleteSheet(key as string);
          }}
          items={items}
          size="small"
          hideAdd={false}
          addIcon={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <line x1="8" y1="3" x2="8" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="3" y1="8" x2="13" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          }
        />
      </div>

      {menuOpenSheet && menuPos && (
        <ContextMenu
          pos={menuPos}
          canDelete={sheets.length > 1}
          onClose={handleCloseMenu}
          onRename={() => {
            setRenaming(menuOpenSheet);
            setRenameValue(menuOpenSheet);
            handleCloseMenu();
          }}
          onCopy={() => { onCopySheet(menuOpenSheet); handleCloseMenu(); }}
          onDelete={() => { onDeleteSheet(menuOpenSheet); handleCloseMenu(); }}
        />
      )}
    </>
  );
}

// ── Tab label rendered inside each antd Tabs item ─────────────
function TabLabel({
  sheet, active, isOver, isDragging,
  renaming, renameValue, onRenameChange, onRenameBlur, onRenameKey,
  onDragStart, onDragEnd, onDragOver, onDrop, onOpenMenu,
}: {
  sheet: string; active: boolean; isOver: boolean; isDragging: boolean;
  renaming: boolean; renameValue: string;
  onRenameChange: (v: string) => void;
  onRenameBlur: () => void;
  onRenameKey: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onOpenMenu: (e: React.MouseEvent) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', display: 'flex', alignItems: 'center', gap: 5,
        padding: '0 12px', cursor: 'pointer', fontSize: 13,
        height: 36,
        color: active ? '#141414' : hovered ? '#141414' : '#595959',
        fontWeight: active ? 500 : 400,
        background: active ? '#fff' : hovered ? '#fafafa' : 'transparent',
        borderLeft: isOver ? '2px solid #1677ff' : '2px solid transparent',
        opacity: isDragging ? 0.5 : 1,
        flexShrink: 0,
        userSelect: 'none',
        transition: 'background 0.1s, color 0.1s',
      }}
    >
      {/* Bottom active indicator */}
      {active && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 2, background: '#1677ff', borderRadius: '2px 2px 0 0',
        }} />
      )}

      {/* Grid icon — like Feishu 田 */}
      <LayoutGrid
        size={12}
        color={active ? '#1677ff' : hovered ? '#8c8c8c' : '#c9cdd4'}
        style={{ flexShrink: 0 }}
      />

      {renaming ? (
        <Input
          autoFocus
          value={renameValue}
          size="small"
          onChange={e => onRenameChange(e.target.value)}
          onBlur={onRenameBlur}
          onPressEnter={() => onRenameKey({ key: 'Enter' } as React.KeyboardEvent<HTMLInputElement>)}
          onKeyDown={onRenameKey}
          onClick={e => e.stopPropagation()}
          style={{
            fontSize: 13, padding: '1px 4px', borderRadius: 2,
            width: 80, borderColor: '#1677ff',
          }}
        />
      ) : (
        <span style={{ whiteSpace: 'nowrap' }}>{sheet}</span>
      )}

      {/* Three-dot — only show on active tab, or on hover */}
      {(active || hovered) && !renaming && (
        <div
          draggable={false}
          onDragStart={e => { e.stopPropagation(); e.preventDefault(); }}
          onClick={onOpenMenu}
          style={{
            lineHeight: 0, padding: '2px 2px',
            borderRadius: 3, cursor: 'pointer', flexShrink: 0,
            marginLeft: 2,
            color: '#8c8c8c',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLDivElement).style.background = '#f5f5f5';
            (e.currentTarget as HTMLDivElement).style.color = '#141414';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLDivElement).style.background = 'transparent';
            (e.currentTarget as HTMLDivElement).style.color = '#8c8c8c';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="3"  cy="7" r="1.2" fill="currentColor" />
            <circle cx="7"  cy="7" r="1.2" fill="currentColor" />
            <circle cx="11" cy="7" r="1.2" fill="currentColor" />
          </svg>
        </div>
      )}
    </div>
  );
}

// ── Context menu ──────────────────────────────────────────────
function ContextMenu({ pos, canDelete, onClose, onRename, onCopy, onDelete }: {
  pos: { x: number; y: number };
  canDelete: boolean;
  onClose: () => void;
  onRename: () => void;
  onCopy: () => void;
  onDelete: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const id = setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => { clearTimeout(id); document.removeEventListener('mousedown', handler); };
  }, [onClose]);

  const menuItems: MenuProps['items'] = [
    {
      key: 'rename',
      label: '重命名',
      onClick: onRename,
    },
    {
      key: 'copy',
      label: '复制',
      onClick: onCopy,
    },
    {
      key: 'delete',
      label: canDelete
        ? '删除'
        : <span>删除<span style={{ fontSize: 11, color: '#c9cdd4', marginLeft: 4 }}>（仅剩1个）</span></span>,
      danger: true,
      disabled: !canDelete,
      onClick: canDelete ? onDelete : undefined,
    },
  ];

  return (
    <div
      ref={ref}
      onMouseDown={e => e.stopPropagation()}
      style={{
        position: 'fixed', left: pos.x, top: pos.y, zIndex: 9999,
        width: 130, background: '#fff', borderRadius: 6,
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)', border: '1px solid #d9d9d9',
        overflow: 'hidden', fontFamily: F,
      }}
    >
      <ContextMenuItem label="重命名" onClick={onRename} />
      <ContextMenuItem label="复制" onClick={onCopy} />
      <ContextMenuItem
        label={canDelete ? '删除' : <span>删除<span style={{ fontSize: 11, color: '#c9cdd4', marginLeft: 4 }}>（仅剩1个）</span></span>}
        danger disabled={!canDelete}
        onClick={canDelete ? onDelete : undefined}
      />
    </div>
  );
}

function ContextMenuItem({ label, onClick, danger, disabled }: {
  label: React.ReactNode; onClick?: () => void; danger?: boolean; disabled?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '8px 14px', fontSize: 13,
        cursor: disabled ? 'not-allowed' : 'pointer',
        color: disabled ? '#c9cdd4' : danger ? '#f54a45' : '#141414',
        background: hovered ? '#fafafa' : 'transparent',
      }}
    >
      {label}
    </div>
  );
}

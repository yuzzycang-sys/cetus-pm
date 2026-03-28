import React, { useState, useRef } from 'react';
const F = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

export const GRAN_LABELS: Record<string, string> = { day: '天', week: '周', month: '月' };

/** Strip the leading gran prefix (e.g. "天-") to get the custom part */
export function getCustomPart(name: string): string {
  return name.replace(/^(?:天|周|月)-/, '');
}

/** Build full sheet name from gran + custom part */
export function buildFullName(gran: 'day' | 'week' | 'month', customPart: string): string {
  return customPart ? `${GRAN_LABELS[gran]}-${customPart}` : GRAN_LABELS[gran];
}

interface Props {
  sheets: string[];
  activeSheet: string;
  sheetGranularities: Record<string, 'day' | 'week' | 'month'>;
  onSelectSheet: (name: string) => void;
  onRenameSheet: (oldName: string, newName: string) => void;
  onDeleteSheet: (name: string) => void;
  onCopySheet: (name: string) => void;
  onAddSheet: () => void;
  onReorderSheets: (sheets: string[]) => void;
}

export function SheetTabBar({
  sheets, activeSheet, sheetGranularities,
  onSelectSheet, onRenameSheet, onDeleteSheet, onCopySheet, onAddSheet, onReorderSheets,
}: Props) {
  const [menuOpenSheet, setMenuOpenSheet] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [menuTabRect, setMenuTabRect] = useState<DOMRect | null>(null);
  const [draggedSheet, setDraggedSheet] = useState<string | null>(null);
  const [dragOverSheet, setDragOverSheet] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameRect, setRenameRect] = useState<DOMRect | null>(null);

  const handleOpenMenu = (sheet: string, btnEl: HTMLElement, tabEl: HTMLElement) => {
    if (menuOpenSheet === sheet) {
      setMenuOpenSheet(null);
      setMenuPos(null);
    } else {
      const btnRect = btnEl.getBoundingClientRect();
      const tabRect = tabEl.getBoundingClientRect();
      setMenuPos({ x: btnRect.left, y: btnRect.bottom + 4 });
      setMenuTabRect(tabRect);
      setMenuOpenSheet(sheet);
    }
  };

  const handleCloseMenu = () => {
    setMenuOpenSheet(null);
    setMenuPos(null);
  };

  const commitRename = () => {
    if (!renaming) return;
    const oldName = renaming;
    const newCustomPart = renameValue.trim();
    setRenaming(null);
    setRenameRect(null);
    if (newCustomPart === '' || newCustomPart === getCustomPart(oldName)) return;
    const gran = sheetGranularities[oldName] ?? 'day';
    const newFullName = buildFullName(gran, newCustomPart);
    onRenameSheet(oldName, newFullName);
  };

  const cancelRename = () => {
    setRenaming(null);
    setRenameRect(null);
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

  return (
    <>
      {/* Tab bar */}
      <div style={{
        height: 36, display: 'flex', alignItems: 'center',
        background: '#f0f0f0',
        paddingLeft: 0,
        paddingRight: 16,
        gap: 4,
        flexShrink: 0, fontFamily: F,
      }}>
        {sheets.map((sheet, idx) => (
          <SheetTab
            key={sheet}
            sheet={sheet}
            active={sheet === activeSheet}
            isFirst={idx === 0}
            isOver={dragOverSheet === sheet}
            isDragging={draggedSheet === sheet}
            onClick={() => onSelectSheet(sheet)}
            onDragStart={e => handleDragStart(e, sheet)}
            onDragEnd={handleDragEnd}
            onDragOver={e => handleDragOver(e, sheet)}
            onDrop={e => handleDrop(e, sheet)}
            onOpenMenu={(btnEl, tabEl) => handleOpenMenu(sheet, btnEl, tabEl)}
          />
        ))}

        {/* Add sheet button */}
        <AddButton onClick={onAddSheet} />
      </div>

      {/* Context menu */}
      {menuOpenSheet && menuPos && (() => {
        const sheet = menuOpenSheet;
        return (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={handleCloseMenu} />
            <ContextMenu
              pos={menuPos}
              canDelete={sheets.length > 1}
              onRename={() => {
                if (menuTabRect) setRenameRect(menuTabRect);
                setRenaming(sheet);
                setRenameValue(getCustomPart(sheet));
                handleCloseMenu();
              }}
              onCopy={() => { onCopySheet(sheet); handleCloseMenu(); }}
              onDelete={() => { onDeleteSheet(sheet); handleCloseMenu(); }}
            />
          </>
        );
      })()}

      {/* Floating rename input — overlays the tab div directly */}
      {renaming && renameRect && (() => {
        const gran = sheetGranularities[renaming] ?? 'day';
        const granLabel = GRAN_LABELS[gran];
        return (
          <div
            style={{
              position: 'fixed',
              left: renameRect.left,
              top: renameRect.top,
              width: renameRect.width,
              height: renameRect.height,
              display: 'flex', alignItems: 'center',
              border: '2px solid #1677ff', borderRadius: '8px 8px 0 0',
              background: '#fff',
              zIndex: 10000,
              boxSizing: 'border-box',
              padding: '0 10px',
            }}
          >
            <span style={{
              fontSize: 13, fontFamily: F,
              color: '#8c8c8c', whiteSpace: 'nowrap',
              paddingRight: 2, flexShrink: 0,
            }}>
              {granLabel}-
            </span>
            <input
              autoFocus
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); commitRename(); }
                if (e.key === 'Escape') { e.preventDefault(); cancelRename(); }
              }}
              style={{
                flex: 1, minWidth: 0,
                fontSize: 13, fontFamily: F,
                border: 'none', outline: 'none',
                background: 'transparent', color: '#141414',
              }}
            />
          </div>
        );
      })()}
    </>
  );
}

// ── Individual sheet tab ───────────────────────────────────────
function SheetTab({
  sheet, active, isFirst, isOver, isDragging,
  onClick, onDragStart, onDragEnd, onDragOver, onDrop, onOpenMenu,
}: {
  sheet: string; active: boolean; isFirst: boolean; isOver: boolean; isDragging: boolean;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onOpenMenu: (btnEl: HTMLElement, tabEl: HTMLElement) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const tabRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={tabRef}
      draggable
      onClick={onClick}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        paddingLeft: isFirst ? 16 : 10, paddingRight: 10,
        cursor: 'pointer', fontSize: 13,
        flexShrink: 0, userSelect: 'none',
        ...(active ? {
          height: '100%',
          borderRadius: isFirst ? '0 8px 0 0' : '8px 8px 0 0',
          background: '#fff',
          color: '#1677ff',
          fontWeight: 500,
        } : {
          height: 28,
          borderRadius: 6,
          background: hovered ? '#e8e8e8' : 'transparent',
          color: hovered ? '#333' : '#595959',
          fontWeight: 400,
        }),
        borderLeft: isOver ? '2px solid #1677ff' : '2px solid transparent',
        opacity: isDragging ? 0.5 : 1,
        transition: 'background 0.1s, color 0.1s',
      }}
    >
      <span style={{ whiteSpace: 'nowrap' }}>{sheet}</span>

      {/* Three-dot menu button — only on active or hovered */}
      {(active || hovered) && (
        <div
          draggable={false}
          onDragStart={e => { e.stopPropagation(); e.preventDefault(); }}
          onClick={e => {
            e.stopPropagation();
            if (tabRef.current) onOpenMenu(e.currentTarget as HTMLElement, tabRef.current);
          }}
          style={{
            lineHeight: 0, padding: '2px 2px',
            borderRadius: 3, cursor: 'pointer', flexShrink: 0,
            marginLeft: 1, color: '#aaa',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.color = '#555'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.color = '#aaa'; }}
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

// ── Add sheet button ───────────────────────────────────────────
function AddButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 28, height: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 6, cursor: 'pointer', flexShrink: 0,
        background: hovered ? '#e0e0e0' : 'transparent',
        color: hovered ? '#333' : '#8c8c8c',
        transition: 'background 0.1s, color 0.1s',
        marginLeft: 2,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <line x1="8" y1="3" x2="8" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="3" y1="8" x2="13" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// ── Context menu ───────────────────────────────────────────────
function ContextMenu({ pos, canDelete, onRename, onCopy, onDelete }: {
  pos: { x: number; y: number };
  canDelete: boolean;
  onRename: () => void;
  onCopy: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed', left: pos.x, top: pos.y, zIndex: 9999,
        width: 148, background: '#fff', borderRadius: 6,
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

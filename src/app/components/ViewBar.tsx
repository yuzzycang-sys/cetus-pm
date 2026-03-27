import React, { useState, useRef } from 'react';
import { ChevronDown, Pin, Search } from 'lucide-react';
import { Button, Divider } from 'antd';
import { ViewSelectorDropdown, ViewItem } from './ViewSelectorDropdown';
import { SaveMenu } from './SaveMenu';
import { UpdateViewModal } from './UpdateViewModal';
import { SaveAsNewViewModal } from './SaveAsNewViewModal';
import { ShareViewModal } from './ShareViewModal';
import type { ShareMode } from './ShareViewModal';

const F = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

interface Props {
  views: ViewItem[];
  selectedView: string | null;
  onSelectView: (name: string) => void;
  onTogglePin: (id: string) => void;
  onSaveNew: (name: string) => void;
  pinnedViews: string[];
  activePinnedTag: string | null;
  onClickPinnedTag: (name: string) => void;
  onShareView: (id: string, shareMode: ShareMode, sharedWith: string[]) => void;
}

export function ViewBar({
  views, selectedView, onSelectView, onTogglePin, onSaveNew,
  pinnedViews, activePinnedTag, onClickPinnedTag, onShareView,
}: Props) {
  const [showSelector, setShowSelector] = useState(false);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showSaveAsModal, setShowSaveAsModal] = useState(false);
  const [cacheLastOp, setCacheLastOp] = useState(false);
  const [selectorPos, setSelectorPos] = useState<{ left: number; top: number } | null>(null);

  const [sharingViewId, setSharingViewId] = useState<string | null>(null);

  const selectorRef = useRef<HTMLDivElement>(null);
  const saveMenuRef = useRef<HTMLDivElement>(null);

  const existingNames = views.map(v => v.name);
  const sharingView = sharingViewId ? views.find(v => v.id === sharingViewId) ?? null : null;

  return (
    <>
      <div style={{
        height: 40, display: 'flex', alignItems: 'center',
        borderBottom: 'none', padding: '0 16px',
        background: 'transparent', gap: 10, flexShrink: 0, fontFamily: F,
      }}>
        {/* Select view button */}
        <div ref={selectorRef} style={{ position: 'relative' }}>
          <Button
            onClick={() => {
              if (showSelector) { setShowSelector(false); return; }
              if (selectorRef.current) {
                const r = selectorRef.current.getBoundingClientRect();
                setSelectorPos({ left: r.left, top: r.bottom + 4 });
              }
              setShowSelector(true);
            }}
            size="small"
            type="default"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              height: 28, fontSize: 13,
              color: selectedView ? '#141414' : '#8c8c8c',
              width: 160,
            }}
          >
            <Search size={12} color="#aaa" style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>
              {selectedView || '选择视图'}
            </span>
            <ChevronDown size={12} color="#aaa" style={{ flexShrink: 0 }} />
          </Button>

          {showSelector && selectorPos && (
            <ViewSelectorDropdown
              views={views}
              selectedView={selectedView}
              onSelect={name => { onSelectView(name); setShowSelector(false); }}
              onTogglePin={onTogglePin}
              onShareView={id => { setSharingViewId(id); setShowSelector(false); }}
              onClose={() => setShowSelector(false)}
              fixedLeft={selectorPos.left}
              fixedTop={selectorPos.top}
            />
          )}
        </div>

        {/* Save button */}
        <div ref={saveMenuRef} style={{ position: 'relative' }}>
          <Button
            type="link"
            onClick={() => setShowSaveMenu(v => !v)}
            style={{ fontSize: 13, padding: 0, height: 'auto' }}
          >
            保存
          </Button>
          {showSaveMenu && (
            <SaveMenu
              selectedView={selectedView}
              cacheLastOp={cacheLastOp}
              onToggleCache={() => setCacheLastOp(v => !v)}
              onUpdateView={() => setShowUpdateModal(true)}
              onSaveAsNew={() => setShowSaveAsModal(true)}
              onClose={() => setShowSaveMenu(false)}
            />
          )}
        </div>

        {/* Divider — LEFT of pin icon */}
        <Divider type="vertical" style={{ height: 18, margin: '0 6px' }} />

        {/* Pin icon */}
        <Pin size={14} color="#1677ff" fill="#1677ff" style={{ cursor: 'default', flexShrink: 0 }} />

        {/* Pinned view tags */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, overflow: 'hidden' }}>
          {pinnedViews.map(name => {
            const active = activePinnedTag === name;
            return (
              <PinnedTag
                key={name}
                name={name}
                active={active}
                onClick={() => onClickPinnedTag(name)}
              />
            );
          })}
        </div>
      </div>

      {/* Modals */}
      {showUpdateModal && (
        <UpdateViewModal
          viewName={selectedView || ''}
          onConfirm={(name, time) => {
            setShowUpdateModal(false);
          }}
          onClose={() => setShowUpdateModal(false)}
        />
      )}

      {showSaveAsModal && (
        <SaveAsNewViewModal
          existingNames={existingNames}
          onConfirm={(name, time) => {
            onSaveNew(name);
            setShowSaveAsModal(false);
          }}
          onClose={() => setShowSaveAsModal(false)}
        />
      )}

      {/* Share modal */}
      {sharingView && (
        <ShareViewModal
          view={sharingView}
          onSave={(shareMode, sharedWith) => {
            onShareView(sharingView.id, shareMode, sharedWith);
            setSharingViewId(null);
          }}
          onClose={() => setSharingViewId(null)}
        />
      )}
    </>
  );
}

function PinnedTag({ name, active, onClick }: { name: string; active: boolean; onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      size="small"
      type={active ? 'primary' : 'default'}
      ghost={active}
      style={{
        height: 28, fontSize: 13,
        whiteSpace: 'nowrap',
      }}
    >
      {name}
    </Button>
  );
}

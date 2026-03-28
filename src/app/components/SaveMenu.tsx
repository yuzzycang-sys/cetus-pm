import React, { useRef, useEffect } from 'react';
import { Checkbox, Divider, Menu } from 'antd';

const F = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

interface Props {
  selectedView: string | null;
  cacheLastOp: boolean;
  onToggleCache: () => void;
  onUpdateView: () => void;
  onSaveAsNew: () => void;
  onClose: () => void;
}

export function SaveMenu({ selectedView, cacheLastOp, onToggleCache, onUpdateView, onSaveAsNew, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute', top: '100%', left: 0, zIndex: 1000,
        width: 180, background: '#fff', borderRadius: 6,
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        fontFamily: F, marginTop: 4,
        border: '1px solid #e8e8e8',
      }}
    >
      <Menu
        selectable={false}
        style={{ border: 'none', borderRadius: 6, fontSize: 13 }}
        items={[
          {
            key: 'cache',
            label: (
              <Checkbox
                checked={cacheLastOp}
                onChange={onToggleCache}
                onClick={e => e.stopPropagation()}
                style={{ fontSize: 13 }}
              >
                缓存最后操作
              </Checkbox>
            ),
            onClick: onToggleCache,
          },
          {
            key: 'divider',
            type: 'divider',
            style: { margin: '4px 0' },
          },
          {
            key: 'update',
            label: (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: selectedView ? '#333' : '#bbb' }}>更新当前视图</span>
                {!selectedView && (
                  <span style={{ fontSize: 12, color: '#bbb' }}>未选视图</span>
                )}
              </div>
            ),
            disabled: !selectedView,
            onClick: () => {
              if (selectedView) { onUpdateView(); onClose(); }
            },
          },
          {
            key: 'saveas',
            label: <span style={{ color: '#333' }}>另存为新视图</span>,
            onClick: () => { onSaveAsNew(); onClose(); },
          },
        ]}
      />
    </div>
  );
}

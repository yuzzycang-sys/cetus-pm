import React, { useRef, useEffect } from 'react';
import { Checkbox, Typography, Button } from 'antd';
import { FILTER_GROUPS } from './filterConfig';

interface Props {
  activeFilters: string[];
  onToggleFilter: (key: string) => void;
  onClearAll: () => void;
  onClose: () => void;
  /** position: fixed coordinates from parent's getBoundingClientRect */
  fixedLeft: number;
  fixedTop: number;
}

export function AllFiltersPopover({ activeFilters, onToggleFilter, onClearAll, onClose, fixedLeft, fixedTop }: Props) {
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
        position: 'fixed',
        left: fixedLeft,
        top: fixedTop,
        zIndex: 9999,
        width: 420,
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
        border: '1px solid #e8e8e8',
      }}
    >
      <div style={{ padding: '16px 20px' }}>
        {FILTER_GROUPS.map((group, gi) => (
          <div key={group.group} style={{ marginBottom: gi < FILTER_GROUPS.length - 1 ? 16 : 0 }}>
            <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 10 }}>
              {group.group}
            </Typography.Text>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px 0' }}>
              {group.items.map(item => {
                const checked = activeFilters.includes(item.key);
                return (
                  <CheckItem
                    key={item.key}
                    label={item.label}
                    checked={checked}
                    onToggle={() => onToggleFilter(item.key)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {activeFilters.length > 0 && (
        <div style={{
          padding: '8px 20px',
          borderTop: '1px solid #f0f0f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 12, color: '#8c8c8c' }}>已选 {activeFilters.length} 个筛选维度</span>
          <Button type="link" size="small" onClick={onClearAll} style={{ fontSize: 12, padding: 0 }}>
            清空
          </Button>
        </div>
      )}
    </div>
  );
}

function CheckItem({ label, checked, onToggle }: {
  label: string; checked: boolean; onToggle: () => void;
}) {
  return (
    <div
      onClick={onToggle}
      style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '3px 0' }}
    >
      <Checkbox checked={checked} style={{ pointerEvents: 'none' }} />
      <Typography.Text style={{ fontSize: 13, color: '#333', whiteSpace: 'nowrap' }}>
        {label}
      </Typography.Text>
    </div>
  );
}

import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Modal, Button, Input, Tabs, Radio, Typography } from 'antd';

const TIME_OPTS = ['今天', '昨天', '近7天', '近30天'];
const MAX_CHARS = 30;

interface Props {
  viewName: string;
  onConfirm: (name: string, timeOpt: string) => void;
  onClose: () => void;
}

export function UpdateViewModal({ viewName, onConfirm, onClose }: Props) {
  const [name, setName] = useState(viewName);
  const [timeTab, setTimeTab] = useState<'relative' | 'absolute'>('relative');
  const [selectedTime, setSelectedTime] = useState('近7天');
  const [absStart, setAbsStart] = useState('2026-02-01');
  const [absEnd, setAbsEnd] = useState('2026-02-28');

  const charCount = name.split('').reduce((acc, c) => acc + (c.charCodeAt(0) > 127 ? 2 : 1), 0);
  const overLimit = charCount > MAX_CHARS;
  const canConfirm = name.trim().length > 0 && !overLimit;

  const tabItems = [
    {
      key: 'relative',
      label: '相对时间',
      children: (
        <Radio.Group
          optionType="button"
          value={selectedTime}
          onChange={e => setSelectedTime(e.target.value)}
          options={TIME_OPTS.map(opt => ({ label: opt, value: opt }))}
        />
      ),
    },
    {
      key: 'absolute',
      label: '绝对时间',
      children: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Input
            type="date"
            value={absStart}
            onChange={e => setAbsStart(e.target.value)}
            style={{ width: 150 }}
          />
          <span style={{ color: '#999', fontSize: 12 }}>~</span>
          <Input
            type="date"
            value={absEnd}
            onChange={e => setAbsEnd(e.target.value)}
            style={{ width: 150 }}
          />
        </div>
      ),
    },
  ];

  const footer = (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
      <Button onClick={onClose}>取消</Button>
      <Button
        type="primary"
        disabled={!canConfirm}
        onClick={() => canConfirm && onConfirm(name, timeTab === 'relative' ? selectedTime : `${absStart}~${absEnd}`)}
      >
        确定
      </Button>
    </div>
  );

  return (
    <Modal
      open={true}
      onCancel={onClose}
      title="更新当前视图"
      footer={footer}
      width={440}
    >
      {/* View name */}
      <div style={{ marginBottom: 18 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#333', marginBottom: 6 }}>
          视图名称
        </label>
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          status={overLimit ? 'error' : undefined}
          suffix={
            <span style={{ fontSize: 11, color: overLimit ? '#ff4d4f' : '#aaa' }}>
              {charCount}/{MAX_CHARS}
            </span>
          }
        />
        {overLimit && (
          <Typography.Text type="danger" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
            视图名称上限 30 个字符（中文算 2 个）
          </Typography.Text>
        )}
      </div>

      {/* Time selection */}
      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#333', marginBottom: 6 }}>
          时间选择
        </label>
        <Tabs
          size="small"
          activeKey={timeTab}
          onChange={key => setTimeTab(key as 'relative' | 'absolute')}
          items={tabItems}
        />
      </div>
    </Modal>
  );
}

export function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {children}
    </div>,
    document.body
  );
}

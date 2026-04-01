import React, { useState } from 'react';
import { Modal, Button, Radio, Typography, Input, Tabs, Popconfirm } from 'antd';
import { Overlay } from './UpdateViewModal';
import { DateRangeTrigger } from './DateRangePicker';

const TIME_OPTS = ['今天', '昨天', '近7天', '近30天'];
const MAX_CHARS = 30;

interface Props {
  existingNames: string[];
  onConfirm: (name: string, timeOpt: string) => void;
  onClose: () => void;
  hasConflict?: boolean;
}

const modalCss = `
  .view-modal .ant-modal-title { font-size: 14px !important; font-weight: 500 !important; }
  .view-modal .ant-tabs-tab { font-size: 12px !important; font-weight: 400 !important; padding: 5px 0 !important; color: #888 !important; }
  .view-modal .ant-tabs-tab-active .ant-tabs-tab-btn { font-weight: 500 !important; color: #1890ff !important; }
  .view-modal .ant-tabs-nav { margin-bottom: 8px !important; }
  .view-modal .ant-radio-button-wrapper { font-size: 12px !important; font-weight: 400 !important; height: 26px !important; line-height: 24px !important; padding: 0 12px !important; }
`;

export function SaveAsNewViewModal({ existingNames, onConfirm, onClose, hasConflict }: Props) {
  const [name, setName] = useState('');
  const [timeTab, setTimeTab] = useState<'relative' | 'absolute'>('relative');
  const [selectedTime, setSelectedTime] = useState('今天');
  const [absStart, setAbsStart] = useState('2026-02-01');
  const [absEnd, setAbsEnd] = useState('2026-02-28');

  const charCount = name.split('').reduce((acc, c) => acc + (c.charCodeAt(0) > 127 ? 2 : 1), 0);
  const overLimit = charCount > MAX_CHARS;
  const duplicateName = existingNames.includes(name.trim());
  const canConfirm = name.trim().length > 0 && !overLimit && !duplicateName;

  const getError = () => {
    if (overLimit) return `视图名称上限 30 个字符，当前 ${charCount} 个`;
    if (duplicateName) return '视图名称已存在';
    return null;
  };

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
        <DateRangeTrigger
          start={absStart}
          end={absEnd}
          onChange={(s, e) => { setAbsStart(s); setAbsEnd(e); }}
          clearable={false}
        />
      ),
    },
  ];

  const timeOpt = timeTab === 'relative' ? selectedTime : `${absStart}~${absEnd}`;
  const handleConfirm = () => canConfirm && onConfirm(name.trim(), timeOpt);

  const confirmBtn = hasConflict ? (
    <Popconfirm
      title="当前视图存在无权限内容，确认另存为新视图？"
      onConfirm={handleConfirm}
      okText="确定"
      cancelText="取消"
      placement="topRight"
    >
      <Button size="small" type="primary" disabled={!canConfirm} style={{ letterSpacing: 0 }}>
        确定
      </Button>
    </Popconfirm>
  ) : (
    <Button size="small" type="primary" disabled={!canConfirm} style={{ letterSpacing: 0 }} onClick={handleConfirm}>
      确定
    </Button>
  );

  const footer = (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
      <Button size="small" onClick={onClose} style={{ letterSpacing: 0 }}>取消</Button>
      {confirmBtn}
    </div>
  );

  return (
    <Modal
      open={true}
      onCancel={onClose}
      title="另存为新视图"
      footer={footer}
      width={440}
      className="view-modal"
    >
      <style>{modalCss}</style>
      {/* View name */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 400, color: '#333', marginBottom: 6 }}>
          视图名称
        </label>
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="请输入视图名称"
          status={getError() ? 'error' : undefined}
          suffix={
            <span style={{ fontSize: 12, color: overLimit ? '#ff4d4f' : '#bbb' }}>
              {charCount}/{MAX_CHARS}
            </span>
          }
        />
        {getError() && (
          <Typography.Text type="danger" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
            {getError()}
          </Typography.Text>
        )}
      </div>

      {/* Time selection */}
      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 400, color: '#333', marginBottom: 6 }}>
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

export { Overlay };

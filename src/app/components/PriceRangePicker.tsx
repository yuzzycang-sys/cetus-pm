import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Space, Typography } from 'antd';
import { CloseOutlined, InfoCircleOutlined } from '@ant-design/icons';

interface InputFieldProps {
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  onClear?: () => void;
}

function InputField({ value, placeholder, onChange, onClear }: InputFieldProps) {
  return (
    <Input
      value={value}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      allowClear={!!onClear || !!value}
      onClear={() => { onClear?.(); onChange(''); }}
      style={{ fontSize: 13 }}
    />
  );
}

interface Props {
  priceMin: string;
  priceMax: string;
  roiMin: string;
  roiMax: string;
  onChange: (priceMin: string, priceMax: string, roiMin: string, roiMax: string) => void;
  onClose: () => void;
  fixedLeft: number;
  fixedTop: number;
}

export function PriceRangePicker({
  priceMin, priceMax, roiMin, roiMax,
  onChange, onClose,
  fixedLeft, fixedTop,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [tempPriceMin, setTempPriceMin] = useState(priceMin);
  const [tempPriceMax, setTempPriceMax] = useState(priceMax);
  const [tempRoiMin, setTempRoiMin] = useState(roiMin);
  const [tempRoiMax, setTempRoiMax] = useState(roiMax);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleConfirm = () => {
    onChange(tempPriceMin, tempPriceMax, tempRoiMin, tempRoiMax);
    onClose();
  };

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left: fixedLeft,
        top: fixedTop,
        zIndex: 9999,
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        border: '1px solid #e8e8e8',
        padding: '20px 24px',
        minWidth: 420,
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
      }}>
        <Typography.Text strong style={{ fontSize: 14, color: '#333' }}>
          设置出价筛选条件
        </Typography.Text>
        <Button
          type="text"
          icon={<CloseOutlined style={{ color: '#bbb' }} />}
          onClick={onClose}
          style={{ padding: '0 4px', height: 'auto', lineHeight: 1 }}
        />
      </div>

      {/* Price Range */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <label style={{ fontSize: 13, color: '#333', minWidth: 60, fontWeight: 500 }}>
            出价范围
          </label>
          <InputField
            placeholder="出价下限"
            value={tempPriceMin}
            onChange={setTempPriceMin}
            onClear={() => setTempPriceMin('')}
          />
          <span style={{ fontSize: 12, color: '#999', minWidth: 20, textAlign: 'center' }}>至</span>
          <InputField
            placeholder="出价上限"
            value={tempPriceMax}
            onChange={setTempPriceMax}
            onClear={() => setTempPriceMax('')}
          />
        </div>
      </div>

      {/* ROI Range */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <label style={{ fontSize: 13, color: '#333', minWidth: 60, fontWeight: 500 }}>
            ROI范围
          </label>
          <InputField
            placeholder="ROI下限"
            value={tempRoiMin}
            onChange={setTempRoiMin}
            onClear={() => setTempRoiMin('')}
          />
          <span style={{ fontSize: 12, color: '#999', minWidth: 20, textAlign: 'center' }}>至</span>
          <InputField
            placeholder="ROI上限"
            value={tempRoiMax}
            onChange={setTempRoiMax}
            onClear={() => setTempRoiMax('')}
          />
        </div>
      </div>

      {/* Info messages */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          padding: '8px 12px',
          background: '#f5f5f5',
          borderRadius: 6,
          marginBottom: 8,
        }}>
          <InfoCircleOutlined style={{ fontSize: 14, color: '#555', flexShrink: 0, marginTop: 1 }} />
          <Typography.Text style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>
            非ROI优化目标的出价，出价上下限支持0-10000内的整数，闭区间
          </Typography.Text>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          padding: '8px 12px',
          background: '#f5f5f5',
          borderRadius: 6,
        }}>
          <InfoCircleOutlined style={{ fontSize: 14, color: '#555', flexShrink: 0, marginTop: 1 }} />
          <Typography.Text style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>
            优化目标和深度转化转化目标的ROI系数，ROI上下限支持0-100内的整数或小数，小数最多3位，闭区间
          </Typography.Text>
        </div>
      </div>

      {/* Footer buttons */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <Button
          onClick={() => {
            setTempPriceMin('');
            setTempPriceMax('');
            setTempRoiMin('');
            setTempRoiMax('');
          }}
        >
          清空
        </Button>
        <Button onClick={onClose}>
          取消
        </Button>
        <Button type="primary" onClick={handleConfirm}>
          确定
        </Button>
      </div>
    </div>
  );
}

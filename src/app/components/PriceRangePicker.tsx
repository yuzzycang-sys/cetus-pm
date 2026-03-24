import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

const F = "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif";

function InputField({
  value,
  placeholder,
  onChange,
  onClear,
}: {
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  onClear?: () => void;
}) {
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '8px 28px 8px 10px',
          border: '1px solid #d9d9d9',
          borderRadius: 4,
          fontSize: 13,
          color: '#333',
          outline: 'none',
          transition: 'border-color 0.15s',
          fontFamily: F,
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = '#1890ff')}
        onBlur={(e) => (e.currentTarget.style.borderColor = '#d9d9d9')}
      />
      {(value || onClear) && (
        <button
          onClick={() => {
            onClear?.();
            onChange('');
          }}
          style={{
            position: 'absolute',
            right: 6,
            top: '50%',
            transform: 'translateY(-50%)',
            border: 'none',
            background: 'transparent',
            color: '#999',
            cursor: 'pointer',
            fontSize: 12,
            padding: '0 3px',
          }}
          tabIndex={-1}
        >
          ✕
        </button>
      )}
    </div>
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
        fontFamily: F,
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
        <h3 style={{ fontSize: 14, fontWeight: 500, color: '#333', margin: 0 }}>
          设置出价筛选条件
        </h3>
        <X
          size={18}
          color="#bbb"
          style={{ cursor: 'pointer' }}
          onClick={onClose}
        />
      </div>

      {/* Price Range */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 12,
        }}>
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
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 12,
        }}>
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
          borderRadius: 4,
          marginBottom: 8,
        }}>
          <span style={{
            fontSize: 16,
            fontWeight: 500,
            color: '#555',
            flexShrink: 0,
            marginTop: -2,
          }}>ⓘ</span>
          <span style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>
            非ROI优化目标的出价，出价上下限支持0-10000内的整数，闭区间
          </span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          padding: '8px 12px',
          background: '#f5f5f5',
          borderRadius: 4,
        }}>
          <span style={{
            fontSize: 16,
            fontWeight: 500,
            color: '#555',
            flexShrink: 0,
            marginTop: -2,
          }}>ⓘ</span>
          <span style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>
            优化目标和深度转化转化目标的ROI系数，ROI上下限支持0-100内的整数或小数，小数最多3位，闭区间
          </span>
        </div>
      </div>

      {/* Footer buttons */}
      <div style={{
        display: 'flex',
        gap: 12,
        justifyContent: 'flex-end',
      }}>
        <button
          onClick={() => {
            setTempPriceMin('');
            setTempPriceMax('');
            setTempRoiMin('');
            setTempRoiMax('');
          }}
          style={{
            padding: '6px 24px',
            borderRadius: 4,
            border: '1px solid #d9d9d9',
            background: '#fff',
            fontSize: 13,
            color: '#333',
            cursor: 'pointer',
            fontFamily: F,
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#1890ff';
            (e.currentTarget as HTMLButtonElement).style.color = '#1890ff';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#d9d9d9';
            (e.currentTarget as HTMLButtonElement).style.color = '#333';
          }}
        >
          清空
        </button>
        <button
          onClick={onClose}
          style={{
            padding: '6px 24px',
            borderRadius: 4,
            border: '1px solid #d9d9d9',
            background: '#fff',
            fontSize: 13,
            color: '#333',
            cursor: 'pointer',
            fontFamily: F,
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#1890ff';
            (e.currentTarget as HTMLButtonElement).style.color = '#1890ff';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#d9d9d9';
            (e.currentTarget as HTMLButtonElement).style.color = '#333';
          }}
        >
          取消
        </button>
        <button
          onClick={handleConfirm}
          style={{
            padding: '6px 24px',
            borderRadius: 4,
            border: 'none',
            background: '#1890ff',
            fontSize: 13,
            color: '#fff',
            cursor: 'pointer',
            fontFamily: F,
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.background = '#0d5ccc'}
          onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.background = '#1890ff'}
        >
          确定
        </button>
      </div>
    </div>
  );
}

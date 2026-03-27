import React, { useState, useRef, useEffect } from 'react';
import { Button } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';

const WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六'];
const QUICK_OPTS = ['今天', '昨天', '近7天', '近30天', '本月', '上月'];

function getDaysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}
function getFirstDayOfMonth(y: number, m: number) {
  return new Date(y, m, 1).getDay();
}
function formatDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
function addMonths(y: number, m: number, delta: number) {
  const d = new Date(y, m + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

interface Props {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
  onClose: () => void;
  /** position: fixed coordinates */
  fixedLeft: number;
  fixedTop: number;
}

export function DateRangePicker({ startDate, endDate, onChange, onClose, fixedLeft, fixedTop }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [leftY, setLeftY] = useState(2026);
  const [leftM, setLeftM] = useState(0); // Jan
  const [selecting, setSelecting] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);
  const [activeQuick, setActiveQuick] = useState<string | null>(null);

  const rightY = leftM === 11 ? leftY + 1 : leftY;
  const rightM = leftM === 11 ? 0 : leftM + 1;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const applyQuick = (opt: string) => {
    setActiveQuick(opt);
    const today = new Date();
    const fmt = (d: Date) => formatDate(d.getFullYear(), d.getMonth(), d.getDate());
    let s: string, e: string;
    if (opt === '今天') { s = e = fmt(today); }
    else if (opt === '昨天') {
      const y = new Date(today); y.setDate(y.getDate() - 1);
      s = e = fmt(y);
    } else if (opt === '近7天') {
      const d = new Date(today); d.setDate(d.getDate() - 6);
      s = fmt(d); e = fmt(today);
    } else if (opt === '近30天') {
      const d = new Date(today); d.setDate(d.getDate() - 29);
      s = fmt(d); e = fmt(today);
    } else if (opt === '本月') {
      s = formatDate(today.getFullYear(), today.getMonth(), 1);
      e = fmt(today);
    } else { // 上月
      const lm = new Date(today.getFullYear(), today.getMonth(), 0);
      s = formatDate(lm.getFullYear(), lm.getMonth(), 1);
      e = fmt(lm);
    }
    setTempStart(s); setTempEnd(e); setSelecting(null);
  };

  const handleDayClick = (date: string) => {
    setActiveQuick(null);
    if (!selecting) {
      setSelecting(date); setTempStart(date); setTempEnd(date);
    } else {
      if (date < selecting) {
        setTempStart(date); setTempEnd(selecting);
      } else {
        setTempStart(selecting); setTempEnd(date);
      }
      setSelecting(null);
    }
  };

  const getDisplayStart = () => selecting ? selecting : tempStart;
  const getDisplayEnd = () => {
    if (selecting && hoverDate) return hoverDate > selecting ? hoverDate : selecting;
    return tempEnd;
  };

  const ds = getDisplayStart();
  const de = getDisplayEnd();

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left: fixedLeft,
        top: fixedTop,
        zIndex: 9999,
        background: '#fff', borderRadius: 8,
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column',
        border: '1px solid #e8e8e8',
      }}
    >
      <div style={{ display: 'flex' }}>
        {/* Quick options */}
        <div style={{ width: 100, borderRight: '1px solid #e8e8e8', padding: '8px 0' }}>
          {QUICK_OPTS.map(opt => (
            <div
              key={opt}
              onClick={() => applyQuick(opt)}
              style={{
                padding: '7px 14px', fontSize: 12, cursor: 'pointer', color: '#333',
                background: activeQuick === opt ? '#f0f7ff' : 'transparent',
              }}
              onMouseEnter={e => {
                if (activeQuick !== opt)
                  (e.currentTarget as HTMLDivElement).style.background = '#f8f8f8';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.background = activeQuick === opt ? '#f0f7ff' : 'transparent';
              }}
            >
              {opt}
            </div>
          ))}
        </div>

        {/* Dual calendar */}
        <div style={{ display: 'flex', padding: 12, gap: 16 }}>
          <Calendar
            year={leftY} month={leftM}
            startDate={ds} endDate={de}
            selecting={selecting}
            onPrevMonth={() => { const r = addMonths(leftY, leftM, -1); setLeftY(r.year); setLeftM(r.month); }}
            onNextMonth={() => { const r = addMonths(leftY, leftM, 1); setLeftY(r.year); setLeftM(r.month); }}
            onDayClick={handleDayClick}
            onDayHover={setHoverDate}
            showLeftArrow showRightArrow={false}
          />
          <Calendar
            year={rightY} month={rightM}
            startDate={ds} endDate={de}
            selecting={selecting}
            onPrevMonth={() => { const r = addMonths(leftY, leftM, -1); setLeftY(r.year); setLeftM(r.month); }}
            onNextMonth={() => { const r = addMonths(leftY, leftM, 1); setLeftY(r.year); setLeftM(r.month); }}
            onDayClick={handleDayClick}
            onDayHover={setHoverDate}
            showLeftArrow={false} showRightArrow
          />
        </div>
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12,
        padding: '8px 16px', borderTop: '1px solid #e8e8e8',
      }}>
        <span style={{ fontSize: 12, color: '#666' }}>
          {tempStart} ~ {tempEnd}
        </span>
        <Button
          type="primary"
          size="small"
          onClick={() => { onChange(tempStart, tempEnd); onClose(); }}
        >
          确定
        </Button>
      </div>
    </div>
  );
}

function Calendar({ year, month, startDate, endDate, selecting, onDayClick, onDayHover, onPrevMonth, onNextMonth, showLeftArrow, showRightArrow }: {
  year: number; month: number;
  startDate: string; endDate: string;
  selecting: string | null;
  onDayClick: (d: string) => void;
  onDayHover: (d: string | null) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  showLeftArrow: boolean;
  showRightArrow: boolean;
}) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isInRange = (date: string) => {
    if (!startDate || !endDate) return false;
    return date >= startDate && date <= endDate;
  };
  const isStart = (date: string) => date === startDate;
  const isEnd = (date: string) => date === endDate;

  return (
    <div style={{ width: 210 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Button
          type="text"
          size="small"
          icon={<LeftOutlined />}
          onClick={showLeftArrow ? onPrevMonth : undefined}
          style={{ opacity: showLeftArrow ? 1 : 0, cursor: showLeftArrow ? 'pointer' : 'default', padding: '0 4px' }}
          tabIndex={showLeftArrow ? 0 : -1}
        />
        <span style={{ fontSize: 13, fontWeight: 500, color: '#333' }}>
          {year}年{monthNames[month]}
        </span>
        <Button
          type="text"
          size="small"
          icon={<RightOutlined />}
          onClick={showRightArrow ? onNextMonth : undefined}
          style={{ opacity: showRightArrow ? 1 : 0, cursor: showRightArrow ? 'pointer' : 'default', padding: '0 4px' }}
          tabIndex={showRightArrow ? 0 : -1}
        />
      </div>

      {/* Week headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
        {WEEK_DAYS.map(w => (
          <div key={w} style={{ textAlign: 'center', fontSize: 11, color: '#aaa', padding: '2px 0' }}>{w}</div>
        ))}
      </div>

      {/* Days */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: 2 }}>
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} />;
          const date = formatDate(year, month, day);
          const inRange = isInRange(date);
          const start = isStart(date);
          const end = isEnd(date);
          const isEdge = start || end;

          return (
            <div
              key={day}
              onClick={() => onDayClick(date)}
              onMouseEnter={() => onDayHover(date)}
              onMouseLeave={() => onDayHover(null)}
              style={{
                textAlign: 'center', padding: '4px 0', fontSize: 12, cursor: 'pointer',
                borderRadius: isEdge ? '50%' : 0,
                background: isEdge ? '#1890ff' : inRange ? '#e6f7ff' : 'transparent',
                color: isEdge ? '#fff' : inRange ? '#1890ff' : '#333',
              }}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Calendar } from 'lucide-react';

// ─── helpers ──────────────────────────────────────────────────────────────────
function getDaysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}
function formatDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
function addMonths(y: number, m: number, delta: number) {
  const d = new Date(y, m + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}
function getTodayStr() {
  const t = new Date();
  return formatDate(t.getFullYear(), t.getMonth(), t.getDate());
}
export function isValidDate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s).getTime());
}

// ─── Quick options ────────────────────────────────────────────────────────────
const QUICK_LEFT  = ['今天','昨天','前天','本周','上周','本月','上月','本季度','上季度','今年'];
const QUICK_RIGHT = ['近3天','近7天','近15天','近30天','近60天','近90天'];

// Calendar panel height: padding(24) + header+border+gap(39) + weekdays+border+gap(31) + 6rows×36+5gaps×2(226) = 320
const CAL_CELL_H  = 36;   // day cell height
const CAL_PANEL_H = 320;
const QUICK_ROW_H = 22;   // height per quick option row
const QUICK_PAD_V = 20;   // panel top(10) + bottom(10) padding
const QUICK_COL_W = 86;   // width per quick option column

function calcQuick(opt: string): [string, string] {
  const now = new Date();
  const fmt = (d: Date) => formatDate(d.getFullYear(), d.getMonth(), d.getDate());
  const today = fmt(now);
  switch (opt) {
    case '今天': return [today, today];
    case '昨天': { const d = new Date(now); d.setDate(d.getDate()-1); const s=fmt(d); return [s,s]; }
    case '前天': { const d = new Date(now); d.setDate(d.getDate()-2); const s=fmt(d); return [s,s]; }
    case '本周': {
      const dow = now.getDay(); const diff = dow===0?6:dow-1;
      const mon = new Date(now); mon.setDate(now.getDate()-diff);
      return [fmt(mon), today];
    }
    case '上周': {
      const dow = now.getDay(); const diff = dow===0?6:dow-1;
      const thisMon = new Date(now); thisMon.setDate(now.getDate()-diff);
      const lastMon = new Date(thisMon); lastMon.setDate(thisMon.getDate()-7);
      const lastSun = new Date(thisMon); lastSun.setDate(thisMon.getDate()-1);
      return [fmt(lastMon), fmt(lastSun)];
    }
    case '本月':  return [formatDate(now.getFullYear(), now.getMonth(), 1), today];
    case '上月': {
      const lm = new Date(now.getFullYear(), now.getMonth(), 0);
      return [formatDate(lm.getFullYear(), lm.getMonth(), 1), fmt(lm)];
    }
    case '本季度': {
      const q = Math.floor(now.getMonth()/3);
      return [formatDate(now.getFullYear(), q*3, 1), today];
    }
    case '上季度': {
      const q=Math.floor(now.getMonth()/3), pq=q===0?3:q-1, py=q===0?now.getFullYear()-1:now.getFullYear();
      const lastDay = new Date(py, pq*3+3, 0);
      return [formatDate(py, pq*3, 1), fmt(lastDay)];
    }
    case '今年':  return [formatDate(now.getFullYear(), 0, 1), today];
    case '近3天':  { const d=new Date(now); d.setDate(d.getDate()-2);  return [fmt(d),today]; }
    case '近7天':  { const d=new Date(now); d.setDate(d.getDate()-6);  return [fmt(d),today]; }
    case '近15天': { const d=new Date(now); d.setDate(d.getDate()-14); return [fmt(d),today]; }
    case '近30天': { const d=new Date(now); d.setDate(d.getDate()-29); return [fmt(d),today]; }
    case '近60天': { const d=new Date(now); d.setDate(d.getDate()-59); return [fmt(d),today]; }
    case '近90天': { const d=new Date(now); d.setDate(d.getDate()-89); return [fmt(d),today]; }
    default: return [today, today];
  }
}

// ─── DateRangePicker (popup) — no footer, immediate onChange ──────────────────
interface PickerProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
  onClose: () => void;
  fixedLeft: number;
  fixedTop: number;
}

export function DateRangePicker({ startDate, endDate, onChange, onClose, fixedLeft, fixedTop }: PickerProps) {
  const init = {
    year: startDate ? parseInt(startDate.split('-')[0]) : new Date().getFullYear(),
    month: startDate ? parseInt(startDate.split('-')[1])-1 : new Date().getMonth(),
  };
  const [leftY, setLeftY] = useState(init.year);
  const [leftM, setLeftM] = useState(init.month);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);
  const [activeQuick, setActiveQuick] = useState<string | null>(null);

  const right = addMonths(leftY, leftM, 1);

  const applyQuick = (opt: string) => {
    const [s, e] = calcQuick(opt);
    setActiveQuick(opt);
    onChange(s, e); // immediate — closes via parent
  };

  const handleDayClick = (date: string, outOfMonth: boolean) => {
    if (outOfMonth) return;
    setActiveQuick(null);
    if (!selecting) {
      setSelecting(date); setTempStart(date); setTempEnd(date);
    } else {
      const [s, e] = date < selecting ? [date, selecting] : [selecting, date];
      setSelecting(null);
      onChange(s, e); // immediate — closes via parent
    }
  };

  const displayStart = selecting
    ? (hoverDate && hoverDate < selecting ? hoverDate : selecting)
    : tempStart;
  const displayEnd = selecting
    ? (hoverDate && hoverDate > selecting ? hoverDate : selecting)
    : tempEnd;

  const navMonth = (delta: number) => {
    const r = addMonths(leftY, leftM, delta); setLeftY(r.year); setLeftM(r.month);
  };

  return (
    <div
      style={{
        position: 'fixed', left: fixedLeft, top: fixedTop, zIndex: 9999,
        background: '#fff', borderRadius: 8,
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        border: '1px solid #e8e8e8',
        display: 'flex',
      }}
    >
      {/* Quick options — 2 columns with pagination */}
      <QuickPanel activeQuick={activeQuick} onClick={applyQuick} />

      {/* Dual calendar */}
      <div style={{ display: 'flex', padding: '12px 16px', gap: 20 }}>
        <MonthCalendar
          year={leftY} month={leftM}
          startDate={displayStart} endDate={displayEnd}
          onDayClick={handleDayClick}
          onDayHover={d => setHoverDate(d)}
          onPrevYear={() => setLeftY(y => y-1)}
          onPrevMonth={() => navMonth(-1)}
          onNextMonth={() => navMonth(1)}
          onNextYear={() => setLeftY(y => y+1)}
          showLeftNav showRightNav={false}
        />
        <MonthCalendar
          year={right.year} month={right.month}
          startDate={displayStart} endDate={displayEnd}
          onDayClick={handleDayClick}
          onDayHover={d => setHoverDate(d)}
          onPrevYear={() => setLeftY(y => y-1)}
          onPrevMonth={() => navMonth(-1)}
          onNextMonth={() => navMonth(1)}
          onNextYear={() => setLeftY(y => y+1)}
          showLeftNav={false} showRightNav
        />
      </div>
    </div>
  );
}

function QuickPanel({ activeQuick, onClick }: { activeQuick: string | null; onClick: (o: string) => void }) {
  const allOpts = [...QUICK_LEFT, ...QUICK_RIGHT];
  const rowsPerCol = Math.floor((CAL_PANEL_H - QUICK_PAD_V) / QUICK_ROW_H);
  const numCols = Math.ceil(allOpts.length / rowsPerCol);
  const columns: string[][] = Array.from({ length: numCols }, (_, ci) =>
    allOpts.slice(ci * rowsPerCol, (ci + 1) * rowsPerCol)
  );

  return (
    <div style={{
      borderRight: '1px solid #e8e8e8',
      width: numCols * QUICK_COL_W, flexShrink: 0,
      height: CAL_PANEL_H,
      display: 'flex',
      padding: '10px 0',
    }}>
      {columns.map((col, ci) => (
        <div key={ci} style={{ width: QUICK_COL_W, display: 'flex', flexDirection: 'column' }}>
          {col.map(opt => (
            <QuickItem key={opt} opt={opt} active={activeQuick === opt} onClick={onClick} />
          ))}
        </div>
      ))}
    </div>
  );
}

function QuickItem({ opt, active, onClick }: { opt: string; active: boolean; onClick: (o: string) => void }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={() => onClick(opt)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        height: QUICK_ROW_H, padding: '0 14px', fontSize: 12, cursor: 'pointer', userSelect: 'none',
      display: 'flex', alignItems: 'center',
        color: active ? '#1890ff' : '#333',
        background: active ? '#e6f7ff' : hov ? '#f5f5f5' : 'transparent',
        whiteSpace: 'nowrap',
      }}
    >
      {opt}
    </div>
  );
}

// ─── MonthCalendar ────────────────────────────────────────────────────────────
const MONTH_NAMES = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
const WEEK_MON_FIRST = ['一','二','三','四','五','六','日'];

interface CalendarProps {
  year: number; month: number;
  startDate: string; endDate: string;
  onDayClick: (date: string, outOfMonth: boolean) => void;
  onDayHover: (date: string | null) => void;
  onPrevYear: () => void; onPrevMonth: () => void;
  onNextMonth: () => void; onNextYear: () => void;
  showLeftNav: boolean; showRightNav: boolean;
}

function MonthCalendar({ year, month, startDate, endDate, onDayClick, onDayHover,
  onPrevYear, onPrevMonth, onNextMonth, onNextYear, showLeftNav, showRightNav }: CalendarProps) {
  const TODAY = getTodayStr();
  const firstDow = new Date(year, month, 1).getDay();
  const offset = firstDow === 0 ? 6 : firstDow - 1;
  const daysInMonth = getDaysInMonth(year, month);
  const prev = addMonths(year, month, -1);
  const next = addMonths(year, month, 1);
  const prevDays = getDaysInMonth(prev.year, prev.month);

  type Cell = { day: number; year: number; month: number; current: boolean };
  const cells: Cell[] = [];
  for (let i = offset-1; i >= 0; i--)
    cells.push({ day: prevDays-i, year: prev.year, month: prev.month, current: false });
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ day: d, year, month, current: true });
  for (let d = 1; cells.length < 42; d++)
    cells.push({ day: d, year: next.year, month: next.month, current: false });

  return (
    <div style={{ width: 240 }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingBottom: 8, marginBottom: 8, borderBottom: '1px solid #f0f0f0',
      }}>
        <div style={{ display: 'flex', gap: 2, visibility: showLeftNav ? 'visible' : 'hidden' }}>
          <NavBtn onClick={onPrevYear} label="«" />
          <NavBtn onClick={onPrevMonth} label="‹" />
        </div>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#333' }}>{year}年 {MONTH_NAMES[month]}</span>
        <div style={{ display: 'flex', gap: 2, visibility: showRightNav ? 'visible' : 'hidden' }}>
          <NavBtn onClick={onNextMonth} label="›" />
          <NavBtn onClick={onNextYear} label="»" />
        </div>
      </div>

      {/* Weekday headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        paddingBottom: 8, marginBottom: 6, borderBottom: '1px solid #f0f0f0',
      }}>
        {WEEK_MON_FIRST.map(w => (
          <div key={w} style={{ textAlign: 'center', fontSize: 12, color: '#aaa' }}>{w}</div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: 2 }}>
        {cells.map((cell, idx) => {
          const date = formatDate(cell.year, cell.month, cell.day);
          const inRange = !!(startDate && endDate && date > startDate && date < endDate);
          const isStart = startDate !== '' && date === startDate;
          const isEnd   = endDate   !== '' && date === endDate;
          const isEdge  = isStart || isEnd;
          const isToday = date === TODAY;
          const oom     = !cell.current;
          const highlighted = (isEdge || inRange) && !oom;

          // Compute rounded ends of the range band
          const col = idx % 7;
          const isRangeCell = (c: typeof cell) => {
            if (!c?.current) return false;
            const d = formatDate(c.year, c.month, c.day);
            return (startDate && d === startDate) || (endDate && d === endDate) ||
              !!(startDate && endDate && d > startDate && d < endDate);
          };
          const leftRound  = highlighted && (col === 0 || !isRangeCell(cells[idx - 1]));
          const rightRound = highlighted && (col === 6 || !isRangeCell(cells[idx + 1]));

          return (
            <div
              key={idx}
              onClick={() => onDayClick(date, oom)}
              onMouseEnter={() => !oom && onDayHover(date)}
              onMouseLeave={() => onDayHover(null)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: CAL_CELL_H,
                background: oom ? '#f7f7f7' : highlighted ? '#e6f7ff' : 'transparent',
                borderTopLeftRadius:     leftRound  ? 6 : 0,
                borderBottomLeftRadius:  leftRound  ? 6 : 0,
                borderTopRightRadius:    rightRound ? 6 : 0,
                borderBottomRightRadius: rightRound ? 6 : 0,
                cursor: oom ? 'default' : 'pointer',
              }}
            >
              <span style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 26, height: 26, borderRadius: 6, fontSize: 13,
                background: isEdge && !oom ? '#1890ff' : 'transparent',
                border: isToday && !isEdge && !oom ? '1.5px solid #1890ff' : 'none',
                color: oom ? '#c0c0c0' : isEdge ? '#fff' : isToday ? '#1890ff' : inRange ? '#1890ff' : '#333',
                fontWeight: isEdge ? 500 : 400,
              }}>
                {cell.day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NavBtn({ onClick, label }: { onClick: () => void; label: string }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        border: 'none', cursor: 'pointer', fontSize: 14, color: '#999',
        padding: '0 5px', lineHeight: 1, borderRadius: 4,
        background: hov ? '#f0f0f0' : 'none', display: 'flex', alignItems: 'center',
      }}
    >{label}</button>
  );
}

// ─── DateRangeTrigger ─────────────────────────────────────────────────────────
interface TriggerProps {
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
  clearable?: boolean;
  onClear?: () => void;
}

export function DateRangeTrigger({ start, end, onChange, clearable = true, onClear }: TriggerProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const [startText, setStartText] = useState(start);
  const [endText, setEndText] = useState(end);
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pickerWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setStartText(start); }, [start]);
  useEffect(() => { setEndText(end); }, [end]);

  // Outside-click: close if click is outside both trigger and picker
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (containerRef.current?.contains(t)) return;
      if (pickerWrapRef.current?.contains(t)) return;
      setOpen(false);
      setFocused(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const openPicker = () => {
    if (containerRef.current) {
      const r = containerRef.current.getBoundingClientRect();
      setPos({ left: r.left, top: r.bottom + 4 });
    }
    setOpen(true);
  };

  // Click anywhere on trigger → open (if not already open)
  const handleContainerClick = () => {
    if (!open) openPicker();
  };

  const handleStartBlur = () => {
    if (isValidDate(startText)) onChange(startText, end);
    else setStartText(start);
  };
  const handleEndBlur = () => {
    if (isValidDate(endText)) onChange(start, endText);
    else setEndText(end);
  };

  const hasValue = !!(start || end);

  return (
    <div ref={containerRef} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <div
        onClick={handleContainerClick}
        onFocus={() => setFocused(true)}
        onBlur={e => { if (!containerRef.current?.contains(e.relatedTarget as Node)) setFocused(false); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          border: `1px solid ${focused || open ? '#1677ff' : '#e0e0e0'}`,
          borderRadius: 6, padding: '0 8px', height: 28,
          background: '#fff', transition: 'border-color 0.15s', cursor: 'pointer',
        }}
      >
        <input
          value={startText}
          onChange={e => setStartText(e.target.value)}
          onBlur={handleStartBlur}
          placeholder="开始日期"
          style={{ border: 'none', outline: 'none', fontSize: 13, width: 82, color: '#333', background: 'transparent', cursor: 'text' }}
        />
        <span style={{ color: '#bbb', fontSize: 12, userSelect: 'none' }}>→</span>
        <input
          value={endText}
          onChange={e => setEndText(e.target.value)}
          onBlur={handleEndBlur}
          placeholder="结束日期"
          style={{ border: 'none', outline: 'none', fontSize: 13, width: 82, color: '#333', background: 'transparent', cursor: 'text' }}
        />
        <Calendar size={13} color="#bbb" style={{ flexShrink: 0 }} />
      </div>

      {clearable && hasValue && (
        <button
          onClick={e => { e.stopPropagation(); onClear?.(); }}
          title="清空"
          style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '0 2px', color: '#ccc', fontSize: 16, lineHeight: 1, display: 'flex', alignItems: 'center' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#999')}
          onMouseLeave={e => (e.currentTarget.style.color = '#ccc')}
        >×</button>
      )}

      {open && pos && ReactDOM.createPortal(
        <div ref={pickerWrapRef} data-date-range-portal="true">
          <DateRangePicker
            startDate={start}
            endDate={end}
            onChange={(s, e) => { onChange(s, e); setOpen(false); }}
            onClose={() => setOpen(false)}
            fixedLeft={pos.left}
            fixedTop={pos.top}
          />
        </div>,
        document.body
      )}
    </div>
  );
}

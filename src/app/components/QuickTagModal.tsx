import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  X, Search, Plus, GripVertical, Lock, Users, Globe,
  ChevronRight, ChevronDown, Check, Upload, Trash2,
} from 'lucide-react';
import {
  QuickTag, TAG_COLOR_OPTIONS, GAME_CHANNEL_DATA, getColorHex,
  type ShareVis, type GameNode,
} from './QuickTagBar';

const F = "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif";
const ME = '张三';

/* ── Mock org data (same as ShareViewModal) ──────────────── */
interface MockUser { id: string; name: string; dept: string }
interface MockDeptLeaf { name: string; userIds: string[] }
interface MockDept { name: string; children: MockDeptLeaf[] }

const USERS: MockUser[] = [
  { id: 'u1', name: '程龙', dept: '快手投放组' },
  { id: 'u2', name: '崔沛楷', dept: '快手投放组' },
  { id: 'u3', name: '陈欣彤', dept: '快手投放组' },
  { id: 'u4', name: '程鹏', dept: '腾讯投放组' },
  { id: 'u5', name: '赵琳', dept: '腾讯投放组' },
  { id: 'u6', name: '陈姜妮', dept: '头条投放组' },
  { id: 'u7', name: '崔小乾', dept: '头条投放组' },
  { id: 'u8', name: '敖子良', dept: '数据分析组' },
  { id: 'u9', name: '迟默', dept: '数据分析组' },
  { id: 'u10', name: '陈路遥', dept: '数据分析组' },
  { id: 'u11', name: '孙雅', dept: 'BI组' },
  { id: 'u12', name: '钱文', dept: 'BI组' },
  { id: 'u13', name: '胡波', dept: '产品组' },
  { id: 'u14', name: '李明', dept: '产品组' },
];

const DEPTS: MockDept[] = [
  { name: '游戏投放中心', children: [
    { name: '快手投放组', userIds: ['u1','u2','u3'] },
    { name: '腾讯投放组', userIds: ['u4','u5'] },
    { name: '头条投放组', userIds: ['u6','u7'] },
  ]},
  { name: '数据中台', children: [
    { name: '数据分析组', userIds: ['u8','u9','u10'] },
    { name: 'BI组', userIds: ['u11','u12'] },
  ]},
  { name: '产品运营', children: [
    { name: '产品组', userIds: ['u13','u14'] },
  ]},
];

const AVATAR_COLORS = ['#1890ff','#52c41a','#fa8c16','#722ed1','#eb2f96','#13c2c2','#ff4d4f','#faad14'];

/* ── Color helpers ─────────────────────────────────────────── */
function hexToRgb(hex: string): [number, number, number] {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [0, 0, 0];
}
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}
function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  s /= 100; v /= 100;
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; } else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}
function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [Math.round(h * 360), max === 0 ? 0 : Math.round((d / max) * 100), Math.round(max * 100)];
}

/* ── Color Picker Panel ──────────────────────────────────── */
function ColorPickerPanel({ initHex, customColors, onSaveColor, onDeleteColor, onConfirm }: {
  initHex: string;
  customColors: string[];
  onSaveColor: (hex: string) => void;
  onDeleteColor: (index: number) => void;
  onConfirm: (hex: string) => void;
}) {
  const [ir, ig, ib] = hexToRgb(initHex);
  const [ih, is, iv] = rgbToHsv(ir, ig, ib);

  const [hue, setHue] = useState(ih);
  const [sat, setSat] = useState(is);
  const [val, setVal] = useState(iv);
  const [rStr, setRStr] = useState(String(ir));
  const [gStr, setGStr] = useState(String(ig));
  const [bStr, setBStr] = useState(String(ib));
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const svAreaRef = useRef<HTMLDivElement>(null);
  const hueBarRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<'sv' | 'hue' | null>(null);
  const stateRef = useRef({ hue, sat, val });
  stateRef.current = { hue, sat, val };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const cur = stateRef.current;
      if (dragRef.current === 'sv' && svAreaRef.current) {
        const rect = svAreaRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        const ns = Math.round(x * 100), nv = Math.round((1 - y) * 100);
        setSat(ns); setVal(nv);
        const [nr, ng, nb] = hsvToRgb(cur.hue, ns, nv);
        setRStr(String(nr)); setGStr(String(ng)); setBStr(String(nb));
      }
      if (dragRef.current === 'hue' && hueBarRef.current) {
        const rect = hueBarRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const nh = Math.round(x * 360);
        setHue(nh);
        const [nr, ng, nb] = hsvToRgb(nh, cur.sat, cur.val);
        setRStr(String(nr)); setGStr(String(ng)); setBStr(String(nb));
      }
    };
    const onUp = () => { dragRef.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  const [r, g, b] = hsvToRgb(hue, sat, val);
  const previewHex = rgbToHex(r, g, b);
  const hueColor = `hsl(${hue}, 100%, 50%)`;

  const loadHex = (hex: string) => {
    const [lr, lg, lb] = hexToRgb(hex);
    const [lh, ls, lv] = rgbToHsv(lr, lg, lb);
    setHue(lh); setSat(ls); setVal(lv);
    setRStr(String(lr)); setGStr(String(lg)); setBStr(String(lb));
  };

  const handleRgb = (ch: 0 | 1 | 2, v: string) => {
    if (ch === 0) setRStr(v); else if (ch === 1) setGStr(v); else setBStr(v);
    const vals = [
      ch === 0 ? parseInt(v) : parseInt(rStr),
      ch === 1 ? parseInt(v) : parseInt(gStr),
      ch === 2 ? parseInt(v) : parseInt(bStr),
    ];
    if (vals.every(x => !isNaN(x) && x >= 0 && x <= 255)) {
      const [nh, ns, nv] = rgbToHsv(vals[0], vals[1], vals[2]);
      setHue(nh); setSat(ns); setVal(nv);
    }
  };

  return (
    <div style={{ padding: '12px 16px 16px', width: 280, fontFamily: F, boxSizing: 'border-box' }}>
      {/* Title */}
      <div style={{ fontSize: 13, fontWeight: 500, color: '#333', marginBottom: 10 }}>选择自定义颜色</div>

      {/* SV gradient square */}
      <div
        ref={svAreaRef}
        onMouseDown={e => {
          dragRef.current = 'sv';
          const rect = e.currentTarget.getBoundingClientRect();
          const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
          const ns = Math.round(x * 100), nv = Math.round((1 - y) * 100);
          setSat(ns); setVal(nv);
          const [nr, ng, nb] = hsvToRgb(hue, ns, nv);
          setRStr(String(nr)); setGStr(String(ng)); setBStr(String(nb));
        }}
        style={{
          width: '100%', height: 160, borderRadius: 6, position: 'relative',
          cursor: 'crosshair', userSelect: 'none',
          background: `linear-gradient(to bottom, transparent, #000), linear-gradient(to right, #fff, ${hueColor})`,
        }}
      >
        <div style={{
          position: 'absolute', left: `${sat}%`, top: `${100 - val}%`,
          width: 14, height: 14, borderRadius: '50%',
          border: '2px solid #fff', boxShadow: '0 0 0 1px rgba(0,0,0,.4)',
          transform: 'translate(-50%, -50%)', pointerEvents: 'none',
        }} />
      </div>

      {/* Eyedropper + preview + hue slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" style={{ flexShrink: 0 }}>
          <path d="m2 22 1-1h3l9-9" /><path d="M3 21v-3l9-9" />
          <path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8-6 6a2.1 2.1 0 1 1-3-3l6-6Z" />
        </svg>
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: previewHex, border: '1px solid rgba(0,0,0,.12)', flexShrink: 0 }} />
        <div
          ref={hueBarRef}
          onMouseDown={e => {
            dragRef.current = 'hue';
            const rect = e.currentTarget.getBoundingClientRect();
            const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const nh = Math.round(x * 360);
            setHue(nh);
            const [nr, ng, nb] = hsvToRgb(nh, sat, val);
            setRStr(String(nr)); setGStr(String(ng)); setBStr(String(nb));
          }}
          style={{
            flex: 1, height: 12, borderRadius: 6, cursor: 'pointer',
            position: 'relative', userSelect: 'none',
            background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
          }}
        >
          <div style={{
            position: 'absolute', left: `${hue / 360 * 100}%`, top: '50%',
            transform: 'translate(-50%, -50%)', width: 16, height: 16, borderRadius: '50%',
            border: '2px solid #fff', boxShadow: '0 0 0 1px rgba(0,0,0,.3)',
            background: hueColor, pointerEvents: 'none',
          }} />
        </div>
      </div>

      {/* RGB inputs */}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        {(['R', 'G', 'B'] as const).map((label, i) => (
          <div key={label} style={{ flex: 1, textAlign: 'center' }}>
            <input
              value={[rStr, gStr, bStr][i]}
              onChange={e => handleRgb(i as 0 | 1 | 2, e.target.value)}
              style={{
                width: '100%', padding: '5px 2px', textAlign: 'center',
                border: '1px solid #e0e0e0', borderRadius: 4, fontSize: 13,
                outline: 'none', boxSizing: 'border-box',
              }}
            />
            <div style={{ fontSize: 11, color: '#999', marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Save row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
        <span
          onClick={() => { if (customColors.length < 20 && !customColors.includes(previewHex)) onSaveColor(previewHex); }}
          style={{
            fontSize: 13, color: customColors.length >= 20 ? '#bbb' : '#1890ff',
            cursor: customColors.length >= 20 ? 'default' : 'pointer', userSelect: 'none',
          }}
        >
          +保存自定义颜色
        </span>
        <span style={{ fontSize: 12, color: '#999' }}>{customColors.length}/20</span>
      </div>

      {/* Saved colors grid */}
      {customColors.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {customColors.map((hex, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => loadHex(hex)}
              style={{ position: 'relative', width: 24, height: 24, cursor: 'pointer', flexShrink: 0 }}
            >
              <div style={{
                width: 24, height: 24, borderRadius: '50%', background: hex,
                border: previewHex === hex ? '2px solid #1890ff' : '1px solid rgba(0,0,0,.1)',
                boxSizing: 'border-box',
              }} />
              {hoveredIdx === i && (
                <div
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); onDeleteColor(i); if (hoveredIdx === i) setHoveredIdx(null); }}
                  style={{
                    position: 'absolute', top: -4, right: -4,
                    width: 14, height: 14, borderRadius: '50%',
                    background: '#ff4d4f', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', fontSize: 11, lineHeight: 1, fontWeight: 700,
                    zIndex: 1,
                  }}
                >
                  ×
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Confirm button */}
      <button
        onClick={() => onConfirm(previewHex)}
        style={{
          width: '100%', padding: '8px 0', marginTop: 14,
          border: 'none', borderRadius: 6, background: '#1890ff',
          color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: F,
        }}
      >
        确认
      </button>
    </div>
  );
}

/* ── Props ────────────────────────────────────────────────── */
interface Props {
  tags: QuickTag[];
  onSave: (tags: QuickTag[]) => void;
  onClose: () => void;
}

/* ──────────────────────────────────────────────────────────── */
export function QuickTagModal({ tags: initialTags, onSave, onClose }: Props) {
  const [tags, setTags] = useState<QuickTag[]>(initialTags);
  const [tab, setTab] = useState<'all'|'mine'|'shared'>('all');
  const [search, setSearch] = useState('');
  const [visFilter, setVisFilter] = useState<ShareVis|null>(null);
  const [selId, setSelId] = useState<string|null>(null);
  const [toast, setToast] = useState('');
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncSelectedIds, setSyncSelectedIds] = useState<Set<string>>(new Set());

  // Form state
  const [fName, setFName] = useState('');
  const [fColor, setFColor] = useState('#1890ff');
  const [fMainCh, setFMainCh] = useState<string[]>([]);
  const [fSubCh, setFSubCh] = useState<string[]>([]);
  const [fVis, setFVis] = useState<ShareVis>('private');
  const [fAuth, setFAuth] = useState<string[]>([]);
  const [isNew, setIsNew] = useState(false);
  const [nameErr, setNameErr] = useState('');

  // Dropdown
  const [showMainDD, setShowMainDD] = useState(false);
  const [mcGame, setMcGame] = useState<string|null>(GAME_CHANNEL_DATA[0]?.name ?? null);
  const [mcMedia, setMcMedia] = useState<string|null>(GAME_CHANNEL_DATA[0]?.media[0]?.name ?? null);
  const [mcChSearch, setMcChSearch] = useState('');
  const [mainDropPos, setMainDropPos] = useState<{ left: number; top: number; width: number } | null>(null);
  const mainInputRef = useRef<HTMLDivElement>(null);
  const mainDropRef  = useRef<HTMLDivElement>(null);

  // Sub channel
  const [subInput, setSubInput] = useState('');
  const [showBatch, setShowBatch] = useState(false);
  const [batchText, setBatchText] = useState('');

  // Member modal
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [mmAuth, setMmAuth] = useState<string[]>([]);
  const [mmDeptOpen, setMmDeptOpen] = useState(false);
  const [mmExpandedDepts, setMmExpandedDepts] = useState<Set<string>>(new Set());

  // Drag
  const [dragId, setDragId] = useState<string|null>(null);

  // Custom colors
  const [customColors, setCustomColors] = useState<string[]>([]);
  const [showCustomPop, setShowCustomPop] = useState(false);
  const [customPopPos, setCustomPopPos] = useState<{ left: number; top: number } | null>(null);
  const customBtnRef = useRef<HTMLDivElement>(null);
  const customPopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showCustomPop) return;
    const handleDown = (e: MouseEvent) => {
      if (
        customPopRef.current && !customPopRef.current.contains(e.target as Node) &&
        customBtnRef.current && !customBtnRef.current.contains(e.target as Node)
      ) {
        setShowCustomPop(false);
      }
    };
    document.addEventListener('mousedown', handleDown);
    return () => document.removeEventListener('mousedown', handleDown);
  }, [showCustomPop]);

  useEffect(() => {
    if (!showMainDD) return;
    const onDown = (e: MouseEvent) => {
      if (
        mainDropRef.current && !mainDropRef.current.contains(e.target as Node) &&
        mainInputRef.current && !mainInputRef.current.contains(e.target as Node)
      ) setShowMainDD(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [showMainDD]);

  /* ── Filtered list ──────────────────────────────────────── */
  const getFilteredTags = () => {
    let items = tags;
    if (tab === 'mine') items = items.filter(t => t.owner === ME);
    else if (tab === 'shared') items = items.filter(t => t.owner !== ME);
    if (tab === 'mine' && visFilter) items = items.filter(t => t.vis === visFilter);
    if (search) items = items.filter(t => t.label.toLowerCase().includes(search.toLowerCase()));
    return items;
  };

  /* ── Select / View tag ──────────────────────────────────── */
  const selectTag = (id: string) => {
    const t = tags.find(x => x.id === id);
    if (!t) return;
    setSelId(id); setIsNew(false);
    setFName(t.label); setFColor(t.color);
    setFMainCh([...t.mainChannels]); setFSubCh([...t.subChannels]);
    setFVis(t.vis); setFAuth([...t.authUsers]);
    setNameErr(''); setShowMainDD(false);
  };

  const isMine = (t: QuickTag) => t.owner === ME;
  const selectedTag = selId ? tags.find(t => t.id === selId) : null;
  const isReadonly = selectedTag ? !isMine(selectedTag) : false;
  const canSyncToOthers = !!selectedTag && !isNew && !isReadonly;
  const myTags = React.useMemo(
    () => tags.filter(t => isMine(t)),
    [tags],
  );
  const syncTargetTags = React.useMemo(
    () => myTags.filter(t => t.id !== selId),
    [myTags, selId],
  );
  const formatUpdateTime = (value?: string) => {
    if (!value) return '--';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '--';
    const p2 = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`;
  };

  /* ── New tag ────────────────────────────────────────────── */
  const newTag = () => {
    setSelId(null); setIsNew(true);
    setFName(''); setFColor('#1890ff');
    setFMainCh([]); setFSubCh([]);
    setFVis('private'); setFAuth([]);
    setNameErr(''); setShowMainDD(false);
  };

  /* ── Save ────────────────────────────────────────────────── */
  const saveTag = () => {
    if (!fName.trim()) { setNameErr('请输入标签名称'); return; }
    setNameErr('');
    if (selId && !isNew) {
      setTags(prev => prev.map(t => t.id === selId ? {
        ...t, label: fName.trim(), color: fColor,
        mainChannels: [...fMainCh], subChannels: [...fSubCh],
        vis: fVis, authUsers: [...fAuth], updatedAt: new Date().toISOString(),
      } : t));
    } else {
      const newId = `t_${Date.now()}`;
      setTags(prev => [...prev, {
        id: newId, label: fName.trim(), color: fColor, active: false,
        owner: ME, mainChannels: [...fMainCh], subChannels: [...fSubCh],
        vis: fVis, authUsers: [...fAuth], updatedAt: new Date().toISOString(),
      }]);
      setSelId(newId); setIsNew(false);
    }
    showToast('保存成功');
  };

  const openSyncModal = () => {
    setSyncSelectedIds(new Set());
    setShowSyncModal(true);
  };
  const confirmSyncToOthers = () => {
    if (!canSyncToOthers) { setShowSyncModal(false); return; }
    const ids = Array.from(syncSelectedIds);
    if (ids.length === 0) { setShowSyncModal(false); return; }

    const nowIso = new Date().toISOString();
    const srcMain = [...fMainCh];
    const srcSub = [...fSubCh];
    const srcColor = fColor;
    const srcVis = fVis;
    const srcAuth = [...fAuth];

    setTags(prev => prev.map(t => {
      if (!ids.includes(t.id)) return t;
      const mainSet = new Set([...(t.mainChannels || []), ...srcMain]);
      const subSet = new Set([...(t.subChannels || []), ...srcSub]);
      return {
        ...t,
        color: srcColor,
        vis: srcVis,
        authUsers: srcAuth,
        mainChannels: Array.from(mainSet),
        subChannels: Array.from(subSet),
        updatedAt: nowIso,
      };
    }));
    setShowSyncModal(false);
    showToast(`成功更新 ${ids.length} 个标签`);
  };

  const deleteTag = () => {
    if (!selId) return;
    setTags(prev => prev.filter(t => t.id !== selId));
    setSelId(null); setIsNew(false);
    showToast('标签已删除');
  };

  /* ── Toast ───────────────────────────────────────────────── */
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  /* ── Drag reorder ────────────────────────────────────────── */
  const handleDragStart = (id: string) => setDragId(id);
  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    setTags(prev => {
      const arr = [...prev];
      const fi = arr.findIndex(t => t.id === dragId);
      const ti = arr.findIndex(t => t.id === targetId);
      if (fi < 0 || ti < 0) return prev;
      const [moved] = arr.splice(fi, 1);
      arr.splice(ti, 0, moved);
      return arr;
    });
    setDragId(null);
  };

  /* ── Color picker helpers ────────────────────────────────── */

  /* ── Main channel cascade ────────────────────────────────── */
  const openMainDD = () => {
    if (mainInputRef.current) {
      const r = mainInputRef.current.getBoundingClientRect();
      setMainDropPos({ left: r.left, top: r.bottom + 4, width: Math.max(r.width, 480) });
    }
    setMcChSearch('');
    setShowMainDD(true);
  };
  const toggleMainCh = (path: string) => {
    setFMainCh(prev => prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]);
  };

  /* ── Sub channel ─────────────────────────────────────────── */
  const addSubFromInput = () => {
    const vals = subInput.split(/[,，\n]/).map(s => s.trim()).filter(Boolean);
    setFSubCh(prev => { const next = [...prev]; vals.forEach(v => { if (!next.includes(v)) next.push(v); }); return next; });
    setSubInput('');
  };
  const confirmBatch = () => {
    const vals = batchText.split('\n').map(s => s.trim()).filter(Boolean);
    setFSubCh(prev => { const next = [...prev]; vals.forEach(v => { if (!next.includes(v)) next.push(v); }); return next; });
    setShowBatch(false); setBatchText('');
  };

  /* ── Member modal ────────────────────────────────────────── */
  const openMemberModal = () => { setMmAuth([...fAuth]); setMmDeptOpen(false); setMmExpandedDepts(new Set()); setShowMemberModal(true); };
  const confirmMembers = () => { setFAuth([...mmAuth]); setShowMemberModal(false); };
  const mmAddDeptUsers = (userIds: string[]) => {
    setMmAuth(prev => { const s = new Set(prev); userIds.forEach(id => { const u = USERS.find(x=>x.id===id); if(u) s.add(u.name); }); return Array.from(s); });
  };

  /* ── Sync tags to parent when changed ────────────────────── */
  React.useEffect(() => { onSave(tags); }, [tags]);

  const filteredTags = getFilteredTags();

  /* ──────────────────────────────────────────────────────── */
  return ReactDOM.createPortal(
    <div
      style={{ position:'fixed',inset:0,zIndex:99999,background:'rgba(0,0,0,0.35)',display:'flex',alignItems:'center',justifyContent:'center' }}
      onMouseDown={e => { if(e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width:840, height:'min(90vh, 780px)', background:'#fff', borderRadius:12,
        boxShadow:'0 8px 32px rgba(0,0,0,0.18)', fontFamily:F,
        display:'flex', flexDirection:'column', overflow:'hidden',
      }}>
        {/* ══ HEADER ══ */}
        <div style={{ display:'flex', alignItems:'center', padding:'12px 20px', borderBottom:'1px solid #f0f0f0', flexShrink:0, gap:12 }}>
          <span style={{ fontSize:15, fontWeight:600 }}>快捷标签管理</span>
          <button onClick={newTag} style={{ display:'inline-flex',alignItems:'center',gap:5,padding:'5px 14px',borderRadius:16,background:'#1890ff',color:'#fff',border:'none',fontSize:13,cursor:'pointer' }}>
            <Plus size={14} /> 新增标签
          </button>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:16 }}>
            {!isNew && (
              <span style={{ fontSize:12, color:'#999', whiteSpace:'nowrap' }}>
                最后更新时间：{formatUpdateTime(selectedTag?.updatedAt)}
              </span>
            )}
            <div style={{ cursor:'pointer', lineHeight:0 }} onClick={onClose}><X size={16} color="#999" /></div>
          </div>
        </div>

        {/* ══ BODY ══ */}
        <div style={{ flex:1, display:'flex', minHeight:0 }}>

          {/* ── LEFT: tag list ── */}
          <div style={{ width:260, borderRight:'1px solid #f0f0f0', display:'flex', flexDirection:'column', flexShrink:0 }}>
            {/* Tabs */}
            <div style={{ display:'flex', padding:'0 16px', borderBottom:'1px solid #f0f0f0', flexShrink:0 }}>
              {(['all','mine','shared'] as const).map(t => (
                <div key={t} onClick={() => { setTab(t); setVisFilter(null); }} style={{
                  padding:'10px 14px', fontSize:13, cursor:'pointer', borderBottom:`2px solid ${tab===t?'#1890ff':'transparent'}`,
                  color: tab===t?'#1890ff':'#666', fontWeight: tab===t?500:400, transition:'all .15s',
                }}>
                  {t==='all'?'所有':t==='mine'?'我的':'共享'}
                </div>
              ))}
            </div>

            {/* Search */}
            <div style={{ padding:'8px 12px', flexShrink:0 }}>
              <div style={{ display:'flex',alignItems:'center',gap:6,border:'1px solid #e0e0e0',borderRadius:6,padding:'6px 10px' }}>
                <Search size={14} color="#bbb" />
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="搜索标签名称"
                  style={{ flex:1,border:'none',outline:'none',fontSize:13,background:'transparent' }} />
              </div>
            </div>

            {/* Vis filter (mine tab only) */}
            {tab === 'mine' && (
              <div style={{ display:'flex', gap:6, padding:'0 12px 6px', flexShrink:0 }}>
                {([['private','🔒','私有'],['partial','👥','指定用户'],['public','🌐','公开']] as [ShareVis,string,string][]).map(([k,icon,label]) => (
                  <div key={k} onClick={() => setVisFilter(visFilter===k?null:k)} style={{
                    display:'inline-flex',alignItems:'center',gap:3,padding:'3px 10px',borderRadius:14,fontSize:11,cursor:'pointer',
                    border:`1px solid ${visFilter===k?'#1890ff':'#e0e0e0'}`,
                    background:visFilter===k?'#e6f7ff':'#fff',color:visFilter===k?'#1890ff':'#999',transition:'all .15s',
                  }}>
                    {icon} {label}
                  </div>
                ))}
              </div>
            )}

            {/* Tag list */}
            <div style={{ flex:1, overflowY:'auto', padding:'0 8px 8px' }}>
              {filteredTags.length === 0 && <div style={{ textAlign:'center',color:'#bbb',fontSize:13,padding:'40px 0' }}>暂无标签</div>}
              {filteredTags.map(t => {
                const act = t.id === selId;
                const mine = isMine(t);
                return (
                  <div key={t.id}
                    onClick={() => selectTag(t.id)}
                    draggable onDragStart={() => handleDragStart(t.id)} onDragOver={e => e.preventDefault()} onDrop={() => handleDrop(t.id)}
                    style={{
                      display:'flex',alignItems:'center',padding:'8px 8px',borderRadius:6,cursor:'pointer',
                      gap:8,background:act?'#e6f7ff':'transparent',transition:'background .12s',
                    }}
                    onMouseEnter={e => { if(!act)(e.currentTarget as HTMLDivElement).style.background='#f5f5f5'; }}
                    onMouseLeave={e => { if(!act)(e.currentTarget as HTMLDivElement).style.background='transparent'; }}
                  >
                    <GripVertical size={14} color="#ddd" style={{ flexShrink:0, opacity: act?1:0, transition:'opacity .12s' }}
                      onMouseEnter={e => (e.currentTarget as SVGElement).style.opacity='1'}
                      onMouseLeave={e => { if(!act)(e.currentTarget as SVGElement).style.opacity='0'; }}
                    />
                    <div style={{ width:9,height:9,borderRadius:'50%',background:getColorHex(t.color),flexShrink:0 }} />
                    <span style={{ fontSize:13, color:act?'#1890ff':'#333', fontWeight:act?500:400, overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{t.label}</span>
                    <span style={{ fontSize:12, color:'#999', flexShrink:0, marginLeft:4 }}>{t.owner}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── RIGHT: form ── */}
          <div style={{ flex:1, overflowY:'auto', padding:'12px 24px' }}>
            {!selId && !isNew ? (
              <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',color:'#bbb',gap:8 }}>
                <span style={{ fontSize:36,opacity:.25 }}>🏷️</span>
                <span style={{ fontSize:13 }}>选择左侧标签查看详情，或点击新增标签</span>
              </div>
            ) : (
              <div style={{ pointerEvents: isReadonly ? 'none' : 'auto', opacity: isReadonly ? 0.85 : 1 }}>
                {/* Name */}
                <div style={{ marginBottom:12 }}>
                  <label style={{ fontSize:13,color:'#333',fontWeight:500,marginBottom:4,display:'block' }}>标签名称</label>
                  <input value={fName} onChange={e => { setFName(e.target.value); setNameErr(''); }}
                    placeholder="输入标签名称" disabled={isReadonly}
                    style={{ width:'100%',padding:'6px 10px',border:`1px solid ${nameErr?'#ff4d4f':'#e0e0e0'}`,borderRadius:6,fontSize:13,outline:'none',background:isReadonly?'#fafafa':'#fff' }} />
                  {nameErr && <div style={{ fontSize:11,color:'#ff4d4f',marginTop:3 }}>{nameErr}</div>}
                </div>

                {/* Color */}
                <div style={{ marginBottom:12 }}>
                  <label style={{ fontSize:13,color:'#333',fontWeight:500,marginBottom:4,display:'block' }}>标签颜色</label>
                  <div style={{ display:'flex',gap:8,alignItems:'center',flexWrap:'nowrap' }}>
                    {TAG_COLOR_OPTIONS.map(c => {
                      const hex = c.hex;
                      const active = fColor === c.key || fColor === hex;
                      return (
                        <div key={c.key} onClick={() => !isReadonly && setFColor(c.key)}
                          style={{ width:24,height:24,borderRadius:'50%',background:hex,cursor:'pointer',position:'relative',
                            boxShadow: active ? `0 0 0 2.5px #fff, 0 0 0 4px #555` : 'none', transition:'all .12s' }}>
                          {active && <Check size={12} color="#fff" style={{ position:'absolute',top:6,left:6 }} />}
                        </div>
                      );
                    })}
                    {/* Custom palette button — rainbow gradient circle */}
                    <div
                      ref={customBtnRef}
                      onClick={() => {
                        if (isReadonly) return;
                        if (!showCustomPop && customBtnRef.current) {
                          const rect = customBtnRef.current.getBoundingClientRect();
                          setCustomPopPos({ left: rect.left, top: rect.bottom + 6 });
                        }
                        setShowCustomPop(v => !v);
                      }}
                      title="自定义颜色"
                      style={{
                        width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                        cursor: isReadonly ? 'default' : 'pointer',
                        background: 'conic-gradient(#f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
                        outline: showCustomPop ? '2px solid #1890ff' : '2px solid transparent',
                        outlineOffset: 1, boxSizing: 'border-box',
                      }}
                    />
                    {/* Show active custom color swatch */}
                    {!TAG_COLOR_OPTIONS.some(c => c.key === fColor || c.hex === fColor) && (
                      <div style={{ width:24,height:24,borderRadius:'50%',background:fColor,boxShadow:`0 0 0 2.5px #fff, 0 0 0 4px #555`,position:'relative',flexShrink:0 }}>
                        <Check size={12} color="#fff" style={{ position:'absolute',top:6,left:6 }} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Main Channel — 3-column cascade */}
                <div style={{ marginBottom:12 }}>
                  <label style={{ fontSize:13,color:'#333',fontWeight:500,marginBottom:4,display:'block' }}>主渠道</label>
                  <div
                    ref={mainInputRef}
                    onClick={() => { if (!isReadonly) showMainDD ? setShowMainDD(false) : openMainDD(); }}
                    style={{
                      width:'100%', padding:'6px 10px', border:`1px solid ${showMainDD?'#1890ff':'#e0e0e0'}`,
                      borderRadius:6, fontSize:13, background:isReadonly?'#fafafa':'#fff',
                      cursor:isReadonly?'default':'pointer', color: fMainCh.length?'#333':'#bbb',
                      userSelect:'none', boxSizing:'border-box',
                    }}
                  >
                    {fMainCh.length > 0
                      ? `已选 ${fMainCh.length} 个主渠道`
                      : '搜索并选择主渠道（多选）'}
                  </div>
                  {fMainCh.length > 0 && (
                    <div style={{ display:'flex',flexWrap:'wrap',gap:6,marginTop:8 }}>
                      {fMainCh.map(c => (
                        <span key={c} title={c} style={{ display:'inline-flex',alignItems:'center',gap:4,padding:'3px 8px 3px 10px',background:'#fafafa',border:'1px solid #f0f0f0',borderRadius:4,fontSize:12,color:'#666' }}>
                          {c.split('-').pop()}
                          {!isReadonly && <X size={12} color="#bbb" style={{ cursor:'pointer' }} onClick={() => setFMainCh(prev => prev.filter(x=>x!==c))} />}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sub Channel */}
                <div style={{ marginBottom:12 }}>
                  <label style={{ fontSize:13,color:'#333',fontWeight:500,marginBottom:4,display:'block' }}>子渠道</label>
                  {!isReadonly && (
                    <>
                      <div style={{ display:'flex',gap:8,alignItems:'center' }}>
                        <input value={subInput} onChange={e => setSubInput(e.target.value)}
                          onKeyDown={e => { if(e.key==='Enter'){e.preventDefault();addSubFromInput();} }}
                          placeholder="输入子渠道标识，回车添加"
                          style={{ flex:1,padding:'6px 10px',border:'1px solid #e0e0e0',borderRadius:6,fontSize:13,outline:'none' }} />
                        <button onClick={() => setShowBatch(true)} style={{ padding:'5px 12px',borderRadius:6,fontSize:12,background:'#fff',color:'#666',border:'1px solid #e0e0e0',cursor:'pointer',whiteSpace:'nowrap' }}>
                          批量添加
                        </button>
                      </div>
                      <div style={{ fontSize:11,color:'#999',marginTop:4 }}>按回车逐个添加，或点击「批量添加」粘贴多行</div>
                    </>
                  )}
                  {fSubCh.length > 0 && (
                    <>
                      <div style={{ border:'1px solid #e0e0e0',borderRadius:8,marginTop:8,maxHeight:150,overflow:'auto' }}>
                        <div style={{ display:'flex',alignItems:'center',padding:'5px 14px',background:'#fafafa',borderBottom:'1px solid #f0f0f0',fontSize:11,color:'#999',position:'sticky',top:0,zIndex:1 }}>
                          <span style={{ width:32 }}>#</span>
                          <span style={{ flex:1 }}>子渠道标识</span>
                          {!isReadonly && <span style={{ width:40,textAlign:'center' }}>操作</span>}
                        </div>
                        {fSubCh.map((c,i) => (
                          <div key={i} style={{ display:'flex',alignItems:'center',padding:'7px 14px',borderBottom:i<fSubCh.length-1?'1px solid #f0f0f0':'none',fontSize:13 }}>
                            <span style={{ width:32,color:'#999',fontSize:12 }}>{i+1}</span>
                            <span style={{ flex:1,fontFamily:'monospace',fontSize:12 }}>{c}</span>
                            {!isReadonly && (
                              <span style={{ width:40,textAlign:'center' }}>
                                <X size={14} color="#ddd" style={{ cursor:'pointer' }}
                                  onClick={() => setFSubCh(prev => prev.filter((_,idx)=>idx!==i))}
                                  onMouseEnter={e => (e.currentTarget as SVGElement).setAttribute('color','#ff4d4f')}
                                  onMouseLeave={e => (e.currentTarget as SVGElement).setAttribute('color','#ddd')}
                                />
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize:11,color:'#999',marginTop:4 }}>共 {fSubCh.length} 个子渠道</div>
                    </>
                  )}
                </div>

                {/* Share settings */}
                <div style={{ marginBottom:12 }}>
                  <label style={{ fontSize:13,color:'#333',fontWeight:500,marginBottom:4,display:'block' }}>共享设置</label>
                  <div style={{ display:'flex',border:'1px solid #e0e0e0',borderRadius:8,overflow:'hidden' }}>
                    {([['private','🔒','私有'],['partial','👥','指定用户'],['public','🌐','公开']] as [ShareVis,string,string][]).map(([k,icon,label]) => (
                      <div key={k} onClick={() => { if(!isReadonly){setFVis(k); if(k==='partial')openMemberModal();} }}
                        style={{
                          flex:1,padding:'7px 6px',textAlign:'center',cursor:isReadonly?'default':'pointer',
                          background:fVis===k?'#e6f7ff':'#fff',borderRight:'1px solid #e0e0e0',
                          position:'relative',display:'flex',alignItems:'center',justifyContent:'center',gap:5,transition:'all .15s',
                        }}>
                        {fVis===k && <div style={{ position:'absolute',inset:-1,border:'2px solid #1890ff',borderRadius:8,pointerEvents:'none' }} />}
                        <span style={{ fontSize:14 }}>{icon}</span>
                        <span style={{ fontSize:12,fontWeight:500,color:fVis===k?'#1890ff':'#333' }}>{label}</span>
                      </div>
                    ))}
                  </div>
                  {fVis === 'partial' && (
                    <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 12px',border:'1px solid #e0e0e0',borderRadius:6,background:'#fafafa',marginTop:6 }}>
                      <span style={{ fontSize:13,color:'#333' }}>已授权 <strong>{fAuth.length}</strong> 人</span>
                      {!isReadonly && (
                        <span onClick={openMemberModal} style={{ fontSize:13,color:'#1890ff',cursor:'pointer' }}>管理成员 →</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {isReadonly ? (
                  <div style={{ padding:'14px 16px',background:'#fff7e6',border:'1px solid #ffe58f',borderRadius:6,fontSize:13,color:'#ad6800',textAlign:'center',marginTop:16 }}>
                    共享标签，如要修订请联系标签作者 {selectedTag?.owner}
                  </div>
                ) : (
                  <div style={{ display:'flex',alignItems:'center',marginTop:14,paddingTop:10,borderTop:'1px solid #f0f0f0' }}>
                    {selId && !isNew && (
                      <button onClick={deleteTag} style={{ padding:'6px 16px',borderRadius:6,border:'1px solid #e0e0e0',background:'#fff',color:'#ff4d4f',fontSize:13,cursor:'pointer' }}>
                        删除此标签
                      </button>
                    )}
                    <div style={{ flex:1,display:'flex',justifyContent:'center' }}>
                      <button onClick={saveTag} style={{ padding:'6px 20px',borderRadius:6,border:'none',background:'#1890ff',color:'#fff',fontSize:13,cursor:'pointer' }}>
                        保存当前标签配置
                      </button>
                    </div>
                    {canSyncToOthers ? (
                      <button
                        onClick={openSyncModal}
                        style={{
                          padding:'6px 16px',
                          borderRadius:6,
                          border:'1px solid #e0e0e0',
                          background:'#fff',
                          color:'#ff4d4f',
                          fontSize:13,
                          cursor:'pointer',
                          whiteSpace:'nowrap',
                        }}
                      >
                        同步追加至其他标签
                      </button>
                    ) : (
                      <div style={{ width:140 }} />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ TOAST ══ */}
      {toast && (
        <div style={{ position:'fixed',top:24,left:'50%',transform:'translateX(-50%)',background:'#333',color:'#fff',padding:'8px 24px',borderRadius:20,fontSize:13,zIndex:100001 }}>
          {toast}
        </div>
      )}

      {/* ══ BATCH MODAL ══ */}
      {showBatch && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.25)',zIndex:100000,display:'flex',alignItems:'center',justifyContent:'center' }}
          onMouseDown={e => { if(e.target===e.currentTarget)setShowBatch(false); }}>
          <div style={{ width:400,background:'#fff',borderRadius:12,boxShadow:'0 8px 32px rgba(0,0,0,.15)' }}>
            <div style={{ padding:'14px 20px',borderBottom:'1px solid #f0f0f0',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <span style={{ fontSize:15,fontWeight:600 }}>批量添加子渠道</span>
              <X size={14} color="#999" style={{ cursor:'pointer' }} onClick={() => setShowBatch(false)} />
            </div>
            <div style={{ padding:'16px 20px' }}>
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:12,color:'#999',marginBottom:8 }}>
                <span>每行一个子渠道标识</span>
                <label style={{ display:'inline-flex',alignItems:'center',gap:4,fontSize:12,color:'#1890ff',cursor:'pointer',padding:'4px 10px',border:'1px solid #e0e0e0',borderRadius:6 }}>
                  <Upload size={14} /> 上传Excel
                  <input type="file" accept=".xlsx,.xls,.csv" style={{ display:'none' }} onChange={e => {
                    const file = e.target.files?.[0]; if(!file) return;
                    const reader = new FileReader();
                    reader.onload = ev => { setBatchText((ev.target?.result as string) || ''); };
                    reader.readAsText(file);
                  }} />
                </label>
              </div>
              <textarea value={batchText} onChange={e => setBatchText(e.target.value)}
                style={{ width:'100%',height:140,padding:10,border:'1px solid #e0e0e0',borderRadius:6,fontSize:13,fontFamily:'inherit',resize:'vertical',outline:'none' }}
                placeholder={'渠道A\n渠道B\n渠道C'} />
            </div>
            <div style={{ padding:'12px 20px',borderTop:'1px solid #f0f0f0',display:'flex',justifyContent:'flex-end',gap:8 }}>
              <button onClick={() => setShowBatch(false)} style={{ padding:'6px 20px',border:'1px solid #e0e0e0',borderRadius:6,background:'#fff',fontSize:13,cursor:'pointer' }}>取消</button>
              <button onClick={confirmBatch} style={{ padding:'6px 20px',border:'none',borderRadius:6,background:'#1890ff',color:'#fff',fontSize:13,cursor:'pointer' }}>确定</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MEMBER MODAL ══ */}
      {showMemberModal && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.25)',zIndex:100000,display:'flex',alignItems:'center',justifyContent:'center' }}
          onMouseDown={e => { if(e.target===e.currentTarget)setShowMemberModal(false); }}>
          <div style={{ width:520,maxHeight:'90vh',background:'#fff',borderRadius:12,boxShadow:'0 8px 32px rgba(0,0,0,.15)',display:'flex',flexDirection:'column',overflow:'hidden' }}>
            <div style={{ padding:'16px 20px',borderBottom:'1px solid #f0f0f0',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0 }}>
              <div><span style={{ fontSize:15,fontWeight:600 }}>共享标签</span><span style={{ fontSize:13,color:'#999',marginLeft:8 }}>「{fName||'新标签'}」</span></div>
              <X size={14} color="#999" style={{ cursor:'pointer' }} onClick={() => setShowMemberModal(false)} />
            </div>
            <div style={{ flex:1,overflowY:'auto',padding:'20px 24px',minHeight:400 }}>
              <div style={{ fontSize:13,color:'#333',fontWeight:500,marginBottom:10 }}>添加成员</div>
              <div style={{ display:'flex',alignItems:'center',gap:6,border:'1px solid #e0e0e0',borderRadius:6,padding:'6px 10px',marginBottom:8 }}>
                <Search size={14} color="#bbb" />
                <input placeholder="搜索姓名或账号…" style={{ flex:1,border:'none',outline:'none',fontSize:13,background:'transparent' }}
                  onKeyDown={e => {
                    if(e.key==='Enter'){
                      const q = (e.target as HTMLInputElement).value.toLowerCase();
                      const m = USERS.find(u => u.name.toLowerCase().includes(q) && !mmAuth.includes(u.name));
                      if(m) setMmAuth(prev => [...prev, m.name]);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }} />
              </div>

              {/* Dept tree */}
              <div onClick={() => setMmDeptOpen(!mmDeptOpen)} style={{ color:'#1890ff',fontSize:13,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:4,margin:'8px 0 6px',userSelect:'none' }}>
                {mmDeptOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />} 按部门添加
              </div>
              {mmDeptOpen && (
                <div style={{ border:'1px solid #e0e0e0',borderRadius:8,overflow:'hidden',marginTop:4 }}>
                  {DEPTS.map((dept,di) => {
                    const totalCount = dept.children.reduce((s,c) => s+c.userIds.length, 0);
                    const expanded = mmExpandedDepts.has(dept.name);
                    return (
                      <div key={di}>
                        <div onClick={() => setMmExpandedDepts(prev => { const s=new Set(prev); if(s.has(dept.name))s.delete(dept.name);else s.add(dept.name); return s; })}
                          style={{ display:'flex',alignItems:'center',padding:'10px 14px',borderBottom:'1px solid #f0f0f0',cursor:'pointer',gap:6 }}>
                          {expanded ? <ChevronDown size={12} color="#999" /> : <ChevronRight size={12} color="#999" />}
                          <span style={{ flex:1,fontSize:13,fontWeight:500,color:'#333' }}>{dept.name}</span>
                          <span style={{ fontSize:12,color:'#999' }}>（{totalCount}人）</span>
                          <span onClick={e => { e.stopPropagation(); mmAddDeptUsers(dept.children.flatMap(c=>c.userIds)); }}
                            style={{ fontSize:12,color:'#1890ff',cursor:'pointer',marginLeft:8 }}>全部添加</span>
                        </div>
                        {expanded && dept.children.map((child,ci) => (
                          <div key={ci} style={{ display:'flex',alignItems:'center',padding:'8px 14px 8px 34px',borderBottom:'1px solid #f0f0f0',fontSize:13,color:'#666',gap:6 }}>
                            <span>{child.name}</span>
                            <span style={{ fontSize:12,color:'#999' }}>（{child.userIds.length}人）</span>
                            <span onClick={() => mmAddDeptUsers(child.userIds)}
                              style={{ fontSize:12,color:'#1890ff',cursor:'pointer',marginLeft:'auto' }}>全部添加</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Auth list */}
              {mmAuth.length > 0 && (
                <div style={{ marginTop:16 }}>
                  <div style={{ fontSize:14,color:'#333',marginBottom:8 }}>已授权成员 <span style={{ color:'#999',fontSize:13 }}>{mmAuth.length}人</span></div>
                  <div style={{ border:'1px solid #e0e0e0',borderRadius:8,overflow:'hidden' }}>
                    {mmAuth.map((name,i) => {
                      const u = USERS.find(x=>x.name===name);
                      return (
                        <div key={i} style={{ display:'flex',alignItems:'center',padding:'10px 14px',borderBottom:i<mmAuth.length-1?'1px solid #f0f0f0':'none',gap:12 }}>
                          <div style={{ width:34,height:34,borderRadius:'50%',background:AVATAR_COLORS[i%AVATAR_COLORS.length],display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:500,fontSize:14,flexShrink:0 }}>
                            {name[0]}
                          </div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:14,fontWeight:500,color:'#333' }}>{name}</div>
                            <div style={{ fontSize:12,color:'#999',marginTop:1 }}>{u?.dept||''}</div>
                          </div>
                          <span style={{ fontSize:13,color:'#999' }}>可查看</span>
                          <span onClick={() => setMmAuth(prev => prev.filter(n=>n!==name))}
                            style={{ fontSize:13,color:'#ff4d4f',cursor:'pointer',padding:'4px 8px',borderRadius:6 }}>撤销</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div style={{ padding:'12px 20px',borderTop:'1px solid #f0f0f0',display:'flex',justifyContent:'flex-end',gap:8,flexShrink:0 }}>
              <button onClick={() => setShowMemberModal(false)} style={{ padding:'6px 20px',border:'1px solid #e0e0e0',borderRadius:6,background:'#fff',fontSize:13,cursor:'pointer' }}>取消</button>
              <button onClick={confirmMembers} style={{ padding:'6px 20px',border:'none',borderRadius:6,background:'#1890ff',color:'#fff',fontSize:13,cursor:'pointer' }}>确认</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ SYNC MODAL ══ */}
      {showSyncModal && (
        <div
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.25)', zIndex:100000, display:'flex', alignItems:'center', justifyContent:'center' }}
          onMouseDown={e => { if (e.target === e.currentTarget) setShowSyncModal(false); }}
        >
          <div style={{ width:520, maxHeight:'90vh', background:'#fff', borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,.15)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid #f0f0f0', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
              <div>
                <span style={{ fontSize:15, fontWeight:600 }}>同步追加至其他标签</span>
                <span style={{ fontSize:13, color:'#999', marginLeft:8 }}>从「{selectedTag?.label ?? ''}」同步</span>
              </div>
              <X size={14} color="#999" style={{ cursor:'pointer' }} onClick={() => setShowSyncModal(false)} />
            </div>

            <div style={{ padding:'14px 20px', borderBottom:'1px solid #f0f0f0', fontSize:12, color:'#999' }}>
              仅支持选择「我」创建的其他标签，可多选。
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:'12px 20px', minHeight:220 }}>
              {syncTargetTags.length === 0 ? (
                <div style={{ textAlign:'center', color:'#bbb', fontSize:13, padding:'40px 0' }}>暂无可同步的标签</div>
              ) : (
                <div style={{ border:'1px solid #e0e0e0', borderRadius:10, overflow:'hidden' }}>
                  {syncTargetTags.map((t, i) => {
                    const checked = syncSelectedIds.has(t.id);
                    return (
                      <div
                        key={t.id}
                        onClick={() => setSyncSelectedIds(prev => {
                          const next = new Set(prev);
                          if (next.has(t.id)) next.delete(t.id); else next.add(t.id);
                          return next;
                        })}
                        style={{
                          display:'flex', alignItems:'center', gap:10,
                          padding:'10px 12px',
                          borderBottom: i < syncTargetTags.length - 1 ? '1px solid #f0f0f0' : 'none',
                          cursor:'pointer',
                          background: checked ? '#e6f7ff' : '#fff',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          readOnly
                          style={{ width:14, height:14, cursor:'pointer', accentColor:'#1890ff' }}
                        />
                        <div style={{ width:9, height:9, borderRadius:'50%', background:getColorHex(t.color), flexShrink:0 }} />
                        <span style={{ flex:1, fontSize:13, color:'#333', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.label}</span>
                        <span style={{ fontSize:12, color:'#999', flexShrink:0 }}>{formatUpdateTime(t.updatedAt)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ padding:'12px 20px', borderTop:'1px solid #f0f0f0', display:'flex', justifyContent:'flex-end', gap:8, flexShrink:0 }}>
              <button
                onClick={() => setShowSyncModal(false)}
                style={{ padding:'6px 20px', border:'1px solid #e0e0e0', borderRadius:6, background:'#fff', fontSize:13, cursor:'pointer' }}
              >
                取消
              </button>
              <button
                onClick={confirmSyncToOthers}
                disabled={syncSelectedIds.size === 0 || !canSyncToOthers || syncTargetTags.length === 0}
                style={{
                  padding:'6px 20px',
                  border:'none',
                  borderRadius:6,
                  background:(syncSelectedIds.size === 0 || !canSyncToOthers || syncTargetTags.length === 0) ? '#d9d9d9' : '#1890ff',
                  color:'#fff',
                  fontSize:13,
                  cursor:(syncSelectedIds.size === 0 || !canSyncToOthers || syncTargetTags.length === 0) ? 'not-allowed' : 'pointer',
                }}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MAIN CHANNEL CASCADE DROPDOWN ══ */}
      {showMainDD && mainDropPos && !isReadonly && (
        <div ref={mainDropRef} style={{
          position:'fixed', left:mainDropPos.left, top:mainDropPos.top,
          width:mainDropPos.width, zIndex:100003,
          background:'#fff', borderRadius:8,
          boxShadow:'0 6px 24px rgba(0,0,0,.14)', border:'1px solid #e8e8e8',
          overflow:'hidden',
        }}>
          <CascadeDropdown
            game={mcGame} media={mcMedia}
            chSearch={mcChSearch} onChSearchChange={setMcChSearch}
            selected={fMainCh}
            onSelectGame={g => { setMcGame(g); setMcMedia(GAME_CHANNEL_DATA.find(x=>x.name===g)?.media[0]?.name??null); setMcChSearch(''); }}
            onSelectMedia={m => { setMcMedia(m); setMcChSearch(''); }}
            onToggleChannel={toggleMainCh}
            onSelectPaths={(paths, add) =>
              setFMainCh(prev => add
                ? [...prev, ...paths.filter(p => !prev.includes(p))]
                : prev.filter(p => !paths.includes(p))
              )
            }
          />
        </div>
      )}

      {/* ══ CUSTOM COLOR POPOVER ══ */}
      {showCustomPop && customPopPos && (
        <div
          ref={customPopRef}
          style={{
            position: 'fixed', left: customPopPos.left, top: customPopPos.top,
            zIndex: 100002, background: '#fff', borderRadius: 8,
            boxShadow: '0 4px 20px rgba(0,0,0,.16)', border: '1px solid #f0f0f0',
          }}
        >
          <ColorPickerPanel
            initHex={fColor.startsWith('#') && fColor.length === 7 ? fColor : '#1890ff'}
            customColors={customColors}
            onSaveColor={hex => setCustomColors(prev => [...prev, hex])}
            onDeleteColor={i => setCustomColors(prev => prev.filter((_, idx) => idx !== i))}
            onConfirm={hex => { setFColor(hex); setShowCustomPop(false); }}
          />
        </div>
      )}
    </div>,
    document.body
  );
}

/* ══ CASCADE DROPDOWN (3-column side-by-side) ══════════════ */
function CascadeDropdown({ game, media, chSearch, onChSearchChange, selected,
  onSelectGame, onSelectMedia, onToggleChannel, onSelectPaths,
}: {
  game: string|null; media: string|null;
  chSearch: string; onChSearchChange: (v:string)=>void;
  selected: string[];
  onSelectGame: (g:string)=>void; onSelectMedia: (m:string)=>void;
  onToggleChannel: (path:string)=>void;
  onSelectPaths: (paths:string[], add:boolean)=>void;
}) {
  const q = chSearch.trim().toLowerCase();
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Flat results for search mode
  const searchResults = React.useMemo(() => {
    if (!q) return [];
    const hits: { path:string; channel:string; gameName:string; mediaName:string }[] = [];
    for (const g of GAME_CHANNEL_DATA) {
      for (const m of g.media) {
        for (const c of m.channels) {
          if (c.toLowerCase().includes(q)) {
            hits.push({ path:`${g.name}-${m.name}-${c}`, channel:c, gameName:g.name, mediaName:m.name });
          }
        }
      }
    }
    return hits;
  }, [q]);

  React.useEffect(() => { searchInputRef.current?.focus(); }, []);

  const gameData = GAME_CHANNEL_DATA.find(x => x.name === game);
  const channels = gameData?.media.find(x => x.name === media)?.channels ?? [];

  // Select-all helpers
  const cascadePaths = channels.map(c => `${game}-${media}-${c}`);
  const cascadeSelCount = cascadePaths.filter(p => selected.includes(p)).length;
  const cascadeAllSel   = cascadePaths.length > 0 && cascadeSelCount === cascadePaths.length;
  const cascadePartSel  = cascadeSelCount > 0 && !cascadeAllSel;

  const searchPaths    = searchResults.map(r => r.path);
  const searchSelCount = searchPaths.filter(p => selected.includes(p)).length;
  const searchAllSel   = searchPaths.length > 0 && searchSelCount === searchPaths.length;
  const searchPartSel  = searchSelCount > 0 && !searchAllSel;

  // Checkbox ref for indeterminate state
  const cascadeChkRef = React.useRef<HTMLInputElement>(null);
  const searchChkRef  = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (cascadeChkRef.current) cascadeChkRef.current.indeterminate = cascadePartSel;
  }, [cascadePartSel]);
  React.useEffect(() => {
    if (searchChkRef.current) searchChkRef.current.indeterminate = searchPartSel;
  }, [searchPartSel]);

  const ColHdr = ({ text }: { text: string }) => (
    <div style={{ padding:'5px 12px 4px', fontSize:11, color:'#999', fontWeight:500,
      background:'#fafafa', borderBottom:'1px solid #f0f0f0', flexShrink:0, letterSpacing:'0.02em' }}>
      {text}
    </div>
  );

  // Header for 主渠道 column with 全选 checkbox
  const ChannelColHdr = () => (
    <div style={{ padding:'4px 12px 3px', fontSize:11, color:'#999', fontWeight:500,
      background:'#fafafa', borderBottom:'1px solid #f0f0f0', flexShrink:0, letterSpacing:'0.02em',
      display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <span>主渠道</span>
      {cascadePaths.length > 0 && (
        <label style={{ display:'flex', alignItems:'center', gap:4, cursor:'pointer', userSelect:'none' }}>
          <input
            ref={cascadeChkRef}
            type="checkbox"
            checked={cascadeAllSel}
            onChange={() => onSelectPaths(cascadePaths, !cascadeAllSel)}
            style={{ width:13, height:13, cursor:'pointer', accentColor:'#1890ff' }}
          />
          <span style={{ fontSize:11, color:'#1890ff' }}>全选</span>
        </label>
      )}
    </div>
  );

  const ChannelRow = ({ path, channel, sub, keyword }: { path:string; channel:string; sub?:string; keyword?:string }) => {
    const isSel = selected.includes(path);
    return (
      <div onClick={() => onToggleChannel(path)}
        style={{ padding:'7px 12px', fontSize:13, cursor:'pointer',
          display:'flex', alignItems:'center', gap:8 }}
        onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background='#f5f6f7'}
        onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background='transparent'}>
        <div style={{ width:14,height:14,borderRadius:3,flexShrink:0,
          border:`1.5px solid ${isSel?'#1890ff':'#d9d9d9'}`,
          background:isSel?'#1890ff':'#fff',
          display:'flex',alignItems:'center',justifyContent:'center',transition:'all .12s' }}>
          {isSel && <Check size={10} color="#fff" strokeWidth={3} />}
        </div>
        <span style={{ flex:1, color:isSel?'#1890ff':'#333', fontSize:13 }}>
          {keyword ? <HighlightText text={channel} keyword={keyword} /> : channel}
        </span>
        {sub && <span style={{ fontSize:11, color:'#bbb', flexShrink:0 }}>{sub}</span>}
      </div>
    );
  };

  return (
    <div style={{ display:'flex', flexDirection:'column' }}>

      {/* ── Full-width search bar ── */}
      <div style={{ padding:'8px 10px', borderBottom:'1px solid #f0f0f0', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7,
          border:'1px solid #d9d9d9', borderRadius:6, padding:'5px 10px',
          background:'#fff', boxShadow:'inset 0 1px 2px rgba(0,0,0,.04)' }}>
          <Search size={13} color="#aaa" style={{ flexShrink:0 }} />
          <input
            ref={searchInputRef}
            value={chSearch}
            onChange={e => onChSearchChange(e.target.value)}
            placeholder="搜索主渠道…"
            style={{ border:'none', outline:'none', fontSize:13, flex:1,
              color:'#333', background:'transparent', minWidth:0, fontFamily:'inherit' }}
          />
          {chSearch && (
            <X size={12} color="#bbb" style={{ cursor:'pointer', flexShrink:0 }}
              onClick={() => onChSearchChange('')} />
          )}
        </div>
      </div>

      {/* ── Search results (全局搜索) ── */}
      {q ? (
        <div style={{ overflowY:'auto', maxHeight:260 }}>
          {searchResults.length === 0 ? (
            <div style={{ padding:'32px 0', textAlign:'center', fontSize:12, color:'#bbb' }}>无匹配渠道</div>
          ) : (
            <>
              {/* 全选行 */}
              <div style={{ padding:'6px 12px', borderBottom:'1px solid #f5f5f5',
                display:'flex', alignItems:'center', gap:8, background:'#fafafa' }}>
                <input
                  ref={searchChkRef}
                  type="checkbox"
                  checked={searchAllSel}
                  onChange={() => onSelectPaths(searchPaths, !searchAllSel)}
                  style={{ width:14, height:14, cursor:'pointer', accentColor:'#1890ff' }}
                />
                <span style={{ fontSize:12, color:'#1890ff', cursor:'pointer', userSelect:'none' }}
                  onClick={() => onSelectPaths(searchPaths, !searchAllSel)}>
                  全选（{searchResults.length} 个渠道）
                </span>
                {searchSelCount > 0 && (
                  <span style={{ fontSize:11, color:'#999', marginLeft:'auto' }}>
                    已选 {searchSelCount}/{searchResults.length}
                  </span>
                )}
              </div>
              {searchResults.map(({ path, channel, gameName, mediaName }) => (
                <ChannelRow key={path} path={path} channel={channel}
                  sub={`${gameName} · ${mediaName}`} keyword={chSearch} />
              ))}
            </>
          )}
        </div>
      ) : (
        /* ── Three columns (cascade mode) ── */
        <div style={{ display:'flex', height:240 }}>

          {/* Column 1: 游戏 20% */}
          <div style={{ width:'20%', borderRight:'1px solid #f0f0f0', display:'flex', flexDirection:'column', flexShrink:0 }}>
            <ColHdr text="游戏" />
            <div style={{ flex:1, overflowY:'auto' }}>
              {GAME_CHANNEL_DATA.map(g => {
                const active = game === g.name;
                return (
                  <div key={g.name} onClick={() => onSelectGame(g.name)}
                    style={{ padding:'7px 10px 7px 12px', fontSize:13, cursor:'pointer',
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                      background:active?'#e8f3ff':'transparent', color:active?'#1890ff':'#333' }}
                    onMouseEnter={e => { if(!active)(e.currentTarget as HTMLDivElement).style.background='#f5f6f7'; }}
                    onMouseLeave={e => { if(!active)(e.currentTarget as HTMLDivElement).style.background='transparent'; }}>
                    <span style={{ overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{g.name}</span>
                    <ChevronRight size={11} color={active?'#1890ff':'#d0d0d0'} style={{ flexShrink:0 }} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 2: 媒体 20% */}
          <div style={{ width:'20%', borderRight:'1px solid #f0f0f0', display:'flex', flexDirection:'column', flexShrink:0 }}>
            <ColHdr text="媒体" />
            <div style={{ flex:1, overflowY:'auto' }}>
              {(gameData?.media ?? []).map(m => {
                const active = media === m.name;
                return (
                  <div key={m.name} onClick={() => onSelectMedia(m.name)}
                    style={{ padding:'7px 10px 7px 12px', fontSize:13, cursor:'pointer',
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                      background:active?'#e8f3ff':'transparent', color:active?'#1890ff':'#333' }}
                    onMouseEnter={e => { if(!active)(e.currentTarget as HTMLDivElement).style.background='#f5f6f7'; }}
                    onMouseLeave={e => { if(!active)(e.currentTarget as HTMLDivElement).style.background='transparent'; }}>
                    <span style={{ overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{m.name}</span>
                    <ChevronRight size={11} color={active?'#1890ff':'#d0d0d0'} style={{ flexShrink:0 }} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 3: 主渠道 60% */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
            <ChannelColHdr />
            <div style={{ flex:1, overflowY:'auto' }}>
              {channels.length === 0 ? (
                <div style={{ padding:'24px 0', textAlign:'center', fontSize:12, color:'#bbb' }}>暂无渠道数据</div>
              ) : channels.map(c => (
                <ChannelRow key={c} path={`${game}-${media}-${c}`} channel={c} />
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

function HighlightText({ text, keyword }: { text: string; keyword: string }) {
  const idx = text.toLowerCase().indexOf(keyword.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ color:'#1890ff', fontWeight:500 }}>{text.slice(idx, idx + keyword.length)}</span>
      {text.slice(idx + keyword.length)}
    </>
  );
}

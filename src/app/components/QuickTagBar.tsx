import React, { useState } from 'react';
import { Settings2 } from 'lucide-react';
import { Button, Tag } from 'antd';

const F = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

/* ── Color system ─────────────────────────────────────────── */
export type TagColor = string; // now supports any hex

export const TAG_COLOR_OPTIONS: { key: string; hex: string; name: string }[] = [
  { key: 'blue',   hex: '#1890ff', name: '蓝色' },
  { key: 'green',  hex: '#52c41a', name: '绿色' },
  { key: 'orange', hex: '#fa8c16', name: '橙色' },
  { key: 'red',    hex: '#ff4d4f', name: '红色' },
  { key: 'purple', hex: '#722ed1', name: '紫色' },
  { key: 'cyan',   hex: '#13c2c2', name: '青色' },
  { key: 'magenta',hex: '#eb2f96', name: '品红' },
  { key: 'gold',   hex: '#faad14', name: '金色' },
];

export function getColorHex(color: string): string {
  const found = TAG_COLOR_OPTIONS.find(c => c.key === color);
  if (found) return found.hex;
  if (color.startsWith('#')) return color;
  return '#1890ff';
}

/* ── 3-level channel cascade data ──────────────────────────── */
export interface ChannelLeaf { name: string }
export interface MediaNode { name: string; channels: string[] }
export interface GameNode { name: string; media: MediaNode[] }

export const GAME_CHANNEL_DATA: GameNode[] = [
  { name: '大咖', media: [
    { name: '头条', channels: ['头条btt', '头条btoutiao', '头条btt_and', '头条btt_ios'] },
    { name: '快手', channels: ['快手ksa', '快手ksb'] },
    { name: '广点通', channels: ['广点通gdt01', '广点通gdt02'] },
  ]},
  { name: '乐乐', media: [
    { name: '头条', channels: ['头条ltt01', '头条ltt02'] },
    { name: '快手', channels: ['快手lks01'] },
    { name: 'Facebook', channels: ['FB_ll_01', 'FB_ll_02'] },
    { name: 'Google Ads', channels: ['GG_ll_01'] },
  ]},
  { name: '星海', media: [
    { name: '头条', channels: ['头条xh01'] },
    { name: 'TikTok', channels: ['TK_xh01', 'TK_xh02', 'TK_xh03'] },
    { name: '百度', channels: ['BD_xh01'] },
  ]},
];

/* ── Tag types ────────────────────────────────────────────── */
export type ShareVis = 'private' | 'partial' | 'public';

export interface QuickTag {
  id: string;
  label: string;
  color: string;       // color key or hex
  active: boolean;
  owner: string;       // creator name
  updatedAt?: string;  // last update time
  mainChannels: string[];   // full paths like "大咖-头条-头条btt"
  subChannels: string[];    // identifiers like "tt00zs01"
  vis: ShareVis;
  authUsers: string[];
}

/* ── Color styles for tag rendering ──────────────────────── */
const COLOR_STYLES_MAP: Record<string, { border: string; bg: string; text: string; cbBg: string }> = {
  blue:    { border: '#1890ff', bg: '#e6f7ff', text: '#1890ff', cbBg: '#1890ff' },
  green:   { border: '#52c41a', bg: '#f6ffed', text: '#52c41a', cbBg: '#52c41a' },
  orange:  { border: '#fa8c16', bg: '#fff7e6', text: '#fa8c16', cbBg: '#fa8c16' },
  purple:  { border: '#722ed1', bg: '#f9f0ff', text: '#722ed1', cbBg: '#722ed1' },
  red:     { border: '#ff4d4f', bg: '#fff1f0', text: '#ff4d4f', cbBg: '#ff4d4f' },
  cyan:    { border: '#13c2c2', bg: '#e6fffb', text: '#13c2c2', cbBg: '#13c2c2' },
  magenta: { border: '#eb2f96', bg: '#fff0f6', text: '#eb2f96', cbBg: '#eb2f96' },
  gold:    { border: '#faad14', bg: '#fffbe6', text: '#faad14', cbBg: '#faad14' },
};

function getColorStyles(color: string) {
  const found = COLOR_STYLES_MAP[color];
  if (found) return found;
  const hex = color.startsWith('#') ? color : '#1890ff';
  return { border: hex, bg: hex + '18', text: hex, cbBg: hex };
}

/* ── Bar component ────────────────────────────────────────── */
interface Props {
  tags: QuickTag[];
  onToggleTag: (id: string) => void;
  onManage: () => void;
  onReorderTags?: (tags: QuickTag[]) => void;  // 新增
}

export function QuickTagBar({ tags, onToggleTag, onManage, onReorderTags }: Props) {
  const [dragId, setDragId] = React.useState<string|null>(null);
  const handleDragStart = (id: string) => setDragId(id);
  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId || !onReorderTags) return;
    const arr = [...tags];
    const fi = arr.findIndex(t => t.id === dragId);
    const ti = arr.findIndex(t => t.id === targetId);
    if (fi < 0 || ti < 0) return;
    const [moved] = arr.splice(fi, 1);
    arr.splice(ti, 0, moved);
    onReorderTags(arr);
    setDragId(null);
  };

  return (
    <div style={{
      height: 36, display: 'flex', alignItems: 'center',
      borderBottom: 'none', padding: '0 16px',
      background: 'transparent', gap: 8, flexShrink: 0, fontFamily: F,
    }}>
      <Button
        type="link"
        size="small"
        icon={<Settings2 size={12} />}
        onClick={onManage}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 12, padding: 0, height: 'auto', flexShrink: 0,
          color: '#1890ff',
        }}
      >
        快捷标签
      </Button>

      {tags.map(tag => {
        const s = getColorStyles(tag.color);
        return (
          <div key={tag.id} draggable onDragStart={() => handleDragStart(tag.id)}
            onDragOver={e => e.preventDefault()} onDrop={() => handleDrop(tag.id)}
            style={{ opacity: dragId === tag.id ? 0.5 : 1 }}>
            <TagItem tag={tag} styles={s} onToggle={() => onToggleTag(tag.id)} />
          </div>
        );
      })}


    </div>
  );
}

function TagItem({ tag, styles, onToggle }: {
  tag: QuickTag;
  styles: { border: string; bg: string; text: string; cbBg: string };
  onToggle: () => void;
}) {
  return (
    <Tag
      onClick={onToggle}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '2px 10px', borderRadius: 4, cursor: 'pointer',
        fontSize: 12, userSelect: 'none', margin: 0,
        border: `1px solid ${tag.active ? styles.border : '#d9d9d9'}`,
        background: tag.active ? styles.bg : '#fafafa',
        color: tag.active ? styles.text : '#666',
      }}
    >
      <div style={{
        width: 13, height: 13, borderRadius: 2,
        border: `1px solid ${tag.active ? styles.cbBg : '#d9d9d9'}`,
        background: tag.active ? styles.cbBg : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {tag.active && (
          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
            <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span>{tag.label}</span>
    </Tag>
  );
}

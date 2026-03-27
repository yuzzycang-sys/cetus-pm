import React, { useState } from 'react';
import { Modal, Button, Input, Avatar as AntAvatar, Typography } from 'antd';
import { Link2, Search, ChevronDown, ChevronRight, Check, Users, Globe, Lock } from 'lucide-react';
import type { ViewItem } from './ViewSelectorDropdown';

export type ShareMode = 'private' | 'specific' | 'public';

/* ── Mock org data ──────────────────────────────────────────── */
interface MockUser { id: string; name: string; dept: string; account: string }
interface MockDeptLeaf { id: string; name: string; userIds: string[] }
interface MockDept { id: string; name: string; children: MockDeptLeaf[] }

const MOCK_USERS: MockUser[] = [
  { id: 'u1',  name: '张磊',   dept: '快手投放组', account: 'zhanglei' },
  { id: 'u2',  name: '李明',   dept: '腾讯投放组', account: 'liming' },
  { id: 'u3',  name: '王芳',   dept: '快手投放组', account: 'wangfang' },
  { id: 'u4',  name: '陈刚',   dept: '头条投放组', account: 'chengang' },
  { id: 'u5',  name: '陈路遥', dept: '数据分析组', account: 'chenluyao' },
  { id: 'u6',  name: '刘洋',   dept: '快手投放组', account: 'liuyang' },
  { id: 'u7',  name: '赵琳',   dept: '腾讯投放组', account: 'zhaolin' },
  { id: 'u8',  name: '吴晓',   dept: '头条投放组', account: 'wuxiao' },
  { id: 'u9',  name: '周杰',   dept: '数据分析组', account: 'zhoujie' },
  { id: 'u10', name: '孙雅',   dept: 'BI 组',      account: 'sunya' },
  { id: 'u11', name: '钱文',   dept: 'BI 组',      account: 'qianwen' },
  { id: 'u12', name: '胡波',   dept: '产品组',     account: 'hubo' },
];

const MOCK_DEPTS: MockDept[] = [
  {
    id: 'd1', name: '游戏投放中心', children: [
      { id: 'd11', name: '快手投放组', userIds: ['u1', 'u3', 'u6'] },
      { id: 'd12', name: '腾讯投放组', userIds: ['u2', 'u7'] },
      { id: 'd13', name: '头条投放组', userIds: ['u4', 'u8'] },
    ],
  },
  {
    id: 'd2', name: '数据中台', children: [
      { id: 'd21', name: '数据分析组', userIds: ['u5', 'u9'] },
      { id: 'd22', name: 'BI 组',      userIds: ['u10', 'u11'] },
    ],
  },
  {
    id: 'd3', name: '产品运营', children: [
      { id: 'd31', name: '产品组', userIds: ['u12'] },
    ],
  },
];

/* ── Avatar ─────────────────────────────────────────────────── */
const AVATAR_COLORS = ['#1890ff', '#52c41a', '#fa8c16', '#722ed1', '#eb2f96'];
function UserAvatar({ name, idx }: { name: string; idx: number }) {
  const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];
  return (
    <AntAvatar
      size={28}
      style={{
        flexShrink: 0,
        backgroundColor: color + '1a',
        border: `1.5px solid ${color}55`,
        color,
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      {name.slice(-1)}
    </AntAvatar>
  );
}

/* ── Visibility card ─────────────────────────────────────────── */
function VisCard({
  active, icon, label, desc, onClick,
}: { active: boolean; icon: React.ReactNode; label: string; desc: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        flex: 1, padding: '10px 12px', borderRadius: 6, cursor: 'pointer',
        border: `1.5px solid ${active ? '#1890ff' : '#e8e8e8'}`,
        background: active ? '#e6f7ff' : '#fafafa',
        display: 'flex', flexDirection: 'column', gap: 5,
        transition: 'all 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: active ? '#1890ff' : '#555' }}>
        {icon}
        <span style={{ fontSize: 13, fontWeight: active ? 500 : 400 }}>{label}</span>
      </div>
      <span style={{ fontSize: 11, color: '#bbb' }}>{desc}</span>
    </div>
  );
}

/* ── Main modal ─────────────────────────────────────────────── */
interface Props {
  view: ViewItem;
  onSave: (shareMode: ShareMode, sharedWith: string[]) => void;
  onClose: () => void;
}

export function ShareViewModal({ view, onSave, onClose }: Props) {
  const [shareMode, setShareMode] = useState<ShareMode>(view.shareMode ?? 'private');
  const [sharedWith, setSharedWith] = useState<string[]>(view.sharedWith ?? []);
  const [searchText, setSearchText] = useState('');
  const [showDeptTree, setShowDeptTree] = useState(false);
  const [expandedDepts, setExpandedDepts] = useState<string[]>(['d1']);
  const [copied, setCopied] = useState(false);

  /* Derived */
  const searchResults = searchText.trim()
    ? MOCK_USERS.filter(u =>
        u.name.includes(searchText) || u.account.includes(searchText)
      )
    : [];
  const authorizedUsers = MOCK_USERS.filter(u => sharedWith.includes(u.id));

  /* Helpers */
  const addUser = (id: string) => {
    setSharedWith(prev => prev.includes(id) ? prev : [...prev, id]);
    setSearchText('');
  };
  const addUsers = (ids: string[]) =>
    setSharedWith(prev => [...prev, ...ids.filter(id => !prev.includes(id))]);
  const removeUser = (id: string) =>
    setSharedWith(prev => prev.filter(x => x !== id));
  const toggleDept = (id: string) =>
    setExpandedDepts(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(`https://data.example.com/view/${view.id}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    onSave(shareMode, shareMode === 'specific' ? sharedWith : []);
    onClose();
  };

  const footer = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Button
        type="link"
        icon={copied ? <Check size={13} /> : <Link2 size={13} />}
        onClick={handleCopyLink}
        style={{ color: copied ? '#52c41a' : '#1890ff', paddingLeft: 0 }}
      >
        {copied ? '链接已复制！' : '复制链接'}
      </Button>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button onClick={onClose}>取消</Button>
        <Button type="primary" onClick={handleSave}>确认</Button>
      </div>
    </div>
  );

  return (
    <Modal
      open={true}
      onCancel={onClose}
      title={
        <span>
          共享视图
          <Typography.Text type="secondary" style={{ fontSize: 13, marginLeft: 8 }}>
            「{view.name}」
          </Typography.Text>
        </span>
      }
      footer={footer}
      width={560}
      styles={{ body: { maxHeight: 'calc(86vh - 120px)', overflowY: 'auto' } }}
    >
      {/* Visibility */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: '#999', marginBottom: 10, letterSpacing: '0.02em' }}>可见范围</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <VisCard active={shareMode === 'private'}  icon={<Lock  size={13} />} label="私有"    desc="仅自己可见"    onClick={() => setShareMode('private')}  />
          <VisCard active={shareMode === 'specific'} icon={<Users size={13} />} label="指定用户" desc="手动添加授权成员" onClick={() => setShareMode('specific')} />
          <VisCard active={shareMode === 'public'}   icon={<Globe size={13} />} label="公开"    desc="所有成员可查看"  onClick={() => setShareMode('public')}   />
        </div>
      </div>

      {/* Public hint */}
      {shareMode === 'public' && (
        <div style={{
          background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 6,
          padding: '10px 14px', fontSize: 12, color: '#874d00', marginBottom: 16,
        }}>
          ⚠️ 公开模式下，组织内所有成员均可在「共享」标签中看到并使用此视图
        </div>
      )}

      {/* Specific-user section */}
      {shareMode === 'specific' && (
        <div>
          {/* Search */}
          <div style={{ fontSize: 12, color: '#999', marginBottom: 8, letterSpacing: '0.02em' }}>添加成员</div>
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <Input
              autoFocus
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="搜索姓名或账号…"
              prefix={<Search size={13} color="#bbb" />}
              suffix={
                searchText
                  ? <span style={{ cursor: 'pointer', color: '#bbb', fontSize: 12 }} onClick={() => setSearchText('')}>✕</span>
                  : null
              }
            />

            {/* Search dropdown */}
            {searchResults.length > 0 && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 200,
                background: '#fff', border: '1px solid #e8e8e8', borderRadius: 6,
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)', maxHeight: 200, overflowY: 'auto',
              }}>
                {searchResults.map((u, idx) => {
                  const added = sharedWith.includes(u.id);
                  return (
                    <div
                      key={u.id}
                      onClick={() => !added && addUser(u.id)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 12px', cursor: added ? 'default' : 'pointer',
                        borderBottom: idx < searchResults.length - 1 ? '1px solid #f5f5f5' : 'none',
                      }}
                      onMouseEnter={e => { if (!added) (e.currentTarget as HTMLDivElement).style.background = '#f8f8f8'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <UserAvatar name={u.name} idx={idx} />
                        <div>
                          <span style={{ fontSize: 13, color: '#333' }}>{u.name}</span>
                          <span style={{ fontSize: 11, color: '#aaa', marginLeft: 8 }}>{u.dept}</span>
                        </div>
                      </div>
                      {added
                        ? <span style={{ fontSize: 11, color: '#aaa' }}>已添加</span>
                        : <span style={{ fontSize: 11, color: '#1890ff', cursor: 'pointer' }}>+ 添加</span>
                      }
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dept tree toggle */}
          <div
            onClick={() => setShowDeptTree(v => !v)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 12, color: '#1890ff', cursor: 'pointer',
              marginBottom: 14, userSelect: 'none',
            }}
          >
            {showDeptTree ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            按部门添加
          </div>

          {/* Dept tree */}
          {showDeptTree && (
            <div style={{
              border: '1px solid #e8e8e8', borderRadius: 6,
              marginBottom: 16, overflow: 'hidden',
            }}>
              {MOCK_DEPTS.map((dept, di) => {
                const expanded = expandedDepts.includes(dept.id);
                const allIds = dept.children.flatMap(c => c.userIds);
                const allAdded = allIds.length > 0 && allIds.every(id => sharedWith.includes(id));
                return (
                  <div key={dept.id} style={{ borderBottom: di < MOCK_DEPTS.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                    {/* Top dept row */}
                    <div
                      onClick={() => toggleDept(dept.id)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '9px 12px', cursor: 'pointer', background: '#fafafa',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {expanded
                          ? <ChevronDown size={12} color="#aaa" />
                          : <ChevronRight size={12} color="#aaa" />
                        }
                        <span style={{ fontSize: 13, color: '#333', fontWeight: 500 }}>{dept.name}</span>
                        <span style={{ fontSize: 11, color: '#bbb' }}>（{allIds.length} 人）</span>
                      </div>
                      <span
                        onClick={e => { e.stopPropagation(); if (!allAdded) addUsers(allIds); }}
                        style={{ fontSize: 12, color: allAdded ? '#bbb' : '#1890ff', cursor: allAdded ? 'default' : 'pointer' }}
                      >
                        {allAdded ? '已全部添加' : '全部添加'}
                      </span>
                    </div>

                    {/* Sub-depts */}
                    {expanded && dept.children.map((sub) => {
                      const subAllAdded = sub.userIds.every(id => sharedWith.includes(id));
                      return (
                        <div
                          key={sub.id}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '7px 12px 7px 32px',
                            borderTop: '1px solid #f5f5f5',
                            background: '#fff',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 13, color: '#555' }}>{sub.name}</span>
                            <span style={{ fontSize: 11, color: '#bbb' }}>（{sub.userIds.length} 人）</span>
                          </div>
                          <span
                            onClick={() => { if (!subAllAdded) addUsers(sub.userIds); }}
                            style={{ fontSize: 12, color: subAllAdded ? '#bbb' : '#1890ff', cursor: subAllAdded ? 'default' : 'pointer' }}
                          >
                            {subAllAdded ? '已全部添加' : '添加'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {/* Authorized users list */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#999' }}>已授权成员</span>
              {authorizedUsers.length > 0 && (
                <span style={{
                  fontSize: 11, background: '#f5f5f5', color: '#aaa',
                  borderRadius: 10, padding: '1px 7px',
                }}>
                  {authorizedUsers.length} 人
                </span>
              )}
            </div>

            {authorizedUsers.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '22px 0',
                fontSize: 12, color: '#ccc',
                border: '1px dashed #e8e8e8', borderRadius: 6,
              }}>
                暂未添加任何成员，请通过搜索或部门选择添加
              </div>
            ) : (
              <div style={{
                border: '1px solid #e8e8e8', borderRadius: 6,
                maxHeight: 200, overflowY: 'auto',
              }}>
                {authorizedUsers.map((u, i) => (
                  <div
                    key={u.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '9px 12px',
                      borderBottom: i < authorizedUsers.length - 1 ? '1px solid #f5f5f5' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <UserAvatar name={u.name} idx={i} />
                      <div>
                        <div style={{ fontSize: 13, color: '#333' }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: '#aaa' }}>{u.dept}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 12, color: '#aaa' }}>可查看</span>
                      <Button
                        type="link"
                        danger
                        size="small"
                        style={{ fontSize: 12, padding: 0, height: 'auto' }}
                        onClick={() => removeUser(u.id)}
                      >
                        撤销
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

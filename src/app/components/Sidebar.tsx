import React, { useState } from 'react';
import { Menu } from 'antd';

const LEAF_ITEMS = ['腾讯', '头条', '快手'];

export function Sidebar() {
  const [expandedPlatform, setExpandedPlatform] = useState<string>('快手');
  const [expandedSubmenu,  setExpandedSubmenu]  = useState<string>('广告分析');
  const [activeSideItem,   setActiveSideItem]   = useState<string>('头条');

  // Compute openKeys from state: include platform key if expanded, and submenu key if expanded
  const openKeys: string[] = [];
  if (expandedPlatform) openKeys.push(expandedPlatform);
  if (expandedPlatform && expandedSubmenu) openKeys.push(`${expandedPlatform}__${expandedSubmenu}`);

  const handleOpenChange = (keys: string[]) => {
    // Determine which platform-level keys are open (no '__' in key)
    const platformKeys = keys.filter(k => !k.includes('__'));
    const submenuKeys  = keys.filter(k => k.includes('__'));

    const newPlatform = platformKeys.length > 0 ? platformKeys[platformKeys.length - 1] : '';
    setExpandedPlatform(newPlatform);

    if (submenuKeys.length > 0) {
      const lastSubmenu = submenuKeys[submenuKeys.length - 1];
      setExpandedSubmenu(lastSubmenu.split('__')[1] ?? '');
    } else {
      setExpandedSubmenu('');
    }
  };

  const items = [
    {
      key: '快手',
      label: '快手',
      children: [
        {
          key: '快手__广告分析',
          label: '广告分析',
          children: LEAF_ITEMS.map(item => ({
            key: item,
            label: item,
          })),
        },
      ],
    },
    {
      key: '腾讯',
      label: '腾讯',
    },
    {
      key: '头条',
      label: '头条',
    },
  ];

  return (
    <div
      style={{
        width: 128,
        flexShrink: 0,
        borderRight: '1px solid #d9d9d9',
        overflowY: 'auto',
        background: '#ffffff',
      }}
    >
      <Menu
        mode="inline"
        openKeys={openKeys}
        selectedKeys={[activeSideItem]}
        onOpenChange={handleOpenChange}
        onClick={({ key }) => {
          // Only leaf items (腾讯/头条/快手 under 广告分析) are selectable
          if (LEAF_ITEMS.includes(key)) {
            setActiveSideItem(key);
          }
        }}
        items={items}
        style={{
          width: 128,
          border: 'none',
          fontSize: 13,
        }}
        inlineIndent={12}
      />
    </div>
  );
}

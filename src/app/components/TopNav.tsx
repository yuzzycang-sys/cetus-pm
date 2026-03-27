import React from 'react';
import { Layout, Menu, Button, Avatar, Space, Tag, Typography } from 'antd';
import { Bell, HelpCircle, ChevronDown } from 'lucide-react';

const { Header } = Layout;
const { Text } = Typography;

const NAV_ITEMS = [
  '首页', '数据报表', '素材管理', '资产管理', '工具',
  '智能实验室', '直播运营', '管理中心', '新项目',
];

const PRIMARY = '#1677ff';

const menuItems = NAV_ITEMS.map(item => ({
  key: item,
  label: item,
}));

export function TopNav() {
  return (
    <Header
      style={{
        height: 48,
        lineHeight: '48px',
        background: '#fff',
        borderBottom: '1px solid #d9d9d9',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        zIndex: 100,
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginRight: 24, flexShrink: 0 }}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            background: PRIMARY,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            color: '#fff',
            fontWeight: 700,
          }}
        >
          鲸
        </div>
        <span style={{ color: '#141414', fontWeight: 600, fontSize: 14 }}>鲸鱼座</span>
      </div>

      {/* Nav Items */}
      <Menu
        mode="horizontal"
        selectedKeys={['数据报表']}
        items={menuItems}
        style={{
          flex: 1,
          minWidth: 0,
          border: 'none',
          height: 48,
          lineHeight: '48px',
        }}
        overflowedIndicatorPopupClassName="topnav-overflow"
      />

      {/* Right */}
      <Space size={4} style={{ flexShrink: 0 }}>
        <Button
          type="text"
          icon={<HelpCircle size={16} color="#595959" />}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, padding: 0 }}
        />
        <Button
          type="text"
          icon={<Bell size={16} color="#595959" />}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, padding: 0 }}
        />

        <div style={{ width: 1, height: 16, background: '#d9d9d9', margin: '0 4px' }} />

        <Tag color="blue" style={{ marginRight: 0 }}>正式环境</Tag>

        <Space
          size={6}
          style={{ padding: '4px 8px', borderRadius: 6, cursor: 'pointer' }}
          className="topnav-user"
        >
          <Avatar
            size={24}
            style={{
              background: '#e8e2f5',
              color: '#7c5cbf',
              fontSize: 11,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            童
          </Avatar>
          <Text style={{ fontSize: 13, color: '#141414' }}>童惠娟</Text>
          <ChevronDown size={12} color="#595959" />
        </Space>
      </Space>
    </Header>
  );
}

import React from 'react';
import { Pagination as AntPagination } from 'antd';

interface Props {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
}

export function Pagination({ total, page, pageSize, onPageChange, onPageSizeChange }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        padding: '8px 16px',
        borderTop: '1px solid #d9d9d9',
      }}
    >
      <AntPagination
        current={page}
        total={total}
        pageSize={pageSize}
        showSizeChanger
        showTotal={(t) => `共 ${t.toLocaleString('zh-CN')} 条`}
        pageSizeOptions={[10, 20, 30, 50, 100]}
        onChange={onPageChange}
        onShowSizeChange={(_current, size) => onPageSizeChange(size)}
        size="small"
      />
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Checkbox, message } from 'antd';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  sheets: string[];
  activeSheet: string;
  // Global filter params
  dateStart: string;
  dateEnd: string;
  activeFilters: string[];
  filterSelections: Record<string, string[]>;
  priceRange: { min: string; max: string; roiMin: string; roiMax: string };
}

export function ExportModal({
  open,
  onClose,
  sheets,
  activeSheet,
  dateStart,
  dateEnd,
  activeFilters,
  filterSelections,
  priceRange,
}: ExportModalProps) {
  const [checkedSheets, setCheckedSheets] = useState<string[]>([activeSheet]);
  const [loading, setLoading] = useState(false);

  // 每次打开时，重置为仅勾选当前 sheet
  useEffect(() => {
    if (open) {
      setCheckedSheets([activeSheet]);
    }
  }, [open, activeSheet]);

  const allChecked = useMemo(
    () => checkedSheets.length === sheets.length,
    [checkedSheets, sheets]
  );

  const indeterminate = useMemo(
    () => checkedSheets.length > 0 && checkedSheets.length < sheets.length,
    [checkedSheets, sheets]
  );

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCheckedSheets(e.target.checked ? [...sheets] : []);
  };

  const handleOk = async () => {
    const payload = {
      filters: {
        dateStart,
        dateEnd,
        activeFilters,
        filterSelections,
        priceRange,
      },
      sheets: checkedSheets,
    };
    console.log('Export payload:', payload);

    setLoading(true);
    try {
      // 模拟异步提交
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('导出任务已提交，请前往任务中心查看');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="导出"
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="确定"
      cancelText="取消"
      okButtonProps={{ disabled: checkedSheets.length === 0, loading }}
    >
      <div style={{ marginBottom: 12, borderBottom: '1px solid #f0f0f0', paddingBottom: 8 }}>
        <Checkbox
          indeterminate={indeterminate}
          checked={allChecked}
          onChange={handleSelectAll}
        >
          全选
        </Checkbox>
      </div>
      <Checkbox.Group
        value={checkedSheets}
        onChange={vals => setCheckedSheets(vals as string[])}
        style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
      >
        {sheets.map(sheet => (
          <Checkbox key={sheet} value={sheet}>
            {sheet}
          </Checkbox>
        ))}
      </Checkbox.Group>
    </Modal>
  );
}

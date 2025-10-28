import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography
} from '@mui/material';

interface VirtualizedTableProps {
  data: any[];
  columns: {
    key: string;
    label: string;
    width: number;
    render?: (value: any, row: any) => React.ReactNode;
  }[];
  height?: number;
  itemHeight?: number;
  onRowClick?: (row: any) => void;
}

const VirtualizedTable: React.FC<VirtualizedTableProps> = ({
  data,
  columns,
  height = 400,
  itemHeight = 60,
  onRowClick
}) => {
  const totalWidth = useMemo(() => 
    columns.reduce((sum, col) => sum + col.width, 0), 
    [columns]
  );

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const row = data[index];
    
    return (
      <div style={style}>
        <TableRow
          hover
          onClick={() => onRowClick?.(row)}
          sx={{ 
            cursor: onRowClick ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid #e0e0e0'
          }}
        >
          {columns.map((column) => (
            <TableCell
              key={column.key}
              sx={{ 
                width: column.width,
                minWidth: column.width,
                maxWidth: column.width,
                padding: '8px 16px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {column.render 
                ? column.render(row[column.key], row)
                : row[column.key]
              }
            </TableCell>
          ))}
        </TableRow>
      </div>
    );
  };

  if (data.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          لا توجد بيانات للعرض
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table stickyHeader>
        <TableHead>
          <TableRow sx={{ display: 'flex' }}>
            {columns.map((column) => (
              <TableCell
                key={column.key}
                sx={{ 
                  width: column.width,
                  minWidth: column.width,
                  maxWidth: column.width,
                  fontWeight: 'bold',
                  backgroundColor: 'grey.50'
                }}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
      </Table>
      
      <Box sx={{ width: totalWidth }}>
        <List
          height={height}
          itemCount={data.length}
          itemSize={itemHeight}
          width="100%"
        >
          {Row}
        </List>
      </Box>
    </TableContainer>
  );
};

export default VirtualizedTable;

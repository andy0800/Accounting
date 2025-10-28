// TypeScript declarations for react-window
declare module 'react-window' {
  import { ComponentType, CSSProperties, ReactElement } from 'react';

  export interface ListChildComponentProps {
    index: number;
    style: CSSProperties;
    data?: any;
  }

  export interface FixedSizeListProps {
    children: ComponentType<ListChildComponentProps>;
    height: number | string;
    itemCount: number;
    itemSize: number;
    width?: number | string;
    direction?: 'ltr' | 'rtl';
    layout?: 'vertical' | 'horizontal';
    overscanCount?: number;
    useIsScrolling?: boolean;
    onItemsRendered?: (props: {
      overscanStartIndex: number;
      overscanStopIndex: number;
      visibleStartIndex: number;
      visibleStopIndex: number;
    }) => void;
    onScroll?: (props: {
      scrollDirection: 'forward' | 'backward';
      scrollOffset: number;
      scrollUpdateWasRequested: boolean;
    }) => void;
    ref?: any;
    className?: string;
    style?: CSSProperties;
    itemData?: any;
  }

  export interface VariableSizeListProps extends Omit<FixedSizeListProps, 'itemSize'> {
    itemSize: (index: number) => number;
    estimatedItemSize?: number;
  }

  export const FixedSizeList: ComponentType<FixedSizeListProps>;
  export const VariableSizeList: ComponentType<VariableSizeListProps>;

  // Grid components
  export interface FixedSizeGridProps {
    children: ComponentType<{
      columnIndex: number;
      rowIndex: number;
      style: CSSProperties;
      data?: any;
    }>;
    columnCount: number;
    columnWidth: number;
    height: number | string;
    rowCount: number;
    rowHeight: number;
    width?: number | string;
    direction?: 'ltr' | 'rtl';
    overscanColumnsCount?: number;
    overscanRowsCount?: number;
    useIsScrolling?: boolean;
    onItemsRendered?: (props: {
      overscanColumnStartIndex: number;
      overscanColumnStopIndex: number;
      overscanRowStartIndex: number;
      overscanRowStopIndex: number;
      visibleColumnStartIndex: number;
      visibleColumnStopIndex: number;
      visibleRowStartIndex: number;
      visibleRowStopIndex: number;
    }) => void;
    onScroll?: (props: {
      horizontalScrollDirection: 'forward' | 'backward';
      scrollLeft: number;
      scrollTop: number;
      scrollUpdateWasRequested: boolean;
      verticalScrollDirection: 'forward' | 'backward';
    }) => void;
    ref?: any;
    className?: string;
    style?: CSSProperties;
    itemData?: any;
  }

  export const FixedSizeGrid: ComponentType<FixedSizeGridProps>;
  export const VariableSizeGrid: ComponentType<any>;
}

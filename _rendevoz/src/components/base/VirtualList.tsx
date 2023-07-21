import { useVirtualizer } from "@tanstack/react-virtual";
import { CSSProperties, memo, ReactElement, useRef } from "react";

type Props<T> = {
  items: T[];
  renderItem: (item: T, idx: number) => ReactElement;
  estimateSize: number;
  style?: CSSProperties;
  childrenContainerClassname?: string;
};

function VirtualList<T>({ items, renderItem, estimateSize, style, childrenContainerClassname }: Props<T>) {
  const contentRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: items.length,
    estimateSize: () => estimateSize,
    getScrollElement: () => contentRef.current
  })
  const itemz = virtualizer.getVirtualItems()
  return (
    <div ref={contentRef} style={{ overflowY: 'auto', overflowX: 'hidden', contain: 'strict', ...style }}>
      <div style={{ height: virtualizer.getTotalSize(), width: '100%', position: 'relative' }} className={childrenContainerClassname}>
        {itemz.map(i => (
          <div
            key={i.key}
            data-index={i.index}
            ref={virtualizer.measureElement}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${i.start}px)`
            }}
          >
            {renderItem(items[i.index], i.index)}
          </div>
        ))}
      </div>
    </div>
  )
}

export default memo(VirtualList)

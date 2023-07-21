import React, {
  createContext,
  CSSProperties,
  FC,
  memo,
  ReactNode,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { DockContextType, PanelData, TabPaneCache } from "./DockData";
import { LayoutIdToTabMap } from "@/components/layout";

interface DockTabPaneProps {
  cacheId?: string;
  cached: boolean;
  parent?: PanelData;
  active?: boolean;
  style?: CSSProperties;
  className?: string;
  children?: ReactNode;
}
const variants = {
  hidden: {
    // visibility: 'hidden',
    // pointerEvents: 'none',
    // zIndex: -1,
    // position: 'absolute',
    // opacity: 0,
    display: "none",
  },
  visible: {
    // opacity: 1
  },
};
export const DockTabPaneContext = createContext<{
  currentTabId: string;
} | null>(null);
export const DockTabPane: FC<DockTabPaneProps> = memo(
  ({ cached, cacheId, children, style, active }) => {
    const context = useContext(DockContextType);
    const ref = useRef<HTMLDivElement>(null);
    const cacheRef = useRef<TabPaneCache | null>(null);
    const symbol = useMemo(() => Symbol(), []);
    const recursivelyScrollTop = (root: HTMLElement) => {
      const rootScrollTop = root.scrollTop;
      if (rootScrollTop) {
        cacheRef.current?.scrollPreserver.set(root, rootScrollTop);
        return;
      }
      root.childNodes.forEach((n) => recursivelyScrollTop(n));
    };
    const updateCache = () => {
      const cache = cacheRef.current;
      if (cache) {
        if (!cached || cacheId !== cache.id) {
          context.removeTabCache(cache.id, symbol);
          cacheRef.current = null;
        }
      }
      if (cached && ref.current && cacheId) {
        cacheRef.current = context.getTabCache(cacheId, symbol);
        Array.from(cacheRef.current.scrollPreserver.entries()).forEach(
          ([k, v]) => {
            k.scrollTop === 0 && (k.scrollTop = v);
          }
        );

        recursivelyScrollTop(cacheRef.current.div);
        if (!ref.current.contains(cacheRef.current.div)) {
          ref.current.appendChild(cacheRef.current.div);
          Array.from(cacheRef.current.scrollPreserver.entries()).forEach(
            ([k, v]) => {
              k.scrollTop === 0 && (k.scrollTop = v);
            }
          );
        }
        context.updateTabCache(cacheId, children);
      }
    };

    useLayoutEffect(() => {
      updateCache();
    });
    useLayoutEffect(() => {
      return () => {
        if (cacheRef.current) {
          recursivelyScrollTop(cacheRef.current.div);
          context.removeTabCache(cacheRef.current.id, symbol);
        }
      };
    }, []);

    let renderChildren: ReactNode = null;
    if (cached) {
      renderChildren = null;
    } else {
      renderChildren = children;
    }
    const mergedStyle: React.CSSProperties = {
      ...style,
      position: active ? "relative" : "absolute",
      top: active ? undefined : 42,
      width: "100%",
      height: "calc( 100% - 42px )",
      // display: active ? undefined : 'none'
      contentVisibility: active ? "visible" : "hidden",
      pointerEvents: active ? undefined : "none",
    };
    return (
      <div
        ref={(node) => {
          ref.current = node;
          if (cacheId && node) {
            const tab = LayoutIdToTabMap.get(cacheId);
            if (tab) {
              tab.tabElement = node;
            }
          }
        }}
        id={cacheId}
        // initial={{ opacity: 0 }}
        // animate={active ? 'visible' : 'hidden'}
        // variants={variants}
        // transition={{ duration: 0.3, type: 'tween' }}
        role="tabpane"
        style={mergedStyle}
      >
        {renderChildren}
      </div>
    );
  }
);

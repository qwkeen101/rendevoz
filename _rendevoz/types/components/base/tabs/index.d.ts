import { CSSProperties, FC, MouseEventHandler, ReactElement, ReactNode } from 'react';
export interface TabNavListProps {
    defaultActiveKey: string;
    navs: {
        tab: string | ReactElement;
        key: string;
    }[];
    onTabClick: (key: string, e: MouseEvent) => void;
    extra?: ReactNode;
}
interface TabsProps {
    defaultActiveKey: string;
    children: ReactElement<TabPaneProps> | ReactElement<TabPaneProps>[];
    extra?: ReactNode;
    activeKey?: string;
    onTabClick?: (key: string, e: MouseEvent) => void;
    renderTabNav?: (defaultTabNav: TabNavListProps) => ReactNode;
    disableInnerPanes?: boolean;
}
export declare const Tabs: FC<TabsProps>;
interface TabPaneProps {
    onClick?: MouseEventHandler;
    children: ReactNode;
    tab: string | ReactElement;
    innerKey?: string;
    style?: CSSProperties;
    active?: boolean;
}
export declare const TabPane: FC<TabPaneProps>;
export {};

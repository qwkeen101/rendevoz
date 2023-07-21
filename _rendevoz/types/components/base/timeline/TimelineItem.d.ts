import { CSSProperties, FC, ReactNode } from "react";

interface TimelineItemProps {
  className?: string;
  style?: CSSProperties;
  iconName?: string;
  iconSize?: number;
  iconColor?: string;
  children?: ReactNode;
  hideTail?: boolean;
  iconFill?: string | string[];
  iconTheme?: string;
}
declare const TimelineItem: FC<TimelineItemProps>;
export default TimelineItem;

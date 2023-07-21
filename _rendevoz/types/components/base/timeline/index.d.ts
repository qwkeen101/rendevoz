import { FC, ReactNode } from "react";
import TimelineItem from "./TimelineItem";

interface TimelineProps {
  children?: ReactNode;
  iconSize?: number;
  iconColor?: string;
}
interface ITimeline extends FC<TimelineProps> {
    Item: typeof TimelineItem;
}
declare const Timeline: ITimeline;
export default Timeline;

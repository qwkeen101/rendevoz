import { ReactNode } from "react";

declare const Masonry: ({
  breakPoints,
  gap,
  children,
}: {
  breakPoints: Record<number, number>;
  gap: number;
  children: ReactNode;
}) => JSX.Element;
export declare function MasonryRow({ children, gap }: {
    children: React.ReactNode;
    gap: number;
}): JSX.Element;
export declare function createChunks<T>(data?: T[], columns?: number): any[];
export declare function createDataColumns<T>(data?: T[][], columns?: number): T[][];
export default Masonry;

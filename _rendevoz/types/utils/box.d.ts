import { Point } from '~/typings';
/** This method returns true if two boxes intersects
 * @param boxA
 * @param boxB
 */
export declare const boxesIntersect: (boxA: Box, boxB: Box) => boolean;
export declare const calculateSelectionBox: ({ startPoint, endPoint }: {
    startPoint: Point;
    endPoint: Point;
}) => {
    left: number;
    top: number;
    width: number;
    height: number;
};
export declare const calculateBoxArea: (box: Box) => number;
export declare const boxContain: (parentBox: Box, childBox: Box) => boolean;
export declare const getRelativeBoxSize: (parentBox: Box, childBox: Box) => {
    relativeX: number;
    relativeY: number;
    percentageX: number;
    percentageY: number;
    percentageWidth: number;
    percentageHeight: number;
};
export declare const pointInBox: (point: Point, box: Box) => boolean;

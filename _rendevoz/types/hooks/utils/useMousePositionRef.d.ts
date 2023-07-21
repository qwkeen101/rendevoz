import * as React from 'react';
import {RefObject} from 'react';

/**
 * Mouse position as a tuple of [x, y]
 */
type MousePosition = [number, number];
/**
 * Hook to get the current mouse position
 * This hook doesn't trigger extra re-render
 *
 * @returns Mouse position as a tuple of [x, y]
 */
declare const useMousePosition: () => React.MutableRefObject<MousePosition>;
export declare const useMousePositionWithRef: (ref: RefObject<Element>) => React.MutableRefObject<{
    docX: number;
    docY: number;
    posX: number;
    posY: number;
    elX: number;
    elY: number;
    elH: number;
    elW: number;
}>;
export default useMousePosition;

/**
 * get k and b of a binary equation
 */
export declare const binaryEquationGetKB: (x1: number, y1: number, x2: number, y2: number) => {
    k: number;
    b: number;
};
/**
 * ax^2 + bx + c = 0
 */
export declare const quadEquationGetX: (a: number, b: number, c: number) => any[];
export declare function randomIntFromInterval(min: number, max: number): number;

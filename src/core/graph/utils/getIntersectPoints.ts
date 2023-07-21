import { binaryEquationGetKB, quadEquationGetX } from "@/utils/math";

interface Point {
  x: number;
  y: number;
}

// line: k = (y2-y1)/(x2-x1) y-y1=k(x-x1) y = kx + b b = kx1 + y1
// circle: (x-m)^2 + (y-n)^2 = r^2
export const getIntersectedPointsOfLineAndCircle = (
  point1: Point,
  point2: Point,
  circleCenterPoint: Point,
  radius: number
) => {
  const { x: x1, y: y1 } = point1;
  const { x: x2, y: y2 } = point2;
  const { x: m, y: n } = circleCenterPoint;
  const { k, b } = binaryEquationGetKB(x1, y1, x2, y2);
  const aX = 1 + k * k;
  const bX = 2 * k * (b - n) - 2 * m;
  const cX = m * m + (b - n) * (b - n) - radius * radius;
  const xArr = quadEquationGetX(aX, bX, cX);
  const points = xArr.map((x) => {
    const y = k * x + b;
    return { x, y };
  });
  return points;
};

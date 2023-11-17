import { Children, createContext, useMemo } from "react";
import { RenderElementProps } from "../../slate-react";
import { NODE_TO_PARENT } from "../../slate-react/utils/weak-maps";
import { TableCellElement, TableElement } from "~/typings";

export const TableCellContext = createContext<
  | {
      onCellEnter: () => void;
      onCellLeave: () => void;
    }
  | undefined
>(undefined);
const TableRow = ({ element, children, attributes }: RenderElementProps) => {
  const table = NODE_TO_PARENT.get(element) as TableElement | undefined;
  const realChildren = useMemo(() => {
    if (!table) return [];
    const childrenArr: any[] = [];
    const keys = table.columns?.map((i) => i.accessor);
    if (!keys) return [];
    Children.forEach(children, (c, idx) => {
      const cellElement = element.children[idx] as TableCellElement;
      const { colName } = cellElement;
      const realIdx = keys.indexOf(colName);
      childrenArr[realIdx] = c;
    });
    return [...childrenArr];
  }, [children]);
  return (
    <tr {...attributes} style={{ position: "relative" }}>
      {realChildren}
    </tr>
  );
};

export default TableRow;

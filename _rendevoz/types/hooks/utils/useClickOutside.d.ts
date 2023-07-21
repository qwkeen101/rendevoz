import { MutableRefObject } from "react";

declare const useClickOutside: (
  callback: (e: MouseEvent) => void,
  ref: MutableRefObject<unknown> | MutableRefObject<unknown>[],
  shouldHandle?: boolean
) => void;
export default useClickOutside;

import { atom, useAtom } from "jotai";

const cleanMode = atom(false);

const useCleanMode = () => useAtom(cleanMode);

export default useCleanMode;

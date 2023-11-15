import { globalStore } from "@/api/stores";
import { SettingAtom } from ".";

export default () => {
  return globalStore.get(SettingAtom);
};

import { ipcInstance } from "@/electron";

export const maximizeWindow = () => {
  ipcInstance.send("maximizeWindow");
};
export const minimizeWindow = () => {
  ipcInstance.send("minimizeWindow");
};

export const getSourceId = () => {
  return ipcInstance.send("sourceId");
};

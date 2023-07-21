import { assignProperties } from "@/utils";
import { atom, useAtomValue } from "jotai";
import { IWebpageInstance } from "~/typings";
import useWebpageState from "./useWebpageState";
import { waitFor } from "@/utils/functions";
import { useLatest } from "react-use";

export const WebpageInstanceAtom = atom<IWebpageInstance>({});

const useWebpageInstance = () => useAtomValue(WebpageInstanceAtom);

export const useAssignWebpageInstance = () => {
  const instance = useWebpageInstance();
  const [webpageState, setWebpageState] = useWebpageState();
  const { currentWebpage } = webpageState;
  const latestWebpage = useLatest(webpageState.currentWebpage);
  assignProperties(instance, {
    changeUrl: (url) => {
      setWebpageState((s) => ({ ...s, navigationUrl: url }));
      instance.navigateTo?.(url);
    },
    transformToNote: () => {
      return new Promise((res) => {
        waitFor(
          () => !!latestWebpage.current,
          () => {
            if (!latestWebpage.current!.noteId) {
              instance
                .clipHTML?.()
                .then(({ html }) => instance.handleClipHTML?.(html));
            } else {
              setWebpageState((s) => ({ ...s, showReaderMode: true }));
            }
            waitFor(
              () => {
                if (instance.editor) {
                  return true;
                }
                return false;
              },
              () => {
                res(instance.editor!);
              }
            );
          }
        );
      });
    },
  });
};
export default useWebpageInstance;

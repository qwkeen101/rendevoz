import { Modal } from "@/components";
import { GlobalSearchInputAtom, SearchDialog } from "../search/SearchDialog";
import { useGlobalSetAtom, useShortcut, useToggle } from "@/hooks";
import { useEffect } from "react";
import { GlobalInstances } from "~/typings";
import { assignProperties } from "@/utils";

export const GlobalTextSearchInstance: Partial<GlobalInstances.TextSearchInstance> =
  {};
const GlobalTextSearch = () => {
  const [modalVisible, toggleModalVisible] = useToggle(false);
  const setSearchInput = useGlobalSetAtom(GlobalSearchInputAtom);
  assignProperties(GlobalTextSearchInstance, {
    open: (opts) => {
      if (opts?.searchInput) {
        setSearchInput(opts.searchInput);
      }
      toggleModalVisible(true);
    },
  });
  useShortcut("openGlobalSearch", () => {
    toggleModalVisible();
  });
  useEffect(() => {
    if (modalVisible) {
      setTimeout(() => {
        document.getElementById("global-search-input")?.focus();
      }, 100);
    } else {
      document.getElementById("global-search-input")?.blur();
    }
  }, [modalVisible]);
  return (
    <Modal
      notUnmount
      showClose
      noStyle
      visible={modalVisible}
      onClose={toggleModalVisible}
    >
      <SearchDialog onClose={toggleModalVisible} />
    </Modal>
  );
};

export default GlobalTextSearch;

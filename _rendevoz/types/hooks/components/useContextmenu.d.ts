declare const useContextmenu: (ele?: HTMLElement | null, options?: {}) => {
    closeContextmenu: () => void;
    contextMenuState: {
        visible: boolean;
        pageX?: number;
        pageY?: number;
        eleX?: number;
        eleY?: number;
    };
};
export default useContextmenu;

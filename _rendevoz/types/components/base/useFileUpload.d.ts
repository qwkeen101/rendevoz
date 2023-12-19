declare const useFileUpload: (onUpload?: (file: File) => void, accept?: string, options?: {
    multiple?: boolean;
}) => {
    renderUploader: () => import("react/jsx-runtime").JSX.Element;
    upload: () => void;
    removeFile: () => void;
};
export default useFileUpload;

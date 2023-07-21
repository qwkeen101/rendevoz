import { CSSProperties, ReactNode } from "react";

declare const FileUploader: ({
  onFileUploaded,
  dashed,
  text,
  showButton,
  accept,
  icon,
  style,
}: {
  onFileUploaded?: (file: File) => void;
  accept?: string;
  dashed?: boolean;
  text?: string | null;
  showButton?: boolean;
  icon?: string | ReactNode;
  style?: CSSProperties;
}) => JSX.Element;
export default FileUploader;

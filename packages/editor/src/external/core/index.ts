import { ReactEditor, useSlate, useSlateStatic, useFocused, useSelected } from '../../slate-react';
import { useGlobalIsDragging } from '../../global';
export { ReactEditor, useSlate, useSlateStatic, useFocused, useSelected };
export const GlobalSetting = {
  useSelectSettingAtom: (_: any) => ({ fontSize: 14, lineSpacing: 1.57, pageWidth: 'Medium' }),
  getSetting: () => ({ code: { defaultLanguage: 'typescript' }, editor: { objectAutoBecomeInline: true }, general: { userFilePath: '' } }),
  atoms: { showPropertiesInComponentPage: {} as any }
};
export const getSetting = GlobalSetting.getSetting;
export const SettingAtom = {};
export const InlineObject = {} as any;
export const useGlobalIsDragging = useGlobalIsDragging;

export { default as PageConfigContext } from '../../PageConfigContext';


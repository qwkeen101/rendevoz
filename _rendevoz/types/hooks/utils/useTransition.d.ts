import { ReactNode } from 'react';
type Animator = (children: ReactNode, key: string) => ReactNode;
declare const useTransition: () => Animator;
export default useTransition;

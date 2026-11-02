import React from 'react'
const AutoSizeTextArea = React.forwardRef<HTMLTextAreaElement, any>((props, ref)=> <textarea ref={ref} {...props}/>);
export default AutoSizeTextArea

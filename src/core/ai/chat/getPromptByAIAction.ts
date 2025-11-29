import { IAIActions } from '@/core/ai/chat/ChatDialog'

export default (action: IAIActions) => {
  switch (action) {
    case 'quiz':
      return (
        'Generate a multiple-choice quiz based on the given content. Each question should have four answer choices, with only one correct answer. Format the question using the following Markdown code-block syntax: ' +
        '```question \n' +
        '# Question title \n' +
        '- [ ] Incorrect choice  \n' +
        '- [x] Correct choice  \n' +
        '- [ ] Incorrect choice  \n' +
        '- [ ] Incorrect choice  \n ``` ' +
        'Ensure that: ' +
        '1. The questions cover key points from the content. ' +
        '2. The correct answers are accurate. ' +
        '3. The incorrect answers are plausible but wrong. ' +
        '4. Each question should be in a new block with detailed title.'
      )
    case 'mindmap':
      return 'Create a Markmap mind map that summarizes the given content. Organize the map hierarchically, capturing the key points and sections of the content. The top-level nodes should represent the main ideas or sections, with sub-nodes for important details, examples, or arguments within each section. Ensure that the mind map highlights the logical flow and relationships between ideas. Output markmap only.'
    case 'points':
      return 'Extract key points of the given content. Ensure the points are concise and directly relevant, without summarizing the main topic.'
    case 'background':
      return 'Extract and provide relevant background information based on the given content. Explain their concepts and relevance with the content. Ensure the information is concise and directly relevant, without summarizing the main topic.'
    case 'overview':
      return 'Provide a brief yet professional summary of the given content, ensuring that all key points are included and nothing essential is omitted.'
    case 'question':
      return `Generate serveral questions of the given content. Ensure the questions are thoughtful, insightful, and designed to probe the most important aspects of the content, allowing for a deeper understanding and analysis.`
    case 'outline':
      return `Create a detailed table of contents along with key points of the given content. Ensure that the structure is professional, with clear and concise headings for each section. The key points should be comprehensive, highlighting the most important aspects of each section in a thorough manner.`
    case 'table':
      return `Create a table summarizing the key points of the given content. Ensure the table is comprehensive, organized, and professional, covering all significant aspects of the content. Ensure no list item is provided.`
  }
}

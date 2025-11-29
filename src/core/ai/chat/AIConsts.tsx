import { IAvailableModels } from '@/api/services/ai/universalAIProvider'

const BrandLogos = {
  Anthropic: (
    <svg height="1em" stroke-linejoin="round" viewBox="0 0 16 16" width="1em">
      <g transform="translate(0,2)">
        <path
          d="M11.375 0h-2.411L13.352 11.13h2.411L11.375 0ZM4.4 0 0 11.13h2.46l0.9-2.336h4.604l0.9 2.336h2.46L6.924 0H4.4Zm-0.244 6.723 1.506-3.909 1.506 3.909H4.156Z"
          fill="currentColor"
        ></path>
      </g>
    </svg>
  ),
  Deepseek: (
    <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 24 24" width="1em">
      <path
        d="M23.748 4.482c-.254-.124-.364.113-.512.234-.051.039-.094.09-.137.136-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.156-.708-.311-.955-.65-.172-.241-.219-.51-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.093.172.187.129.323-.082.28-.18.552-.266.833-.055.179-.137.217-.329.14a5.526 5.526 0 01-1.736-1.18c-.857-.828-1.631-1.742-2.597-2.458a11.365 11.365 0 00-.689-.471c-.985-.957.13-1.743.388-1.836.27-.098.093-.432-.779-.428-.872.004-1.67.295-2.687.684a3.055 3.055 0 01-.465.137 9.597 9.597 0 00-2.883-.102c-1.885.21-3.39 1.102-4.497 2.623C.082 8.606-.231 10.684.152 12.85c.403 2.284 1.569 4.175 3.36 5.653 1.858 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.133-.284 4.994-1.86.47.234.962.327 1.78.397.63.059 1.236-.03 1.705-.128.735-.156.684-.837.419-.961-2.155-1.004-1.682-.595-2.113-.926 1.096-1.296 2.746-2.642 3.392-7.003.05-.347.007-.565 0-.845-.004-.17.035-.237.23-.256a4.173 4.173 0 001.545-.475c1.396-.763 1.96-2.015 2.093-3.517.02-.23-.004-.467-.247-.588zM11.581 18c-2.089-1.642-3.102-2.183-3.52-2.16-.392.024-.321.471-.235.763.09.288.207.486.371.739.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.167-1.361-.802-2.5-1.86-3.301-3.307-.774-1.393-1.224-2.887-1.298-4.482-.02-.386.093-.522.477-.592a4.696 4.696 0 011.529-.039c2.132.312 3.946 1.265 5.468 2.774.868.86 1.525 1.887 2.202 2.891.72 1.066 1.494 2.082 2.48 2.914.348.292.625.514.891.677-.802.09-2.14.11-3.054-.614zm1-6.44a.306.306 0 01.415-.287.302.302 0 01.2.288.306.306 0 01-.31.307.303.303 0 01-.304-.308zm3.11 1.596c-.2.081-.399.151-.59.16a1.245 1.245 0 01-.798-.254c-.274-.23-.47-.358-.552-.758a1.73 1.73 0 01.016-.588c.07-.327-.008-.537-.239-.727-.187-.156-.426-.199-.688-.199a.559.559 0 01-.254-.078c-.11-.054-.2-.19-.114-.358.028-.054.16-.186.192-.21.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.391.451.462.576.685.914.176.265.336.537.445.848.067.195-.019.354-.25.452z"
        fill="#4D6BFE"
      />
    </svg>
  ),
  XAI: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" fillRule="evenodd" height="1em" viewBox="0 0 24 24" width="1em">
      <path d="M9.27 15.29l7.978-5.897c.391-.29.95-.177 1.137.272.98 2.369.542 5.215-1.41 7.169-1.951 1.954-4.667 2.382-7.149 1.406l-2.711 1.257c3.889 2.661 8.611 2.003 11.562-.953 2.341-2.344 3.066-5.539 2.388-8.42l.006.007c-.983-4.232.242-5.924 2.75-9.383.06-.082.12-.164.179-.248l-3.301 3.305v-.01L9.267 15.292M7.623 16.723c-2.792-2.67-2.31-6.801.071-9.184 1.761-1.763 4.647-2.483 7.166-1.425l2.705-1.25a7.808 7.808 0 00-1.829-1A8.975 8.975 0 005.984 5.83c-2.533 2.536-3.33 6.436-1.962 9.764 1.022 2.487-.653 4.246-2.34 6.022-.599.63-1.199 1.259-1.682 1.925l7.62-6.815" />
    </svg>
  ),
  OpenAI: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" fillRule="evenodd" height="1em" viewBox="0 0 24 24" width="1em">
      <path d="M21.55 10.004a5.416 5.416 0 00-.478-4.501c-1.217-2.09-3.662-3.166-6.05-2.66A5.59 5.59 0 0010.831 1C8.39.995 6.224 2.546 5.473 4.838A5.553 5.553 0 001.76 7.496a5.487 5.487 0 00.691 6.5 5.416 5.416 0 00.477 4.502c1.217 2.09 3.662 3.165 6.05 2.66A5.586 5.586 0 0013.168 23c2.443.006 4.61-1.546 5.361-3.84a5.553 5.553 0 003.715-2.66 5.488 5.488 0 00-.693-6.497v.001zm-8.381 11.558a4.199 4.199 0 01-2.675-.954c.034-.018.093-.05.132-.074l4.44-2.53a.71.71 0 00.364-.623v-6.176l1.877 1.069c.02.01.033.029.036.05v5.115c-.003 2.274-1.87 4.118-4.174 4.123zM4.192 17.78a4.059 4.059 0 01-.498-2.763c.032.02.09.055.131.078l4.44 2.53c.225.13.504.13.73 0l5.42-3.088v2.138a.068.068 0 01-.027.057L9.9 19.288c-1.999 1.136-4.552.46-5.707-1.51h-.001zM3.023 8.216A4.15 4.15 0 015.198 6.41l-.002.151v5.06a.711.711 0 00.364.624l5.42 3.087-1.876 1.07a.067.067 0 01-.063.005l-4.489-2.559c-1.995-1.14-2.679-3.658-1.53-5.63h.001zm15.417 3.54l-5.42-3.088L14.896 7.6a.067.067 0 01.063-.006l4.489 2.557c1.998 1.14 2.683 3.662 1.529 5.633a4.163 4.163 0 01-2.174 1.807V12.38a.71.71 0 00-.363-.623zm1.867-2.773a6.04 6.04 0 00-.132-.078l-4.44-2.53a.731.731 0 00-.729 0l-5.42 3.088V7.325a.068.068 0 01.027-.057L14.1 4.713c2-1.137 4.555-.46 5.707 1.513.487.833.664 1.809.499 2.757h.001zm-11.741 3.81l-1.877-1.068a.065.065 0 01-.036-.051V6.559c.001-2.277 1.873-4.122 4.181-4.12.976 0 1.92.338 2.671.954-.034.018-.092.05-.131.073l-4.44 2.53a.71.71 0 00-.365.623l-.003 6.173v.002zm1.02-2.168L12 9.25l2.414 1.375v2.75L12 14.75l-2.415-1.375v-2.75z" />
    </svg>
  ),
  Google: (
    <svg height="1em" strokeLinejoin="round" viewBox="0 0 16 16" width="1em">
      <path
        d="M8.15991 6.54543V9.64362H12.4654C12.2763 10.64 11.709 11.4837 10.8581 12.0509L13.4544 14.0655C14.9671 12.6692 15.8399 10.6182 15.8399 8.18188C15.8399 7.61461 15.789 7.06911 15.6944 6.54552L8.15991 6.54543Z"
        fill="#4285F4"
      ></path>
      <path
        d="M3.6764 9.52268L3.09083 9.97093L1.01807 11.5855C2.33443 14.1963 5.03241 16 8.15966 16C10.3196 16 12.1305 15.2873 13.4542 14.0655L10.8578 12.0509C10.1451 12.5309 9.23598 12.8219 8.15966 12.8219C6.07967 12.8219 4.31245 11.4182 3.67967 9.5273L3.6764 9.52268Z"
        fill="#34A853"
      ></path>
      <path
        d="M1.01803 4.41455C0.472607 5.49087 0.159912 6.70543 0.159912 7.99995C0.159912 9.29447 0.472607 10.509 1.01803 11.5854C1.01803 11.5926 3.6799 9.51991 3.6799 9.51991C3.5199 9.03991 3.42532 8.53085 3.42532 7.99987C3.42532 7.46889 3.5199 6.95983 3.6799 6.47983L1.01803 4.41455Z"
        fill="#FBBC05"
      ></path>
      <path
        d="M8.15982 3.18545C9.33802 3.18545 10.3853 3.59271 11.2216 4.37818L13.5125 2.0873C12.1234 0.792777 10.3199 0 8.15982 0C5.03257 0 2.33443 1.79636 1.01807 4.41455L3.67985 6.48001C4.31254 4.58908 6.07983 3.18545 8.15982 3.18545Z"
        fill="#EA4335"
      ></path>
    </svg>
  ),
  Mixtral: (
    <svg width="1em" height="0.92em" viewBox="0 0 176 162" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="15" y="1" width="32" height="32" fill="#FFCD00" stroke="#636363" stroke-opacity="0.2" stroke-width="0.5"></rect>
      <rect x="143" y="1" width="32" height="32" fill="#FFCD00" stroke="#636363" stroke-opacity="0.2" stroke-width="0.5"></rect>
      <rect x="15" y="33" width="32" height="32" fill="#FFA400" stroke="#636363" stroke-opacity="0.2" stroke-width="0.5"></rect>
      <rect x="47" y="33" width="32" height="32" fill="#FFA400" stroke="#636363" stroke-opacity="0.2" stroke-width="0.5"></rect>
      <rect x="111" y="33" width="32" height="32" fill="#FFA400" stroke="#636363" stroke-opacity="0.2" stroke-width="0.5"></rect>
      <rect x="143" y="33" width="32" height="32" fill="#FFA400" stroke="#636363" stroke-opacity="0.2" stroke-width="0.5"></rect>
      <rect x="15" y="65" width="32" height="32" fill="#FF7100" stroke="#636363" stroke-opacity="0.2" stroke-width="0.5"></rect>
      <rect x="47" y="65" width="32" height="32" fill="#FF7100" stroke="#636363" stroke-opacity="0.2" stroke-width="0.5"></rect>
      <rect x="79" y="65" width="32" height="32" fill="#FF7100" stroke="#636363" stroke-opacity="0.2" stroke-width="0.5"></rect>
      <rect x="111" y="65" width="32" height="32" fill="#FF7100" stroke="#636363" stroke-opacity="0.2" stroke-width="0.5"></rect>
      <rect x="143" y="65" width="32" height="32" fill="#FF7100" stroke="#636363" stroke-opacity="0.2" stroke-width="0.5"></rect>
      <rect x="15" y="97" width="32" height="32" fill="#FF4902" stroke="#636363" stroke-opacity="0.2" stroke-width="0.5"></rect>
      <rect x="79" y="97" width="32" height="32" fill="#FF4902" stroke="#636363" stroke-opacity="0.2" stroke-width="0.5"></rect>
      <rect x="143" y="97" width="32" height="32" fill="#FF4902" stroke="#636363" stroke-opacity="0.2" stroke-width="0.5"></rect>
      <rect x="15" y="129" width="32" height="32" fill="#FF0006" stroke="#636363" stroke-opacity="0.2" stroke-width="0.5"></rect>
      <rect x="143" y="129" width="32" height="32" fill="#FF0006" stroke="#636363" stroke-opacity="0.2" stroke-width="0.5"></rect>
      <rect y="1" width="16" height="160" fill="black"></rect>
      <rect x="63" y="97" width="16" height="32" fill="black"></rect>
      <rect x="95" y="33" width="16" height="32" fill="black"></rect>
      <rect x="127" y="1" width="16" height="32" fill="black"></rect>
      <rect x="127" y="97" width="16" height="64" fill="black"></rect>
    </svg>
  )
}
const ModelNames: Partial<Record<IAvailableModels, string>> = {
  // OpenAI
  'gpt-4o': 'GPT-4o',
  'gpt-4o-mini': 'GPT-4o mini',
  'gpt-4o-search-preview': 'GPT-4o (Search Preview)',
  'gpt-4o-mini-search-preview': 'GPT-4o mini (Search Preview)',
  'gpt-4.1': 'GPT-4.1',
  'gpt-4.1-mini': 'GPT-4.1 mini',
  'gpt-4.1-nano': 'GPT-4.1 nano',
  o3: 'o3',
  'o3-mini': 'o3-mini',
  'o4-mini': 'o4-mini',

  // Anthropic
  'claude-3-opus-latest': 'Claude 3 Opus',
  'claude-3-5-haiku-latest': 'Claude 3.5 Haiku',
  'claude-3-5-sonnet-latest': 'Claude 3.5 Sonnet',
  'claude-3-7-sonnet-20250219': 'Claude 3.7 Sonnet',
  'claude-4-opus-20250514': 'Claude 4 Opus',
  'claude-4-sonnet-20250514': 'Claude 4 Sonnet',

  // Deepseek
  'deepseek-chat': 'Deepseek-V3',
  'deepseek-reasoner': 'Deepseek R1',

  // XAI (Grok)
  'grok-2': 'Grok 2',
  'grok-2-vision': 'Grok 2 Vision',
  'grok-3': 'Grok 3',
  'grok-3-fast': 'Grok 3 Fast',
  'grok-3-mini': 'Grok 3 Mini',
  'grok-3-mini-fast': 'Grok 3 Mini Fast',

  // Mistral
  'ministral-3b-latest': 'Ministral 3B',
  'ministral-8b-latest': 'Ministral 8B',
  'mistral-small-latest': 'Mistral Small',
  'mistral-large-latest': 'Mistral Large',
  'pixtral-large-latest': 'Pixtral Large',

  // Google
  'gemini-1.5-flash': 'Gemini 1.5 Flash',
  'gemini-1.5-pro': 'Gemini 1.5 Pro',
  'gemini-2.0-flash': 'Gemini 2.0 Flash',
  'gemini-2.0-flash-lite': 'Gemini 2.0 Flash Lite',
  'gemini-2.5-flash-preview-04-17': 'Gemini 2.5 Flash',
  'gemini-2.5-pro-preview-05-06': 'Gemini 2.5 Pro',
  'gemma-3-27b-it': 'Gemma 3 27B'
}
const Models: Record<keyof typeof BrandLogos, IAvailableModels[]> = {
  OpenAI: [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4o-search-preview',
    'gpt-4o-mini-search-preview',
    'gpt-4.1',
    'gpt-4.1-mini',
    'gpt-4.1-nano',
    'o3',
    'o3-mini',
    'o4-mini'
  ],
  Anthropic: [
    'claude-3-opus-latest',
    'claude-3-5-haiku-latest',
    'claude-3-5-sonnet-latest',
    'claude-3-7-sonnet-20250219',
    'claude-4-opus-20250514',
    'claude-4-sonnet-20250514'
  ],
  Deepseek: ['deepseek-chat', 'deepseek-reasoner'],
  Mixtral: ['ministral-3b-latest', 'ministral-8b-latest', 'mistral-small-latest', 'mistral-large-latest', 'pixtral-large-latest'],
  Google: [
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-2.5-flash-preview-04-17',
    'gemini-2.5-pro-preview-05-06',
    'gemma-3-27b-it'
  ],
  XAI: ['grok-2', 'grok-2-vision', 'grok-3', 'grok-3-fast', 'grok-3-mini', 'grok-3-mini-fast']
}
const ModelInfos = {
  OpenAI: [
    {
      model: 'gpt-4o',
      context: 128000,
      input: 2.5,
      output: 10.0,
      description:
        "GPT-4o is OpenAI's flagship multimodal model, capable of processing text, images, and audio. It offers enhanced speed and cost-efficiency compared to GPT-4, making it suitable for a wide range of applications."
    },
    {
      model: 'gpt-4o-mini',
      context: 128000,
      input: 0.15,
      output: 0.6,
      description:
        'GPT-4o-mini is a smaller, more affordable variant of GPT-4o, optimized for tasks requiring lower latency and cost, while still supporting multimodal inputs.'
    },
    {
      model: 'gpt-4o-search-preview',
      context: 128000,
      input: 2.5,
      output: 10.0,
      description:
        'GPT-4o-search-preview is a preview version of GPT-4o with enhanced search capabilities, designed to provide more accurate and relevant information retrieval.'
    },
    {
      model: 'gpt-4o-mini-search-preview',
      context: 128000,
      input: 0.15,
      output: 0.6,
      description:
        'GPT-4o-mini-search-preview combines the efficiency of GPT-4o-mini with advanced search functionalities, suitable for applications needing quick and relevant information access.'
    },
    {
      model: 'gpt-4.1',
      context: 1000000,
      input: 2.0,
      output: 8.0,
      description:
        "GPT-4.1 is OpenAI's developer-focused model, offering high performance in coding, instruction following, and long-context processing, ideal for complex tasks."
    },
    {
      model: 'gpt-4.1-mini',
      context: 1000000,
      input: 0.4,
      output: 1.6,
      description:
        'GPT-4.1-mini balances intelligence, speed, and cost, providing significant performance improvements over previous small models, suitable for a variety of applications.'
    },
    {
      model: 'gpt-4.1-nano',
      context: 1000000,
      input: 0.1,
      output: 0.4,
      description:
        "GPT-4.1-nano is OpenAI's smallest and most cost-effective model, designed for lightweight tasks requiring very low latency, such as classification and autocompletion."
    },
    {
      model: 'o3',
      context: 200000,
      input: 10.0,
      output: 40.0,
      description:
        "OpenAI's o3 model enhances reasoning capabilities and overall safety, improving the AI's handling of complex queries and decision-making processes."
    },
    {
      model: 'o3-mini',
      context: 200000,
      input: 1.1,
      output: 4.4,
      description:
        "o3-mini is a smaller variant of OpenAI's o3 model, offering cost-effective performance for tasks requiring enhanced reasoning and safety."
    },
    {
      model: 'o4-mini',
      context: 200000,
      input: 1.1,
      output: 4.4,
      description:
        'o4-mini builds upon o3-mini, delivering improved performance in coding, math, science, and everyday problem-solving, with added multimodal and tool capabilities.'
    }
  ],
  Anthropic: [
    {
      model: 'claude-3-opus-latest',
      context: 200000,
      input: 15.0,
      output: 75.0,
      description:
        "Claude 3 Opus is Anthropic's most capable model, designed for complex tasks requiring top-level intelligence, fluency, and understanding."
    },
    {
      model: 'claude-3-5-haiku-latest',
      context: 200000,
      input: 0.8,
      output: 4.0,
      description:
        "Claude 3.5 Haiku is Anthropic's fastest model, offering intelligence at blazing speeds, suitable for enterprise applications requiring quick and accurate responses."
    },
    {
      model: 'claude-3-5-sonnet-latest',
      context: 200000,
      input: 3.0,
      output: 15.0,
      description:
        'Claude 3.5 Sonnet provides a high level of intelligence and capability, balancing performance and efficiency for various use cases.'
    },
    {
      model: 'claude-3-7-sonnet-20250219',
      context: 200000,
      input: 3.0,
      output: 15.0,
      description:
        "Claude 3.7 Sonnet introduces 'extended thinking' mode, enabling step-by-step reasoning for complex tasks, with significant improvements in instruction-following and multimodal capabilities."
    },
    {
      model: 'claude-4-opus-20250514',
      context: 200000,
      input: 15.0,
      output: 75.0,
      description:
        "Claude 4 Opus is Anthropic's most advanced model, delivering sustained performance on complex, long-running tasks and agent workflows, ideal for sophisticated AI applications."
    },
    {
      model: 'claude-4-sonnet-20250514',
      context: 200000,
      input: 3.0,
      output: 15.0,
      description:
        "Claude 4 Sonnet significantly improves upon Sonnet 3.7's capabilities, excelling in coding with a state-of-the-art 72.7% on SWE-bench, balancing performance and efficiency."
    }
  ],
  Deepseek: [
    {
      model: 'deepseek-chat',
      context: 128000,
      input: 0.14,
      output: 0.28,
      description:
        'Deepseek Chat is optimized for conversational AI tasks, offering a large context window and cost-effective performance for various applications.'
    },
    {
      model: 'deepseek-reasoner',
      context: 128000,
      input: 0.55,
      output: 2.19,
      description:
        'Deepseek Reasoner is designed for tasks requiring enhanced reasoning capabilities, providing a balance between performance and cost.'
    }
  ],
  XAI: [
    {
      model: 'grok-2',
      context: 131072,
      input: 2,
      output: 10,
      description:
        "Grok-2 is xAI's chatbot developed to provide a 'truth-seeking' alternative to other models, aiming to offer unfiltered and direct responses."
    },
    {
      model: 'grok-2-vision',
      context: 32768,
      input: 2,
      output: 10,
      description:
        "Grok-2 Vision extends Grok-2's capabilities by incorporating vision processing, enabling it to interpret and respond to visual inputs."
    },
    {
      model: 'grok-3',
      context: 131072,
      input: 3,
      output: 15,
      description:
        "Grok 3 is xAI's most advanced model, blending strong reasoning with extensive pretraining knowledge, achieving significant improvements in reasoning, mathematics, coding, and instruction-following tasks."
    },
    {
      model: 'grok-3-fast',
      context: 131072,
      input: 5,
      output: 25,
      description:
        'Grok-3 Fast is a variant of Grok 3, optimized for faster response times while maintaining strong reasoning capabilities.'
    },
    {
      model: 'grok-3-mini',
      context: 131072,
      input: 0.3,
      output: 0.5,
      description:
        'Grok-3 Mini represents a new frontier in cost-efficient reasoning, achieving high performance on STEM tasks with reduced computational requirements.'
    },
    {
      model: 'grok-3-mini-fast',
      context: 131072,
      input: 0.6,
      output: 4,
      description:
        'Grok-3 Mini Fast combines the cost-efficiency of Grok-3 Mini with enhanced speed, suitable for applications requiring quick and accurate responses.'
    }
  ],
  Mixtral: [
    {
      model: 'ministral-3b-latest',
      context: 128000,
      input: 0.04,
      output: 0.04,
      description:
        'Ministral 3B is a compact language model optimized for efficiency, featuring a 128K token context window. It is ideal for orchestrating agentic workflows and specialist tasks with efficient inference.'
    },
    {
      model: 'ministral-8b-latest',
      context: 128000,
      input: 0.1,
      output: 0.1,
      description:
        'Ministral 8B is a mid-sized model supporting a 128K token context window. It is designed for efficient inference with a special interleaved sliding-window attention pattern, suitable for a variety of applications.'
    },
    {
      model: 'mistral-small-latest',
      context: 128000,
      input: 0.1,
      output: 0.3,
      description:
        'Mistral Small is a lightweight model with a 128K token context window, delivering strong performance in handling bulk tasks and ideal for applications requiring swift processing.'
    },
    {
      model: 'mistral-large-latest',
      context: 32000,
      input: 2,
      output: 6,
      description:
        'Mistral Large is a cutting-edge text generation model with top-tier reasoning capabilities. It supports complex multilingual reasoning tasks, including text understanding, transformation, and code generation.'
    },
    {
      model: 'pixtral-large-latest',
      context: 128000,
      input: 2,
      output: 6,
      description:
        'Pixtral Large is a frontier-class multimodal model combining advanced vision capabilities with powerful language understanding. It excels in complex visual reasoning tasks and supports a 128K token context window.'
    }
  ],
  Google: [
    {
      model: 'gemini-1.5-flash',
      context: 1000000,
      input: 0.08,
      output: 0.3,
      description:
        'Gemini 1.5 Flash is optimized for speed and cost-efficiency, offering enhanced reasoning and image understanding capabilities with a 128K token context window.'
    },
    {
      model: 'gemini-1.5-pro',
      context: 1000000,
      input: 1.25,
      output: 5,
      description:
        'Gemini 1.5 Pro is designed for complex tasks, including coding and advanced prompts, featuring a 128K token context window and strong reasoning capabilities.'
    },
    {
      model: 'gemini-2.0-flash',
      context: 1000000,
      input: 0.1,
      output: 0.4,
      description:
        'Gemini 2.0 Flash delivers next-generation features with superior speed, built-in tool use, multimodal generation, and a 1M token context window.'
    },
    {
      model: 'gemini-2.0-flash-lite',
      context: 1000000,
      input: 0.08,
      output: 0.3,
      description:
        'Gemini 2.0 Flash-Lite offers cost-optimized performance for large-scale text output use cases, featuring a 1M token context window and multimodal input.'
    },
    {
      model: 'gemini-2.5-flash-preview-04-17',
      context: 1000000,
      input: 0.15,
      output: 0.6,
      description:
        'Gemini 2.5 Flash Preview is a price-performant model delivering high control and transparency for structured workflows, including podcast generation and customer support.'
    },
    {
      model: 'gemini-2.5-pro-preview-05-06',
      context: 1000000,
      input: 2.5,
      output: 15.0,
      description:
        "Gemini 2.5 Pro Preview is Google's most advanced model for complex tasks, showcasing strong reasoning and coding capabilities with a 1M token context window."
    },
    {
      model: 'gemma-3-27b-it',
      context: 128000,
      input: 0.1,
      output: 0.2,
      description:
        'Gemma 3 27B is a lightweight, state-of-the-art open model from Google, featuring a 128K token context window, multilingual support in over 140 languages, and multimodal capabilities.'
    }
  ]
}

export default {
  BrandLogos,
  ModelNames,
  Models,
  ModelInfos
}

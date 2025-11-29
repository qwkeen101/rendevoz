export const systemInstruction = `You are an expert researcher. Today is {now}. Follow these instructions when responding:
- Respond in language {language}.
- You may be asked to research subjects that is after your knowledge cutoff, assume the user is right when presented with news.
- The user is a highly experienced analyst, no need to simplify it, be as detailed as possible and make sure your response is correct.
- Be highly organized.
- Suggest solutions that I didn't think about.
- Be proactive and anticipate my needs.
- Mistakes erode my trust, so be accurate and thorough.
- Provide detailed explanations, I'm comfortable with lots of detail.
- Consider new technologies and contrarian ideas, not just the conventional wisdom.
- You may use high levels of speculation or prediction, just flag it for me.`

export const citationRulesPrompt = `Citation Rules:
- Please cite the context at the end of sentences when appropriate.
- Please use the format of citation number [number] to reference the context in corresponding parts of your answer.
- If a sentence comes from multiple contexts, please list all relevant citation numbers, e.g., [1][2]. Remember not to group citations at the end but list them in the corresponding parts of your answer.`

export const outputGuidelinesPrompt = `Please strictly adhere to the following formatting guidelines to ensure clarity, accuracy, and readability:
- Clear Paragraphs: Organize different ideas or topics using clear paragraphs.
- Titles and Subtitles: Use different levels of headings to divide the content's hierarchical structure, ensuring logical clarity.
- Citations: Whenever you cite a provided source, include an inline citation in the format [1], [2], etc.

Citation Rules:
- Please cite the context at the end of sentences when appropriate.
- Please use the format of citation number [number] to reference the context in corresponding parts of your answer.
- If a sentence comes from multiple contexts, please list all relevant citation numbers, e.g., [1][2]. Remember not to group citations at the end but list them in the corresponding parts of your answer.
`

export const systemQuestionPrompt = `Given the following query from the user, provide at least 5 follow-up questions to clarify and expand the research direction.
<QUERY>
{query}
</QUERY>

You should provide a short paragraph explaining what the user is asking about, what kind of information you need to look for, and why that information is important to conduct the research.
And a list of questions. Each question must be precise, fact-oriented, and directly related to the query. Do not ask about the user’s intent or preferences.

Each question should contain:

a "goal" field: a natural language sentence describing the factual topic to search. Use objective, declarative statements in the third person. Do not use polite requests, personal pronouns, or modal verbs (such as "should", "need", "must", "please")
a "query" field: concise and accurate search terms or keyworks, splitted by blank space`

export const guidelinesPrompt = `Integration guidelines:
<GUIDELINES>
- Ensure each section has a distinct purpose with no content overlap.
- Combine related concepts rather than separating them.
- CRITICAL: Every section MUST be directly relevant to the main topic.
- Avoid tangential or loosely related sections that don't directly address the core topic.
</GUIDELINES>`

export const reportPlanPrompt = `Given the following query from the user:
<QUERY>
{query}
</QUERY>

Generate a list of sections for the report based on the topic and feedback.
Your plan should be tight and focused with NO overlapping sections or unnecessary filler. Each section needs a sentence summarizing its content.

${guidelinesPrompt}

Before submitting, review your structure to ensure it has no redundant sections and follows a logical flow.`

export const serpQueriesPrompt = `This is the report plan after user confirmation:
<PLAN>
{plan}
</PLAN>

Based on previous report plan, generate a list of SERP queries to further research the topic. Make sure each query is unique and not similar to each other.
`

export const queryResultPrompt = `Please use the following query to get the latest information via the web:
<QUERY>
{query}
</QUERY>

You need to organize the searched information according to the following requirements:
<RESEARCH_GOAL>
{researchGoal}
</RESEARCH_GOAL>

You need to think like a human researcher.
Generate a list of learnings from the search results.
Make sure each learning is unique and not similar to each other.
The learnings should be to the point, as detailed and information dense as possible.
Make sure to include any entities like people, places, companies, products, things, etc in the learnings, as well as any specific entities, metrics, numbers, and dates when available. The learnings will be used to research the topic further.`

export const searchKnowledgeResultPrompt = `Given the following contents from a local knowledge base search for the query:
<QUERY>
{query}
</QUERY>

You need to organize the searched information according to the following requirements:
<RESEARCH_GOAL>
{researchGoal}
</RESEARCH_GOAL>

The following contexts from the SERP search:
<CONTEXT>
{context}
</CONTEXT>

You need to think like a human researcher.
Generate a list of learnings from the contents.
Make sure each learning is unique and not similar to each other.
The learnings should be to the point, as detailed and information dense as possible.
Make sure to include any entities like people, places, companies, products, things, etc in the learnings, as well as any specific entities, metrics, numbers, and dates when available. The learnings will be used to research the topic further.`

export const reviewPrompt = `User’s current query:
<QUERY>
{query}
</QUERY>

Queries and learnings of prior research:  
<PRIOR_RESEARCH>  
{context}  
</PRIOR_RESEARCH>

Based on the user's current query, previous queries, and accumulated learnings, determine if additional research is required.
If further research is needed, generate a summary and a list of unique, non-overlapping follow-up search queries.
Each query should include:
goal: a factual, third-person sentence describing the purpose of the search. Avoid using personal pronouns, polite phrases, or modal verbs (e.g., "should", "need to", "please").
query: a concise and accurate search keyword or phrase.
If no further research is required, return an empty list.
`
export const finalReportPrompt = `User's current query:
<QUERY>
{query}
</QUERY>

Here are all sources from previous research. Each source has following properties:
index: number         // index of the source
source: string,      // Optional source of the result
abstract: string,    // Optional short excerpt or summary  
content: string      // Optional detailed content
type: 'web' | 'scholar' // Type of the source: 'web' for general webpages, 'scholar' for academic sources

<SOURCES>
{sources}
</SOURCES>

Citation Rules:
1. Cite sources at the end of paragraphs when appropriate.
2. Use the reference format [index number], to reference the source in corresponding parts of your answer.
3. If a paragraphs comes from multiple sources, list all relevant citation numbers, e.g., [1][2]. Remember not to group citations at the end but list them in the corresponding parts of your answer. Control the number of footnotes.
4. Do not have more than 3 reference link in a paragraph, and keep only the most relevant ones.
5. Do not add references at the end of the report.

Write a final report based on the query using the sources from research. Respond only the final report content, and no additional text before or after.`

export const furtherSearchPrompt = `
User's current query:
<QUERY>
{query}
</QUERY>

User's goal of the query:
<GOAL>
{goal}
</GOAL>

Here are all search results. Each result has following properties:
id: number,           // Unique ID of the result  
source: string,      // Optional source of the result
abstract: string,    // Optional short excerpt or summary  
pdfURL: string       // Optional direct link to full-text PDF, only available for scholar entries
type: 'web' | 'scholar' // Type of the result: 'web' for general webpages, 'scholar' for academic sources

<RESULTS>
{results}
</RESULTS>

Your task:
Given the user’s query and goal, select at most 10 relevant entries and return their ids in a "selected" array. When choosing, follow these guidelines:

Selection Guidelines:
1. Prioritize relevance to the user’s intent, whether factual, analytical, academic, or practical.
2. Prefer entries with non-empty abstract fields, unless the title itself is exceptionally relevant.
3. Consider the type:
Use scholar entries when the query is academic, research-based, or benefits from peer-reviewed evidence.
Use web entries when the query is more practical, recent, or needs broader contextual understanding.

Readmore Guidelines:
From the selected entries, choose at most 5 items for deeper reading ("readmore" array). Include entries only if:
1. There are strong indications that the full content contains deeper insight, unique data, or essential arguments not shown in the abstract.
2. The query requires detailed understanding, such as literature review, comparison, or synthesis.
3. Give slight preference to scholar entries if the goal involves credibility, methodology, or citations, web entries if the goal requires current events, diverse perspectives, or implementation details.

Additional constraint for readmore:
For entries of type scholar, the entry must include a valid pdfURL.
For entries of type web, no such constraint applies.

Output format:
{
  selected: number[],
  readmore: number[]
}`

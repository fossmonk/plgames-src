const SUBTYPE_DESC_MAP: Record<string, string> = {
  connections: `
  If you're familiar with NYT Connections, you can skip the rest 😎

  For the others, your goal is to find 4 groups of 4 such that the terms in each group 
  belong to a specific category. When you successfully identify a group, its category 
  is revealed along with a color-coded difficulty level: categories are rated 
  yellow, green, blue and purple, with yellow being the most straightforward and 
  purple being the most difficult. The categories may involve wordplay such as 
  palindromes or homophones, increasing the difficulty.

  CONNECT AWAY!
  `,
  mcq: `
  There will be 4 options for each question in quiz. You can select one and submit. You can't
  change your choice once selected. Your score will be shown after you have answered all
  the questions.
  `
};

const SUBTYPE_TO_NAME_MAP: Record<string, string> = {
  connections: "CONNECTIONS",
  mcq: "The One With Multiple Options"
}

export const SubtypeDescriptions = (subtype: string) => {
  return SUBTYPE_DESC_MAP[subtype];
};

export const SubtypeNames = (subtype: string) => {
  return SUBTYPE_TO_NAME_MAP[subtype];
};
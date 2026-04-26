const SUBTYPE_DESC_MAP: Record<string, string> = {
  connections: `
  If you're familiar with NYT Connections, you can skip the rest 😎

  For the others, Find four groups of four words that share a common 
  theme by tapping on the tiles and clicking on submit. Once identified, 
  each category is revealed by a color-coded difficulty level. Can you solve all four?
  `,
  mcq: `
  There will be 4 options for each question in quiz. You can select one and submit. You can't
  change your choice once submitted. Your score will be shown after you have answered all
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
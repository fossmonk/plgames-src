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
  `,
  guess_movie: `
  Guess the movie by looking at the blurred scene from it before the time runs out. As time passes,
  the image gets clearer, and you get less points. If you answer quickly, you get more points. All the best!
  `,
  minixword: `
  Think you’re a crossword whiz? 🧠 Try out our Mini XWord puzzle!

  Fill in the blanks by figuring out the words that fit the clues. 
  The words can be horizontally (across) or vertically (down). 
  Once you fill in all the words, you’ll see your score.
  Don’t worry if you don’t get it right the first time. You can always try again!

  All words are transliterated malayalam words.
  `
};

const SUBTYPE_TO_NAME_MAP: Record<string, string> = {
  connections: "Connections",
  mcq: "The One With Multiple Options",
  guess_movie: "Guess The Movie From The Scene",
  minixword: "Mini XWord"
}

export const SubtypeDescriptions = (subtype: string) => {
  return SUBTYPE_DESC_MAP[subtype];
};

export const SubtypeNames = (subtype: string) => {
  return SUBTYPE_TO_NAME_MAP[subtype];
};
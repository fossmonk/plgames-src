import { Connections } from './puzzles/Connections';
import { MiniXWord } from './puzzles/MiniXWord';

const SUBTYPE_MAP: Record<string, any> = {
  connections: Connections,
  minixword: MiniXWord,
  // wordle: Wordle,
};

export const PuzzleComponent = ({ game }: { game: any }) => {
  const Component = SUBTYPE_MAP[game.subtype];

  if (!Component) return <div>Game type not supported yet!</div>;

  return <Component data={game.data} title={game.title} />;
};
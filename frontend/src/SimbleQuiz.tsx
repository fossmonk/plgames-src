import { Mcq } from './simble_quizzes/Mcq';
import { GuessMovie } from './simble_quizzes/GuessMovie';

const SUBTYPE_MAP: Record<string, any> = {
  mcq: Mcq,
  guess_movie: GuessMovie,
};

export const SimbleQuizComponent = ({ game }: { game: any }) => {
  // If subtype is empty/null, default to 'mcq'
  const subtype = game.subtype || 'mcq';
  const Component = SUBTYPE_MAP[subtype];

  if (!Component) return <div>Quiz type not supported yet!</div>;

  return <Component data={game.data} title={game.title} gameId={game.id} />;
};
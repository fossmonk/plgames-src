import { Mcq } from './quick_quizzes/Mcq';
import { GuessMovie } from './quick_quizzes/GuessMovie';

const SUBTYPE_MAP: Record<string, any> = {
  mcq: Mcq,
  guess_movie: GuessMovie,
};

export const QuickQuizComponent = ({ game }: { game: any }) => {
  // If subtype is empty/null, default to 'mcq'
  const subtype = game.subtype || 'mcq';
  const Component = SUBTYPE_MAP[subtype];

  if (!Component) return <div>Quick Quiz type not supported yet!</div>;

  return <Component data={game.data} title={game.title} />;
};
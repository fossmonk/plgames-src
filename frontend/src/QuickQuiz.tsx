import { Mcq } from './quick_quizzes/Mcq';

const SUBTYPE_MAP: Record<string, any> = {
  mcq: Mcq,
  // Add more quick quiz subtypes here
};

export const QuickQuizComponent = ({ game }: { game: any }) => {
  // If subtype is empty/null, default to 'mcq'
  const subtype = game.subtype || 'mcq';
  const Component = SUBTYPE_MAP[subtype];

  if (!Component) return <div>Quick Quiz type not supported yet!</div>;

  return <Component data={game.data} title={game.title} />;
};
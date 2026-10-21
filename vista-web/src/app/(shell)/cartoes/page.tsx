import { getBanks, getCards } from '@/lib/finance.api';
import { CardsView } from './CardsView';

export default async function CardsPage() {
  const [cards, banks] = await Promise.all([getCards(), getBanks()]);

  return <CardsView cards={cards} banks={banks} />;
}

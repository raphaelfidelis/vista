export const FIND_GOALS_QUERY = Symbol('FindGoalsQuery');

export interface GoalDto {
  id: string;
  name: string;
  targetInCents: number;
  /** AAAA-MM; nulo sem prazo. */
  deadline: string | null;
  accountId: string;
  accountName: string;
  /** O saldo da conta de reserva. */
  balanceInCents: number;
  /** Fração do alvo (1 = 100%); passa de 1 quando superada. */
  progress: number;
  remainingInCents: number;
  /** Meses até o prazo, contando o atual; nulo sem prazo. */
  monthsLeft: number | null;
  deadlinePassed: boolean;
  /** Quanto guardar por mês; nulo sem prazo ou com o prazo vencido. */
  monthlyNeededInCents: number | null;
  createdAt: string;
}

export interface FindGoalsQuery {
  /** Por criação, já com o progresso. */
  execute(userId: string): Promise<GoalDto[]>;
}

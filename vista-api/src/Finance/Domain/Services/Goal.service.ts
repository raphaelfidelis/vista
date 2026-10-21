import { NewGoal } from '../Goal';
import { GoalDto } from '../Queries/FindGoals.query';

export const GOAL_SERVICE = Symbol('GoalService');

/** O dono vem da sessão, nunca do corpo. */
export type CreateGoalInput = Omit<NewGoal, 'userId'>;

/** Só os campos presentes são alterados; deadline nulo tira o prazo. */
export type UpdateGoalInput = Partial<Omit<NewGoal, 'userId'>>;

export interface GoalService {
  create(userId: string, input: CreateGoalInput): Promise<GoalDto>;
  update(userId: string, id: string, input: UpdateGoalInput): Promise<GoalDto>;
  remove(userId: string, id: string): Promise<void>;
}

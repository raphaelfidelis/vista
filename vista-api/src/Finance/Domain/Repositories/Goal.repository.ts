import { Goal } from '../Goal';

export const GOAL_REPOSITORY = Symbol('GoalRepository');

export interface GoalRepository {
  /** Por criação. */
  findAll(userId: string): Promise<Goal[]>;
  findById(userId: string, id: string): Promise<Goal | null>;
  /** A meta da conta: cada conta tem no máximo uma. */
  findByAccount(userId: string, accountId: string): Promise<Goal | null>;
  existsWithAccount(userId: string, accountId: string): Promise<boolean>;
  save(goal: Goal): Promise<void>;
  delete(userId: string, id: string): Promise<void>;
}

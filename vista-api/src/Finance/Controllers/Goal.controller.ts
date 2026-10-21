import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  UseFilters,
} from '@nestjs/common';
import { FIND_GOALS_QUERY } from '../Domain/Queries/FindGoals.query';
import type {
  FindGoalsQuery,
  GoalDto,
} from '../Domain/Queries/FindGoals.query';
import { GOAL_SERVICE } from '../Domain/Services/Goal.service';
import type {
  CreateGoalInput,
  GoalService,
  UpdateGoalInput,
} from '../Domain/Services/Goal.service';
import { FinanceExceptionFilter } from './Finance.filter';
import { CurrentUserId } from '../../Auth/Controllers/Request.decorators';

@Controller('goals')
@UseFilters(FinanceExceptionFilter)
export class GoalController {
  constructor(
    @Inject(FIND_GOALS_QUERY)
    private readonly findGoals: FindGoalsQuery,
    @Inject(GOAL_SERVICE)
    private readonly goals: GoalService,
  ) {}

  @Get()
  findAll(@CurrentUserId() userId: string): Promise<GoalDto[]> {
    return this.findGoals.execute(userId);
  }

  @Post()
  create(
    @CurrentUserId() userId: string,
    @Body() input: CreateGoalInput,
  ): Promise<GoalDto> {
    return this.goals.create(userId, input);
  }

  @Patch(':id')
  update(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() input: UpdateGoalInput,
  ): Promise<GoalDto> {
    return this.goals.update(userId, id, input);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.goals.remove(userId, id);
  }
}

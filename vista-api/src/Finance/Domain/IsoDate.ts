import { FinanceValidationError } from './Errors/FinanceValidation.error';
import { Month } from './Month';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Data AAAA-MM-DD, sem hora: evita que o fuso mude o dia. Devolve o próprio
 * valor, ou recusa com a regra violada.
 */
export function validIsoDate(value: string): string {
  if (!DATE_PATTERN.test(value)) {
    throw new FinanceValidationError('A data deve estar no formato AAAA-MM-DD');
  }

  // 2026-02-30 passa no formato, mas não existe: o Date rola para março.
  const parsed = new Date(`${value}T00:00:00Z`);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value
  ) {
    throw new FinanceValidationError(`Data inexistente: ${value}`);
  }

  // Mesma faixa do `Month`: todo lançamento gravável precisa ser alcançável por
  // alguma consulta de mês. Também barra o ano 0000, que o Postgres recusa.
  if (!Month.supportsYear(parsed.getUTCFullYear())) {
    throw new FinanceValidationError(
      `A data deve ser a partir de ${Month.MIN_YEAR}`,
    );
  }

  return value;
}

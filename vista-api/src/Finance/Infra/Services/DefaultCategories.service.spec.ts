import { Category, CategoryKind } from '../../Domain/Category';
import { DEFAULT_CATEGORIES } from '../../Domain/DefaultCategories';
import { DefaultCategoriesSetup } from './DefaultCategories.service';

const USER = '11111111-1111-4111-8111-111111111111';

function setup(existing: Category[] = []) {
  const categories = {
    findAll: jest.fn<Promise<Category[]>, [string, CategoryKind?]>(),
    findById: jest.fn<Promise<Category | null>, [string, string]>(),
    findByName: jest.fn<
      Promise<Category | null>,
      [string, string, CategoryKind]
    >((userId, name, kind) =>
      Promise.resolve(
        existing.find(
          (c) =>
            c.userId === userId &&
            c.kind === kind &&
            c.name.toLowerCase() === name.toLowerCase(),
        ) ?? null,
      ),
    ),
    save: jest.fn<Promise<void>, [Category]>(() => Promise.resolve()),
    delete: jest.fn<Promise<void>, [string, string]>(),
  };

  return { categories, setup: new DefaultCategoriesSetup(categories) };
}

describe('DefaultCategoriesSetup', () => {
  it('cria as 12 de despesa e as 5 de receita para o dono', async () => {
    const { categories, setup: accountSetup } = setup();

    await accountSetup.prepare(USER);

    const saved = categories.save.mock.calls.map(([c]) => c);
    expect(saved).toHaveLength(17);
    expect(saved.filter((c) => c.kind === 'EXPENSE')).toHaveLength(12);
    expect(saved.filter((c) => c.kind === 'INCOME')).toHaveLength(5);
    expect(saved.every((c) => c.userId === USER)).toBe(true);
    expect(saved.map((c) => `${c.kind}:${c.name}`)).toEqual(
      DEFAULT_CATEGORIES.map((c) => `${c.kind}:${c.name}`),
    );
    expect(categories.findByName).toHaveBeenCalledWith(
      USER,
      'Moradia',
      'EXPENSE',
    );
  });

  it('"Outros" existe nos dois tipos', async () => {
    const { categories, setup: accountSetup } = setup();

    await accountSetup.prepare(USER);

    const outros = categories.save.mock.calls
      .map(([c]) => c)
      .filter((c) => c.name === 'Outros')
      .map((c) => c.kind);
    expect(outros).toEqual(['EXPENSE', 'INCOME']);
  });

  it('não duplica o que já existe com o mesmo nome (sem diferenciar maiúsculas)', async () => {
    const { categories, setup: accountSetup } = setup([
      Category.create({ userId: USER, name: 'mercado', kind: 'EXPENSE' }),
      Category.create({ userId: USER, name: 'Salário', kind: 'INCOME' }),
    ]);

    await accountSetup.prepare(USER);

    const names = categories.save.mock.calls.map(([c]) => c.name);
    expect(names).toHaveLength(15);
    expect(names).not.toContain('Mercado');
    expect(names).not.toContain('Salário');
  });

  it('a categoria de outro usuário não impede a do dono', async () => {
    const { categories, setup: accountSetup } = setup([
      Category.create({
        userId: '99999999-9999-4999-8999-999999999999',
        name: 'Moradia',
        kind: 'EXPENSE',
      }),
    ]);

    await accountSetup.prepare(USER);

    expect(categories.save.mock.calls.map(([c]) => c.name)).toContain(
      'Moradia',
    );
  });

  it('rodar de novo não cria nada', async () => {
    const existing: Category[] = [];
    const { categories, setup: accountSetup } = setup(existing);
    categories.save.mockImplementation((category) => {
      existing.push(category);

      return Promise.resolve();
    });

    await accountSetup.prepare(USER);
    categories.save.mockClear();
    await accountSetup.prepare(USER);

    expect(categories.save).not.toHaveBeenCalled();
  });

  it('todos os nomes padrão são válidos (até 60 caracteres, sem repetição no tipo)', () => {
    const keys = DEFAULT_CATEGORIES.map((c) => `${c.kind}:${c.name}`);

    expect(new Set(keys).size).toBe(keys.length);
    expect(() =>
      DEFAULT_CATEGORIES.forEach((c) =>
        Category.create({ userId: USER, name: c.name, kind: c.kind }),
      ),
    ).not.toThrow();
  });
});

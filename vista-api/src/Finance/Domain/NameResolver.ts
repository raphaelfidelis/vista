/**
 * Resolve o nome a partir do id. Um id fora da lista é inconsistência de
 * dados, não caso de uso: falha com `entity` ("categoria", "conta"…).
 */
export function nameResolver(
  entity: string,
  items: { id: string; name: string }[],
): (id: string) => string {
  const names = new Map(items.map((item) => [item.id, item.name]));

  return (id) => {
    const name = names.get(id);

    if (name === undefined) {
      throw new Error(`Registro referencia ${entity} desconhecido(a): ${id}`);
    }

    return name;
  };
}

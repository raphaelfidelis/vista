'use client';

import { useState } from 'react';
import { Drawer } from '@/components/Drawer';
import { NamesEditor } from '@/components/ManageNamesDialog';
import { Segmented } from '@/components/Segmented';
import type { Category, CategoryKind } from '@/lib/finance';
import type { FormState } from '@/lib/form';

type ManageCategoriesDialogProps = {
  categories: Category[];
  create: (name: string, kind: CategoryKind) => Promise<FormState>;
  rename: (id: string, name: string) => Promise<FormState>;
  remove: (id: string) => Promise<FormState>;
  onClose: () => void;
};

/** Categorias de despesa e de receita: duas listas, uma de cada vez. */
export function ManageCategoriesDialog({
  categories,
  create,
  rename,
  remove,
  onClose,
}: ManageCategoriesDialogProps) {
  const [kind, setKind] = useState<CategoryKind>('EXPENSE');

  return (
    <Drawer title="CATEGORIAS" onClose={onClose}>
      <Segmented
        label="Tipo de categoria"
        value={kind}
        onChange={setKind}
        options={[
          { value: 'EXPENSE', label: 'DESPESAS' },
          { value: 'INCOME', label: 'RECEITAS' },
        ]}
      />
      <NamesEditor
        key={kind}
        noun="categoria"
        items={categories.filter((category) => category.kind === kind)}
        create={(name) => create(name, kind)}
        rename={rename}
        remove={remove}
      />
    </Drawer>
  );
}

'use client';

import { useActionState, useState, useTransition } from 'react';
import { primaryButton, secondaryButton } from '@/components/buttons';
import { DeleteButton } from '@/components/DeleteButton';
import { Drawer } from '@/components/Drawer';
import { fieldClass, FormError } from '@/components/Field';
import { SubmitButton } from '@/components/SubmitButton';
import { initialFormState, type FormState } from '@/lib/form';
import { MAX_NAME_LENGTH } from '@/lib/limits';

type NamedItem = {
  id: string;
  name: string;
};

type ManageNamesDialogProps = {
  title: string;
  /** Rótulo singular em minúsculas: "categoria", "banco". */
  noun: string;
  items: NamedItem[];
  create: (name: string) => Promise<FormState>;
  rename: (id: string, name: string) => Promise<FormState>;
  remove: (id: string) => Promise<FormState>;
  onClose: () => void;
};

type NamesEditorProps = Omit<ManageNamesDialogProps, 'title' | 'onClose'>;

/** Formulário de criação + lista com renomear e excluir, sem o painel em volta. */
export function NamesEditor({
  noun,
  items,
  create,
  rename,
  remove,
}: NamesEditorProps) {
  return (
    <>
      <CreateForm noun={noun} create={create} />
      {items.length === 0 ? (
        <p className="text-dim text-xs">Nenhum item cadastrado.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <NameRow
              key={item.id}
              item={item}
              rename={rename}
              remove={remove}
            />
          ))}
        </ul>
      )}
    </>
  );
}

export function ManageNamesDialog({
  title,
  onClose,
  ...editor
}: ManageNamesDialogProps) {
  return (
    <Drawer title={title} onClose={onClose}>
      <NamesEditor {...editor} />
    </Drawer>
  );
}

type CreateFormProps = Pick<ManageNamesDialogProps, 'noun' | 'create'>;

function CreateForm({ noun, create }: CreateFormProps) {
  const [state, action] = useActionState(
    async (_: FormState, formData: FormData) => {
      const name = String(formData.get('name') ?? '');
      const result = await create(name);

      return result.error === null ? result : { ...result, values: { name } };
    },
    initialFormState,
  );

  return (
    <form action={action} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          name="name"
          maxLength={MAX_NAME_LENGTH}
          type="text"
          autoComplete="off"
          defaultValue={state.values?.name}
          placeholder={`Nova ${noun}`}
          aria-label={`Nome da nova ${noun}`}
          required
          className={fieldClass}
        />
        <SubmitButton label="ADICIONAR" />
      </div>
      <FormError message={state.error} />
    </form>
  );
}

type NameRowProps = Pick<ManageNamesDialogProps, 'rename' | 'remove'> & {
  item: NamedItem;
};

function NameRow({ item, rename, remove }: NameRowProps) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save(formData: FormData) {
    startTransition(async () => {
      const result = await rename(item.id, String(formData.get('name') ?? ''));

      setError(result.error);
      setEditing(result.error !== null);
    });
  }

  if (editing) {
    return (
      <li className="bg-item flex flex-col gap-2 p-2">
        <form action={save} className="flex gap-2">
          <input
            name="name"
            maxLength={MAX_NAME_LENGTH}
            type="text"
            autoComplete="off"
            defaultValue={item.name}
            aria-label={`Novo nome de ${item.name}`}
            required
            autoFocus
            className={fieldClass}
          />
          <button type="submit" disabled={pending} className={primaryButton}>
            SALVAR
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setError(null);
            }}
            className={secondaryButton}
          >
            CANCELAR
          </button>
        </form>
        <FormError message={error} />
      </li>
    );
  }

  return (
    <li className="bg-item flex items-center gap-2 p-2 pl-3">
      <span className="min-w-0 flex-1 truncate text-sm">{item.name}</span>
      <button
        type="button"
        aria-label={`Renomear ${item.name}`}
        onClick={() => setEditing(true)}
        className="text-secondary hover:text-primary flex size-8 cursor-pointer items-center justify-center"
      >
        <span aria-hidden className="icon text-[18px]">
          edit
        </span>
      </button>
      <DeleteButton label={item.name} onDelete={() => remove(item.id)} />
    </li>
  );
}

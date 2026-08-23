export type Accent = {
  label: string;
  value: string;
};

export const accents: Accent[] = [
  { label: 'Lima', value: '#c8f751' },
  { label: 'Ciano', value: '#6ff0dc' },
  { label: 'Âmbar', value: '#f5b23f' },
  { label: 'Violeta', value: '#b48cff' },
];

export const defaultAccent = accents[0].value;

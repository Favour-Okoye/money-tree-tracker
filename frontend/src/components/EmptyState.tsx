interface Props {
  emoji: string;
  title: string;
  hint?: string;
}

export function EmptyState({ emoji, title, hint }: Props) {
  return (
    <div className="py-16 text-center">
      <div className="text-5xl">{emoji}</div>
      <p className="mt-3 font-bold text-stone-600">{title}</p>
      {hint && <p className="mt-1 text-sm text-stone-400">{hint}</p>}
    </div>
  );
}

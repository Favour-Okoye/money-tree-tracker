import { EmptyState } from "../components/EmptyState";

interface Props {
  emoji: string;
  title: string;
  phase: string;
}

export function ComingSoon({ emoji, title, phase }: Props) {
  return (
    <EmptyState
      emoji={emoji}
      title={`${title} — growing soon 🌱`}
      hint={`Planted for ${phase} of the build.`}
    />
  );
}

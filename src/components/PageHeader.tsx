import { Sticker } from "./Decorations";

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="page-header">
      <Sticker tone="butter">{eyebrow}</Sticker>
      <h1 className="mt-5 text-4xl leading-tight text-(--ink) md:text-7xl">
        {title}
      </h1>
      <p className="mt-2 max-w-2xl text-2xl leading-10 text-(--muted)">
        {description}
      </p>
    </header>
  );
}

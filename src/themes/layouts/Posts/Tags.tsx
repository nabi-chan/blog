import { Badge } from '@/themes/components/Badge';

export function Tags() {
  return (
    <aside className="flex flex-col gap-2">
      <h1 className="text-xl font-bold">태그 목록</h1>
      <ul className="flex flex-wrap gap-2">
        <li>
          <Badge className="text-sm">#Tag1</Badge>
        </li>
        <li>
          <Badge className="text-sm">#Tag2</Badge>
        </li>
        <li>
          <Badge className="text-sm">#Tag3</Badge>
        </li>
        <li>
          <Badge className="text-sm">#Tag4</Badge>
        </li>
        <li>
          <Badge className="text-sm">#Tag5</Badge>
        </li>
        <li>
          <Badge className="text-sm">#Tag6</Badge>
        </li>
        <li>
          <Badge className="text-sm">#Tag7</Badge>
        </li>
        <li>
          <Badge className="text-sm">#Tag8</Badge>
        </li>
        <li>
          <Badge className="text-sm">#Tag9</Badge>
        </li>
        <li>
          <Badge className="text-sm">#Tag10</Badge>
        </li>
      </ul>
    </aside>
  );
}

type ChipColor = { id: string; name: string; hex: string };

/**
 * A slot's colour choice rendered as selectable swatch chips. Uses native radio
 * inputs (one group per `name`) styled via `peer-checked`, so it works inside a
 * server-action form with no client JS and stays keyboard-accessible.
 */
export function ColorChips({
  name,
  colors,
  required,
}: {
  name: string;
  colors: ChipColor[];
  required?: boolean;
}) {
  return (
    <div role="radiogroup" className="flex flex-wrap gap-sm">
      {colors.map((c) => (
        <label key={c.id} className="cursor-pointer" title={c.name}>
          <input
            type="radio"
            name={name}
            value={c.id}
            required={required}
            className="peer sr-only"
          />
          <span
            className="block h-9 w-9 rounded-full border-2 border-hairline transition
                       peer-checked:border-ink peer-checked:ring-2 peer-checked:ring-accent-magenta peer-checked:ring-offset-2
                       peer-focus-visible:ring-2 peer-focus-visible:ring-accent-magenta peer-focus-visible:ring-offset-2"
            style={{ background: c.hex }}
          />
          <span className="sr-only">{c.name}</span>
        </label>
      ))}
    </div>
  );
}

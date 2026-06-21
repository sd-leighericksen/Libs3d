import type { OptionSelection } from "@/lib/product-options";

/** Renders chosen product options as labelled colour swatches. */
export function SelectionSummary({
  selections,
  className,
}: {
  selections: unknown;
  className?: string;
}) {
  const list: OptionSelection[] = Array.isArray(selections)
    ? (selections as OptionSelection[])
    : [];
  if (list.length === 0) return null;

  return (
    <div className={className}>
      {list.map((option) => (
        <div
          key={option.optionId}
          className="flex flex-wrap items-center gap-x-sm gap-y-xxs text-body-sm text-ink/70"
        >
          <span className="caption text-ink/60">{option.label}:</span>
          {option.slots.map((slot) => (
            <span
              key={slot.index}
              className="inline-flex items-center gap-[5px]"
              title={slot.colorName}
            >
              <span
                aria-hidden
                className="inline-block h-[14px] w-[14px] rounded-full border border-hairline"
                style={{ background: slot.hex }}
              />
              {slot.colorName}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

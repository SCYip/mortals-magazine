type Props = {
  numeral: string
  label: string
}

/**
 * SectionFolio — magazine-style section divider with Roman numeral + label.
 * Sits at the top of a section to give the page a "chapter" rhythm.
 */
export default function SectionFolio({ numeral, label }: Props) {
  return (
    <div className="folio" aria-hidden="true">
      <span className="folio__rule" />
      <span className="folio__numeral">§ {numeral}</span>
      <span className="folio__diamond" />
      <span>{label}</span>
      <span className="folio__rule" />
    </div>
  )
}

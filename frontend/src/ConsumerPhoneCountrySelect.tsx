import { CaretDown } from '@phosphor-icons/react'
import type { ConsumerLocale } from './shared/catalog'
import type { ClientCountryCode } from './shared/consumerEntryPreferences'

type Country = { countryCode: ClientCountryCode; callingCode: string; names: Record<ConsumerLocale, string> }

export default function ConsumerPhoneCountrySelect({ countries, value, locale, label, onChange }: {
  countries: readonly Country[]; value: ClientCountryCode; locale: ConsumerLocale
  label: string; onChange: (value: ClientCountryCode) => void
}) {
  const selected = countries.find(country => country.countryCode === value) ?? countries[0]
  return <div className="consumer-phone-country">
    <span className="consumer-phone-country-display" aria-hidden="true">{selected.callingCode}<CaretDown size={14} /></span>
    <select aria-label={`${label}: ${selected.names[locale]} ${selected.callingCode}`} value={selected.countryCode}
      onChange={event => onChange(event.target.value as ClientCountryCode)}>
      {countries.map(country => <option key={country.countryCode} value={country.countryCode}>{country.names[locale]} {country.callingCode}</option>)}
    </select>
  </div>
}

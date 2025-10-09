import * as React from "react"
import { Input } from "@/components/ui/input"

const EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "mail.ru",
  "yandex.ru",
  "protonmail.com",
  "aol.com",
  "zoho.com",
]

interface EmailInputWithSuggestionsProps extends React.ComponentProps<"input"> {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export const EmailInputWithSuggestions = React.forwardRef<HTMLInputElement, EmailInputWithSuggestionsProps>(
  ({ className, value, onChange, ...props }, ref) => {
    const [suggestions, setSuggestions] = React.useState<string[]>([])
    const [showDropdown, setShowDropdown] = React.useState(false)
    const inputRef = React.useRef<HTMLInputElement>(null)
    const dropdownRef = React.useRef<HTMLDivElement>(null)

    React.useImperativeHandle(ref, () => inputRef.current!)

    React.useEffect(() => {
      const emailValue = value || ""
      const atIndex = emailValue.indexOf("@")

      if (atIndex > 0) {
        const localPart = emailValue.substring(0, atIndex)
        const domainPart = emailValue.substring(atIndex + 1).toLowerCase()
        
        const filteredDomains = domainPart 
          ? EMAIL_DOMAINS.filter(domain => domain.startsWith(domainPart))
          : EMAIL_DOMAINS

        setSuggestions(filteredDomains.map(domain => `${localPart}@${domain}`))
        setShowDropdown(filteredDomains.length > 0)
      } else {
        setSuggestions([])
        setShowDropdown(false)
      }
    }, [value])

    // Close dropdown when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current && 
          !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current &&
          !inputRef.current.contains(event.target as Node)
        ) {
          setShowDropdown(false)
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSuggestionClick = (suggestion: string) => {
      onChange({
        target: { value: suggestion },
        currentTarget: { value: suggestion },
      } as React.ChangeEvent<HTMLInputElement>)
      setShowDropdown(false)
      setSuggestions([])
    }

    return (
      <div className="relative w-full">
        <Input
          ref={inputRef}
          type="email"
          value={value}
          onChange={onChange}
          className={className}
          autoComplete="off"
          {...props}
        />
        {showDropdown && suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute left-0 right-0 mt-1 bg-white border border-border rounded-md shadow-xl max-h-60 overflow-auto z-[9999999]"
          >
            {suggestions.map((suggestion, index) => {
              const atIndex = suggestion.indexOf("@")
              const localPart = suggestion.substring(0, atIndex)
              const domain = suggestion.substring(atIndex)

              return (
                <div
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-4 py-3 hover:bg-gray-100 cursor-pointer text-base leading-relaxed"
                >
                  <span className="text-gray-900">{localPart}</span>
                  <span className="text-primary font-medium">{domain}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }
)

EmailInputWithSuggestions.displayName = "EmailInputWithSuggestions"

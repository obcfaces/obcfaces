import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

// Popular email domains - gmail.com is always first
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
    const [showSuggestions, setShowSuggestions] = React.useState(false)
    const [suggestions, setSuggestions] = React.useState<string[]>([])
    const inputRef = React.useRef<HTMLInputElement>(null)

    React.useImperativeHandle(ref, () => inputRef.current!)

    React.useEffect(() => {
      const emailValue = value || ""
      const atIndex = emailValue.indexOf("@")

      console.log('Email input changed:', { emailValue, atIndex, hasAt: atIndex > 0 })

      // Show suggestions only if @ is present and there's content before it
      if (atIndex > 0) {
        const localPart = emailValue.substring(0, atIndex)
        const domainPart = emailValue.substring(atIndex + 1).toLowerCase()

        console.log('Generating suggestions:', { localPart, domainPart })

        // Generate suggestions - filter only if user started typing after @
        const filteredDomains = domainPart 
          ? EMAIL_DOMAINS.filter(domain => domain.startsWith(domainPart))
          : EMAIL_DOMAINS

        const newSuggestions = filteredDomains.map(domain => `${localPart}@${domain}`)

        console.log('Suggestions generated:', newSuggestions)

        setSuggestions(newSuggestions)
        setShowSuggestions(newSuggestions.length > 0)
      } else {
        setShowSuggestions(false)
        setSuggestions([])
      }
    }, [value])

    const handleSuggestionClick = (suggestion: string) => {
      console.log('Suggestion clicked:', suggestion)
      const syntheticEvent = {
        target: { value: suggestion },
        currentTarget: { value: suggestion },
      } as React.ChangeEvent<HTMLInputElement>

      onChange(syntheticEvent)
      setShowSuggestions(false)
    }

    console.log('Render state:', { showSuggestions, suggestionsCount: suggestions.length })

    return (
      <div className="relative w-full">
        <Input
          ref={inputRef}
          type="email"
          value={value}
          onChange={onChange}
          className={className}
          {...props}
        />
        {showSuggestions && suggestions.length > 0 && (
          <div
            className="absolute left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-xl max-h-60 overflow-auto"
            style={{ zIndex: 999999, top: '100%' }}
          >
            <ul className="py-1">
              {suggestions.map((suggestion, index) => {
                const atIndex = suggestion.indexOf("@")
                const localPart = suggestion.substring(0, atIndex)
                const domain = suggestion.substring(atIndex)

                return (
                  <li key={index}>
                    <button
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-4 py-2.5 hover:bg-accent transition-colors cursor-pointer text-sm"
                    >
                      <span className="text-foreground">{localPart}</span>
                      <span className="text-primary font-medium">{domain}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    )
  }
)

EmailInputWithSuggestions.displayName = "EmailInputWithSuggestions"

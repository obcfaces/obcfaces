import * as React from "react"
import { createPortal } from "react-dom"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

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
    const [dropdownPosition, setDropdownPosition] = React.useState({ top: 0, left: 0, width: 0 })
    const inputRef = React.useRef<HTMLInputElement>(null)
    const wrapperRef = React.useRef<HTMLDivElement>(null)

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
        
        // Update position when showing suggestions
        if (inputRef.current && filteredDomains.length > 0) {
          const rect = inputRef.current.getBoundingClientRect()
          setDropdownPosition({
            top: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width
          })
        }
      } else {
        setSuggestions([])
      }
    }, [value])

    const handleSuggestionClick = (e: React.MouseEvent, suggestion: string) => {
      e.preventDefault();
      e.stopPropagation();
      
      const syntheticEvent = {
        target: { value: suggestion },
        currentTarget: { value: suggestion },
      } as React.ChangeEvent<HTMLInputElement>
      onChange(syntheticEvent)
      setSuggestions([])
    }

    const showDropdown = suggestions.length > 0

    return (
      <>
        <div ref={wrapperRef} className="relative w-full">
          <Input
            ref={inputRef}
            type="email"
            value={value}
            onChange={onChange}
            className={className}
            autoComplete="off"
            {...props}
          />
        </div>
        {showDropdown && createPortal(
          <div
            style={{
              position: 'absolute',
              top: `${dropdownPosition.top + 4}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
              zIndex: 9999999,
            }}
            className="bg-background border border-border rounded-md shadow-2xl max-h-60 overflow-auto"
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
                      onMouseDown={(e) => handleSuggestionClick(e, suggestion)}
                      className="w-full text-left px-4 py-2.5 hover:bg-accent transition-colors cursor-pointer text-sm"
                    >
                      <span className="text-foreground">{localPart}</span>
                      <span className="text-primary font-medium">{domain}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>,
          document.body
        )}
      </>
    )
  }
)

EmailInputWithSuggestions.displayName = "EmailInputWithSuggestions"

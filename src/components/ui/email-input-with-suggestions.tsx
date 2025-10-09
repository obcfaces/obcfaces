import * as React from "react"
import { createPortal } from "react-dom"
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
    const [dropdownPosition, setDropdownPosition] = React.useState({ top: 0, left: 0, width: 0 })
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

        const newSuggestions = filteredDomains.map(domain => `${localPart}@${domain}`)
        setSuggestions(newSuggestions)
        
        if (newSuggestions.length > 0 && inputRef.current) {
          const rect = inputRef.current.getBoundingClientRect()
          setDropdownPosition({
            top: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width
          })
          setShowDropdown(true)
        } else {
          setShowDropdown(false)
        }
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

      if (showDropdown) {
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [showDropdown])

    const handleSuggestionClick = (suggestion: string) => {
      onChange({
        target: { value: suggestion },
        currentTarget: { value: suggestion },
      } as React.ChangeEvent<HTMLInputElement>)
      setShowDropdown(false)
      setSuggestions([])
      
      // Refocus input after selection
      setTimeout(() => inputRef.current?.focus(), 0)
    }

    return (
      <>
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
        </div>
        {showDropdown && suggestions.length > 0 && createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'absolute',
              top: `${dropdownPosition.top + 4}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
              zIndex: 9999999,
            }}
            className="bg-background border border-border rounded-md shadow-2xl max-h-60 overflow-auto"
            onMouseDown={(e) => e.preventDefault()} // Prevent input blur
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
          </div>,
          document.body
        )}
      </>
    )
  }
)

EmailInputWithSuggestions.displayName = "EmailInputWithSuggestions"

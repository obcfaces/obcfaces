import * as React from "react"
import { createPortal } from "react-dom"
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
    const [selectedIndex, setSelectedIndex] = React.useState(-1)
    const [dropdownPosition, setDropdownPosition] = React.useState({ top: 0, left: 0, width: 0 })
    const inputRef = React.useRef<HTMLInputElement>(null)
    const dropdownRef = React.useRef<HTMLDivElement>(null)
    const containerRef = React.useRef<HTMLDivElement>(null)

    React.useImperativeHandle(ref, () => inputRef.current!)

    // Update dropdown position
    const updateDropdownPosition = React.useCallback(() => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDropdownPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width
        })
      }
    }, [])

    React.useEffect(() => {
      const emailValue = value || ""
      const atIndex = emailValue.indexOf("@")

      // Show suggestions only if @ is present and there's content before it
      if (atIndex > 0) {
        const localPart = emailValue.substring(0, atIndex)
        const domainPart = emailValue.substring(atIndex + 1).toLowerCase()

        // Generate suggestions - filter only if user started typing after @
        const filteredDomains = domainPart 
          ? EMAIL_DOMAINS.filter(domain => domain.startsWith(domainPart))
          : EMAIL_DOMAINS

        const newSuggestions = filteredDomains.map(domain => `${localPart}@${domain}`)

        setSuggestions(newSuggestions)
        setShowSuggestions(newSuggestions.length > 0)
        setSelectedIndex(-1)
        
        // Update position when showing suggestions
        if (newSuggestions.length > 0) {
          updateDropdownPosition()
        }
      } else {
        setShowSuggestions(false)
        setSuggestions([])
        setSelectedIndex(-1)
      }
    }, [value, updateDropdownPosition])

    // Update position on scroll/resize
    React.useEffect(() => {
      if (showSuggestions) {
        const handleScroll = () => updateDropdownPosition()
        const handleResize = () => updateDropdownPosition()
        
        window.addEventListener('scroll', handleScroll, true)
        window.addEventListener('resize', handleResize)
        
        return () => {
          window.removeEventListener('scroll', handleScroll, true)
          window.removeEventListener('resize', handleResize)
        }
      }
    }, [showSuggestions, updateDropdownPosition])

    // Close dropdown when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node) &&
          !containerRef.current?.contains(event.target as Node)
        ) {
          setShowSuggestions(false)
        }
      }

      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleSuggestionClick = (suggestion: string) => {
      const syntheticEvent = {
        target: { value: suggestion },
        currentTarget: { value: suggestion },
      } as React.ChangeEvent<HTMLInputElement>

      onChange(syntheticEvent)
      setShowSuggestions(false)
      setSelectedIndex(-1)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showSuggestions || suggestions.length === 0) return

      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault()
        handleSuggestionClick(suggestions[selectedIndex])
      } else if (e.key === "Escape") {
        setShowSuggestions(false)
        setSelectedIndex(-1)
      }
    }

    const dropdownContent = showSuggestions && suggestions.length > 0 && (
      <div
        ref={dropdownRef}
        style={{
          position: 'fixed',
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          width: `${dropdownPosition.width}px`,
          zIndex: 99999
        }}
        className="mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto"
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
                  className={cn(
                    "w-full text-left px-4 py-2.5 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground outline-none transition-colors cursor-pointer",
                    index === selectedIndex && "bg-accent text-accent-foreground"
                  )}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <span className="text-foreground">{localPart}</span>
                  <span className="text-primary font-medium">{domain}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    )

    return (
      <div ref={containerRef} className="relative w-full">
        <Input
          ref={inputRef}
          type="email"
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          className={className}
          {...props}
        />
        {typeof document !== 'undefined' && createPortal(dropdownContent, document.body)}
      </div>
    )
  }
)

EmailInputWithSuggestions.displayName = "EmailInputWithSuggestions"

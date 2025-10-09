import * as React from "react"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
    const [open, setOpen] = React.useState(false)
    const [suggestions, setSuggestions] = React.useState<string[]>([])
    const inputRef = React.useRef<HTMLInputElement>(null)

    React.useImperativeHandle(ref, () => inputRef.current!)

    React.useEffect(() => {
      const emailValue = value || ""
      const atIndex = emailValue.indexOf("@")

      // Show suggestions only if @ is present and there's content before it
      if (atIndex > 0) {
        const localPart = emailValue.substring(0, atIndex)
        const domainPart = emailValue.substring(atIndex + 1)

        // Generate suggestions
        const newSuggestions = EMAIL_DOMAINS
          .filter(domain => !domainPart || domain.toLowerCase().startsWith(domainPart.toLowerCase()))
          .map(domain => `${localPart}@${domain}`)

        setSuggestions(newSuggestions)
        setOpen(newSuggestions.length > 0)
      } else {
        setOpen(false)
        setSuggestions([])
      }
    }, [value])

    const handleSuggestionClick = (suggestion: string) => {
      // Create a synthetic event to maintain compatibility
      const syntheticEvent = {
        target: { value: suggestion },
        currentTarget: { value: suggestion },
      } as React.ChangeEvent<HTMLInputElement>

      onChange(syntheticEvent)
      setOpen(false)
    }

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Input
            ref={inputRef}
            type="email"
            value={value}
            onChange={onChange}
            className={className}
            {...props}
          />
        </PopoverTrigger>
        {suggestions.length > 0 && (
          <PopoverContent 
            className="w-[var(--radix-popover-trigger-width)] p-0 bg-popover z-[100]" 
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
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
                      className="w-full text-left px-4 py-2.5 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground outline-none transition-colors"
                    >
                      <span className="text-foreground">{localPart}</span>
                      <span className="text-primary font-medium">{domain}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </PopoverContent>
        )}
      </Popover>
    )
  }
)

EmailInputWithSuggestions.displayName = "EmailInputWithSuggestions"

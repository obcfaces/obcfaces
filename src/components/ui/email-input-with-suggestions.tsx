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
    const inputRef = React.useRef<HTMLInputElement>(null)
    const listId = React.useId()

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
      } else {
        setSuggestions([])
      }
    }, [value])

    return (
      <>
        <Input
          ref={inputRef}
          type="email"
          value={value}
          onChange={onChange}
          className={className}
          autoComplete="off"
          list={listId}
          {...props}
        />
        <datalist id={listId}>
          {suggestions.map((suggestion, index) => (
            <option key={index} value={suggestion} />
          ))}
        </datalist>
      </>
    )
  }
)

EmailInputWithSuggestions.displayName = "EmailInputWithSuggestions"

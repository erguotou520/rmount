import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectCustomProps {
  value: string
  onValueChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  className?: string
  disabled?: boolean
}

const SelectCustom = React.forwardRef<
  HTMLDivElement,
  SelectCustomProps
>(({ value, onValueChange, options, placeholder, className, disabled }, ref) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [customValue, setCustomValue] = React.useState("")
  const [isCustom, setIsCustom] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")

  const selectedOption = options.find(option => option.value === value)
  const displayValue = isCustom ? customValue : (selectedOption?.label || "")

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.value.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue)
    setIsCustom(false)
    setSearchTerm("")
    setIsOpen(false)
  }

  const handleCustomInput = (inputValue: string) => {
    setCustomValue(inputValue)
    setIsCustom(true)
    onValueChange(inputValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      setIsOpen(false)
    }
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input
          type="text"
          value={displayValue}
          onChange={(e) => {
            const newValue = e.target.value
            handleCustomInput(newValue)
            setSearchTerm(newValue)
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "选择或输入区域"}
          disabled={disabled}
          className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
          onClick={(e) => e.stopPropagation()}
        />
        <ChevronsUpDown className="h-4 w-4 opacity-50" />
      </button>

      {isOpen && (
        <div className="absolute top-full z-50 w-full mt-1 bg-popover text-popover-foreground border rounded-md shadow-lg">
          <div className="max-h-60 overflow-auto p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  onClick={() => handleSelect(option.value)}
                >
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    {value === option.value && (
                      <Check className="h-4 w-4" />
                    )}
                  </span>
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.value}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-2 px-3 text-sm text-muted-foreground">
                {searchTerm ? "无匹配的区域" : "选择一个区域或输入自定义区域"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
})

SelectCustom.displayName = "SelectCustom"

export { SelectCustom }
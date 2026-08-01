import * as React from "react"

import { cn } from "@/lib/utils"

type SliderProps = Omit<React.ComponentPropsWithoutRef<"input">, "value" | "defaultValue" | "onChange"> & {
  value?: number[]
  defaultValue?: number[]
  onValueChange?: (value: number[]) => void
}

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  disabled,
  ...props
}: SliderProps) {
  const controlledValue = Array.isArray(value) && typeof value[0] === "number" ? value[0] : undefined
  const [internalValue, setInternalValue] = React.useState(
    Array.isArray(defaultValue) && typeof defaultValue[0] === "number" ? defaultValue[0] : min,
  )

  React.useEffect(() => {
    if (typeof controlledValue === "number" && Number.isFinite(controlledValue)) {
      setInternalValue(controlledValue)
    }
  }, [controlledValue])

  const currentValue = typeof controlledValue === "number" ? controlledValue : internalValue

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const next = Number(event.target.value)
    if (!Number.isFinite(next)) return

    if (typeof controlledValue !== "number") {
      setInternalValue(next)
    }
    onValueChange?.([next])
  }

  return (
    <input
      type="range"
      className={cn(
        "h-1 w-full cursor-pointer appearance-none rounded-full bg-muted",
        "[&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-muted",
        "[&::-webkit-slider-thumb]:mt-[-4px] [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-ring [&::-webkit-slider-thumb]:bg-white",
        "[&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-muted",
        "[&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-ring [&::-moz-range-thumb]:bg-white",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      value={currentValue}
      min={min}
      max={max}
      step={step}
      onChange={handleChange}
      disabled={disabled}
      {...props}
    />
  )
}

export { Slider }

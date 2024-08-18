import type { IconName } from '@channel.io/bezier-icons'
import { Checkbox, Tooltip, HStack, LegacyIcon } from '@channel.io/bezier-react'

interface TagCheckboxProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void

  help?: string

  icon: IconName
  label: string
}

export function TagCheckbox({
  checked,
  onCheckedChange,
  help,
  icon,
  label,
}: TagCheckboxProps) {
  return (
    <Checkbox
      checked={checked}
      onCheckedChange={onCheckedChange}
    >
      <Tooltip content={help}>
        <HStack
          spacing={4}
          align="center"
        >
          <LegacyIcon
            name={icon}
            color="txt-black-dark"
            size="s"
          />
          {label}
        </HStack>
      </Tooltip>
    </Checkbox>
  )
}

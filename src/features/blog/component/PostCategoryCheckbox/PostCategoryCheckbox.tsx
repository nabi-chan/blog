import { type BezierIcon } from '@channel.io/bezier-icons'
import { Checkbox, Tooltip, HStack, Icon } from '@channel.io/bezier-react'

interface PostCategoryCheckboxProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void

  help?: string

  icon: BezierIcon
  label: string
}

export function PostCategoryCheckbox({
  checked,
  onCheckedChange,
  help,
  icon,
  label,
}: PostCategoryCheckboxProps) {
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
          <Icon
            source={icon}
            color="txt-black-dark"
            size="s"
          />
          {label}
        </HStack>
      </Tooltip>
    </Checkbox>
  )
}

import type { SelectRef } from '@channel.io/bezier-react'
import { Select as BaseSelect, ListItem } from '@channel.io/bezier-react'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

export type SelectItem<V extends string> = {
  leftContent?: ReactNode
  label: string
  value: V
}

interface SelectProps<V extends string> {
  items: SelectItem<V>[]
  value: V
  name?: string
  defaultValue?: V
  placeholder?: string
  onChange: (event: { target: { name?: string; value: V } }) => void
}

export function Select<V extends string>({
  items,
  value,
  name,
  defaultValue,
  placeholder,
  onChange,
}: SelectProps<V>) {
  const selectRef = useRef<SelectRef>(null)
  const [valueState, setValueState] = useState<V | undefined>(defaultValue)

  useEffect(
    function updateValueStateWhenValueChanged() {
      setValueState(value)
    },
    [value]
  )

  const handleClickItem = (item: SelectItem<V>) => {
    selectRef.current?.handleHideDropdown()
    onChange?.({ target: { name, value: item.value } })
  }

  const selectedItem = useMemo(
    () => items.find((item) => item.value === valueState),
    [items, valueState]
  )

  return (
    <BaseSelect
      placeholder={placeholder}
      text={selectedItem?.label}
      ref={selectRef}
      dropdownStyle={{ width: '100%', padding: 8 }}
    >
      {items.map((item) => (
        <ListItem
          key={item.value}
          leftContent={item.leftContent}
          content={item.label}
          onClick={() => handleClickItem(item)}
        />
      ))}
    </BaseSelect>
  )
}

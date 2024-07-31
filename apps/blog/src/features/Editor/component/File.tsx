import { Button, HStack, VStack, useToast } from '@channel.io/bezier-react'
import { useCallback, useRef, useState } from 'react'
import type { ChangeEvent, HTMLProps } from 'react'
import { CloudUploadIcon } from '@channel.io/bezier-icons'
import { FileUploadInput } from './FileField.styles'

interface FileProps extends HTMLProps<HTMLInputElement> {
  maxFiles?: number
}

export function FileField({ maxFiles, onChange, ...props }: FileProps) {
  const { addToast } = useToast()
  const [isFileUploaded, setIsFileUploaded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const { files } = event.target

      if (!files) {
        addToast(`파일을 선택해주세요.`, {
          preset: 'error',
        })
        return
      }

      if (maxFiles !== undefined && files.length > maxFiles) {
        addToast(`파일은 최대 ${maxFiles}개까지 업로드 가능합니다.`, {
          preset: 'error',
        })
        return
      }

      try {
        onChange?.(event)
      } catch (e) {
        console.error('failed to execute onChange', e)
      }

      inputRef.current!.value = ''
    },
    [addToast, maxFiles, onChange]
  )

  const handleDelete = useCallback(() => {
    onChange?.({
      target: { ...inputRef.current, files: null },
    } as ChangeEvent<HTMLInputElement>)
    setIsFileUploaded(false)
  }, [onChange])

  const handleUploadButtonClick = useCallback(() => {
    inputRef.current?.click()
  }, [])

  return (
    <VStack spacing={4}>
      <FileUploadInput
        type="file"
        ref={inputRef}
        onChange={handleChange}
        {...props}
      />
      <HStack spacing={4}>
        <Button
          colorVariant="monochrome-dark"
          styleVariant="secondary"
          onClick={handleUploadButtonClick}
          leftContent={CloudUploadIcon}
          text="파일 업로드"
        />
        {isFileUploaded && (
          <Button
            colorVariant="monochrome-dark"
            styleVariant="secondary"
            onClick={handleDelete}
            text="초기화"
          />
        )}
      </HStack>
    </VStack>
  )
}

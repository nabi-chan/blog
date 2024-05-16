import {
  BoldIcon,
  ClipIcon,
  CodeBlockIcon,
  HeadingIcon,
  ImageIcon,
  ItalicIcon,
  ListIcon,
  ListNumberIcon,
  TableIcon,
  VideocamIcon,
} from '@channel.io/bezier-icons'
import {
  Box,
  Divider,
  Icon,
  TabAction,
  TabActions,
  TabContent,
  TabItem,
  TabItems,
  TabList,
  Tabs,
  Text,
  Tooltip,
} from '@channel.io/bezier-react'
import { Fragment, useMemo, useRef, useState } from 'react'
import EditorTextArea from './TextArea'
import type { FormattingToolsHandlers } from './_FormattingTools'
import { FormattingTools } from './_FormattingTools'
import { useIgnoreKeyboardActionsWhileComposing } from './useIgnoreKeyboardActionWhileComposing'
import { isModifierKey } from './utils'

export function Editor() {
  const [value, setValue] = useState('')
  const [editorHeight, setEditorHeight] = useState(400)

  const formattingToolsRef = useRef<FormattingToolsHandlers>(null)

  const actions = useMemo(
    () => [
      [
        {
          icon: HeadingIcon,
          description: '제목',
          onClick: () => formattingToolsRef.current?.header(),
        },
        {
          icon: BoldIcon,
          description: '굵음',
          onClick: () => formattingToolsRef.current?.bold(),
        },
        {
          icon: ItalicIcon,
          description: '기울임',
          onClick: () => formattingToolsRef.current?.italic(),
        },
      ],
      [
        {
          icon: ListIcon,
          description: '순서가 없는 목록',
          onClick: () => formattingToolsRef.current?.unorderedList(),
        },
        {
          icon: ListNumberIcon,
          description: '순서가 있는 목록',
          onClick: () => formattingToolsRef.current?.orderedList(),
        },
      ],
      [
        {
          icon: CodeBlockIcon,
          description: '코드블럭',
          onClick: () => formattingToolsRef.current?.code(),
        },
        {
          icon: TableIcon,
          description: '테이블',
          onClick: () => {},
        },
      ],
      [
        {
          icon: ClipIcon,
          description: '파일',
          onClick: () => {},
        },
        {
          icon: ImageIcon,
          description: '이미지',
          onClick: () => formattingToolsRef.current?.image(),
        },
        {
          icon: VideocamIcon,
          description: '비디오',
          onClick: () => {},
        },
      ],
    ],
    []
  )

  const inputCompositionProps = useIgnoreKeyboardActionsWhileComposing(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const format = formattingToolsRef.current

      if (isModifierKey(e)) {
        if (e.key === 'b') format?.bold()
        else if (e.key === 'i') format?.italic()
        else if (e.shiftKey && e.key === '.') format?.quote()
        else if (e.key === 'e') format?.code()
        else if (e.key === 'k') format?.link()
        else if (e.key === '8') format?.unorderedList()
        else if (e.shiftKey && e.key === '7') format?.orderedList()
        else if (e.shiftKey && e.key === 'l') format?.taskList()
        else return

        e.preventDefault()
        e.stopPropagation()
      }
    }
  )

  // TODO(@nabi-chan): add listEditing feature https://github.com/primer/react/blob/main/packages/react/src/drafts/MarkdownEditor/_useListEditing.ts
  // TODO(@nabi-chan): add indenting feature https://github.com/primer/react/blob/main/packages/react/src/drafts/MarkdownEditor/_useIndenting.ts
  // TODO(@nabi-chan): add file handling feature https://github.com/primer/react/blob/main/packages/react/src/drafts/MarkdownEditor/_useFileHandling.ts

  return (
    <Box
      borderWidth={1}
      borderColor="bdr-black-dark"
      borderRadius="8"
    >
      <Tabs defaultValue="editor">
        <TabList
          size="s"
          style={{
            boxSizing: 'border-box',
            backgroundColor: 'var(--bg-black-lightest)',
            padding: '0 8px',
          }}
        >
          <TabItems>
            <TabItem value="editor">에디터</TabItem>
            <TabItem value="preview">미리보기</TabItem>
          </TabItems>

          <TabActions>
            {actions.map((group, index) => (
              <Fragment key={index}>
                {index !== 0 && (
                  <Divider
                    orientation="vertical"
                    style={{ height: 17, width: 2 }}
                  />
                )}
                {group.map(({ icon, description, onClick }, idx) => {
                  return (
                    <Tooltip
                      content={description}
                      key={idx}
                    >
                      {/* @ts-ignore */}
                      <TabAction onClick={onClick}>
                        <Icon
                          source={icon}
                          color="txt-black-darker"
                          size="xs"
                        />
                      </TabAction>
                    </Tooltip>
                  )
                })}
              </Fragment>
            ))}
          </TabActions>
        </TabList>
        <TabContent value="editor">
          <FormattingTools
            forInputId="editor"
            ref={formattingToolsRef}
          />
          <EditorTextArea
            id="editor"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            initialHeight={editorHeight}
            onResize={setEditorHeight}
            {...inputCompositionProps}
          />
        </TabContent>
        <TabContent value="preview">
          <Box
            paddingHorizontal={12}
            paddingVertical={7}
            height={editorHeight}
            overflowY="auto"
          >
            <Text typo="14">{value}</Text>
          </Box>
        </TabContent>
      </Tabs>
    </Box>
  )
}

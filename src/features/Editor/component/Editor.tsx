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
import { Fragment, useMemo, useState } from 'react'
import EditorTextArea from './TextArea'

export function Editor() {
  const [value, setValue] = useState('')
  const [editorHeight, setEditorHeight] = useState(400)

  const actions = useMemo(
    () => [
      [
        {
          icon: HeadingIcon,
          description: '제목',
          onclick: () => {},
        },
        {
          icon: BoldIcon,
          description: '굵음',
          onclick: () => {},
        },
        {
          icon: ItalicIcon,
          description: '기울임',
          onclick: () => {},
        },
      ],
      [
        {
          icon: ListIcon,
          description: '순서가 없는 목록',
          onclick: () => {},
        },
        {
          icon: ListNumberIcon,
          description: '순서가 있는 목록',
          onclick: () => {},
        },
      ],
      [
        {
          icon: CodeBlockIcon,
          description: '코드블럭',
          onclick: () => {},
        },
        {
          icon: TableIcon,
          description: '테이블',
          onclick: () => {},
        },
      ],
      [
        {
          icon: ClipIcon,
          description: '파일',
          onclick: () => {},
        },
        {
          icon: ImageIcon,
          description: '이미지',
          onclick: () => {},
        },
        {
          icon: VideocamIcon,
          description: '비디오',
          onclick: () => {},
        },
      ],
    ],
    []
  )

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
                {group.map(({ icon, description, onclick }, idx) => {
                  return (
                    <Tooltip
                      content={description}
                      key={idx}
                    >
                      <TabAction onClick={onclick}>
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
          <EditorTextArea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            initialHeight={editorHeight}
            onResize={setEditorHeight}
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

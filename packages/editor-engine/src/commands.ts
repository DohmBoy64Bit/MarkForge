import {
  applyHeading,
  applyInlineWrap,
  applyLinePrefix,
  applyLink,
  insertBlock,
  wrapBlock,
  type TextEdit,
  type TextSelection
} from './editingTransforms'

export type EditorCommandGroup = 'inline' | 'block' | 'insert'

export type EditorCommandId =
  | 'format.bold'
  | 'format.italic'
  | 'format.inlineCode'
  | 'format.link'
  | 'block.heading1'
  | 'block.heading2'
  | 'block.heading3'
  | 'block.blockquote'
  | 'block.unorderedList'
  | 'block.orderedList'
  | 'block.taskList'
  | 'block.codeFence'
  | 'insert.horizontalRule'
  | 'insert.table'

export type EditorCommandIcon =
  | 'bold'
  | 'italic'
  | 'inlineCode'
  | 'link'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'blockquote'
  | 'unorderedList'
  | 'orderedList'
  | 'taskList'
  | 'codeFence'
  | 'horizontalRule'
  | 'table'

export type EditorCommand = {
  id: EditorCommandId
  label: string
  icon: EditorCommandIcon
  group: EditorCommandGroup
  shortcut?: string
  execute: (source: string, selection: TextSelection) => TextEdit
}

export const editorCommands: EditorCommand[] = [
  {
    id: 'format.bold',
    label: 'Bold',
    icon: 'bold',
    group: 'inline',
    shortcut: 'Ctrl+B',
    execute: (source, selection) => applyInlineWrap(source, selection, '**', '**', 'bold text')
  },
  {
    id: 'format.italic',
    label: 'Italic',
    icon: 'italic',
    group: 'inline',
    shortcut: 'Ctrl+I',
    execute: (source, selection) => applyInlineWrap(source, selection, '_', '_', 'italic text')
  },
  {
    id: 'format.inlineCode',
    label: 'Inline code',
    icon: 'inlineCode',
    group: 'inline',
    execute: (source, selection) => applyInlineWrap(source, selection, '`', '`', 'code')
  },
  {
    id: 'format.link',
    label: 'Link',
    icon: 'link',
    group: 'inline',
    shortcut: 'Ctrl+K',
    execute: applyLink
  },
  {
    id: 'block.heading1',
    label: 'Heading 1',
    icon: 'heading1',
    group: 'block',
    execute: (source, selection) => applyHeading(source, selection, 1)
  },
  {
    id: 'block.heading2',
    label: 'Heading 2',
    icon: 'heading2',
    group: 'block',
    execute: (source, selection) => applyHeading(source, selection, 2)
  },
  {
    id: 'block.heading3',
    label: 'Heading 3',
    icon: 'heading3',
    group: 'block',
    execute: (source, selection) => applyHeading(source, selection, 3)
  },
  {
    id: 'block.blockquote',
    label: 'Blockquote',
    icon: 'blockquote',
    group: 'block',
    execute: (source, selection) => applyLinePrefix(source, selection, () => '> ')
  },
  {
    id: 'block.unorderedList',
    label: 'Unordered list',
    icon: 'unorderedList',
    group: 'block',
    shortcut: 'Ctrl+Shift+8',
    execute: (source, selection) => applyLinePrefix(source, selection, () => '- ')
  },
  {
    id: 'block.orderedList',
    label: 'Ordered list',
    icon: 'orderedList',
    group: 'block',
    shortcut: 'Ctrl+Shift+7',
    execute: (source, selection) => applyLinePrefix(source, selection, (_line, index) => `${index + 1}. `)
  },
  {
    id: 'block.taskList',
    label: 'Task list',
    icon: 'taskList',
    group: 'block',
    execute: (source, selection) => applyLinePrefix(source, selection, () => '- [ ] ')
  },
  {
    id: 'block.codeFence',
    label: 'Code fence',
    icon: 'codeFence',
    group: 'block',
    execute: (source, selection) => wrapBlock(source, selection, '```\n', '\n```', 'code')
  },
  {
    id: 'insert.horizontalRule',
    label: 'Horizontal rule',
    icon: 'horizontalRule',
    group: 'insert',
    execute: (source, selection) => insertBlock(source, selection, '---')
  },
  {
    id: 'insert.table',
    label: 'Table',
    icon: 'table',
    group: 'insert',
    execute: (source, selection) => insertBlock(source, selection, '| Name | Value |\n| --- | --- |\n| Item | Detail |')
  }
]

export const commandGroups: Array<{ id: EditorCommandGroup; label: string }> = [
  { id: 'inline', label: 'Inline' },
  { id: 'block', label: 'Block' },
  { id: 'insert', label: 'Insert' }
]

export const commandById = Object.fromEntries(
  editorCommands.map(command => [command.id, command])
) as Record<EditorCommandId, EditorCommand>

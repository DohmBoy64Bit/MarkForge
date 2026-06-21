import {
  Bold,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Quote,
  Table2,
  TextCursorInput,
  type LucideIcon
} from 'lucide-react'
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

export type EditorCommand = {
  id: EditorCommandId
  label: string
  icon: LucideIcon
  group: EditorCommandGroup
  shortcut?: string
  execute: (source: string, selection: TextSelection) => TextEdit
}

export const editorCommands: EditorCommand[] = [
  {
    id: 'format.bold',
    label: 'Bold',
    icon: Bold,
    group: 'inline',
    shortcut: 'Ctrl+B',
    execute: (source, selection) => applyInlineWrap(source, selection, '**', '**', 'bold text')
  },
  {
    id: 'format.italic',
    label: 'Italic',
    icon: Italic,
    group: 'inline',
    shortcut: 'Ctrl+I',
    execute: (source, selection) => applyInlineWrap(source, selection, '_', '_', 'italic text')
  },
  {
    id: 'format.inlineCode',
    label: 'Inline code',
    icon: Code2,
    group: 'inline',
    execute: (source, selection) => applyInlineWrap(source, selection, '`', '`', 'code')
  },
  {
    id: 'format.link',
    label: 'Link',
    icon: Link,
    group: 'inline',
    shortcut: 'Ctrl+K',
    execute: applyLink
  },
  {
    id: 'block.heading1',
    label: 'Heading 1',
    icon: Heading1,
    group: 'block',
    execute: (source, selection) => applyHeading(source, selection, 1)
  },
  {
    id: 'block.heading2',
    label: 'Heading 2',
    icon: Heading2,
    group: 'block',
    execute: (source, selection) => applyHeading(source, selection, 2)
  },
  {
    id: 'block.heading3',
    label: 'Heading 3',
    icon: Heading3,
    group: 'block',
    execute: (source, selection) => applyHeading(source, selection, 3)
  },
  {
    id: 'block.blockquote',
    label: 'Blockquote',
    icon: Quote,
    group: 'block',
    execute: (source, selection) => applyLinePrefix(source, selection, () => '> ')
  },
  {
    id: 'block.unorderedList',
    label: 'Unordered list',
    icon: List,
    group: 'block',
    shortcut: 'Ctrl+Shift+8',
    execute: (source, selection) => applyLinePrefix(source, selection, () => '- ')
  },
  {
    id: 'block.orderedList',
    label: 'Ordered list',
    icon: ListOrdered,
    group: 'block',
    shortcut: 'Ctrl+Shift+7',
    execute: (source, selection) => applyLinePrefix(source, selection, (_line, index) => `${index + 1}. `)
  },
  {
    id: 'block.taskList',
    label: 'Task list',
    icon: ListChecks,
    group: 'block',
    execute: (source, selection) => applyLinePrefix(source, selection, () => '- [ ] ')
  },
  {
    id: 'block.codeFence',
    label: 'Code fence',
    icon: TextCursorInput,
    group: 'block',
    execute: (source, selection) => wrapBlock(source, selection, '```\n', '\n```', 'code')
  },
  {
    id: 'insert.horizontalRule',
    label: 'Horizontal rule',
    icon: Minus,
    group: 'insert',
    execute: (source, selection) => insertBlock(source, selection, '---')
  },
  {
    id: 'insert.table',
    label: 'Table',
    icon: Table2,
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

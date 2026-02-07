"use client"

// ============================================================
// Simple Markdown Renderer
// Supports: bold, italic, links, code blocks, lists, tables
// ============================================================

import React from "react"

function parseInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  // Regex for inline markdown: **bold**, *italic*, `code`, [link](url)
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|(\[(.+?)\]\((.+?)\))/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  match = regex.exec(text)
  while (match !== null) {
    // Text before the match
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }

    if (match[1]) {
      // **bold**
      nodes.push(
        <strong key={match.index} className="font-semibold text-foreground">
          {match[2]}
        </strong>
      )
    } else if (match[3]) {
      // *italic*
      nodes.push(
        <em key={match.index} className="italic">
          {match[4]}
        </em>
      )
    } else if (match[5]) {
      // `code`
      nodes.push(
        <code
          key={match.index}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground"
        >
          {match[6]}
        </code>
      )
    } else if (match[7]) {
      // [link](url)
      nodes.push(
        <a
          key={match.index}
          href={match[9]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline underline-offset-2 hover:text-accent/80"
        >
          {match[8]}
        </a>
      )
    }

    lastIndex = match.index + match[0].length
    match = regex.exec(text)
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes.length > 0 ? nodes : [text]
}

function renderTable(lines: string[]): React.ReactNode {
  // First line = header, second = separator, rest = rows
  const headerCells = lines[0]
    .split("|")
    .map((c) => c.trim())
    .filter(Boolean)
  const rows = lines.slice(2).map((line) =>
    line
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean)
  )

  return (
    <div className="my-2 overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {headerCells.map((cell, i) => (
              <th key={i} className="px-3 py-2 text-left font-semibold text-muted-foreground">
                {parseInline(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b border-border last:border-0">
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-1.5 text-foreground">
                  {parseInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n")
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Table detection: line contains | and next line is separator
    if (
      line.includes("|") &&
      i + 1 < lines.length &&
      /^\|?[\s-:|]+\|/.test(lines[i + 1])
    ) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].includes("|")) {
        tableLines.push(lines[i])
        i++
      }
      elements.push(<React.Fragment key={`table-${i}`}>{renderTable(tableLines)}</React.Fragment>)
      continue
    }

    // Code block (```)
    if (line.startsWith("```")) {
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i])
        i++
      }
      i++ // skip closing ```
      elements.push(
        <pre
          key={`code-${i}`}
          className="my-2 overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs text-foreground"
        >
          {codeLines.join("\n")}
        </pre>
      )
      continue
    }

    // Heading (## or ###)
    if (line.startsWith("### ")) {
      elements.push(
        <p key={`h3-${i}`} className="mt-2 text-xs font-bold text-foreground">
          {parseInline(line.slice(4))}
        </p>
      )
      i++
      continue
    }
    if (line.startsWith("## ")) {
      elements.push(
        <p key={`h2-${i}`} className="mt-2 text-sm font-bold text-foreground">
          {parseInline(line.slice(3))}
        </p>
      )
      i++
      continue
    }

    // Unordered list item (- item)
    if (line.startsWith("- ")) {
      const listItems: React.ReactNode[] = []
      while (i < lines.length && lines[i].startsWith("- ")) {
        listItems.push(
          <li key={`li-${i}`} className="ml-4 list-disc text-inherit">
            {parseInline(lines[i].slice(2))}
          </li>
        )
        i++
      }
      elements.push(
        <ul key={`ul-${i}`} className="my-1 space-y-0.5">
          {listItems}
        </ul>
      )
      continue
    }

    // Ordered list item (1. item)
    if (/^\d+\.\s/.test(line)) {
      const listItems: React.ReactNode[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        listItems.push(
          <li key={`oli-${i}`} className="ml-4 list-decimal text-inherit">
            {parseInline(lines[i].replace(/^\d+\.\s/, ""))}
          </li>
        )
        i++
      }
      elements.push(
        <ol key={`ol-${i}`} className="my-1 space-y-0.5">
          {listItems}
        </ol>
      )
      continue
    }

    // Empty line
    if (line.trim() === "") {
      elements.push(<div key={`empty-${i}`} className="h-1" />)
      i++
      continue
    }

    // Normal paragraph
    elements.push(
      <p key={`p-${i}`} className="text-inherit">
        {parseInline(line)}
      </p>
    )
    i++
  }

  return <div className="space-y-1 text-sm leading-relaxed">{elements}</div>
}

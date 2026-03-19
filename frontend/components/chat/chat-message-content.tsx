"use client";

import { Fragment, type ReactNode } from "react";

type Block =
  | {
      type: "paragraph";
      lines: string[];
    }
  | {
      type: "heading";
      level: 1 | 2 | 3;
      content: string;
    }
  | {
      type: "unordered-list";
      items: string[];
    }
  | {
      type: "ordered-list";
      items: string[];
    }
  | {
      type: "code";
      content: string;
    };

const normalizeContent = (content: string) => content.replace(/\r\n?/g, "\n").trim();

const renderInlineMarkdown = (content: string): ReactNode[] => {
  if (!content) {
    return [];
  }

  const parts = content.split(/(\*\*[^*\n]+?\*\*|`[^`\n]+?`|\*[^*\n]+?\*)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`strong-${index}`} className="font-semibold text-ink">
          {renderInlineMarkdown(part.slice(2, -2))}
        </strong>
      );
    }

    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={`em-${index}`} className="italic">
          {renderInlineMarkdown(part.slice(1, -1))}
        </em>
      );
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={`code-${index}`}
          className="rounded-md bg-black/12 px-1.5 py-0.5 font-mono text-[0.95em] text-ink"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return <Fragment key={`text-${index}`}>{part}</Fragment>;
  });
};

const parseBlocks = (content: string): Block[] => {
  const normalizedContent = normalizeContent(content);

  if (!normalizedContent) {
    return [];
  }

  const lines = normalizedContent.split("\n");
  const blocks: Block[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]?.trimEnd() ?? "";
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      continue;
    }

    if (trimmedLine.startsWith("```")) {
      const codeLines: string[] = [];
      let cursor = index + 1;

      while (cursor < lines.length && !lines[cursor].trim().startsWith("```")) {
        codeLines.push(lines[cursor]);
        cursor += 1;
      }

      blocks.push({
        type: "code",
        content: codeLines.join("\n").trimEnd()
      });
      index = cursor;
      continue;
    }

    const headingMatch = trimmedLine.match(/^(#{1,3})\s+(.+)$/);

    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length as 1 | 2 | 3,
        content: headingMatch[2]
      });
      continue;
    }

    const unorderedMatch = trimmedLine.match(/^[-*]\s+(.+)$/);

    if (unorderedMatch) {
      const items: string[] = [unorderedMatch[1]];
      let cursor = index + 1;

      while (cursor < lines.length) {
        const candidate = lines[cursor].trim();
        const match = candidate.match(/^[-*]\s+(.+)$/);

        if (!match) {
          break;
        }

        items.push(match[1]);
        cursor += 1;
      }

      blocks.push({
        type: "unordered-list",
        items
      });
      index = cursor - 1;
      continue;
    }

    const orderedMatch = trimmedLine.match(/^\d+\.\s+(.+)$/);

    if (orderedMatch) {
      const items: string[] = [orderedMatch[1]];
      let cursor = index + 1;

      while (cursor < lines.length) {
        const candidate = lines[cursor].trim();
        const match = candidate.match(/^\d+\.\s+(.+)$/);

        if (!match) {
          break;
        }

        items.push(match[1]);
        cursor += 1;
      }

      blocks.push({
        type: "ordered-list",
        items
      });
      index = cursor - 1;
      continue;
    }

    const paragraphLines: string[] = [trimmedLine];
    let cursor = index + 1;

    while (cursor < lines.length) {
      const candidate = lines[cursor].trimEnd();
      const trimmedCandidate = candidate.trim();

      if (
        !trimmedCandidate ||
        trimmedCandidate.startsWith("```") ||
        /^#{1,3}\s+/.test(trimmedCandidate) ||
        /^[-*]\s+/.test(trimmedCandidate) ||
        /^\d+\.\s+/.test(trimmedCandidate)
      ) {
        break;
      }

      paragraphLines.push(trimmedCandidate);
      cursor += 1;
    }

    blocks.push({
      type: "paragraph",
      lines: paragraphLines
    });
    index = cursor - 1;
  }

  return blocks;
};

type ChatMessageContentProps = {
  content: string;
};

export const ChatMessageContent = ({ content }: ChatMessageContentProps) => {
  const blocks = parseBlocks(content);

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const headingClassName =
            block.level === 1
              ? "text-base font-semibold"
              : block.level === 2
                ? "text-[15px] font-semibold"
                : "text-sm font-semibold";

          return (
            <h3 className={headingClassName} key={`heading-${index}`}>
              {renderInlineMarkdown(block.content)}
            </h3>
          );
        }

        if (block.type === "unordered-list") {
          return (
            <ul className="list-disc space-y-1 pl-5" key={`unordered-${index}`}>
              {block.items.map((item, itemIndex) => (
                <li key={`unordered-item-${itemIndex}`}>
                  {renderInlineMarkdown(item)}
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === "ordered-list") {
          return (
            <ol className="list-decimal space-y-1 pl-5" key={`ordered-${index}`}>
              {block.items.map((item, itemIndex) => (
                <li key={`ordered-item-${itemIndex}`}>
                  {renderInlineMarkdown(item)}
                </li>
              ))}
            </ol>
          );
        }

        if (block.type === "code") {
          return (
            <pre
              className="overflow-x-auto rounded-2xl bg-black/15 px-3 py-3 font-mono text-xs leading-6 text-ink"
              key={`code-${index}`}
            >
              <code>{block.content}</code>
            </pre>
          );
        }

        const paragraphLines = block.lines;

        return (
          <p className="whitespace-pre-wrap" key={`paragraph-${index}`}>
            {paragraphLines.map((line: string, lineIndex: number) => (
              <Fragment key={`line-${lineIndex}`}>
                {lineIndex > 0 ? <br /> : null}
                {renderInlineMarkdown(line)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
};

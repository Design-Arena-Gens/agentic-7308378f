"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Command =
  | "bold"
  | "italic"
  | "underline"
  | "strikeThrough"
  | "insertOrderedList"
  | "insertUnorderedList"
  | "justifyLeft"
  | "justifyCenter"
  | "justifyRight"
  | "justifyFull"
  | "removeFormat"
  | "formatBlock";

type ToolbarButton = {
  label: string;
  command: Command;
  value?: string;
  title: string;
};

const inlineButtons: ToolbarButton[] = [
  { label: "B", command: "bold", title: "Bold (⌘/Ctrl + B)" },
  { label: "I", command: "italic", title: "Italic (⌘/Ctrl + I)" },
  { label: "U", command: "underline", title: "Underline (⌘/Ctrl + U)" },
  { label: "S", command: "strikeThrough", title: "Strikethrough" },
];

const listButtons: ToolbarButton[] = [
  { label: "OL", command: "insertOrderedList", title: "Numbered list" },
  { label: "UL", command: "insertUnorderedList", title: "Bullet list" },
];

const alignmentButtons: ToolbarButton[] = [
  { label: "⯇", command: "justifyLeft", title: "Align left" },
  { label: "⇆", command: "justifyCenter", title: "Align center" },
  { label: "⯈", command: "justifyRight", title: "Align right" },
  { label: "↔︎", command: "justifyFull", title: "Justify" },
];

const blockOptions = [
  { label: "Paragraph", value: "p" },
  { label: "Heading 1", value: "h1" },
  { label: "Heading 2", value: "h2" },
  { label: "Heading 3", value: "h3" },
  { label: "Quote", value: "blockquote" },
];

const DEFAULT_MARKUP =
  "<h2>Tell your story ✨</h2><p>Highlight a sentence to format it or pick a color to make it pop. Everything you write appears instantly in the live preview.</p>";
const DEFAULT_PLAIN = DEFAULT_MARKUP.replace(/<[^>]+>/g, " ")
  .replace(/\s+/g, " ")
  .trim();

export default function Home() {
  const editorRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState<string>(DEFAULT_MARKUP);
  const [plain, setPlain] = useState<string>(DEFAULT_PLAIN);
  const [activeCommands, setActiveCommands] = useState<Record<string, boolean>>(
    {},
  );
  const [blockType, setBlockType] = useState<string>("p");
  const [foreground, setForeground] = useState<string>("#1f2933");
  const [background, setBackground] = useState<string>("#ffffff");

  useEffect(() => {
    const editor = editorRef.current;
    if (editor) {
      editor.innerHTML = DEFAULT_MARKUP;
    }
  }, []);

  const updateStateFromEditor = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }
    setHtml(editor.innerHTML);
    setPlain(editor.innerText);
  }, []);

  const exec = useCallback(
    (command: Command, value?: string) => {
      const editor = editorRef.current;
      if (!editor) {
        return;
      }
      editor.focus();
      if (command === "formatBlock") {
        document.execCommand(command, false, value ?? "p");
      } else {
        document.execCommand(command, false, value);
      }
      updateStateFromEditor();
    },
    [updateStateFromEditor],
  );

  useEffect(() => {
    const handleSelection = () => {
      const editor = editorRef.current;
      const selection = document.getSelection();
      if (!editor || !selection) {
        setActiveCommands({});
        return;
      }
      const withinEditor =
        selection.anchorNode && editor.contains(selection.anchorNode);
      if (!withinEditor) {
        setActiveCommands({});
        return;
      }
      const nextState: Record<string, boolean> = {};
      [...inlineButtons, ...listButtons, ...alignmentButtons].forEach(
        (btn) => {
          try {
            nextState[btn.command] = document.queryCommandState(btn.command);
          } catch {
            nextState[btn.command] = false;
          }
        },
      );
      let currentBlock = "p";
      try {
        const queried = document.queryCommandValue("formatBlock");
        if (queried) {
          currentBlock = queried
            .toString()
            .replace(/[<>]/g, "")
            .toLowerCase();
        }
      } catch {
        currentBlock = "p";
      }
      if (currentBlock === "body") {
        currentBlock = "p";
      }
      setActiveCommands(nextState);
      setBlockType(currentBlock);
    };

    document.addEventListener("selectionchange", handleSelection);
    return () => {
      document.removeEventListener("selectionchange", handleSelection);
    };
  }, []);

  const stats = useMemo(() => {
    const words = plain.trim()
      ? plain
          .trim()
          .split(/\s+/)
          .filter(Boolean).length
      : 0;
    const characters = plain.length;
    const sentences = plain ? plain.split(/[.!?]+/).filter(Boolean).length : 0;
    return { words, characters, sentences };
  }, [plain]);

  const handleInput = useCallback(() => {
    updateStateFromEditor();
  }, [updateStateFromEditor]);

  const handleColorPick = useCallback(
    (command: "foreColor" | "backColor", color: string) => {
      const editor = editorRef.current;
      if (!editor) {
        return;
      }
      editor.focus();
      document.execCommand(command, false, color);
      updateStateFromEditor();
      if (command === "foreColor") {
        setForeground(color);
      } else {
        setBackground(color);
      }
    },
    [updateStateFromEditor],
  );

  const reset = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }
    editor.innerHTML = DEFAULT_MARKUP;
    updateStateFromEditor();
    setForeground("#1f2933");
    setBackground("#ffffff");
    setActiveCommands({});
    setBlockType("p");
  }, [updateStateFromEditor]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-12 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-medium uppercase tracking-[0.35em] text-cyan-400">
            Text Studio
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Format and polish your words in seconds
          </h1>
          <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
            Select text to apply styling, adjust colors, and keep an eye on word
            counts. Your formatted copy stays in sync with the live HTML output
            so it&apos;s ready to drop into any page.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <section className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-slate-950/50 p-3">
              <select
                value={blockType}
                onChange={(event) =>
                  exec("formatBlock", `<${event.target.value}>`)
                }
                onMouseDown={(event) => event.preventDefault()}
                className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-100 outline-none transition hover:border-cyan-500 focus:border-cyan-400"
              >
                {blockOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <div className="h-5 w-px bg-white/15" />

              {[inlineButtons, listButtons, alignmentButtons].map(
                (group, groupIndex) => (
                  <div key={groupIndex} className="flex items-center gap-1">
                    {group.map((button) => (
                      <button
                        key={button.command}
                        type="button"
                        title={button.title}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => exec(button.command, button.value)}
                        className={`rounded-lg border border-transparent px-3 py-2 text-sm font-semibold transition ${
                          activeCommands[button.command]
                            ? "bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400"
                            : "bg-slate-900 text-slate-100 hover:border-slate-700 hover:bg-slate-800"
                        }`}
                      >
                        {button.label}
                      </button>
                    ))}
                    {groupIndex < 2 && (
                      <div className="mx-1 h-5 w-px bg-white/15" />
                    )}
                  </div>
                ),
              )}

              <div className="mx-1 h-5 w-px bg-white/15" />

              <label className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
                Text
                <input
                  type="color"
                  value={foreground}
                  onChange={(event) =>
                    handleColorPick("foreColor", event.target.value)
                  }
                  className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
                />
              </label>

              <label className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
                Highlight
                <input
                  type="color"
                  value={background}
                  onChange={(event) =>
                    handleColorPick("backColor", event.target.value)
                  }
                  className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
                />
              </label>

              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => exec("removeFormat")}
                className="ml-auto rounded-lg border border-white/10 bg-transparent px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:bg-cyan-500/20 hover:text-cyan-100"
              >
                Clear
              </button>
            </div>

            <div className="relative flex-1 rounded-xl border border-white/10 bg-white/5">
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                className="min-h-[320px] w-full resize-none rounded-xl px-4 py-5 text-base leading-relaxed text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              />
              <div className="pointer-events-none absolute inset-0 rounded-xl shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]" />
            </div>
          </section>

          <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
            <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
              Live Preview
            </h2>
            <article className="max-h-80 overflow-y-auto rounded-xl border border-white/10 bg-slate-950/60 p-5 text-sm leading-relaxed text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:text-base">
              <div
                className="flex flex-col gap-3 [&_blockquote]:border-l-4 [&_blockquote]:border-cyan-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_h1]:text-3xl [&_h1]:font-semibold [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:text-xl [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-6"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </article>

            <div className="rounded-xl border border-white/10 bg-slate-950/80 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                HTML output
              </h3>
              <pre className="mt-2 max-h-48 overflow-y-auto rounded-lg bg-black/70 p-3 text-[12px] leading-relaxed text-slate-200">
                <code>{html}</code>
              </pre>
            </div>

            <dl className="grid grid-cols-3 gap-3 rounded-xl border border-white/10 bg-slate-950/70 p-4 text-center text-xs uppercase tracking-wide text-slate-400">
              <div className="flex flex-col gap-1">
                <dt>Words</dt>
                <dd className="text-lg font-semibold text-white">
                  {stats.words}
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt>Characters</dt>
                <dd className="text-lg font-semibold text-white">
                  {stats.characters}
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt>Sentences</dt>
                <dd className="text-lg font-semibold text-white">
                  {stats.sentences}
                </dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-cyan-500 bg-cyan-600/20 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/30"
            >
              Reset to starter copy
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

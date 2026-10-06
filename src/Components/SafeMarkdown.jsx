import { Fragment } from "react";

function inline(text) {
  const parts = String(text).split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index} className="rounded bg-slate-100 px-1 py-0.5 text-[0.9em] text-slate-800">{part.slice(1, -1)}</code>;
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}

function isSeparatorRow(line) {
  return /^\|?\s*:?-{3,}/.test(line) && line.includes("|");
}

function cells(line) {
  return line.replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
}

export default function SafeMarkdown({ content }) {
  const lines = String(content || "").replace(/\r/g, "").split("\n");
  const output = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) { index += 1; continue; }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const Tag = `h${Math.min(level + 1, 5)}`;
      const styles = level === 1
        ? "mb-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl"
        : level === 2
          ? "mt-10 border-b border-slate-200 pb-2 text-xl font-black tracking-tight text-slate-900"
          : "mt-7 flex items-center gap-2 text-base font-extrabold text-slate-900 before:h-5 before:w-1 before:rounded-full before:bg-orange-500";
      output.push(<Tag key={index} className={styles}>{inline(heading[2])}</Tag>);
      index += 1;
      continue;
    }

    if (line.startsWith("|") && lines[index + 1] && isSeparatorRow(lines[index + 1].trim())) {
      const header = cells(line);
      const rows = [];
      index += 2;
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        rows.push(cells(lines[index].trim()));
        index += 1;
      }
      output.push(
        <div key={`table-${index}`} className="my-6 overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-800 text-white"><tr>{header.map((cell, i) => <th key={i} className="px-4 py-3 font-bold">{inline(cell)}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100 bg-white">{rows.map((row, r) => <tr key={r} className="even:bg-slate-50/70">{row.map((cell, c) => <td key={c} className="px-4 py-3 align-top leading-6 text-slate-700">{inline(cell)}</td>)}</tr>)}</tbody>
          </table>
        </div>,
      );
      continue;
    }

    if (/^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      const ordered = /^\d+\./.test(line);
      const listItems = [];
      while (index < lines.length) {
        const current = lines[index].trim();
        const match = ordered ? current.match(/^\d+\.\s+(.+)$/) : current.match(/^[-*]\s+(.+)$/);
        if (!match) break;
        listItems.push(match[1]);
        index += 1;
      }
      const Tag = ordered ? "ol" : "ul";
      output.push(<Tag key={`list-${index}`} className={`my-4 space-y-2 pl-6 text-justify leading-7 text-slate-700 marker:font-bold marker:text-orange-600 ${ordered ? "list-decimal" : "list-disc"}`}>{listItems.map((item, i) => <li key={i}>{inline(item)}</li>)}</Tag>);
      continue;
    }

    if (line.startsWith(">")) {
      output.push(<blockquote key={index} className="my-6 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4 text-justify text-sm font-medium leading-6 text-amber-950 shadow-sm">{inline(line.replace(/^>\s?/, ""))}</blockquote>);
      index += 1;
      continue;
    }

    const paragraph = [line];
    index += 1;
    while (index < lines.length) {
      const next = lines[index].trim();
      if (!next || /^(#{1,4})\s+/.test(next) || /^[-*]\s+/.test(next) || /^\d+\.\s+/.test(next) || next.startsWith(">") || next.startsWith("|")) break;
      paragraph.push(next);
      index += 1;
    }
    output.push(<p key={`p-${index}`} className="my-4 text-justify leading-7 text-slate-700 [hyphens:auto]">{inline(paragraph.join(" "))}</p>);
  }

  return <article lang="es" className="mx-auto max-w-4xl text-[15px] sm:text-base">{output}</article>;
}

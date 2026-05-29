interface MessagePreviewProps {
  title: string;
  text: string;
  muted?: boolean;
}

export function MessagePreview({ title, text, muted = false }: MessagePreviewProps) {
  return (
    <div
      className={`rounded-md border p-3 ${
        muted
          ? "border-slate-200 bg-slate-50 text-slate-500"
          : "border-sky-100 bg-sky-50 text-slate-700"
      }`}
    >
      <p className="text-xs font-semibold uppercase text-slate-500">{title}</p>
      <p className="mt-2 text-sm leading-6">{text}</p>
    </div>
  );
}

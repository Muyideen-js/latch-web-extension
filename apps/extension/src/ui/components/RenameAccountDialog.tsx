import React from 'react'

export function RenameAccountDialog({
  renameDraft,
  onDraftChange,
  onCancel,
  onSave,
}: {
  renameDraft: string
  onDraftChange: (value: string) => void
  onCancel: () => void
  onSave: () => void
}) {
  return (
    <div
      className="absolute inset-0 z-[100] flex justify-center bg-black/45 px-4 pt-[72px]"
      role="presentation"
      onClick={onCancel}
    >
      <div
        className="h-fit w-full max-w-[300px] rounded-2xl border border-border bg-surface/95 p-4 shadow-soft"
        role="dialog"
        aria-labelledby="rename-account-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div id="rename-account-title" className="text-sm font-extrabold">
          Rename account
        </div>
        <input
          value={renameDraft}
          onChange={(e) => onDraftChange(e.target.value)}
          className="mt-3 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-fg shadow-inner outline-none focus:border-primary"
          maxLength={32}
          autoFocus
        />
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-10 flex-1 rounded-full border border-border bg-bg text-sm font-extrabold text-fg hover:bg-surface/60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className="h-10 flex-1 rounded-full bg-primary text-sm font-extrabold text-black shadow-soft"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

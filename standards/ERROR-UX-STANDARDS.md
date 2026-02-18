# Error UX Standards

**Authority:** Nielsen Norman Group, Jakob Nielsen's Heuristics, WCAG 2.2 Error Identification  
**Philosophy:** When the user sees an error, they have already been inconvenienced. Your job is to make recovery as close to zero-friction as possible.  
**Last Updated:** February 2026

---

## The Core Law

> Jakob Nielsen's Heuristic 9: "Help users recognize, diagnose, and recover from errors."

Three things must be true of every error state:
1. **Recognize** — The user notices something went wrong immediately
2. **Diagnose** — The user understands exactly what went wrong, in plain language
3. **Recover** — The user knows exactly what to do next

If any of these three fail, the error experience is broken regardless of how technically correct the error handling code is.

---

## The Error Display Decision Tree

Every error needs to be categorized before deciding how to display it. Use this tree:

```
Is the error blocking the user from proceeding?
├── YES: Is it caused by user input?
│   ├── YES → INLINE (below the field)
│   └── NO: Is it a critical system failure?
│       ├── YES → ERROR PAGE or FULL-PAGE BANNER
│       └── NO → INLINE BANNER (inside the affected section)
└── NO: Can the user continue without fixing it?
    ├── YES: Is it minor and recoverable?
    │   ├── YES → TOAST (top-right, auto-dismiss 5s)
    │   └── NO → INLINE WARNING (persistent, inside section)
    └── NO → This shouldn't exist — if user can't continue, it's blocking
```

---

## Error Display Patterns (MANDATORY)

### Pattern 1: Toast — Transient Non-Blocking Feedback

**Use for:** Action results (saved, copied, sent, deleted), minor warnings, non-critical failures  
**Do not use for:** Form validation errors, errors the user must act on, errors with instructions

```typescript
// ✅ Toast for async action result
const { mutate } = useSaveRecord();

const handleSave = async () => {
  const result = await mutate(data);
  if (result.success) {
    toast.success('Changes saved');
  } else {
    toast.error('Save failed — try again in a moment');
  }
};
```

**Toast rules:**
- Position: top-right (desktop), top-center (mobile)
- Auto-dismiss: 4–5 seconds for success, 6–8 seconds for error (user needs more time to read)
- Max 1–2 toasts visible at once — queue, do not stack infinitely
- Include an X to dismiss manually
- Never include complex instructions in a toast

### Pattern 2: Inline Field Error — Form Validation

**Use for:** Any error tied to a specific form field  
**Never use:** Tooltips, top-of-form summaries as the only indication, modals for field errors

```typescript
// ✅ Error directly below the field
<div className="flex flex-col gap-1">
  <label htmlFor="email" className="text-sm font-medium text-gray-300">
    Email address
  </label>
  <input
    id="email"
    type="email"
    aria-invalid={!!errors.email}
    aria-describedby={errors.email ? 'email-error' : undefined}
    className={cn(
      'rounded-lg border px-3 py-2 text-sm',
      errors.email
        ? 'border-red-500 bg-red-950/20 focus:ring-red-500'
        : 'border-gray-700 bg-gray-900 focus:ring-primary'
    )}
  />
  {errors.email && (
    <p
      id="email-error"
      role="alert"
      className="flex items-center gap-1.5 text-xs text-red-400"
    >
      <AlertCircleIcon className="h-3.5 w-3.5 flex-shrink-0" />
      {errors.email.message}
    </p>
  )}
</div>
```

**Inline error rules:**
- Position: directly below the field, never above or in a tooltip
- Always include an icon (for accessibility — color alone is insufficient per WCAG 1.4.1)
- Field border changes to red — provides redundant indication
- Error disappears the moment the field becomes valid (live update)
- Use `aria-invalid` and `aria-describedby` for screen readers

### Pattern 3: Inline Section Banner — Async Section Failure

**Use for:** A specific section of the page failed to load data, API call for one card failed, a feature within the page is unavailable  
**Do not use:** For the entire page, for form errors

```typescript
// ✅ Section-level error — scoped to the failing area
function ReportsSection() {
  const { data, status, error, retry } = useReports();

  if (status === 'error') {
    return (
      <div className="rounded-xl border border-red-800/50 bg-red-950/20 p-6 text-center">
        <AlertTriangleIcon className="mx-auto mb-3 h-8 w-8 text-red-400" />
        <p className="text-sm font-medium text-red-300">
          Could not load reports
        </p>
        <p className="mt-1 text-xs text-red-400/70">
          {error ?? 'An unexpected error occurred'}
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={retry}
          className="mt-4"
        >
          Try again
        </Button>
      </div>
    );
  }

  return <ReportsContent data={data} />;
}
```

**Section banner rules:**
- Scoped to the section that failed — do not propagate errors up to the whole page
- Always include a retry action
- Keep the rest of the page functional — partial failure should not break everything
- Show specific error message if it helps the user understand and retry

### Pattern 4: Full-Page Error — Critical Failure

**Use for:** Auth failure, page-level data that cannot be loaded, 404/403/500 states  
**Do not use:** For anything recoverable within the current page

```typescript
// app/error.tsx (Next.js App Router global error boundary)
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 text-center">
      <AlertCircleIcon className="h-16 w-16 text-red-400" />
      <div>
        <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
        <p className="mt-2 text-gray-400">
          We could not load this page. This has been logged automatically.
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="secondary" asChild>
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
```

### Pattern 5: Confirmation Modal — Destructive Actions

**Use for:** Irreversible actions (delete, archive, cancel subscription)  
**Do not use:** For errors — use for warnings before an action, not after it

```typescript
// ✅ Before irreversible action
<ConfirmationDialog
  trigger={<Button variant="destructive">Delete record</Button>}
  title="Delete this record?"
  description="This cannot be undone. All associated data will be permanently removed."
  confirmLabel="Yes, delete"
  cancelLabel="Cancel"
  onConfirm={handleDelete}
  variant="destructive"
/>
```

**Confirmation modal rules:**
- The danger action button must be visually distinct (red)
- "Cancel" must be the default / emphasized option — the safe path is easy
- Do not use for errors — this pattern is prevention, not recovery
- Keep the description under 2 sentences

---

## Error Message Copy Standards (MANDATORY)

### The Three-Part Error Formula

Every error message should answer:
1. **What happened** (in plain language, no technical terms)
2. **Why it happened** (if useful and brief)
3. **What to do next** (concrete action)

| ❌ Bad | ✅ Good | Why |
|--------|---------|-----|
| "Error 422" | "We couldn't save your changes" | Codes mean nothing to users |
| "Invalid input" | "Email address is missing the @ symbol" | Specific, actionable |
| "Something went wrong" | "Your session expired — sign in again to continue" | Tells them exactly what to do |
| "Request failed with status 500" | "Our server had a problem. Try again in a few minutes." | Human language, suggests action |
| "Field is required" | "Please enter your email address" | Tells them what, not just that they failed |
| "Username taken" | "That username is already in use — try adding a number or different word" | Gives a path forward |

### Tone Rules

- **Never blame the user.** "You entered an invalid email" → "That doesn't look like a valid email address"
- **Never panic.** "CRITICAL ERROR" → "Something went wrong"
- **Never use jargon.** No HTTP codes, stack traces, or database messages to the user
- **Never apologize excessively.** One "sorry" is fine. Three apologies while they can't use the app is not.
- **Be specific.** Generic messages force users to guess.

---

## Error Visibility Standards (WCAG 1.4.1, 3.3.1)

Per WCAG 2.2:
- **1.4.1 Use of Color:** Error indication must NOT rely on color alone. Always pair color with an icon or text label.
- **3.3.1 Error Identification:** If a field has an error, the item is described to the user in text.

```typescript
// ❌ Color alone — fails WCAG 1.4.1
<input className="border-red-500" />

// ✅ Color + icon + text — passes WCAG 1.4.1 and 3.3.1
<input
  className="border-red-500"
  aria-invalid="true"
  aria-describedby="email-error"
/>
<p id="email-error" className="text-red-400">
  <AlertCircleIcon className="inline mr-1" />  {/* Icon — not color-only */}
  Enter a valid email address
</p>
```

---

## Error State Duration and Persistence

| Error Type | Persistence | Dismissal |
|------------|-------------|-----------|
| Toast (success) | Auto-dismiss 4s | X button also available |
| Toast (error) | Auto-dismiss 6–8s | X button also available |
| Inline field error | Persistent until field is valid | Disappears on valid input |
| Section banner error | Persistent | Retry button, or manual dismiss |
| Full-page error | Persistent | Reset/retry button |
| Confirmation modal | Until user acts | Cancel or Confirm |

**An error that auto-dismisses before the user has had time to read and act is worse than no error at all.**

---

## Network and Offline Error Handling

```typescript
// In your API layer — catch network failures specifically
export async function fetchData<T>(endpoint: string): Promise<T> {
  try {
    const response = await fetch(endpoint, { credentials: 'same-origin' });

    if (!response.ok) {
      // Server returned an error
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error ?? `Request failed (${response.status})`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      // Network is offline or server is unreachable
      throw new Error('No internet connection — check your network and try again');
    }
    throw error;
  }
}
```

---

## Error Boundary Placement (Next.js App Router)

Place error boundaries at these levels:

```
app/
├── error.tsx              ← Catches all unhandled errors globally
├── layout.tsx
└── (routes)/
    ├── dashboard/
    │   ├── error.tsx      ← Catches dashboard-specific errors
    │   └── page.tsx
    └── reports/
        ├── error.tsx      ← Catches reports-specific errors
        └── page.tsx
```

**Rule:** Each major section of the app should have its own `error.tsx` so a failure in one area does not take down the entire app.

---

## Error Checklist (Before Every Commit)

- [ ] Every async operation has an error state rendered in UI (not just `console.error`)
- [ ] Error messages are in plain English — no codes, stack traces, or jargon
- [ ] Error messages follow the three-part formula: what, why, what next
- [ ] Field errors are inline (below the field), not tooltips or top-of-form only
- [ ] Error indicators use icon + color, not color alone
- [ ] `aria-invalid` and `aria-describedby` are set on invalid fields
- [ ] Error toasts have sufficient dismiss duration (6–8s minimum for error toasts)
- [ ] Section failures have a retry action
- [ ] Destructive actions have a confirmation step
- [ ] Error boundary exists for each major page section

---

**Sources:** Nielsen Norman Group "10 Design Guidelines for Reporting Errors in Forms", NN/G "Error-Message Guidelines", NN/G "Hostile Patterns in Error Messages", WCAG 2.2 Success Criteria 1.4.1, 3.3.1, 3.3.3

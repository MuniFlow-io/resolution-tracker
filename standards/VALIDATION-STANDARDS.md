# Validation Standards

**Authority:** Baymard Institute large-scale UX testing, Smashing Magazine UX research, W3C WCAG 2.2 (3.3.x), a11yblog accessibility research 2026  
**Philosophy:** Validate at the right moment. Not too early, not too late, never too loud.  
**Last Updated:** February 2026

---

## The Core Law

> "I don't like how this is like kind of yelling at me before I even had a chance to fill it out." — Actual user in Baymard usability testing

Premature validation is hostile design. It tells users they are wrong before they have finished trying to be right. The job of validation is to help users succeed — not to gatekeep their input before they have had a chance to complete a thought.

**31% of production sites have no inline validation at all.** The goal is to be in the other 69% — but to do it correctly.

---

## Validation Timing Hierarchy (MANDATORY)

There are three moments to validate. Each has the right use case.

### Level 1: On Blur (Default for most fields)

Validate when the user leaves a field — the `onBlur` event. This is the sweet spot: the user has finished their input and is ready to see feedback.

**Use for:** Email, name, URL, text fields, number fields with format requirements

```typescript
// ✅ Validate on blur — user has finished the field
const [emailError, setEmailError] = useState<string | null>(null);

const handleEmailBlur = (value: string) => {
  if (!value) {
    setEmailError('Email address is required');
  } else if (!isValidEmail(value)) {
    setEmailError('Enter a valid email address (example@domain.com)');
  } else {
    setEmailError(null); // Clear error immediately on valid input
  }
};
```

**Critical rule:** When an error is showing, switch from `onBlur` to `onChange` mode immediately — so the error disappears the moment the user fixes it. Do not make them leave the field again to clear the error.

```typescript
// ✅ Error recovery is instant — not wait for blur again
const [hasInteracted, setHasInteracted] = useState(false);

const handleChange = (value: string) => {
  if (hasInteracted) {
    // Only live-validate after first blur interaction
    setEmailError(validateEmail(value));
  }
};

const handleBlur = (value: string) => {
  setHasInteracted(true);
  setEmailError(validateEmail(value));
};
```

### Level 2: On Character Length (Format-dependent fields)

For fields with a known fixed length, validate the moment the correct character count is reached — without waiting for blur.

**Use for:** ZIP codes (5 digits), phone numbers, credit card numbers, CVV codes, OTP codes

```typescript
// ✅ ZIP code — validate at exactly 5 characters
const handleZipChange = (value: string) => {
  const digits = value.replace(/\D/g, '');
  
  if (digits.length === 5) {
    setZipError(isValidUSZip(digits) ? null : 'Enter a valid 5-digit ZIP code');
  } else if (digits.length > 5) {
    setZipError('ZIP code must be 5 digits');
  } else {
    setZipError(null); // Do not error while still typing
  }
};
```

### Level 3: On Submit (Final gate and cross-field rules)

Validate all fields on submit — even ones the user skipped. This is also the place for cross-field validation (e.g., "passwords must match", "end date must be after start date").

```typescript
// ✅ Submit-time validation catches skipped fields and cross-field rules
const handleSubmit = async (data: FormData) => {
  const result = formSchema.safeParse(data);
  
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    setFieldErrors(errors);
    
    // Scroll to first error field
    const firstErrorField = Object.keys(errors)[0];
    document.getElementById(firstErrorField)?.focus();
    return;
  }
  
  await submitForm(result.data);
};
```

---

## The Progressive Validation Pattern (MANDATORY)

This is the gold standard validated by Baymard's large-scale testing: the "submit-then-live" approach.

**Before first submit attempt:** Validate on blur only. No live typing validation.  
**After first submit attempt:** Switch to live validation on all dirty fields.

This pattern means:
- First-time users are not pestered as they explore the form
- Users who hit submit with errors get immediate live feedback as they fix things

```typescript
// hooks/useFormValidation.ts
interface ValidationState {
  errors: Record<string, string | null>;
  hasSubmitted: boolean;
  isValid: boolean;
}

export function useFormValidation<T>(schema: ZodSchema<T>) {
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [values, setValues] = useState<Partial<T>>({});

  const validateField = (name: string, value: unknown) => {
    const fieldSchema = schema.shape?.[name as keyof typeof schema.shape];
    if (!fieldSchema) return null;

    const result = fieldSchema.safeParse(value);
    return result.success ? null : result.error.errors[0].message;
  };

  const handleBlur = (name: string, value: unknown) => {
    setErrors(prev => ({
      ...prev,
      [name]: validateField(name, value),
    }));
  };

  const handleChange = (name: string, value: unknown) => {
    setValues(prev => ({ ...prev, [name]: value }));

    // Live validation only after first submit attempt
    if (hasSubmitted) {
      setErrors(prev => ({
        ...prev,
        [name]: validateField(name, value),
      }));
    }
  };

  const handleSubmit = (onValid: (data: T) => void) => {
    setHasSubmitted(true);
    const result = schema.safeParse(values);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors(
        Object.fromEntries(
          Object.entries(fieldErrors).map(([key, msgs]) => [key, msgs?.[0] ?? null])
        )
      );
      return;
    }

    onValid(result.data);
  };

  return { errors, handleBlur, handleChange, handleSubmit };
}
```

---

## Zod Schema Patterns by Validation Strictness

### Strict Schemas (use for backend / server-side)

Backend validation should be strict. It is the security boundary.

```typescript
// Strict — backend API schema
const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  role: z.enum(['admin', 'user', 'viewer']),
  birthYear: z.number().int().min(1900).max(new Date().getFullYear()),
});
```

### Forgiving Schemas (use for frontend / client-side forms)

Frontend validation should be helpful, not punishing. Trim whitespace automatically. Accept minor variations.

```typescript
// Forgiving — frontend form schema
const contactFormSchema = z.object({
  email: z
    .string()
    .trim() // Auto-trim — user may have trailing space
    .toLowerCase() // Normalize — don't fail for capitalization
    .email('Enter a valid email address'),

  name: z
    .string()
    .trim()
    .min(1, 'Please enter your name'), // "Required" not "min 2 chars"

  phone: z
    .string()
    .optional() // Optional fields should not fail silently
    .transform(val => val?.replace(/\D/g, '')) // Strip formatting — accept (555) 555-5555
    .refine(
      val => !val || val.length === 10 || val.length === 11,
      'Enter a valid phone number'
    ),

  message: z
    .string()
    .trim()
    .min(1, 'Please enter your message')
    .max(2000, 'Message is too long (max 2000 characters)'),
});
```

---

## Edge Case Catalog

These are the situations where naive validation breaks things. Handle them explicitly.

### Edge Case 1: Intentionally Blank Optional Fields

```typescript
// ❌ Fails when user intentionally leaves optional field blank
notes: z.string().min(1, 'Notes cannot be empty'),

// ✅ Optional field — blank is valid
notes: z.string().optional(),

// ✅ Optional but non-empty if provided
notes: z.union([z.string().min(1), z.literal('')]).optional(),
// Or more cleanly:
notes: z.string().optional().or(z.literal('')),
```

### Edge Case 2: Date Fields with Optional Values

```typescript
// Context: User may or may not tag a date on a record

// ❌ Always requires a date
dueDate: z.string().datetime(),

// ✅ Date is optional — empty string or null means "no date"
dueDate: z
  .string()
  .optional()
  .nullable()
  .refine(
    val => !val || !isNaN(Date.parse(val)),
    'Enter a valid date'
  ),

// In the UI — allow clearing the date
const handleDateChange = (value: string) => {
  // Empty string = intentional clear. Not an error.
  setValue('dueDate', value || null);
};
```

### Edge Case 3: Whitespace-Only Input

```typescript
// ❌ Passes validation but is meaningless
name: z.string().min(1), // "   " passes this

// ✅ Trim before checking length
name: z.string().trim().min(1, 'Please enter your name'),
```

### Edge Case 4: Phone Number Formatting

```typescript
// ❌ Fails for any formatting variation the user types
phone: z.string().regex(/^\d{10}$/, 'Invalid phone'),
// Fails: (555) 555-5555, 555-555-5555, +1 5555555555

// ✅ Strip formatting, then validate digits
phone: z
  .string()
  .optional()
  .transform(val => val?.replace(/[\s\-\(\)\+]/g, '') ?? '')
  .refine(
    val => !val || /^\d{10,11}$/.test(val),
    'Enter a valid phone number'
  ),
```

### Edge Case 5: Rich Text / Document Content

```typescript
// Context: User inputs into a rich text editor or document field

// ❌ Fails when editor outputs empty HTML like "<p></p>"
content: z.string().min(1),

// ✅ Strip HTML tags before measuring length
content: z
  .string()
  .transform(html => html.replace(/<[^>]*>/g, '').trim())
  .refine(
    plain => plain.length > 0,
    'Please enter some content'
  ),
```

### Edge Case 6: URL Fields

```typescript
// ❌ Too strict — user forgot https://
url: z.string().url(),

// ✅ Auto-prepend protocol if missing
url: z
  .string()
  .optional()
  .transform(val => {
    if (!val) return val;
    if (val && !val.startsWith('http')) return `https://${val}`;
    return val;
  })
  .refine(
    val => !val || z.string().url().safeParse(val).success,
    'Enter a valid URL'
  ),
```

---

## Positive Validation (Build Confidence, Not Just Catch Errors)

For complex fields, show a green confirmation when the input is valid. This is especially valuable for password strength, email confirmation, and credit card numbers.

```typescript
// ✅ Show success state for fields where validity is non-obvious
<div className="flex flex-col gap-1">
  <input
    className={cn(
      'rounded-lg border px-3 py-2 text-sm transition-colors',
      fieldState === 'valid' && 'border-green-500 bg-green-950/10',
      fieldState === 'invalid' && 'border-red-500 bg-red-950/20',
      fieldState === 'idle' && 'border-gray-700 bg-gray-900'
    )}
  />
  {fieldState === 'valid' && (
    <p className="flex items-center gap-1 text-xs text-green-400">
      <CheckCircleIcon className="h-3.5 w-3.5" />
      Looks good
    </p>
  )}
  {fieldState === 'invalid' && <InlineError message={error} />}
</div>
```

**When to show positive validation:**
- Password fields (strength indicator + requirements met)
- Email confirmation / password confirmation fields
- Username availability checks (async)
- Credit card / routing number fields

**When NOT to show positive validation:**
- Simple required text fields (a checkmark on "Name" is noise)
- Fields with only one rule (required only)

---

## Validation vs. Sanitization

These are different operations and both are required.

| | Validation | Sanitization |
|--|------------|-------------|
| **What** | Checks if input is acceptable | Cleans / normalizes input |
| **When** | Frontend (UX) + Backend (security) | Backend before storage |
| **Frontend role** | User-facing error messages | Auto-fix minor issues (trim, lowercase) |
| **Backend role** | Block invalid data | Strip dangerous content |

```typescript
// Frontend: validate + lightly sanitize for UX
const email = value.trim().toLowerCase(); // Sanitize first
const isValid = z.string().email().safeParse(email).success; // Then validate

// Backend: validate + fully sanitize before storage
// Never trust the frontend's sanitization — always re-sanitize on the server
```

---

## Real-Time Async Validation (e.g., Username/Email Availability)

```typescript
// ✅ Debounce async checks — don't fire on every keystroke
const debouncedCheckUsername = useMemo(
  () =>
    debounce(async (username: string) => {
      if (username.length < 3) return;
      const { available } = await checkUsernameAvailability(username);
      setUsernameState(available ? 'available' : 'taken');
    }, 400), // 400ms debounce — feels responsive without spamming API
  []
);

// States: 'idle' | 'checking' | 'available' | 'taken'
```

---

## Accessibility Requirements for Validation (WCAG 3.3.x)

- **3.3.1 Error Identification:** Errors must be described in text (not just visually)
- **3.3.2 Labels or Instructions:** Provide instructions before a field if the format is non-obvious
- **3.3.3 Error Suggestion:** If the correct value is known, suggest it in the error message
- **3.3.4 Error Prevention:** For important submissions (legal, financial, irreversible), provide review/confirm step

```typescript
// WCAG 3.3.2 — Format instructions before the field
<label htmlFor="phone">
  Phone number
  <span className="text-xs text-gray-400 ml-2">(10 digits, US only)</span>
</label>

// WCAG 3.3.3 — Suggest correction
// ❌ "Invalid email"
// ✅ "Did you mean name@gmail.com?"
```

---

## Validation Checklist (Before Every Commit)

- [ ] No validation fires before the user has touched the field
- [ ] After first submit attempt, errors update live as user types
- [ ] Optional fields accept empty/null without error
- [ ] Fields with whitespace are trimmed before length checks
- [ ] Date fields allow null/empty as "no date selected"
- [ ] Phone/ZIP/credit card fields strip formatting before validation
- [ ] Error messages follow the three-part formula from ERROR-UX-STANDARDS.md
- [ ] `aria-invalid` set on invalid fields
- [ ] `aria-describedby` links field to error message element
- [ ] Backend always re-validates even if frontend already did
- [ ] Destructive or irreversible actions have a review step (WCAG 3.3.4)

---

**Sources:** Baymard Institute "Usability Testing of Inline Form Validation" (Jan 2024), Smashing Magazine "A Complete Guide to Live Validation UX", a11yblog "Why real-time form validation can become an accessibility issue" (Feb 2026), WCAG 2.2 Success Criteria 3.3.1–3.3.4

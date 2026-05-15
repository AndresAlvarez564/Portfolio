# Frontend

> Status: Complete
> Assigned ticket: TK-22

---

## Overview

The frontend is a React SPA built with Vite and TypeScript. It serves two audiences:

- **Public visitors** — portfolio website with projects, experience, skills, certifications, and contact form.
- **Admin (Andres)** — protected panel to manage all portfolio content.

The app is hosted on S3 and served globally via CloudFront. React Router handles client-side routing with a 404 → `index.html` fallback configured at the CloudFront level.

---

## Tech Stack

| Tool | Purpose |
|---|---|
| React 19 + Vite | UI framework and build tool |
| TypeScript | Type safety |
| TailwindCSS v4 | Utility-first styling |
| Ant Design | UI component library |
| React Router DOM v7 | Client-side routing |
| React Hook Form + Yup | Form state and validation |
| AWS Amplify v6 | Cognito authentication |

---

## Folder Structure

```text
front/src/
├── config/
│   └── amplify.ts          # Amplify + API config — reads from env vars
├── constants/
│   └── index.ts            # ROUTES, APP_NAME, shared constants
├── context/
│   └── AuthContext.tsx     # AuthProvider and useAuthContext hook
├── hooks/
│   └── useAuth.ts          # Core auth hook — session, signIn, signOut
├── services/
│   └── api.ts              # Base fetch client with standard error handling
├── components/
│   ├── AdminLayout.tsx     # Protected layout with nav bar and logout button
│   └── ProtectedRoute.tsx  # Route guard — redirects unauthenticated users
├── pages/
│   ├── public/
│   │   ├── HomePage.tsx
│   │   ├── ProjectsPage.tsx
│   │   ├── AccessDeniedPage.tsx
│   │   └── NotFoundPage.tsx
│   └── admin/
│       ├── LoginPage.tsx
│       └── DashboardPage.tsx
├── types/
│   └── index.ts            # ApiError, ApiResponse shared types
└── test/
    └── setup.ts            # Vitest + jest-dom setup
```

Rules:
- Pages contain high-level JSX only — no business logic.
- Business logic lives in hooks.
- API calls live in services.
- Shared UI lives in components.

---

## Amplify Configuration

Amplify is configured once at app startup in `main.tsx`:

```ts
import { Amplify } from "aws-amplify";
import { amplifyConfig } from "./config/amplify";

Amplify.configure(amplifyConfig);
```

`amplifyConfig` reads from environment variables:

| Variable | Value source |
|---|---|
| `VITE_USER_POOL_ID` | CloudFormation output `portfolio-<stage>-user-pool-id` |
| `VITE_USER_POOL_CLIENT_ID` | CloudFormation output `portfolio-<stage>-user-pool-client-id` |
| `VITE_API_URL` | CloudFormation output `portfolio-<stage>-api-url` |
| `VITE_MEDIA_URL` | CloudFormation output `portfolio-<stage>-media-url` |

For local development, copy `front/.env.example` to `front/.env.local` and fill in the values from the deployed dev stack. `.env.local` is gitignored.

Amplify stores tokens in `localStorage` by default. The raw token is never accessed directly — Amplify manages refresh automatically.

---

## Auth Flow

### Sign-in

```text
1. User navigates to /admin/login
2. Enters email and password
3. LoginPage calls signIn(email, password) from useAuthContext
4. useAuth calls Amplify signIn({ username, password })
5. Cognito validates credentials and returns JWT tokens
6. Amplify stores tokens in localStorage
7. useAuth calls fetchAuthSession to read the ID token
8. Extracts cognito:groups from token payload
9. Sets isAuthenticated=true, isAdmin=true (if in admin group)
10. LoginPage redirects to /admin/dashboard
```

### Session persistence

On every page load, `useAuth` calls `getCurrentUser()` and `fetchAuthSession()` to restore the session from localStorage. If the session is valid, the user stays authenticated without re-entering credentials. If the token is expired, Amplify automatically refreshes it using the refresh token (valid for 30 days).

### Sign-out

```text
1. User clicks "Sign out" in AdminLayout header
2. AdminLayout calls signOut() from useAuthContext
3. useAuth calls Amplify signOut()
4. Amplify clears tokens from localStorage
5. Auth state resets to isAuthenticated=false
6. User is redirected to /admin/login
```

### Error handling

- Invalid credentials → Cognito returns `NotAuthorizedException` → LoginPage shows error alert.
- User not in admin group → `isAdmin=false` → ProtectedRoute redirects to `/admin/login`.
- Token expired → Amplify refreshes automatically. If refresh fails, session is cleared and user is redirected to login.

---

## Route Protection

`ProtectedRoute` guards routes based on authentication status and Cognito group membership.

```tsx
// Requires any authenticated user
<ProtectedRoute>
  <SomePage />
</ProtectedRoute>

// Requires the admin group (default)
<ProtectedRoute requiredGroups={["admin"]}>
  <AdminPage />
</ProtectedRoute>
```

Decision flow:

```text
ProtectedRoute renders
↓
isLoading=true → show spinner
↓
isAuthenticated=false → redirect to /admin/login
↓
requiredGroups not satisfied → show AccessDeniedPage (403)
↓
all checks pass → render children
```

`AccessDeniedPage` is shown (not a redirect) when the user is authenticated but lacks the required group. It shows a 403 result with a sign-out button.

Rules:
- All admin routes must be wrapped in `<ProtectedRoute>`.
- `requiredGroups` defaults to `["admin"]` — no need to pass it explicitly for standard admin routes.
- This is frontend-only protection for UI. The backend must still validate tokens and groups on every API call.

---

## Role-Based Access

The frontend uses the `cognito:groups` claim from the ID token to control access.

`useAuth` extracts groups from the token payload:

```ts
const groups = (payload["cognito:groups"] as string[] | undefined) ?? [];
const isAdmin = groups.includes("admin");
```

`ProtectedRoute` enforces access at the route level:

```tsx
// Redirects to /admin/login if not authenticated or not admin
<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>
```

Rules:
- Frontend role checks are for UI only — they hide or show elements.
- The backend enforces real authorization on every protected API call.
- Never rely on frontend checks alone to protect data.

---

## API Client

`front/src/services/api.ts` provides typed fetch wrappers that follow the standard response shape:

```ts
// Success: { data: T }
// Error:   { error: { code: string, message: string } }

const profile = await apiGet<ProfileData>("/profile");
const project = await apiPost<Project>("/projects", payload, idToken);
```

On error, the client throws an `ApiError` object `{ code, message }` that is safe to display to the user.

---

## AuthContext and useAuth

### useAuth hook — `hooks/useAuth.ts`

`useAuth` is the core auth hook. It manages the Cognito session state and exposes everything the app needs to know about the current user.

Exposed values:

| Property | Type | Description |
|---|---|---|
| `isAuthenticated` | `boolean` | True if a valid session exists |
| `isAdmin` | `boolean` | True if the user is in the `admin` Cognito group |
| `isLoading` | `boolean` | True while the initial session check is running |
| `idToken` | `string \| null` | Raw ID token string — passed as `Authorization` header to API calls |
| `email` | `string \| null` | User's email from the token payload |
| `error` | `string \| null` | Last sign-in error message |
| `signIn(email, password)` | `Promise<void>` | Signs in via Amplify and refreshes session state |
| `signOut()` | `Promise<void>` | Signs out via Amplify and clears session state |

On mount, `useAuth` calls `getCurrentUser()` and `fetchAuthSession()` to restore any existing session. This is what makes the session persist across page refreshes.

Group membership is read directly from the ID token payload — no extra API call needed:

```ts
const payload = idToken.payload;
const groups = (payload["cognito:groups"] as string[] | undefined) ?? [];
const isAdmin = groups.includes("admin");
```

### AuthContext — `context/AuthContext.tsx`

`AuthContext` wraps `useAuth` in a React context so any component can access auth state without prop drilling.

```tsx
// Wrap the app once at the root
<AuthProvider>
  <App />
</AuthProvider>

// Access auth state anywhere in the tree
const { isAuthenticated, isAdmin, signOut, idToken } = useAuthContext();
```

`useAuthContext()` throws if called outside `<AuthProvider>` — this catches missing provider setup early.

---

## Component Organization

### Naming and file placement

| Type | Location | Naming |
|---|---|---|
| Page component | `pages/public/` or `pages/admin/` | `PascalCase.tsx` |
| Shared component | `components/` | `PascalCase.tsx` |
| Test file | Next to the file it tests | `PascalCase.test.tsx` |
| Hook | `hooks/` | `useCamelCase.ts` |
| Service | `services/` | `camelCaseService.ts` |

### Suggested file size limits

| File type | Suggested limit |
|---|---|
| `pages/*.tsx` | ~100 lines |
| `components/**/*.tsx` | ~150 lines |
| `hooks/*.ts` | ~200 lines |
| `services/*.ts` | ~80 lines |

If a file exceeds these limits, split it into smaller focused units.

### Projects pages

The projects feature uses:

| File | Purpose |
|---|---|
| `front/src/services/projectsService.ts` | Typed API client for public and admin project endpoints |
| `front/src/types/project.ts` | `Project`, `ProjectInput`, and patch types |
| `front/src/pages/public/ProjectsPage.tsx` | Public project card grid with loading and empty states |
| `front/src/pages/public/ProjectDetailPage.tsx` | Public project detail page at `/projects/:slug` |
| `front/src/pages/admin/ProjectsListPage.tsx` | Admin project table with publish, feature, edit, and delete actions |
| `front/src/pages/admin/ProjectFormPage.tsx` | Shared create/edit form for `/admin/projects/create` and `/admin/projects/:id/edit` |
| `front/src/components/admin/CaseStudyForm.tsx` | Case study editor shown as a second tab when editing an existing project |

Admin project routes are wrapped in `ProtectedRoute`; backend authorization still enforces the `admin` group for all admin calls.

`ProjectDetailPage` fetches the case study after loading the project by slug and renders the case study section only when data exists.

### Experience pages

The experience feature uses:

| File | Purpose |
|---|---|
| `front/src/services/experienceService.ts` | Typed API client for public list and admin mutations |
| `front/src/types/experience.ts` | `Experience` and `ExperienceInput` types |
| `front/src/pages/public/ExperiencePage.tsx` | Public timeline of ordered experience entries |
| `front/src/pages/admin/ExperiencePage.tsx` | Admin CRUD list with native drag-and-drop reorder |
| `front/src/components/admin/ExperienceForm.tsx` | Shared add/edit form with current-role end-date behavior |

The admin reorder UI uses native HTML drag-and-drop and persists the full ordered ID list to `PATCH /experience/reorder`.

### Layout components

`AdminLayout` is the shared wrapper for all protected admin pages. It provides the top navigation bar with the user's email and sign-out button. Every admin page should render inside `AdminLayout`:

```tsx
const DashboardPage = () => (
  <AdminLayout>
    <h1>Dashboard</h1>
  </AdminLayout>
);
```

---

## Form Handling

Forms use React Hook Form for state management and Yup for schema validation.

### Pattern

```tsx
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Form, Input, Button } from "antd";

const schema = yup.object({
  title: yup.string().required("Title is required.").max(100),
  description: yup.string().required("Description is required."),
});

type FormValues = yup.InferType<typeof schema>;

const ProjectForm = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    // call service function
  };

  return (
    <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
      <Form.Item
        label="Title"
        validateStatus={errors.title ? "error" : ""}
        help={errors.title?.message}
      >
        <Input {...register("title")} />
      </Form.Item>
      <Button type="primary" htmlType="submit" loading={isSubmitting}>
        Save
      </Button>
    </Form>
  );
};
```

### Error display rules

| Error type | Where to show |
|---|---|
| Field validation error | Inline below the field (`help` prop on `Form.Item`) |
| `409 DUPLICATE_RECORD` | Inline near the conflicting field |
| `400 VALIDATION_ERROR` | Inline below the relevant field |
| `403 FORBIDDEN` | Global — redirect or show Access Denied |
| `401 UNAUTHORIZED` | Global — redirect to login |
| `500 INTERNAL_ERROR` | Global — Ant Design `message.error(...)` toast |

---

## Testing

Tests use Vitest + React Testing Library. Run from the `front/` directory:

```bash
npm run test -- --run
```

Test files live next to the component they test:

```text
front/src/pages/public/
├── HomePage.tsx
└── HomePage.test.tsx
```

---

**Last Updated:** 2026-05-11
**Status:** Complete
**Next:** Update as Phase 2 features are implemented

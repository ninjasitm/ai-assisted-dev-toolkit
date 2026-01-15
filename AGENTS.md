# AGENTS.md - AI-Assisted Development Toolkit

**Type:** Template Repository
**Purpose:** Provide AI instruction templates for single repos and monorepos
**Audience:** Developers setting up AI-assisted development workflows

## Overview

This is a **meta-repository** containing templates for AI development instructions. The templates in `src/` are meant to be copied to target projects and customized.

## Structure

```
/
├── src/
│   ├── repo/           # Single repository templates
│   │   ├── .cursor/    # Cursor IDE config templates
│   │   ├── .github/    # GitHub Copilot templates
│   │   └── AGENTS.md   # Agent context template
│   │
│   └── monorepo/       # Monorepo templates
│       ├── .cursor/    # Root Cursor config
│       ├── .github/    # Root GitHub config
│       ├── apps/       # App-specific templates
│       └── packages/   # Package templates
│
├── .cursor/            # This repo's Cursor config
├── .github/            # This repo's GitHub config
└── AGENTS.md           # This file
```

## Template Conventions

### Placeholder Syntax

All templates use `{{PLACEHOLDER}}` syntax for customizable values:

- `{{PROJECT_NAME}}` - Project name
- `{{FRAMEWORK}}` - Primary framework (Next.js, Nuxt, etc.)
- `{{LANGUAGE}}` - Programming language
- `{{PACKAGE_MANAGER}}` - npm, pnpm, yarn, bun
- `{{DEV_PORT}}` - Development server port
- `{{DEPLOY_PLATFORM}}` - Deployment target

### File Types

| Extension          | Purpose              | Used By        |
| ------------------ | -------------------- | -------------- |
| `.mdc`             | Cursor rules         | Cursor IDE     |
| `.md`              | Commands/prompts     | Cursor/Copilot |
| `.prompt.md`       | Reusable prompts     | GitHub Copilot |
| `.instructions.md` | Context instructions | GitHub Copilot |

## Working on This Repository

When modifying templates:

1. **Preserve placeholders** - Keep `{{VAR}}` syntax intact
2. **Stay generic** - Avoid project-specific references
3. **Document placeholders** - List required variables in README
4. **Test templates** - Verify syntax is valid after placeholder replacement

## Template Categories

### Single Repo (`src/repo/`)

For standard repositories with a single project:

- Web applications
- API servers
- CLI tools
- Libraries

### Monorepo (`src/monorepo/`)

For monorepos with:

- Multiple apps (`apps/`)
- Shared packages (`packages/`)
- Workspace-level configuration

- Never bypass type safety with manual type casts
- Never import directly from `@/server/` in client code
- Never create custom types that duplicate server types

```typescript
// ❌ BAD - Type assertion and server import
import type { GameRouter } from "@/server/src/routers/game";
const data = (await api.getSession({ id })) as any;

// ✅ GOOD - Full type safety via AppRouterClient
const api = useGameApi();
const { data } = useQuery(api.getSession({ id: "123" }));
//    ^? data is automatically typed from server response
```

### Composable in Pinia Stores

```typescript
import { defineStore } from "pinia";
import { useFeatureApi } from "~/composables/feature-api";

export const useFeatureStore = defineStore("feature", () => {
	const api = useFeatureApi();
	const items = ref([]);

	const fetchItems = async () => {
		const { $orpcClient } = useNuxtApp();
		const result = await $orpcClient.featureRouter.listItems.query({});
		items.value = result.items;
	};

	return { items, fetchItems };
});
```

## Pinia Store Patterns

### Overview

Based on the CHIP-100 frontend refactoring (CHIP-116, CHIP-117, CHIP-118), we've established **three core patterns** for using API composables in Pinia stores:

1. **Direct Call Pattern** - Store actions call composable methods directly
2. **Single-Router Pattern** - Store uses one composable for one oRPC router
3. **Multi-Router Pattern** - Store uses multiple composables for different routers
4. **Dependency Injection Pattern** - Store actions accept API functions as parameters

### Pattern 1: Direct Call Pattern (Preferred)

**When to Use:** Most common pattern for store actions that need to call API endpoints.

**Why Direct Calls:** Based on CHIP-116 architectural decision, we use direct `.call()` methods instead of TanStack Query options because:

- Store actions need direct async calls that return promises
- Stores handle their own loading/error state (no need for Query's reactive state)
- Simpler integration with existing store logic
- TanStack Query still available for components that need it

```typescript
// ✅ GOOD - Direct call pattern in store
import { defineStore } from "pinia";
import { useGameApi } from "~/composables/game-api";

export const useGameStore = defineStore("game", () => {
	const gameApi = useGameApi(); // Initialize composable once
	const session = ref<GameSession | null>(null);
	const isLoading = ref(false);
	const error = ref<string | null>(null);

	const createSession = async (levelId: string, hostName: string) => {
		isLoading.value = true;
		error.value = null;

		try {
			// Direct call - returns promise with typed response
			const response = await gameApi.createSession({ levelId, hostName });
			session.value = response.session;
			return response;
		} catch (err) {
			error.value = err instanceof Error ? err.message : "Unknown error";
			throw err;
		} finally {
			isLoading.value = false;
		}
	};

	return { session, isLoading, error, createSession };
});
```

```typescript
// ❌ BAD - Using $orpc directly (legacy pattern)
const createSession = async (levelId: string, hostName: string) => {
	const { $orpc } = useNuxtApp(); // ❌ Don't do this
	const response = await $orpc.gameSession.createSession.call({
		levelId,
		hostName,
	});
};
```

### Pattern 2: Single-Router Pattern (Simple)

**When to Use:** Store only needs endpoints from ONE oRPC router.

**Example:** Survey store only uses `feedback` router endpoints (CHIP-118).

```typescript
// ✅ GOOD - Single-router pattern
import { defineStore } from "pinia";
import { useFeedbackApi } from "~/composables/feedback-api";

export const useSurveyStore = defineStore("survey", () => {
	const feedbackApi = useFeedbackApi(); // Only one composable needed
	const hasSubmittedBefore = ref(false);
	const isLoading = ref(false);

	// Action 1: Uses feedback router
	const checkSubmission = async (sessionId: string, playerId: string) => {
		isLoading.value = true;
		try {
			const response = await feedbackApi.checkSubmission({
				sessionId,
				playerId,
				when: "BEFORE",
			});
			hasSubmittedBefore.value = response.hasSubmitted;
		} finally {
			isLoading.value = false;
		}
	};

	// Action 2: Also uses feedback router
	const submitBeforeSurvey = async (data: SurveyData) => {
		const response = await feedbackApi.submitBeforeSurvey(data);
		return response;
	};

	return { hasSubmittedBefore, checkSubmission, submitBeforeSurvey };
});
```

### Pattern 3: Multi-Router Pattern (Complex)

**When to Use:** Store needs endpoints from MULTIPLE oRPC routers.

**Example:** Session store uses both `gameSession` and `questionGeneration` routers (CHIP-117).

```typescript
// ✅ GOOD - Multi-router pattern
import { defineStore } from "pinia";
import { useGameApi } from "~/composables/game-api";
import { useSessionApi } from "~/composables/session-api";

export const useSessionStore = defineStore("session", () => {
	const gameApi = useGameApi(); // For gameSession router
	const sessionApi = useSessionApi(); // For questionGeneration router

	const session = ref<GameSession | null>(null);
	const privateScenario = ref<Scenario | null>(null);

	// Action 1: Uses gameSession router
	const create = async (levelId: string, hostName: string) => {
		const response = await gameApi.createSession({ levelId, hostName });
		session.value = response.session;
		return response;
	};

	// Action 2: Also uses gameSession router
	const join = async (sessionId: string) => {
		const response = await gameApi.getSession({ sessionId });
		session.value = response.session;
		return response;
	};

	// Action 3: Uses questionGeneration router (different!)
	const createPrivateScenario = async (data: ScenarioData) => {
		const response = await sessionApi.createPrivateScenario(data);
		privateScenario.value = response.scenario;
		return response;
	};

	return { session, privateScenario, create, join, createPrivateScenario };
});
```

**Key Principle:** Use separate composables for separate routers - maintains clean separation of concerns and follows oRPC architecture.

### Pattern 4: Dependency Injection Pattern (Advanced)

**When to Use:** Action needs flexibility to work with different API implementations (testing, mocking, or dynamic behavior).

**Example:** Survey store's `submitAfterSurvey` action accepts API functions as parameters (CHIP-118).

```typescript
// ✅ GOOD - Dependency injection pattern
export const useSurveyStore = defineStore("survey", () => {
	const feedbackId = ref<string | null>(null);
	const feedbackStatus = ref<string | null>(null);

	const submitAfterSurvey = async (
		data: FeedbackData,
		apiFunctions: {
			submitFeedback: (input: any) => Promise<any>;
			getFeedback: (input: any) => Promise<any>;
		}
	) => {
		try {
			// Uses injected API functions
			const submitResponse = await apiFunctions.submitFeedback(data);
			feedbackId.value = submitResponse.feedbackId;

			// Poll for status using injected function
			const statusResponse = await apiFunctions.getFeedback({
				feedbackId: submitResponse.feedbackId,
			});
			feedbackStatus.value = statusResponse.status;

			return submitResponse;
		} catch (error) {
			throw error;
		}
	};

	return { feedbackId, feedbackStatus, submitAfterSurvey };
});
```

**Usage from Component:**

```vue
<script setup lang="ts">
const surveyStore = useSurveyStore();
const feedbackApi = useFeedbackApi();

const handleSubmit = async (data: FeedbackData) => {
	await surveyStore.submitAfterSurvey(data, {
		submitFeedback: feedbackApi.submitFeedback,
		getFeedback: feedbackApi.getFeedback,
	});
};
</script>
```

**Benefits:**

- Easy testing with mock functions
- Flexible for different API implementations
- No direct coupling to specific composable
- Existing pattern - already used in survey store

### Best Practices

#### ✅ DO

```typescript
// DO: Initialize composable once at store level
export const useGameStore = defineStore("game", () => {
	const gameApi = useGameApi(); // ✅ Initialize once

	const createSession = async () => {
		return await gameApi.createSession({}); // ✅ Reuse instance
	};

	const getSession = async () => {
		return await gameApi.getSession({}); // ✅ Same instance
	};
});

// DO: Use multiple composables for multiple routers
export const useSessionStore = defineStore("session", () => {
	const gameApi = useGameApi(); // ✅ For gameSession endpoints
	const sessionApi = useSessionApi(); // ✅ For questionGeneration endpoints
});

// DO: Handle errors with proper state management
const createSession = async () => {
	isLoading.value = true;
	error.value = null;
	try {
		const response = await gameApi.createSession({});
		session.value = response.session;
		return response;
	} catch (err) {
		error.value = err instanceof Error ? err.message : "Unknown error";
		throw err; // Re-throw for component to handle
	} finally {
		isLoading.value = false;
	}
};

// DO: Use dependency injection for testable actions
const submitData = async (
	data: any,
	apiFunctions: { submit: (input: any) => Promise<any> }
) => {
	return await apiFunctions.submit(data); // ✅ Testable
};
```

#### ❌ DON'T

```typescript
// DON'T: Use $orpc directly in stores
const createSession = async () => {
	const { $orpc } = useNuxtApp(); // ❌ Don't do this
	return await $orpc.gameSession.createSession.call({});
};

// DON'T: Reinitialize composable in every action
const createSession = async () => {
	const gameApi = useGameApi(); // ❌ Don't repeat in every action
	return await gameApi.createSession({});
};

const getSession = async () => {
	const gameApi = useGameApi(); // ❌ Already initialized above
	return await gameApi.getSession({});
};

// DON'T: Mix patterns unnecessarily
const fetchData = async () => {
	const { $orpc } = useNuxtApp(); // ❌ Inconsistent
	const gameApi = useGameApi(); // ❌ Pick one pattern
	return await $orpc.gameSession.getData.call({});
};

// DON'T: Ignore error handling
const createSession = async () => {
	const response = await gameApi.createSession({}); // ❌ No try/catch
	return response; // ❌ No loading state management
};
```

### Testing Store Actions

```typescript
// ✅ GOOD - Test with dependency injection
import { setActivePinia, createPinia } from "pinia";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useSurveyStore } from "../survey";

describe("SurveyStore", () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	it("should submit feedback with injected API functions", async () => {
		const store = useSurveyStore();

		// Mock API functions
		const mockSubmitFeedback = vi.fn().mockResolvedValue({
			feedbackId: "123",
			status: "completed",
		});

		const mockGetFeedback = vi.fn().mockResolvedValue({
			status: "completed",
			transcript: "Test transcript",
		});

		// Call action with mocks
		await store.submitAfterSurvey(
			{ sessionId: "test", playerId: "player1" },
			{
				submitFeedback: mockSubmitFeedback,
				getFeedback: mockGetFeedback,
			}
		);

		// Verify calls
		expect(mockSubmitFeedback).toHaveBeenCalledWith({
			sessionId: "test",
			playerId: "player1",
		});

		// Verify state updates
		expect(store.feedbackId).toBe("123");
		expect(store.feedbackStatus).toBe("completed");
	});
});
```

### Testing API Composables

**Location:** `tests/composables/api/*-api.test.ts` | **Examples:** LEB-115, LEB-116, LEB-117

#### Test Structure Pattern

```typescript
// ✅ GOOD - API composable test structure
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock useNuxtApp (inline mock overrides external mocks)
vi.mock("#app", () => ({
	useNuxtApp: () => ({
		$orpc: {
			[routerName]: {
				[methodName]: {
					call: vi.fn(), // Mock .call() method
				},
			},
		},
	}),
}));

describe("useFeatureApi", () => {
	// Create test helper (avoids useNuxtApp in tests)
	const createFeatureApi = () => {
		const mockOrpc = {
			[routerName]: {
				getItem: { call: vi.fn() },
				createItem: { call: vi.fn() },
			},
		};

		return {
			api: {
				getItem: (input: any) =>
					mockOrpc.[routerName].getItem.call(input),
				createItem: (input: any) =>
					mockOrpc.[routerName].createItem.call(input),
			},
			mockOrpc,
		};
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should call API with correct parameters", async () => {
		const { api, mockOrpc } = createFeatureApi();

		mockOrpc.[routerName].getItem.call.mockResolvedValue({
			item: { id: "123", name: "Test" },
		});

		const result = await api.getItem({ id: "123" });

		expect(mockOrpc.[routerName].getItem.call).toHaveBeenCalledWith({
			id: "123",
		});
		expect(result.item.id).toBe("123");
	});
});
```

#### Testing Patterns

**1. Query Methods (GET operations):**

```typescript
it("should get item by ID", async () => {
	const { api, mockOrpc } = createFeatureApi();

	mockOrpc.feature.getItem.call.mockResolvedValue({
		item: { id: "123", name: "Test Item" },
	});

	const result = await api.getItem({ id: "123" });

	expect(mockOrpc.feature.getItem.call).toHaveBeenCalledWith({ id: "123" });
	expect(result.item.name).toBe("Test Item");
});
```

**2. Mutation Methods (POST/PUT/DELETE operations):**

```typescript
it("should create item with data", async () => {
	const { api, mockOrpc } = createFeatureApi();

	mockOrpc.feature.createItem.call.mockResolvedValue({
		item: { id: "new-123", name: "New Item" },
	});

	const result = await api.createItem({
		name: "New Item",
		description: "Test description",
	});

	expect(mockOrpc.feature.createItem.call).toHaveBeenCalledWith({
		name: "New Item",
		description: "Test description",
	});
	expect(result.item.id).toBe("new-123");
});
```

**3. Error Handling:**

```typescript
it("should propagate API errors", async () => {
	const { api, mockOrpc } = createFeatureApi();

	const mockError = new Error("API Error: Not Found");
	mockOrpc.feature.getItem.call.mockRejectedValue(mockError);

	await expect(api.getItem({ id: "invalid" })).rejects.toThrow(
		"API Error: Not Found"
	);
});
```

**4. Type Safety Validation:**

```typescript
it("should enforce required parameters", async () => {
	const { api, mockOrpc } = createFeatureApi();

	mockOrpc.feature.createItem.call.mockResolvedValue({ item: {} });

	// ✅ TypeScript should catch missing required fields at compile time
	// This test verifies runtime behavior matches type expectations
	await api.createItem({
		name: "Required Field", // ✅ Required
		description: undefined, // ✅ Optional can be undefined
	});

	expect(mockOrpc.feature.createItem.call).toHaveBeenCalledWith({
		name: "Required Field",
		description: undefined,
	});
});
```

#### Real Examples

**From LEB-115 (Feedback API - 18 tests):**

```typescript
// Test helper pattern
const createFeedbackApi = () => {
	const mockOrpc = {
		feedback: {
			checkSubmission: { call: vi.fn() },
			submitBeforeSurvey: { call: vi.fn() },
			submitFeedback: { call: vi.fn() },
			// ... more methods
		},
	};

	return {
		api: {
			checkSubmission: (input: any) =>
				mockOrpc.feedback.checkSubmission.call(input),
			submitBeforeSurvey: (input: any) =>
				mockOrpc.feedback.submitBeforeSurvey.call(input),
			// ... more methods
		},
		mockOrpc,
	};
};
```

**From LEB-116 (Game API - 14 tests):**

```typescript
// Direct call pattern with async/await
it("should get session by ID", async () => {
	const { api, mockOrpc } = createGameApi();

	mockOrpc.gameSession.getSession.call.mockResolvedValue({
		session: { id: "session-123", hostName: "Test Host" },
	});

	const result = await api.getSession({ id: "session-123" });

	expect(result.session.hostName).toBe("Test Host");
});
```

**From LEB-121 (RealtimeService - 42 tests, 80.61% branch coverage):**

```typescript
// Mock RealtimeKit SDK
vi.mock("@cloudflare/realtime-kit", () => ({
	RealtimeClient: vi.fn(),
}));

// Mock Nuxt App with shared mock functions
const mockGetMeetingStatusCall = vi.fn();
const mockCreateMeetingCall = vi.fn();

vi.mock("#app", () => ({
	useNuxtApp: () => ({
		$orpc: {
			meeting: {
				getMeetingStatus: { call: mockGetMeetingStatusCall },
				createMeeting: { call: mockCreateMeetingCall },
			},
		},
		$orpcClient: {
			meeting: {
				getMeetingStatus: { call: mockGetMeetingStatusCall },
				createMeeting: { call: mockCreateMeetingCall },
			},
		},
	}),
}));
```

#### Best Practices

**✅ DO:**

- Create test helper function that mimics composable without `useNuxtApp`
- Mock `.call()` methods with `vi.fn().mockResolvedValue()`
- Test both success and error scenarios
- Verify method called with correct parameters
- Use `beforeEach` to clear all mocks between tests
- Test type safety with required/optional parameters
- Aim for 80%+ branch coverage (not just statement coverage)

**❌ DON'T:**

- Don't mock `.query()` or `.mutate()` (those are legacy TanStack Query patterns)
- Don't use `mockDeep()` from `vitest-mock-extended` (causes circular reference issues)
- Don't test external libraries (trust oRPC client works)
- Don't forget to clear mocks between tests
- Don't use `as any` type assertions (use test helper pattern instead)

### Pattern Selection Guide

| Store Needs                     | Pattern to Use       | Example           |
| ------------------------------- | -------------------- | ----------------- |
| One oRPC router endpoints       | Single-Router        | Survey (LEB-118)  |
| Multiple oRPC router endpoints  | Multi-Router         | Session (LEB-117) |
| Flexibility for testing/mocking | Dependency Injection | Survey actions    |
| Standard CRUD operations        | Direct Call          | Game (LEB-116)    |

### Migration Checklist

When refactoring a store from `$orpc` to composables:

- [ ] Identify which oRPC routers the store uses
- [ ] Choose pattern: Single-Router or Multi-Router
- [ ] Import appropriate composable(s)
- [ ] Initialize composable(s) at store level (not in actions)
- [ ] Replace `const { $orpc } = useNuxtApp()` with composable instance
- [ ] Replace `$orpc.router.method.call()` with `api.method()`
- [ ] Update comments from "via oRPC" to "via API"
- [ ] Add proper error handling and loading state
- [ ] Run tests to verify no regressions
- [ ] Verify TypeScript passes (`pnpm check-types`)
- [ ] Use grep to confirm zero `$orpc` references remain

### Creating New Composables

1. **Copy template:** `cp templates/composable-api.template.ts composables/[feature]-api.ts`
2. **Replace placeholders:**
   - `[FeatureName]` → PascalCase feature name (e.g., `Meeting`, `Survey`)
   - `[feature-name]` → kebab-case feature name (e.g., `meeting`, `survey`)
   - `[routerName]` → oRPC router name from server (e.g., `meeting`, `gameSession`)
3. **Update methods:** Add actual API methods from server router
4. **Add JSDoc:** Document parameters and return types with examples
5. **Test type safety:** Verify IDE autocomplete and type checking

**Example:**

```bash
# Create new meeting API composable
cp templates/composable-api.template.ts composables/meeting-api.ts
# Edit file: Replace [FeatureName] → Meeting, [routerName] → meeting
# Add methods: getMeeting, createMeeting, updateMeeting, deleteMeeting
```

## Key Modules

**Pages:** `/modules/app/pages/session/` - create, join, lobby, game, recap
**Video:** `/components/VideoChat/` - main, grid, participant, controls
**UI:** `/components/ui/` - Button, Card, Dialog, Carousel, Navigation (shadcn/ui)

## TailwindCSS 4 + shadcn-vue Components

- Use `@reference "tailwindcss"` to import tailwindcss
- Use existing shadcn-vue components from `/app/components/ui/` if available
- If not available, use the shadcn MCP server or install it from the `apps/web` folder using: `pnpm dlx shadcn-vue@latest add {{component}}`. Then customize the styling and functionality as needed.

**Features:** Nuxt 4 + Tailwind v4 + shadcn-vue, SSR width plugin, `@theme inline`, `data-slot` attributes

## Real-Time

```typescript
// WebSocket
export const useWebSocket = () => {
	const socket = ref<WebSocket | null>(null);
	const connect = (sessionId: string) => {
		socket.value = new WebSocket(`${wsUrl}/session/${sessionId}`);
		socket.value.onmessage = (e) => handleMessage(JSON.parse(e.data));
	};
	return { connect, sendMessage, isConnected };
};

// Video Chat (Cloudflare RealtimeKit)
export const useVideoChat = () => {
	const localStream = ref<MediaStream | null>(null);
	const initializeVideoChat = async () => {
		const rtcClient = new RealtimeClient({ sessionId });
		localStream.value = await navigator.mediaDevices.getUserMedia({
			video: true,
			audio: true,
		});
		return rtcClient;
	};
	return { initializeVideoChat, localStream };
};
```

## TypeScript Best Practices

### Web App TypeScript Guidelines

This web app uses Nuxt 4 + Vue 3 with strict TypeScript configurations:

#### Core Standards

- **Strict Mode**: Strict TypeScript with additional checks enabled
- **Vue Components**: Always use `<script setup lang="ts">` with proper prop typing
- **Import Paths**: Use Nuxt auto-imports and configured aliases (`@/`, `~/`)
- **Type Safety**: End-to-end TypeScript with oRPC client integration

#### Vue 3 Composition API TypeScript Patterns

```typescript
// ✅ Proper Vue 3 component with TypeScript
<script setup lang="ts">
interface Props {
  sessionId: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
});

const emit = defineEmits<{
  'session-created': [sessionId: string];
  'error': [error: string];
}>();

// Use typed composables and stores
const { session } = useGameStore();
const { data, error } = await $api.game.getSession.query({ id: props.sessionId });
</script>
```

#### oRPC Client TypeScript Integration

```typescript
// ✅ Simplified oRPC client typing
const client = createORPCClient(rpcLink) as any;

// Use with proper error handling
const { data, error } = await $api.game.createSession.mutate({
	levelId,
	hostName,
});
```

### Common TypeScript Issues & Solutions

#### 1. Vue Test Utils Type Issues

```typescript
// ❌ Problematic (Vue Test Utils API changed)
expect(wrapper.props().cardId).toBe(999);

// ✅ Correct approach
expect((wrapper.props() as any).cardId).toBe(999);
// OR better: use vm.$props for component props
expect(wrapper.vm.$props.cardId).toBe(999);
```

#### 2. Navigator Mock Issues (E2E Tests)

```typescript
// ✅ Proper navigator mock for video/audio tests
Object.defineProperty(global.navigator, "mediaDevices", {
	writable: true,
	value: {
		getUserMedia: vi.fn().mockResolvedValue({
			getTracks: () => [],
		}),
	},
});
```

### Type Checking Commands

- **Web app only**: `cd apps/web && pnpm check-types`
- **Watch mode**: `cd apps/web && npx tsc --noEmit --watch`
- **All packages**: `pnpm check-types` (from root)

## Testing

### Vue Component Testing Best Practices

```typescript
// ✅ Proper Vue component testing with TypeScript
import { mount } from "@vue/test-utils";
import GameCard from "./GameCard.vue";

describe("GameCard", () => {
	it("should emit rating when clicked", async () => {
		const wrapper = mount(GameCard, {
			props: {
				cardId: 1,
				sessionId: 123,
			},
		});

		await wrapper.find('[data-testid="thumbs-up"]').trigger("click");

		expect(wrapper.emitted("card-rated")).toBeTruthy();
		expect(wrapper.emitted("card-rated")![0]).toEqual([
			{
				cardId: 1,
				rating: 1,
			},
		]);
	});
});
```

### E2E Testing with Playwright

```typescript
// ✅ Proper E2E test setup
import { test, expect } from "@playwright/test";

test.describe("Game Session Flow", () => {
	test("should create and join session", async ({ page }) => {
		await page.goto("/");

		// Create session
		await page.fill('[data-testid="host-name"]', "Test Host");
		await page.click('[data-testid="create-session"]');

		// Verify session created
		await expect(page.locator('[data-testid="session-code"]')).toBeVisible();

		const sessionCode = await page.textContent('[data-testid="session-code"]');
		expect(sessionCode).toMatch(/^[A-Z0-9]{6}$/);
	});
});
```

### Testing Guidelines

#### Files That Need Testing

- **Components with business logic**: Game components, form handlers, state management
- **Composables**: Custom Vue composables with complex logic
- **Utility functions**: Data transformations, validations, calculations
- **Store modules**: Pinia store actions and getters
- **API integrations**: oRPC client usage patterns

#### Files That Don't Need Testing

- **Simple wrapper components**: Components that only render props or slots
- **Configuration files**: Nuxt config, TypeScript config, Tailwind config
- **Type definitions**: Interface and type declarations
- **Framework code**: Nuxt plugins, auto-generated code

## Deployment

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
	ssr: true,
	nitro: { preset: "cloudflare-pages", experimental: { wasm: true } },
	runtimeConfig: {
		public: {
			apiUrl: process.env.API_URL || "http://localhost:3000",
			wsUrl: process.env.WS_URL || "ws://localhost:3000",
		},
	},
	modules: ["@nuxt/ui", "@pinia/nuxt", "@vueuse/nuxt"],
});
```

**Deploy:** `npm run build && npm run deploy` → Cloudflare Pages

## Performance

**Code Splitting:** Auto route-based + dynamic imports for heavy components
**Assets:** WebP images, preloaded fonts, purged CSS
**Caching:** Long-term static assets, short-term API responses

## Troubleshooting

**Hydration:** Use `<ClientOnly>` for browser-specific components
**WebSocket:** Check CORS + env vars
**Video:** Requires HTTPS + camera permissions
**Styling:** Use component layers over utilities

**Debug:** Vue DevTools, browser console, network tab

## Spec-Driven Development

### Web App Constitution for Spec Kit

```markdown
# Web Application Constitution

## Core Principles

- **Nuxt 4 + Vue 3 Composition API:** All components use `<script setup lang="ts">`
- **TailwindCSS 4:** Use `@theme` directive, component layers over utilities
- **Mobile-First:** Responsive design with mobile optimization priority
- **Type Safety:** End-to-end TypeScript, oRPC client integration
- **Real-Time:** WebSocket + Cloudflare RealtimeKit for live features

## Architecture Rules

- **shadcn/ui base:** Extend, don't replace UI components
- **Pinia stores:** Centralized state with composables for shared logic
- **Module structure:** `/modules/app/` for features, `/components/ui/` for reusables
- **Performance:** Auto code-splitting, WebP images, CSS purging

## Development Standards

- **Testing:** Vitest unit tests + Playwright E2E
- **Error handling:** Proper try/catch with user-friendly messages
- **Accessibility:** ARIA labels, keyboard navigation, screen reader support
- **SEO:** SSR-enabled, meta tags, structured data
```

### Using Spec Kit for Web Features

```bash
# Initialize web-specific feature
cd apps/web
specify init video-chat-feature

# Generate spec with web context
specify /spec "Add video chat overlay to game sessions with mute/unmute controls"

# Plan with web tech stack
specify /plan "Use Vue 3 Composition API, Cloudflare RealtimeKit, responsive design"

# Implement with web standards
specify /implement
```

**Web-Specific Planning Focus:**

- **UI/UX:** Component design, user interactions, responsive layouts
- **State Management:** Pinia store integration, reactive data flow
- **Real-Time:** WebSocket composables, video chat components
- **Performance:** Lazy loading, image optimization, bundle splitting
- **Testing:** Component testing, user interaction flows, E2E scenarios

## Contributing

**Standards:** Vue 3 Composition API, TypeScript, proper error handling
**Process:** Feature branch → tests → `npm run lint` → `npm run build` → PR

---

**Related:** [Server AGENTS.md](../server/AGENTS.md) | [Root AGENTS.md](../../AGENTS.md)

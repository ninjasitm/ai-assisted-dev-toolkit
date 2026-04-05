---
applyTo: "**/*"
description: "Monorepo logging standards and best practices"
---

# Monorepo Logging Standards

## Overview

Consistent logging across all apps and packages is critical for debugging, monitoring, and understanding system behavior in a distributed monorepo environment.

## Log Format

### Structured Logging with App/Package Context

Include the app or package name in every log:

```{{FILE_EXTENSION}}
[App:{{APP_1}}] [ComponentName]: message
[Pkg:{{PACKAGE_1}}] [ServiceName]: operation completed
[App:{{APP_2}}] [UtilityName]: processing data
```

### Log Message Structure

```
[App/Pkg:name] [Source] [Context]: Action/Event | Additional details
```

**Examples:**

```javascript
// From {{APP_1}} app
console.log(
	"[App:{{APP_1}}] [UserService] [fetchUser]: Retrieved user data | userId:",
	userId,
);

// From {{PACKAGE_1}} package
console.error(
	"[Pkg:{{PACKAGE_1}}] [ApiClient] [request]: API call failed | endpoint:",
	url,
);

// From {{APP_2}} app
console.warn(
	"[App:{{APP_2}}] [CacheService] [invalidate]: Cache miss | key:",
	cacheKey,
);

// Bad - no context
console.log("got user");
console.error("error");
```

## Log Levels

### error

**Use for:** Critical failures that require immediate attention

- Unhandled exceptions
- Database connection failures
- Cross-app communication failures
- Shared package errors
- External API failures
- Data corruption
- Security violations

```{{FILE_EXTENSION}}
console.error('[App:{{APP_2}}] [DatabaseService]: Connection failed | error:', error);
console.error('[Pkg:{{PACKAGE_1}}] [ApiClient]: Request timeout | endpoint:', url);
```

### warn

**Use for:** Issues that don't stop execution but need attention

- Deprecated shared package usage
- Rate limit approaching
- Fallback behavior triggered
- Configuration issues
- Version mismatch warnings
- Missing optional dependencies

```{{FILE_EXTENSION}}
console.warn('[App:{{APP_1}}] [AuthService]: Using fallback auth method | reason:', reason);
console.warn('[Pkg:{{PACKAGE_2}}] [UtilityService]: Deprecated method used | caller:', caller);
```

### info

**Use for:** Significant application events

- App startup/shutdown
- Configuration loaded
- User authentication
- Major state changes
- Background job completion
- Package initialization
- Cross-app communication

```{{FILE_EXTENSION}}
console.info('[App:{{APP_1}}]: Started successfully | port:', port);
console.info('[Pkg:{{PACKAGE_1}}]: Initialized | config:', config);
```

### debug

**Use for:** Detailed diagnostic information

- Function entry/exit
- Variable values
- Conditional branches taken
- Cross-package calls
- Monorepo-specific debugging

```{{FILE_EXTENSION}}
console.debug('[App:{{APP_2}}] [Validator]: Checking constraints | input:', input);
console.debug('[Pkg:{{PACKAGE_1}}] [Router]: Resolving route | path:', path);
```

## Monorepo-Specific Logging

### Cross-App Communication

Log all communication between apps:

```javascript
// In {{APP_1}} making request to {{APP_2}}
console.info(
	"[App:{{APP_1}}] [ApiService]: Calling {{APP_2}} | endpoint:",
	endpoint,
	"| requestId:",
	requestId,
);

// In {{APP_2}} receiving request
console.info(
	"[App:{{APP_2}}] [RequestHandler]: Request from {{APP_1}} | requestId:",
	requestId,
);
```

### Shared Package Usage

Log significant operations in shared packages:

```javascript
// In @{{PROJECT_NAME}}/{{PACKAGE_1}}
export function sharedUtility(data) {
	console.debug(
		"[Pkg:{{PACKAGE_1}}] [sharedUtility]: Called | caller:",
		getCaller(),
	);
	// ...
	console.debug(
		"[Pkg:{{PACKAGE_1}}] [sharedUtility]: Complete | result:",
		result,
	);
	return result;
}
```

### Request Tracing Across Apps

Use correlation IDs to track requests across the monorepo:

```javascript
// Generate at entry point ({{APP_1}})
const correlationId = generateId();
context.set("correlationId", correlationId);

console.info(
	"[App:{{APP_1}}]: Request started | correlationId:",
	correlationId,
);

// Pass to {{APP_2}}
await fetch("{{APP_2}}/api", {
	headers: { "X-Correlation-ID": correlationId },
});

// Log in {{APP_2}}
const correlationId = req.headers["x-correlation-id"];
console.info(
	"[App:{{APP_2}}]: Processing request | correlationId:",
	correlationId,
);

// Log in shared package
console.info("[Pkg:{{PACKAGE_1}}]: Operation | correlationId:", correlationId);
```

## Logging Best Practices

### Do

✅ **Include app/package context**: Always prefix with `[App:name]` or `[Pkg:name]`
✅ **Use correlation IDs**: Track requests across apps
✅ **Log cross-app calls**: Document all inter-app communication
✅ **Include version info**: Log package versions on initialization
✅ **Log at boundaries**: API calls, database queries, external services
✅ **Use appropriate levels**: Match severity to log level
✅ **Include error stack traces**: For debugging
✅ **Log state changes**: Before and after important operations
✅ **Use structured data**: Objects for complex data
✅ **Sanitize sensitive data**: Remove passwords, tokens, PII

### Don't

❌ **Log without context**: Always include app/package name
❌ **Log in tight loops**: Can impact performance across monorepo
❌ **Log sensitive data**: Passwords, API keys, tokens, PII
❌ **Use console.log in production**: Use proper logging library
❌ **Log entire objects blindly**: Can expose sensitive data
❌ **Ignore error context**: Include stack traces and related data
❌ **Use vague messages**: "Error occurred", "Success", "Done"
❌ **Mix log formats**: Keep consistent across all apps

## Sensitive Data Handling

### Never Log (Same Across Monorepo)

- Passwords (plain or hashed)
- API keys and tokens
- Private keys and certificates
- Credit card numbers
- Social security numbers
- Personal health information
- Authentication cookies/sessions
- Internal service credentials

### Sanitization Examples

```javascript
// Bad
console.log("[App:{{APP_1}}] [AuthService]: Login attempt", {
	username,
	password,
});

// Good
console.log(
	"[App:{{APP_1}}] [AuthService]: Login attempt | username:",
	username,
);

// Bad
console.log("[Pkg:{{PACKAGE_1}}] [PaymentService]: Processing", paymentData);

// Good
const sanitized = {
	...paymentData,
	cardNumber: "****" + paymentData.cardNumber.slice(-4),
	cvv: "***",
};
console.log("[Pkg:{{PACKAGE_1}}] [PaymentService]: Processing", sanitized);
```

## Performance Considerations

### Conditional Logging

```javascript
// Only log in development
if (process.env.NODE_ENV === "development") {
	console.debug("[App:{{APP_1}}] [DataProcessor]: Intermediate result", data);
}

// Per-app log level configuration
if (appConfig.logLevel <= LogLevel.DEBUG) {
	console.debug("[App:{{APP_1}}] [Service]: Details", details);
}
```

### Avoid Logging in Hot Paths

```javascript
// Bad - logs on every iteration
for (const item of items) {
	console.log("[Pkg:{{PACKAGE_1}}] [Processor]: Processing item", item);
	process(item);
}

// Good - log summary
console.info(
	"[Pkg:{{PACKAGE_1}}] [Processor]: Processing batch | count:",
	items.length,
);
for (const item of items) {
	process(item);
}
console.info(
	"[Pkg:{{PACKAGE_1}}] [Processor]: Batch complete | processed:",
	items.length,
);
```

## Error Logging

### Complete Error Context with App/Package Info

```javascript
try {
	await riskyOperation();
} catch (error) {
	console.error("[App:{{APP_1}}] [ServiceName] [operation]: Operation failed", {
		error: error.message,
		stack: error.stack,
		context: {
			userId,
			requestId,
			correlationId,
			appVersion: process.env.APP_VERSION,
			timestamp: Date.now(),
		},
	});
	// Re-throw or handle
}
```

### Shared Error Logging Utility

Create a shared logging package:

**Location:** `packages/{{PACKAGE_LOGGING}}/src/logger.ts`

```typescript
export const createLogger = (appOrPackageName: string) => {
	const prefix = appOrPackageName.startsWith("@")
		? `[Pkg:${appOrPackageName}]`
		: `[App:${appOrPackageName}]`;

	return {
		error: (source: string, operation: string, error: Error, context = {}) => {
			console.error(`${prefix} [${source}] [${operation}]: ${error.message}`, {
				error: {
					name: error.name,
					message: error.message,
					stack: error.stack,
				},
				...context,
			});
		},
		warn: (source: string, message: string, data = {}) => {
			console.warn(`${prefix} [${source}]: ${message}`, data);
		},
		info: (source: string, message: string, data = {}) => {
			console.info(`${prefix} [${source}]: ${message}`, data);
		},
		debug: (source: string, message: string, data = {}) => {
			console.debug(`${prefix} [${source}]: ${message}`, data);
		},
	};
};

// Usage in {{APP_1}}
import { createLogger } from "@{{PROJECT_NAME}}/{{PACKAGE_LOGGING}}";
const logger = createLogger("{{APP_1}}");

logger.info("UserService", "User created", { userId });
logger.error("PaymentService", "process", error, { orderId });
```

## Per-App Configuration

### App-Specific Log Levels

```javascript
// apps/{{APP_1}}/.env
LOG_LEVEL = debug;

// apps/{{APP_2}}/.env
LOG_LEVEL = info;

// In code
const logger = createLogger("{{APP_1}}");
logger.setLevel(process.env.LOG_LEVEL);
```

## Production Logging

### Log Aggregation

Centralize logs from all apps:

- Sentry (errors) - one project per app
- Datadog - with app/package tags
- CloudWatch - separate log groups per app
- LogRocket - per-app configuration
- Papertrail - with app prefixes

### Correlation IDs Across Monorepo

```javascript
// Root request in {{APP_1}}
const correlationId = generateId();

// Pass through all calls
headers["X-Correlation-ID"] = correlationId;

// Log everywhere
console.info("[App:{{APP_1}}]: Processing | correlationId:", correlationId);
console.info("[Pkg:{{PACKAGE_1}}]: Called | correlationId:", correlationId);
console.info("[App:{{APP_2}}]: Received | correlationId:", correlationId);
```

### Per-App Metrics

Extract metrics per app:

- `{{APP_1}}` request duration
- `{{APP_2}}` error rates
- `{{PACKAGE_1}}` usage patterns
- Cross-app call latency
- Package version distribution

## Monorepo-Specific Testing

### Test Logs from Multiple Apps

```javascript
// Integration test
test("logs correlation ID across apps", async () => {
	const spy1 = jest.spyOn(console, "info");
	const spy2 = jest.spyOn(console, "info");

	const correlationId = await app1.callApp2();

	expect(spy1).toHaveBeenCalledWith(
		expect.stringContaining("[App:{{APP_1}}]"),
		expect.objectContaining({ correlationId }),
	);

	expect(spy2).toHaveBeenCalledWith(
		expect.stringContaining("[App:{{APP_2}}]"),
		expect.objectContaining({ correlationId }),
	);
});
```

## Workspace Organization

### Shared Logging Package

```
packages/
└── {{PACKAGE_LOGGING}}/
    ├── src/
    │   ├── logger.ts           # Core logger
    │   ├── formatters.ts       # Log formatters
    │   ├── sanitizers.ts       # Sensitive data sanitization
    │   └── types.ts            # TypeScript types
    ├── package.json
    └── README.md
```

### App-Specific Configuration

```
apps/{{APP_1}}/
├── config/
│   └── logger.ts              # App-specific logger config
└── .env                        # LOG_LEVEL, etc.

apps/{{APP_2}}/
├── config/
│   └── logger.ts              # App-specific logger config
└── .env                        # LOG_LEVEL, etc.
```

---

**Last Updated**: {{Date}}
**Related Packages**: @{{PROJECT_NAME}}/{{PACKAGE_LOGGING}}

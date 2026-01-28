---
applyTo: "**/*"
description: "Logging standards and best practices for {{PROJECT_NAME}}"
---

# Logging Standards

## Overview

Consistent logging is critical for debugging, monitoring, and understanding application behavior in production.

## Log Format

### Structured Logging

Use bracketed tags to identify the source:

```{{FILE_EXTENSION}}
[ComponentName]: message
[ServiceName]: operation completed
[UtilityName]: processing data
```

### Log Message Structure

```
[Source] [Context]: Action/Event | Additional details
```

**Examples:**

```javascript
// Good
console.log("[UserService] [fetchUser]: Retrieved user data | userId:", userId);
console.error(
	"[PaymentService] [processPayment]: Payment failed | error:",
	error.message,
);
console.warn("[CacheService] [invalidate]: Cache miss | key:", cacheKey);

// Bad
console.log("got user");
console.error("error");
console.log(data);
```

## Log Levels

### error

**Use for:** Critical failures that require immediate attention

- Unhandled exceptions
- Database connection failures
- External API failures
- Data corruption
- Security violations

```{{FILE_EXTENSION}}
console.error('[DatabaseService]: Connection failed | error:', error);
```

### warn

**Use for:** Issues that don't stop execution but need attention

- Deprecated API usage
- Rate limit approaching
- Fallback behavior triggered
- Configuration issues
- Unexpected but handled states

```{{FILE_EXTENSION}}
console.warn('[AuthService]: Using fallback auth method | reason:', reason);
```

### info

**Use for:** Significant application events

- Application startup/shutdown
- Configuration loaded
- User authentication
- Major state changes
- Background job completion

```{{FILE_EXTENSION}}
console.info('[Application]: Started successfully | port:', port);
```

### debug

**Use for:** Detailed diagnostic information

- Function entry/exit
- Variable values
- Conditional branches taken
- Loop iterations
- Algorithm steps

```{{FILE_EXTENSION}}
console.debug('[Validator]: Checking constraints | input:', input);
```

## Logging Best Practices

### Do

✅ **Include context**: User IDs, request IDs, timestamps
✅ **Log at boundaries**: API calls, database queries, external services
✅ **Use appropriate levels**: Match severity to log level
✅ **Include error stack traces**: For debugging
✅ **Log state changes**: Before and after important operations
✅ **Use structured data**: Objects for complex data
✅ **Sanitize sensitive data**: Remove passwords, tokens, PII

### Don't

❌ **Log in tight loops**: Can impact performance
❌ **Log sensitive data**: Passwords, API keys, tokens, PII
❌ **Use console.log in production**: Use proper logging library
❌ **Log entire objects blindly**: Can expose sensitive data
❌ **Ignore error context**: Include stack traces and related data
❌ **Use vague messages**: "Error occurred", "Success", "Done"
❌ **Log at wrong level**: Info for errors, error for warnings

## Sensitive Data Handling

### Never Log

- Passwords (plain or hashed)
- API keys and tokens
- Private keys and certificates
- Credit card numbers
- Social security numbers
- Personal health information
- Authentication cookies/sessions

### Sanitization Examples

```javascript
// Bad
console.log("[AuthService]: Login attempt", { username, password });

// Good
console.log("[AuthService]: Login attempt | username:", username);

// Bad
console.log("[PaymentService]: Processing payment", paymentData);

// Good
const sanitized = {
	...paymentData,
	cardNumber: "****" + paymentData.cardNumber.slice(-4),
	cvv: "***",
};
console.log("[PaymentService]: Processing payment", sanitized);
```

## Performance Considerations

### Conditional Logging

```javascript
// Only log in development
if (process.env.NODE_ENV === "development") {
	console.debug("[DataProcessor]: Intermediate result", data);
}

// Use log level checks
if (logger.level <= LogLevel.DEBUG) {
	console.debug("[Service]: Expensive computation", expensiveOperation());
}
```

### Avoid Logging in Hot Paths

```javascript
// Bad - logs on every iteration
for (const item of items) {
	console.log("[Processor]: Processing item", item);
	process(item);
}

// Good - log summary
console.info("[Processor]: Processing batch | count:", items.length);
for (const item of items) {
	process(item);
}
console.info("[Processor]: Batch complete | processed:", items.length);
```

## Error Logging

### Complete Error Context

```javascript
try {
	await riskyOperation();
} catch (error) {
	console.error("[ServiceName] [operation]: Operation failed", {
		error: error.message,
		stack: error.stack,
		context: { userId, requestId, timestamp: Date.now() },
	});
	// Re-throw or handle
}
```

### Structured Error Logging

```javascript
const logError = (source, operation, error, context = {}) => {
	console.error(`[${source}] [${operation}]: ${error.message}`, {
		error: {
			name: error.name,
			message: error.message,
			stack: error.stack,
		},
		...context,
	});
};

// Usage
logError("UserService", "createUser", error, { userId, email });
```

## Framework-Specific Guidelines

{{#if (eq FRAMEWORK "Next.js")}}

### Next.js

```typescript
// Server components
import { logger } from "@/lib/logger";

export default async function Page() {
	logger.info("[HomePage]: Rendering");
	// ...
}

// API routes
export async function POST(request: Request) {
	try {
		logger.info("[API] [/users]: Create user request");
		// ...
	} catch (error) {
		logger.error("[API] [/users]: Failed to create user", { error });
	}
}
```

{{/if}}

{{#if (eq FRAMEWORK "Django")}}

### Django

```python
import logging

logger = logging.getLogger(__name__)

class UserView(View):
    def get(self, request):
        logger.info(f'[UserView] [get]: Request | user_id={request.user.id}')
        try:
            # ...
        except Exception as e:
            logger.error(f'[UserView] [get]: Failed | error={str(e)}', exc_info=True)
```

{{/if}}

{{#if (eq FRAMEWORK "Laravel")}}

### Laravel

```php
use Illuminate\Support\Facades\Log;

class UserController extends Controller
{
    public function store(Request $request)
    {
        Log::info('[UserController] [store]: Creating user');

        try {
            // ...
        } catch (\Exception $e) {
            Log::error('[UserController] [store]: Failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }
}
```

{{/if}}

## Production Logging

### Log Aggregation

Integrate with log aggregation services:

- Sentry (errors)
- Datadog
- CloudWatch
- LogRocket
- Papertrail

### Correlation IDs

```javascript
// Add to all logs in a request
const requestId = generateId();
context.set("requestId", requestId);

console.info("[API]: Request started | requestId:", requestId);
console.info("[Service]: Processing | requestId:", requestId);
console.info("[API]: Request complete | requestId:", requestId);
```

## Monitoring and Alerts

### Log-Based Alerts

Set up alerts for:

- High error rates
- Specific error patterns
- Performance degradation
- Security events
- Business-critical failures

### Metrics from Logs

Extract metrics:

- Request duration
- Error rates by endpoint
- User activity patterns
- Cache hit rates
- External API latency

## Testing Logs

### Test Log Output

```javascript
// Jest example
const consoleSpy = jest.spyOn(console, "error");

test("logs error on failure", async () => {
	await failingOperation();

	expect(consoleSpy).toHaveBeenCalledWith(
		expect.stringContaining("[ServiceName]"),
		expect.any(Object),
	);
});
```

---

**Last Updated**: {{Date}}

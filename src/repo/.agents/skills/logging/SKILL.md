---
name: logging
description: Comprehensive logging standards for applications including structured logging, log levels, message formatting, and observability guidelines
version: 1.0.0
author: {{PROJECT_NAME}} Team
created: 2026-01-26
updated: 2026-01-26
tags:
  - logging
  - structured-logging
  - observability
  - debugging
  - monitoring
applies_to:
  - "**/*.{{FILE_EXTENSION}}"
  - "services/**/*"
  - "api/**/*"
  - "src/**/*"
---

# Logging Standards

Comprehensive logging guidelines for consistent, structured, and maintainable logging across the codebase.

## Core Principles

### 1. Structured Logging

All logs MUST be structured (JSON-serializable) for efficient querying and analysis.

### 2. Contextual Information

Include relevant context (request ID, user ID, session ID) in every log.

### 3. Appropriate Levels

Use correct log levels to enable effective filtering.

### 4. Performance Aware

Avoid expensive operations in log statements.

## Log Levels

| Level     | When to Use                            | Examples                                         |
| --------- | -------------------------------------- | ------------------------------------------------ |
| **ERROR** | Application errors requiring attention | Unhandled exceptions, failed critical operations |
| **WARN**  | Unexpected but recoverable situations  | Retry attempts, deprecated usage, rate limiting  |
| **INFO**  | Significant application events         | Request handling, job completion, config changes |
| **DEBUG** | Detailed diagnostic information        | Variable values, execution paths, timing         |
| **TRACE** | Very detailed debugging                | Loop iterations, method entry/exit               |

## Message Format Pattern

**REQUIRED**: All log messages MUST follow this pattern:

```
[SERVICE_OR_CLASS]: MESSAGE
```

The prefix should be the **actual class name or service name** enclosed in square brackets.

## Language-Specific Examples

### TypeScript/JavaScript

```typescript
import { logger } from "./logger";

// ✅ GOOD - Structured with context
logger.info("[UserService]: User created", {
	userId: user.id,
	email: user.email,
	source: "registration",
});

// ✅ GOOD - Error with stack trace
logger.error("[PaymentService]: Payment processing failed", {
	error: err.message,
	stack: err.stack,
	orderId: order.id,
	amount: order.total,
});

// ❌ BAD - String interpolation loses structure
logger.info(`User ${userId} created with email ${email}`);

// ❌ BAD - Missing context
logger.error("Payment failed");
```

### Python

```python
import structlog

logger = structlog.get_logger()

# ✅ GOOD - Structured with context
logger.info("[UserService]: User created",
    user_id=user.id,
    email=user.email,
    source="registration"
)

# ✅ GOOD - Error with exception
logger.error("[PaymentService]: Payment processing failed",
    error=str(e),
    order_id=order.id,
    amount=order.total,
    exc_info=True
)

# ❌ BAD - f-string loses structure
logger.info(f"User {user_id} created with email {email}")
```

### C# / .NET

```csharp
// ✅ GOOD - Structured logging with named parameters
_logger.LogInformation("[UserService]: User created - UserId: {UserId}, Email: {Email}",
    user.Id, user.Email);

// ✅ GOOD - Error with exception
_logger.LogError(ex, "[PaymentService]: Payment failed - OrderId: {OrderId}, Amount: {Amount}",
    order.Id, order.Total);

// ❌ BAD - String interpolation
_logger.LogInformation($"User {userId} created with email {email}");
```

### Go

```go
// ✅ GOOD - Structured with context
logger.Info("[UserService]: User created",
    zap.String("userId", user.ID),
    zap.String("email", user.Email),
    zap.String("source", "registration"),
)

// ✅ GOOD - Error with stack
logger.Error("[PaymentService]: Payment failed",
    zap.Error(err),
    zap.String("orderId", order.ID),
    zap.Float64("amount", order.Total),
)

// ❌ BAD - Printf style
logger.Info(fmt.Sprintf("User %s created", userId))
```

## Contextual Logging

### Request Context

Always include request-scoped identifiers:

```typescript
// Middleware sets context
const requestContext = {
	requestId: req.headers["x-request-id"] || uuid(),
	userId: req.user?.id,
	sessionId: req.session?.id,
	traceId: req.headers["x-trace-id"],
};

// All logs in request include context
logger.info("[OrderController]: Order submitted", {
	...requestContext,
	orderId: order.id,
	itemCount: order.items.length,
});
```

### Correlation IDs

For async operations, propagate correlation:

```typescript
async function processOrder(order: Order, correlationId: string) {
	logger.info("[OrderProcessor]: Starting order processing", {
		correlationId,
		orderId: order.id,
	});

	// Pass to downstream services
	await inventoryService.reserve(order.items, { correlationId });
	await paymentService.charge(order.total, { correlationId });

	logger.info("[OrderProcessor]: Order processing complete", {
		correlationId,
		orderId: order.id,
		duration: Date.now() - startTime,
	});
}
```

## Performance Logging

### Timing Operations

```typescript
const startTime = performance.now();

await expensiveOperation();

const duration = performance.now() - startTime;
logger.info("[DataProcessor]: Operation completed", {
	operationType: "batch-import",
	recordCount: records.length,
	durationMs: Math.round(duration),
	recordsPerSecond: Math.round(records.length / (duration / 1000)),
});
```

### Conditional Debug Logging

```typescript
// Avoid expensive serialization unless needed
if (logger.isDebugEnabled()) {
	logger.debug("[CacheService]: Cache contents", {
		keys: cache.keys(),
		size: cache.size,
		hitRate: cache.stats.hitRate,
	});
}
```

## Error Logging Best Practices

### Include Full Context

```typescript
try {
	await processPayment(order);
} catch (error) {
	logger.error("[PaymentService]: Payment processing failed", {
		error: error.message,
		stack: error.stack,
		errorCode: error.code,
		// Business context
		orderId: order.id,
		userId: order.userId,
		amount: order.total,
		paymentMethod: order.paymentMethod,
		// Request context
		requestId: context.requestId,
		// Recovery info
		retryable: isRetryableError(error),
		attemptNumber: attempt,
	});
	throw error;
}
```

### Categorize Errors

```typescript
// Tag errors for monitoring/alerting
logger.error("[AuthService]: Authentication failed", {
	errorCategory: "SECURITY",
	errorType: "INVALID_CREDENTIALS",
	userId: attemptedUserId,
	ipAddress: request.ip,
	userAgent: request.headers["user-agent"],
});
```

## Sensitive Data

### Never Log

- Passwords or secrets
- Full credit card numbers
- Social security numbers
- API keys or tokens
- Personal health information
- Personally identifiable information (PII) beyond user IDs

### Masking Patterns

```typescript
const maskEmail = (email: string) => {
	const [local, domain] = email.split("@");
	return `${local.slice(0, 2)}***@${domain}`;
};

const maskCardNumber = (card: string) => {
	return `****-****-****-${card.slice(-4)}`;
};

logger.info("[PaymentService]: Payment authorized", {
	email: maskEmail(user.email), // "jo***@example.com"
	cardNumber: maskCardNumber(card), // "****-****-****-1234"
	amount: order.total,
});
```

## Common Patterns by Component Type

### Controllers / Route Handlers

```typescript
// TypeScript
logger.info("[OrderController]: Received order submission", {
	userId: user.id,
	itemCount: order.items.length,
	correlationId: req.headers["x-request-id"],
});

logger.warn("[OrderController]: Validation failed", {
	userId: user.id,
	errors: validationErrors,
});
```

```csharp
// C#
_logger.LogInformation("[OrderController]: Received order submission - UserId: {UserId}, ItemCount: {ItemCount}",
    user.Id, order.Items.Count);

_logger.LogWarning("[OrderController]: Validation failed - UserId: {UserId}, Errors: {Errors}",
    user.Id, validationErrors);
```

### Services

```typescript
// TypeScript
logger.info("[OrderService]: Processing order", {
	orderId: order.id,
	userId: order.userId,
	total: order.total,
});

logger.error(ex, "[NotificationService]: Failed to send notification", {
	userId: user.id,
	notificationType: "order-confirmation",
	error: err.message,
});
```

```python
# Python
logger.info("[OrderService]: Processing order",
    order_id=order.id,
    user_id=order.user_id,
    total=order.total,
)

logger.error("[NotificationService]: Failed to send notification",
    user_id=user.id,
    notification_type="order-confirmation",
    error=str(e),
    exc_info=True,
)
```

### Background Jobs

```typescript
logger.info("[EmailJobService]: Starting scheduled email job");

logger.warn("[EmailJobService]: No emails scheduled for processing");

logger.info("[EmailJobService]: Job completed", {
	emailsSent: sentCount,
	duration: Date.now() - startTime,
});
```

## Anti-Patterns to Avoid

### ❌ Don't Use Generic Prefixes

```typescript
// Bad - not specific enough
logger.info("[Service]: Operation completed");

// Good - identifies exact service
logger.info("[OrderService]: Order processing completed", {
	orderId: order.id,
});
```

### ❌ Don't Use Technology Names as Prefixes

```typescript
// Bad - uses technology name instead of class name
logger.debug("REDIS: Cache hit for key " + key);

// Good - uses actual class name
logger.debug("[CacheService]: Cache hit", { key, ttl });
```

### ❌ Don't Log Sensitive Data

```typescript
// Bad - logs sensitive information
logger.info("[AuthService]: User logged in", {
	password: password,
	token: jwtToken,
});

// Good - logs only non-sensitive identifiers
logger.info("[AuthService]: User logged in", {
	userId: user.id,
	sessionId: session.id,
});
```

### ❌ Don't Use String Interpolation in Log Messages

```typescript
// Bad - loses structured logging
logger.info(`User ${userId} performed action ${action}`);

// Good - uses structured logging
logger.info("[Service]: User performed action", {
	userId,
	action,
});
```

### ❌ Don't Log in Tight Loops Without Throttling

```typescript
// Bad - can flood logs
for (const item of largeCollection) {
	logger.debug("[Service]: Processing item", { itemId: item.id });
}

// Good - log summary instead
logger.info("[Service]: Processing batch", {
	itemCount: largeCollection.length,
});
// Log only errors or specific cases
```

## Log Message Guidelines

### Be Specific and Actionable

```typescript
// Bad - vague
logger.error("[Service]: Error occurred");

// Good - specific and actionable
logger.error("[PaymentService]: Failed to process payment", {
	orderId: order.id,
	userId: order.userId,
	amount: order.total,
	paymentMethod: order.paymentMethod,
	error: err.message,
});
```

### Use Present Tense for Actions

```typescript
// Preferred
logger.info("[Service]: Processing request");
logger.info("[Service]: Request processed successfully");

// Not preferred
logger.info("[Service]: Will process request");
```

### Include Context for Troubleshooting

```typescript
logger.warn("[CacheService]: Cache miss", {
	key: cacheKey,
	expectedType: "user-profile",
	fallbackUsed: true,
});
```

## Environment Configuration

```bash
# .env
LOG_LEVEL=info              # Minimum log level
LOG_FORMAT=json             # json | pretty
LOG_DESTINATION=stdout      # stdout | file | service
LOG_SERVICE_URL=            # External logging service URL
```

## Observability Integration

### OpenTelemetry Context

```typescript
import { trace, context } from "@opentelemetry/api";

function logWithTrace(level: string, message: string, data: object) {
	const span = trace.getSpan(context.active());
	const traceContext = span
		? {
				traceId: span.spanContext().traceId,
				spanId: span.spanContext().spanId,
			}
		: {};

	logger[level](message, { ...data, ...traceContext });
}
```

## Testing Logging

When writing unit tests, verify logging behavior:

```typescript
// TypeScript/Jest
expect(logger.info).toHaveBeenCalledWith(
	expect.stringContaining("[OrderService]"),
	expect.objectContaining({ orderId: "123" })
);
```

```csharp
// C# / .NET
_mockLogger.Verify(
    x => x.Log(
        LogLevel.Information,
        It.IsAny<EventId>(),
        It.Is<It.IsAnyType>((o, t) => o.ToString().Contains("[OrderService]")),
        null,
        It.IsAny<Func<It.IsAnyType, Exception, string>>()),
    Times.Once);
```

## Quick Reference

### Log Level Decision Tree

```
Is it an error that needs attention? → ERROR
Is it unexpected but handled? → WARN
Is it a significant business event? → INFO
Is it helpful for debugging? → DEBUG
Is it very detailed/verbose? → TRACE
```

### Checklist Before Logging

- [ ] Using structured format (not string interpolation)
- [ ] Service/class prefix in brackets
- [ ] Relevant context included
- [ ] Sensitive data masked
- [ ] Appropriate log level
- [ ] No expensive operations in log statement

## Related Skills

- See `.agents/skills/systematic-debugging/` for debugging workflows
- See `.agents/skills/verification-before-completion/` for testing logs

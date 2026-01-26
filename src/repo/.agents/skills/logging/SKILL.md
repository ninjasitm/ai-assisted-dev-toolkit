---
name: logging
description: Comprehensive logging standards for C# applications including structured logging, log levels, message formatting, and compliance guidelines
version: 1.0.0
author: BlackFULLness Platform Team
created: 2026-01-26
updated: 2026-01-26
tags:
  - logging
  - csharp
  - structured-logging
  - observability
  - debugging
applies_to:
  - "**/*.cs"
  - "Services/**/*"
  - "Controllers/**/*"
  - "Api/**/*"
---

# Logging Standards for C# Applications

Comprehensive logging guidelines for consistent, structured, and maintainable logging across C# applications with emphasis on mental wellness platform requirements.

## Core Logging Principles

### Message Format Pattern

**REQUIRED**: All log messages MUST follow this pattern:

```
[CLASS_NAME_OR_SERVICE]: MESSAGE
```

The prefix should be the **actual class name or service name** where the logging occurs, enclosed in square brackets.

### Examples by Log Level

#### Information Level

```csharp
_logger.LogInformation("[SystemNotificationService]: Notification {NotificationId} sent to user {UserId}",
    notificationId, userId);

_logger.LogInformation("[ActivityController.Store]: Activity saved to database - ActivityId: {ActivityId}",
    activity.Id);

_logger.LogInformation("[ContentService]: Retrieved {Count} published meditations for institution {InstitutionId}",
    count, institutionId);
```

#### Warning Level

```csharp
_logger.LogWarning("[DeviceTokenService]: User {UserId} has no registered device tokens", userId);

_logger.LogWarning("[AnalyticsService]: Failed to queue event - {EventType}: {EventName} for UserId: {UserId}",
    eventType, eventName, userId);

_logger.LogWarning("[BadgeEvaluationService]: Badge definition {BadgeId} not found during evaluation", badgeId);
```

#### Error Level

```csharp
_logger.LogError(ex, "[BadgeService]: Failed to award badge {BadgeId} to user {UserId}", badgeId, userId);

_logger.LogError(ex, "[NotificationService]: Failed to send notification {NotificationId}", notificationId);

_logger.LogError(ex, "[ActivityController.Store]: Failed to track activity analytics for user {UserId}", userId);
```

#### Debug Level

```csharp
_logger.LogDebug("[CachedContentService]: Cache hit for content type {ContentType}", contentType);

_logger.LogDebug("[AnalyticsService]: Track event sent - Event: {EventName}, UserId: {UserId}, SessionId: {SessionId}",
    eventName, userId, sessionId);

_logger.LogDebug("[ActivityController.Store]: MapEventToActivityType result - Event: {Event}, ContentType: {ContentType}, MappedActivityType: {ActivityType}",
    activity.Event, activity.ContentType, activityType ?? "NULL");
```

## Structured Logging Best Practices

### 1. Use Named Parameters

**✅ DO THIS** - Structured logging with named parameters:

```csharp
_logger.LogInformation("[NotificationService]: Notification {NotificationId} sent to user {UserId} at {Timestamp}",
    notificationId, userId, DateTime.UtcNow);
```

**❌ AVOID THIS** - String interpolation or concatenation:

```csharp
// Bad - loses structured logging benefits
_logger.LogInformation($"[NotificationService]: Notification {notificationId} sent to user {userId}");
```

### 2. Include Relevant Entity IDs

Always include key identifiers for troubleshooting:

- `UserId`
- `NotificationId`
- `ActivityId`
- `BadgeId`
- `ContentId`
- `SessionId`
- `InstitutionId`

```csharp
_logger.LogInformation("[BadgeService]: Badge {BadgeId} awarded to user {UserId} - TotalPoints: {Points}",
    badgeId, userId, totalPoints);
```

### 3. Exception Logging Format

**Always use exception-first format**:

```csharp
// Correct - exception as first parameter
_logger.LogError(ex, "[ServiceName]: Error message with {ContextParam}", contextValue);

// Incorrect - exception in message
_logger.LogError($"[ServiceName]: Error occurred: {ex.Message}");
```

## Log Levels Guide

### Debug

- **When**: Diagnostic information useful during development
- **Examples**: Cache hits/misses, method entry/exit, internal state changes
- **Audience**: Developers debugging specific issues
- **Production**: Typically disabled in production

```csharp
_logger.LogDebug("[UserActivityTrackingService]: Processing activity event - ActivityType: {ActivityType}, EntityId: {EntityId}",
    activityType, entityId);
```

### Information

- **When**: Normal application flow, significant events
- **Examples**: Successful operations, user actions, state transitions
- **Audience**: Operations team, system monitoring
- **Production**: Enabled, but should not be excessive

```csharp
_logger.LogInformation("[AnalyticsService]: Initialized with Segment integration (write key configured)");
```

### Warning

- **When**: Unexpected but recoverable situations
- **Examples**: Missing optional data, fallback behavior triggered, performance degradation
- **Audience**: Operations team for monitoring
- **Production**: Always enabled

```csharp
_logger.LogWarning("[ActivityController.Store]: {ErrorMessage}", errorMessage);
```

### Error

- **When**: Operation failures, exceptions
- **Examples**: Database errors, external API failures, validation failures
- **Audience**: Operations team, on-call engineers
- **Production**: Always enabled, may trigger alerts

```csharp
_logger.LogError(ex, "[AnalyticsService]: Failed to send analytics event {EventName} for user {UserId}",
    eventName, userId);
```

### Critical

- **When**: Application-threatening failures
- **Examples**: Database connection lost, critical service unavailable
- **Audience**: Immediate escalation to on-call
- **Production**: Always enabled, triggers immediate alerts

```csharp
_logger.LogCritical(ex, "[DatabaseService]: Unable to establish database connection after {RetryAttempts} attempts",
    retryAttempts);
```

## Common Patterns by Component Type

### Controllers

```csharp
_logger.LogInformation("[ActivityController.Store]: Received activity - Event: {Event}, ContentType: {ContentType}, SessionId: {SessionId}",
    data.Event, data.ContentType, data.SessionId);

_logger.LogWarning("[ActivityController.Store]: {ErrorMessage}", errorMessage);
```

### Services

```csharp
_logger.LogInformation("[BadgeService]: Evaluating badges for user {UserId} - ActivityType: {ActivityType}",
    userId, activityType);

_logger.LogError(ex, "[NotificationService]: Failed to process notification for user {UserId}", userId);
```

### Background Jobs

```csharp
_logger.LogInformation("[NotificationSchedulingJobService]: Starting scheduled notification job");

_logger.LogWarning("[NotificationSchedulingJobService]: No notifications scheduled for processing");
```

### Analytics & Tracking

```csharp
_logger.LogDebug("[AnalyticsService]: Added sessionId {SessionId} to Segment context for user {UserId}",
    sessionId, userId);

_logger.LogInformation("[AnalyticsService]: {EventType}: {EventName} - UserId: {UserId}, Properties: {Properties}",
    eventType, eventName, userId, FormatProperties(properties));
```

## Anti-Patterns to Avoid

### ❌ Don't Use Generic Prefixes

```csharp
// Bad - not specific enough
_logger.LogInformation("[Service]: Operation completed");

// Good - identifies exact service
_logger.LogInformation("[BadgeEvaluationService]: Badge evaluation completed for user {UserId}", userId);
```

### ❌ Don't Use "SEGMENT" or Technology Names

```csharp
// Bad - uses technology name instead of class name
_logger.LogDebug("SEGMENT Track: {eventName}");

// Good - uses actual class name
_logger.LogDebug("[AnalyticsService]: Track event sent - Event: {EventName}", eventName);
```

### ❌ Don't Log Sensitive Data

```csharp
// Bad - logs sensitive information
_logger.LogInformation("[AuthService]: User logged in - Password: {Password}", password);

// Good - logs only non-sensitive identifiers
_logger.LogInformation("[AuthService]: User {UserId} logged in successfully", userId);
```

### ❌ Don't Use String Interpolation in Log Messages

```csharp
// Bad - loses structured logging
_logger.LogInformation($"[Service]: User {userId} performed action");

// Good - uses structured logging
_logger.LogInformation("[Service]: User {UserId} performed action", userId);
```

### ❌ Don't Log in Tight Loops Without Throttling

```csharp
// Bad - can flood logs
foreach (var item in largeCollection)
{
    _logger.LogDebug("[Service]: Processing item {ItemId}", item.Id);
}

// Good - log summary instead
_logger.LogInformation("[Service]: Processing {Count} items", largeCollection.Count);
// Log only errors or specific cases
```

## Log Message Guidelines

### Be Specific and Actionable

```csharp
// Bad - vague
_logger.LogError("[Service]: Error occurred");

// Good - specific and actionable
_logger.LogError(ex, "[NotificationService]: Failed to send push notification to device {DeviceToken} - User: {UserId}",
    deviceToken, userId);
```

### Use Present Tense for Actions

```csharp
// Preferred
_logger.LogInformation("[Service]: Processing request");
_logger.LogInformation("[Service]: Request processed successfully");

// Not preferred
_logger.LogInformation("[Service]: Will process request");
```

### Include Context for Troubleshooting

```csharp
_logger.LogWarning("[CachedContentService]: Cache miss for content type {ContentType} - InstitutionId: {InstitutionId}",
    contentType, institutionId);
```

## Performance Considerations

### Use LogLevel Checks for Expensive Operations

```csharp
if (_logger.IsEnabled(LogLevel.Debug))
{
    var detailedInfo = ExpensiveSerializationMethod(data);
    _logger.LogDebug("[Service]: Detailed state - {DetailedInfo}", detailedInfo);
}
```

### Avoid Logging in Hot Paths

Only log at Information level or higher in performance-critical code. Use Debug level sparingly.

## Testing Logging

When writing unit tests, verify logging behavior:

```csharp
_mockLogger.Verify(
    x => x.Log(
        LogLevel.Information,
        It.IsAny<EventId>(),
        It.Is<It.IsAnyType>((o, t) => o.ToString().Contains("[BadgeService]")),
        null,
        It.IsAny<Func<It.IsAnyType, Exception, string>>()),
    Times.Once);
```

## Quick Reference

| Scenario                | Log Level   | Include                           |
| ----------------------- | ----------- | --------------------------------- |
| Successful operation    | Information | Entity IDs, key parameters        |
| Operation started       | Debug       | Context parameters                |
| Unexpected but handled  | Warning     | What happened, how it was handled |
| Operation failed        | Error       | Exception, entity IDs, context    |
| System critical failure | Critical    | Exception, impact scope           |
| Development debugging   | Debug       | Detailed state information        |

## Compliance & Privacy

### HIPAA/GDPR Considerations

- **NEVER** log Protected Health Information (PHI)
- **NEVER** log personally identifiable information (PII) beyond user IDs
- **NEVER** log passwords, tokens, or credentials
- Use hashed/anonymized identifiers where appropriate

```csharp
// Good - logs hashed user identifier
_logger.LogDebug("[AnalyticsService]: Using hashed user ID for Segment");

// Bad - would log sensitive data
// _logger.LogDebug("[AnalyticsService]: User email: {Email}", userEmail);
```

---

**Remember**: Consistent, structured logging is essential for troubleshooting production issues, monitoring application health, and maintaining a high-quality codebase. Follow these standards religiously to ensure logs are useful and actionable.

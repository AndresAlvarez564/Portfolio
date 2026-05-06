# Database

> Status: Initial draft — update as access patterns are added.
> Assigned ticket: TK-06 (initial) → TK-LAST+13 (final)

## Table Design

| Setting | Value |
|---|---|
| Table name | `<project-name>-<stage>-main` |
| Partition key | `pk` (String) |
| Sort key | `sk` (String) |
| Billing mode | PAY_PER_REQUEST |
| PITR | Enabled in staging and prod |

## Entity Patterns

<!-- Document the pk/sk pattern for each entity. -->

## GSIs

<!-- Document each GSI, its keys, and what access pattern it supports. -->

## Access Patterns

<!-- List every query the application makes against DynamoDB. -->

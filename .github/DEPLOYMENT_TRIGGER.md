# Deployment Trigger

This file triggers Azure database deployment workflow.

Last deployment trigger: October 9, 2025

## What happens on deployment:
1. Schema push to Azure PostgreSQL (58 tables)
2. Data sync from Replit to Azure
3. Application deployment to Azure App Service

## Database Status:
- Replit Dev: 58 tables with test data
- Azure Production: Awaiting schema deployment

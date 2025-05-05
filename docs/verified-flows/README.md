# Verified Flows

This directory contains documentation for flows that have been fully implemented, tested, and verified to work in production.

## What Makes a Flow "Verified"?

A flow is considered "verified" when it meets the following criteria:

1. **Fully Implemented**: All components, edge functions, and database tables are complete.
2. **Production Tested**: The flow has been deployed to production and successfully tested.
3. **Error Handling**: Comprehensive error handling and fallbacks are in place.
4. **Documentation Complete**: The flow has been thoroughly documented with diagrams, code examples, and explanations.

## Available Verified Flows

- [Candidate Creation Flow](./CANDIDATE_FLOW.md) - The end-to-end process from resume upload to candidate profile display.
- [Tenant and Company Flow](./TENANT_COMPANY_FLOW.md) - The multi-tenant system design with company creation and management.
- [Company API Flow](./COMPANY_API_FLOW.md) - The direct API approach for company CRUD operations without Edge Functions.

## Using These Documents

These flow documents serve multiple purposes:

- **Onboarding**: New team members can understand core system functionality.
- **Architecture Reference**: Developers can understand design patterns and implementation details.
- **Troubleshooting Guide**: When issues arise, these documents help identify where problems might occur.
- **Feature Planning**: When extending functionality, these documents provide context for how existing features work.

## Adding New Flows

When a new flow is thoroughly tested and verified in production, add its documentation to this directory following the same format as existing documents. 
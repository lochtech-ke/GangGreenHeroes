# Requirements Document

## Introduction

The Super Admin Dashboard is a comprehensive administrative interface for the #GangGreen platform that provides elevated privileges to designated super administrators. This feature enables platform-wide oversight, user management, system monitoring, and critical administrative operations. The primary super admin will be lochtech.ke@gmail.com, with the ability to designate additional super admins as needed.

## Glossary

- **SuperAdmin**: A user with the highest level of administrative privileges, capable of managing all aspects of the platform including user roles, system settings, and other administrators
- **Platform**: The #GangGreen environmental conservation and carbon credit marketplace system
- **RLS**: Row Level Security - PostgreSQL security policies that control data access at the database level
- **Dashboard**: The administrative interface providing overview metrics, management tools, and system controls
- **UserManagementSystem**: The subsystem responsible for creating, updating, and managing user accounts and roles
- **AuditLog**: A chronological record of administrative actions and system events for security and compliance tracking

## Requirements

### Requirement 1

**User Story:** As a super admin, I want to access a dedicated dashboard interface, so that I can manage the platform without interfering with regular user operations.

#### Acceptance Criteria

1. WHEN the user lochtech.ke@gmail.com logs in THEN the Platform SHALL display a super admin dashboard option in the navigation
2. WHEN a user with super_admin role accesses the dashboard route THEN the Platform SHALL render the super admin interface with full administrative controls
3. WHEN a user without super_admin role attempts to access the dashboard route THEN the Platform SHALL redirect them to the home page and display an unauthorized message
4. WHEN the super admin dashboard loads THEN the Platform SHALL display overview metrics including total users, active initiatives, total trees planted, and system health status
5. WHERE the super admin is viewing the dashboard THEN the Platform SHALL provide navigation to user management, initiative oversight, system settings, and audit logs sections

### Requirement 2

**User Story:** As a super admin, I want to manage user accounts and roles, so that I can maintain proper access control and respond to user issues.

#### Acceptance Criteria

1. WHEN the super admin views the user management section THEN the UserManagementSystem SHALL display a searchable and filterable list of all platform users
2. WHEN the super admin searches for a user by email or name THEN the UserManagementSystem SHALL return matching results within 500 milliseconds
3. WHEN the super admin selects a user account THEN the UserManagementSystem SHALL display complete user details including profile information, activity history, and current role
4. WHEN the super admin changes a user's role THEN the UserManagementSystem SHALL update the role in the database and invalidate the user's session to force re-authentication
5. WHEN the super admin suspends a user account THEN the UserManagementSystem SHALL prevent that user from logging in and display a suspension message on their next login attempt
6. WHEN the super admin reactivates a suspended account THEN the UserManagementSystem SHALL restore full access and send a notification to the user
7. WHEN the super admin deletes a user account THEN the UserManagementSystem SHALL archive all associated data and remove the user's authentication credentials

### Requirement 3

**User Story:** As a super admin, I want to designate other users as super admins, so that I can distribute administrative responsibilities securely.

#### Acceptance Criteria

1. WHEN the super admin promotes a user to super_admin role THEN the UserManagementSystem SHALL update the user's role and grant full administrative privileges
2. WHEN the super admin demotes another super admin THEN the UserManagementSystem SHALL revoke administrative privileges and update the role to the specified level
3. WHEN a super admin role change occurs THEN the AuditLog SHALL record the action with timestamp, acting admin, target user, and role change details
4. IF the super admin attempts to demote themselves THEN the UserManagementSystem SHALL prevent the action and display a warning message

### Requirement 4

**User Story:** As a super admin, I want to monitor and manage conservation initiatives, so that I can ensure quality and compliance across the platform.

#### Acceptance Criteria

1. WHEN the super admin views the initiatives section THEN the Platform SHALL display all initiatives with status indicators, participant counts, and verification states
2. WHEN the super admin filters initiatives by status or forest THEN the Platform SHALL return matching initiatives within 500 milliseconds
3. WHEN the super admin reviews an initiative THEN the Platform SHALL display detailed information including creator, participants, trees planted, carbon credits, and activity timeline
4. WHEN the super admin flags an initiative as requiring review THEN the Platform SHALL mark the initiative and notify the initiative creator
5. WHEN the super admin suspends an initiative THEN the Platform SHALL prevent new participants from joining and display a suspension notice to existing participants

### Requirement 5

**User Story:** As a super admin, I want to view comprehensive audit logs, so that I can track administrative actions and investigate security incidents.

#### Acceptance Criteria

1. WHEN the super admin accesses the audit logs section THEN the AuditLog SHALL display a chronological list of all administrative actions
2. WHEN the super admin filters logs by date range, action type, or admin user THEN the AuditLog SHALL return matching records within 1 second
3. WHEN an administrative action is performed THEN the AuditLog SHALL record the action type, timestamp, admin user ID, target resource, and action details
4. WHEN the super admin exports audit logs THEN the AuditLog SHALL generate a CSV file containing all filtered records with complete details
5. WHILE viewing audit logs THEN the AuditLog SHALL display entries in descending chronological order with pagination of 50 entries per page

### Requirement 6

**User Story:** As a super admin, I want to configure system-wide settings, so that I can adjust platform behavior and feature availability.

#### Acceptance Criteria

1. WHEN the super admin accesses system settings THEN the Platform SHALL display configurable parameters including feature flags, rate limits, and notification settings
2. WHEN the super admin updates a system setting THEN the Platform SHALL validate the new value and apply the change immediately
3. WHEN a system setting change occurs THEN the AuditLog SHALL record the setting name, old value, new value, and admin user
4. IF the super admin enters an invalid setting value THEN the Platform SHALL reject the change and display a validation error message
5. WHEN the super admin enables or disables a feature flag THEN the Platform SHALL update the configuration and reflect the change for all users within 5 minutes

### Requirement 7

**User Story:** As a super admin, I want to view platform analytics and metrics, so that I can understand usage patterns and make informed decisions.

#### Acceptance Criteria

1. WHEN the super admin views the analytics dashboard THEN the Platform SHALL display key metrics including daily active users, new registrations, initiative creation rate, and tree planting trends
2. WHEN the super admin selects a date range THEN the Platform SHALL update all metrics to reflect data within that period
3. WHEN the super admin views user growth charts THEN the Platform SHALL display visual representations with data points for each day in the selected range
4. WHEN the super admin exports analytics data THEN the Platform SHALL generate a report containing all displayed metrics in CSV format
5. WHILE viewing analytics THEN the Platform SHALL refresh real-time metrics every 60 seconds

### Requirement 8

**User Story:** As a super admin, I want to manage carbon credit verification, so that I can ensure marketplace integrity and prevent fraud.

#### Acceptance Criteria

1. WHEN the super admin views pending verifications THEN the Platform SHALL display all carbon credits awaiting verification with initiative details and supporting documentation
2. WHEN the super admin approves a carbon credit THEN the Platform SHALL mark it as verified, make it available for trading, and notify the initiative creator
3. WHEN the super admin rejects a carbon credit THEN the Platform SHALL mark it as rejected, provide a reason, and notify the initiative creator
4. WHEN the super admin reviews verification history THEN the Platform SHALL display all past verification decisions with timestamps, admin users, and outcomes
5. WHILE reviewing a carbon credit THEN the Platform SHALL display associated tree data, growth metrics from Antugrow API, and photographic evidence

### Requirement 9

**User Story:** As the primary super admin (lochtech.ke@gmail.com), I want to be automatically granted super admin privileges, so that I can immediately access administrative functions without manual intervention.

#### Acceptance Criteria

1. WHEN the database is initialized THEN the Platform SHALL create a super_admin role type in the role enumeration
2. WHEN the user lochtech.ke@gmail.com registers or first logs in THEN the Platform SHALL automatically assign the super_admin role to this account
3. WHEN the primary super admin account is created THEN the AuditLog SHALL record the automatic role assignment with a system-generated entry
4. IF the email lochtech.ke@gmail.com already exists in the system THEN the Platform SHALL update the existing account to super_admin role during the next login

### Requirement 10

**User Story:** As a super admin, I want to view and manage GG Coin transactions, so that I can monitor the gamification economy and address user concerns.

#### Acceptance Criteria

1. WHEN the super admin views the GG Coin management section THEN the Platform SHALL display total coins in circulation, daily transaction volume, and top earners
2. WHEN the super admin searches for a user's coin history THEN the Platform SHALL display all earning and spending transactions with timestamps, amounts, and sources
3. WHEN the super admin manually adjusts a user's coin balance THEN the Platform SHALL update the balance, record the adjustment in the transaction history, and log the action in the AuditLog
4. WHEN the super admin views coin distribution analytics THEN the Platform SHALL display charts showing earning sources, spending categories, and balance distribution across users
5. IF the super admin detects suspicious coin activity THEN the Platform SHALL provide tools to freeze the user's coin transactions pending investigation

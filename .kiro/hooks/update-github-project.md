---
name: Update GitHub Project
description: Automatically update GitHub project board when spec tasks are completed
trigger: manual
enabled: true
---

# Update GitHub Project Hook

This hook updates the GitHub project board with the latest task status from the GangGreen platform spec.

## Instructions

When this hook is triggered:

1. Read the current tasks from `.kiro/specs/ganggreen-platform/tasks.md`
2. Parse all tasks and their completion status
3. For each task:
   - Extract task number, title, and status (completed/in-progress/not-started)
   - Extract sub-tasks and their status
   - Extract requirement references
4. Connect to GitHub API using the user's GitHub token
5. Find or create the "GangGreen Platform" project
6. For each task:
   - Create or update a GitHub issue with:
     - Title: Task number and name
     - Body: Task details, sub-tasks, and requirement references
     - Labels: Based on task category (auth, web3, nft, gamification, etc.)
     - Status: Map task status to project column (Todo/In Progress/Done)
7. Link related tasks using GitHub issue references
8. Add milestone for major feature groups
9. Update project board view to reflect current progress
10. Generate a summary report of:
    - Total tasks
    - Completed tasks
    - In-progress tasks
    - Remaining tasks
    - Estimated completion percentage

## GitHub Project Structure

### Columns
- **Backlog**: Not started tasks
- **Todo**: Ready to start
- **In Progress**: Currently being worked on
- **Review**: Completed and awaiting review
- **Done**: Fully completed and verified

### Labels
- `auth` - Authentication and authorization tasks
- `database` - Database schema and migrations
- `web3` - Web3 and blockchain integration
- `nft` - NFT badge system
- `gamification` - Gamification and rewards
- `frontend` - UI components
- `backend` - Backend services
- `testing` - Testing tasks
- `documentation` - Documentation tasks
- `deployment` - Deployment and DevOps

### Milestones
- **MVP Core Features** - Tasks 1-12
- **Web3 Integration** - Tasks 21-23
- **NFT & Gamification** - Tasks 24-27
- **Testing & Deployment** - Tasks 28-30

## Environment Variables Required

```
GITHUB_TOKEN=<your-github-personal-access-token>
GITHUB_REPO_OWNER=<your-github-username>
GITHUB_REPO_NAME=<repository-name>
GITHUB_PROJECT_NUMBER=<project-number>
```

## Usage

To trigger this hook manually:
1. Open the Kiro Hook UI from the command palette
2. Select "Update GitHub Project"
3. Click "Run Hook"
4. Review the summary report

Or use the command:
```
kiro hook run update-github-project
```

## Notes

- This hook requires a GitHub Personal Access Token with `repo` and `project` scopes
- The hook will create issues if they don't exist, or update existing ones
- Task status is determined by the checkbox state in tasks.md
- Sub-tasks are added as checklist items in the issue body
- The hook can be run multiple times safely - it will sync the current state

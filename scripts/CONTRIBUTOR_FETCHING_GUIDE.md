# Contributor Fetching Guide

## Overview

The contributor fetching system automatically retrieves GitHub contributor information during the build process and displays it on the Vivian Splash Screen.

## How It Works

### Automatic Fetching

The system runs automatically before each build:

1. **Trigger**: `prebuild` script in `package.json`
2. **Script**: `scripts/fetch-contributors.ts`
3. **Output**: `src/data/contributors.json`
4. **Display**: Contributor names shown in splash screen ticker

### Build Integration

```json
// package.json
{
  "scripts": {
    "prebuild": "tsx scripts/fetch-contributors.ts",
    "build": "tsc && vite build"
  }
}
```

Every time you run `npm run build`, contributors are automatically fetched.

## GitHub API

### Authentication (Optional)

For higher rate limits, provide a GitHub token:

```bash
# .env or .env.local
GITHUB_TOKEN=ghp_your_personal_access_token_here
```

**Without token**: 60 requests/hour  
**With token**: 5,000 requests/hour

### Creating a GitHub Token

1. Go to [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a descriptive name: "GangGreen Contributor Fetch"
4. Select scopes:
   - ✅ `public_repo` (for public repositories)
   - ✅ `repo` (if repository is private)
5. Click "Generate token"
6. Copy the token immediately (you won't see it again)
7. Add to `.env.local`:
   ```bash
   GITHUB_TOKEN=ghp_your_token_here
   ```

### Rate Limiting

If you hit rate limits:
- The script will use the fallback contributor list
- Build will continue successfully
- Warning message will appear in console
- Contributors will still display (from fallback)

## Manual Fetching

### Fetch Contributors Manually

```bash
# Using npm script (recommended)
npm run fetch-contributors

# Or directly with tsx
tsx scripts/fetch-contributors.ts

# Or with node (if compiled)
node scripts/fetch-contributors.js
```

### When to Fetch Manually

- Testing contributor display
- After major contributor changes
- Debugging contributor list issues
- Before important releases

## Output Format

### contributors.json Structure

```json
{
  "contributors": [
    {
      "login": "username1",
      "contributions": 150
    },
    {
      "login": "username2",
      "contributions": 75
    }
  ],
  "lastUpdated": "2025-12-03T10:30:00.000Z",
  "totalCount": 2
}
```

### Fields

- **login**: GitHub username
- **contributions**: Number of commits to main branch
- **lastUpdated**: ISO timestamp of last fetch
- **totalCount**: Total number of contributors

## Fallback System

### When Fallback Activates

The fallback list is used when:
- GitHub API is unavailable
- Rate limit exceeded
- Network connection fails
- Repository not found
- Authentication fails

### Updating Fallback List

Edit `scripts/fetch-contributors.ts`:

```typescript
const fallbackContributors = [
  { login: 'core-contributor-1', contributions: 0 },
  { login: 'core-contributor-2', contributions: 0 },
  { login: 'core-contributor-3', contributions: 0 }
];
```

**Best Practice**: Keep fallback list updated with core team members.

## Repository Configuration

### Auto-Detection

The script automatically detects repository information from git remote:

```bash
# Script reads from:
git remote get-url origin
# Example: https://github.com/owner/repo.git
```

### Manual Configuration

If auto-detection fails, manually configure in `scripts/fetch-contributors.ts`:

```typescript
const REPO_CONFIG = {
  owner: 'your-github-org',
  repo: 'ganggreen-platform'
};
```

## Filtering Contributors

### Current Behavior

- Fetches all contributors to main branch
- Includes all commit authors
- Sorted by contribution count (descending)
- No minimum contribution threshold

### Custom Filtering

To filter contributors (e.g., minimum 5 commits):

```typescript
// In scripts/fetch-contributors.ts
const filteredContributors = data
  .filter(c => c.contributions >= 5)
  .map(c => ({
    login: c.login,
    contributions: c.contributions
  }));
```

## Display on Splash Screen

### Ticker Behavior

- **Format**: `@username` for each contributor
- **Animation**: Horizontal scroll, infinite loop
- **Speed**: Configurable in `ContributorTicker` component
- **Pause**: Hover to pause (accessibility)

### Customization

Modify display in `src/components/common/ContributorTicker.tsx`:

```typescript
// Change prefix
const displayName = `${contributor.login}`; // Remove @

// Change separator
const separator = ' • '; // Instead of spaces

// Change scroll speed
scrollSpeed={100} // pixels per second
```

## Troubleshooting

### Contributors Not Showing

**Check**:
1. File exists: `src/data/contributors.json`
2. File contains valid JSON
3. Run fetch manually: `npm run fetch-contributors`
4. Check console for errors

**Solution**:
```bash
# Delete and regenerate
rm src/data/contributors.json
npm run fetch-contributors
```

### API Rate Limit Exceeded

**Symptoms**:
- Warning: "API rate limit exceeded"
- Fallback list used
- Build still succeeds

**Solutions**:
1. Add GitHub token to `.env.local`
2. Wait for rate limit reset (1 hour)
3. Use fallback list temporarily

### Wrong Repository

**Symptoms**:
- Contributors from different project
- "Repository not found" error

**Solution**:
```bash
# Check git remote
git remote get-url origin

# Update if needed
git remote set-url origin https://github.com/correct-org/correct-repo.git
```

### Empty Contributor List

**Symptoms**:
- `contributors.json` has empty array
- No names in ticker

**Possible Causes**:
1. New repository with no commits
2. Private repository without token
3. API authentication failure

**Solution**:
1. Ensure repository has commits
2. Add GitHub token for private repos
3. Check token permissions

## Testing

### Test Contributor Display

1. **Generate test data**:
   ```bash
   npm run fetch-contributors
   ```

2. **Check output**:
   ```bash
   cat src/data/contributors.json
   ```

3. **Preview splash screen**:
   - Open `public/assets/splash/preview.html`
   - Or run dev server: `npm run dev`

### Test Fallback

1. **Temporarily break API**:
   ```typescript
   // In scripts/fetch-contributors.ts
   throw new Error('Test fallback');
   ```

2. **Run fetch**:
   ```bash
   npm run fetch-contributors
   ```

3. **Verify fallback used**:
   ```bash
   cat src/data/contributors.json
   # Should show fallback list
   ```

## Best Practices

### Development

- ✅ Use GitHub token in `.env.local`
- ✅ Add `.env.local` to `.gitignore`
- ✅ Keep fallback list updated
- ✅ Test before major releases

### Production

- ✅ Ensure token available in CI/CD
- ✅ Monitor API rate limits
- ✅ Cache contributor data
- ✅ Update fallback regularly

### Security

- ❌ Never commit tokens to repository
- ❌ Never share tokens publicly
- ✅ Use environment variables
- ✅ Rotate tokens periodically
- ✅ Use minimal token permissions

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/build.yml
name: Build

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Fetch contributors
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: npm run fetch-contributors
      
      - name: Build
        run: npm run build
```

### Vercel

Add environment variable in Vercel dashboard:
- Key: `GITHUB_TOKEN`
- Value: Your personal access token
- Scope: Production, Preview, Development

## Advanced Usage

### Include Contributor Avatars

Modify `scripts/fetch-contributors.ts`:

```typescript
const contributors = data.map(c => ({
  login: c.login,
  contributions: c.contributions,
  avatar_url: c.avatar_url // Add avatar URL
}));
```

Update `contributors.json` structure and display component accordingly.

### Sort by Contribution Count

```typescript
// Already sorted by default, but to customize:
const sortedContributors = contributors.sort((a, b) => 
  b.contributions - a.contributions
);
```

### Filter by Date Range

```typescript
// Fetch commits in date range (requires additional API calls)
const since = '2025-01-01T00:00:00Z';
const until = '2025-12-31T23:59:59Z';

// Note: This requires fetching commits, not just contributors
// See GitHub API docs for commit filtering
```

## Related Documentation

- **Splash Screen Guide**: `src/components/common/VIVIAN_SPLASH_SCREEN_README.md`
- **Design Document**: `.kiro/specs/v1-vivian-splash-screen/design.md`
- **Requirements**: `.kiro/specs/v1-vivian-splash-screen/requirements.md`
- **GitHub API Docs**: https://docs.github.com/en/rest/repos/repos#list-repository-contributors

## Support

For issues with contributor fetching:
1. Check this guide
2. Review script output/errors
3. Test with manual fetch
4. Verify GitHub token permissions
5. Check API rate limits
6. Open an issue if problem persists

---

**Last Updated**: December 2025  
**Version**: 1.0.0 "Vivian"

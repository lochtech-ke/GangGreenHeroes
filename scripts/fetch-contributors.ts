import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Contributor {
  login: string;
  contributions: number;
}

interface ContributorList {
  contributors: Contributor[];
  lastUpdated: string;
  totalCount: number;
}

/**
 * Extract repository owner and name from git remote URL
 */
function getRepoInfo(): { owner: string; repo: string } | null {
  try {
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
    
    // Handle both HTTPS and SSH URLs
    // HTTPS: https://github.com/owner/repo.git
    // SSH: git@github.com:owner/repo.git
    const httpsMatch = remoteUrl.match(/github\.com[/:]([\w-]+)\/([\w-]+)(\.git)?$/);
    
    if (httpsMatch) {
      return {
        owner: httpsMatch[1],
        repo: httpsMatch[2]
      };
    }
    
    console.warn('⚠ Could not parse GitHub repository from remote URL:', remoteUrl);
    return null;
  } catch (error) {
    console.warn('⚠ Could not get git remote URL:', error);
    return null;
  }
}

/**
 * Fallback contributor list for when API fails
 */
const FALLBACK_CONTRIBUTORS: Contributor[] = [
  { login: 'lochtech-ke', contributions: 0 },
  { login: 'contributor1', contributions: 0 },
  { login: 'contributor2', contributions: 0 }
];

/**
 * Fetch contributors from GitHub API using native fetch
 */
async function fetchContributors(): Promise<void> {
  const repoInfo = getRepoInfo();
  
  if (!repoInfo) {
    console.warn('⚠ Using fallback contributor list (could not determine repository)');
    saveFallbackContributors();
    return;
  }

  const { owner, repo } = repoInfo;
  console.log(`📡 Fetching contributors for ${owner}/${repo}...`);

  try {
    // Build request headers
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'GangGreen-Platform'
    };
    
    // Add authentication if GITHUB_TOKEN is available
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
      console.log('  Using GITHUB_TOKEN for authentication');
    }

    // Fetch contributors from GitHub API
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=100`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    const contributors: Contributor[] = data
      .filter((c: any) => c.login && c.type === 'User') // Filter out bots and ensure login exists
      .map((c: any) => ({
        login: c.login,
        contributions: c.contributions
      }));

    const output: ContributorList = {
      contributors,
      lastUpdated: new Date().toISOString(),
      totalCount: contributors.length
    };

    saveContributors(output);
    console.log(`✓ Successfully fetched ${contributors.length} contributors`);
    
    // Log first few contributors for verification
    if (contributors.length > 0) {
      const preview = contributors.slice(0, 5).map(c => c.login).join(', ');
      console.log(`  Preview: ${preview}${contributors.length > 5 ? '...' : ''}`);
    }
  } catch (error: any) {
    console.error('✗ Failed to fetch contributors from GitHub API');
    
    if (error.message.includes('404')) {
      console.error('  Repository not found. Check that the repository is public or GITHUB_TOKEN has access.');
    } else if (error.message.includes('403')) {
      console.error('  Rate limit exceeded or access forbidden. Try setting GITHUB_TOKEN environment variable.');
    } else {
      console.error('  Error:', error.message);
    }
    
    console.warn('⚠ Using fallback contributor list');
    saveFallbackContributors();
  }
}

/**
 * Save contributors to JSON file
 */
function saveContributors(data: ContributorList): void {
  const outputDir = path.join(__dirname, '../src/data');
  const outputPath = path.join(outputDir, 'contributors.json');
  
  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
}

/**
 * Save fallback contributors
 */
function saveFallbackContributors(): void {
  const fallback: ContributorList = {
    contributors: FALLBACK_CONTRIBUTORS,
    lastUpdated: new Date().toISOString(),
    totalCount: FALLBACK_CONTRIBUTORS.length
  };
  
  saveContributors(fallback);
  console.log(`✓ Saved ${FALLBACK_CONTRIBUTORS.length} fallback contributors`);
}

// Run the script
fetchContributors().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

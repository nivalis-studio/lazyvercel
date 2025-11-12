import { getThemeColor, type Theme } from '@/lib/colors';
import type { Deployment } from '@/types/vercel-sdk';

export const getCreatedAt = (d: Deployment) => d.createdAt ?? d.created;

export const getBranch = (d: Deployment) =>
  d.meta?.githubCommitRef ||
  d.meta?.gitlabCommitRef ||
  d.meta?.bitbucketCommitRef ||
  d.meta?.commitRef ||
  d.meta?.branch ||
  '';

const MAX_COMMIT_SHA_LENGTH = 7;

export const getCommit = (d: Deployment) => {
  const sha =
    d.meta?.githubCommitSha ||
    d.meta?.gitlabCommitSha ||
    d.meta?.bitbucketCommitSha ||
    d.meta?.commitSha ||
    '';
  return sha.substring(0, MAX_COMMIT_SHA_LENGTH) || 'N/A';
};

export const getStatusInfo = (d: Deployment, theme: Theme) => {
  const getColor = getThemeColor(theme);
  const state = d.readyState || d.state || 'UNKNOWN';
  let fg = getColor('primary');
  let icon = '•';

  switch (state) {
    case 'READY':
      icon = '✓';
      fg = getColor('success');
      break;
    case 'QUEUED':
      fg = getColor('info');
      break;
    case 'BUILDING':
    case 'INITIALIZING':
      fg = getColor('warning');
      break;
    case 'ERROR':
    case 'CANCELED':
    case 'DELETED':
      icon = '✕';
      fg = getColor('error');
      break;
    default:
      fg = getColor('primary');
  }

  return { label: state, fg, icon } as const;
};

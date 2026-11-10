import open from 'open';

const HAS_SCHEME = /^[a-z][a-z\d+.-]*:\/\//i;

// Vercel returns deployment urls as bare hosts (e.g. `my-app.vercel.app`).
export const toBrowserUrl = (url: string) =>
  HAS_SCHEME.test(url) ? url : `https://${url}`;

export const openUrl = (url: string, onError: (error: Error) => void) => {
  open(toBrowserUrl(url)).catch((error: unknown) => {
    onError(error instanceof Error ? error : new Error(String(error)));
  });
};

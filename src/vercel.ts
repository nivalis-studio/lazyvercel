import { Vercel } from '@vercel/sdk';
import { CONFIG } from '@/lib/config';

let vercelInstance: Vercel | null = null;

export const resetVercelInstance = (): void => {
  vercelInstance = null;
};

export const getVercel = (): Vercel => {
  if (vercelInstance) {
    return vercelInstance;
  }

  vercelInstance = new Vercel({
    bearerToken: CONFIG.get().bearerToken,
  });

  return vercelInstance;
};

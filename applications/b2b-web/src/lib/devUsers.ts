import { mockUsers } from '@qred/b2b-app-schemas';

// DEMO STAND-IN for real auth: the seeded users with their hardcoded mock tokens.
// A real app would obtain the token from a login flow / identity provider.
export type DevUser = { name: string; token: string };

export const devUsers: DevUser[] = mockUsers.map(({ name, token }) => ({ name, token }));

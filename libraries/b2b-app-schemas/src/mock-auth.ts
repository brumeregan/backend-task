// MOCKED AUTH. Static bearer tokens for the seeded demo users, shared by the backend tests,
// the web demo and api.http (which has its own copy), so nobody has to generate tokens.
//
// They are HS256 JWTs (sub = user id, iss = qred-mock-auth) without an expiry, signed once with
// the default dev secret `dev-only-secret-change-me`. They only verify while the backend runs
// with that default secret (i.e. JWT_SECRET is not set). Production would use BankID/Freja
// behind an OIDC provider and never ship tokens in the source.
// USED FOR TESTING - web and smoke tests
export const mockUsers = [
  {
    name: 'Anna',
    userId: 'a0000000-0000-4000-8000-000000000001',
    companies: 'Company AB, Nordic Trade AB',
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3OTI1MDE3NjAsImlzcyI6InFyZWQtbW9jay1hdXRoIiwic3ViIjoiYTAwMDAwMDAtMDAwMC00MDAwLTgwMDAtMDAwMDAwMDAwMDAxIn0.5pV4Y1_S4la8uWBq_CfS4fCxap_rTjlKXMqCiewOP10',
  },
  {
    name: 'Erik',
    userId: 'a0000000-0000-4000-8000-000000000002',
    companies: 'Company AB',
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3OTI1MDE3NjAsImlzcyI6InFyZWQtbW9jay1hdXRoIiwic3ViIjoiYTAwMDAwMDAtMDAwMC00MDAwLTgwMDAtMDAwMDAwMDAwMDAyIn0.DDli2ntwA3r2Uintim4cWiR7MxEwGMDexlA4hIG8WIs',
  },
  {
    name: 'Sara',
    userId: 'a0000000-0000-4000-8000-000000000003',
    companies: 'Nordic Trade AB',
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3OTI1MDE3NjAsImlzcyI6InFyZWQtbW9jay1hdXRoIiwic3ViIjoiYTAwMDAwMDAtMDAwMC00MDAwLTgwMDAtMDAwMDAwMDAwMDAzIn0.JzIuLNDlKHy22KSnU0k7hKo0-ZRONra4LgJPEKTyAWs',
  },
] as const;

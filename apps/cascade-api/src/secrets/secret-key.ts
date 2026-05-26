export const SECRET_KEYS = ['JWT_SECRET', 'CREDENTIALS_ENC_KEY'] as const;
export type SecretKey = (typeof SECRET_KEYS)[number];

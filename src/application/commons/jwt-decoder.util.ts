export function decodeJwtPayload(token: string): Record<string, any> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT token');
  }
  const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
  return JSON.parse(payload);
}

export function extractCognitoGroups(accessToken: string): string[] {
  const payload = decodeJwtPayload(accessToken);
  return payload['cognito:groups'] || [];
}

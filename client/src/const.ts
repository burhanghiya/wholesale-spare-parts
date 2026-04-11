export const getLoginUrl = () => {
  const oauthPortalUrl = "https://wholesale-spare-parts-production.up.railway.app";
  const appId = "patel-spares-shop";
  const redirectUri = "https://wholesale-spare-parts-production.up.railway.app/api/oauth/callback";
  const state = btoa(redirectUri);
  
  return `${oauthPortalUrl}/login?appId=${appId}&state=${state}`;
};
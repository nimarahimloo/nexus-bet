export const appRoutePaths = ["/", "/matches", "/wallet", "/ai", "/vip", "/account", "/crash"] as const;

export type AppRoutePath = (typeof appRoutePaths)[number];

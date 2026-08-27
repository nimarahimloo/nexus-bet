export const appRoutePaths = ["/", "/matches", "/wallet", "/ai", "/vip", "/account", "/crash", "/promotions", "/tournaments", "/rewards", "/casino"] as const;

export type AppRoutePath = (typeof appRoutePaths)[number];

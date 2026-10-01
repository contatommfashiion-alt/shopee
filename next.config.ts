import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /**
     * Hosts allowed for `next/image`.
     *
     * `cf.shopee.com.br` is the host observed in `imageUrl` values returned by
     * `productOfferV2`. The `**.susercontent.com` pattern is Shopee's other public
     * image CDN and is listed as a precaution so offers served from it still render.
     *
     * Anything outside these patterns fails the optimizer request, which the
     * `ProductImage` component catches to render the visual fallback instead.
     *
     * TODO: if you observe another image host in the API response, add it here.
     */
    remotePatterns: [
      { protocol: "https", hostname: "cf.shopee.com.br", pathname: "/**" },
      { protocol: "https", hostname: "**.susercontent.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;

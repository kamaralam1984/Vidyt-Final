import { MetadataRoute } from 'next';
import { seoToolsList } from '@/data/seoToolsList';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = "https://vidyt.com";

    // Static Core Routes
    const staticRoutes = [
        "",
        "/about",
        "/tools",
        "/dashboard",
        "/pricing",
        "/login",
        "/signup"
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: route === "" ? 1 : 0.8,
    }));

    // Dynamic AI Tool Routes (Auto-generated from seoToolsList)
    const toolRoutes = seoToolsList.map((tool) => ({
        url: `${baseUrl}/tools/${tool.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }));

    // E.g. Blog Routes would go here as well

    return [...staticRoutes, ...toolRoutes];
}
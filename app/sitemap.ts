export default function sitemap() {
    const baseUrl = "https://vidyt.com";

    const routes = [
        "",
        "/dashboard",
        "/pricing",
        "/login",
    ];

    return routes.map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
    }));
}
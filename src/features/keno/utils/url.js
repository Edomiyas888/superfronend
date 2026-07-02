// Helper to extract query parameters from the URL (supports hash and search)
export function getQueryParam(param) {
    let searchParams;
    if (window.location.hash.includes("?")) {
        searchParams = new URLSearchParams(window.location.hash.split("?")[1]);
    } else {
        searchParams = new URLSearchParams(window.location.search);
    }
    return searchParams.get(param);
} 
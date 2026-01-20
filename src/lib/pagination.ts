
export function getPaginationItems(
    currentPage: number,
    totalPages: number,
    siblingCount: number = 2
): (number | 'ellipsis')[] {
    // If total pages is small enough, show all
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const items: (number | 'ellipsis')[] = [];
    const itemCount = siblingCount * 2 + 1; // Window size (e.g., 5)

    // Calculate generic start and end logic
    let start = currentPage - siblingCount;
    let end = currentPage + siblingCount;

    // Adjust if near start
    if (start <= 1) {
        start = 1;
        end = itemCount;
    }

    // Adjust if near end
    if (end >= totalPages) {
        start = totalPages - itemCount + 1;
        end = totalPages;
    }

    // Clamp strictly (should be covered by above, but safe guard)
    if (start < 1) start = 1;
    if (end > totalPages) end = totalPages;

    // Always show first page
    if (start > 1) {
        items.push(1);
        // Show ellipsis if there's a gap bigger than 1
        // e.g. if start=3, we have 1, gap(2), 3. So '...' represents 2.
        // If start=2, we have 1, 2. No ellipsis needed.
        if (start > 2) {
            items.push('ellipsis');
        }
    }

    // Add the window range
    for (let i = start; i <= end; i++) {
        items.push(i);
    }

    // Always show last page
    if (end < totalPages) {
        // Show ellipsis if gap
        if (end < totalPages - 1) {
            items.push('ellipsis');
        }
        items.push(totalPages);
    }

    return items;
}

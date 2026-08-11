/**
 * Search utility functions for enhanced question searching
 */

/**
 * Calculate similarity score between two strings (0-1)
 * Uses a simple character-based similarity algorithm
 */
export const calculateSimilarity = (str1: string, str2: string): number => {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    if (s1 === s2) return 1;
    if (s1.length === 0 || s2.length === 0) return 0;

    // Check if one string contains the other
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;

    // Calculate character overlap
    const chars1 = new Set(s1.split(''));
    const chars2 = new Set(s2.split(''));
    const intersection = new Set([...chars1].filter(x => chars2.has(x)));
    const union = new Set([...chars1, ...chars2]);

    return intersection.size / union.size;
};

/**
 * Check if a string matches the search term with fuzzy matching
 * Supports:
 * - Case-insensitive matching
 * - Partial word matching
 * - Similar word matching (typo tolerance)
 */
export const fuzzyMatch = (text: string, searchTerm: string, threshold: number = 0.6): boolean => {
    if (!text || !searchTerm) return false;

    const normalizedText = text.toLowerCase().trim();
    const normalizedSearch = searchTerm.toLowerCase().trim();

    // Exact match or contains
    if (normalizedText.includes(normalizedSearch)) return true;

    // Split into words and check each word
    const textWords = normalizedText.split(/\s+/);
    const searchWords = normalizedSearch.split(/\s+/);

    // Check if all search words have a match in text words
    return searchWords.every(searchWord => {
        return textWords.some(textWord => {
            // Direct match
            if (textWord.includes(searchWord) || searchWord.includes(textWord)) {
                return true;
            }

            // Fuzzy match for typos
            const similarity = calculateSimilarity(textWord, searchWord);
            return similarity >= threshold;
        });
    });
};

/**
 * Enhanced search filter for assignments
 * Searches across multiple fields with fuzzy matching
 */
export const searchAssignments = <T extends { QuestionName?: string; Topic?: string; Subject?: string }>(
    assignments: T[],
    searchTerm: string
): T[] => {
    if (!searchTerm || searchTerm.trim() === '') {
        return assignments;
    }

    const trimmedTerm = searchTerm.trim();

    return assignments.filter(assignment => {
        // Search in QuestionName
        if (assignment.QuestionName && fuzzyMatch(assignment.QuestionName, trimmedTerm)) {
            return true;
        }

        // Search in Topic
        if (assignment.Topic && fuzzyMatch(assignment.Topic, trimmedTerm)) {
            return true;
        }

        // Search in Subject
        if (assignment.Subject && fuzzyMatch(assignment.Subject, trimmedTerm)) {
            return true;
        }

        return false;
    });
};

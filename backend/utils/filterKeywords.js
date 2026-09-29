const stopWords = new Set([
    "the",
    "they",
    "them",
    "then",
    "i",
    "we",
    "you",
    "he",
    "she",
    "it",
    "is",
    "a",
    "an",
    "of",
    "and",
    "or",
    "to",
    "for",
    "from",
    "on",
    "who",
    "whom",
    "why",
    "when",
    "which",
    "with",
    "this",
    "that",
    "in",
    "at",
    "by",
    "be",
    "not",
    "was",
    "were",
    "has",
    "have",
    "had",
    "do",
    "does",
    "did",
    "so",
    "some",
    "any",
    "how",
    "can",
    "could",
    "should",
    "would",
    "there",
    "here",
    "just",
    "than",
    "because",
    "but",
    "its",
    "if",
]);


export const filterKeywords = (query) => {

    return query
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter(
            (word) =>
                word &&
                !stopWords.has(word)
        )
        .map((word) => `%${word}%`);
};
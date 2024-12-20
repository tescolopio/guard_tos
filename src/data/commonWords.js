// commonWords.js
const commonWords = [
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'if', 'in', 'is', 'it', 
    'of', 'on', 'or', 'so', 'the', 'to', 'up', 'with', 'you', 'your', 'i', 'me', 'my', 
    'we', 'us', 'our', 'he', 'him', 'his', 'she', 'her', 'they', 'them', 'their', 'itself', 
    'this', 'that', 'these', 'those', 'yes', 'no', 'one', 'two', 'first', 'second', 'have', 
    'has', 'do', 'does', 'did', 'will', 'would', 'can', 'could', 'shall', 'should', 'may', 
    'might', 'must', 'not', 'all', 'any', 'some', 'each', 'every', 'such', 'more', 'most', 
    'many', 'much', 'few', 'less', 'least', 'own', 'same', 'other', 'another', 'new', 'old', 
    'good', 'bad', 'great', 'small', 'large', 'long', 'short', 'high', 'low', 'early', 'late', 
    'young', 'old', 'right', 'left', 'next', 'last', 'first', 'second', 'third', 'fourth', 
    'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth','about', 'after', 'again', 'against', 'between', 'both', 'down', 'during', 'each', 'few', 'from', 'how', 'into', 'just', 'like', 'more', 'most', 'now', 'only', 'other', 
    'out', 'over', 'then', 'there', 'through', 'under', 'very', 'was', 'were', 'what', 
    'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'will', 'with', 'without'
];

if (typeof window !== 'undefined') {
    window.commonWords = commonWords;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { commonWords };
}
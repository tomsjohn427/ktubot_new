const axios = require('axios');

/**
 * Searches Wikimedia Commons directly for educational diagrams and images.
 * Uses gsrnamespace=6 to search File: namespace only — gets actual image files,
 * not article pages.
 */
async function getDiagramImage(query) {
  try {
    // Append 'diagram' if not already present to target educational graphics
    const safeQuery = query.toLowerCase().includes('diagram') ? query : `${query} diagram`;

    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(safeQuery)}&gsrlimit=1&prop=imageinfo&iiprop=url&format=json`;

    const response = await axios.get(url, {
      headers: { 'User-Agent': 'KTUBot/1.0 (Educational Academic Bot)' },
    });

    const pages = response.data?.query?.pages;
    if (!pages) return null;

    const firstPage = Object.values(pages)[0];
    if (firstPage?.imageinfo?.[0]?.url) {
      return firstPage.imageinfo[0].url;
    }

    return null;
  } catch (err) {
    console.error('Wikimedia Image Search Error:', err.message);
    return null;
  }
}

module.exports = { getDiagramImage };

export const FetchBooks = async (searchQuery, pageNumber, sort) => {
  try {
    const response = await fetch(
      `http://localhost:8000/api/search/?q=${searchQuery}&page=${pageNumber}&sort=${sort}`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch books');
    }
    const data = await response.json();
    return data.books || [];
  } catch (err) {
    throw new Error(err.message);
  }
};

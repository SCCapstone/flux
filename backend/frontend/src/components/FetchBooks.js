export const FetchBooks = async (searchQuery, pageNumber, filter) => {
  try {
    const queryParams = new URLSearchParams({
      q: searchQuery,
      page: pageNumber,
      filterType: filter
    });
    const response = await fetch(
        `http://localhost:8000/api/search/?${queryParams.toString()}`
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

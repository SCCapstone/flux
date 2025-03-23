export const FetchBooks = async (searchQuery, pageNumber, filter) => {
  try {
    const queryParams = new URLSearchParams({
      q: searchQuery,
      page: pageNumber,
      filterType: filter
    });
    const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
    const response = await fetch(
        `${apiBaseUrl}/search/?${queryParams.toString()}`
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

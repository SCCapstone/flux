/*
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

const fetchBooks = async (searchQuery, pageNumber, filter) => {
    setLoading(true);
    setError('');
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
      setBooks(data.books || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
*/

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

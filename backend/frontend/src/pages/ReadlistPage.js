import React from "react";
import { useParams } from "react-router-dom";
import Navigation from "../components/Navigation";
import BookList from "../components/BookList";

const ReadlistPage = () => {
  const { readlistId } = useParams();

  return (
    <div>
      <Navigation />
      <BookList
        apiEndpoint={`http://127.0.0.1:8000/api/readlists/${readlistId}/`}
        title="My Readlist"
        allowRemove={true}
      />
    </div>
  );
};

export default ReadlistPage;

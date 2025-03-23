import React, { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import Navigation from "../components/Navigation";
import BookList from "../components/BookList";
import { AuthContext } from "../AuthContext";

const ReadlistPage = () => {
  const { readlistId } = useParams();
  const { user } = useContext(AuthContext);
  const [readlistName, setReadlistName] = useState("Loading...");
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    const fetchReadlist = async () => {
      if (!user?.token) return;

      try {
        const response = await fetch(`${apiBaseUrl}/readlists/${readlistId}/`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setReadlistName(data.name || "My Readlist"); 
        }
      } catch (error) {
        console.error("Error fetching readlist:", error);
      }
    };

    fetchReadlist();
  }, [user, readlistId]);

  return (
    <div>
      <Navigation />
      <BookList apiEndpoint={`${apiBaseUrl}/readlists/${readlistId}/`} title={readlistName} allowRemove={true} />
    </div>
  );
};

export default ReadlistPage;

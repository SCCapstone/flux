import React, { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import Navigation from "../components/Navigation";
import BookList from "../components/BookList";
import { AuthContext } from "../AuthContext";

const ReadlistPage = () => {
  const { readlistId } = useParams();
  const { user } = useContext(AuthContext);
  const [readlistName, setReadlistName] = useState("Loading...");

  useEffect(() => {
    const fetchReadlist = async () => {
      if (!user?.token) return;

      try {
        const response = await fetch(`http://127.0.0.1:8000/api/readlists/${readlistId}/`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setReadlistName(data.name || "My Readlist"); // ✅ Use API name or fallback
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
      <BookList apiEndpoint={`http://127.0.0.1:8000/api/readlists/${readlistId}/`} title={readlistName} allowRemove={true} />
    </div>
  );
};

export default ReadlistPage;

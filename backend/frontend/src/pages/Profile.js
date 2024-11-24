import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const UserProfile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch profile data
    useEffect(() => {
        fetch("/api/profile/")
            .then((response) => response.json())
            .then((data) => {
                setProfile(data);
                setLoading(false);
            })
            .catch((error) => console.error("Error fetching profile:", error));
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="profile-container">
            <header className="profile-header">
                <h1>Personal Profile</h1>
                <Link to="/" className="go-back">
                    &lt; Go Back
                </Link>
            </header>
            <div className="profile-details">
                <img
                    src={profile.profile_picture || "/default-avatar.png"}
                    alt={`${profile.name}'s Profile`}
                    className="profile-picture"
                />
                <h2>{profile.name}</h2>
                <p>{profile.bio}</p>
                <div className="profile-stats">
                    <p>
                        <strong>{profile.ratings}</strong> Ratings
                    </p>
                    <p>
                        <strong>{profile.reviews}</strong> Reviews
                    </p>
                </div>
                <div className="profile-actions">
                    <Link to="/profile/edit" className="edit-profile">
                        Edit Profile
                    </Link>
                    <button className="logout-button">Logout</button>
                </div>
            </div>
            <div className="favorite-books">
                <h3>Favorite Books</h3>
                <div className="book-list">
                    {profile.favorite_books.map((book) => (
                        <img
                            key={book.id}
                            src={book.cover}
                            alt={book.title}
                            className="book-cover"
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default UserProfile;

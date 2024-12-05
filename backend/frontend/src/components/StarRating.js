import React, { useState } from 'react';
import '../styles/StarRating.css';

const StarRating = ({ totalStars = 5, value = 0, onRatingChange }) => {
    const [rating, setRating] = useState(value);
    const [hoveredRating, setHoveredRating] = useState(0);

    const handleStarClick = (index) => {
        const newRating = index + 1;
        setRating(newRating);
        if (onRatingChange) onRatingChange(newRating);
    };

    const handleMouseEnter = (index) => {
        setHoveredRating(index + 1);
    };

    const handleMouseLeave = () => {
        setHoveredRating(0);
    };

    return (
        <div className="star-rating" onMouseLeave={handleMouseLeave}>
            {Array.from({ length: totalStars }, (_, index) => (
                <span
                    key={index}
                    className={`star ${
                        index < (hoveredRating || rating) ? 'filled' : 'empty'
                    } ${index < rating ? 'selected' : ''}`}
                    onClick={() => handleStarClick(index)}
                    onMouseEnter={() => handleMouseEnter(index)}
                >
                    ★
                </span>
            ))}
        </div>
    );
};

export default StarRating;
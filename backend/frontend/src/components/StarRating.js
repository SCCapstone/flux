import React, { useState } from 'react';

const StarRating = ({ totalStars = 5, value = 0, onRatingChange }) => {
    const [rating, setRating] = useState(value);

    const handleStarClick = (index) => {
        setRating(index + 1);
        if (onRatingChange) onRatingChange(index + 1);
    };

    return (
        <div style={{ display: 'flex', gap: '5px', cursor: 'pointer' }}>
            {Array.from({ length: totalStars }, (_, index) => (
                <span
                    key={index}
                    onClick={() => handleStarClick(index)}
                    style={{
                        fontSize: '24px',
                        color: index < rating ? '#ffd700' : '#ccc',
                    }}
                >
                    ★
                </span>
            ))}
        </div>
    );
};

export default StarRating;
import React, { useEffect, useState } from "react";
import axios from "axios";

const Achievements = () => {
    const [achievements, setAchievements] = useState([]);

    useEffect(() => {
        const fetchAchievements = async () => {
            try {
                const response = await axios.get("/api/achievements/");
                setAchievements(response.data);
            } catch (error) {
                console.error("Error fetching achievements:", error);
            }
        };
        fetchAchievements();
    }, []);

    return (
        <div>
            <h2>🏆 Your Achievements</h2>
            {achievements.length === 0 ? (
                <p>No achievements yet. Start rating books!</p>
            ) : (
                <ul>
                    {achievements.map((ach, index) => (
                        <li key={index}>
                            <strong>{ach.name}</strong> - {ach.description}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Achievements;

const MilestoneProgress = ({ completed, target }) => {
    const percentage = Math.min((completed / target) * 100, 100);

    return (
        <div>
            <p>Progress: {completed}/{target}</p>
            <div style={{ background: "#ccc", width: "100%", height: "10px" }}>
                <div
                    style={{
                        width: `${percentage}%`,
                        background: "green",
                        height: "10px"
                    }}
                />
            </div>
        </div>
    );
};

// Usage in Achievements Component:
<MilestoneProgress completed={5} target={10} />
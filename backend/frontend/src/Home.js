import React from 'react';

function Home({ onLogout }) {
  return (
    <div>
      <h2>Welcome to the Home Page</h2>
      <p>You are now logged in!</p>
      <button onClick={onLogout}>Logout</button>
    </div>
  );
}

export default Home;
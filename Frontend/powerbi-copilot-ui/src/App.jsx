import { useState, useEffect } from "react";

import Chatbot from "./components/chatbot";

import HeroImage from "./assets/FrameBackground.png"; // Import the background image

function App() {
  return (
    <>
    <div
      className="min-h-screen bg-cover bg-center"
      style={{
        backgroundImage: `url(${HeroImage})`, // Apply background image only after it's loaded
      }}
    >
      <Chatbot/>
    </div>
    </>
  );
}

export default App;

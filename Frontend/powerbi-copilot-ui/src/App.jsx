import { useState, useEffect } from "react";



import HeroImage from "./assets/FrameBackground.png"; // Import the background image
import Chatbot from "./components/Chatbot";

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

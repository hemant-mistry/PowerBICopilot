import { useState, useEffect } from "react";
import HeroImage from "./assets/FrameBackground.png"; // Import the background image
import Chatbot from "./components/Chatbot";
import Report from "./components/Report";

function App() {
  return (
    <div className="min-h-screen bg-cover bg-center flex">
      <div className="flex-1 flex justify-center items-center ml-5">
        <Report />
      </div>
      <div className="flex-1 flex justify-center items-center">
        <Chatbot />
      </div>
    </div>
  );
}

export default App;

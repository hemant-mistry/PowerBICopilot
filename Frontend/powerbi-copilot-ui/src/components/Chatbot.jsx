import React, { useRef, useEffect, useState } from "react";
import axios from "axios";
import sendIcon from "../assets/sendicon.png";
import promptGuide from "../assets/prompt-guide.png";
import ReactMarkdown from "react-markdown";
import BarChart from "./Charts/BarChart";
import AreaChart from "./Charts/AreaChart";
import LineChart from "./Charts/LineChart";
import PieChart from "./Charts/PieChart";

function Chatbot() {
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isFirstMessage, setIsFirstMessage] = useState(true);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [tableData, setTableData] = useState(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    adjustHeight();
  }, [message]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    setIsFirstMessage(false);
    const userMessage = {
      role: "user",
      content: message,
    };

    // Add user message to state
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setMessage("");
    setLoading(true);

    // Add "Processing..." bot message
    const processingMessage = {
      role: "bot",
      content: "Processing...",
    };
    setMessages((prevMessages) => [...prevMessages, processingMessage]);

    try {
      const response = await axios.post("https://powerbicopilotbackend.azurewebsites.net/api", {
        message: userMessage.content,
        chat_history: messages,
      });

      console.log("Response data:", response.data);
      const parsedReactComponentCode = response.data.react_component;
      const intentClassifier = Number(response.data.intent_classifier); // Convert to number
      const result = response.data.result;

      if (result && result.results && result.results[0]) {
        const rows = result.results[0].tables?.[0]?.rows || [];
        setChartData(rows);

        let chartComponent = null;

        switch (intentClassifier) {
          case 1:
            chartComponent = (
              <AreaChart
                data={rows}
                reactComponentCode={parsedReactComponentCode}
              />
            );
            break;
          case 2:
            chartComponent = (
              <BarChart
                data={rows}
                reactComponentCode={parsedReactComponentCode}
              />
            );
            break;
          case 3:
            chartComponent = (
              <LineChart
                data={rows}
                reactComponentCode={parsedReactComponentCode}
              />
            );
            break;
          case 4:
            chartComponent = (
              <PieChart
                data={rows}
                reactComponentCode={parsedReactComponentCode}
              />
            );
            break;
          default:
            setTableData(rows);
            chartComponent = null;
            break;
        }

        const botMessage = {
          role: "bot",
          content: chartComponent || (
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    {rows.length > 0 ? (
                      Object.keys(rows[0]).map((key, idx) => (
                        <th key={idx} scope="col" className="px-6 py-3">
                          {key}
                        </th>
                      ))
                    ) : (
                      <th scope="col" className="px-6 py-3">
                        No Data
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.length > 0 ? (
                    rows.map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className="bg-white border-b dark:bg-gray-800 dark:border-gray-700"
                      >
                        {Object.keys(row).map((key, cellIndex) => (
                          <td key={cellIndex} className="px-6 py-4">
                            {row[key] || "N/A"}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={Object.keys(rows[0]).length || 1}
                        className="px-6 py-4 text-center"
                      >
                        No Data
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ),
        };

        // Replace the "Processing..." message with the actual bot response
        setMessages((prevMessages) => [
          ...prevMessages.slice(0, -1),
          botMessage,
        ]);
      } else {
        throw new Error("Unexpected response structure");
      }
    } catch (error) {
      console.error("Error sending message:", error.message);
      const errorMessage = {
        role: "bot",
        content:
          "There was an error processing your request. Please try again.",
      };

      // Replace the "Processing..." message with the error message
      setMessages((prevMessages) => [
        ...prevMessages.slice(0, -1),
        errorMessage,
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handlePromptClick = (prompt) => {
    setMessage(prompt);
    handleSendMessage();
    setIsMenuVisible(false);
  };

  const PromptGuideMenu = ({ handlePromptClick }) => (
    <div className="absolute bottom-full left-0 mb-2 w-full border bg-black max-w-sm shadow-lg rounded-lg p-4">
      <h3 className="text-lg font-bold mb-2">Prompt Guide</h3>
      <ul className=" list-inside">
        <li
          onClick={() =>
            handlePromptClick("Show me the sum of profit by category")
          }
          className="cursor-pointer hover:text-blue-600"
        >
          Show me the sum of profit by category
        </li>
        
        <li
          onClick={() =>
            handlePromptClick(
              "Show me the top 5 products with highest sales"
            )
          }
          className="cursor-pointer hover:text-blue-600"
        >
         Show me the top 5 products with highest sales
        </li>
        <li
          onClick={() =>
            handlePromptClick("Can you show me sales by segment in a pie chart?")
          }
          className="cursor-pointer hover:text-blue-600"
        >
          Can you show me sales by segment in a pie chart?
        </li>
        <li
          onClick={() =>
            handlePromptClick("Show me the top 3 countries with the highest sales")
          }
          className="cursor-pointer hover:text-blue-600"
        >
          Show me the top 3 countries with the highest sales
        </li>
      </ul>
    </div>
  );

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <>
      {isFirstMessage ? (
        <div className="flex flex-col pt-[80px]">
          <div className="flex flex-col text-center mx-auto w-full max-w-2xl">
            <h1 className="lg:text-5xl sm:text-5xl font-bold">Welcome back!</h1>
            <p className="py-6 lg:text-lg sm:text-lg">
              This is a POC Power BI Custom Copilot trained on the semantic
              model.
              <br />
              Select one of the prompts mentioned below to get started.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center pt-[80px]">
          <div className="flex flex-col overflow-y-auto text-md w-full max-w-2xl h-[70vh] sm:h-[40vh] lg:h-[65vh] p-4 no-scrollbar">
            {messages.map((msg, index) => (
              <div key={index} className="mb-4 flex items-start">
                <div className="relative inline-flex items-center justify-center w-10 h-10 overflow-hidden bg-gray-100 rounded-full dark:bg-gray-600 mr-5">
                  <span className="font-medium text-gray-600 dark:text-gray-300">
                    {msg.role === "user" ? "US" : "AI"}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                  {typeof msg.content === "string" ? (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      <div className="fixed h-50 w-full p-2 flex flex-col items-center gap-2 ml-3 bottom-5">
        <div className="relative w-full max-w-2xl">
          <div className="flex items-center relative">
            <textarea
              ref={textareaRef}
              rows={1}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
              className="w-full rounded-lg p-2 resize-none pr-[70px]"
            />
            <div className="flex items-center absolute right-2 top-0 h-full">
              <button
                className="btn"
                onClick={() => setIsMenuVisible((prev) => !prev)}
              >
                 <img src={promptGuide} alt="prompt-guide" className="w-6 h-6" />
              </button>
              <button
                className="flex items-center justify-center ml-5"
                onClick={handleSendMessage}
              >
                <img src={sendIcon} alt="Send" className="w-6 h-6" />
              </button>
            </div>
          </div>
          {isMenuVisible && (
            <PromptGuideMenu handlePromptClick={handlePromptClick} />
          )}
        </div>

        <div className="prompt-caution text-center text-xs mt-2">
          Responses may display inaccurate info, including about people, so
          double-check its responses.
        </div>
      </div>
    </>
  );
}
export default Chatbot;

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
      content: (
        <div className="bg-gray-200 text-black rounded-lg px-3 py-2">
          Processing...
        </div>
      ),
    };
    setMessages((prevMessages) => [...prevMessages, processingMessage]);

    try {
      const response = await axios.post(
        "https://powerbicopilotbackend.azurewebsites.net/api",
        {
          message: userMessage.content,
          chat_history: messages,
        }
      );

      console.log("Response data:", response.data);
      const parsedReactComponentCode = response.data.react_component;
      const intentClassifier = Number(response.data.intent_classifier);
      const result = response.data.result;

      if (result && result.results && result.results[0]) {
        const rows = result.results[0].tables?.[0]?.rows || [];
        setChartData(rows);

        let chartComponent = null;

        switch (intentClassifier) {
          case 1:
            chartComponent = (
              <div className="bg-gray-200 text-black rounded-lg px-3 py-2">
                <AreaChart
                  data={rows}
                  reactComponentCode={parsedReactComponentCode}
                />
              </div>
            );
            break;
          case 2:
            chartComponent = (
              <div className="bg-gray-200 text-black rounded-lg px-3 py-2">
                <BarChart
                  data={rows}
                  reactComponentCode={parsedReactComponentCode}
                />
              </div>
            );
            break;
          case 3:
            chartComponent = (
              <div className="bg-gray-200 text-black rounded-lg px-3 py-2">
                <LineChart
                  data={rows}
                  reactComponentCode={parsedReactComponentCode}
                />
              </div>
            );
            break;
          case 4:
            chartComponent = (
              <div className="bg-gray-200 text-black rounded-lg px-3 py-2">
                <PieChart
                  data={rows}
                  reactComponentCode={parsedReactComponentCode}
                />
              </div>
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
              <table className="w-full text-sm text-left rtl:text-right text-black dark:text-black">
                <thead className="text-xs text-black uppercase bg-gray-100 dark:bg-gray-200 dark:text-black">
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
                        className="bg-   border-b dark:bg-gray-200 dark:border-gray-700"
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
            handlePromptClick("Show me the top 5 products with highest sales")
          }
          className="cursor-pointer hover:text-blue-600"
        >
          Show me the top 5 products with highest sales
        </li>
        <li
          onClick={() =>
            handlePromptClick(
              "Can you show me sales by segment in a pie chart?"
            )
          }
          className="cursor-pointer hover:text-blue-600"
        >
          Can you show me sales by segment in a pie chart?
        </li>
        <li
          onClick={() =>
            handlePromptClick(
              "Show me the top 3 countries with the highest sales"
            )
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
    <div className="bg-gray-100 p-5 rounded-[10px] min-h-[700px] flex flex-col justify-between">
      <div className="text-lg text-black mb-3 text-center font-bold">Custom Copilot</div>
      {isFirstMessage ? (
        <div className="flex flex-col">
          <div className="flex flex-col text-center mx-auto w-full max-w-md">
            {" "}
            {/* Updated max-w-2xl to max-w-xl */}
            <h1 className="lg:text-2xl sm:text-5xl font-bold text-black">Welcome back!</h1>
            <p className="py-6 lg:text-sm sm:text-lg text-black">
              This is a POC Power BI Custom Copilot trained on the semantic
              model.
              <br />
              Select one of the prompts mentioned below to get started.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="flex flex-col overflow-y-auto text-md w-full max-w-md h-[70vh] sm:h-[40vh] lg:h-[65vh] p-4 no-scrollbar">
            {" "}
            {/* Updated max-w-2xl to max-w-xl */}
            {messages.map((msg, index) => (
              <div key={index} className="mb-4 flex items-start">
                <div className="relative inline-flex items-center justify-center w-10 h-10 overflow-hidden bg-gray-200 rounded-full dark:bg-gray-200 mr-5 flex-shrink-0">
                  {" "}
                  <span className="font-medium text-gray-600">
                    {msg.role === "user" ? "US" : "AI"}
                  </span>
                </div>
                <div className="relative max-w-[100%]">
                  {typeof msg.content === "string" ? (
                    <div
                      className={`relative ${
                        msg.role === "user"
                          ? "bg-gray-200 text-black  self-end"
                          : "bg-gray-200"
                      } rounded-lg px-3 py-2`}
                    >
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <div>{msg.content}</div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}
      <div className="relative flex items-center justify-center mt-5">
      <textarea
              ref={textareaRef}
              rows={1}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
              className="w-full rounded-lg p-2 resize-none bg-gray-200 border-none outline-none text-black"
              />
        <button className="ml-2" onClick={handleSendMessage} disabled={loading}>
          <img src={sendIcon} alt="Send" />
        </button>
      </div>
    </div>
  );
}

export default Chatbot;

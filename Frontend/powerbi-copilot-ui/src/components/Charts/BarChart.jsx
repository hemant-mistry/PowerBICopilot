import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const truncateLabel = (label, maxLength = 20) => {
  return label.length > maxLength ? `${label.slice(0, maxLength)}...` : label;
};


const BarChart = ({ data, reactComponentCode }) => {
    let chartData = {};
    console.log("Barchart Data",data)
    console.log("React_component", reactComponentCode)
    try {
      const generateChartData = new Function('data', `
        const truncateLabel = ${truncateLabel.toString()};
        return {
          ${reactComponentCode}
        };
      `);
      chartData = generateChartData(data);
    } catch (error) {
      console.error("Error generating chart data:", error);
    }
  
    console.log("Constructed chartData:", chartData);

  return (
    <div className="chart-container max-w-xs sm:min-w-sm md:min-w-md lg:min-w-lg">
      <Bar data={chartData} />
    </div>
  );
};

export default BarChart;
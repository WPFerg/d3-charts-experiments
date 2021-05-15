import React, { useEffect, useState } from "react";
import "./App.css";
import BarChart from "./BarChart";

function App() {
  const [data, setData] = useState<number[]>([]);

  useEffect(() => {
    const getValue = () => -500 + Math.random() * 2000;
    const addDataHandle = window.setInterval(
      () => setData((data) => [...data, getValue()]),
      200
    );
    const resetDataHandle = window.setInterval(
      () => setData(Array(25).fill(0).map(getValue)),
      30000
    );

    return () => {
      window.clearInterval(addDataHandle);
      window.clearInterval(resetDataHandle);
    };
  }, []);

  return (
    <div className="App">
      <BarChart data={data} />
    </div>
  );
}

export default App;

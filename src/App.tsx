import React, { useEffect, useState } from "react";
import "./App.css";
import BarChart from "./BarChart";

function App() {
  const [data, setData] = useState<number[]>([10]);

  useEffect(() => {
    const handle = window.setInterval(
      () => setData((data) => [...data, Math.random() * 200]),
      200
    );

    return () => window.clearInterval(handle);
  }, []);

  return (
    <div className="App">
      <BarChart data={data} />
    </div>
  );
}

export default App;

import React from "react";
import useStore from "../store/useStore";

const ResultsDisplay = () => {
  const { results } = useStore();

  return (
    <div>
      <h2>Results</h2>
      {results.length === 0 ? (
        <p>No results to display</p>
      ) : (
        <ul>
          {results.map((result, index) => (
            <li key={index}>{result}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ResultsDisplay;
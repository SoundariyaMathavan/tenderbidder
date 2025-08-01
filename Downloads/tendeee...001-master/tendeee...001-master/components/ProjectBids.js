import React, { useState } from "react";

export default function ProjectBids({ tenderDoc, bidderDocs }) {
  const [mlResults, setMlResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleReanalyze = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append("tender", tenderDoc); // tenderDoc should be a File object
    bidderDocs.forEach((doc, idx) => formData.append(`bidder_${idx}`, doc)); // bidderDocs: array of File objects

    const res = await fetch("/api/ml-analyze", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setMlResults(data);
    setLoading(false);
  };

  return (
    <div>
      {/* ...existing summary and analytics UI... */}
      <button
        className="ml-2 px-4 py-2 bg-blue-600 text-white rounded"
        onClick={handleReanalyze}
        disabled={loading}
      >
        {loading ? "Analyzing..." : "Re-analyze Bids"}
      </button>
      {mlResults && (
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4 text-green-700">ML Analysis Winner</h3>
          <div className="bg-green-50 p-4 rounded mb-4">
            <strong>{mlResults.winner.name}</strong> <br />
            ML Overall Score: <span className="text-red-600 font-bold">{mlResults.winner.score}%</span> <br />
            Analysis Confidence: <span className="text-yellow-600">{mlResults.winner.confidence}%</span>
            <div className="mt-2">
              Semantic Similarity: {mlResults.winner.semantic}%
              <br />
              Keyword Relevance: {mlResults.winner.keywords}%
              <br />
              Technical Coverage: {mlResults.winner.technical}%
              <br />
              Document Quality: {mlResults.winner.quality}%
            </div>
          </div>
          <h4 className="font-semibold mb-2">Document Rankings</h4>
          {mlResults.rankings.map((bid, idx) => (
            <div key={idx} className="mb-2 p-2 border rounded">
              <strong>{bid.name}</strong> - Score: <span className="text-red-600">{bid.score}%</span> ({bid.confidence}% confidence)
              <br />
              Semantic: {bid.semantic}% | Keywords: {bid.keywords}% | Technical: {bid.technical}% | Quality: {bid.quality}%
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
import React, { useState } from "react";

export default function TenderAnalysis() {
  const [tenderDoc, setTenderDoc] = useState(null);
  const [bidderDocs, setBidderDocs] = useState([]);
  const [preview, setPreview] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTenderUpload = (e) => setTenderDoc(e.target.files[0]);
  const handleBidderUpload = (e) => setBidderDocs([...e.target.files]);

  const handlePreview = () => {
    setPreview({
      tender: tenderDoc ? { name: tenderDoc.name, size: tenderDoc.size } : null,
      bidders: bidderDocs.map((doc) => ({ name: doc.name, size: doc.size })),
    });
  };

  const handleAnalyze = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append("tender", tenderDoc);
    bidderDocs.forEach((doc, idx) => formData.append(`bidder_${idx}`, doc));
    const res = await fetch("/api/ml-analyze", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setResults(data);
    setLoading(false);
  };

  return (
    <div className="bg-white p-8 rounded shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center text-purple-700">Tender Document Evaluation System</h2>
      <div className="flex gap-8 mb-6">
        <div className="flex-1 border-dashed border-2 border-blue-300 p-4 rounded">
          <h3 className="font-semibold mb-2">Tender Document</h3>
          <input type="file" accept=".pdf,.doc,.docx,.txt,.png,.jpg" onChange={handleTenderUpload} />
        </div>
        <div className="flex-1 border-dashed border-2 border-purple-300 p-4 rounded">
          <h3 className="font-semibold mb-2">Bidder Documents</h3>
          <input type="file" multiple accept=".pdf,.doc,.docx,.txt,.png,.jpg" onChange={handleBidderUpload} />
        </div>
      </div>
      <button
        className="w-full py-2 bg-gradient-to-r from-purple-400 to-blue-400 text-white rounded font-semibold"
        onClick={handlePreview}
        disabled={!tenderDoc || bidderDocs.length === 0}
      >
        ML Analysis Preview
      </button>
      {preview && (
        <div className="mt-6 flex gap-8">
          <div className="flex-1 bg-blue-50 p-4 rounded">
            <h4 className="font-semibold mb-2">Text Extraction:</h4>
            <div>✓ {preview.tender.name} <br /> Size: {(preview.tender.size / 1024).toFixed(2)} KB</div>
          </div>
          <div className="flex-1 bg-purple-50 p-4 rounded">
            <h4 className="font-semibold mb-2">ML Document Analysis:</h4>
            <div>✓ {preview.bidders.length} documents for ML comparison <br /> Total size: {(preview.bidders.reduce((a, b) => a + b.size, 0) / 1024).toFixed(2)} KB</div>
          </div>
        </div>
      )}
      <button
        className="w-full mt-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded font-semibold"
        onClick={handleAnalyze}
        disabled={!preview || loading}
      >
        {loading ? "Analyzing..." : "Start Analysis"}
      </button>
      {results && (
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4 text-green-700">ML Analysis Winner</h3>
          <div className="bg-green-50 p-4 rounded mb-4">
            <strong>{results.winner.name}</strong> <br />
            ML Overall Score: <span className="text-red-600 font-bold">{results.winner.score}%</span> <br />
            Analysis Confidence: <span className="text-yellow-600">{results.winner.confidence}%</span>
            <div className="mt-2">
              Semantic Similarity: {results.winner.semantic}%
              <br />
              Keyword Relevance: {results.winner.keywords}%
              <br />
              Technical Coverage: {results.winner.technical}%
              <br />
              Document Quality: {results.winner.quality}%
            </div>
          </div>
          <h4 className="font-semibold mb-2">Document Rankings</h4>
          {results.rankings.map((bid, idx) => (
            <div key={idx} className="mb-2 p-2 border rounded">
              <strong>{bid.name}</strong> - Score: <span className="text-red-600">{bid.score}%</span> ({bid.confidence}% confidence)
              <br />
              Semantic: {bid.semantic}% | Keywords: {bid.keywords}% | Technical: {bid.technical}% | Quality: {bid.quality}%
            </div>
          ))}
        </div>
import { useState } from "react";
import axios from "axios";

function App() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [detectionResults, setDetectionResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [petBottleCount, setPetBottleCount] = useState(0);
  const [hdpeBottleCount, setHdpeBottleCount] = useState(0);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setDetectionResults([]);
      setStatusMessage("");
      setPetBottleCount(0);
      setHdpeBottleCount(0);
    }
  };

  const handleUpload = async () => {
    if (!image) {
      setStatusMessage("Please select an image before uploading.");
      return;
    }

    const formData = new FormData();
    formData.append("image", image);

    setLoading(true);
    setStatusMessage("⏳ Processing image...");

    try {
      const response = await axios.post("http://127.0.0.1:5000/detect", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const detections = response.data.detections || [];

      console.log("API Response:", detections); // Debugging

      if (detections.length === 0) {
        setStatusMessage("❌ This item cannot be recycled.");
        setDetectionResults([]);
        setPetBottleCount(0);
        setHdpeBottleCount(0);
        return;
      }

      setDetectionResults(detections);

      // Count PET and HDPE bottles separately
      const petCount = detections.filter(det => det.class.toLowerCase().includes("pet")).length;
      const hdpeCount = detections.filter(det => det.class.toLowerCase().includes("hdpe")).length;

      setPetBottleCount(petCount);
      setHdpeBottleCount(hdpeCount);
      setStatusMessage("✅ Detection complete!");
    } catch (error) {
      console.error("Error uploading image:", error);
      setStatusMessage("❌ Error processing image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-200 p-5">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">Plastic Detection System</h1>

      <div className="bg-white p-6 rounded-lg shadow-md w-96 flex flex-col items-center">
        <label className="cursor-pointer px-5 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition">
          Choose File
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            className="hidden"
          />
        </label>

        {preview && (
          <div className="mt-4">
            <p className="text-sm text-gray-600">Preview:</p>
            <img src={preview} alt="Preview" className="w-64 h-auto rounded-lg border shadow-md mt-2" />
          </div>
        )}

        <button 
          onClick={handleUpload} 
          className="mt-4 px-5 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Processing..." : "Upload & Detect"}
        </button>

        {statusMessage && <p className="mt-2 text-sm text-gray-700">{statusMessage}</p>}
      </div>

      {detectionResults.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-2xl mt-6">
          <h3 className="text-lg font-bold text-gray-900">Detection Results:</h3>

          <p className="mt-2 text-lg font-bold text-blue-700">
            Total Bottles Detected: {petBottleCount + hdpeBottleCount}
          </p>
          <p className="text-md text-green-700">PET Bottles: {petBottleCount}</p>
          <p className="text-md text-green-700">HDPE Bottles: {hdpeBottleCount}</p>

          <ul className="mt-3 space-y-2">
            {detectionResults.map((det, index) => (
              <li key={index} className="p-4 border-l-4 rounded-md shadow-sm text-gray-900 bg-gray-50"
                style={{ borderColor: (det.class.toLowerCase().includes("pet") || det.class.toLowerCase().includes("hdpe")) ? "#22c55e" : "#f97316" }}>
                <p className="text-md font-bold">{det.class}</p>
                <p>Confidence: <span className="font-semibold">{det.confidence}</span></p>
                <p>BBox: <span className="text-xs">{JSON.stringify(det.bbox)}</span></p>
                {det.class.toLowerCase().includes("pet") || det.class.toLowerCase().includes("hdpe") ? (
                  <p className="text-green-600 font-bold">♻️ This item is recyclable!</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
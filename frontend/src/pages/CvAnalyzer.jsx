import CVUploader from "../components/CVUploader";

function CvAnalyzer() {
  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center">
      <div className="bg-white p-10 rounded-lg shadow w-[500px]">
        <h2 className="text-2xl font-bold mb-6 text-center">Analyze Your CV</h2>

        <CVUploader />
      </div>
    </div>
  );
}

export default CvAnalyzer;

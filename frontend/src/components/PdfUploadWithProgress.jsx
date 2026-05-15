import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

export default function PdfUploadWithProgress({ subjectId, moduleNumber, moduleName, onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // Refs for managing the timer and the file input UI
  const pollIntervalRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !subjectId) return;

    setIsUploading(true);
    setProgress(0);
    setStatusText('Starting upload...');

    // 1. Generate a unique Job ID for this specific upload
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 2. Prepare the file and data to send to the backend
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('subjectId', subjectId);
    
    // Send the module data (with fallbacks just in case)
    formData.append('moduleNumber', moduleNumber || '1');
    formData.append('moduleName', moduleName || `Module ${moduleNumber || '1'}`);
    
    // Send the tracking ID!
    formData.append('jobId', jobId); 

    try {
      // 3. Start the Polling Loop BEFORE sending the file
      pollIntervalRef.current = setInterval(async () => {
        try {
          const { data } = await axios.get(`/api/admin/upload-progress/${jobId}`);
          
          if (data.total > 0) {
            const percentage = Math.round((data.completed / data.total) * 100);
            setProgress(percentage);
            setStatusText(`Processing: ${data.completed} / ${data.total} chunks embedded...`);
          }

          // 4. Stop polling when the backend says it is done
          if (data.status === 'completed') {
            clearInterval(pollIntervalRef.current);
            setProgress(100);
            setStatusText('✅ Upload and Indexing Complete!');
            setIsUploading(false);
            setFile(null); // Clear the file from state
            if (fileInputRef.current) fileInputRef.current.value = ''; // Clear the input visually
            
            // Trigger the Admin page to reload the notes list!
            if (onUploadComplete) onUploadComplete();
          }
        } catch (err) {
          console.log("Waiting for backend to register job...");
        }
      }, 1000);

      // 5. Send the actual file upload request to your notes route
      await axios.post('/api/notes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

    } catch (error) {
      console.error("Upload failed:", error);
      clearInterval(pollIntervalRef.current);
      setStatusText(error?.response?.data?.message || '❌ Upload failed. Please try again.');
      setIsUploading(false);
    }
  };

  // Cleanup the interval if the admin navigates away while uploading
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  return (
    <div style={{ padding: '10px 0' }}>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
        <input 
          type="file" 
          accept="application/pdf"
          onChange={handleFileChange}
          disabled={isUploading}
          ref={fileInputRef}
          style={{ 
            color: '#bdc1c6',
            flex: 1,
            padding: '8px',
            border: '1px dashed var(--border)',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.02)'
          }}
        />
        <button 
          onClick={handleUpload} 
          disabled={!file || !subjectId || isUploading}
          className="btn btn-primary"
          style={{
            height: '44px',
            padding: '0 24px',
            opacity: (!file || !subjectId || isUploading) ? 0.6 : 1,
            cursor: (!file || !subjectId || isUploading) ? 'not-allowed' : 'pointer',
          }}
        >
          {isUploading ? 'Processing...' : '⬆️ Upload & Process'}
        </button>
      </div>

      {/* ── THE PROGRESS BAR UI ── */}
      {isUploading && (
        <div style={{ marginTop: '16px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', color: '#9aa0a6' }}>{statusText}</span>
            <span style={{ fontSize: '13px', color: '#fff', fontWeight: 'bold' }}>{progress}%</span>
          </div>
          
          <div style={{ 
            width: '100%', 
            height: '10px', 
            background: 'var(--bg)', 
            borderRadius: '5px',
            overflow: 'hidden',
            border: '1px solid var(--border)'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #6c63ff, #38bdf8)',
              transition: 'width 0.4s ease-out',
              boxShadow: '0 0 10px rgba(108, 99, 255, 0.5)'
            }} />
          </div>
        </div>
      )}

      {/* Success/Error Message display after completion */}
      {!isUploading && statusText && (
        <div className={`alert ${statusText.includes('❌') ? 'alert-error' : 'alert-success'}`} style={{ marginTop: '16px' }}>
          {statusText}
        </div>
      )}
    </div>
  );
}
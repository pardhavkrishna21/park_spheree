import React, { useRef, useState } from 'react';

/**
 * Responsive photo tile for CaptainDashboard.
 * Props: label, required, disabled, photo, onCapture.
 * Images are resized/compressed before being stored in the shared valet-job
 * localStorage record, reducing the chance of exceeding the browser quota.
 */
const MAX_IMAGE_DIMENSION = 1440;
const JPEG_QUALITY = 0.76;

const compressImageFile = (file) => new Promise((resolve, reject) => {
  const objectUrl = URL.createObjectURL(file);
  const image = new Image();

  image.onload = () => {
    try {
      const scale = Math.min(
        1,
        MAX_IMAGE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight)
      );
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Image compression is not supported by this browser.');

      context.drawImage(image, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
      URL.revokeObjectURL(objectUrl);
      resolve(dataUrl);
    } catch (error) {
      URL.revokeObjectURL(objectUrl);
      reject(error);
    }
  };

  image.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    reject(new Error('Could not read this image. Please choose another photo.'));
  };

  image.src = objectUrl;
});

const PhotoCapture = ({
  label = 'Vehicle photo',
  required = false,
  disabled = false,
  photo = null,
  onCapture,
}) => {
  const inputRef = useRef(null);
  const [localError, setLocalError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleChange = async (event) => {
    const file = event.target.files?.[0];
    // Allow choosing the same photo again after retaking it.
    event.target.value = '';
    setLocalError('');
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setLocalError('Choose an image file.');
      return;
    }

    setIsProcessing(true);
    try {
      const compressedSrc = await compressImageFile(file);
      onCapture?.({
        src: compressedSrc,
        name: file.name,
        type: 'image/jpeg',
        originalSize: file.size,
        takenAt: new Date().toISOString(),
      });
    } catch (error) {
      setLocalError(error?.message || 'Could not process this image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const preview = typeof photo === 'string' ? photo : photo?.src || photo?.preview || '';

  return (
    <div className={`pc-tile ${preview ? 'pc-done' : ''} ${disabled ? 'pc-disabled' : ''}`}>
      <div className="pc-label-row">
        <span className="pc-label">{label}</span>
        {required && <span className="pc-req" aria-label="Required">*</span>}
      </div>

      <button
        className="pc-btn"
        type="button"
        disabled={disabled || isProcessing}
        onClick={() => inputRef.current?.click()}
        aria-label={`${preview ? 'Retake' : 'Add'} ${label}`}
      >
        {preview ? (
          <>
            <img src={preview} alt={`${label} preview`} />
            <span className="pc-photo-overlay">
              {isProcessing ? 'Processing…' : disabled ? 'Photo saved' : 'Tap to retake'}
            </span>
          </>
        ) : (
          <span className="pc-placeholder">
            <span className="pc-camera-icon" aria-hidden="true">＋</span>
            <span>{isProcessing ? 'Processing photo…' : 'Add photo'}</span>
          </span>
        )}
      </button>

      <input
        ref={inputRef}
        className="pc-file-input"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        disabled={disabled || isProcessing}
        aria-label={`Upload ${label}`}
      />
      {preview && <span className="pc-photo-status">✓ Photo added</span>}
      {isProcessing && <span className="pc-photo-status">Optimizing image for storage…</span>}
      {localError && <span className="pc-error" role="alert">{localError}</span>}
    </div>
  );
};

export default PhotoCapture;

import React, { useState } from "react";
import { Plus, Trash2, X, Upload } from "lucide-react";
import imageCompression from "browser-image-compression";

const GoldLoanItems = ({ items, errors, loading, onItemsChange }) => {
  const [uploadError, setUploadError] = useState(null);

  // Maximum file size before compression (10MB in bytes)
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per image
  // Target compressed size per image
  const TARGET_COMPRESSED_SIZE_MB = 1;

  const addItem = () => {
    const newItem = {
      id: Date.now(),
      name: "",
      weight: "",
      purity: "22",
      images: [], // Store File objects and their previews
    };
    onItemsChange([...items, newItem]);
  };

  const removeItem = (itemId) => {
    onItemsChange(items.filter((item) => item.id !== itemId));
  };

  const updateItem = (itemId, field, value) => {
    const updatedItems = items.map((item) => {
      if (item.id === itemId) {
        return { ...item, [field]: value };
      }
      return item;
    });
    onItemsChange(updatedItems);
  };

  const handleItemImageUpload = async (itemId, e) => {
    const files = Array.from(e.target.files);
    setUploadError(null);

    if (files.length === 0) return;

    // Validate and process each file
    const processedImagesPromises = files.map(async (file) => {
      // Check file size before compression
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File "${file.name}" exceeds 10MB limit. Please upload a smaller file.`);
      }

      try {
        // Compress the image to ~1MB
        const options = {
          maxSizeMB: TARGET_COMPRESSED_SIZE_MB, // Target 1MB per image
          maxWidthOrHeight: 1920, // Resize to max 1920px width or height
          useWebWorker: true,
          alwaysKeepResolution: false,
          onProgress: (progress) => {
            console.log(`Compression progress for ${file.name}: ${progress}%`);
          }
        };
        const compressedFile = await imageCompression(file, options);

        // Verify compressed size (should be <= 1MB)
        if (compressedFile.size > TARGET_COMPRESSED_SIZE_MB * 1024 * 1024) {
          console.warn(`Warning: Compressed file "${file.name}" still exceeds 1MB slightly.`);
        }

        // Generate preview (base64) for display
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              id: Date.now() + Math.random(),
              name: file.name,
              dataUrl: reader.result, // Base64 for preview
              file: compressedFile, // Store compressed File object for submission
              compressedSize: compressedFile.size // Track size for total check
            });
          };
          reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
          reader.readAsDataURL(compressedFile);
        });
      } catch (error) {
        throw new Error(`Error compressing file "${file.name}": ${error.message}`);
      }
    });

    try {
      const processedImages = await Promise.all(processedImagesPromises);
      const updatedItems = items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              images: [...item.images, ...processedImages],
            }
          : item
      );
      onItemsChange(updatedItems);
    } catch (error) {
      setUploadError(error.message);
    }
  };

  const removeItemImage = (itemId, imageId) => {
    const updatedItems = items.map((item) =>
      item.id === itemId
        ? {
            ...item,
            images: item.images.filter((img) => img.id !== imageId),
          }
        : item
    );
    onItemsChange(updatedItems);
  };

  // Optional: Check total estimated payload size (base64 bloat ~1.33x file size)
  const getEstimatedPayloadSize = () => {
    const totalCompressedSize = items.reduce((sum, item) => {
      return sum + item.images.reduce((imgSum, img) => imgSum + (img.compressedSize || 0), 0);
    }, 0);
    // Base64 encoding inflates size by ~33%
    const estimatedPayload = totalCompressedSize * 1.33;
    return estimatedPayload;
  };

  const isPayloadTooLarge = () => {
    return getEstimatedPayloadSize() > 10 * 1024 * 1024; // 10MB total limit
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-md font-medium text-gray-900">Gold Items</h4>
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          <Plus size={16} />
          Add Item
        </button>
      </div>

      {isPayloadTooLarge() && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-yellow-800 text-sm">
          ⚠️ Estimated request size: ~{(getEstimatedPayloadSize() / 1024 / 1024).toFixed(1)}MB (approaching 10MB limit). Remove images or compress further if needed.
        </div>
      )}

      {uploadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
          {uploadError}
        </div>
      )}

      {items.map((item, index) => (
        <div key={item.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h5 className="font-medium text-gray-800">Item {index + 1}</h5>
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="text-red-500 hover:text-red-700 disabled:opacity-50"
                disabled={loading}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Name *
              </label>
              <input
                type="text"
                value={item.name}
                onChange={(e) => updateItem(item.id, "name", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors[`item_${index}_name`] ? "border-red-300 bg-red-50" : "border-gray-300"
                }`}
                placeholder="e.g., Gold Chain, Ring, etc."
                disabled={loading}
              />
              {errors[`item_${index}_name`] && (
                <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_name`]}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weight (grams) *
              </label>
              <input
                type="number"
                step="0.01"
                value={item.weight}
                onChange={(e) => updateItem(item.id, "weight", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors[`item_${index}_weight`] ? "border-red-300 bg-red-50" : "border-gray-300"
                }`}
                placeholder="0.00"
                disabled={loading}
              />
              {errors[`item_${index}_weight`] && (
                <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_weight`]}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purity (K) *
              </label>
              <select
                value={item.purity}
                onChange={(e) => updateItem(item.id, "purity", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                disabled={loading}
              >
                <option value="">Select Purity</option>
                <option value="24">24K</option>
                <option value="22">22K</option>
                <option value="20">20K</option>
                <option value="18">18K</option>
                <option value="14">14K</option>
              </select>
              {errors[`item_${index}_purity`] && (
                <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_purity`]}</p>
              )}
            </div>
          </div>

          {/* Item Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item Photos * (Multiple allowed, auto-compressed to 1MB each)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
              <label className="cursor-pointer flex flex-col items-center gap-2 text-gray-600 hover:text-blue-600">
                <Upload size={24} className="w-6 h-6" />
                <span className="text-sm font-medium">Upload Photos</span>
                <span className="text-xs text-gray-500">Click to select multiple images (Max 10MB each, compressed to 1MB)</span>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={(e) => handleItemImageUpload(item.id, e)}
                  className="hidden"
                  disabled={loading}
                />
              </label>
            </div>

            {item.images.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Uploaded Photos ({item.images.length}):</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {item.images.map((image) => (
                    <div key={image.id} className="relative group rounded overflow-hidden border border-gray-200">
                      <img
                        src={image.dataUrl}
                        alt={image.name}
                        className="w-full h-20 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeItemImage(item.id, image.id)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md hover:bg-red-600 disabled:opacity-50"
                        disabled={loading}
                        title="Remove Image"
                      >
                        <X size={12} />
                      </button>
                      {image.name && (
                        <p className="text-xs text-gray-500 mt-1 truncate px-1">{image.name}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5 px-1">
                        {(image.compressedSize / 1024 / 1024).toFixed(1)}MB
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {errors[`item_${index}_images`] && (
              <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_images`]}</p>
            )}
            {item.images.length === 0 && (
              <p className="text-gray-500 text-xs mt-1">No photos uploaded yet.</p>
            )}
          </div>

          {item.images.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded p-2">
              <p className="text-xs text-green-800">
                ✅ {item.images.length} photo(s) uploaded & compressed to ≤1MB each.
              </p>
            </div>
          )}
        </div>
      ))}

      {errors.items && (
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <p className="text-red-600 text-sm">{errors.items}</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Total Items: <span className="font-medium">{items.length}</span> | 
            Total Weight: <span className="font-medium">
              {items.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0).toFixed(2)}g
            </span> | 
            Est. Payload: <span className="font-medium">
              {(getEstimatedPayloadSize() / 1024 / 1024).toFixed(1)}MB
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

export default GoldLoanItems;
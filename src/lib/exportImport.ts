/**
 * Export/Import utilities for localStorage data
 * Allows users to backup and restore their data
 */

export interface ExportedData {
  version: string;
  exportedAt: string;
  data: Record<string, any>;
}

/**
 * Export all localStorage data to a JSON object
 */
export function exportLocalStorageData(): ExportedData {
  const data: Record<string, any> = {};

  // Get all keys from localStorage
  const keys = Object.keys(localStorage);

  // Copy all localStorage data
  for (const key of keys) {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        data[key] = JSON.parse(item);
      }
    } catch (error) {
      // If parse fails, store as string
      const item = localStorage.getItem(key);
      if (item) {
        data[key] = item;
      }
    }
  }

  return {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    data,
  };
}

/**
 * Download exported data as a JSON file
 */
export function downloadExportedData(exportedData: ExportedData): void {
  try {
    // Create JSON string
    const jsonString = JSON.stringify(exportedData, null, 2);

    // Create blob
    const blob = new Blob([jsonString], { type: "application/json" });

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    // Generate filename with timestamp
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, -5); // Remove milliseconds
    link.download = `mysatprep-backup-${timestamp}.json`;

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Cleanup
    URL.revokeObjectURL(url);

    console.log("✅ Data exported successfully");
  } catch (error) {
    console.error("❌ Failed to export data:", error);
    throw new Error("Failed to export data. Please try again.");
  }
}

/**
 * Import data from a JSON file back into localStorage
 */
export function importLocalStorageData(importedData: ExportedData): {
  imported: number;
  skipped: number;
} {
  let imported = 0;
  let skipped = 0;

  try {
    const { data } = importedData;

    for (const [key, value] of Object.entries(data)) {
      try {
        // Store the data back to localStorage
        localStorage.setItem(key, JSON.stringify(value));
        imported++;
      } catch (error) {
        console.warn(`⚠️ Failed to import key: ${key}`, error);
        skipped++;
      }
    }

    console.log(
      `✅ Import complete: ${imported} items imported, ${skipped} skipped`,
    );
    return { imported, skipped };
  } catch (error) {
    console.error("❌ Failed to import data:", error);
    throw new Error("Failed to import data. Please check the file format.");
  }
}

/**
 * Read a JSON file from user's file system
 */
export function readFileAsJSON(file: File): Promise<ExportedData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        resolve(parsed as ExportedData);
      } catch (error) {
        reject(new Error("Invalid JSON file. Please check the file format."));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsText(file);
  });
}

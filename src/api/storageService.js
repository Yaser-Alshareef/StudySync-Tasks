import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';

export const uploadFile = async (file, taskId, userId) => {
  try {
    const timestamp = Date.now();
    const fileName = `${taskId}/${userId}_${timestamp}_${file.name}`;
    const storageRef = ref(storage, `task-attachments/${fileName}`);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    return {
      success: true,
      url: downloadURL,
      name: file.name,
      size: file.size,
      type: file.type
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteFile = async (fileUrl) => {
  try {
    const urlObj = new URL(fileUrl);
    const pathMatch = urlObj.pathname.match(/\/o\/(.+)\?/);
    if (!pathMatch) {
      return { success: false, error: 'Invalid file URL format' };
    }
    const filePath = decodeURIComponent(pathMatch[1]);
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};


import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const createComment = async (taskId, text, userId) => {
  try {
    const comment = {
      text,
      createdBy: userId,
      createdAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, 'tasks', taskId, 'comments'), comment);
    return { success: true, id: docRef.id, data: comment };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const subscribeToTaskComments = (taskId, callback) => {
  const q = query(
    collection(db, 'tasks', taskId, 'comments'),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (querySnapshot) => {
    const comments = [];
    querySnapshot.forEach((doc) => {
      comments.push({ id: doc.id, ...doc.data() });
    });
    callback(comments);
  }, () => {
    callback([]);
  });
};

export const deleteComment = async (taskId, commentId) => {
  try {
    await deleteDoc(doc(db, 'tasks', taskId, 'comments', commentId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};


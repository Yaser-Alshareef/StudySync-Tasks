import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  query,
  arrayUnion,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const createCourse = async (name, description, createdBy) => {
  try {
    const courseData = {
      name,
      description: description || '',
      createdBy,
      members: [createdBy],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'courses'), courseData);
    return { success: true, id: docRef.id, data: courseData };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getCourse = async (courseId) => {
  try {
    const courseDoc = await getDoc(doc(db, 'courses', courseId));
    if (courseDoc.exists()) {
      return { success: true, id: courseDoc.id, data: courseDoc.data() };
    }
    return { success: false, error: 'Course not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const subscribeToUserCourses = (userId, callback) => {
  const q = query(collection(db, 'courses'));
  
  return onSnapshot(q, (querySnapshot) => {
    const courses = [];
    querySnapshot.forEach((doc) => {
      const courseData = doc.data();
      courses.push({ 
        id: doc.id, 
        ...courseData,
        isMember: courseData.members?.includes(userId) || false
      });
    });
    callback(courses);
  }, () => {
    callback([]);
  });
};

export const addCourseMember = async (courseId, userId) => {
  try {
    await updateDoc(doc(db, 'courses', courseId), {
      members: arrayUnion(userId),
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

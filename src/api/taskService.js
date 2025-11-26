import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const createTask = async (taskData, courseId, courseMembers, createdBy) => {
  try {
    if (!Array.isArray(courseMembers)) {
      return { success: false, error: 'Course members must be an array' };
    }

    if (!courseMembers.includes(createdBy)) {
      courseMembers = [...courseMembers, createdBy];
    }

    let dueDate = null;
    if (taskData.dueDate) {
      const date = taskData.dueDate instanceof Date 
        ? taskData.dueDate 
        : new Date(taskData.dueDate);
      dueDate = Timestamp.fromDate(date);
    }

    const task = {
      title: taskData.title,
      description: taskData.description || '',
      dueDate: dueDate,
      priority: taskData.priority || 'medium',
      status: 'pending',
      assignedTo: taskData.assignedTo || null,
      attachments: taskData.attachments || [],
      courseId,
      courseMembers,
      createdBy,
      order: Date.now(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'tasks'), task);
    return { success: true, id: docRef.id, data: task };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const subscribeToCourseTasks = (courseId, callback) => {
  const q = query(
    collection(db, 'tasks'),
    where('courseId', '==', courseId)
  );

  return onSnapshot(q, (querySnapshot) => {
    const tasks = [];
    querySnapshot.forEach((doc) => {
      const taskData = doc.data();
      tasks.push({ id: doc.id, ...taskData });
    });
    
    tasks.sort((a, b) => {
      if (a.order && b.order) {
        return a.order - b.order;
      }
      if (a.order) return -1;
      if (b.order) return 1;
      try {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : 
                     (a.createdAt ? new Date(a.createdAt.seconds * 1000) : new Date(0));
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : 
                     (b.createdAt ? new Date(b.createdAt.seconds * 1000) : new Date(0));
        return bTime.getTime() - aTime.getTime();
      } catch (e) {
        return 0;
      }
    });
    
    callback(tasks);
  }, () => {
    callback([]);
  });
};

export const subscribeToUserTasks = (userId, callback) => {
  const q = query(
    collection(db, 'tasks'),
    where('courseMembers', 'array-contains', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (querySnapshot) => {
    const tasks = [];
    querySnapshot.forEach((doc) => {
      tasks.push({ id: doc.id, ...doc.data() });
    });
    callback(tasks);
  }, () => {
    callback([]);
  });
};

export const updateTask = async (taskId, updates) => {
  try {
    const updateData = { ...updates };
    
    if (updateData.dueDate) {
      if (updateData.dueDate instanceof Date) {
        updateData.dueDate = Timestamp.fromDate(updateData.dueDate);
      } else if (typeof updateData.dueDate === 'string') {
        updateData.dueDate = Timestamp.fromDate(new Date(updateData.dueDate));
      }
    } else if (updateData.dueDate === null) {
      updateData.dueDate = null;
    }

    await updateDoc(doc(db, 'tasks', taskId), {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const toggleTaskStatus = async (taskId, isCompleted) => {
  try {
    await updateDoc(doc(db, 'tasks', taskId), {
      status: isCompleted ? 'completed' : 'pending',
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteTask = async (taskId) => {
  try {
    await deleteDoc(doc(db, 'tasks', taskId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateTaskOrder = async (taskId, newOrder) => {
  try {
    await updateDoc(doc(db, 'tasks', taskId), {
      order: newOrder,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const reorderTasks = async (taskIds) => {
  try {
    const updates = taskIds.map((taskId, index) => 
      updateDoc(doc(db, 'tasks', taskId), {
        order: Date.now() + index,
        updatedAt: serverTimestamp()
      })
    );
    await Promise.all(updates);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};


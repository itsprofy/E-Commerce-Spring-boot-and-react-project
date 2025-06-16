import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';

const COMMENTS_COLLECTION = 'comments';
const REPLIES_COLLECTION = 'comment_replies';

// Get comments for a product
export const getProductComments = async (productId) => {
  try {
    console.log('Fetching comments for product:', productId);
    
    if (!productId) {
      console.error('Invalid productId:', productId);
      return { comments: [], error: 'Invalid product ID' };
    }
    
    const commentsQuery = query(
      collection(db, COMMENTS_COLLECTION),
      where('productId', '==', productId),
      orderBy('createdAt', 'desc')
    );
    
    console.log('Executing comments query...');
    const querySnapshot = await getDocs(commentsQuery);
    console.log(`Found ${querySnapshot.docs.length} comments for product ${productId}`);
    
    const comments = await Promise.all(querySnapshot.docs.map(async doc => {
      const data = doc.data();
      console.log('Processing comment:', doc.id, data);
      
      const comment = {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : new Date().toISOString()
      };
      
      // Get replies for this comment
      console.log(`Fetching replies for comment: ${doc.id}`);
      const repliesQuery = query(
        collection(db, REPLIES_COLLECTION),
        where('commentId', '==', doc.id),
        orderBy('createdAt', 'asc')
      );
      
      const repliesSnapshot = await getDocs(repliesQuery);
      console.log(`Found ${repliesSnapshot.docs.length} replies for comment ${doc.id}`);
      
      const replies = repliesSnapshot.docs.map(replyDoc => {
        const replyData = replyDoc.data();
        return {
          id: replyDoc.id,
          ...replyData,
          createdAt: replyData.createdAt?.toDate?.() ? replyData.createdAt.toDate().toISOString() : new Date().toISOString()
        };
      });
      
      return {
        ...comment,
        replies: replies || []
      };
    }));
    
    console.log('Processed all comments with replies:', comments);
    return { comments, error: null };
  } catch (error) {
    console.error('Error getting comments:', error);
    return { comments: [], error: error.message };
  }
};

// Get starred comments for a product
export const getStarredComments = async (productId) => {
  try {
    console.log('Fetching starred comments for product:', productId);
    
    if (!productId) {
      console.error('Invalid productId:', productId);
      return { comments: [], error: 'Invalid product ID' };
    }
    
    const commentsQuery = query(
      collection(db, COMMENTS_COLLECTION),
      where('productId', '==', productId),
      where('starred', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(commentsQuery);
    console.log(`Found ${querySnapshot.docs.length} starred comments for product ${productId}`);
    
    const comments = await Promise.all(querySnapshot.docs.map(async doc => {
      const data = doc.data();
      
      const comment = {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : new Date().toISOString()
      };
      
      // Get replies for this comment
      const repliesQuery = query(
        collection(db, REPLIES_COLLECTION),
        where('commentId', '==', doc.id),
        orderBy('createdAt', 'asc')
      );
      
      const repliesSnapshot = await getDocs(repliesQuery);
      
      const replies = repliesSnapshot.docs.map(replyDoc => {
        const replyData = replyDoc.data();
        return {
          id: replyDoc.id,
          ...replyData,
          createdAt: replyData.createdAt?.toDate?.() ? replyData.createdAt.toDate().toISOString() : new Date().toISOString()
        };
      });
      
      return {
        ...comment,
        replies: replies || []
      };
    }));
    
    return { comments, error: null };
  } catch (error) {
    console.error('Error getting starred comments:', error);
    return { comments: [], error: error.message };
  }
};

// Add a comment
export const addComment = async (productId, userId, commentData) => {
  try {
    console.log('Adding comment for product:', productId);
    
    if (!productId) {
      console.error('Invalid productId:', productId);
      return { commentId: null, error: 'Invalid product ID' };
    }
    
    if (!userId) {
      console.error('Invalid userId:', userId);
      return { commentId: null, error: 'User must be logged in' };
    }
    
    const fullCommentData = {
      productId,
      userId,
      ...commentData,
      starred: false,
      createdAt: serverTimestamp()
    };
    
    console.log('Creating comment with data:', fullCommentData);
    const docRef = await addDoc(collection(db, COMMENTS_COLLECTION), fullCommentData);
    console.log('Comment created with ID:', docRef.id);
    
    return { commentId: docRef.id, error: null };
  } catch (error) {
    console.error('Error adding comment:', error);
    return { commentId: null, error: error.message };
  }
};

// Add a reply to a comment
export const addReply = async (commentId, userId, replyData) => {
  try {
    console.log('Adding reply to comment:', commentId);
    
    if (!commentId) {
      console.error('Invalid commentId:', commentId);
      return { success: false, error: 'Invalid comment ID' };
    }
    
    if (!userId) {
      console.error('Invalid userId:', userId);
      return { success: false, error: 'User must be logged in' };
    }
    
    // Check if the comment exists
    const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
    const commentSnap = await getDoc(commentRef);
    
    if (!commentSnap.exists()) {
      console.error('Comment not found:', commentId);
      return { success: false, error: 'Comment not found' };
    }
    
    const fullReplyData = {
      commentId,
      userId,
      ...replyData,
      createdAt: serverTimestamp()
    };
    
    console.log('Creating reply with data:', fullReplyData);
    const docRef = await addDoc(collection(db, REPLIES_COLLECTION), fullReplyData);
    console.log('Reply created with ID:', docRef.id);
    
    const newReply = {
      id: docRef.id,
      ...fullReplyData,
      createdAt: new Date().toISOString()
    };
    
    return { success: true, reply: newReply, error: null };
  } catch (error) {
    console.error('Error adding reply:', error);
    return { success: false, error: error.message };
  }
};

// Update a comment
export const updateComment = async (commentId, commentData) => {
  try {
    console.log('Updating comment:', commentId);
    
    if (!commentId) {
      console.error('Invalid commentId:', commentId);
      return { success: false, error: 'Invalid comment ID' };
    }
    
    const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
    const commentSnap = await getDoc(commentRef);
    
    if (!commentSnap.exists()) {
      console.error('Comment not found:', commentId);
      return { success: false, error: 'Comment not found' };
    }
    
    const updateData = {
      ...commentData,
      updatedAt: serverTimestamp()
    };
    
    console.log('Updating comment with data:', updateData);
    await updateDoc(commentRef, updateData);
    console.log('Comment updated successfully');
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating comment:', error);
    return { success: false, error: error.message };
  }
};

// Update a reply
export const updateReply = async (replyId, replyData) => {
  try {
    console.log('Updating reply:', replyId);
    
    if (!replyId) {
      console.error('Invalid replyId:', replyId);
      return { success: false, error: 'Invalid reply ID' };
    }
    
    const replyRef = doc(db, REPLIES_COLLECTION, replyId);
    const replySnap = await getDoc(replyRef);
    
    if (!replySnap.exists()) {
      console.error('Reply not found:', replyId);
      return { success: false, error: 'Reply not found' };
    }
    
    const updateData = {
      ...replyData,
      updatedAt: serverTimestamp()
    };
    
    console.log('Updating reply with data:', updateData);
    await updateDoc(replyRef, updateData);
    console.log('Reply updated successfully');
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating reply:', error);
    return { success: false, error: error.message };
  }
};

// Delete a comment (and all its replies)
export const deleteComment = async (commentId) => {
  try {
    console.log('Deleting comment:', commentId);
    
    if (!commentId) {
      console.error('Invalid commentId:', commentId);
      return { success: false, error: 'Invalid comment ID' };
    }
    
    // Delete all replies first
    const repliesQuery = query(
      collection(db, REPLIES_COLLECTION),
      where('commentId', '==', commentId)
    );
    
    const repliesSnapshot = await getDocs(repliesQuery);
    console.log(`Found ${repliesSnapshot.docs.length} replies to delete for comment ${commentId}`);
    
    // Delete each reply
    const replyDeletions = repliesSnapshot.docs.map(replyDoc => {
      console.log(`Deleting reply: ${replyDoc.id}`);
      return deleteDoc(doc(db, REPLIES_COLLECTION, replyDoc.id));
    });
    
    // Wait for all reply deletions to complete
    await Promise.all(replyDeletions);
    console.log('All replies deleted successfully');
    
    // Then delete the comment
    await deleteDoc(doc(db, COMMENTS_COLLECTION, commentId));
    console.log('Comment deleted successfully');
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting comment:', error);
    return { success: false, error: error.message };
  }
};

// Delete a reply
export const deleteReply = async (replyId) => {
  try {
    console.log('Deleting reply:', replyId);
    
    if (!replyId) {
      console.error('Invalid replyId:', replyId);
      return { success: false, error: 'Invalid reply ID' };
    }
    
    await deleteDoc(doc(db, REPLIES_COLLECTION, replyId));
    console.log('Reply deleted successfully');
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting reply:', error);
    return { success: false, error: error.message };
  }
}; 
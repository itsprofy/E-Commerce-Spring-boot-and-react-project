import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';

const QUESTIONS_COLLECTION = 'product_questions';

// Get questions for a product
export const getProductQuestions = async (productId) => {
  try {
    console.log('Fetching questions for product:', productId);
    
    if (!productId) {
      console.error('Invalid productId:', productId);
      return { questions: [], error: 'Invalid product ID' };
    }
    
    console.log('Creating query for product questions...');
    const q = query(
      collection(db, QUESTIONS_COLLECTION),
      where('productId', '==', productId),
      orderBy('askedAt', 'desc')
    );
    
    console.log('Executing questions query...');
    const querySnapshot = await getDocs(q);
    console.log(`Found ${querySnapshot.docs.length} questions for product ${productId}`);
    
    if (querySnapshot.empty) {
      console.log('No questions found for this product');
      return { questions: [], error: null };
    }
    
    const questions = querySnapshot.docs.map(doc => {
      try {
        const data = doc.data();
        console.log('Processing question:', doc.id, data);
        
        return {
          id: doc.id,
          ...data,
          askedAt: data.askedAt?.toDate?.() ? data.askedAt.toDate().toISOString() : new Date().toISOString(),
          answeredAt: data.answeredAt?.toDate?.() ? data.answeredAt.toDate().toISOString() : null
        };
      } catch (error) {
        console.error('Error processing question:', error);
        return {
          id: doc.id,
          question: 'Error loading question',
          askedAt: new Date().toISOString(),
          userName: 'Unknown',
          answered: false
        };
      }
    });
    
    console.log('Processed questions:', questions);
    return { questions, error: null };
  } catch (error) {
    console.error('Error fetching questions:', error);
    return { questions: [], error: error.message || 'Failed to load questions' };
  }
};

// Ask a new question
export const askQuestion = async (productId, userId, userName, questionText) => {
  try {
    console.log('Asking question for product:', productId);
    console.log('User ID:', userId);
    console.log('User Name:', userName);
    console.log('Question Text:', questionText);
    
    if (!productId) {
      console.error('Invalid productId:', productId);
      return { success: false, error: 'Invalid product ID' };
    }
    
    if (!userId) {
      console.error('Invalid userId:', userId);
      return { success: false, error: 'User must be logged in' };
    }
    
    if (!questionText || questionText.trim() === '') {
      console.error('Invalid question text');
      return { success: false, error: 'Question text is required' };
    }
    
    const questionData = {
      productId,
      userId,
      userName,
      question: questionText.trim(),
      askedAt: serverTimestamp(),
      answered: false,
      helpfulVotes: 0,
      reportCount: 0,
      active: true
    };
    
    console.log('Creating question with data:', questionData);
    const docRef = await addDoc(collection(db, QUESTIONS_COLLECTION), questionData);
    console.log('Question created with ID:', docRef.id);
    
    // Get the newly created question with ID
    const newQuestion = {
      id: docRef.id,
      ...questionData,
      askedAt: new Date().toISOString() // Use current date for immediate display
    };
    
    console.log('Returning new question:', newQuestion);
    return { success: true, question: newQuestion, error: null };
  } catch (error) {
    console.error('Error asking question:', error);
    return { success: false, error: error.message || 'Failed to post question' };
  }
};

// Answer a question
export const answerQuestion = async (questionId, answererId, answererName, answerText) => {
  try {
    console.log('Answering question:', questionId);
    console.log('Answerer ID:', answererId);
    console.log('Answerer Name:', answererName);
    console.log('Answer Text:', answerText);
    
    if (!questionId) {
      console.error('Invalid questionId:', questionId);
      return { success: false, error: 'Invalid question ID' };
    }
    
    if (!answerText || answerText.trim() === '') {
      console.error('Invalid answer text');
      return { success: false, error: 'Answer text is required' };
    }
    
    const questionRef = doc(db, QUESTIONS_COLLECTION, questionId);
    console.log('Getting question document...');
    const questionSnap = await getDoc(questionRef);
    
    if (!questionSnap.exists()) {
      console.error('Question not found:', questionId);
      return { success: false, error: 'Question not found' };
    }
    
    const updateData = {
      answer: answerText.trim(),
      answeredBy: {
        id: answererId,
        username: answererName
      },
      answeredAt: serverTimestamp(),
      answered: true
    };
    
    console.log('Updating question with answer data:', updateData);
    await updateDoc(questionRef, updateData);
    console.log('Question updated with answer');
    
    // Get the updated question
    const updatedQuestionSnap = await getDoc(questionRef);
    const updatedData = updatedQuestionSnap.data();
    const updatedQuestion = {
      id: updatedQuestionSnap.id,
      ...updatedData,
      askedAt: updatedData.askedAt?.toDate?.() ? updatedData.askedAt.toDate().toISOString() : new Date().toISOString(),
      answeredAt: new Date().toISOString() // Use current date for immediate display
    };
    
    console.log('Returning updated question:', updatedQuestion);
    return { success: true, question: updatedQuestion, error: null };
  } catch (error) {
    console.error('Error answering question:', error);
    return { success: false, error: error.message || 'Failed to post answer' };
  }
};

// Vote a question as helpful
export const voteQuestionHelpful = async (questionId) => {
  try {
    console.log('Voting question as helpful:', questionId);
    
    if (!questionId) {
      console.error('Invalid questionId:', questionId);
      return { success: false, error: 'Invalid question ID' };
    }
    
    const questionRef = doc(db, QUESTIONS_COLLECTION, questionId);
    console.log('Getting question document...');
    const questionSnap = await getDoc(questionRef);
    
    if (!questionSnap.exists()) {
      console.error('Question not found:', questionId);
      return { success: false, error: 'Question not found' };
    }
    
    const currentVotes = questionSnap.data().helpfulVotes || 0;
    
    console.log('Updating helpful votes from', currentVotes, 'to', currentVotes + 1);
    await updateDoc(questionRef, {
      helpfulVotes: currentVotes + 1
    });
    console.log('Question helpful votes updated');
    
    // Get the updated question
    const updatedQuestionSnap = await getDoc(questionRef);
    const updatedData = updatedQuestionSnap.data();
    const updatedQuestion = {
      id: updatedQuestionSnap.id,
      ...updatedData,
      askedAt: updatedData.askedAt?.toDate?.() ? updatedData.askedAt.toDate().toISOString() : new Date().toISOString(),
      answeredAt: updatedData.answeredAt?.toDate?.() ? updatedData.answeredAt.toDate().toISOString() : null
    };
    
    console.log('Returning updated question:', updatedQuestion);
    return { success: true, question: updatedQuestion, error: null };
  } catch (error) {
    console.error('Error voting question as helpful:', error);
    return { success: false, error: error.message || 'Failed to vote for question' };
  }
};

// Report a question
export const reportQuestion = async (questionId) => {
  try {
    console.log('Reporting question:', questionId);
    
    if (!questionId) {
      console.error('Invalid questionId:', questionId);
      return { success: false, error: 'Invalid question ID' };
    }
    
    const questionRef = doc(db, QUESTIONS_COLLECTION, questionId);
    console.log('Getting question document...');
    const questionSnap = await getDoc(questionRef);
    
    if (!questionSnap.exists()) {
      console.error('Question not found:', questionId);
      return { success: false, error: 'Question not found' };
    }
    
    const currentReports = questionSnap.data().reportCount || 0;
    
    console.log('Updating report count from', currentReports, 'to', currentReports + 1);
    await updateDoc(questionRef, {
      reportCount: currentReports + 1
    });
    console.log('Question report count updated');
    
    // Get the updated question
    const updatedQuestionSnap = await getDoc(questionRef);
    const updatedData = updatedQuestionSnap.data();
    const updatedQuestion = {
      id: updatedQuestionSnap.id,
      ...updatedData,
      askedAt: updatedData.askedAt?.toDate?.() ? updatedData.askedAt.toDate().toISOString() : new Date().toISOString(),
      answeredAt: updatedData.answeredAt?.toDate?.() ? updatedData.answeredAt.toDate().toISOString() : null
    };
    
    console.log('Returning updated question:', updatedQuestion);
    return { success: true, question: updatedQuestion, error: null };
  } catch (error) {
    console.error('Error reporting question:', error);
    return { success: false, error: error.message || 'Failed to report question' };
  }
};

// Delete a question
export const deleteQuestion = async (questionId) => {
  try {
    console.log('Deleting question:', questionId);
    
    if (!questionId) {
      console.error('Invalid questionId:', questionId);
      return { success: false, error: 'Invalid question ID' };
    }
    
    await deleteDoc(doc(db, QUESTIONS_COLLECTION, questionId));
    console.log('Question deleted successfully');
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting question:', error);
    return { success: false, error: error.message || 'Failed to delete question' };
  }
}; 
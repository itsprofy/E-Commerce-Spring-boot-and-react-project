import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { FaThumbsUp, FaFlag, FaTrash, FaReply } from 'react-icons/fa';
import { format } from 'date-fns';
import { 
  getProductQuestions, 
  askQuestion, 
  answerQuestion, 
  voteQuestionHelpful, 
  reportQuestion, 
  deleteQuestion 
} from '../services/firebaseQAService';

function ProductQA({ productId, currentUser, isAdmin }) {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [newQuestion, setNewQuestion] = useState('');
    const [answerText, setAnswerText] = useState('');
    const [answeringQuestionId, setAnsweringQuestionId] = useState(null);
    const [showAnswerForm, setShowAnswerForm] = useState(false);

    useEffect(() => {
        if (productId) {
            fetchQuestions();
        }
    }, [productId]);

    const fetchQuestions = async () => {
        if (!productId) return;
        
        try {
            setLoading(true);
            setError('');
            console.log("Fetching questions for product:", productId);
            
            const result = await getProductQuestions(productId);
            
            if (result.error) {
                console.error("Error from getProductQuestions:", result.error);
                setError(`Error fetching questions: ${result.error}`);
                setQuestions([]);
                return;
            }
            
            console.log("Questions fetched successfully:", result.questions);
            setQuestions(result.questions || []);
        } catch (error) {
            console.error('Error in fetchQuestions:', error);
            setError('Failed to load questions. Please try again later.');
            setQuestions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAskQuestion = async (e) => {
        e.preventDefault();
        
        if (!currentUser) {
            setError('Please log in to ask a question');
            return;
        }
        
        if (!newQuestion.trim()) {
            setError('Question cannot be empty');
            return;
        }
        
        try {
            setLoading(true);
            setError('');
            
            console.log("Asking question for product:", productId);
            console.log("User:", currentUser.uid, currentUser.displayName);
            console.log("Question:", newQuestion);
            
            const result = await askQuestion(
                productId,
                currentUser.uid,
                currentUser.displayName || 'Anonymous',
                newQuestion
            );
            
            if (result.error) {
                console.error("Error from askQuestion:", result.error);
                setError(`Error posting question: ${result.error}`);
                return;
            }
            
            console.log("Question posted successfully:", result.question);
            setQuestions(prevQuestions => [result.question, ...prevQuestions]);
            setNewQuestion('');
            setSuccess('Your question has been submitted successfully!');
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            console.error('Error in handleAskQuestion:', error);
            setError('Failed to post question. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerQuestion = async (questionId) => {
        if (!currentUser) {
            setError('Please log in to answer a question');
            return;
        }
        
        if (!answerText.trim()) {
            setError('Answer cannot be empty');
            return;
        }
        
        try {
            setLoading(true);
            setError('');
            
            const result = await answerQuestion(
                questionId,
                currentUser.uid,
                currentUser.displayName || 'Anonymous',
                answerText
            );
            
            if (result.error) {
                setError(`Error posting answer: ${result.error}`);
                return;
            }
            
            setQuestions(prevQuestions => 
                prevQuestions.map(q => q.id === questionId ? result.question : q)
            );
            
            setAnswerText('');
            setAnsweringQuestionId(null);
            setShowAnswerForm(false);
            setSuccess('Your answer has been submitted successfully!');
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            console.error('Error posting answer:', error);
            setError('Failed to post answer. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVoteHelpful = async (questionId) => {
        if (!currentUser) {
            setError('Please log in to vote');
            return;
        }
        
        try {
            setError('');
            
            const result = await voteQuestionHelpful(questionId);
            
            if (result.error) {
                setError(`Error voting: ${result.error}`);
                return;
            }
            
            setQuestions(prevQuestions => 
                prevQuestions.map(q => q.id === questionId ? result.question : q)
            );
        } catch (error) {
            console.error('Error voting for question:', error);
            setError('Failed to vote. Please try again.');
        }
    };

    const handleReport = async (questionId) => {
        if (!currentUser) {
            setError('Please log in to report');
            return;
        }
        
        try {
            setError('');
            
            const result = await reportQuestion(questionId);
            
            if (result.error) {
                setError(`Error reporting: ${result.error}`);
                return;
            }
            
            setQuestions(prevQuestions => 
                prevQuestions.map(q => q.id === questionId ? result.question : q)
            );
            
            setSuccess('Question reported. Thank you for your feedback.');
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            console.error('Error reporting question:', error);
            setError('Failed to report. Please try again.');
        }
    };

    const handleDelete = async (questionId) => {
        try {
            setError('');
            
            const result = await deleteQuestion(questionId);
            
            if (result.error) {
                setError(`Error deleting: ${result.error}`);
                return;
            }
            
            setQuestions(prevQuestions => 
                prevQuestions.filter(q => q.id !== questionId)
            );
            
            setSuccess('Question deleted successfully.');
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            console.error('Error deleting question:', error);
            setError('Failed to delete question. Please try again.');
        }
    };

    const formatDate = (dateString) => {
        try {
            return format(new Date(dateString), 'MMM dd, yyyy');
        } catch (error) {
            return 'Unknown date';
        }
    };

    if (loading && questions.length === 0) {
        return (
            <div className="text-center py-4">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading questions...</span>
                </Spinner>
            </div>
        );
    }

    return (
        <div className="product-qa my-4">
            <h3>Questions & Answers</h3>

            {error && (
                <Alert variant="danger" onClose={() => setError('')} dismissible>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert variant="success" onClose={() => setSuccess('')} dismissible>
                    {success}
                </Alert>
            )}

            {/* Ask Question Form */}
            <Card className="mb-4">
                <Card.Body>
                    <Form onSubmit={handleAskQuestion}>
                        <Form.Group className="mb-3">
                            <Form.Label>Ask a Question</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={newQuestion}
                                onChange={(e) => setNewQuestion(e.target.value)}
                                placeholder="What would you like to know about this product?"
                                required
                            />
                        </Form.Group>
                        <Button 
                            type="submit" 
                            variant="primary"
                            disabled={!currentUser || loading}
                        >
                            {loading ? 'Submitting...' : 'Submit Question'}
                        </Button>
                        {!currentUser && (
                            <small className="text-muted ms-2">
                                Please log in to ask a question
                            </small>
                        )}
                    </Form>
                </Card.Body>
            </Card>

            {/* Questions List */}
            {questions.length === 0 ? (
                <div className="text-center py-4">
                    <p className="text-muted">No questions yet. Be the first to ask a question!</p>
                </div>
            ) : (
                questions.map(question => (
                    <Card key={question.id} className="mb-3">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 className="mb-1">{question.question}</h6>
                                    <small className="text-muted">
                                        Asked by {question.userName || 'Anonymous'} on {formatDate(question.askedAt)}
                                    </small>
                                </div>
                                <div>
                                    {(isAdmin || currentUser?.uid === question.userId) && (
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => handleDelete(question.id)}
                                            className="ms-2"
                                        >
                                            <FaTrash />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {question.answer && (
                                <div className="answer mt-3 p-3 bg-light rounded">
                                    <p className="mb-1">{question.answer}</p>
                                    <small className="text-muted">
                                        Answered by {question.answeredBy?.username || 'Admin'} on {formatDate(question.answeredAt)}
                                    </small>
                                </div>
                            )}

                            <div className="mt-3">
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => handleVoteHelpful(question.id)}
                                    disabled={!currentUser}
                                >
                                    <FaThumbsUp className="me-1" />
                                    Helpful ({question.helpfulVotes || 0})
                                </Button>
                                <Button
                                    variant="outline-warning"
                                    size="sm"
                                    onClick={() => handleReport(question.id)}
                                    className="ms-2"
                                    disabled={!currentUser}
                                >
                                    <FaFlag className="me-1" />
                                    Report
                                </Button>
                                {isAdmin && !question.answered && (
                                    <Button
                                        variant="outline-success"
                                        size="sm"
                                        className="ms-2"
                                        onClick={() => {
                                            setAnsweringQuestionId(question.id);
                                            setShowAnswerForm(true);
                                            setAnswerText('');
                                        }}
                                    >
                                        <FaReply className="me-1" />
                                        Answer
                                    </Button>
                                )}
                            </div>

                            {showAnswerForm && answeringQuestionId === question.id && (
                                <Form className="mt-3">
                                    <Form.Group className="mb-3">
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            value={answerText}
                                            onChange={(e) => setAnswerText(e.target.value)}
                                            placeholder="Write your answer..."
                                        />
                                    </Form.Group>
                                    <div className="d-flex">
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => handleAnswerQuestion(question.id)}
                                            disabled={loading}
                                            className="me-2"
                                        >
                                            {loading ? 'Submitting...' : 'Submit Answer'}
                                        </Button>
                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            onClick={() => {
                                                setShowAnswerForm(false);
                                                setAnsweringQuestionId(null);
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </Form>
                            )}
                        </Card.Body>
                    </Card>
                ))
            )}
        </div>
    );
}

export default ProductQA; 
import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Alert, Spinner, Badge, Tabs, Tab } from 'react-bootstrap';
import { FaStar, FaRegStar, FaThumbsUp, FaFlag, FaTrash, FaReply } from 'react-icons/fa';
import { format } from 'date-fns';
import { 
  getProductComments, 
  addComment, 
  updateComment, 
  deleteComment,
  addReply,
  deleteReply 
} from '../services/firebaseCommentService';

function ProductComments({ productId, currentUser, isAdmin }) {
    const [comments, setComments] = useState([]);
    const [starredComments, setStarredComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [newComment, setNewComment] = useState({ text: '', rating: 5 });
    const [activeTab, setActiveTab] = useState('all');
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');

    useEffect(() => {
        if (productId) {
            fetchComments();
        }
    }, [productId]);

    const fetchComments = async () => {
        if (!productId) return;
        
        try {
            setLoading(true);
            console.log('Fetching comments for product:', productId);
            
            // Fetch from Firebase
            const result = await getProductComments(productId);
            
            if (result.error) {
                console.error('Error from getProductComments:', result.error);
                setError('Error fetching comments: ' + result.error);
                setComments([]);
                setStarredComments([]);
                return;
            }
            
            console.log('Comments fetched successfully:', result.comments);
            const allComments = result.comments || [];
            setComments(allComments);
            
            // Filter starred comments
            setStarredComments(allComments.filter(comment => comment.starred));
        } catch (error) {
            console.error('Error in fetchComments:', error);
            setError('Failed to load comments. Please try again later.');
            setComments([]);
            setStarredComments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        
        if (!currentUser) {
            setError('Please log in to add a comment');
            return;
        }
        
        if (!newComment.text.trim()) {
            setError('Comment text cannot be empty');
            return;
        }
        
        try {
            setLoading(true);
            console.log('Adding comment for product:', productId);
            console.log('User:', currentUser.uid, currentUser.displayName);
            
            const commentData = {
                text: newComment.text.trim(),
                rating: newComment.rating,
                authorName: currentUser.displayName || 'Anonymous',
                authorEmail: currentUser.email
            };
            
            const result = await addComment(productId, currentUser.uid, commentData);
            
            if (result.error) {
                console.error('Error from addComment:', result.error);
                setError('Error adding comment: ' + result.error);
                return;
            }
            
            console.log('Comment added successfully with ID:', result.commentId);
            setSuccess('Comment added successfully!');
            setNewComment({ text: '', rating: 5 });
            fetchComments();
        } catch (error) {
            console.error('Error in handleAddComment:', error);
            setError('Failed to add comment. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddReply = async (commentId) => {
        if (!currentUser) {
            setError('Please log in to reply to a comment');
            return;
        }
        
        if (!replyText.trim()) {
            setError('Reply text cannot be empty');
            return;
        }
        
        try {
            setLoading(true);
            console.log('Adding reply to comment:', commentId);
            console.log('User:', currentUser.uid, currentUser.displayName);
            
            const replyData = {
                text: replyText.trim(),
                authorName: currentUser.displayName || 'Anonymous',
                authorEmail: currentUser.email
            };
            
            const result = await addReply(commentId, currentUser.uid, replyData);
            
            if (result.error) {
                console.error('Error from addReply:', result.error);
                setError('Error adding reply: ' + result.error);
                return;
            }
            
            console.log('Reply added successfully:', result.reply);
            setSuccess('Reply added successfully!');
            setReplyText('');
            setReplyingTo(null);
            fetchComments();
        } catch (error) {
            console.error('Error in handleAddReply:', error);
            setError('Failed to add reply. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStar = async (commentId, isCurrentlyStarred) => {
        if (!isAdmin) {
            return;
        }
        
        try {
            console.log('Toggling star for comment:', commentId);
            const commentToUpdate = comments.find(c => c.id === commentId);
            if (!commentToUpdate) return;
            
            const result = await updateComment(commentId, {
                starred: !isCurrentlyStarred
            });
            
            if (result.error) {
                console.error('Error from updateComment:', result.error);
                setError('Error updating comment: ' + result.error);
                return;
            }
            
            console.log('Comment star toggled successfully');
            fetchComments();
        } catch (error) {
            console.error('Error in handleToggleStar:', error);
            setError('Failed to update comment. Please try again.');
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!isAdmin && !isCommentAuthor(commentId)) {
            return;
        }
        
        try {
            console.log('Deleting comment:', commentId);
            const result = await deleteComment(commentId);
            
            if (result.error) {
                console.error('Error from deleteComment:', result.error);
                setError('Error deleting comment: ' + result.error);
                return;
            }
            
            console.log('Comment deleted successfully');
            setSuccess('Comment deleted successfully!');
            fetchComments();
        } catch (error) {
            console.error('Error in handleDeleteComment:', error);
            setError('Failed to delete comment. Please try again.');
        }
    };

    const handleDeleteReply = async (replyId) => {
        if (!isAdmin && !isReplyAuthor(replyId)) {
            return;
        }
        
        try {
            console.log('Deleting reply:', replyId);
            const result = await deleteReply(replyId);
            
            if (result.error) {
                console.error('Error from deleteReply:', result.error);
                setError('Error deleting reply: ' + result.error);
                return;
            }
            
            console.log('Reply deleted successfully');
            setSuccess('Reply deleted successfully!');
            fetchComments();
        } catch (error) {
            console.error('Error in handleDeleteReply:', error);
            setError('Failed to delete reply. Please try again.');
        }
    };

    const isCommentAuthor = (commentId) => {
        if (!currentUser) return false;
        const comment = comments.find(c => c.id === commentId);
        return comment && comment.userId === currentUser.uid;
    };

    const isReplyAuthor = (replyId) => {
        if (!currentUser) return false;
        
        for (const comment of comments) {
            if (comment.replies) {
                const reply = comment.replies.find(r => r.id === replyId);
                if (reply && reply.userId === currentUser.uid) {
                    return true;
                }
            }
        }
        
        return false;
    };

    const renderStarRating = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <span key={i} className="text-warning">
                    {i <= rating ? <FaStar /> : <FaRegStar />}
                </span>
            );
        }
        return stars;
    };

    const handleRatingChange = (rating) => {
        setNewComment(prev => ({ ...prev, rating }));
    };

    const formatDate = (dateString) => {
        try {
            return format(new Date(dateString), 'MMM dd, yyyy');
        } catch (error) {
            return 'Unknown date';
        }
    };

    if (loading && comments.length === 0) {
        return (
            <div className="text-center py-4">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading comments...</span>
                </Spinner>
            </div>
        );
    }

    return (
        <div className="product-comments my-4">
            <h3 className="mb-4">Customer Reviews</h3>

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

            {/* Add Comment Form */}
            <Card className="mb-4">
                <Card.Body>
                    <h5>Write a Review</h5>
                    <Form onSubmit={handleAddComment}>
                        <Form.Group className="mb-3">
                            <Form.Label>Rating</Form.Label>
                            <div className="mb-3">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <Button
                                        key={star}
                                        variant="link"
                                        className="p-0 me-1"
                                        onClick={() => handleRatingChange(star)}
                                    >
                                        {star <= newComment.rating ? (
                                            <FaStar className="text-warning fs-4" />
                                        ) : (
                                            <FaRegStar className="text-warning fs-4" />
                                        )}
                                    </Button>
                                ))}
                            </div>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Your Review</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                value={newComment.text}
                                onChange={(e) => setNewComment(prev => ({ ...prev, text: e.target.value }))}
                                placeholder="Share your experience with this product..."
                                required
                            />
                        </Form.Group>
                        <Button 
                            type="submit" 
                            variant="primary"
                            disabled={!currentUser || loading}
                        >
                            {loading ? 'Submitting...' : 'Submit Review'}
                        </Button>
                        {!currentUser && (
                            <small className="text-muted ms-2">
                                Please log in to leave a review
                            </small>
                        )}
                    </Form>
                </Card.Body>
            </Card>

            {/* Comments Tabs */}
            <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-4"
            >
                <Tab eventKey="all" title="All Reviews">
                    {comments.length === 0 ? (
                        <p className="text-muted">No reviews yet. Be the first to review this product!</p>
                    ) : (
                        comments.map(comment => (
                            <Card key={comment.id} className="mb-3">
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <div>
                                            <h5 className="mb-0">{comment.authorName}</h5>
                                            <div className="mb-2">
                                                {renderStarRating(comment.rating)}
                                            </div>
                                            <small className="text-muted">
                                                {formatDate(comment.createdAt)}
                                            </small>
                                        </div>
                                        {comment.starred && (
                                            <Badge bg="warning" text="dark" className="px-3 py-2">
                                                <FaStar className="me-1" /> Featured Review
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="mt-3">{comment.text}</p>
                                    
                                    {/* Replies section */}
                                    {comment.replies && comment.replies.length > 0 && (
                                        <div className="mt-3 ms-4 border-start ps-3">
                                            <h6 className="mb-3">Replies:</h6>
                                            {comment.replies.map(reply => (
                                                <div key={reply.id} className="mb-3 pb-3 border-bottom">
                                                    <div className="d-flex justify-content-between">
                                                        <div>
                                                            <h6 className="mb-0">{reply.authorName}</h6>
                                                            <small className="text-muted">
                                                                {formatDate(reply.createdAt)}
                                                            </small>
                                                        </div>
                                                        {(isAdmin || isReplyAuthor(reply.id)) && (
                                                            <Button
                                                                variant="outline-danger"
                                                                size="sm"
                                                                onClick={() => handleDeleteReply(reply.id)}
                                                            >
                                                                <FaTrash />
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <p className="mt-2 mb-0">{reply.text}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {/* Reply form */}
                                    {replyingTo === comment.id ? (
                                        <div className="mt-3">
                                            <Form>
                                                <Form.Group className="mb-3">
                                                    <Form.Control
                                                        as="textarea"
                                                        rows={3}
                                                        value={replyText}
                                                        onChange={(e) => setReplyText(e.target.value)}
                                                        placeholder="Write your reply..."
                                                        required
                                                    />
                                                </Form.Group>
                                                <div className="d-flex">
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={() => handleAddReply(comment.id)}
                                                        disabled={loading}
                                                        className="me-2"
                                                    >
                                                        {loading ? 'Submitting...' : 'Submit Reply'}
                                                    </Button>
                                                    <Button
                                                        variant="outline-secondary"
                                                        size="sm"
                                                        onClick={() => {
                                                            setReplyingTo(null);
                                                            setReplyText('');
                                                        }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </Form>
                                        </div>
                                    ) : (
                                        <div className="d-flex justify-content-between mt-3">
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                onClick={() => setReplyingTo(comment.id)}
                                                disabled={!currentUser}
                                            >
                                                <FaReply className="me-1" />
                                                Reply
                                            </Button>
                                            
                                            <div>
                                                {isAdmin && (
                                                    <Button
                                                        variant="outline-warning"
                                                        size="sm"
                                                        className="me-2"
                                                        onClick={() => handleToggleStar(comment.id, comment.starred)}
                                                    >
                                                        {comment.starred ? 'Unstar Review' : 'Star Review'}
                                                    </Button>
                                                )}
                                                {(isAdmin || isCommentAuthor(comment.id)) && (
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => handleDeleteComment(comment.id)}
                                                    >
                                                        <FaTrash /> Delete
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        ))
                    )}
                </Tab>
                <Tab eventKey="starred" title="Featured Reviews">
                    {starredComments.length === 0 ? (
                        <p className="text-muted">No featured reviews yet.</p>
                    ) : (
                        starredComments.map(comment => (
                            <Card key={comment.id} className="mb-3 border-warning">
                                <Card.Header className="bg-warning bg-opacity-10">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h5 className="mb-0">Featured Review</h5>
                                        <FaStar className="text-warning" />
                                    </div>
                                </Card.Header>
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <div>
                                            <h5 className="mb-0">{comment.authorName}</h5>
                                            <div className="mb-2">
                                                {renderStarRating(comment.rating)}
                                            </div>
                                            <small className="text-muted">
                                                {formatDate(comment.createdAt)}
                                            </small>
                                        </div>
                                    </div>
                                    <p className="mt-3">{comment.text}</p>
                                    
                                    {/* Replies section */}
                                    {comment.replies && comment.replies.length > 0 && (
                                        <div className="mt-3 ms-4 border-start ps-3">
                                            <h6 className="mb-3">Replies:</h6>
                                            {comment.replies.map(reply => (
                                                <div key={reply.id} className="mb-3 pb-3 border-bottom">
                                                    <div className="d-flex justify-content-between">
                                                        <div>
                                                            <h6 className="mb-0">{reply.authorName}</h6>
                                                            <small className="text-muted">
                                                                {formatDate(reply.createdAt)}
                                                            </small>
                                                        </div>
                                                        {(isAdmin || isReplyAuthor(reply.id)) && (
                                                            <Button
                                                                variant="outline-danger"
                                                                size="sm"
                                                                onClick={() => handleDeleteReply(reply.id)}
                                                            >
                                                                <FaTrash />
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <p className="mt-2 mb-0">{reply.text}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {/* Reply form */}
                                    {replyingTo === comment.id ? (
                                        <div className="mt-3">
                                            <Form>
                                                <Form.Group className="mb-3">
                                                    <Form.Control
                                                        as="textarea"
                                                        rows={3}
                                                        value={replyText}
                                                        onChange={(e) => setReplyText(e.target.value)}
                                                        placeholder="Write your reply..."
                                                        required
                                                    />
                                                </Form.Group>
                                                <div className="d-flex">
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={() => handleAddReply(comment.id)}
                                                        disabled={loading}
                                                        className="me-2"
                                                    >
                                                        {loading ? 'Submitting...' : 'Submit Reply'}
                                                    </Button>
                                                    <Button
                                                        variant="outline-secondary"
                                                        size="sm"
                                                        onClick={() => {
                                                            setReplyingTo(null);
                                                            setReplyText('');
                                                        }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </Form>
                                        </div>
                                    ) : (
                                        <div className="d-flex justify-content-between mt-3">
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                onClick={() => setReplyingTo(comment.id)}
                                                disabled={!currentUser}
                                            >
                                                <FaReply className="me-1" />
                                                Reply
                                            </Button>
                                            
                                            <div>
                                                {isAdmin && (
                                                    <Button
                                                        variant="outline-warning"
                                                        size="sm"
                                                        className="me-2"
                                                        onClick={() => handleToggleStar(comment.id, comment.starred)}
                                                    >
                                                        Unstar Review
                                                    </Button>
                                                )}
                                                {(isAdmin || isCommentAuthor(comment.id)) && (
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => handleDeleteComment(comment.id)}
                                                    >
                                                        <FaTrash /> Delete
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        ))
                    )}
                </Tab>
            </Tabs>
        </div>
    );
}

export default ProductComments; 
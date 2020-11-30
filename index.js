const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.json());

const cors = require('cors'); 
app.use(cors());

const axios = require('axios');

const {randomBytes} = require('crypto');

const commentsByPostId ={};

// route handler for get request
app.get('/posts/:id/comments', (req, res) =>{
    res.send(commentsByPostId[req.params.id] || []);
});

// route handler for post request
app.post('/posts/:id/comments', async(req, res) => {
    // create a new commentID
    const commentId = randomBytes(4).toString('hex');
    // get the request body and put it into content
    const {content} = req.body;
    const comments = commentsByPostId[req.params.id] || [];
    //push the content into the array based on id
    comments.push ({id:commentId, content});
    commentsByPostId[req.params.id] = comments;

    await axios.post('http://localhost:4005/events', {
        type: 'CommentCreated',
        data: {
            id: commentId,
            content,
            postId: req.params.id,
            status: 'pending'
        }
    });

    res.status(201).send(comments);
});

app.post('/events', async(req, res) => {
    console.log('Event received', req.body.type);
    const { type, data } = req.body;
    if (type === 'CommentModerated') {
        const { postId, id, status, content } = data;
        const comments = commentsByPostId[postId];
        const comment = comments.find(comment => {
            return comment.id === id;
        });
        comment.status = status;
        await axios.post('http://localhost:4005/events', {
            type: 'CommentUpdated',
            data: {
                id,
                status,
                postId,
                content
            }
        });
    }
    res.send({});
});

app.listen(4001, () =>{
    console.log('Listening on 4001');
})
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');
const { runGemini } = require('./geminiConfig');

dotenv.config();

const app = express();
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

//HANDLE CORS
app.use(
    cors({
        origin: 'http://localhost:5173',
        credentials: true,
    })
);

app.use(express.json());

// GITHUB OAUTH: Redirect to GitHub login page
app.get('/auth/github', (req, res) => {
    const redirectUri = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=repo,user`;
    res.redirect(redirectUri);
});

// GITHUB OAUTH: Handle callback and exchange code for access token
app.get('/auth/github/callback', async (req, res) => {
    const code = req.query.code;

    try {
        const tokenResponse = await axios.post(
            'https://github.com/login/oauth/access_token',
            {
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                code: code,
            },
            { headers: { Accept: 'application/json' } }
        );

        const accessToken = tokenResponse.data.access_token;
        res.status(200).json({ accessToken });
    } catch (error) {
        console.error('Error fetching access token:', error);
        res.status(500).send('Error during authentication');
    }
});

// FETCH ALL REPOSITORIES (both public & private)
app.get('/fetch-repos', async (req, res) => {
    const perPage = 10;
    const page = req.query.page || 1;
    try {
        const response = await axios.get('https://api.github.com/user/repos', {
            headers: {
                Authorization: `token ${req.headers.authorization}`,
            },
            params: {
                per_page: perPage,
                page,
            },
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching repositories:', error);
        res.status(500).json({ error: 'Failed to fetch repositories' });
    }
});

//FETCH USER DETAILS (Logged in user)
app.get('/user', async (req, res) => {
    try {
        const response = await axios.get('https://api.github.com/user', {
            headers: {
                Authorization: `token ${req.headers.authorization}`,
            },
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
});

//CREATE A NEW REPOSITORY
app.post('/create-repo', async (req, res) => {
    const { name, description, visibility, autoInit, allowForking } = req.body;

    if (!name || !visibility) {
        return res
            .status(400)
            .json({ error: 'Repository name and visibility are required' });
    }

    try {
        const response = await axios.post(
            'https://api.github.com/user/repos',
            {
                name: name,
                description: description || '',
                private: visibility === 'private',
                auto_init: autoInit || false,
                allow_forking: allowForking !== undefined ? allowForking : true,
            },
            {
                headers: {
                    Authorization: `token ${req.headers.authorization}`,
                },
            }
        );

        res.status(201).json({
            message: 'Repository created successfully',
            repo: response.data,
        });
    } catch (error) {
        console.error(
            'Error creating repository:',
            error.response?.data || error.message
        );
        res.status(500).json({
            error: 'Failed to create repository',
            details: error.response?.data,
        });
    }
});

//FETCH REPOSITORY DETAILS
app.get('/repo/:id', async (req, res) => {
    const repoId = req.params.id;

    try {
        const response = await axios.get(
            `https://api.github.com/repositories/${repoId}`,
            {
                headers: {
                    Authorization: `token ${req.headers.authorization}`, // Access token from headers
                },
            }
        );

        res.status(200).json(response.data);
    } catch (error) {
        console.error('Error fetching repository details:', error.message);
        res.status(500).json({
            message: 'Error fetching repository details',
            error: error.message,
        });
    }
});

//AI CODE REVIEW
app.post('/codeReview', async (req, res) => {
    const { codeSnippet } = req.body;

    try {
        const review = await runGemini(codeSnippet);
        res.status(200).json({ review });
    } catch (error) {
        console.error('Error during code review:', error);
        res.status(500).json({ error: 'Failed to review code snippet' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

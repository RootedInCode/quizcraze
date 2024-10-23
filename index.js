import express from 'express';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { body, validationResult } from 'express-validator';
import session from 'express-session';
import { connectDB, FormData, Quiz, MadeQuiz, UserDetails , QuizResult} from './database.js'; // Importing from database.js
import MongoStore from 'connect-mongo';

dotenv.config();

const app = express();
const port = 3000;

// Middleware to parse JSON and form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public")); // Serve static files
app.set('view engine', 'ejs'); // Set EJS as view engine
app.set('views', './views');
// app.use(session({
//     secret: process.env.SECRET_KEY,
//     resave: false,
//     saveUninitialized: true,
//     store: MongoStore.create({
//         mongoUrl: process.env.MONGO_URI, // Your MongoDB connection string
//         collectionName: 'sessions' // Optional: name of the collection to store sessions
//     }),
//     cookie: { secure: false } // Set to true if using HTTPS
// }));
app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Connect to MongoDB
connectDB();

// Logging Middleware
app.use((req, res, next) => {
    console.log('Session ID:', req.session.id);
    console.log('Session Data:', req.session);
    next();
});

// Routes
app.get('/', (req, res) => {
    res.render('login.ejs');
});

app.get('/signup', (req, res) => {
    res.render('signup.ejs');
});

// Password validation
const passwordValidation = (value) => {
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/; 
    if (!passwordRegex.test(value)) {
        throw new Error('Password must be at least 8 characters long, contain at least one uppercase letter and one number.');
    }
    return true;
};

//signup
// Sign up route
app.post('/signup', [
    // Validate email and username
    body('email')
        .isEmail().withMessage('Email must be a valid email format (e.g., abcd@xyz.com).'),
    body('name')
        .isString().withMessage('Must be a valid username.')
        .notEmpty().withMessage('Username is required.'),
    body('password').custom(passwordValidation)
], async (req, res) => {
    const errors = validationResult(req);

    // Check for validation errors
    if (!errors.isEmpty()) {
        return res.render('signup.ejs', {
            errorMessage: errors.array().map(error => error.msg).join(', '),
            email: req.body.email, // Pass email back to the view
            name: req.body.name     // Pass username back to the view
        });
    }

    try {
        // Check if the user already exists
        const existingUser = await FormData.findOne({ email: req.body.email });
        
        if (existingUser) {
            // If a user is found with the provided email
            return res.render('signup.ejs', {
                errorMessage: "Email is already registered.",
                email: req.body.email, // Pass email back to the view
                name: req.body.name     // Pass username back to the view
            });
        }

        // Create a new user
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const newUser = new FormData({
            email: req.body.email,
            name: req.body.name,
            password: hashedPassword,
        });

        await newUser.save();
        
        // Log in the user immediately after signup
        req.session.userId = newUser._id; // Store user ID in session

        // Render home.ejs after successful signup
        res.render('home.ejs', {
            name: newUser.name,   // Pass name to home.ejs
            email: newUser.email   // Pass email to home.ejs
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error processing signup request.');
    }
});

//login route
// Login route
app.post('/login', [
    // Validate email and username
    body('email')
        .isEmail().withMessage('Email must be a valid email format (e.g., abcd@xyz.com).'),
    body('name')
        .isString().withMessage('Must be a valid username.')
        .notEmpty().withMessage('Username is required.'),
], async (req, res) => {
    const errors = validationResult(req);

    // Check for validation errors
    if (!errors.isEmpty()) {
        return res.render('login.ejs', {
            errorMessage: errors.array().map(error => error.msg).join(', '),
            email: req.body.email, // Pass email back to the view
            name: req.body.name     // Pass username back to the view
        });
    }

    try {
        // Retrieve user by email
        const existingUser = await FormData.findOne({ email: req.body.email });
        
        if (!existingUser) {
            // If no user is found with the provided email
            return res.render('login.ejs', {
                errorMessage: "Email not registered.",
                email: req.body.email, // Pass email back to the view
                name: req.body.name     // Pass username back to the view
            });
        }

        // Compare the provided username with the existing username
        if (req.body.name !== existingUser.name) {
            return res.render('login.ejs', {
                errorMessage: "Wrong username.",
                email: req.body.email, // Pass email back to the view
                name: req.body.name     // Pass username back to the view
            });
        }

        // Compare the provided password with the hashed password
        const passwordMatch = await bcrypt.compare(req.body.password, existingUser.password);
        
        if (!passwordMatch) {
            // If the password does not match
            return res.render('login.ejs', {
                errorMessage: "Wrong password.",
                email: req.body.email, // Pass email back to the view
                name: req.body.name     // Pass username back to the view
            });
        }

        // Log in the user
        req.session.userId = existingUser._id; // Store user ID in session

        // Redirect to the profile page after successful login
        res.render('home.ejs');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error processing login request.');
    }
});





// Authentication middleware
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        return next();
    }
    res.redirect('/');
};

// // Profile route
// app.get('/profile', isAuthenticated, async (req, res) => {
//     try {
//         // Find the user by their session userId and populate their created quizzes
//         const user = await FormData.findById(req.session.userId).populate('quizIds').exec();

//         if (!user) {
//             return res.status(404).send("User not found.");
//         }

//         // Pass user data and the quizzes they created to the profile view
//         res.render('profile.ejs', { 
//             name: user.name, 
//             email: user.email,
//             quizzes: user.quizIds || [] // Ensure quizzes is always passed, even if empty
//         });
//     } catch (err) {
//         console.error(err);
//         res.status(500).send("An error occurred while retrieving user data.");
//     }
// });



// Quiz routes
app.get('/quiz', isAuthenticated, (req, res) => {
    res.render('quiz.ejs', { script: 'play-quiz.js' });
});

app.get('/makequiz', isAuthenticated, (req, res) => {
    res.render('makequiz.ejs');
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/profile');
        }
        res.redirect('/');
    });
});

// Quiz creation route
app.post('/makequiz', isAuthenticated, async (req, res) => {
    const questions = [];
    const questionCount = parseInt(req.body.numQuestions, 10); // Changed to match the form input

    for (let i = 1; i <= questionCount; i++) {
        const questionText = req.body[`question${i}`];
        const options = [
            req.body[`option${i}1`],
            req.body[`option${i}2`],
            req.body[`option${i}3`],
            req.body[`option${i}4`],
        ];
        const correctAnswer = parseInt(req.body[`correctAnswer${i}`]); // Ensure this is an integer

        questions.push({ question: questionText, options, correctAnswer });
    }

    try {
        const user = await FormData.findById(req.session.userId);
        if (!user) {
            return res.status(404).send("User not found.");
        }

        const quizTitle = req.body.quizTitle; // Assuming you have a quiz title input in your form
        const quiz = new Quiz({
            userId: req.session.userId,
            topic: quizTitle, // Use dynamic title
            questions: questions,
        });

        await quiz.save();
        user.quizIds.push(quiz._id);
        await user.save();

        let madeQuiz = await MadeQuiz.findOne({ email: user.email });
        if (!madeQuiz) {
            madeQuiz = new MadeQuiz({
                email: user.email,
                quizzes: [quiz._id],
            });
        } else {
            madeQuiz.quizzes.push(quiz._id);
        }
        await madeQuiz.save();

        res.render('home.ejs'); // Redirect after creation
    } catch (err) {
        console.error(err);
        res.status(500).send("An error occurred while creating the quiz.");
    }
});


app.get('/edit-profile', isAuthenticated, async (req, res) => {
    try {
        const user = await FormData.findById(req.session.userId);
        let userDetails = await UserDetails.findOne({ userId: user._id });

        // If no userDetails exist, create an empty entry
        if (!userDetails) {
            userDetails = new UserDetails({
                userId: user._id,
                email: user.email,
                about: "Add something about yourself."
            });
            await userDetails.save();
        }

        res.render('edit-profile.ejs', {
            email: userDetails.email,
            about: userDetails.about
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("An error occurred while retrieving user details.");
    }
});

app.get('/profile', isAuthenticated, async (req, res) => {
    try {
        const user = await FormData.findById(req.session.userId);
        const userDetails = await UserDetails.findOne({ userId: user._id });

        // Fetch quizzes the user has created
        const createdQuizzes = await Quiz.find({ userId: user._id });

        // Fetch quizzes the user has taken
        const quizResults = await QuizResult.find({ userId: user._id }).populate('quizId');

        res.render('profile.ejs', {
            name: user.name,
            email: user.email,
            about: userDetails ? userDetails.about : "This user hasn't added anything about themselves yet.",
            quizzes: createdQuizzes,
            solvedQuizzes: quizResults  // Pass solved quizzes and scores
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("An error occurred while retrieving your profile.");
    }
});
app.get('/quiz/retake/:quizId', isAuthenticated, async (req, res) => {
    const quizId = req.params.quizId;

    // Logic to allow the user to retake the quiz, e.g., reset their score or start a new attempt
    // Example: Check if the quiz can be retaken, if yes, redirect to the quiz page
    const quizResult = await QuizResult.findOne({ userId: req.session.userId, quizId });

    if (quizResult && quizResult.canRetake) {
        res.redirect(`/quiz/${quizId}`);
    } else {
        res.status(403).send("You cannot retake this quiz.");
    }
});



app.post('/edit-profile', isAuthenticated, async (req, res) => {
    const { about } = req.body;

    try {
        const user = await FormData.findById(req.session.userId);

        if (!user) {
            return res.status(404).send("User not found.");
        }

        // Update user details or create if not found
        const userDetails = await UserDetails.findOneAndUpdate(
            { userId: user._id },
            { about: about },
            { new: true, upsert: true } // Create if it doesn't exist
        );

        res.redirect('/profile');
    } catch (err) {
        console.error(err);
        res.status(500).send("An error occurred while updating your profile.");
    }
});

app.get('/quiz/:id', async (req, res) => {
    try {
        const quizId = req.params.id; // Extract quiz ID from the URL
        const quiz = await Quiz.findById(quizId); // Fetch quiz from the database using the ID

        if (!quiz) {
            return res.status(404).send('Quiz not found');
        }

        // Render a page to display the quiz, passing the quiz data
        res.render('view-quiz.ejs', { quiz });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});


// Start the server
app.listen(port, () => {
    console.log('Server running on port', port);
});
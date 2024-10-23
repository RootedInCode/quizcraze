import mongoose from 'mongoose';

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1); // Exit process with failure
    }
};

// Define schemas and models
const FormDataSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    madeQuiz: { type: Boolean, default: false }, // Track if the user has made a quiz
    quizIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }] // Array of quiz IDs
});


const quizSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'FormData', required: true }, // Changed from 'User' to 'FormData'
    topic: { type: String, required: true },
    questions: [
        {
            question: { type: String, required: true },
            options: [{ type: String, required: true }],
            correctAnswer: { type: String, required: true },
        }
    ],
    createdAt: { type: Date, default: Date.now },
});

const madeQuizSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    quizzes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }], // Array of quiz IDs
});

const userDetailsSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'FormData', required: true },
    email: { type: String, required: true, unique: true },
    about: { type: String }
});
const quizResultSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'FormData', required: true },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    score: { type: Number, required: true },
    canRetake: { type: Boolean, default: true },
    takenAt: { type: Date, default: Date.now },
});

const QuizResult = mongoose.model('QuizResult', quizResultSchema);

const FormData = mongoose.model('FormData', FormDataSchema);
const Quiz = mongoose.model('Quiz', quizSchema); // Create Quiz model
const MadeQuiz = mongoose.model('MadeQuiz', madeQuizSchema);
const UserDetails = mongoose.model('UserDetails', userDetailsSchema);

// Export connection and models
export { connectDB, FormData, Quiz, MadeQuiz, UserDetails , QuizResult};
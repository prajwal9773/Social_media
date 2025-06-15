const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");
const path = require("path");
const YAML = require("yamljs");
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = YAML.load('./swagger.yaml');
const cron = require('node-cron');
const { publishDueScheduledPosts } = require('./jobs/publish_scheduled_posts');

// Load environment variables
const envPath = path.join(__dirname, "../.env");
dotenv.config({ path: envPath });

// Validate required environment variables
const requiredEnvVars = [
    "PORT",
    "DB_HOST",
    "DB_PORT",
    "DB_NAME",
    "DB_USER",
    "DB_PASSWORD",
    "JWT_SECRET",
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
    console.error("Missing required environment variables:", missingEnvVars);
    process.exit(1);
}

const logger = require("./utils/logger");
const { connectDB } = require("./utils/database");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const postRoutes = require("./routes/posts");
const likeRoutes = require("./routes/likes");
const commentRoutes = require("./routes/comments");
const scheduledPostRoutes = require("./routes/scheduled_posts");


/**
 * Express application setup and configuration
 */
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database connection
connectDB()
    .then(() => {
        logger.verbose("Connected to PostgreSQL database");
        
        // Security middleware
        app.use(helmet());
        app.use(cors());
        
        // Body parsing middleware
        app.use(express.json({ limit: "10mb" }));
        app.use(express.urlencoded({ extended: true, limit: "10mb" }));
        
        // API routes
        app.use("/api/auth", authRoutes);
        app.use("/api/users", userRoutes);
        app.use("/api/posts", postRoutes);
        app.use("/api/likes", likeRoutes);
        app.use("/api/comments", commentRoutes);
        app.use("/api/scheduled-posts", scheduledPostRoutes);
        
        // Health check endpoint
        app.get("/health", (req, res) => {
            res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
        });
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
        
        // Global error handler
        app.use((err, req, res, next) => {
            logger.critical("Unhandled error:", err);
            res.status(500).json({
                error: "Internal server error",
                ...(process.env.NODE_ENV === "development" && { details: err.message }),
            });
        });
        
        // 404 handler
        app.use("*", (req, res) => {
            res.status(404).json({ error: "Route not found" });
        });

        // Schedule job to check for due posts every minute
        cron.schedule('* * * * *', publishDueScheduledPosts);

        // Start server
        app.listen(PORT, () => {
            logger.verbose(`Server is running on port ${PORT}`);
            logger.verbose(`Environment: ${process.env.NODE_ENV || "development"}`);
        });
    })
    .catch((error) => {
        logger.critical("Database connection failed:", error);
        process.exit(1);
    });

module.exports = app;
